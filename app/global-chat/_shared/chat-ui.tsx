"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
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
import { MODE_AVATAR_ART } from "./mode-avatar-art";
import { aiAsset, composerShadow, easeOut, focusRingClass, gcAsset, popoverShadow, pressableClass, sfAsset, shadow, tokens } from "./tokens";
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
// Аватар режима — по макету 46256:7700: плашка с заливкой цвета режима на 16%, внутри рисунок-персонаж
// (SVG дизайнера из Figma). 32px в меню режимов (аватар 20), 24px в заголовке стартовой (аватар ~14)
// ─────────────────────────────────────────────────────────────────────────────

// Автопроигрывание мимики в заголовке — один раз за загрузку страницы, не при каждой смене режима
let titleAutoplayed = false;

export function ModeAvatar({ mode, size = 32, autoplayOnce = false }: { mode: Mode; size?: 24 | 32; autoplayOnce?: boolean }) {
  const m = modeById(mode);
  const art = MODE_AVATAR_ART[mode];
  const [, , vw, vh] = art.viewBox.split(" ").map(Number);
  const w = Math.round(size * 0.625);
  const h = (w * vh) / vw;
  const rootRef = useRef<HTMLSpanElement>(null);
  const eyesRef = useRef<SVGGElement>(null);
  const eyeARef = useRef<SVGGElement>(null);
  const eyeBRef = useRef<SVGGElement>(null);
  const bodyRef = useRef<SVGGElement>(null);
  // Глаза оживают на ховере: сама плашка или ближайший предок с data-avatar-hover (строка меню).
  // У каждого режима своя мимика, все через WAAPI на слое глаз, повторный ховер перезапускает без рывка
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const target = (root.closest("[data-avatar-hover]") as HTMLElement | null) ?? root;
    const play = () => {
      const eyes = eyesRef.current;
      const a = eyeARef.current;
      const b = eyeBRef.current;
      const body = bodyRef.current;
      if (!eyes || !a || !b || !body || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      [eyes, a, b, body].forEach((el) => el.getAnimations().forEach((an) => an.cancel()));
      const u = vw * 0.07; // шаг взгляда в единицах рисунка
      const soft = "cubic-bezier(0.45, 0, 0.55, 1)";
      const out = "cubic-bezier(0.23, 1, 0.32, 1)";
      const snap = "cubic-bezier(0.34, 1.56, 0.64, 1)"; // с перелетом — для «прыжков» и «ага»
      const linear = { easing: "linear" as const };
      // какой глаз левый — по геометрии, порядок путей в файле не гарантирован
      const [left, right] = a.getBBox().x <= b.getBBox().x ? [a, b] : [b, a];
      // Каждая сценка в несколько тактов: завязка, развитие, финальный «акцент», возврат
      switch (mode) {
        case "auto": {
          // Авто: осматривается влево-вправо, находит ответ — довольно щурится и чуть надувается
          const D = 1700;
          body.animate(
            [
              { transform: "none", easing: soft },
              { transform: "rotate(-7deg) scale(1.04)", offset: 0.14, easing: soft },
              { transform: "rotate(-7deg) scale(1.04)", offset: 0.26, easing: soft },
              { transform: "rotate(7deg) scale(1.04)", offset: 0.42, easing: soft },
              { transform: "rotate(7deg) scale(1.04)", offset: 0.54, easing: out },
              { transform: "none", offset: 0.64, easing: soft },
              { transform: "scale(1.06)", offset: 0.76, easing: soft }, // довольно надувается
              { transform: "scale(1.06)", offset: 0.88, easing: soft },
              { transform: "none" },
            ],
            { duration: D, ...linear },
          );
          eyes.animate(
            [
              { transform: "none", easing: soft },
              { transform: `translateX(${-u}px)`, offset: 0.14, easing: soft },
              { transform: `translateX(${-u}px)`, offset: 0.26, easing: soft },
              { transform: `translateX(${u}px)`, offset: 0.42, easing: soft },
              { transform: `translateX(${u}px)`, offset: 0.54, easing: out },
              { transform: "none", offset: 0.64, easing: soft },
              { transform: "scaleY(0.45)", offset: 0.72, easing: soft }, // довольный прищур
              { transform: "scaleY(0.45)", offset: 0.9, easing: soft },
              { transform: "none" },
            ],
            { duration: D, ...linear },
          );
          break;
        }
        case "ask": {
          // Спросить: «хм?» набок в одну сторону, потом в другую, и вдруг «ага!» — широко открытые глаза
          const D = 1800;
          body.animate(
            [
              { transform: "none", easing: out },
              { transform: `rotate(14deg) translateY(${-u * 0.3}px)`, offset: 0.16, easing: soft },
              { transform: `rotate(14deg) translateY(${-u * 0.3}px)`, offset: 0.34, easing: soft },
              { transform: `rotate(-12deg) translateY(${-u * 0.3}px)`, offset: 0.5, easing: soft },
              { transform: `rotate(-12deg) translateY(${-u * 0.3}px)`, offset: 0.64, easing: out },
              { transform: "none", offset: 0.72, easing: out },
              { transform: "scale(1.1)", offset: 0.8, easing: soft }, // ага!
              { transform: "scale(1.1)", offset: 0.9, easing: out },
              { transform: "none" },
            ],
            { duration: D, ...linear },
          );
          eyes.animate(
            [
              { transform: "none", easing: out },
              { transform: "rotate(-9deg)", offset: 0.16, easing: soft },
              { transform: "rotate(-9deg)", offset: 0.34, easing: soft },
              { transform: "rotate(8deg)", offset: 0.5, easing: soft },
              { transform: "rotate(8deg)", offset: 0.64, easing: out },
              { transform: "none", offset: 0.72, easing: out },
              { transform: "none" },
            ],
            { duration: D, ...linear },
          );
          // один глаз шире, второй прищурен — и меняются местами на втором наклоне; на «ага» оба широкие
          right.animate(
            [
              { transform: "none", easing: out },
              { transform: "scale(1.4)", offset: 0.16, easing: soft },
              { transform: "scale(1.4)", offset: 0.34, easing: soft },
              { transform: "scaleY(0.7)", offset: 0.5, easing: soft },
              { transform: "scaleY(0.7)", offset: 0.64, easing: out },
              { transform: "none", offset: 0.72, easing: out },
              { transform: "scale(1.45)", offset: 0.8, easing: snap },
              { transform: "scale(1.45)", offset: 0.9, easing: out },
              { transform: "none" },
            ],
            { duration: D, ...linear },
          );
          left.animate(
            [
              { transform: "none", easing: out },
              { transform: "scaleY(0.7)", offset: 0.16, easing: soft },
              { transform: "scaleY(0.7)", offset: 0.34, easing: soft },
              { transform: "scale(1.4)", offset: 0.5, easing: soft },
              { transform: "scale(1.4)", offset: 0.64, easing: out },
              { transform: "none", offset: 0.72, easing: out },
              { transform: "scale(1.45)", offset: 0.8, easing: snap },
              { transform: "scale(1.45)", offset: 0.9, easing: out },
              { transform: "none" },
            ],
            { duration: D, ...linear },
          );
          break;
        }
        case "analytics": {
          // Аналитика: наклоняется к данным и щурится, взгляд медленно сканирует график слева направо, тело
          // покачивается вслед за взглядом, как стрелка весов; в конце вывод — глаза широко, спокойный кивок
          const D = 1900;
          body.style.transformOrigin = "center";
          body.animate(
            [
              { transform: "none", easing: soft },
              { transform: "rotate(-6deg) scale(1.03)", offset: 0.18, easing: soft },
              { transform: "rotate(-6deg) scale(1.03)", offset: 0.3, easing: soft },
              { transform: "rotate(6deg) scale(1.03)", offset: 0.62, easing: soft }, // качнулся за взглядом
              { transform: "rotate(6deg) scale(1.03)", offset: 0.7, easing: out },
              { transform: `rotate(0deg) translateY(${u * 0.35}px)`, offset: 0.82, easing: soft }, // кивок: понял
              { transform: "none" },
            ],
            { duration: D, ...linear },
          );
          eyes.animate(
            [
              { transform: "none", easing: soft },
              { transform: `scaleY(0.35) translateX(${-u * 0.9}px)`, offset: 0.18, easing: soft }, // прищур, взгляд в начало графика
              { transform: `scaleY(0.35) translateX(${-u * 0.9}px)`, offset: 0.3, easing: "linear" },
              { transform: `scaleY(0.35) translateX(${u * 0.9}px)`, offset: 0.62, easing: soft }, // сканирует до конца
              { transform: `scaleY(0.35) translateX(${u * 0.9}px)`, offset: 0.7, easing: out },
              { transform: "scaleY(1.2)", offset: 0.78, easing: soft }, // вывод
              { transform: "scaleY(1.2)", offset: 0.88, easing: soft },
              { transform: "none" },
            ],
            { duration: D, ...linear },
          );
          break;
        }
        case "kb": {
          // База знаний: читает первую строчку, перескакивает на вторую, находит — глаза вверх и «о!», книжка мягко захлопывается
          const D = 2100;
          body.animate(
            [
              { transform: "none", easing: soft },
              { transform: `scaleX(1.12) scaleY(0.94) translateY(${-u * 0.25}px)`, offset: 0.14, easing: "linear" },
              { transform: `scaleX(1.12) scaleY(0.94) translateY(${-u * 0.25}px) rotate(2deg)`, offset: 0.4, easing: soft },
              { transform: `scaleX(1.12) scaleY(0.94) translateY(${-u * 0.25}px) rotate(-2deg)`, offset: 0.48, easing: "linear" },
              { transform: `scaleX(1.12) scaleY(0.94) translateY(${-u * 0.25}px) rotate(2deg)`, offset: 0.7, easing: out },
              { transform: "scale(1.06)", offset: 0.8, easing: soft }, // о!
              { transform: "scaleX(0.96) scaleY(1.03)", offset: 0.9, easing: soft }, // захлопнулась
              { transform: "none" },
            ],
            { duration: D, ...linear },
          );
          eyes.animate(
            [
              { transform: "none", easing: soft },
              { transform: `translate(${-u * 0.9}px, ${u * 0.4}px)`, offset: 0.14, easing: "linear" },
              { transform: `translate(${u * 0.9}px, ${u * 0.4}px)`, offset: 0.4, easing: soft }, // первая строчка
              { transform: `translate(${-u * 0.9}px, ${u * 0.7}px)`, offset: 0.48, easing: "linear" }, // перескок на вторую
              { transform: `translate(${u * 0.9}px, ${u * 0.7}px)`, offset: 0.7, easing: out },
              { transform: `translateY(${-u * 0.3}px) scale(1.3)`, offset: 0.8, easing: snap }, // нашел!
              { transform: `translateY(${-u * 0.3}px) scale(1.3)`, offset: 0.86, easing: soft },
              { transform: "scaleY(0.1)", offset: 0.92, easing: soft }, // моргнул
              { transform: "none" },
            ],
            { duration: D, ...linear },
          );
          break;
        }
      }
    };
    target.addEventListener("mouseenter", play);
    // Первый заход: персонаж сам здоровается, когда заголовок уже появился
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (autoplayOnce && !titleAutoplayed) {
      titleAutoplayed = true;
      timer = setTimeout(play, 500);
    }
    return () => {
      target.removeEventListener("mouseenter", play);
      if (timer) clearTimeout(timer);
    };
  }, [vw, mode, autoplayOnce]);
  return (
    <span
      ref={rootRef}
      className={`flex shrink-0 items-center justify-center overflow-hidden ${size === 24 ? "rounded-[3px]" : "rounded-[4px]"}`}
      style={{ width: size, height: size, backgroundColor: `${m.color}29` }}
      aria-hidden="true"
    >
      {/* overflow visible: во время анимации тело выходит за рамку рисунка, но остается внутри плашки */}
      <svg width={w} height={h} viewBox={art.viewBox} fill="none" xmlns="http://www.w3.org/2000/svg" className="block overflow-visible" overflow="visible">
        {/* тело и глаза в одной группе: глаза едут вместе с телом, а своя мимика накладывается поверх */}
        <g ref={bodyRef} style={{ transformBox: "fill-box", transformOrigin: "center" }}>
          <path d={art.body} fill={m.color} />
        <g ref={eyesRef} style={{ transformBox: "fill-box", transformOrigin: "center" }}>
          <g ref={eyeARef} style={{ transformBox: "fill-box", transformOrigin: "center" }}>
            <path d={art.eyes[0]} fill="#fff" />
          </g>
          <g ref={eyeBRef} style={{ transformBox: "fill-box", transformOrigin: "center" }}>
            <path d={art.eyes[1]} fill="#fff" />
          </g>
        </g>
        </g>
      </svg>
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Стартовая: заголовок
// ─────────────────────────────────────────────────────────────────────────────

export function HomeTitle({ mode }: { mode: Mode }) {
  const m = modeById(mode);
  return (
    // data-avatar-hover: мимика запускается с ховера всего заголовка, не только плашки
    <div key={mode} data-avatar-hover className="gc-fade-in flex items-center gap-[8px]">
      <ModeAvatar mode={mode} size={32} autoplayOnce />
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
  borderless = false,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  label?: string;
  active?: boolean;
  square?: boolean;
  ariaExpanded?: boolean;
  /** Без обводки (пикер режима) — рамка прозрачная, чтобы размеры совпадали с остальными кнопками */
  borderless?: boolean;
  className?: string;
}) {
  const btn = (
    <button
      type="button"
      aria-label={label}
      aria-expanded={ariaExpanded}
      onClick={onClick}
      className={`group/tool flex h-[32px] shrink-0 items-center justify-center gap-[6px] rounded-[4px] border bg-white hover:bg-[#F7F7F8] ${square ? "w-[32px]" : "px-[8px]"} ${pressableClass} ${focusRingClass} ${className}`}
      style={{ borderColor: borderless ? "transparent" : tokens.border, backgroundColor: active ? tokens.bgSubtle : undefined }}
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
        <span key={m.id} className="gc-fade-in text-[12px] leading-[normal] tracking-[-0.24px]" style={{ color: tokens.black }}>
          {m.label}
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
        className={`right-0 w-[290px] ${direction === "down" ? "top-[calc(100%+6px)]" : "bottom-[calc(100%+6px)]"}`}
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
                data-avatar-hover
                className={`group/mode flex w-full items-center gap-[12px] rounded-[4px] p-[8px] text-left hover:bg-[#FAFAFA] ${pressableClass} ${focusRingClass}`}
              >
                <ModeAvatar mode={x.id} size={32} />
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

  // Высота поля: минимум три строки (48px), при длинном тексте растет до 10 строк, дальше — скролл внутри
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const min = 48;
    const max = 16 * 10;
    el.style.height = `${min}px`;
    const next = Math.min(Math.max(el.scrollHeight, min), max);
    el.style.height = `${next}px`;
    el.style.overflowY = el.scrollHeight > max ? "auto" : "hidden";
  }, [state.text, ref]);

  return (
    <div
      className="flex w-full flex-col gap-[12px] rounded-[4px] bg-white p-[12px]"
      style={{ boxShadow: `inset 0 0 0 1px ${tokens.border}, ${composerShadow}` }}
      onClick={() => ref.current?.focus()}
    >
      {state.files.length > 0 && (
        <div className="flex flex-wrap gap-[8px]">
          {state.files.map((f) => (
            <FileChip key={f.id} file={f} onRemove={() => onRemoveFile(f.id)} />
          ))}
        </div>
      )}
      <div className="relative px-[4px] pt-[4px]">
        {/* Свой плейсхолдер вместо нативного: во всех браузерах стоит ровно там, где начинается текст,
            и сдвинут на 1px влево, чтобы курсор ложился поверх первой буквы, а не рядом с ней */}
        {state.text === "" && (
          <span
            aria-hidden
            className="pointer-events-none absolute left-[4px] top-[4px] -translate-x-[1px] text-[13px] leading-[16px] tracking-[-0.13px] text-[#BABBBD]"
          >
            Спроси че хочешь...
          </span>
        )}
        <textarea
          ref={ref}
          value={state.text}
          autoFocus={autoFocus}
          rows={3}
          aria-label="Спроси че хочешь..."
          onChange={(e) => onChange({ text: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              if (canSend) onSend();
            }
          }}
          className="gc-scroll relative block w-full resize-none bg-transparent text-[13px] leading-[16px] tracking-[-0.13px] outline-none"
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
/**
 * Саджесты под полем — по макету 46115:7175: строки px-8 py-12, радиус 4, ховер #F7F7F8, справа стрелка;
 * между строками дивайдеры, при ховере строки соседние с ней (сверху и снизу) исчезают
 */
export function SuggestionList({ items, onPick }: { items: Suggestion[]; onPick: (s: Suggestion) => void }) {
  const [hovered, setHovered] = useState<number | null>(null);
  return (
    // Без анимации и без key по режиму: при смене режима строки стоят на месте, меняется только текст
    <div className="flex w-full flex-col px-[12px]" onMouseLeave={() => setHovered(null)}>
      {items.map((s, i) => (
        <div key={i} className="flex w-full flex-col">
          {i > 0 && (
            <div
              className="-mb-px h-px w-full transition-opacity duration-100"
              style={{ backgroundColor: tokens.border, opacity: hovered === i || hovered === i - 1 ? 0 : 1 }}
            />
          )}
          <button
            type="button"
            onClick={() => onPick(s)}
            onMouseEnter={() => setHovered(i)}
            className={`flex w-full items-center justify-between gap-[8px] rounded-[4px] px-[8px] py-[12px] text-left hover:bg-[#F7F7F8] ${pressableClass} ${focusRingClass}`}
          >
            <span className="min-w-0 flex-1 text-[13px] leading-[normal] tracking-[-0.13px]" style={{ color: tokens.black }}>
              {s.text}
            </span>
            <span className="flex h-[16px] w-[16px] shrink-0 items-center justify-center rotate-90 text-[#818AA3]">
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

/**
 * Меню «…» строки диалога — по макету 45896:13503: триггер — иконка 16px на месте даты,
 * меню 160px (p-4, строки px-6 py-8 gap-6) под правым краем строки
 */
function DialogRowMenu({ dialog, actions, open, onOpenChange }: { dialog: Dialog; actions: DialogRowActions; open: boolean; onOpenChange: (open: boolean) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => onOpenChange(false), [onOpenChange]);
  useOutsideClose([ref], open, close);
  const run = (fn: (id: string) => void) => () => {
    onOpenChange(false);
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
    <div ref={ref} className="relative flex shrink-0" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        aria-label="Действия"
        aria-expanded={open}
        onClick={() => onOpenChange(!open)}
        className={`flex h-[16px] w-[16px] items-center justify-center rounded-[2px] text-[#818AA3] hover:text-[#585E6C] ${pressableClass} ${focusRingClass}`}
      >
        <Ic name="fig-ellipsis" />
      </button>
      <Popover open={open} direction="down" padding={4} style={{ boxShadow: shadow }} className="right-0 top-[calc(100%+8px)] w-[160px]">
        <div role="menu" className="flex flex-col">
          {row("fig-pin", dialog.pinned ? "Открепить" : "Закрепить", run(actions.onPin))}
          {row("fig-pencil", "Переименовать", run(actions.onRename))}
          {row("fig-trash", "Удалить", run(actions.onDelete), true)}
        </div>
      </Popover>
    </div>
  );
}

/**
 * Строка диалога — по макету 45833:9928: px-8 py-8, радиус 2, ховер grey-20, справа дата (или галочка у текущего),
 * на ховере на ее месте «…» с меню закрепить/переименовать/удалить.
 * Используется и в списке предыдущих чатов на стартовой, и в переключателе диалогов в шапке
 */
export function DialogListRow({
  dialog,
  index,
  actions,
  renaming,
  active = false,
  role = "button",
  tall = false,
  onOpen,
  onCommitRename,
  onCancelRename,
  onMenuOpenChange,
}: {
  dialog: Dialog;
  /** Порядок для каскадного появления; без него строка не анимируется */
  index?: number;
  actions: DialogRowActions;
  renaming: boolean;
  /** Текущий диалог — справа галочка вместо даты */
  active?: boolean;
  role?: "button" | "menuitem";
  /** Строка 36px (список на стартовой по 46115:7093) вместо 32px в переключателе */
  tall?: boolean;
  onOpen: () => void;
  onCommitRename: (title: string) => void;
  onCancelRename: () => void;
  onMenuOpenChange?: (open: boolean) => void;
}) {
  const [menuOpen, setMenuOpenState] = useState(false);
  const setMenuOpen = (open: boolean) => {
    setMenuOpenState(open);
    onMenuOpenChange?.(open);
  };
  const icon = dialog.pinned ? "fig-pin" : "fig-chat";
  if (renaming) {
    return (
      <div className={`flex w-full items-center gap-[6px] rounded-[2px] px-[8px] ${tall ? "h-[36px]" : "py-[6px]"}`} style={{ backgroundColor: tokens.bgSubtle }}>
        <span className="flex shrink-0" style={{ color: tokens.grey }}>
          <Ic name={icon} />
        </span>
        <RenameInput title={dialog.title} onCommit={onCommitRename} onCancel={onCancelRename} />
      </div>
    );
  }
  return (
    <div
      role={role}
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className={`group/row relative flex w-full cursor-pointer items-center gap-[6px] rounded-[2px] px-[8px] ${tall ? "h-[36px]" : "py-[8px]"} hover:bg-[#F7F7F8] hover:z-10 focus-within:z-10 ${index !== undefined ? "gc-fade-in-up gc-no-fill" : ""} ${menuOpen ? "z-10 bg-[#F7F7F8]" : ""} ${pressableClass} ${focusRingClass}`}
      style={index !== undefined ? { animationDelay: `${Math.min(index, 6) * 30}ms` } : undefined}
    >
      <span className="flex shrink-0" style={{ color: tokens.grey }}>
        <Ic name={icon} />
      </span>
      <span className="min-w-0 flex-1 truncate text-[13px] leading-[16px] tracking-[-0.13px]" style={{ color: tokens.black }}>
        {dialog.title}
      </span>
      {/* Справа — дата (у текущего диалога галочка), на ховере на ее месте «…».
          Фокус учитываем только клавиатурный (focus-visible): в Safari клик по кнопке фокусирует саму строку,
          и на focus-within троеточие залипало бы после действия из меню */}
      <span className="relative flex h-[16px] shrink-0 items-center justify-end">
        {active ? (
          <span
            className={`flex transition-opacity duration-[120ms] motion-reduce:transition-none ${menuOpen ? "opacity-0" : "group-hover/row:opacity-0 group-focus-visible/row:opacity-0 group-has-[:focus-visible]/row:opacity-0"}`}
            style={{ color: tokens.grey }}
          >
            <Ic name="fig-check" />
          </span>
        ) : (
          <span
            className={`text-[12px] leading-[normal] tracking-[-0.24px] transition-opacity duration-[120ms] motion-reduce:transition-none ${menuOpen ? "opacity-0" : "group-hover/row:opacity-0 group-focus-visible/row:opacity-0 group-has-[:focus-visible]/row:opacity-0"}`}
            style={{ color: tokens.greyDisabled }}
          >
            {formatShortDate(dialog.updatedAt)}
          </span>
        )}
        <span className={`absolute right-0 top-0 transition-opacity duration-[120ms] motion-reduce:transition-none ${menuOpen ? "" : "opacity-0 group-hover/row:opacity-100 group-focus-visible/row:opacity-100 has-[:focus-visible]:opacity-100"}`}>
          <DialogRowMenu dialog={dialog} actions={actions} open={menuOpen} onOpenChange={setMenuOpen} />
        </span>
      </span>
    </div>
  );
}

/** Сколько диалогов видно в свернутом списке — по макетам 46115:6954 / 46115:6747 */
const PREVIOUS_COLLAPSED = 3;

// Строки списков: вход раскрывается по высоте, выход быстрее входа; переезд при закреплении — через layout
const ROW_IN = { duration: 0.22, ease: easeOut };
const ROW_OUT = { duration: 0.16, ease: easeOut };
const ROW_STAGGER = 0.025;

/**
 * Блок «Предыдущие чаты» на стартовой — по макету 46115:7088: заголовок серым (px-8), через 12px список строк 36px.
 * Если диалогов больше трех — показываем три и ссылку «Показать все», в раскрытом виде — «Свернуть»
 */
export function PreviousChats({
  dialogs,
  onOpen,
  actions,
  renamingId,
  onCommitRename,
  onCancelRename,
}: {
  dialogs: Dialog[];
  onOpen: (id: string) => void;
  actions: DialogRowActions;
  renamingId: string | null;
  onCommitRename: (id: string, title: string) => void;
  onCancelRename: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  // Строки, у которых закончился вход: до этого они обрезаны по высоте, после — overflow снова видимый (меню «…» выходит за строку)
  const [settled, setSettled] = useState<Set<string>>(() => new Set());
  const reduce = useReducedMotion();
  const sorted = sortDialogs(dialogs);
  const collapsible = sorted.length > PREVIOUS_COLLAPSED;
  const visible = collapsible && !expanded ? sorted.slice(0, PREVIOUS_COLLAPSED) : sorted;
  const toggleExpanded = () => {
    setExpanded((v) => !v);
    setSettled(new Set());
  };
  return (
    <div className="flex w-full flex-col gap-[12px] px-[12px]">
      <div className="flex h-[16px] w-full items-center justify-between px-[8px] text-[12px] leading-[normal] tracking-[-0.24px]" style={{ color: tokens.grey }}>
        <span>Предыдущие чаты</span>
        {collapsible && (
          <button
            type="button"
            aria-expanded={expanded}
            onClick={toggleExpanded}
            className={`rounded-[2px] text-[#818AA3] hover:text-[#585E6C] ${pressableClass} ${focusRingClass}`}
          >
            {expanded ? "Свернуть" : "Показать все"}
          </button>
        )}
      </div>
      <div className="flex w-full flex-col">
        {/* Строки за пределами первых трех появляются по «Показать все» — раскрываются по высоте каскадом,
            сворачиваются быстро и разом; удаленная строка схлопывается, закрепленная переезжает наверх через layout.
            overflow hidden только на время движения, иначе он резал бы меню «…» */}
        <AnimatePresence initial={false}>
          {visible.map((d, i) => {
            const extra = i >= PREVIOUS_COLLAPSED;
            const delay = extra ? Math.min(i - PREVIOUS_COLLAPSED, 8) * ROW_STAGGER : 0;
            const entering = extra && !reduce && !settled.has(d.id);
            return (
              <motion.div
                key={d.id}
                layout={reduce ? false : "position"}
                initial={reduce ? false : { height: 0, opacity: 0 }}
                animate={{
                  height: "auto",
                  opacity: 1,
                  transition: reduce ? { duration: 0 } : { height: { ...ROW_IN, delay }, opacity: { duration: 0.16, delay: delay + 0.06 }, layout: ROW_IN },
                }}
                exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { height: 0, opacity: 0, overflow: "hidden", transition: { height: ROW_OUT, opacity: { duration: 0.1 } } }}
                onAnimationComplete={() => {
                  if (entering) setSettled((prev) => new Set(prev).add(d.id));
                }}
                className="w-full"
                style={{ overflow: entering ? "hidden" : "visible" }}
              >
                <DialogListRow
                  dialog={d}
                  index={extra ? undefined : i}
                  tall
                  actions={actions}
                  renaming={renamingId === d.id}
                  onOpen={() => onOpen(d.id)}
                  onCommitRename={(t) => onCommitRename(d.id, t)}
                  onCancelRename={onCancelRename}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
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
  onReset,
}: {
  open: boolean;
  initial: string[];
  onClose: () => void;
  onApply: (ids: string[]) => void;
  /** «Сбросить» — снять все выбранные встречи и закрыть модалку */
  onReset: () => void;
}) {
  return <AnimatePresence>{open && <MeetingsModalInner key="meetings-modal" initial={initial} onClose={onClose} onApply={onApply} onReset={onReset} />}</AnimatePresence>;
}

function MeetingsModalInner({ initial, onClose, onApply, onReset }: { initial: string[]; onClose: () => void; onApply: (ids: string[]) => void; onReset: () => void }) {
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

        {/* Футер: «Сбросить» снимает выбор и закрывает; «Добавить» активна только когда что-то выбрано */}
        <div className="flex shrink-0 items-center justify-end gap-[8px] rounded-b-[4px] border-t p-[16px]" style={{ backgroundColor: tokens.bgSubtle, borderColor: tokens.border }}>
          {/* «Сбросить» есть только когда есть что сбрасывать — выбрано в модалке или уже добавлено раньше */}
          {(selected.length > 0 || initial.length > 0) && (
            <button
              type="button"
              onClick={onReset}
              className={`gc-fade-in flex h-[36px] items-center justify-center rounded-[4px] bg-[#F7F7F8] px-[12px] text-[13px] leading-[normal] tracking-[-0.13px] hover:bg-[#EFEFEF] ${pressableClass} ${focusRingClass}`}
              style={{ color: tokens.black }}
            >
              Сбросить
            </button>
          )}
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
  rowActions,
  renamingRowId,
  onCommitRowRename,
  onCancelRowRename,
}: {
  /** null — стартовая: в шапке только «Чат», остальное не рендерится */
  dialog: Dialog | null;
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
  /** Меню «…» строк переключателя — те же действия, что у списка на стартовой */
  rowActions: DialogRowActions;
  renamingRowId: string | null;
  onCommitRowRename: (id: string, title: string) => void;
  onCancelRowRename: () => void;
}) {
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  // Пока открыто меню строки, список не режет его по overflow
  const [rowMenuOpen, setRowMenuOpen] = useState(false);
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
  const dialogId = dialog?.id ?? null;

  return (
    // Слева 10px + паддинг чипа 6px = текст «Чат» на тех же 16px, что и на стартовой — не скачет при переходе
    <header className="flex h-[54px] shrink-0 items-center justify-between py-[16px] pl-[10px] pr-[16px]">
      <div ref={switcherRef} className="relative flex min-w-0 items-center gap-[2px]">
        {/* «Чат» живет в шапке постоянно: на стартовой черный и некликабельный, в диалоге серый и ведет домой */}
        <button
          type="button"
          onClick={dialog ? onHome : undefined}
          tabIndex={dialog ? 0 : -1}
          aria-disabled={!dialog}
          className={`shrink-0 rounded-[3px] p-[6px] text-[13px] font-medium leading-[normal] tracking-[-0.13px] ${dialog ? "cursor-pointer text-[#818AA3] hover:bg-[#F7F7F8] hover:text-[#212833]" : "cursor-default text-[#212833]"} ${pressableClass} ${focusRingClass}`}
        >
          Чат
        </button>
        {dialog && (
        <div key={dialog.id} className="gc-enter flex min-w-0 items-center gap-[2px]">
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
          <div role="menu" className={`gc-scroll flex max-h-[360px] flex-col ${rowMenuOpen || renamingRowId ? "overflow-visible" : "overflow-y-auto"}`}>
            {others.map((d) => (
              <motion.div key={d.id} layout={reduceMotion ? false : "position"} transition={ROW_IN} className="w-full">
                <DialogListRow
                  dialog={d}
                  role="menuitem"
                  active={d.id === dialogId}
                  actions={rowActions}
                  renaming={renamingRowId === d.id}
                  onOpen={() => {
                    setSwitcherOpen(false);
                    if (d.id !== dialogId) onSwitch(d.id);
                  }}
                  onCommitRename={(t) => onCommitRowRename(d.id, t)}
                  onCancelRename={onCancelRowRename}
                  onMenuOpenChange={setRowMenuOpen}
                />
              </motion.div>
            ))}
          </div>
        </Popover>
        </div>
        )}
      </div>

      {dialog && (
      <div key={`actions-${dialog.id}`} className="gc-enter flex shrink-0 items-center gap-[8px]">
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
      )}
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
      <div className="max-w-[560px] whitespace-pre-wrap rounded-[4px] p-[8px] text-[13px] leading-[20px] tracking-[-0.13px]" style={{ backgroundColor: tokens.bgSubtle, color: tokens.black }}>
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
    <div className="w-full text-[13px] leading-[20px] tracking-[-0.13px]" style={{ color: tokens.black }}>
      {blocks}
      {streaming && <span className="gc-caret ml-[2px] inline-block h-[13px] w-[6px] translate-y-[2px] rounded-[1px]" style={{ backgroundColor: tokens.black }} />}
    </div>
  );
}

/** Шаг «Смотрю встречи…»: клик раскрывает список просмотренных встреч */
function StepRow({ step, looking, onOpenMeeting }: { step: NonNullable<Message["step"]>; looking: boolean; onOpenMeeting?: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const labelRef = useRef<HTMLSpanElement>(null);
  const [labelWidth, setLabelWidth] = useState<number | null>(null);
  // Ширина текста нужна шиммеру, чтобы блик шел по тексту и шеврону как по одному элементу
  useLayoutEffect(() => {
    if (!looking) return;
    const el = labelRef.current;
    if (el) setLabelWidth(el.getBoundingClientRect().width);
  }, [looking, step.label]);
  const shimmer = looking && labelWidth !== null;
  return (
    <div className="flex w-full flex-col gap-[16px]">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`group flex w-fit items-center gap-[4px] rounded-[2px] text-left ${shimmer ? "gc-shimmer-row" : ""} ${pressableClass} ${focusRingClass}`}
        style={shimmer ? ({ ["--gc-shim-w" as string]: `${labelWidth}px` } as React.CSSProperties) : undefined}
      >
        {/* цвет классами, не inline: инлайновый перебивал бы group-hover */}
        <span ref={labelRef} className={`text-[13px] leading-[20px] tracking-[-0.13px] ${shimmer ? "gc-shimmer-run-text" : "text-[#818AA3] group-hover:text-[#585E6C]"} ${pressableClass}`}>
          {step.label}
        </span>
        <span
          className={`flex h-[16px] w-[16px] translate-y-[1px] items-center justify-center text-[#818AA3] transition-transform duration-[180ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:text-[#585E6C] motion-reduce:transition-none ${open ? "rotate-90" : ""}`}
        >
          {/* шеврон на 1px ниже центра строки — оптически по центру текста 13/20 */}
          <Ic name="chevron-right" color={shimmer ? "transparent" : undefined} className={shimmer ? "gc-shimmer-run-icon" : ""} />
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
                className={`flex w-full items-center gap-[6px] rounded-[2px] px-[8px] py-[8px] text-left hover:bg-[#F7F7F8] ${pressableClass} ${focusRingClass}`}
              >
                <MeetingThumb thumb={m.thumb} width={26} height={16} radius={2} plain />
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
  const reduce = useReducedMotion();
  const options = clarify.chosen ? clarify.options.filter((o) => o.mode === clarify.chosen) : clarify.options;
  return (
    <div className="flex w-[560px] max-w-full flex-col">
      {/* После выбора невыбранная карточка схлопывается, выбранная остается на месте с галочкой */}
      <AnimatePresence initial={false}>
      {options.map((o, i) => {
        const m = modeById(o.mode);
        const first = i === 0;
        const last = i === options.length - 1;
        const done = clarify.chosen !== undefined;
        return (
          <motion.div
            key={o.mode}
            layout={reduce ? false : "position"}
            exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { height: 0, opacity: 0, overflow: "hidden", transition: { height: ROW_OUT, opacity: { duration: 0.1 } } }}
            transition={ROW_IN}
            className="w-full"
          >
          <button
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
          </motion.div>
        );
      })}
      </AnimatePresence>
    </div>
  );
}

/** Иконка действия под ответом: 24px без подложки, на ховере только темнеет */
function AnswerAction({ icon, label, onClick, active, flip, copied }: { icon: "fig-copy" | "fig-thumb-up"; label: string; onClick: () => void; active?: boolean; flip?: boolean; copied?: boolean }) {
  return (
    <Tip text={label} placement="bottom">
      <button
        type="button"
        aria-label={label}
        aria-pressed={active}
        onClick={onClick}
        className={`relative flex h-[24px] w-[24px] items-center justify-center rounded-[3px] hover:text-[#818AA3] ${pressableClass} ${focusRingClass}`}
        style={{ color: active ? tokens.black : tokens.greyDisabled }}
      >
        {/* Копирование: иконка морфит в зеленую галочку из шапки, как у «Скопировать ссылку» в других прототипах */}
        <span
          className={`flex transition-[opacity,transform] duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none ${flip ? "rotate-180" : ""}`}
          style={copied === undefined ? undefined : { opacity: copied ? 0 : 1, transform: copied ? "scale(0.6)" : "scale(1)" }}
        >
          <Ic name={icon} />
        </span>
        {copied !== undefined && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={aiAsset("check-circle.svg")}
            alt=""
            className="absolute left-[4px] top-[4px] h-[16px] w-[16px] transition-[opacity,transform] duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
            style={{ opacity: copied ? 1 : 0, transform: copied ? "scale(1)" : "scale(0.6)" }}
          />
        )}
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
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
    },
    [],
  );
  const copy = () => {
    onCopy?.(message.text);
    setCopied(true);
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => setCopied(false), 2000);
  };
  const mine = generation?.messageId === message.id ? generation.phase : null;
  // Шиммер на серых статусах — пока модель думает и смотрит встречи; с первым словом ответа гаснет
  const generating = mine === "thinking" || mine === "looking";
  const looking = mine === "looking";
  const streaming = mine === "streaming";
  const awaitingChoice = message.clarify && message.clarify.chosen === undefined;
  const done = mine === null && message.text.length > 0 && !awaitingChoice;
  return (
    <div className="gc-enter group/answer flex w-full flex-col items-start gap-[16px]">
      {/* inline color перебивал бы color: transparent у шиммера — ставим цвет только в статике */}
      <span className={`text-[13px] leading-[20px] tracking-[-0.13px] ${generating ? "gc-shimmer-text" : ""}`} style={generating ? undefined : { color: tokens.grey }}>
        Думаю...
      </span>
      {message.clarify && (
        <>
          <p className="gc-enter text-[13px] leading-[20px] tracking-[-0.13px]" style={{ color: tokens.black }}>
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
          <AnswerAction icon="fig-copy" label={copied ? "Скопировано" : "Скопировать ответ"} onClick={copy} copied={copied} />
          <AnswerAction icon="fig-thumb-up" label="Полезно" active={vote === "up"} onClick={() => setVote((v) => (v === "up" ? null : "up"))} />
          <AnswerAction icon="fig-thumb-up" label="Не полезно" flip active={vote === "down"} onClick={() => setVote((v) => (v === "down" ? null : "down"))} />
        </div>
      )}
    </div>
  );
}
