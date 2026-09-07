"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  MEETINGS,
  MODES,

  formatLongDate,
  formatShortDate,
  meetingById,
  modeById,
  pluralMeetings,
  pluralMeetingsAcc,
  sortDialogs,
  type Dialog,
  type FileAttachment,
  type Message,
  type Mode,
  type Suggestion,
  type Thumb,
} from "./data";
import { Ic } from "./icons";
import { composerShadow, easeOut, focusRingClass, gcAsset, popoverShadow, pressableClass, sfAsset, shadow, tokens } from "./tokens";
import { Popover, Tip, useOutsideClose } from "./ui";
import { EMPTY_FILTERS, FilterPopover, filterChatMeetings, hasActiveFilters, type FilterState, type FilterTab } from "./meeting-filters";
import type { Generation } from "./use-dialogs";

// ─────────────────────────────────────────────────────────────────────────────
// Миниатюры встреч
// ─────────────────────────────────────────────────────────────────────────────

const THUMB_SRC: Record<Thumb, string | null> = {
  photo1: "audio1.png",
  photo2: "audio2.png",
  photo3: "audio3.png",
  people: "property2.png",
  legacy: null,
};

export function MeetingThumb({
  thumb,
  width,
  height,
  radius = 4,
  className = "",
  plain,
}: {
  thumb: Thumb;
  width: number;
  height: number;
  radius?: number;
  className?: string;
  /** без затемнения и иконки — для крошечных плашек в стеке */
  plain?: boolean;
}) {
  const src = THUMB_SRC[thumb];
  if (!src) {
    // Встреча без видео — серая плашка с иконкой встреч (как «legacy» в макете)
    return (
      <span
        className={`flex shrink-0 items-center justify-center ${plain ? "" : "border"} ${className}`}
        style={{ width, height, borderRadius: radius, backgroundColor: plain ? tokens.borderStrong : tokens.bgSubtle, borderColor: tokens.border, color: tokens.grey }}
      >
        {!plain && <Ic name="fig-meetings" size={Math.max(8, Math.round(height * 0.42))} />}
      </span>
    );
  }
  return (
    <span className={`relative block shrink-0 overflow-hidden ${className}`} style={{ width, height, borderRadius: radius }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={sfAsset(src)} alt="" className="absolute inset-0 h-full w-full object-cover" />
      {!plain && <span className="absolute inset-0" style={{ backgroundColor: "rgba(0,0,0,0.08)" }} />}
    </span>
  );
}

/**
 * Стек миниатюр в кнопке «N встреч» — по ноде 45837:10324: плашки 26×16 с белой рамкой 1.5px
 * и радиусом 2 в ряд, каждая следующая наезжает на предыдущую на 16px (видно по 10px),
 * последняя — целиком: либо третья встреча, либо серая плашка «+N».
 */
export function ThumbStack({ ids }: { ids: string[] }) {
  const shown = ids.length <= 3 ? ids : ids.slice(0, 2);
  const extra = ids.length - shown.length;
  // Каждая следующая плашка выше предыдущей — иначе позиционированная миниатюра всплывает над «+N»
  // Плашка 26×16, обводка 1.5px — внешняя (тень), цвет фона кнопки: белая в покое, grey-20 на ховере
  const tileClass = `relative flex h-[16px] w-[26px] shrink-0 items-center justify-center overflow-hidden rounded-[2px] shadow-[0_0_0_1.5px_#FFFFFF] group-hover/tool:shadow-[0_0_0_1.5px_#F7F7F8] transition-shadow duration-[120ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none`;
  return (
    <span className="isolate flex items-center">
      {shown.map((id, i) => (
        <span key={id} className={`${tileClass} ${i < shown.length - 1 || extra > 0 ? "mr-[-16px]" : ""}`} style={{ zIndex: i + 1 }}>
          <MeetingThumb thumb={meetingById(id)?.thumb ?? "legacy"} width={26} height={16} radius={2} plain />
        </span>
      ))}
      {extra > 0 && (
        <span className={`${tileClass} bg-[#F3F3F3]`} style={{ zIndex: shown.length + 1 }}>
          <span className="text-[10px] font-medium leading-[normal] tracking-[-0.3px]" style={{ color: tokens.placeholder, fontFeatureSettings: '"tnum" 1' }}>
            +{extra}
          </span>
        </span>
      )}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Стартовая: заголовок
// ─────────────────────────────────────────────────────────────────────────────

export function HomeTitle({ mode }: { mode: Mode }) {
  const m = modeById(mode);
  return (
    <div key={mode} className="gc-fade-in flex items-center gap-[8px]">
      <span style={{ color: m.color }}>
        <Ic name={mode === "kb" ? "fig-globe" : m.icon} size={20} />
      </span>
      <h1 className="whitespace-nowrap text-center text-[24px] font-medium leading-[normal] tracking-[-0.48px]" style={{ color: tokens.black }}>
        <span style={{ color: m.color }}>Салют!</span> {m.title}
      </h1>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Композер
// ─────────────────────────────────────────────────────────────────────────────

export type ComposerState = { text: string; mode: Mode; meetingIds: string[]; files: FileAttachment[] };

/** Кнопка тулбара композера: 32px, рамка grey-40, радиус 4 */
function ToolButton({
  children,
  onClick,
  label,
  active,
  square,
  ariaExpanded,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  label?: string;
  active?: boolean;
  square?: boolean;
  ariaExpanded?: boolean;
  className?: string;
}) {
  const btn = (
    <button
      type="button"
      aria-label={label}
      aria-expanded={ariaExpanded}
      onClick={onClick}
      className={`group/tool flex h-[32px] shrink-0 items-center justify-center gap-[6px] rounded-[4px] border bg-white hover:bg-[#F7F7F8] ${square ? "w-[32px]" : "px-[8px]"} ${pressableClass} ${focusRingClass} ${className}`}
      style={{ borderColor: tokens.border, backgroundColor: active ? tokens.bgSubtle : undefined }}
    >
      {children}
    </button>
  );
  return label && square ? (
    <Tip text={label} placement="top">
      {btn}
    </Tip>
  ) : (
    btn
  );
}

/** Дропдаун режима: 290px, строки с плашкой-иконкой 36px, галочка у выбранного */
export function ModeMenu({ mode, onChange, direction = "down" }: { mode: Mode; onChange: (m: Mode) => void; direction?: "down" | "up" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useOutsideClose([ref], open, close);
  const m = modeById(mode);
  return (
    <div ref={ref} className="relative">
      <ToolButton onClick={() => setOpen((v) => !v)} active={open} ariaExpanded={open} label="Режим ответа">
        <span key={m.id} className="gc-fade-in flex items-center gap-[6px]">
          <span className="flex" style={{ color: m.color }}>
            <Ic name={m.icon} />
          </span>
          <span className="text-[12px] leading-[normal] tracking-[-0.24px]" style={{ color: tokens.black }}>
            {m.label}
          </span>
        </span>
        <span
          className={`transition-transform duration-[180ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
          style={{ color: tokens.grey }}
        >
          <Ic name="chevron-down" />
        </span>
      </ToolButton>
      <Popover
        open={open}
        direction={direction}
        padding={4}
        style={{ boxShadow: popoverShadow }}
        className={`left-0 w-[290px] ${direction === "down" ? "top-[calc(100%+6px)]" : "bottom-[calc(100%+6px)]"}`}
      >
        <div role="menu" className="flex flex-col">
          {MODES.map((x) => {
            const selected = x.id === mode;
            return (
              <button
                key={x.id}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                onClick={() => {
                  onChange(x.id);
                  setOpen(false);
                }}
                className={`group/mode flex w-full items-center gap-[12px] rounded-[4px] p-[8px] text-left hover:bg-[#FAFAFA] ${pressableClass} ${focusRingClass}`}
                style={{ ["--mode-color" as string]: x.color }}
              >
                <span
                  className={`flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-[4px] text-(--mode-rest) group-hover/mode:text-(--mode-color) ${pressableClass}`}
                  style={{ backgroundColor: tokens.bgSubtle, ["--mode-rest" as string]: selected ? x.color : tokens.grey }}
                >
                  <Ic name={x.icon} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
                  <span className="text-[13px] font-medium leading-[normal] tracking-[-0.13px]" style={{ color: tokens.black }}>
                    {x.label}
                  </span>
                  <span className="text-[12px] leading-[normal] tracking-[-0.24px]" style={{ color: tokens.grey }}>
                    {x.description}
                  </span>
                </span>
                {selected && (
                  <span className="flex h-[24px] w-[24px] shrink-0 items-center justify-center" style={{ color: tokens.grey }}>
                    <Ic name="fig-check" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </Popover>
    </div>
  );
}

/** Чип файла внутри композера (по макету: плашка grey-20, красная иконка PDF) */
export function FileChip({ file, onRemove }: { file: FileAttachment; onRemove?: () => void }) {
  return (
    <div className="gc-enter group/file relative flex h-[48px] items-center gap-[8px] rounded-[4px] p-[8px]" style={{ backgroundColor: tokens.bgSubtle }}>
      <span className="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-[4px] text-white" style={{ backgroundColor: tokens.red }}>
        <Ic name="document-text" size={14} />
      </span>
      <span className="flex w-[180px] flex-col gap-[2px]">
        <span className="truncate text-[13px] font-medium leading-[normal] tracking-[-0.13px]" style={{ color: tokens.black }}>
          {file.name}
        </span>
        <span className="flex items-center gap-[4px] text-[12px] leading-[normal] tracking-[-0.24px]" style={{ color: tokens.grey }}>
          {file.ext}
          <span className="h-[3px] w-[3px] rounded-full" style={{ backgroundColor: tokens.grey }} />
          {file.size}
        </span>
      </span>
      {onRemove && (
        <button
          type="button"
          aria-label="Убрать файл"
          onClick={onRemove}
          className={`absolute -right-[6px] -top-[6px] flex h-[16px] w-[16px] items-center justify-center rounded-full border bg-white opacity-0 group-hover/file:opacity-100 focus-visible:opacity-100 ${pressableClass} ${focusRingClass}`}
          style={{ borderColor: tokens.border, color: tokens.grey }}
        >
          <Ic name="x-mark" size={10} />
        </button>
      )}
    </div>
  );
}

export function Composer({
  state,
  onChange,
  onSend,
  onOpenMeetings,
  onAddFile,
  onRemoveFile,
  contextIds,
  disabled,
  autoFocus,
  textareaRef,
  menuDirection = "down",
}: {
  state: ComposerState;
  onChange: (patch: Partial<ComposerState>) => void;
  onSend: () => void;
  onOpenMeetings: () => void;
  onAddFile: () => void;
  onRemoveFile: (id: string) => void;
  /** встречи, уже лежащие в контексте диалога (показываем в кнопке вместе с новыми) */
  contextIds?: string[];
  disabled?: boolean;
  autoFocus?: boolean;
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
  menuDirection?: "down" | "up";
}) {
  const innerRef = useRef<HTMLTextAreaElement>(null);
  const ref = textareaRef ?? innerRef;
  const canSend = state.text.trim().length > 0 && !disabled;
  const allMeetings = useMemo(() => Array.from(new Set([...(contextIds ?? []), ...state.meetingIds])), [contextIds, state.meetingIds]);

  return (
    <div
      className="flex w-full flex-col gap-[12px] rounded-[4px] border bg-white p-[12px]"
      style={{ borderColor: tokens.border, boxShadow: composerShadow }}
      onClick={() => ref.current?.focus()}
    >
      {state.files.length > 0 && (
        <div className="flex flex-wrap gap-[8px]">
          {state.files.map((f) => (
            <FileChip key={f.id} file={f} onRemove={() => onRemoveFile(f.id)} />
          ))}
        </div>
      )}
      <div className="px-[4px] pt-[4px]">
        <textarea
          ref={ref}
          value={state.text}
          autoFocus={autoFocus}
          rows={3}
          placeholder="Спроси че хочешь..."
          onChange={(e) => onChange({ text: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              if (canSend) onSend();
            }
          }}
          className="gc-scroll block h-[48px] w-full resize-none bg-transparent text-[13px] leading-[16px] tracking-[-0.13px] outline-none placeholder:text-[#BABBBD]"
          style={{ color: tokens.black, caretColor: tokens.black }}
        />
      </div>
      <div className="flex items-end justify-between">
        <div className="flex items-center gap-[8px]">
          <ToolButton square label="Прикрепить файл" onClick={onAddFile}>
            <span style={{ color: tokens.grey }}>
              <Ic name="fig-paperclip" />
            </span>
          </ToolButton>
          <ToolButton onClick={onOpenMeetings} label="Добавить встречи">
            {allMeetings.length === 0 ? (
              <>
                <span style={{ color: tokens.grey }}>
                  <Ic name="fig-plus" />
                </span>
                <span className="text-[12px] leading-[normal] tracking-[-0.24px]" style={{ color: tokens.black }}>
                  Встречи
                </span>
              </>
            ) : (
              <span key="stack" className="gc-enter flex items-center gap-[6px]">
                <ThumbStack ids={allMeetings} />
                <span className="text-[12px] leading-[normal] tracking-[-0.24px]" style={{ color: tokens.black }}>
                  {pluralMeetings(allMeetings.length)}
                </span>
                <span className="flex" style={{ color: tokens.grey }}>
                  <Ic name="chevron-down" />
                </span>
              </span>
            )}
          </ToolButton>
        </div>
        <div className="flex items-center gap-[8px]">
          <ModeMenu mode={state.mode} onChange={(mode) => onChange({ mode })} direction={menuDirection} />
          <Tip text="Отправить · Enter" placement="top" disabled={!canSend}>
            <button
              type="button"
              aria-label="Отправить"
              disabled={!canSend}
              onClick={onSend}
              className={`group/send relative flex h-[32px] w-[32px] shrink-0 items-center justify-center overflow-hidden rounded-[4px] disabled:cursor-not-allowed ${pressableClass} ${focusRingClass}`}
              style={{ backgroundColor: canSend ? tokens.blue : tokens.bgSubtle, color: canSend ? "#FFFFFF" : tokens.greyDisabled }}
            >
              {/* Заливка активной кнопки — картинка + синий оверлей 60%, как у «Добавить встречу».
                  Слои всегда в DOM и проявляются кроссфейдом, а не появляются рывком */}
              <span className="absolute inset-0 transition-opacity duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none" style={{ opacity: canSend ? 1 : 0 }} aria-hidden="true">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={gcAsset("send-bg.png")} alt="" className="absolute inset-0 h-full w-full object-cover" />
                <span className={`absolute inset-0 group-hover/send:bg-[rgba(0,44,156,0.6)] ${pressableClass}`} style={{ backgroundColor: "rgba(1,56,199,0.6)" }} />
              </span>
              <span className={`relative ${pressableClass}`}>
                <Ic name="fig-arrow-up" />
              </span>
            </button>
          </Tip>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Стартовая: подсказки, список базы знаний, предыдущие чаты
// ─────────────────────────────────────────────────────────────────────────────

export function SuggestionCards({ items, onPick }: { items: Suggestion[]; onPick: (s: Suggestion) => void }) {
  return (
    <div className="flex w-full items-start gap-[12px] px-[12px]">
      {items.map((s, i) => {
        const m = modeById(s.mode);
        return (
          <button
            key={s.text}
            type="button"
            onClick={() => onPick(s)}
            className={`gc-fade-in-up flex min-w-0 flex-1 flex-col items-start gap-[16px] rounded-[4px] border bg-white p-[16px] text-left hover:bg-[#FAFAFA] ${pressableClass} ${focusRingClass}`}
            style={{ borderColor: tokens.border, animationDelay: `${i * 40}ms` }}
          >
            <span style={{ color: m.color }}>
              <Ic name={m.icon} />
            </span>
            <span className="text-[13px] leading-[18px] tracking-[-0.13px]" style={{ color: tokens.black }}>
              {s.text}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Подсказки строками с разделителями и стрелкой — для всех режимов, кроме «Авто» */
export function SuggestionList({ items, onPick }: { items: Suggestion[]; onPick: (s: Suggestion) => void }) {
  return (
    <div className="gc-fade-in flex w-full flex-col px-[12px]">
      {items.map((s, i) => (
        <div key={s.text} className="flex w-full flex-col">
          {i > 0 && <div className="h-px w-full" style={{ backgroundColor: tokens.border }} />}
          <button
            type="button"
            onClick={() => onPick(s)}
            className={`group flex w-full items-center justify-between gap-[8px] rounded-[2px] px-[4px] py-[12px] text-left hover:bg-[#FAFAFA] ${pressableClass} ${focusRingClass}`}
          >
            <span className="min-w-0 flex-1 text-[13px] leading-[normal] tracking-[-0.13px]" style={{ color: tokens.black }}>
              {s.text}
            </span>
            <span className="flex h-[16px] w-[16px] shrink-0 items-center justify-center rotate-90 text-[#818AA3] group-hover:text-[#585E6C]">
              <Ic name="fig-arrow-out" />
            </span>
          </button>
        </div>
      ))}
    </div>
  );
}

export type DialogRowActions = {
  onPin: (id: string) => void;
  onRename: (id: string) => void;
  onDelete: (id: string) => void;
};

/** Меню «…» строки диалога — как в шапке: 160px, Закрепить/Открепить · Переименовать · Удалить */
function DialogRowMenu({ dialog, actions }: { dialog: Dialog; actions: DialogRowActions }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useOutsideClose([ref], open, close);
  const run = (fn: (id: string) => void) => () => {
    setOpen(false);
    fn(dialog.id);
  };
  const row = (icon: "fig-pin" | "fig-pencil" | "fig-trash", label: string, onClick: () => void, danger?: boolean) => (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`flex w-full items-center gap-[6px] rounded-[2px] px-[6px] py-[8px] text-left hover:bg-[#F7F7F8] ${pressableClass} ${focusRingClass}`}
      style={{ color: danger ? tokens.red : tokens.black }}
    >
      <span className="flex" style={{ color: danger ? tokens.red : tokens.grey }}>
        <Ic name={icon} />
      </span>
      <span className="text-[13px] leading-[normal] tracking-[-0.13px]">{label}</span>
    </button>
  );
  return (
    <div ref={ref} className={`absolute right-[6px] top-1/2 -translate-y-1/2 ${open ? "" : "opacity-0 group-hover/row:opacity-100 focus-within:opacity-100"}`} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        aria-label="Действия"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`flex h-[24px] w-[24px] items-center justify-center rounded-[3px] hover:bg-[#EFEFEF] ${open ? "bg-[#EFEFEF]" : ""} ${pressableClass} ${focusRingClass}`}
        style={{ color: tokens.grey }}
      >
        <Ic name="fig-ellipsis" />
      </button>
      <Popover open={open} direction="down" padding={4} style={{ boxShadow: shadow }} className="right-0 top-[calc(100%+4px)] w-[160px]">
        <div role="menu" className="flex flex-col">
          {row("fig-pin", dialog.pinned ? "Открепить" : "Закрепить", run(actions.onPin))}
          {row("fig-pencil", "Переименовать", run(actions.onRename))}
          {row("fig-trash", "Удалить", run(actions.onDelete), true)}
        </div>
      </Popover>
    </div>
  );
}

export function PreviousChats({
  dialogs,
  expanded,
  onToggle,
  onOpen,
  actions,
  renamingId,
  onCommitRename,
  onCancelRename,
}: {
  dialogs: Dialog[];
  expanded: boolean;
  onToggle: () => void;
  onOpen: (id: string) => void;
  actions: DialogRowActions;
  renamingId: string | null;
  onCommitRename: (id: string, title: string) => void;
  onCancelRename: () => void;
}) {
  const sorted = sortDialogs(dialogs);
  const shown = expanded ? sorted : sorted.slice(0, 3);
  return (
    <div className="flex w-full flex-col gap-[12px]">
      <div className="flex items-center justify-between">
        <span className="text-[13px] leading-[normal] tracking-[-0.13px]" style={{ color: tokens.grey }}>
          Предыдущие чаты
        </span>
        {sorted.length > 3 && (
          <button
            type="button"
            onClick={onToggle}
            className={`rounded-[2px] text-[13px] leading-[normal] tracking-[-0.13px] text-[#818AA3] hover:text-[#212833] ${pressableClass} ${focusRingClass}`}
          >
            {expanded ? "Свернуть" : "Показать все"}
          </button>
        )}
      </div>
      <div className="flex w-full flex-col">
        {shown.map((d, i) => {
          const renaming = renamingId === d.id;
          return (
            <div key={d.id} className={`group/row relative flex w-full items-center rounded-[2px] hover:bg-[#F7F7F8] hover:z-10 focus-within:z-10 ${pressableClass} gc-fade-in-up gc-no-fill`} style={{ animationDelay: `${Math.min(i, 6) * 30}ms` }}>
              {renaming ? (
                <div className="flex w-full items-center gap-[6px] px-[6px] py-[6px]">
                  <span className="shrink-0" style={{ color: tokens.grey }}>
                    <Ic name={d.pinned ? "fig-pin" : "fig-chat"} />
                  </span>
                  <RenameInput title={d.title} onCommit={(t) => onCommitRename(d.id, t)} onCancel={onCancelRename} />
                </div>
              ) : (
                <>
                  <button type="button" onClick={() => onOpen(d.id)} className={`flex min-w-0 flex-1 items-center gap-[6px] rounded-[2px] px-[6px] py-[8px] text-left ${focusRingClass}`}>
                    <span className="shrink-0" style={{ color: tokens.grey }}>
                      <Ic name={d.pinned ? "fig-pin" : "fig-chat"} />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13px] leading-[normal] tracking-[-0.13px]" style={{ color: tokens.black }}>
                      {d.title}
                    </span>
                    {/* На ховере дата уступает место «…» */}
                    <span className="shrink-0 text-[12px] leading-[normal] tracking-[-0.24px] group-hover/row:opacity-0" style={{ color: tokens.greyDisabled }}>
                      {formatShortDate(d.updatedAt)}
                    </span>
                  </button>
                  <DialogRowMenu dialog={d} actions={actions} />
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Модалка «Добавление встреч»
// ─────────────────────────────────────────────────────────────────────────────

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <span
      className={`flex h-[16px] w-[16px] shrink-0 items-center justify-center rounded-[2px] border ${pressableClass}`}
      style={{ borderColor: checked ? tokens.blue : tokens.borderStrong, backgroundColor: checked ? tokens.blue : "#FFFFFF" }}
    >
      {checked && (
        <span className="text-white">
          <Ic name="fig-check" size={12} />
        </span>
      )}
    </span>
  );
}

export function MeetingsModal({
  open,
  initial,
  onClose,
  onApply,
}: {
  open: boolean;
  initial: string[];
  onClose: () => void;
  onApply: (ids: string[]) => void;
}) {
  return <AnimatePresence>{open && <MeetingsModalInner key="meetings-modal" initial={initial} onClose={onClose} onApply={onApply} />}</AnimatePresence>;
}

function MeetingsModalInner({ initial, onClose, onApply }: { initial: string[]; onClose: () => void; onApply: (ids: string[]) => void }) {
  const [selected, setSelected] = useState<string[]>(initial);
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterTab, setFilterTab] = useState<FilterTab | null>(null);
  const [focused, setFocused] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const filterTriggerRef = useRef<HTMLButtonElement>(null);
  const filterPanelRef = useRef<HTMLDivElement>(null);

  // Клик вне модалки закрывает ее; Escape и клик вне меню фильтров — сначала только меню
  useOutsideClose(
    [panelRef],
    true,
    useCallback(() => {
      if (filterOpen) {
        setFilterOpen(false);
        setFilterTab(null);
      } else onClose();
    }, [filterOpen, onClose]),
  );
  useOutsideClose(
    [filterPanelRef, filterTriggerRef],
    filterOpen,
    useCallback(() => {
      setFilterOpen(false);
      setFilterTab(null);
    }, []),
  );

  const list = filterChatMeetings(MEETINGS, filters);
  const filtersActive = hasActiveFilters(filters);
  const toggle = (id: string) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const reduce = useReducedMotion();
  return createPortal(
    <motion.div
      className="fixed inset-0 z-[90] flex items-center justify-center"
      style={{ backgroundColor: tokens.backdrop }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.15, ease: easeOut } }}
      transition={{ duration: 0.2, ease: easeOut }}
      role="dialog"
      aria-modal
      aria-label="Добавление встреч"
    >
      <motion.div
        ref={panelRef}
        className="flex h-[597px] max-h-[calc(100vh-48px)] w-[600px] flex-col rounded-[4px] bg-white"
        style={{ boxShadow: shadow }}
        // Модалка не привязана к триггеру — растет из центра, а не из кнопки
        initial={reduce ? { opacity: 0 } : { opacity: 0, transform: "scale(0.97)" }}
        animate={reduce ? { opacity: 1 } : { opacity: 1, transform: "scale(1)" }}
        exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, transform: "scale(0.98)", transition: { duration: 0.15, ease: easeOut } }}
        transition={{ duration: 0.22, ease: easeOut }}
      >
        {/* Шапка */}
        <div className="flex shrink-0 items-center justify-between rounded-t-[4px] border-b p-[16px]" style={{ borderColor: tokens.border }}>
          <div className="flex items-center gap-[8px]">
            <span className="flex" style={{ color: tokens.grey }}>
              <Ic name="fig-meetings" />
            </span>
            <span className="text-[14px] leading-[1.35] tracking-[-0.28px]" style={{ color: tokens.black }}>
              Добавление встреч
            </span>
          </div>
          <button
            type="button"
            aria-label="Закрыть"
            onClick={onClose}
            className={`flex h-[16px] w-[16px] items-center justify-center rounded-full hover:bg-[#EFEFEF] ${pressableClass} ${focusRingClass}`}
            style={{ backgroundColor: tokens.bgSubtle, color: tokens.grey }}
          >
            <Ic name="x-mark" size={10} />
          </button>
        </div>

        {/* Фильтры + поиск (из прототипа «Поиск и фильтры») + список */}
        <div className="flex min-h-0 flex-1 flex-col gap-[8px] p-[16px]">
          <div className="flex h-[36px] shrink-0 items-center gap-[8px]">
            <div className="relative shrink-0">
              <button
                ref={filterTriggerRef}
                type="button"
                aria-label="Фильтры"
                aria-expanded={filterOpen}
                onClick={() => {
                  if (filterOpen) setFilterTab(null);
                  setFilterOpen((v) => !v);
                }}
                className={`flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-[4px] border hover:bg-[#F7F7F8] ${filterOpen ? "bg-[#F7F7F8]" : "bg-white"} ${pressableClass} ${focusRingClass}`}
                style={{ borderColor: tokens.border }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={sfAsset(filtersActive ? "icon-filter-active.svg" : "icon-filter.svg")} alt="" className="h-[16px] w-[16px] max-w-none shrink-0" />
              </button>
              {filterOpen && (
                <FilterPopover
                  containerRef={filterPanelRef}
                  filters={filters}
                  activeTab={filterTab}
                  anchor="left"
                  onPickTab={setFilterTab}
                  onLeaveTabs={() => setFilterTab(null)}
                  onChange={setFilters}
                  onClear={() => {
                    setFilters((f) => ({ ...f, sources: [], authorIds: [], dateFrom: null, dateTo: null }));
                    setFilterTab(null);
                  }}
                  onClose={() => {
                    setFilterOpen(false);
                    setFilterTab(null);
                  }}
                />
              )}
            </div>
            <div
              className={`flex h-[36px] min-w-0 flex-1 items-center gap-[10px] rounded-[4px] border bg-white px-[10px] ${pressableClass}`}
              style={{ borderColor: focused ? tokens.blue : tokens.border }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={sfAsset("icon-search.svg")} alt="" className="h-[16px] w-[16px] max-w-none shrink-0" />
              <input
                autoFocus
                value={filters.query}
                onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="Поиск по названию встречи"
                className="min-w-0 flex-1 bg-transparent text-[13px] leading-[normal] tracking-[-0.13px] outline-none placeholder:text-[#C7C8CA]"
                style={{ color: tokens.black, caretColor: tokens.black }}
              />
              {filters.query && (
                <button
                  type="button"
                  aria-label="Очистить поиск"
                  onClick={() => setFilters((f) => ({ ...f, query: "" }))}
                  className={`flex h-[16px] w-[16px] shrink-0 items-center justify-center rounded-full hover:bg-[#EFEFEF] ${pressableClass} ${focusRingClass}`}
                  style={{ backgroundColor: tokens.bgSubtle, color: tokens.grey }}
                >
                  <Ic name="x-mark" size={10} />
                </button>
              )}
            </div>
          </div>
          <div className="gc-scroll flex min-h-0 flex-1 flex-col overflow-y-auto">
            {list.length === 0 && (
              <div className="flex flex-1 flex-col items-center justify-center gap-[4px] text-[13px] tracking-[-0.13px]" style={{ color: tokens.grey }}>
                <span>Ничего не нашли</span>
                {filtersActive && (
                  <button type="button" onClick={() => setFilters((f) => ({ ...f, sources: [], authorIds: [], dateFrom: null, dateTo: null }))} className="text-[12px] tracking-[-0.24px] underline" style={{ color: tokens.blue }}>
                    Сбросить фильтры
                  </button>
                )}
              </div>
            )}
            {list.map((m) => {
              const on = selected.includes(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  role="option"
                  aria-selected={on}
                  onClick={() => toggle(m.id)}
                  className={`flex h-[72px] w-full items-center gap-[12px] rounded-[4px] py-[12px] pr-[12px] text-left hover:bg-[#FAFAFA] ${pressableClass} ${focusRingClass}`}
                >
                  <MeetingThumb thumb={m.thumb} width={80} height={48} />
                  <span className="flex min-w-0 flex-1 flex-col gap-[4px]">
                    <span className="truncate text-[13px] font-medium leading-[normal] tracking-[-0.13px]" style={{ color: tokens.black }}>
                      {m.title}
                    </span>
                    <span className="flex items-center gap-[4px] text-[12px] leading-[normal] tracking-[-0.24px]" style={{ color: tokens.grey, fontFeatureSettings: '"lnum" 1, "tnum" 1' }}>
                      {m.time}
                      <span className="h-[3px] w-[3px] rounded-full" style={{ backgroundColor: tokens.grey }} />
                      {m.durationMin} мин
                    </span>
                  </span>
                  <Checkbox checked={on} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Футер: кнопка активна только когда что-то выбрано */}
        <div className="flex shrink-0 items-center justify-end rounded-b-[4px] border-t p-[16px]" style={{ backgroundColor: tokens.bgSubtle, borderColor: tokens.border }}>
          <button
            type="button"
            disabled={selected.length === 0}
            onClick={() => onApply(selected)}
            className={`flex h-[36px] items-center justify-center rounded-[4px] bg-[#0138C7] px-[12px] text-[13px] font-medium leading-[normal] tracking-[-0.13px] text-white hover:bg-[#0032B1] disabled:cursor-not-allowed disabled:bg-[#809BE3] disabled:hover:bg-[#809BE3] ${pressableClass} ${focusRingClass}`}
          >
            {selected.length === 0 ? "Добавить" : `Добавить ${pluralMeetingsAcc(selected.length)}`}
          </button>
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Шапка диалога: «Чат / Название ▾» + Поделиться | 🔗 + пин + «…»
// ─────────────────────────────────────────────────────────────────────────────

function HeaderIconButton({ icon, label, onClick, active, ariaExpanded }: { icon: "fig-pin" | "fig-ellipsis"; label: string; onClick: () => void; active?: boolean; ariaExpanded?: boolean }) {
  return (
    <Tip text={label} placement="bottom">
      <button
        type="button"
        aria-label={label}
        aria-pressed={icon === "fig-pin" ? active : undefined}
        aria-expanded={ariaExpanded}
        onClick={onClick}
        className={`flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-[4px] border hover:bg-[#F7F7F8] ${pressableClass} ${focusRingClass}`}
        style={{ borderColor: tokens.border, backgroundColor: active ? tokens.bgSubtle : undefined, color: active ? tokens.black : tokens.grey }}
      >
        <Ic name={icon} />
      </button>
    </Tip>
  );
}

function SharePopoverPanel({ onCopied }: { onCopied: () => void }) {
  const [enabled, setEnabled] = useState(true);
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const copy = () => {
    setCopied(true);
    onCopied();
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="flex w-full flex-col overflow-hidden rounded-[4px] bg-white">
      <div className="flex items-center gap-[8px] p-[16px]">
        <span style={{ color: tokens.grey }}>
          <Ic name="fig-share" />
        </span>
        <span className="text-[14px] font-medium leading-[1.35] tracking-[-0.28px]" style={{ color: tokens.black }}>
          Поделиться чатом
        </span>
      </div>
      <div className="flex flex-col gap-[16px] border-t p-[16px]" style={{ borderColor: tokens.border }}>
        <div className="flex items-center justify-between gap-[12px]">
          <div className="flex items-center gap-[12px]">
            <span className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-[4px]" style={{ backgroundColor: tokens.bgSubtle, color: tokens.grey }}>
              <Ic name="fig-link" />
            </span>
            <span className="flex flex-col gap-[2px]">
              <Tip text="Любой, у кого есть ссылка, увидит диалог, но не сможет писать в него" placement="bottom">
                <span
                  className="w-fit text-[14px] font-medium leading-[1.35] tracking-[-0.28px] underline decoration-dotted decoration-[#BABBBD] underline-offset-[3px]"
                  style={{ color: tokens.black }}
                >
                  Общий доступ
                </span>
              </Tip>
              <span className="text-[12px] leading-[normal] tracking-[-0.24px]" style={{ color: tokens.grey }}>
                Просмотр диалога по ссылке
              </span>
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            aria-label="Общий доступ"
            onClick={() => setEnabled((v) => !v)}
            className={`relative h-[16px] w-[24px] shrink-0 rounded-full ${pressableClass} ${focusRingClass}`}
            style={{ backgroundColor: enabled ? tokens.blue : tokens.borderStrong }}
          >
            <span
              className="absolute top-[2px] h-[12px] w-[12px] rounded-full bg-white transition-[left] duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
              style={{ left: enabled ? 10 : 2 }}
            />
          </button>
        </div>
        <button
          type="button"
          disabled={!enabled}
          onClick={copy}
          className={`flex h-[36px] w-full items-center justify-center gap-[6px] rounded-[4px] p-[10px] text-[13px] font-medium leading-[normal] tracking-[-0.13px] disabled:cursor-not-allowed ${copied ? "bg-[#EFEFEF] text-[#212833]" : enabled ? "bg-[#0138C7] text-white hover:bg-[#0032B1]" : "bg-[#F7F7F8] text-[#C7C8CA]"} ${pressableClass} ${focusRingClass}`}
        >
          {copied && <Ic name="fig-check" />}
          {!enabled ? "Доступ по ссылке выключен" : copied ? "Ссылка скопирована" : "Скопировать ссылку"}
        </button>
      </div>
    </div>
  );
}

export function DialogHeader({
  dialog,
  dialogs,
  onHome,
  onSwitch,
  onCopyLink,
  onPin,
  onRename,
  onDelete,
  renaming,
  onCommitRename,
  onCancelRename,
}: {
  dialog: Dialog;
  dialogs: Dialog[];
  onHome: () => void;
  onSwitch: (id: string) => void;
  onCopyLink: () => void;
  onPin: () => void;
  onRename: () => void;
  onDelete: () => void;
  renaming: boolean;
  onCommitRename: (title: string) => void;
  onCancelRename: () => void;
}) {
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);
  const shareRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const closeSwitcher = useCallback(() => setSwitcherOpen(false), []);
  const closeShare = useCallback(() => setShareOpen(false), []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  useOutsideClose([switcherRef], switcherOpen, closeSwitcher);
  useOutsideClose([shareRef], shareOpen, closeShare);
  useOutsideClose([menuRef], menuOpen, closeMenu);
  const others = sortDialogs(dialogs);

  return (
    <header className="flex h-[54px] shrink-0 items-center justify-between p-[16px]">
      <div ref={switcherRef} className="relative flex min-w-0 items-center gap-[2px]">
        <button
          type="button"
          onClick={onHome}
          className={`shrink-0 rounded-[3px] p-[6px] text-[13px] font-medium leading-[normal] tracking-[-0.13px] text-[#818AA3] hover:bg-[#F7F7F8] hover:text-[#212833] ${pressableClass} ${focusRingClass}`}
        >
          Чат
        </button>
        <span className="text-[13px] font-medium leading-[normal] tracking-[-0.13px]" style={{ color: tokens.grey }}>
          /
        </span>
        {renaming ? (
          <div className="p-[6px]">
            <RenameInput title={dialog.title} onCommit={onCommitRename} onCancel={onCancelRename} />
          </div>
        ) : (
          <button
            type="button"
            aria-label="Другие диалоги"
            aria-expanded={switcherOpen}
            onClick={() => setSwitcherOpen((v) => !v)}
            className={`flex min-w-0 items-center gap-[4px] rounded-[3px] p-[6px] text-left hover:bg-[#F7F7F8] ${pressableClass} ${focusRingClass}`}
            style={{ backgroundColor: switcherOpen ? tokens.bgSubtle : undefined }}
          >
            <span className="max-w-[420px] truncate text-[13px] font-medium leading-[normal] tracking-[-0.13px]" style={{ color: tokens.black }}>
              {dialog.title}
            </span>
            <span className={`shrink-0 transition-transform duration-[180ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none ${switcherOpen ? "rotate-180" : ""}`} style={{ color: tokens.grey }}>
              <Ic name="chevron-down" />
            </span>
          </button>
        )}
        <Popover open={switcherOpen} direction="down" padding={4} style={{ boxShadow: shadow }} className="left-[45px] top-[calc(100%+4px)] w-[320px]">
          <div role="menu" className="gc-scroll flex max-h-[360px] flex-col overflow-y-auto">
            {others.map((d) => (
              <button
                key={d.id}
                type="button"
                role="menuitem"
                onClick={() => {
                  setSwitcherOpen(false);
                  if (d.id !== dialog.id) onSwitch(d.id);
                }}
                className={`flex w-full items-center gap-[6px] rounded-[2px] px-[6px] py-[8px] text-left hover:bg-[#F7F7F8] ${pressableClass} ${focusRingClass}`}
              >
                <span className="shrink-0" style={{ color: tokens.grey }}>
                  <Ic name={d.pinned ? "fig-pin" : "fig-chat"} />
                </span>
                <span className="min-w-0 flex-1 truncate text-[13px] leading-[normal] tracking-[-0.13px]" style={{ color: tokens.black }}>
                  {d.title}
                </span>
                {d.id === dialog.id ? (
                  <span className="shrink-0" style={{ color: tokens.grey }}>
                    <Ic name="fig-check" />
                  </span>
                ) : (
                  <span className="shrink-0 text-[12px] leading-[normal] tracking-[-0.24px]" style={{ color: tokens.greyDisabled }}>
                    {formatShortDate(d.updatedAt)}
                  </span>
                )}
              </button>
            ))}
          </div>
        </Popover>
      </div>

      <div className="flex shrink-0 items-center gap-[8px]">
        {/* Сплит «Поделиться | ссылка» */}
        <div ref={shareRef} className="relative flex h-[32px] items-center rounded-[3px] border" style={{ borderColor: tokens.border }}>
          <button
            type="button"
            aria-expanded={shareOpen}
            onClick={() => setShareOpen((v) => !v)}
            className={`flex h-[30px] items-center gap-[6px] rounded-l-[3px] border-r px-[8px] text-[13px] leading-[normal] tracking-[-0.13px] hover:bg-[#F7F7F8] ${pressableClass} ${focusRingClass}`}
            style={{ borderColor: tokens.border, color: tokens.black, backgroundColor: shareOpen ? tokens.bgSubtle : undefined }}
          >
            Поделиться
          </button>
          <Tip text="Скопировать ссылку" placement="bottom">
            <button
              type="button"
              aria-label="Скопировать ссылку"
              onClick={onCopyLink}
              className={`flex h-[30px] w-[30px] items-center justify-center rounded-r-[3px] bg-white hover:bg-[#F7F7F8] ${pressableClass} ${focusRingClass}`}
              style={{ color: tokens.grey }}
            >
              <Ic name="fig-link" />
            </button>
          </Tip>
          <Popover open={shareOpen} direction="down" padding={0} style={{ boxShadow: popoverShadow }} className="right-0 top-[calc(100%+8px)] w-[360px]">
            <SharePopoverPanel onCopied={onCopyLink} />
          </Popover>
        </div>
        <HeaderIconButton icon="fig-pin" label={dialog.pinned ? "Открепить" : "Закрепить"} active={dialog.pinned} onClick={onPin} />
        <div ref={menuRef} className="relative">
          <HeaderIconButton icon="fig-ellipsis" label="Действия" active={menuOpen} ariaExpanded={menuOpen} onClick={() => setMenuOpen((v) => !v)} />
          <Popover open={menuOpen} direction="down" padding={4} style={{ boxShadow: shadow }} className="right-0 top-[calc(100%+4px)] w-[160px]">
            <div role="menu" className="flex flex-col">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onRename();
                }}
                className={`flex w-full items-center gap-[6px] rounded-[2px] px-[6px] py-[8px] text-left hover:bg-[#F7F7F8] ${pressableClass} ${focusRingClass}`}
              >
                <span style={{ color: tokens.grey }}>
                  <Ic name="fig-pencil" />
                </span>
                <span className="text-[13px] leading-[normal] tracking-[-0.13px]" style={{ color: tokens.black }}>
                  Переименовать
                </span>
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete();
                }}
                className={`flex w-full items-center gap-[6px] rounded-[2px] px-[6px] py-[8px] text-left hover:bg-[#F7F7F8] ${pressableClass} ${focusRingClass}`}
                style={{ color: tokens.red }}
              >
                <Ic name="fig-trash" />
                <span className="text-[13px] leading-[normal] tracking-[-0.13px]">Удалить</span>
              </button>
            </div>
          </Popover>
        </div>
      </div>
    </header>
  );
}

function RenameInput({ title, onCommit, onCancel }: { title: string; onCommit: (t: string) => void; onCancel: () => void }) {
  const [value, setValue] = useState(title);
  return (
    <input
      autoFocus
      value={value}
      onFocus={(e) => e.currentTarget.select()}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => (value.trim() ? onCommit(value) : onCancel())}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          if (value.trim()) onCommit(value);
          else onCancel();
        } else if (e.key === "Escape") {
          e.preventDefault();
          onCancel();
        }
      }}
      className="h-[24px] min-w-0 rounded-[2px] border bg-white px-[4px] text-[13px] font-medium leading-[normal] tracking-[-0.13px] outline-none"
      style={{ color: tokens.black, borderColor: tokens.blue, width: Math.min(420, Math.max(160, value.length * 8 + 16)) }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Сообщения
// ─────────────────────────────────────────────────────────────────────────────

export function UserBubble({ message }: { message: Message }) {
  return (
    <div className="gc-enter flex w-full justify-end">
      <div className="max-w-[560px] whitespace-pre-wrap rounded-[4px] p-[8px] text-[14px] leading-[1.35] tracking-[-0.28px]" style={{ backgroundColor: tokens.bgSubtle, color: tokens.black }}>
        {message.text}
      </div>
    </div>
  );
}

/** Значок цитаты [n] с поповером источника на ховере */
function CitationBadge({ n, meetingId }: { n: number; meetingId?: string }) {
  const [hover, setHover] = useState(false);
  const [alignRight, setAlignRight] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
    },
    [],
  );
  const meeting = meetingId ? meetingById(meetingId) : undefined;
  return (
    <span
      className="relative inline-block align-middle"
      onMouseEnter={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setAlignRight(rect.left + 327 > window.innerWidth - 24);
        // Небольшая задержка: проход мышью по тексту не должен мигать поповерами
        if (hoverTimer.current) clearTimeout(hoverTimer.current);
        hoverTimer.current = setTimeout(() => setHover(true), 120);
      }}
      onMouseLeave={() => {
        if (hoverTimer.current) clearTimeout(hoverTimer.current);
        setHover(false);
      }}
    >
      <span
        className={`ml-[4px] inline-flex h-[16px] w-[16px] items-center justify-center rounded-full border text-[12px] font-medium leading-none tracking-[-0.24px] ${pressableClass}`}
        style={{ borderColor: tokens.border, color: tokens.grey, backgroundColor: hover ? tokens.bgSubtle : "transparent", cursor: "default" }}
      >
        {n}
      </span>
      {meeting && (
        <Popover open={hover} direction="down" padding={8} style={{ boxShadow: popoverShadow }} className={`top-[22px] z-50 w-[327px] ${alignRight ? "right-0" : "left-0"}`}>
          <div className="flex w-full flex-col gap-[8px]">
            <div className="flex items-center justify-between gap-[8px]">
              <span className="flex min-w-0 items-center gap-[6px]">
                <span className="flex h-[16px] w-[16px] shrink-0 items-center justify-center rounded-full border text-[12px] font-medium leading-none tracking-[-0.24px]" style={{ borderColor: tokens.border, color: tokens.grey }}>
                  {n}
                </span>
                <span className="truncate text-[13px] font-medium leading-[normal] tracking-[-0.13px]" style={{ color: tokens.black }}>
                  {meeting.title}
                </span>
              </span>
              <span className="shrink-0 text-[12px] leading-[normal] tracking-[-0.24px]" style={{ color: tokens.greyDisabled }}>
                {formatLongDate(meeting.date)}
              </span>
            </div>
            <div className="px-[4px] text-[12px] leading-[18px] tracking-[-0.24px]" style={{ color: tokens.grey, fontFeatureSettings: '"lnum" 1, "tnum" 1' }}>
              {meeting.summary.map((s) => (
                <p key={s}>- {s}</p>
              ))}
            </div>
          </div>
        </Popover>
      )}
    </span>
  );
}

/** Строка текста с цитатами [n] */
function InlineWithCitations({ text, sources, keyPrefix }: { text: string; sources: string[]; keyPrefix: string }) {
  const parts = text.split(/(\[\d+\])/g);
  return (
    <>
      {parts.map((p, i) => {
        const m = p.match(/^\[(\d+)\]$/);
        if (m) {
          const n = Number(m[1]);
          return <CitationBadge key={`${keyPrefix}-${i}`} n={n} meetingId={sources[n - 1]} />;
        }
        return <span key={`${keyPrefix}-${i}`}>{p}</span>;
      })}
    </>
  );
}

/** Текст ответа: абзацы, буллеты двух уровней, цитаты. 14/24, как в макете */
export function AnswerText({ text, sources = [], streaming }: { text: string; sources?: string[]; streaming?: boolean }) {
  const lines = text.split("\n");
  const blocks: ReactNode[] = [];
  let list: { level: number; text: string }[] = [];
  const flush = (k: number) => {
    if (!list.length) return;
    const items = list;
    list = [];
    // Группируем: подряд идущие элементы уровня 2 — вложенный список (отступ 42, как в макете),
    // элементы уровня 1 — внешний (отступ 21). Вложенный список может идти без родителя.
    const tree: { text: string | null; children: string[] }[] = [];
    for (const it of items) {
      const last = tree[tree.length - 1];
      if (it.level === 2) {
        if (last && last.text === null) last.children.push(it.text);
        else tree.push({ text: null, children: [it.text] });
      } else tree.push({ text: it.text, children: [] });
    }
    const renderNested = (children: string[], prefix: string) => (
      <ul className="list-disc pl-[21px]">
        {children.map((c, j) => (
          <li key={j} className={j < children.length - 1 ? "mb-[8px]" : ""}>
            <InlineWithCitations text={c} sources={sources} keyPrefix={`${prefix}-${j}`} />
          </li>
        ))}
      </ul>
    );
    blocks.push(
      <ul key={`ul-${k}`} className="list-disc pl-[21px]">
        {tree.map((it, i) =>
          it.text === null ? (
            <li key={i} className={`list-none ${i < tree.length - 1 ? "mb-[8px]" : ""}`}>
              {renderNested(it.children, `li2-${k}-${i}`)}
            </li>
          ) : (
            <li key={i} className={i < tree.length - 1 ? "mb-[8px]" : ""}>
              <InlineWithCitations text={it.text} sources={sources} keyPrefix={`li-${k}-${i}`} />
            </li>
          ),
        )}
      </ul>,
    );
  };
  lines.forEach((raw, i) => {
    const l2 = raw.match(/^\s{2,}-\s(.*)$/);
    const l1 = raw.match(/^-\s(.*)$/);
    if (l2) {
      list.push({ level: 2, text: l2[1] });
      return;
    }
    if (l1) {
      list.push({ level: 1, text: l1[1] });
      return;
    }
    flush(i);
    if (!raw.trim()) return;
    blocks.push(
      <p key={`p-${i}`}>
        <InlineWithCitations text={raw} sources={sources} keyPrefix={`p-${i}`} />
      </p>,
    );
  });
  flush(lines.length);
  return (
    <div className="w-full text-[14px] leading-[24px] tracking-[-0.14px]" style={{ color: tokens.black }}>
      {blocks}
      {streaming && <span className="gc-caret ml-[2px] inline-block h-[14px] w-[6px] translate-y-[2px] rounded-[1px]" style={{ backgroundColor: tokens.black }} />}
    </div>
  );
}

/** Шаг «Смотрю встречи…»: клик раскрывает список просмотренных встреч */
function StepRow({ step, looking, onOpenMeeting }: { step: NonNullable<Message["step"]>; looking: boolean; onOpenMeeting?: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex w-full flex-col gap-[16px]">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`group flex w-fit items-center gap-[4px] rounded-[2px] text-left ${pressableClass} ${focusRingClass}`}
      >
        <span className={`text-[13px] font-medium leading-[normal] tracking-[-0.13px] ${looking ? "gc-shimmer-text" : ""}`} style={{ color: tokens.grey }}>
          {step.label}
        </span>
        <span
          className={`flex h-[16px] w-[16px] items-center justify-center text-[#818AA3] transition-transform duration-[180ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:text-[#585E6C] motion-reduce:transition-none ${open ? "rotate-90" : ""}`}
        >
          <Ic name="chevron-right" />
        </span>
      </button>
      {open && (
        <div className="gc-enter flex w-full flex-col rounded-[4px] border p-[8px]" style={{ borderColor: tokens.border }}>
          {step.meetingIds.map((id) => {
            const m = meetingById(id);
            if (!m) return null;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onOpenMeeting?.(id)}
                className={`flex w-full items-center gap-[6px] rounded-[2px] px-[6px] py-[8px] text-left hover:bg-[#F7F7F8] ${pressableClass} ${focusRingClass}`}
              >
                <span className="rounded-[2px] bg-white" style={{ padding: 1.5 }}>
                  <MeetingThumb thumb={m.thumb} width={23} height={13} radius={1.5} />
                </span>
                <span className="min-w-0 flex-1 truncate text-[13px] leading-[normal] tracking-[-0.13px]" style={{ color: tokens.black }}>
                  {m.title}
                </span>
                <span className="shrink-0 text-[12px] leading-[normal] tracking-[-0.24px]" style={{ color: tokens.greyDisabled }}>
                  {formatLongDate(m.date)}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Уточнение режима: две карточки, склеенные в стек (верхняя без нижней рамки) */
function ClarifyCards({ clarify, onChoose }: { clarify: NonNullable<Message["clarify"]>; onChoose?: (mode: Mode) => void }) {
  const options = clarify.chosen ? clarify.options.filter((o) => o.mode === clarify.chosen) : clarify.options;
  return (
    <div className="flex w-[560px] max-w-full flex-col">
      {options.map((o, i) => {
        const m = modeById(o.mode);
        const first = i === 0;
        const last = i === options.length - 1;
        const done = clarify.chosen !== undefined;
        return (
          <button
            key={o.mode}
            type="button"
            disabled={done}
            onClick={() => onChoose?.(o.mode)}
            className={`gc-enter flex w-full items-center gap-[12px] border bg-white p-[16px] text-left ${first ? "rounded-t-[4px]" : "-mt-px"} ${last ? "rounded-b-[4px]" : ""} ${done ? "cursor-default" : "hover:bg-[#FAFAFA]"} ${pressableClass} ${focusRingClass}`}
            style={{ borderColor: tokens.border, animationDelay: `${i * 50}ms` }}
          >
            <span className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-[4px]" style={{ backgroundColor: tokens.bgSubtle, color: m.color }}>
              <Ic name={m.icon} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
              <span className="text-[13px] font-medium leading-[normal] tracking-[-0.13px]" style={{ color: tokens.black }}>
                {o.label}
              </span>
              <span className="truncate text-[12px] leading-[normal] tracking-[-0.24px]" style={{ color: tokens.grey }}>
                {o.description}
              </span>
            </span>
            <span className="flex h-[20px] w-[20px] shrink-0 items-center justify-center" style={{ color: tokens.grey }}>
              <Ic name={done ? "fig-check" : "chevron-right"} size={done ? 16 : 20} />
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Иконка действия под ответом: 24px, появляется на ховере ответа */
function AnswerAction({ icon, label, onClick, active, flip }: { icon: "fig-copy" | "fig-thumb-up"; label: string; onClick: () => void; active?: boolean; flip?: boolean }) {
  return (
    <Tip text={label} placement="bottom">
      <button
        type="button"
        aria-label={label}
        aria-pressed={active}
        onClick={onClick}
        className={`flex h-[24px] w-[24px] items-center justify-center rounded-[3px] hover:bg-[#F7F7F8] hover:text-[#818AA3] ${pressableClass} ${focusRingClass}`}
        style={{ color: active ? tokens.black : tokens.greyDisabled }}
      >
        <span className={flip ? "rotate-180" : ""}>
          <Ic name={icon} />
        </span>
      </button>
    </Tip>
  );
}

export function AssistantBlock({
  message,
  generation,
  onChoose,
  onOpenMeeting,
  onCopy,
}: {
  message: Message;
  generation: Generation | null;
  onChoose?: (mode: Mode) => void;
  onOpenMeeting?: (id: string) => void;
  onCopy?: (text: string) => void;
}) {
  const [vote, setVote] = useState<"up" | "down" | null>(null);
  const mine = generation?.messageId === message.id ? generation.phase : null;
  const thinking = mine === "thinking";
  const looking = mine === "looking";
  const streaming = mine === "streaming";
  const awaitingChoice = message.clarify && message.clarify.chosen === undefined;
  const done = mine === null && message.text.length > 0 && !awaitingChoice;
  return (
    <div className="gc-enter group/answer flex w-full flex-col items-start gap-[16px]">
      <span className={`text-[13px] font-medium leading-[normal] tracking-[-0.13px] ${thinking ? "gc-shimmer-text" : ""}`} style={{ color: tokens.grey }}>
        Думаю...
      </span>
      {message.clarify && (
        <>
          <p className="gc-enter text-[14px] leading-[24px] tracking-[-0.14px]" style={{ color: tokens.black }}>
            Не очень понял вопрос, уточните пожалуйста, что вы имеете в виду?
          </p>
          <ClarifyCards clarify={message.clarify} onChoose={onChoose} />
        </>
      )}
      {message.step && !awaitingChoice && (
        <div className="gc-enter w-full">
          <StepRow step={message.step} looking={looking} onOpenMeeting={onOpenMeeting} />
        </div>
      )}
      {(message.text || streaming) && !awaitingChoice && <AnswerText text={message.text} sources={message.sources} streaming={streaming} />}
      {done && (
        <div className="-ml-[4px] flex items-center gap-[4px] opacity-0 transition-opacity duration-[120ms] group-hover/answer:opacity-100 focus-within:opacity-100 motion-reduce:transition-none">
          <AnswerAction icon="fig-copy" label="Скопировать ответ" onClick={() => onCopy?.(message.text)} />
          <AnswerAction icon="fig-thumb-up" label="Полезно" active={vote === "up"} onClick={() => setVote((v) => (v === "up" ? null : "up"))} />
          <AnswerAction icon="fig-thumb-up" label="Не полезно" flip active={vote === "down"} onClick={() => setVote((v) => (v === "down" ? null : "down"))} />
        </div>
      )}
    </div>
  );
}
