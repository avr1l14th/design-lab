"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { Ic, type IconName } from "./icons";
import { easeOut, focusRingClass, pressableClass, shadow, tokens } from "./tokens";

// ─────────────────────────────────────────────────────────────────────────────
// Хелперы
// ─────────────────────────────────────────────────────────────────────────────

/** Закрытие поповера по клику вне и Escape */
export function useOutsideClose(refs: RefObject<HTMLElement | null>[], open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target;
      if (!(t instanceof Node)) return;
      if (refs.some((r) => r.current?.contains(t))) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, onClose]);
}

// Вход 180ms ease-out, выход быстрее (120ms) — уходящее не должно задерживать внимание
const popoverMotion = {
  initial: { opacity: 0, transform: "translateY(-6px) scale(0.965)" },
  animate: { opacity: 1, transform: "translateY(0px) scale(1)" },
  exit: { opacity: 0, transform: "translateY(-2px) scale(0.985)" },
} as const;

const popoverMotionUp = {
  initial: { opacity: 0, transform: "translateY(6px) scale(0.965)" },
  animate: { opacity: 1, transform: "translateY(0px) scale(1)" },
  exit: { opacity: 0, transform: "translateY(2px) scale(0.985)" },
} as const;

export function usePopoverMotion(direction: "down" | "up" = "down") {
  const reduce = useReducedMotion();
  const m = direction === "up" ? popoverMotionUp : popoverMotion;
  return {
    initial: reduce ? { opacity: 0 } : m.initial,
    animate: reduce ? { opacity: 1 } : m.animate,
    exit: reduce ? { opacity: 0, transition: { duration: 0 } } : { ...m.exit, transition: { duration: 0.12, ease: easeOut } },
    transition: reduce ? { duration: 0 } : { duration: 0.18, ease: easeOut },
  };
}

/** Точка роста поповера — у триггера: по горизонтали читаем из позиционирующих классов, по вертикали из direction */
function popoverOrigin(className: string, direction: "down" | "up") {
  const x = /\bright-/.test(className) ? "right" : /\bleft-/.test(className) ? "left" : "center";
  return `${direction === "up" ? "bottom" : "top"} ${x}`;
}

/** Поповер-панель (white, radius 4, shadow/default). Позиционируется родителем. */
export function Popover({
  open,
  children,
  className = "",
  style,
  direction = "down",
  padding = 4,
}: {
  open: boolean;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  direction?: "down" | "up";
  padding?: number;
}) {
  const m = usePopoverMotion(direction);
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          {...m}
          style={{ boxShadow: shadow, padding, transformOrigin: popoverOrigin(className, direction), ...style }}
          className={`absolute z-40 rounded-[4px] bg-white ${className}`}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Кнопки
// ─────────────────────────────────────────────────────────────────────────────

export function Button({
  children,
  icon,
  variant = "secondary",
  onClick,
  disabled,
  className = "",
  type = "button",
  title,
}: {
  children?: ReactNode;
  icon?: IconName;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
  title?: string;
}) {
  const styles: Record<string, string> = {
    primary: "bg-[#0138C7] text-white hover:bg-[#0032B1] disabled:bg-[#809BE3]",
    secondary: "bg-[#EFEFEF] text-[#212833] hover:bg-[#DDDEDF] disabled:bg-[#F7F7F8] disabled:text-[#C7C8CA]",
    ghost: "bg-transparent text-[#212833] hover:bg-[#F7F7F8]",
    danger: "bg-[#F7F7F8] text-[#CC3333] hover:bg-[#EFEFEF]",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`flex h-[32px] shrink-0 items-center justify-center gap-[6px] rounded-[4px] px-[10px] text-[13px] font-medium leading-none tracking-[-0.13px] ${styles[variant]} ${pressableClass} ${focusRingClass} disabled:cursor-not-allowed ${className}`}
    >
      {icon && <Ic name={icon} />}
      {children}
    </button>
  );
}

export function IconButton({
  icon,
  label,
  onClick,
  active,
  size = 32,
  iconSize = 16,
  className = "",
  color,
  tipPlacement = "bottom",
  disabled,
}: {
  icon: IconName;
  label: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  active?: boolean;
  size?: number;
  iconSize?: number;
  className?: string;
  color?: string;
  tipPlacement?: "top" | "bottom";
  disabled?: boolean;
}) {
  return (
    <Tip text={label} placement={tipPlacement}>
      <button
        type="button"
        aria-label={label}
        aria-pressed={active}
        onClick={onClick}
        disabled={disabled}
        style={{ width: size, height: size, color: color ?? (active ? tokens.black : tokens.grey) }}
        className={`flex shrink-0 items-center justify-center rounded-[4px] hover:bg-[#F7F7F8] hover:text-[#585E6C] disabled:cursor-not-allowed disabled:opacity-40 ${active ? "bg-[#F7F7F8]" : ""} ${pressableClass} ${focusRingClass} ${className}`}
      >
        <Ic name={icon} size={iconSize} />
      </button>
    </Tip>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Меню
// ─────────────────────────────────────────────────────────────────────────────

export function MenuRow({
  icon,
  label,
  description,
  onClick,
  danger,
  active,
  trailing,
  disabled,
}: {
  icon?: IconName;
  label: string;
  description?: string;
  onClick?: () => void;
  danger?: boolean;
  active?: boolean;
  trailing?: ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-center gap-[8px] rounded-[3px] px-[8px] text-left hover:bg-[#F7F7F8] disabled:cursor-not-allowed disabled:opacity-40 ${description ? "min-h-[40px] py-[6px]" : "h-[32px]"} ${pressableClass} ${focusRingClass}`}
      style={{ color: danger ? tokens.red : tokens.black }}
    >
      {icon && (
        <span className="flex h-[16px] w-[16px] shrink-0 items-center justify-center" style={{ color: danger ? tokens.red : active ? tokens.black : tokens.grey }}>
          <Ic name={icon} />
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col gap-[1px]">
        <span className="truncate text-[13px] leading-[16px] tracking-[-0.13px]">{label}</span>
        {description && (
          <span className="truncate text-[12px] leading-[14px] tracking-[-0.24px]" style={{ color: tokens.grey }}>
            {description}
          </span>
        )}
      </span>
      {trailing}
      {active && !trailing && (
        <span className="flex h-[16px] w-[16px] shrink-0 items-center justify-center" style={{ color: tokens.black }}>
          <Ic name="check" />
        </span>
      )}
    </button>
  );
}

export function MenuDivider() {
  return <div className="my-[4px] h-px w-full" style={{ backgroundColor: tokens.border }} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Тултип — полупрозрачный черный с блюром, порталом в body
// ─────────────────────────────────────────────────────────────────────────────

type TipState = { text: string; left: number; top: number; placement: "top" | "bottom" };

/** Момент, когда последний тултип скрылся: соседние тултипы после этого открываются без задержки */
let lastTipHiddenAt = 0;
const TIP_INSTANT_WINDOW_MS = 600;

export function Tip({
  text,
  placement = "bottom",
  children,
  delay = 350,
  disabled,
}: {
  text: string;
  placement?: "top" | "bottom";
  children: ReactNode;
  delay?: number;
  disabled?: boolean;
}) {
  // tip появляется только после наведения, т.е. уже на клиенте — портал безопасен без флага mounted
  const [tip, setTip] = useState<TipState | null>(null);
  const [visible, setVisible] = useState(false);
  const [instant, setInstant] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const show = (e: React.MouseEvent<HTMLElement>) => {
    if (disabled) return;
    // Обертка display:contents не имеет бокса — меряем первый реальный элемент
    const anchor = (e.currentTarget.firstElementChild as HTMLElement | null) ?? e.currentTarget;
    const rect = anchor.getBoundingClientRect();
    const next: TipState = {
      text,
      left: rect.left + rect.width / 2,
      top: placement === "top" ? rect.top - 6 : rect.bottom + 6,
      placement,
    };
    setTip(next);
    // Только что показывали соседний тултип — открываем сразу и без анимации
    const quick = Date.now() - lastTipHiddenAt < TIP_INSTANT_WINDOW_MS;
    setInstant(quick);
    if (timer.current) clearTimeout(timer.current);
    if (quick) setVisible(true);
    else timer.current = setTimeout(() => setVisible(true), delay);
  };
  const hide = () => {
    if (timer.current) clearTimeout(timer.current);
    if (visible) lastTipHiddenAt = Date.now();
    setVisible(false);
  };

  return (
    <span className="contents" onMouseEnter={show} onMouseLeave={hide} onMouseDown={hide}>
      {children}
      {tip &&
        createPortal(
          <span
            role="tooltip"
            className={`pointer-events-none fixed z-[70] w-max max-w-[240px] rounded-[3px] p-[8px] text-left text-[10px] font-normal leading-[normal] tracking-[-0.1px] text-white ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none ${instant ? "" : "transition-[opacity,transform]"}`}
            style={{
              left: tip.left,
              top: tip.top,
              opacity: visible ? 1 : 0,
              transitionDuration: visible ? "125ms" : "90ms",
              transformOrigin: tip.placement === "top" ? "bottom center" : "top center",
              transform: `translateX(-50%) ${tip.placement === "top" ? "translateY(-100%)" : ""} scale(${visible ? 1 : 0.97})`,
              backgroundColor: "rgba(33,40,51,0.4)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
            }}
          >
            {tip.text}
          </span>,
          document.body,
        )}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Тост (как CopiedToast/UndoToast из task-improvements)
// ─────────────────────────────────────────────────────────────────────────────

export type ToastState = { message: string; icon?: IconName; undo?: () => void } | null;

export function useToast() {
  const [toast, setToast] = useState<ToastState>(null);
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((message: string, opts?: { undo?: () => void; icon?: IconName; duration?: number }) => {
    setToast({ message, undo: opts?.undo, icon: opts?.icon ?? (opts?.undo ? undefined : "check-circle") });
    setVisible(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setVisible(false), opts?.duration ?? (opts?.undo ? 5000 : 2000));
  }, []);

  const hide = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setVisible(false);
  }, []);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return { toast, visible, show, hide };
}

export function ToastHost({ toast, visible, onHide }: { toast: ToastState; visible: boolean; onHide: () => void }) {
  return (
    <div
      className={`absolute bottom-[24px] left-1/2 z-50 flex h-[36px] items-center gap-[8px] rounded-[4px] py-[10px] pl-[12px] transition-[opacity,transform] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none ${toast?.undo ? "pr-[6px]" : "pr-[12px]"}`}
      style={{
        backgroundColor: tokens.black,
        transitionDuration: visible ? "200ms" : "150ms",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(-50%) translateY(0px) scale(1)" : "translateX(-50%) translateY(8px) scale(0.97)",
        pointerEvents: visible && toast?.undo ? "auto" : "none",
      }}
      role="status"
      aria-hidden={!visible}
    >
      {toast?.icon && (
        <span className="text-white">
          <Ic name={toast.icon} />
        </span>
      )}
      <span className="whitespace-nowrap text-[13px] font-medium leading-[normal] tracking-[-0.13px] text-white">{toast?.message}</span>
      {toast?.undo && (
        <>
          <span aria-hidden="true" className="h-[16px] w-px shrink-0 bg-white/20" />
          <button
            type="button"
            onClick={() => {
              toast.undo?.();
              onHide();
            }}
            className={`rounded-[3px] px-[6px] py-[2px] text-[13px] font-medium leading-[normal] tracking-[-0.13px] text-white/80 hover:text-white ${pressableClass} ${focusRingClass}`}
          >
            Отменить
          </button>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Мелочи
// ─────────────────────────────────────────────────────────────────────────────

const AVATAR_COLORS = ["#26BF00", "#8A38F5", "#F87527", "#0138C7", "#7000E0", "#D82020", "#0DACAA", "#F2C300"];

export function avatarColor(name: string) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 997;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export function Avatar({ name, size = 16 }: { name: string; size?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full font-medium text-white"
      style={{ width: size, height: size, backgroundColor: avatarColor(name), fontSize: Math.round(size * 0.56), letterSpacing: "-0.18px" }}
      title={name}
    >
      {name.charAt(0)}
    </span>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Поиск",
  autoFocus,
  className = "",
  size = 32,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
  size?: number;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div
      className={`flex items-center gap-[8px] rounded-[4px] border bg-white px-[8px] ${pressableClass} ${className}`}
      style={{ height: size, borderColor: focused ? tokens.blue : tokens.border, color: tokens.grey }}
    >
      <Ic name="magnifying-glass" />
      <input
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-[13px] leading-[16px] tracking-[-0.13px] outline-none placeholder:text-[#C7C8CA]"
        style={{ color: tokens.black }}
      />
      {value && (
        <button type="button" aria-label="Очистить" onClick={() => onChange("")} className="flex h-[16px] w-[16px] items-center justify-center hover:text-[#585E6C]">
          <Ic name="x-mark" size={14} />
        </button>
      )}
    </div>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <span
      className="inline-flex h-[16px] min-w-[16px] items-center justify-center rounded-[2px] border px-[4px] text-[10px] font-medium leading-none tracking-[-0.1px]"
      style={{ borderColor: tokens.borderStrong, color: tokens.grey }}
    >
      {children}
    </span>
  );
}

/** Ховер-строка с иконкой + подписью, для секций */
export function SectionLabel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`text-[12px] font-medium leading-[normal] tracking-[-0.24px] ${className}`} style={{ color: tokens.grey }}>
      {children}
    </span>
  );
}

/** Бейдж режима (для списков и заголовков) */
export function ModeBadge({ icon, label, muted }: { icon: IconName; label: string; muted?: boolean }) {
  return (
    <span
      className="inline-flex h-[20px] items-center gap-[4px] rounded-[3px] px-[6px] text-[12px] font-medium leading-none tracking-[-0.24px]"
      style={{ backgroundColor: muted ? tokens.bgSubtle : tokens.blueSea, color: muted ? tokens.grey : tokens.blue }}
    >
      <Ic name={icon} size={12} />
      {label}
    </span>
  );
}
