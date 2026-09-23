"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { createPortal } from "react-dom";
import {
  Button,
  MenuDivider,
  MenuRow,
  Popover,
  Tip,
  useOutsideClose,
  usePopoverMotion,
} from "../../global-chat/_shared/ui";
import { Ic } from "../../global-chat/_shared/icons";
import {
  TAG_COLORS,
  pluralMeetingsGen,
  tagColorHex,
  type Tag,
  type TagColor,
} from "./data";
import {
  TAG_NAME_MAX,
  easeOut,
  focusRingClass,
  pressableClass,
  shadow,
  tgAsset,
  tokens,
} from "./tokens";
import { normalizeName, type TagsApi } from "./use-tags";

export {
  Popover,
  Tip,
  useOutsideClose,
  ToastHost,
  useToast,
  Button,
  MenuRow,
  MenuDivider,
} from "../../global-chat/_shared/ui";

// ─────────────────────────────────────────────────────────────────────────────
// Иконки прототипа: heroicons 20/solid из public/tags, 16×16 через маску (как Ic в чате)
// ─────────────────────────────────────────────────────────────────────────────

export type TgIconName = "tag" | "plus" | "check" | "x-mark" | "trash";

export function TgIc({
  name,
  size = 16,
  className = "",
}: {
  name: TgIconName;
  size?: number;
  className?: string;
}) {
  const src = tgAsset(`${name}.svg`);
  return (
    <span
      aria-hidden="true"
      className={`block shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: "currentColor",
        WebkitMaskImage: `url(${src})`,
        maskImage: `url(${src})`,
        WebkitMaskPosition: "center",
        maskPosition: "center",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskSize: "contain",
        maskSize: "contain",
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Чип тега. Контурный: белый с рамкой border/default, радиус 3, текст 12, слева кружок
// цвета тега (6px). Системные чипы (источник, автор, дата) залиты серым — контур и кружок
// отличают «мои теги» от атрибутов встречи. Два размера: 20 в списке, 23 на странице встречи
// ─────────────────────────────────────────────────────────────────────────────

const chipBase =
  "inline-flex shrink-0 items-center rounded-[3px] border text-[12px] leading-[normal] tracking-[-0.24px] whitespace-nowrap";

export function ColorDot({
  color,
  size = 6,
}: {
  color: TagColor | string;
  size?: number;
}) {
  const hex = color.startsWith("#") ? color : tagColorHex(color as TagColor);
  return (
    <span
      aria-hidden="true"
      className="shrink-0 rounded-full"
      style={{ width: size, height: size, backgroundColor: hex }}
    />
  );
}

export function TagChip({
  name,
  color,
  size = 20,
  onRemove,
  onClick,
  maxWidth = 160,
  active,
  buttonRef,
}: {
  name: string;
  color: TagColor;
  size?: 20 | 23 | 24;
  /** Крестик удаления — показывается на ховере */
  onRemove?: () => void;
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
  maxWidth?: number;
  active?: boolean;
  buttonRef?: React.RefObject<HTMLButtonElement | null>;
}) {
  const px = size === 20 ? 6 : 8;
  // Пока открыт поповер/меню этого чипа (active) — серая заливка держится, не только на ховере
  const interactive = onClick
    ? `hover:bg-[#F7F7F8] ${active ? "bg-[#F7F7F8]" : "bg-white"} ${pressableClass} ${focusRingClass}`
    : "bg-white";
  // Пока открыт поповер чипа (active), крестик спрятан и текст стоит на всю ширину, как по умолчанию
  const showRemove = !!onRemove && !active;
  const inner = (
    <>
      <ColorDot color={color} />
      {/* Ширина чипа — по тексту. На ховере крестик накладывается справа, а текст уходит в троеточие,
          чтобы чип не менял ширину и не держал пустоту под крестик */}
      <span
        className={`min-w-0 truncate ${showRemove ? "group-hover/chip:max-w-[calc(100%-26px)] group-focus-within/chip:max-w-[calc(100%-26px)]" : ""}`}
      >
        {name}
      </span>
      {showRemove && (
        <Tip text="Убрать со встречи">
          <span
            role="button"
            tabIndex={0}
            aria-label={`Снять тег «${name}»`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemove();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                onRemove();
              }
            }}
            className={`absolute right-[3px] top-1/2 flex h-[16px] w-[16px] -translate-y-1/2 items-center justify-center rounded-[2px] opacity-0 group-hover/chip:opacity-100 focus-visible:opacity-100 text-[#818AA3] hover:text-[#585E6C] ${pressableClass} ${focusRingClass}`}
          >
            <TgIc name="x-mark" size={12} />
          </span>
        </Tip>
      )}
    </>
  );
  // Рамка у чипов всегда #EFEFEF — активное состояние отличается только заливкой
  const style = {
    height: size,
    maxWidth,
    paddingLeft: px,
    paddingRight: px,
    borderColor: tokens.border,
    color: tokens.black,
  };
  const cls = `group/chip gc-enter relative ${chipBase} gap-[6px] ${interactive}`;
  if (onClick && onRemove) {
    // Чип и крестик оба кликабельны — внешний элемент не <button>, чтобы не вкладывать кнопку в кнопку
    return (
      <span
        ref={buttonRef as React.RefObject<HTMLSpanElement | null>}
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick(e as unknown as React.MouseEvent<HTMLElement>);
          }
        }}
        aria-expanded={active}
        className={cls}
        style={style}
      >
        {inner}
      </span>
    );
  }
  if (onClick) {
    return (
      <button
        ref={buttonRef}
        type="button"
        onClick={onClick}
        aria-expanded={active}
        className={cls}
        style={style}
      >
        {inner}
      </button>
    );
  }
  return (
    <span className={cls} style={style}>
      {inner}
    </span>
  );
}

/** Кнопка добавления в размер чипа: квадрат с плюсом или «+ Подпись», когда тегов еще нет */
export function AddTagChip({
  onClick,
  size = 20,
  active,
  buttonRef,
  className = "",
  label,
  ariaLabel = "Добавить тег",
}: {
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  size?: 20 | 23 | 24;
  active?: boolean;
  buttonRef?: React.RefObject<HTMLButtonElement | null>;
  className?: string;
  /** Текст рядом с плюсом; без него — квадрат */
  label?: string;
  ariaLabel?: string;
}) {
  const px = label ? (size === 20 ? 6 : 8) : 0;
  // gap 6, как между чипами
  const tone = active
    ? "bg-[#F7F7F8] text-[#585E6C] border-[#EFEFEF]"
    : "bg-white text-[#818AA3] border-[#EFEFEF] hover:text-[#585E6C] hover:bg-[#F7F7F8]";
  const btn = (
    <button
      ref={buttonRef}
      type="button"
      aria-label={label ?? ariaLabel}
      aria-expanded={active}
      onClick={onClick}
      className={`${chipBase} justify-center gap-[6px] ${tone} ${pressableClass} ${focusRingClass} ${className}`}
      style={{
        height: size,
        width: label ? undefined : size,
        paddingLeft: px,
        paddingRight: px,
      }}
    >
      <TgIc name="plus" size={12} />
      {/* Подпись — черным, как у чипов тегов; серым остается только плюс */}
      {label && <span className="text-[#212833]">{label}</span>}
    </button>
  );
  // Тултип нужен только квадрату без подписи
  return label ? (
    btn
  ) : (
    <Tip text={ariaLabel} disabled={active}>
      {btn}
    </Tip>
  );
}

/**
 * Ряд чипов в списке встреч (отступ 4). Чип ведет себя как на странице встречи:
 * клик — меню тега под чипом, крестик на ховере — убрать со встречи. «+N» открывает пикер
 */
export function TagChipRow({
  tags,
  meetingId,
  api,
  max = 3,
  size = 20,
  maxWidth = 120,
  onMore,
  moreActive,
  onDeleted,
  direction = "down",
  readOnly = false,
}: {
  tags: Tag[];
  meetingId: string;
  api: TagsApi;
  max?: number;
  size?: 20 | 23;
  maxWidth?: number;
  /** Клик по «+N» — открыть пикер */
  onMore?: (e: React.MouseEvent<HTMLElement>) => void;
  moreActive?: boolean;
  onDeleted?: (tag: Tag, restore: () => void) => void;
  direction?: "down" | "up";
  /** Пошеренная встреча: чипы и «+N» только показываем, без меню, крестиков и пикера */
  readOnly?: boolean;
}) {
  const [menuFor, setMenuFor] = useState<string | null>(null);
  if (tags.length === 0) return null;
  const shown = tags.slice(0, max);
  const rest = tags.slice(max);
  if (readOnly) {
    return (
      <span className="flex min-w-0 items-center gap-[4px]">
        {shown.map((t) => (
          <TagChip
            key={t.id}
            name={t.name}
            color={t.color}
            size={size}
            maxWidth={maxWidth}
          />
        ))}
        {rest.length > 0 && (
          <Tip text={rest.map((t) => t.name).join(", ")}>
            <span
              className={`${chipBase} bg-white px-[6px]`}
              style={{
                height: size,
                borderColor: tokens.border,
                color: tokens.grey,
              }}
            >
              +{rest.length}
            </span>
          </Tip>
        )}
      </span>
    );
  }
  return (
    <span className="flex min-w-0 items-center gap-[4px]">
      {shown.map((t) => (
        <ChipWithMenu
          key={t.id}
          tag={t}
          meetingId={meetingId}
          api={api}
          size={size}
          maxWidth={maxWidth}
          open={menuFor === t.id}
          onToggle={() => setMenuFor((v) => (v === t.id ? null : t.id))}
          onClose={() => setMenuFor(null)}
          onDeleted={onDeleted}
          direction={direction}
        />
      ))}
      {rest.length > 0 && (
        <Tip text={rest.map((t) => t.name).join(", ")}>
          <button
            type="button"
            onClick={onMore}
            aria-expanded={moreActive}
            className={`${chipBase} px-[6px] hover:bg-[#F7F7F8] hover:text-[#585E6C] ${moreActive ? "bg-[#F7F7F8] text-[#585E6C]" : "bg-white text-[#818AA3]"} ${pressableClass} ${focusRingClass}`}
            style={{ height: size, borderColor: tokens.border }}
          >
            +{rest.length}
          </button>
        </Tip>
      )}
    </span>
  );
}

/** Чип с собственным меню — общий для списка встреч и страницы встречи */
export function ChipWithMenu({
  tag,
  meetingId,
  api,
  size = 20,
  maxWidth,
  open,
  onToggle,
  onClose,
  onDeleted,
  direction = "down",
}: {
  tag: Tag;
  meetingId: string;
  api: TagsApi;
  size?: 20 | 23;
  maxWidth?: number;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  onDeleted?: (tag: Tag, restore: () => void) => void;
  direction?: "down" | "up";
}) {
  const ref = useRef<HTMLButtonElement>(null);
  return (
    <span className="relative flex">
      <TagChip
        buttonRef={ref}
        name={tag.name}
        color={tag.color}
        size={size}
        maxWidth={maxWidth}
        active={open}
        onClick={onToggle}
        onRemove={() => api.toggle(meetingId, tag.id)}
      />
      <TagChipMenu
        tag={tag}
        api={api}
        open={open}
        onClose={onClose}
        anchorRef={ref}
        onUnassign={() => api.toggle(meetingId, tag.id)}
        onDeleted={onDeleted}
        direction={direction}
      />
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Чекбокс из DS (6.6)
// ─────────────────────────────────────────────────────────────────────────────

export function Checkbox({ checked }: { checked: boolean }) {
  return checked ? (
    <span
      className="flex h-[14px] w-[14px] shrink-0 items-center justify-center rounded-[2px] text-white"
      style={{ backgroundColor: tokens.blue }}
    >
      <TgIc name="check" size={12} />
    </span>
  ) : (
    <span
      className="h-[14px] w-[14px] shrink-0 rounded-[2px] border"
      style={{ borderColor: tokens.borderStrong }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Поповер выбора тегов для встречи: одно поле «найти или создать», список с чекбоксами,
// строка «Создать «…»» сверху, когда точного совпадения нет. На ховере строки — «…»:
// меню тега рядом (имя, цвет, удаление) — теги общие, править может любой.
// Клавиатура: ↑↓ по строкам, Enter — переключить/создать, Esc — закрыть.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Прозрачная подложка под открытым поповером: лочит фон — клик мимо только закрывает поповер,
 * а не открывает встречу под курсором. Ниже поповера (z-40) и боковых меню (z-50)
 */
function Backdrop({ onClose }: { onClose: () => void }) {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-30"
      onMouseDown={(e) => {
        e.stopPropagation();
        onClose();
      }}
    />
  );
}

export function TagPicker({
  meetingId,
  api,
  open,
  onClose,
  onCreated,
  onDeleted,
  className = "",
  style,
  direction = "down",
  anchorRef,
}: {
  meetingId: string;
  api: TagsApi;
  open: boolean;
  onClose: () => void;
  onCreated?: (tag: Tag) => void;
  /** Тег удален из меню; restore — вернуть (для тоста «Отменить») */
  onDeleted?: (tag: Tag, restore: () => void) => void;
  /** Позиционирование относительно родителя (left-/right-/top-/bottom- классы) */
  className?: string;
  /** Точные координаты, когда позиция считается по layout (страница встречи) */
  style?: React.CSSProperties;
  direction?: "down" | "up";
  /** Триггер — клик по нему не считается кликом вне */
  anchorRef?: React.RefObject<HTMLElement | null>;
}) {
  return (
    <>
      {open && <Backdrop onClose={onClose} />}
      <Popover
        open={open}
        className={`w-[240px] ${className}`}
        style={style}
        direction={direction}
        padding={0}
      >
        {/* Тело живет только пока поповер открыт — поле и курсор сбрасываются сами */}
        <PickerBody
          meetingId={meetingId}
          api={api}
          open={open}
          onClose={onClose}
          onCreated={onCreated}
          onDeleted={onDeleted}
          anchorRef={anchorRef}
        />
      </Popover>
    </>
  );
}

function PickerBody({
  meetingId,
  api,
  open,
  onClose,
  onCreated,
  onDeleted,
  anchorRef,
}: {
  meetingId: string;
  api: TagsApi;
  open: boolean;
  onClose: () => void;
  onCreated?: (tag: Tag) => void;
  onDeleted?: (tag: Tag, restore: () => void) => void;
  anchorRef?: React.RefObject<HTMLElement | null>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  /** Клавиатурный курсор: -1 — ничего не подсвечено (при открытии и когда мышь ушла со списка) */
  const [cursorRaw, setCursorRaw] = useState(-1);
  /** Меню тега («…»): какой тег и где рисовать — смещение строки от верха пикера и сторона */
  const [menu, setMenu] = useState<{
    id: string;
    top: number;
    side: "right" | "left";
  } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  /** Панель нового тега («+ Создать тег»): где рисовать */
  const [createMenu, setCreateMenu] = useState<{
    top: number;
    side: "right" | "left";
  } | null>(null);
  const createMenuRef = useRef<HTMLDivElement>(null);
  useOutsideClose(
    anchorRef
      ? [ref, menuRef, createMenuRef, anchorRef]
      : [ref, menuRef, createMenuRef],
    open,
    onClose,
  );

  const assigned = new Set(api.tagsFor(meetingId).map((t) => t.id));
  const menuTag = menu ? (api.tagById(menu.id) ?? null) : null;

  /** Где рисовать боковое меню для строки: смещение от верха пикера и сторона (слева, если справа не влезает) */
  const placeBeside = (rowEl: HTMLElement) => {
    const box = ref.current?.getBoundingClientRect();
    const row = rowEl.getBoundingClientRect();
    // Минус паддинг меню (4) и паддинг блока с полем (4): поле имени (32px) встает ровно
    // напротив строки пикера (тоже 32px)
    return {
      top: box ? row.top - box.top - 8 : 0,
      side: (box && window.innerWidth - box.right < 260 ? "left" : "right") as
        "right" | "left",
    };
  };
  /** Открыть меню тега рядом с его строкой */
  const openMenu = (tagId: string, rowEl: HTMLElement) => {
    setCreateMenu(null);
    setMenu((m) =>
      m?.id === tagId ? null : { id: tagId, ...placeBeside(rowEl) },
    );
  };

  const rows = api.tags;

  // Курсор не выходит за список; -1 — ничего не подсвечено
  const cursor = Math.min(cursorRaw, rows.length - 1);

  // Цвет нового тега по умолчанию — следующий по кругу палитры (без серого)
  const palette = TAG_COLORS.slice(1);
  const nextColor = palette[api.tags.length % palette.length].id;

  const act = (tag: Tag) => api.toggle(meetingId, tag.id);

  /** «+ Создать тег» — панель нового тега сбоку от строки */
  const openCreate = (rowEl: HTMLElement) => {
    setMenu(null);
    setCreateMenu((m) => (m ? null : placeBeside(rowEl)));
  };
  const create = (name: string, color: TagColor) => {
    const tag = api.create(name, meetingId, color);
    if (tag) onCreated?.(tag);
    setCreateMenu(null);
    ref.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (menu || createMenu) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursorRaw(Math.min(rows.length - 1, cursor + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursorRaw(Math.max(0, cursor - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (cursor >= 0) act(rows[cursor]);
    }
  };

  const createRowRef = useRef<HTMLDivElement>(null);
  // Фокус в пикер один раз при открытии — для стрелок/Enter/Esc. Inline ref-колбэк для этого не годится:
  // React пересоздает его на каждый рендер и фокус утекал из поля имени в меню тега
  useEffect(() => {
    ref.current?.focus();
  }, []);

  const rowClass = `group/row relative flex h-[32px] w-full items-center gap-[8px] rounded-[3px] px-[8px] text-left ${pressableClass} ${focusRingClass}`;

  return (
    <div
      ref={ref}
      tabIndex={-1}
      className="relative flex flex-col outline-none"
      onKeyDown={onKeyDown}
    >
      {createMenu && (
        <NewTagMenu
          ref={createMenuRef}
          api={api}
          initialName=""
          initialColor={nextColor}
          top={createMenu.top}
          side={createMenu.side}
          onCreate={create}
          onClose={() => setCreateMenu(null)}
        />
      )}
      {menuTag && menu && (
        <TagMenu
          // key по тегу: при переходе с одной строки на другую меню пересоздается,
          // иначе поле имени осталось бы со старым (или пустым) значением
          key={menuTag.id}
          ref={menuRef}
          tag={menuTag}
          api={api}
          top={menu.top}
          side={menu.side}
          onClose={() => setMenu(null)}
          onDeleted={onDeleted}
          onUnassign={
            assigned.has(menuTag.id)
              ? () => api.toggle(meetingId, menuTag.id)
              : undefined
          }
        />
      )}
      {/* Создание — первой строкой, как «Создать отчет» в дропдауне отчетов; сбоку откроется панель имени и цвета */}
      <div
        className={`p-[4px] ${rows.length > 0 ? "border-b" : ""}`}
        style={{ borderColor: tokens.border }}
      >
        <div
          ref={createRowRef}
          className={createMenu ? "rounded-[3px] bg-[#F7F7F8]" : ""}
        >
          <MenuRow
            icon="plus"
            label="Создать тег"
            onClick={() =>
              createRowRef.current && openCreate(createRowRef.current)
            }
          />
        </div>
      </div>
      {/* Без тегов список не рисуем — остается одна строка «Создать тег» */}
      {rows.length > 0 && (
        <div
          className="tg-scroll max-h-[232px] overflow-y-auto p-[4px]"
          role="listbox"
          aria-label="Теги"
          onMouseLeave={() => setCursorRaw(-1)}
        >
          {rows.map((tag, i) => {
            const hot = i === cursor;
            const row = { tag };
            const on = assigned.has(row.tag.id);
            const menuOpen = menu?.id === row.tag.id;
            return (
              <div
                key={row.tag.id}
                role="option"
                aria-selected={hot}
                aria-checked={on}
                tabIndex={-1}
                onMouseEnter={() => setCursorRaw(i)}
                onClick={() => act(row.tag)}
                className={`${rowClass} cursor-pointer ${hot || menuOpen ? "bg-[#F7F7F8]" : ""}`}
                style={{ color: tokens.black }}
              >
                <Checkbox checked={on} />
                <span className="flex h-[14px] w-[14px] shrink-0 items-center justify-center">
                  <ColorDot color={row.tag.color} size={8} />
                </span>
                {/* Имя — на всю ширину строки; на ховере/подсветке справа освобождается место под «…» и имя уходит в троеточие */}
                <span
                  className={`min-w-0 flex-1 truncate text-[13px] leading-[16px] tracking-[-0.13px] group-hover/row:pr-[24px] ${hot || menuOpen ? "pr-[24px]" : ""}`}
                >
                  {row.tag.name}
                </span>
                {/* «…» — меню тега (имя, цвет, удаление); лежит поверх строки справа, виден на ховере, при подсветке и пока меню открыто */}
                <button
                  type="button"
                  aria-label={`Меню тега «${row.tag.name}»`}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  onClick={(e) => {
                    e.stopPropagation();
                    openMenu(
                      row.tag.id,
                      e.currentTarget.closest("[role=option]") as HTMLElement,
                    );
                  }}
                  className={`absolute right-[4px] top-1/2 flex h-[24px] w-[24px] -translate-y-1/2 items-center justify-center rounded-[3px] ${hot || menuOpen ? "opacity-100" : "opacity-0"} ${menuOpen ? "text-[#585E6C]" : "text-[#818AA3] hover:text-[#585E6C]"} group-hover/row:opacity-100 focus-visible:opacity-100 ${pressableClass} ${focusRingClass}`}
                >
                  <Ic name="ellipsis-horizontal" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Панель нового тега сбоку от строки «Создать тег»: имя и цвет.
 * Enter или кнопка «Создать» — тег создается и сразу ставится на встречу
 */
const NewTagMenu = forwardRef<
  HTMLDivElement,
  {
    api: TagsApi;
    initialName: string;
    initialColor: TagColor;
    top: number;
    side: "right" | "left";
    onCreate: (name: string, color: TagColor) => void;
    onClose: () => void;
  }
>(function NewTagMenu(
  { api, initialName, initialColor, top, side, onCreate, onClose },
  ref,
) {
  const [name, setName] = useState(initialName);
  const [color, setColor] = useState<TagColor>(initialColor);
  const trimmed = name.trim();
  const clash =
    trimmed.length > 0 &&
    api.tags.some((t) => normalizeName(t.name) === normalizeName(trimmed));
  // Лимит не режем молча: даем дописать и показываем ошибку под полем
  const tooLong = trimmed.length > TAG_NAME_MAX;
  const error = tooLong
    ? `Не больше ${TAG_NAME_MAX} символов`
    : clash
      ? "Такой тег уже есть"
      : null;
  const canCreate = trimmed.length > 0 && !clash && !tooLong;
  const m = usePopoverMotion("down");
  const pos: React.CSSProperties =
    side === "right"
      ? { top, left: "calc(100% + 4px)" }
      : { top, right: "calc(100% + 4px)" };
  const submit = () => {
    if (canCreate) onCreate(trimmed, color);
  };
  return (
    <motion.div
      ref={ref}
      role="dialog"
      aria-label="Новый тег"
      {...m}
      className="absolute z-50 w-[240px] rounded-[4px] bg-white p-[4px]"
      style={{
        ...pos,
        boxShadow: shadow,
        transformOrigin: side === "left" ? "top right" : "top left",
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.nativeEvent.stopImmediatePropagation();
          e.stopPropagation();
          onClose();
        } else if (
          e.key === "Enter" &&
          !(e.target instanceof HTMLButtonElement)
        ) {
          // Enter где угодно в панели (не на кнопке цвета) — создать
          e.preventDefault();
          e.stopPropagation();
          submit();
        }
      }}
    >
      <div className="p-[4px]">
        <label
          className={`flex h-[32px] items-center gap-[8px] rounded-[4px] border bg-white px-[8px] ${error ? "border-[#CC3333]" : "border-[#EFEFEF] focus-within:border-[#0138C7]"} ${pressableClass}`}
        >
          <input
            autoFocus
            value={name}
            placeholder="Название"
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
            aria-label="Название нового тега"
            aria-invalid={!!error}
            className="min-w-0 flex-1 bg-transparent text-[13px] leading-[16px] tracking-[-0.13px] outline-none placeholder:text-[#C7C8CA]"
            style={{ color: tokens.black }}
          />
        </label>
        {error && (
          <p
            className="px-[2px] pt-[6px] text-[12px] leading-[14px] tracking-[-0.24px]"
            style={{ color: tokens.red }}
          >
            {error}
          </p>
        )}
      </div>
      <ColorRow value={color} onPick={setColor} />
      {/* Явная кнопка на всю ширину: команде было неочевидно, что тег создается по Enter. Enter работает по-прежнему */}
      <div className="p-[4px]">
        <Button
          variant="primary"
          onClick={submit}
          disabled={!canCreate}
          className="w-full"
        >
          Создать
        </Button>
      </div>
    </motion.div>
  );
});

/** Цвета в один ряд: кружок 16 в цели 24, у выбранного — кольцо своего цвета. Общий для меню тега и панели создания */
function ColorRow({
  value,
  onPick,
}: {
  value: TagColor;
  onPick: (c: TagColor) => void;
}) {
  return (
    <div
      className="flex items-center justify-between px-[8px] py-[6px]"
      role="radiogroup"
      aria-label="Цвет тега"
    >
      {TAG_COLORS.map((c) => {
        const on = c.id === value;
        return (
          <button
            key={c.id}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={c.label}
            title={c.label}
            onClick={() => onPick(c.id)}
            className={`tg-swatch flex h-[24px] w-[24px] items-center justify-center rounded-full ${pressableClass} ${focusRingClass}`}
          >
            {/* Выбранный — тонкое кольцо своего цвета через белый зазор; на ховере у остальных — серое (в globals.css) */}
            <span
              className="tg-dot block h-[16px] w-[16px] rounded-full"
              style={{
                backgroundColor: c.hex,
                boxShadow: on
                  ? `0 0 0 2px #FFFFFF, 0 0 0 3.5px ${c.hex}`
                  : undefined,
              }}
            />
          </button>
        );
      })}
    </div>
  );
}

/**
 * Меню тега рядом со строкой пикера (как у опций в Notion): поле имени, цвета, удаление.
 * Список не пропадает, состояние одно. Имя сохраняется по Enter и при закрытии.
 * Удаление без подтверждения — отмена через тост «Тег удален · Отменить» (дизайнер, 2026-09-21).
 */
const TagMenu = forwardRef<
  HTMLDivElement,
  {
    tag: Tag;
    api: TagsApi;
    /** «beside» — сбоку от строки пикера (top/side), «below»/«above» — под/над якорем (чип) */
    placement?: "beside" | "below" | "above";
    top?: number;
    side?: "right" | "left";
    onClose: () => void;
    onDeleted?: (tag: Tag, restore: () => void) => void;
    /** Открепить тег от текущей встречи — только в меню с чипа встречи */
    onUnassign?: () => void;
  }
>(function TagMenu(
  {
    tag,
    api,
    placement = "beside",
    top = 0,
    side = "right",
    onClose,
    onDeleted,
    onUnassign,
  },
  ref,
) {
  const [name, setName] = useState(tag.name);
  const trimmed = name.trim();
  const clash =
    trimmed.length > 0 &&
    api.tags.some(
      (t) =>
        t.id !== tag.id && normalizeName(t.name) === normalizeName(trimmed),
    );
  const tooLong = trimmed.length > TAG_NAME_MAX;
  const error = tooLong
    ? `Не больше ${TAG_NAME_MAX} символов`
    : clash
      ? "Такой тег уже есть"
      : null;
  const canSave =
    trimmed.length > 0 && !clash && !tooLong && trimmed !== tag.name;

  // Имя применяется по мере ввода — чип и строки списка меняются сразу; пустое, дубль или слишком длинное не сохраняются
  const change = (v: string) => {
    setName(v);
    const t = v.trim();
    const dup = api.tags.some(
      (x) => x.id !== tag.id && normalizeName(x.name) === normalizeName(t),
    );
    if (t.length > 0 && t.length <= TAG_NAME_MAX && !dup && t !== tag.name)
      api.rename(tag.id, t);
  };
  const save = () => {
    if (canSave) api.rename(tag.id, trimmed);
  };
  const close = () => {
    save();
    onClose();
  };
  // Удаление — через модалку подтверждения: тег общий на пространство и уйдет у всех
  const [confirm, setConfirm] = useState(false);
  const remove = () => setConfirm(true);
  const confirmRemove = () => {
    const snapshot = api.remove(tag.id);
    if (snapshot) onDeleted?.(tag, () => api.restore(snapshot));
    setConfirm(false);
    onClose();
  };
  const m = usePopoverMotion(placement === "above" ? "up" : "down");
  const beside = placement === "beside";
  const pos: React.CSSProperties = beside
    ? side === "right"
      ? { top, left: "calc(100% + 4px)" }
      : { top, right: "calc(100% + 4px)" }
    : placement === "above"
      ? { bottom: "calc(100% + 4px)", left: 0 }
      : { top: "calc(100% + 4px)", left: 0 };
  const origin = beside
    ? side === "left"
      ? "top right"
      : "top left"
    : placement === "above"
      ? "bottom left"
      : "top left";

  return (
    <motion.div
      ref={ref}
      role="menu"
      {...m}
      className="absolute z-50 w-[240px] rounded-[4px] bg-white p-[4px]"
      style={{ ...pos, boxShadow: shadow, transformOrigin: origin }}
      onKeyDown={(e) => {
        // Esc в меню — закрыть только меню. React в App Router слушает на document, как и Esc поповера
        if (e.key === "Escape") {
          e.nativeEvent.stopImmediatePropagation();
          e.stopPropagation();
          onClose();
        } else if (
          e.key === "Enter" &&
          !(e.target instanceof HTMLButtonElement)
        ) {
          // Enter где угодно в меню (не на строке цвета) — сохранить имя и закрыть
          e.preventDefault();
          e.stopPropagation();
          close();
        }
      }}
    >
      <div className="p-[4px]">
        <label
          className={`flex h-[32px] items-center gap-[8px] rounded-[4px] border bg-white px-[8px] ${error ? "border-[#CC3333]" : "border-[#EFEFEF] focus-within:border-[#0138C7]"} ${pressableClass}`}
        >
          <input
            value={name}
            onChange={(e) => change(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") close();
            }}
            onBlur={save}
            aria-label="Название тега"
            aria-invalid={!!error}
            className="min-w-0 flex-1 bg-transparent text-[13px] leading-[16px] tracking-[-0.13px] outline-none"
            style={{ color: tokens.black }}
          />
        </label>
        {error && (
          <p
            className="px-[2px] pt-[6px] text-[12px] leading-[14px] tracking-[-0.24px]"
            style={{ color: tokens.red }}
          >
            {error}
          </p>
        )}
      </div>
      <ColorRow value={tag.color} onPick={(c) => api.setColor(tag.id, c)} />

      <MenuDivider />
      {onUnassign && (
        <MenuRow
          icon="x-mark"
          label="Убрать со встречи"
          onClick={() => {
            onUnassign();
            onClose();
          }}
        />
      )}
      <MenuRow
        icon="trash"
        label={onUnassign ? "Удалить тег" : "Удалить"}
        danger
        onClick={remove}
      />
      <ConfirmDeleteTag
        open={confirm}
        name={tag.name}
        meetings={api.usage(tag.id).meetings}
        onCancel={() => setConfirm(false)}
        onConfirm={confirmRemove}
      />
    </motion.div>
  );
});

/**
 * Модалка подтверждения удаления тега (Figma 47291:70): затемнение, шапка с иконкой, вопрос,
 * последствия для всех участников и число встреч, футер с «Отменить» и синей «Удалить».
 * Через портал — меню тега лежит в трансформированном motion.div, fixed внутри него не работает
 */
function ConfirmDeleteTag({
  open,
  name,
  meetings,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  name: string;
  meetings: number;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const reduce = useReducedMotion();
  const text =
    meetings > 0
      ? `Тег исчезнет у всех участников рабочего пространства и снимется с ${pluralMeetingsGen(meetings)}. Сами встречи останутся.`
      : "Тег исчезнет у всех участников рабочего пространства.";
  // События модалки не должны доходить до меню/пикера под ней и до их document-слушателей
  const stop = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
  };
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-center justify-center"
          style={{ backgroundColor: "rgba(33, 40, 51, 0.3)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.15, ease: easeOut } }}
          transition={{ duration: 0.2, ease: easeOut }}
          role="dialog"
          aria-modal
          aria-labelledby="tg-confirm-title"
          onMouseDown={(e) => {
            stop(e);
            if (e.target === e.currentTarget) onCancel();
          }}
          onClick={stop}
          onKeyDown={(e) => {
            stop(e);
            if (e.key === "Escape") onCancel();
          }}
        >
          <motion.div
            className="flex w-[500px] flex-col rounded-[4px] bg-white"
            style={{ boxShadow: shadow }}
            initial={
              reduce ? { opacity: 0 } : { opacity: 0, transform: "scale(0.97)" }
            }
            animate={
              reduce ? { opacity: 1 } : { opacity: 1, transform: "scale(1)" }
            }
            exit={
              reduce
                ? { opacity: 0, transition: { duration: 0 } }
                : {
                    opacity: 0,
                    transform: "scale(0.98)",
                    transition: { duration: 0.15, ease: easeOut },
                  }
            }
            transition={{ duration: 0.22, ease: easeOut }}
          >
            <div
              className="flex items-center justify-between gap-[10px] rounded-t-[4px] border-b p-[16px]"
              style={{ borderColor: tokens.border }}
            >
              <div className="flex min-w-0 flex-1 items-center gap-[8px]">
                <span className="flex" style={{ color: tokens.grey }}>
                  <TgIc name="tag" />
                </span>
                <span
                  className="text-[14px] font-medium leading-[1.35] tracking-[-0.28px]"
                  style={{ color: tokens.black }}
                >
                  Удаление тега
                </span>
              </div>
              {/* Крестик как в других модалках лаборатории (Figma 6932:1962): серый круг 16 с иконкой 10 */}
              <button
                type="button"
                aria-label="Закрыть"
                onClick={onCancel}
                className={`flex h-[16px] w-[16px] shrink-0 items-center justify-center rounded-full hover:bg-[#EFEFEF] ${pressableClass} ${focusRingClass}`}
                style={{ backgroundColor: tokens.bgSubtle, color: tokens.grey }}
              >
                <Ic name="x-mark" size={10} />
              </button>
            </div>
            <div className="flex flex-col gap-[12px] px-[16px] py-[24px]">
              <h2
                id="tg-confirm-title"
                className="text-[16px] font-medium leading-[normal] tracking-[-0.32px]"
                style={{ color: tokens.black }}
              >
                Удалить тег «{name}»?
              </h2>
              <p
                className="text-[13px] leading-[16px] tracking-[-0.13px]"
                style={{ color: tokens.black }}
              >
                {text}
              </p>
            </div>
            <div
              className="flex items-center justify-end gap-[8px] rounded-b-[4px] border-t p-[16px]"
              style={{
                backgroundColor: tokens.bgSubtle,
                borderColor: tokens.border,
              }}
            >
              <button
                type="button"
                onClick={onCancel}
                className={`flex h-[36px] items-center justify-center rounded-[4px] px-[12px] text-[13px] leading-[normal] tracking-[-0.13px] hover:bg-[#EFEFEF] ${pressableClass} ${focusRingClass}`}
                style={{ color: tokens.black }}
              >
                Отменить
              </button>
              <button
                type="button"
                autoFocus
                onClick={onConfirm}
                className={`flex h-[36px] items-center justify-center rounded-[4px] bg-[#0138C7] px-[12px] text-[13px] font-medium leading-[normal] tracking-[-0.13px] text-white hover:bg-[#0032B1] ${pressableClass} ${focusRingClass}`}
              >
                Удалить
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/**
 * Меню тега под чипом (страница встречи): то же меню, что у «…» в пикере — имя, цвет, удаление,
 * плюс «Убрать со встречи». Родитель чипа должен быть relative
 */
export function TagChipMenu({
  tag,
  api,
  open,
  onClose,
  anchorRef,
  onUnassign,
  onDeleted,
  direction = "down",
}: {
  tag: Tag;
  api: TagsApi;
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  onUnassign: () => void;
  onDeleted?: (tag: Tag, restore: () => void) => void;
  /** «up» — у нижних строк списка, чтобы меню не ушло за край окна */
  direction?: "down" | "up";
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  useOutsideClose([menuRef, anchorRef], open, onClose);
  return (
    <>
      {open && <Backdrop onClose={onClose} />}
      <AnimatePresence>
        {open && (
          <TagMenu
            key={tag.id}
            ref={menuRef}
            tag={tag}
            api={api}
            placement={direction === "up" ? "above" : "below"}
            onClose={onClose}
            onUnassign={onUnassign}
            onDeleted={onDeleted}
          />
        )}
      </AnimatePresence>
    </>
  );
}
