"use client";

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  MEETINGS,

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
  type WebSource,
  type AnswerTable,
  type Suggestion,
  type Thumb,
} from "./data";
import { Ic, type IconName } from "./icons";
import { MODE_AVATAR_ART, MODE_GLYPH_16 } from "./mode-avatar-art";
import { aiAsset, composerShadow, ctaAsset, easeOut, focusRingClass, gcAsset, popoverShadow, pressableClass, sfAsset, shadow, tokens } from "./tokens";
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
export function ThumbStack({ ids, muted = false }: { ids: string[]; /** Заблокированное поле (46891:6123): миниатюры на 50%, «+N» и текст — text/disabled */ muted?: boolean }) {
  const shown = ids.length <= 3 ? ids : ids.slice(0, 2);
  const extra = ids.length - shown.length;
  // Каждая следующая плашка выше предыдущей — иначе позиционированная миниатюра всплывает над «+N»
  // Плашка 26×16, обводка 1.5px — внешняя (тень), цвет фона кнопки: белая в покое, grey-20 на ховере
  const tileClass = `relative flex h-[16px] w-[26px] shrink-0 items-center justify-center overflow-hidden rounded-[2px] shadow-[0_0_0_1.5px_#FFFFFF] group-hover/tool:shadow-[0_0_0_1.5px_#F7F7F8] transition-shadow duration-[120ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none`;
  return (
    <span className="isolate flex items-center">
      {shown.map((id, i) => (
        <span key={id} className={`${tileClass} ${i < shown.length - 1 || extra > 0 ? "mr-[-16px]" : ""} ${muted ? "bg-white" : ""}`} style={{ zIndex: i + 1 }}>
          <span className={`flex ${muted ? "opacity-50" : ""}`}>
            <MeetingThumb thumb={meetingById(id)?.thumb ?? "legacy"} width={26} height={16} radius={2} plain />
          </span>
        </span>
      ))}
      {extra > 0 && (
        <span className={`${tileClass} bg-[#F3F3F3]`} style={{ zIndex: shown.length + 1 }}>
          <span className="text-[10px] font-medium leading-[normal] tracking-[-0.3px]" style={{ color: tokens.placeholder }}>
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

/** Статичная поправка формы глаза: одна на оба глаза или своя для левого и правого */
const eyeTransform = (t: string | [string, string] | undefined, i: number) => (Array.isArray(t) ? t[i] : t);

export function ModeAvatar({
  mode,
  size = 32,
  autoplayOnce = false,
  lookAt = null,
}: {
  mode: Mode;
  size?: 24 | 32;
  autoplayOnce?: boolean;
  /** Точка во viewport, за которой следят глаза (каретка в поле ввода); null — смотрят прямо */
  lookAt?: { x: number; y: number } | null;
}) {
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
          // Авто: осматривается влево-вправо, находит ответ — глаза широко и чуть надувается
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
              { transform: "none", offset: 0.64, easing: snap },
              { transform: "scale(1.2)", offset: 0.72, easing: soft }, // нашел — глаза широко
              { transform: "scale(1.2)", offset: 0.9, easing: out },
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
              { transform: "rotate(6deg) scale(1.03)", offset: 0.7, easing: snap },
              { transform: `rotate(0deg) scale(1.1) translateY(${u * 0.2}px)`, offset: 0.8, easing: soft }, // вывод: «ага!» — надувается с кивком, как у остальных
              { transform: `rotate(0deg) scale(1.1) translateY(${u * 0.2}px)`, offset: 0.9, easing: out },
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
              { transform: "none", offset: 0.76, easing: snap },
              { transform: "scale(1.2)", offset: 0.82, easing: soft }, // глаза широко на «ага!» (умеренно — глаза уже сдвинуты от кромки тела)
              { transform: "scale(1.2)", offset: 0.9, easing: out },
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
  // Слежение за кареткой: глаза смещаются к точке по горизонтали (и чуть вниз — поле ниже заголовка),
  // переход мягкий через CSS transition; ховерные сценки на WAAPI перекрывают это на время проигрывания
  useEffect(() => {
    const eyes = eyesRef.current;
    const root = rootRef.current;
    if (!eyes || !root) return;
    eyes.style.transition = "transform 160ms cubic-bezier(0.23, 1, 0.32, 1)";
    if (!lookAt || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      eyes.style.transform = "";
      return;
    }
    const r = root.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    // По горизонтали — полный ход на половине ширины композера (320px), по вертикали — до половины хода
    const gx = Math.max(-1, Math.min(1, (lookAt.x - cx) / 320));
    const gy = Math.max(0, Math.min(1, (lookAt.y - cy) / 200)) * 0.5;
    const u = vw * 0.1;
    eyes.style.transform = `translate(${(gx * u).toFixed(2)}px, ${(gy * u).toFixed(2)}px)`;
  }, [lookAt, vw]);
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
          {/* eyeTransform — статичная поправка формы глаз от дизайнера (выше/меньше), отдельной группой,
              чтобы не мешать анимациям на внешних группах */}
          <g ref={eyeARef} style={{ transformBox: "fill-box", transformOrigin: "center" }}>
            <g style={{ transformBox: "fill-box", transformOrigin: "center", transform: eyeTransform(art.eyeTransform, 0) }}>
              <path d={art.eyes[0]} fill="#fff" />
            </g>
          </g>
          <g ref={eyeBRef} style={{ transformBox: "fill-box", transformOrigin: "center" }}>
            <g style={{ transformBox: "fill-box", transformOrigin: "center", transform: eyeTransform(art.eyeTransform, 1) }}>
              <path d={art.eyes[1]} fill="#fff" />
            </g>
          </g>
        </g>
        </g>
      </svg>
    </span>
  );
}

/** Иконка-персонаж 16×16 для ответа в диалоге (46377:6013): тот же персонаж без плашки, тело цветом,
 *  глаза белые. thinking — сценка ожидания: медленное дыхание тела, блуждающий взгляд и редкое моргание, по кругу */
export function ModeGlyph({ mode, thinking = false }: { mode: Mode; thinking?: boolean }) {
  const m = modeById(mode);
  const art = MODE_AVATAR_ART[mode];
  const { w, h } = MODE_GLYPH_16[mode];
  const [, , vw] = art.viewBox.split(" ").map(Number);
  const bodyRef = useRef<SVGGElement>(null);
  const eyesRef = useRef<SVGGElement>(null);
  useEffect(() => {
    const body = bodyRef.current;
    const eyes = eyesRef.current;
    if (!body || !eyes) return;
    const out = "cubic-bezier(0.23, 1, 0.32, 1)";
    const stop = () => {
      // Доезжаем из текущей позы в покой, а не обрываем на полукадре
      [body, eyes].forEach((el) => {
        const from = getComputedStyle(el).transform;
        el.getAnimations().forEach((an) => an.cancel());
        if (from && from !== "none") el.animate([{ transform: from }, { transform: "none" }], { duration: 320, easing: out });
      });
    };
    if (!thinking || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      stop();
      return;
    }
    const u = vw * 0.08;
    const soft = "cubic-bezier(0.45, 0, 0.55, 1)";
    // Дыхание: 3.2с туда-обратно, едва заметно
    body.animate([{ transform: "none" }, { transform: "scale(1.05) translateY(-0.2px)", offset: 0.5 }, { transform: "none" }], {
      duration: 3200,
      iterations: Infinity,
      easing: soft,
    });
    // Взгляд: медленно уходит влево, задерживается, переходит вправо, моргает, возвращается; цикл 5.6с
    eyes.animate(
      [
        { transform: "none", easing: soft },
        { transform: `translateX(${-u}px)`, offset: 0.18, easing: soft },
        { transform: `translateX(${-u}px)`, offset: 0.36, easing: soft },
        { transform: `translateX(${u * 0.8}px) translateY(${u * 0.25}px)`, offset: 0.54, easing: soft },
        { transform: `translateX(${u * 0.8}px) translateY(${u * 0.25}px)`, offset: 0.7, easing: soft },
        { transform: `translateX(${u * 0.8}px) translateY(${u * 0.25}px) scaleY(0.1)`, offset: 0.73, easing: soft }, // моргнул
        { transform: `translateX(${u * 0.8}px) translateY(${u * 0.25}px)`, offset: 0.76, easing: soft },
        { transform: "none", offset: 0.9, easing: soft },
        { transform: "none" },
      ],
      { duration: 5600, iterations: Infinity, easing: "linear" },
    );
    return stop;
  }, [thinking, vw, mode]);
  return (
    <span className="flex h-[16px] w-[16px] shrink-0 items-center justify-center" aria-hidden="true">
      <svg width={w} height={h} viewBox={art.viewBox} fill="none" xmlns="http://www.w3.org/2000/svg" className="block overflow-visible" overflow="visible">
        <g ref={bodyRef} style={{ transformBox: "fill-box", transformOrigin: "center" }}>
          <path d={art.body} fill={m.color} />
          <g ref={eyesRef} style={{ transformBox: "fill-box", transformOrigin: "center" }}>
            {art.eyes.map((d, i) => (
              <g key={i} style={{ transformBox: "fill-box", transformOrigin: "center", transform: eyeTransform(art.eyeTransform, i) }}>
                <path d={d} fill="#fff" />
              </g>
            ))}
          </g>
        </g>
      </svg>
    </span>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// Каретка в поле ввода → точка во viewport, чтобы аватар мог за ней следить
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Позиция каретки в textarea: текст до каретки кладется в скрытый «зеркальный» блок с тем же шрифтом
 * и шириной, в конец ставится маркер — его координаты и есть каретка. Пересчет при вводе и смене выделения
 */
export function useCaretPoint(ref: React.RefObject<HTMLTextAreaElement | null>, text: string, enabled: boolean) {
  const [point, setPoint] = useState<{ x: number; y: number } | null>(null);
  const mirrorRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!enabled) return;
    const measure = () => {
      const ta = ref.current;
      if (!ta || ta.value === "") {
        setPoint(null);
        return;
      }
      let mirror = mirrorRef.current;
      if (!mirror) {
        mirror = document.createElement("div");
        mirror.setAttribute("aria-hidden", "true");
        Object.assign(mirror.style, { position: "fixed", top: "-9999px", left: "0", visibility: "hidden", whiteSpace: "pre-wrap", overflowWrap: "break-word", pointerEvents: "none" } as CSSStyleDeclaration);
        document.body.appendChild(mirror);
        mirrorRef.current = mirror;
      }
      const cs = getComputedStyle(ta);
      Object.assign(mirror.style, { font: cs.font, letterSpacing: cs.letterSpacing, lineHeight: cs.lineHeight, width: `${ta.clientWidth}px`, padding: cs.padding });
      const caretAt = ta.selectionEnd ?? ta.value.length;
      // Маркер несет следующий за кареткой символ, а за ним идет остаток текста — так переносы строк
      // в зеркале совпадают с textarea, и каретка в начале перенесенной строки не «уезжает» на конец предыдущей
      mirror.textContent = ta.value.slice(0, caretAt);
      const marker = document.createElement("span");
      marker.textContent = ta.value.charAt(caretAt) || "\u200b";
      mirror.appendChild(marker);
      mirror.appendChild(document.createTextNode(ta.value.slice(caretAt + 1)));
      const r = ta.getBoundingClientRect();
      const lineH = parseFloat(cs.lineHeight) || 16;
      setPoint({ x: r.left + marker.offsetLeft, y: r.top + marker.offsetTop - ta.scrollTop + lineH / 2 });
    };
    measure();
    const onSel = () => {
      if (document.activeElement === ref.current) measure();
    };
    document.addEventListener("selectionchange", onSel);
    return () => document.removeEventListener("selectionchange", onSel);
  }, [ref, text, enabled]);
  useEffect(
    () => () => {
      mirrorRef.current?.remove();
      mirrorRef.current = null;
    },
    [],
  );
  return enabled ? point : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Стартовая: заголовок
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Перелет персонажа со стартовой к первому ответу нового диалога: плашка 32 с глифом 20 из заголовка «Салют!»
 * летит к месту аватара ответа (глиф 16 слева от «Думаю…»). Корень едет по translate, плашка внутри сжимается
 * и тает, глиф ужимается с 20 до 16. Настоящий аватар ответа на время полета скрыт, на посадке проявляется
 */
export function AvatarFlight({ from, to, getTarget, duration, easing, reverse = false, onDone }: { from: DOMRect; to: DOMRect; /** Текущее положение цели: контент диалога сам въезжает (gc-enter, автоскролл), поэтому точку посадки уточняем каждый кадр */ getTarget?: () => DOMRect | null; duration: number; easing: string; /** Обратный полет: из ответа (глиф 16) на стартовую (плашка 32 с глифом 20) — плашка проявляется, глиф растет */ reverse?: boolean; onDone: () => void }) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const plaqueRef = useRef<HTMLSpanElement>(null);
  const glyphRef = useRef<HTMLSpanElement>(null);
  const m = modeById("auto");
  const art = MODE_AVATAR_ART.auto;
  const [, , vw, vh] = art.viewBox.split(" ").map(Number);
  // Глиф на стартовой: 0.625 × 32 = 20 по ширине (как в ModeAvatar); в ответе — MODE_GLYPH_16
  const homeGlyphW = Math.round(32 * 0.625);
  const { w: g16w } = MODE_GLYPH_16.auto;
  const startScale = homeGlyphW / g16w;
  useLayoutEffect(() => {
    const root = rootRef.current;
    const plaque = plaqueRef.current;
    const glyph = glyphRef.current;
    if (!root || !plaque || !glyph) return;
    const dx = from.left + from.width / 2 - (to.left + to.width / 2);
    const dy = from.top + from.height / 2 - (to.top + to.height / 2);
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      onDone();
      return;
    }
    const move = root.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "translate(0, 0)" }], { duration, easing, fill: "forwards" });
    if (reverse) {
      // Обратно: плашка проявляется на последней трети пути, глиф подрастает до 20 к посадке
      plaque.animate(
        [{ transform: "scale(0.5)", opacity: 0 }, { transform: "scale(0.6)", opacity: 0, offset: 0.34 }, { transform: "scale(1)", opacity: 1 }],
        { duration, easing: "cubic-bezier(0.4, 0, 0.2, 1)", fill: "forwards" },
      );
      glyph.animate([{ transform: "scale(1)" }, { transform: `scale(${startScale})` }], { duration, easing, fill: "forwards" });
    } else {
      // Плашка тает по дороге ровным ходом (не кривой полета — та почти весь путь проходит в первой трети времени)
      // и к двум третям пути исчезает: персонаж прилетает уже «голым», как в ответе
      plaque.animate(
        [{ transform: "scale(1)", opacity: 1 }, { transform: "scale(0.6)", opacity: 0, offset: 0.66 }, { transform: "scale(0.5)", opacity: 0 }],
        { duration, easing: "cubic-bezier(0.4, 0, 0.2, 1)", fill: "forwards" },
      );
      glyph.animate([{ transform: `scale(${startScale})` }, { transform: "scale(1)" }], { duration, easing, fill: "forwards" });
    }
    // На посадке призрак гасим сразу, в том же кадре, где проявляется настоящий аватар: иначе кадр-два обе плашки
    // лежат друг на друге и полупрозрачная заливка на миг темнеет
    move.onfinish = () => {
      root.style.visibility = "hidden";
      onDone();
    };
    // Следим за целью до посадки: корень стоит в текущем центре цели, translate доводит остаток пути
    let raf = 0;
    const follow = () => {
      const r = getTarget?.();
      if (r) {
        root.style.left = `${r.left + r.width / 2 - 8}px`;
        root.style.top = `${r.top + r.height / 2 - 8}px`;
      }
      raf = requestAnimationFrame(follow);
    };
    raf = requestAnimationFrame(follow);
    return () => {
      move.cancel();
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <span
      ref={rootRef}
      aria-hidden="true"
      className="pointer-events-none fixed z-[60] flex h-[16px] w-[16px] items-center justify-center"
      style={{ left: to.left + to.width / 2 - 8, top: to.top + to.height / 2 - 8 }}
    >
      <span ref={plaqueRef} className="absolute left-1/2 top-1/2 h-[32px] w-[32px] -translate-x-1/2 -translate-y-1/2 rounded-[4px]" style={{ backgroundColor: `${m.color}29` }} />
      <span ref={glyphRef} className="relative flex" style={{ transformOrigin: "50% 50%", width: g16w, height: (g16w * vh) / vw }}>
        <svg width={g16w} height={(g16w * vh) / vw} viewBox={art.viewBox} fill="none" xmlns="http://www.w3.org/2000/svg" className="block overflow-visible" overflow="visible">
          <path d={art.body} fill={m.color} />
          {art.eyes.map((d, i) => (
            <path key={i} d={d} fill="#fff" />
          ))}
        </svg>
      </span>
    </span>
  );
}

export function HomeTitle({ lookAt = null }: { lookAt?: { x: number; y: number } | null }) {
  return (
    // data-avatar-hover: мимика запускается с ховера всего заголовка, не только плашки
    <div data-avatar-hover className="gc-fade-in flex items-center gap-[8px]">
      {/* data-gc-home-avatar: отсюда персонаж «перелетает» к первому ответу нового диалога (AvatarFlight) */}
      <span data-gc-home-avatar className="flex shrink-0">
        <ModeAvatar mode="auto" size={32} autoplayOnce lookAt={lookAt} />
      </span>
      <h1 className="whitespace-nowrap text-center text-[24px] font-medium leading-[normal] tracking-[-0.48px]" style={{ color: tokens.black }}>
        <span style={{ color: tokens.blue }}>Салют!</span> Чем могу помочь?
      </h1>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Цвет кнопки отправки под режим: картина-заливка нарисована синей (tokens.blue), для остальных режимов
// она поворачивается по оттенку к цвету режима, а оверлей и ховер считаются от цвета режима так же,
// как синий оверлей rgba(1,56,199,.6) и ховер rgba(0,44,156,.6) считаются от tokens.blue
// ─────────────────────────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgba(hex: string, a: number, k = 1) {
  const [r, g, b] = hexToRgb(hex).map((c) => Math.round(c * k));
  return `rgba(${r},${g},${b},${a})`;
}
/** Оттенок и светлота цвета (HSL), чтобы подогнать синюю картину под цвет режима */
function hsl(hex: string) {
  const [r, g, b] = hexToRgb(hex).map((c) => c / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  const l = (max + min) / 2;
  if (d === 0) return { h: 0, l };
  const h = 60 * (max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4);
  return { h, l };
}
/** Стили кнопки отправки для режима: подложка, оверлей 60%, ховер (темнее на 22%, как blue → blueHover),
 *  поворот картины по оттенку и подтяжка яркости — светлые режимы (оранжевый) иначе выходят бурыми */
function sendPalette(color: string) {
  const mode = hsl(color);
  const base = hsl(tokens.blue);
  const rot = Math.round(mode.h - base.h);
  const bright = Math.min(1.3, Math.max(0.9, mode.l / base.l));
  return {
    "--send-c": rgba(color, 0.6),
    "--send-h": rgba(color, 0.6, 0.78),
    "--send-filter": `hue-rotate(${rot}deg) brightness(${bright.toFixed(2)})`,
  } as React.CSSProperties;
}

/** Цвета шиммера статусов ответа: базовый — цвет режима, блик — он же на 40% */
function shimmerVars(color: string) {
  return { "--gc-shim-a": color, "--gc-shim-b": `${color}66` } as React.CSSProperties;
}

/** Мок таймкода тезиса: тезисы равномерно по длительности встречи, секунды детерминированы по номеру */
function mockTimecode(durationMin: number, i: number, n: number) {
  const totalSec = Math.round((durationMin * 60 * (i + 1)) / (n + 1)) + ((i * 17) % 53);
  const mm = Math.floor(totalSec / 60);
  const ss = totalSec % 60;
  return `${mm}:${String(ss).padStart(2, "0")}`;
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

export function FileChip({ file, onRemove }: { file: FileAttachment; onRemove?: () => void }) {
  return (
    <div className="gc-enter group/file relative flex h-[48px] w-[240px] items-center gap-[8px] rounded-[4px] p-[8px]" style={{ backgroundColor: tokens.bgSubtle }}>
      {/* Плашка типа файла: картина-текстура, перекрашенная в цвет типа (PDF красная, DOCX синяя), сверху 8% черного и белый глиф */}
      <span className="relative isolate flex h-[32px] w-[32px] shrink-0 items-center justify-center overflow-hidden rounded-[4px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={gcAsset(file.ext === "PDF" ? "file-tex-red.png" : "file-tex-blue.png")} alt="" className="absolute inset-0 h-full w-full object-cover" />
        {/* PDF: картина перекрашивается в красный через blend color, как в макете */}
        {file.ext === "PDF" && <span className="absolute inset-0" style={{ backgroundColor: tokens.red, mixBlendMode: "color" }} />}
        <span className="absolute inset-0" style={{ backgroundColor: "rgba(0,0,0,0.08)" }} />
        <span
          className="relative block bg-white"
          style={{ width: 11.2, height: 12.8, WebkitMaskImage: `url(${gcAsset("fig-file.svg")})`, maskImage: `url(${gcAsset("fig-file.svg")})`, WebkitMaskSize: "100% 100%", maskSize: "100% 100%" }}
        />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
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
          className={`absolute -right-[6px] -top-[6px] flex h-[16px] w-[16px] items-center justify-center rounded-full opacity-0 group-hover/file:opacity-100 focus-visible:opacity-100 hover:text-[#585E6C] ${pressableClass} ${focusRingClass}`}
          style={{ backgroundColor: tokens.bgSubtle, color: tokens.grey }}
        >
          {/* Крестик по макету 46845:7096: круг 16 grey-20 без рамки, глиф grey */}
          <Ic name="fig-close-x" size={16} />
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
  generating = false,
  onStop,
  limited = false,
  onUpgrade,
  notice,
  nudge = 0,
  hideMeetings = false,
  placeholder = "Спросите что-нибудь о встречах…",
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
  /** Идет ответ: кнопка отправки становится кнопкой «Стоп» */
  generating?: boolean;
  onStop?: () => void;
  /** Free и Lite исчерпали вопросы (46726:21248): над полем плашка «Улучшить план», все контролы неактивны */
  limited?: boolean;
  onUpgrade?: () => void;
  /** Плашка над полем с блокировкой ввода, например гостевой просмотр (46770:15573) */
  notice?: { icon: IconName; text: string; action?: { label: string; onClick?: () => void } };
  /** Счетчик «толчков»: при заблокированном поле клик по подсказке не вставляет текст, а качает плашку над полем */
  nudge?: number;
  /** В чате внутри встречи кнопки «Встречи» нет (46773:16791) */
  hideMeetings?: boolean;
  placeholder?: string;
}) {
  // Лимит и гостевой просмотр рисуются одной плашкой над полем; ввод в обоих случаях заблокирован
  const banner = notice ?? (limited ? { icon: "fig-arrow-up-circle" as IconName, text: "Бесплатные запросы кончились, перейдите на тариф Pro или Business", action: { label: "Улучшить план", onClick: onUpgrade } } : null);
  const locked = limited || !!notice;
  const innerRef = useRef<HTMLTextAreaElement>(null);
  const ref = textareaRef ?? innerRef;
  const canSend = state.text.trim().length > 0 && !disabled && !locked;

  // Толчок при клике по подсказке с заблокированным полем: стрелка в иконке плашки «улетает» вверх, снизу подъезжает
  // такая же — как на ховере «Улучшить план» в сайдбаре. Плашка и текст стоят. Первое значение nudge (0) не анимируем
  const nudgeArrowRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = nudgeArrowRef.current;
    if (!el || nudge === 0) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getAnimations().length) return;
    // Две одинаковые стрелки в столбик: сдвиг на половину = верхняя уходит, нижняя встает на ее место; сброс в 0 незаметен
    el.animate([{ transform: "translateY(0)" }, { transform: "translateY(-50%)" }], { duration: 180, easing: "cubic-bezier(0.4, 0, 0.2, 1)" });
  }, [nudge]);

  const allMeetings = useMemo(() => Array.from(new Set([...(contextIds ?? []), ...state.meetingIds])), [contextIds, state.meetingIds]);

  // Высота поля: минимум две строки (32px), при длинном тексте растет до 10 строк, дальше — скролл внутри
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const min = 32;
    const max = 16 * 10;
    el.style.height = `${min}px`;
    const next = Math.min(Math.max(el.scrollHeight, min), max);
    el.style.height = `${next}px`;
    el.style.overflowY = el.scrollHeight > max ? "auto" : "hidden";
  }, [state.text, ref]);

  return (
    <div className="flex w-full flex-col">
      {banner && (
        // Плашка на 4px заходит под поле (-mb): голубой виден за скругленными верхними углами поля,
        // поле ниже перекрывает этот хвост своей белой заливкой
        <div className="group/bar -mb-[4px] flex h-[44px] items-start justify-between rounded-t-[4px] px-[12px] pt-[12px]" style={{ backgroundColor: "#F6F8FE" }}>
          <span className="flex min-w-0 items-center gap-[6px]">
            {banner.icon === "fig-arrow-up-circle" ? (
              // Синий кружок с двумя стрелками в столбик (как ArrowUpCircle в сайдбаре): стрелка улетает вверх
              // на ховере всей плашки и при толчке от клика по подсказке
              <span className="relative block h-[16px] w-[16px] shrink-0 overflow-hidden rounded-full" style={{ backgroundColor: tokens.blue }} aria-hidden="true">
                <span ref={nudgeArrowRef} className="flex flex-col transition-transform duration-[180ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover/bar:-translate-y-1/2 motion-reduce:transition-none">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={ctaAsset("ic-arrow-up-white.svg")} alt="" className="block h-[16px] w-[16px] shrink-0" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={ctaAsset("ic-arrow-up-white.svg")} alt="" className="block h-[16px] w-[16px] shrink-0" />
                </span>
              </span>
            ) : (
              <span className="flex shrink-0" style={{ color: tokens.blue }}>
                <Ic name={banner.icon} />
              </span>
            )}
            <span className="truncate text-[12px] leading-[normal] tracking-[-0.12px]" style={{ color: tokens.black }}>
              {banner.text}
            </span>
          </span>
          {banner.action && (
            <button
              type="button"
              onClick={banner.action.onClick}
              className={`shrink-0 rounded-[2px] text-[12px] font-medium leading-[normal] tracking-[-0.12px] hover:text-[#0032B1] ${pressableClass} ${focusRingClass}`}
              style={{ color: tokens.blue }}
            >
              {banner.action.label}
            </button>
          )}
        </div>
      )}
    <div
      className="relative flex w-full flex-col gap-[12px] rounded-[4px] bg-white p-[12px]"
      style={{ boxShadow: `inset 0 0 0 1px ${tokens.border}, ${composerShadow}`, color: locked ? tokens.greyDisabled : undefined }}
      onClick={() => !locked && ref.current?.focus()}
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
            className="pointer-events-none absolute left-[4px] top-[4px] -translate-x-[1px] text-[13px] leading-[16px] tracking-[-0.13px]"
            style={{ color: tokens.placeholder }}
          >
            {placeholder}
          </span>
        )}
        <textarea
          ref={ref}
          value={state.text}
          autoFocus={autoFocus && !locked}
          disabled={locked}
          rows={2}
          aria-label={placeholder}
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
        <div className={`flex items-center gap-[8px] ${locked ? "pointer-events-none" : ""}`}>
          <ToolButton square label="Прикрепить файл" onClick={onAddFile}>
            <span style={{ color: locked ? tokens.greyDisabled : tokens.grey }}>
              <Ic name="fig-paperclip" />
            </span>
          </ToolButton>
          {!hideMeetings && (
          <ToolButton onClick={onOpenMeetings} label="Добавить встречи">
            {allMeetings.length === 0 ? (
              <>
                <span style={{ color: locked ? tokens.greyDisabled : tokens.grey }}>
                  <Ic name="fig-plus" />
                </span>
                <span className="text-[12px] leading-[normal] tracking-[-0.24px]" style={{ color: locked ? tokens.greyDisabled : tokens.black }}>
                  Встречи
                </span>
              </>
            ) : (
              <span key="stack" className="gc-enter flex items-center gap-[6px]">
                <ThumbStack ids={allMeetings} muted={locked} />
                <span className="text-[12px] leading-[normal] tracking-[-0.24px]" style={{ color: locked ? tokens.greyDisabled : tokens.black }}>
                  {pluralMeetings(allMeetings.length)}
                </span>
                <span className="flex" style={{ color: locked ? tokens.greyDisabled : tokens.grey }}>
                  <Ic name="chevron-down" />
                </span>
              </span>
            )}
          </ToolButton>
          )}
        </div>
        <div className="ml-auto flex items-center gap-[8px]">
          {/* Пока идет ответ, та же кнопка становится «Стоп» (46527:6245) */}
          <Tip text={generating ? "Остановить" : "Отправить"} placement="top" disabled={!canSend && !generating}>
            <button
              type="button"
              aria-label={generating ? "Остановить" : "Отправить"}
              disabled={!canSend && !generating}
              onClick={generating ? onStop : onSend}
              className={`group/send relative flex h-[32px] w-[32px] shrink-0 items-center justify-center overflow-hidden rounded-[4px] transition-colors duration-[200ms] ease-[cubic-bezier(0.23,1,0.32,1)] disabled:cursor-not-allowed motion-reduce:transition-none ${pressableClass} ${focusRingClass}`}
              style={{ backgroundColor: canSend || generating ? tokens.blue : tokens.bgSubtle, color: canSend || generating ? "#FFFFFF" : tokens.greyDisabled, ...sendPalette(tokens.blue) }}
            >
              {/* Заливка активной кнопки — картина + оверлей 60%, как у «Добавить встречу».
                  Слои всегда в DOM и проявляются кроссфейдом, а не появляются рывком */}
              <span className="absolute inset-0 transition-opacity duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none" style={{ opacity: canSend || generating ? 1 : 0 }} aria-hidden="true">
                <span className="absolute inset-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={gcAsset("send-bg.png")} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ filter: "var(--send-filter)" }} />
                  <span className={`absolute inset-0 bg-[var(--send-c)] group-hover/send:bg-[var(--send-h)] ${pressableClass}`} />
                </span>
              </span>
              <span key={generating ? "stop" : "send"} className={`gc-fade-in relative ${pressableClass}`}>
                <Ic name={generating ? "fig-stop" : "fig-arrow-up"} />
              </span>
            </button>
          </Tip>
        </div>
      </div>
    </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Стартовая: подсказки, список базы знаний, предыдущие чаты
// ─────────────────────────────────────────────────────────────────────────────

/** Подсказки строками с разделителями и стрелкой — для всех режимов, кроме «Авто» */
/**
 * Саджесты под полем — по макету 46115:7175: строки px-8 py-12, радиус 4, ховер #F7F7F8, справа стрелка;
 * между строками дивайдеры, при ховере строки соседние с ней (сверху и снизу) исчезают
 */
/**
 * Баннер-анонс внизу стартовой (46817:17093): миниатюра 80×48 с иконкой чата, заголовок, подзаголовок, «Подробнее»;
 * точки карусели из макета (46817:17341) пока убраны по просьбе дизайнера
 */
export function HomeBanner({ onMore, onClose }: { onMore: () => void; onClose?: () => void }) {
  return (
    <div className="group/banner flex w-[640px] max-w-full flex-col items-center gap-[12px]">
      <div className="relative flex w-full items-center gap-[8px] rounded-[4px] border bg-white py-[12px] pl-[12px] pr-[18px]" style={{ borderColor: tokens.border }}>
        {/* Крестик в углу на ховере — тот же, что у чипа файла в поле; по клику баннер скрывается */}
        {onClose && (
          <button
            type="button"
            aria-label="Скрыть баннер"
            onClick={onClose}
            className={`absolute -right-[6px] -top-[6px] flex h-[16px] w-[16px] items-center justify-center rounded-full opacity-0 group-hover/banner:opacity-100 focus-visible:opacity-100 hover:text-[#585E6C] ${pressableClass} ${focusRingClass}`}
            style={{ backgroundColor: tokens.bgSubtle, color: tokens.grey }}
          >
            <Ic name="fig-close-x" size={16} />
          </button>
        )}
        <span className="relative flex h-[48px] w-[80px] shrink-0 items-center justify-center overflow-hidden rounded-[4px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={gcAsset("banner-chat-bg.png")} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <span className="absolute inset-0" style={{ backgroundColor: "rgba(33,40,51,0.08)" }} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={gcAsset("banner-chat-fg.png")} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <span className="relative flex text-white">
            <Ic name="fig-chat-20" size={20} />
          </span>
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-[4px]">
          <span className="truncate text-[13px] font-medium leading-[normal] tracking-[-0.13px]" style={{ color: tokens.black }}>
            Представляем глобальный AI Чат
          </span>
          <span className="text-[12px] leading-[normal] tracking-[-0.24px]" style={{ color: tokens.grey }}>
            Задавайте вопросы по всем встречам
          </span>
        </span>
        <button
          type="button"
          onClick={onMore}
          className={`flex shrink-0 items-center rounded-[4px] px-[12px] py-[10px] text-[13px] leading-[16px] tracking-[-0.13px] hover:bg-[#EFEFEF] ${pressableClass} ${focusRingClass}`}
          style={{ backgroundColor: tokens.bgSubtle, color: tokens.black }}
        >
          Подробнее
        </button>
      </div>
    </div>
  );
}

export function SuggestionList({ items, onPick, inset = true }: { items: Suggestion[]; onPick: (s: Suggestion) => void; /** боковые поля 12px под композером на стартовой; в чате встречи строки во всю ширину */ inset?: boolean }) {
  const [hovered, setHovered] = useState<number | null>(null);
  return (
    // Без анимации и без key по режиму: при смене режима строки стоят на месте, меняется только текст
    <div className={`flex w-full flex-col ${inset ? "px-[12px]" : ""}`} onMouseLeave={() => setHovered(null)}>
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
function DialogRowMenu({ dialog, actions, open, onOpenChange, portal = false }: { dialog: Dialog; actions: DialogRowActions; open: boolean; onOpenChange: (open: boolean) => void; /** Меню через портал (fixed от кнопки «…»): в скроллящемся списке переключателя иначе режется overflow */ portal?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => onOpenChange(false), [onOpenChange]);
  useOutsideClose([ref, portalRef], open, close);
  // Позиция портального меню считается от кнопки при открытии; скролл списка под ним закрывает меню
  const [anchor, setAnchor] = useState<{ top: number; right: number } | null>(null);
  useLayoutEffect(() => {
    if (!portal || !open) return;
    const b = ref.current?.getBoundingClientRect();
    if (b) setAnchor({ top: b.bottom + 8, right: window.innerWidth - b.right });
    const onScroll = (e: Event) => {
      if (portalRef.current && e.target instanceof Node && portalRef.current.contains(e.target)) return;
      close();
    };
    window.addEventListener("scroll", onScroll, true);
    return () => window.removeEventListener("scroll", onScroll, true);
  }, [portal, open, close]);
  const run = (fn: (id: string) => void) => () => {
    onOpenChange(false);
    fn(dialog.id);
  };
  const row = (icon: "fig-pin" | "fig-pin-off" | "fig-pencil" | "fig-trash", label: string, onClick: () => void, danger?: boolean) => (
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
  const menu = (
    <div role="menu" className="flex flex-col">
      {row(dialog.pinned ? "fig-pin-off" : "fig-pin", dialog.pinned ? "Открепить" : "Закрепить", run(actions.onPin))}
      {row("fig-pencil", "Переименовать", run(actions.onRename))}
      {row("fig-trash", "Удалить", run(actions.onDelete), true)}
    </div>
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
      {portal ? (
        typeof document !== "undefined" &&
        createPortal(
          <div ref={portalRef} className="fixed z-[80]" style={anchor ? { top: anchor.top, right: anchor.right } : { top: 0, right: 0, visibility: "hidden" }} onClick={(e) => e.stopPropagation()}>
            <Popover open={open && anchor !== null} direction="down" padding={4} style={{ boxShadow: shadow }} className="right-0 top-0 w-[160px]">
              {menu}
            </Popover>
          </div>,
          document.body,
        )
      ) : (
        <Popover open={open} direction="down" padding={4} style={{ boxShadow: shadow }} className="right-0 top-[calc(100%+8px)] w-[160px]">
          {menu}
        </Popover>
      )}
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
  status,
  onOpen,
  onCommitRename,
  onCancelRename,
  onMenuOpenChange,
  menuPortal = false,
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
  /** Статус ответа (46724:15416): «В процессе» пока чат отвечает в этом диалоге, «Готово» пока ответ не открыли */
  status?: "running" | "ready";
  onOpen: () => void;
  onCommitRename: (title: string) => void;
  onCancelRename: () => void;
  onMenuOpenChange?: (open: boolean) => void;
  /** Меню «…» через портал — для строк внутри скроллящегося поповера */
  menuPortal?: boolean;
}) {
  const [menuOpen, setMenuOpenState] = useState(false);
  const setMenuOpen = (open: boolean) => {
    setMenuOpenState(open);
    onMenuOpenChange?.(open);
  };
  const icon = dialog.pinned ? "fig-pin" : "fig-chat";
  if (renaming) {
    return (
      <div className={`flex w-full items-center gap-[6px] rounded-[3px] px-[8px] ${tall ? "h-[36px]" : "py-[6px]"}`}>
        <span className="flex shrink-0" style={{ color: tokens.grey }}>
          <Ic name={icon} />
        </span>
        <RenameInput title={dialog.title} onCommit={onCommitRename} onCancel={onCancelRename} />
        <span className="ml-auto text-[12px] leading-[normal] tracking-[-0.24px]" style={{ color: tokens.greyDisabled }}>
          {formatShortDate(dialog.updatedAt)}
        </span>
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
      className={`group/row relative flex w-full cursor-pointer items-center gap-[6px] ${tall ? "h-[36px] rounded-[3px]" : "rounded-[2px] py-[8px]"} px-[8px] hover:bg-[#F7F7F8] hover:z-10 focus-within:z-10 ${index !== undefined ? "gc-fade-in-up gc-no-fill" : ""} ${menuOpen ? "z-10 bg-[#F7F7F8]" : ""} ${pressableClass} ${focusRingClass}`}
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
        {status ? (
          <span
            className={`flex items-center gap-[4px] text-[12px] leading-[normal] tracking-[-0.24px] transition-opacity duration-[120ms] motion-reduce:transition-none ${menuOpen ? "opacity-0" : "group-hover/row:opacity-0 group-focus-visible/row:opacity-0 group-has-[:focus-visible]/row:opacity-0"}`}
            style={{ color: tokens.blue }}
          >
            <Ic name={status === "running" ? "fig-status-dot" : "fig-status-check"} size={12} />
            {status === "running" ? "В процессе" : "Готово"}
          </span>
        ) : active ? (
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
          <DialogRowMenu dialog={dialog} actions={actions} open={menuOpen} onOpenChange={setMenuOpen} portal={menuPortal} />
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
/** Сколько аватар ответа стоит напротив готового ответа перед тем, как исчезнуть */
const AVATAR_LINGER_MS = 5000;

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
  generatingId = null,
}: {
  dialogs: Dialog[];
  onOpen: (id: string) => void;
  actions: DialogRowActions;
  renamingId: string | null;
  onCommitRename: (id: string, title: string) => void;
  onCancelRename: () => void;
  /** Диалог, в котором сейчас идет ответ — у его строки «В процессе» */
  generatingId?: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  // Строки, у которых закончился вход: до этого они обрезаны по высоте, после — overflow снова видимый (меню «…» выходит за строку)
  const [settled, setSettled] = useState<Set<string>>(() => new Set());
  const reduce = useReducedMotion();
  const sorted = sortDialogs(dialogs);
  const collapsible = sorted.length > PREVIOUS_COLLAPSED;
  const visible = collapsible && !expanded ? sorted.slice(0, PREVIOUS_COLLAPSED) : sorted;
  // layout-анимация строк нужна только при смене порядка или состава списка (пин, удаление, «Показать все»).
  // Когда выше растет поле ввода, список должен сдвигаться мгновенно, без догоняющей анимации
  const orderKey = visible.map((d) => d.id).join("|");
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
                layoutDependency={orderKey}
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
                  status={generatingId === d.id ? "running" : d.unread ? "ready" : undefined}
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
  // «Выбрать все» работает по видимому списку: с поиском или фильтрами — по найденным, остальной выбор не трогает
  const visibleSelected = list.filter((m) => selected.includes(m.id)).length;
  const allVisible = list.length > 0 && visibleSelected === list.length;
  const toggleAll = () =>
    setSelected((prev) => {
      const ids = list.map((m) => m.id);
      return allVisible ? prev.filter((x) => !ids.includes(x)) : Array.from(new Set([...prev, ...ids]));
    });
  const narrowed = filtersActive || filters.query.length > 0;

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
          {/* Список идет до самого футера (в макете шестая строка режется его краем), скроллбар 4px стоит в правом поле модалки,
              а контент остается на ширине 568: -mr-12 + pr-8 + 4px полосы */}
          <div className="gc-scroll -mb-[16px] -mr-[12px] flex min-h-0 flex-1 flex-col overflow-y-auto pr-[8px]" style={{ scrollbarGutter: "stable" }}>
            {/* «Выбрать все (N встреч)» (46726:24181): строка 40px над списком, чекбокс на одной вертикали с чекбоксами строк.
                Работает по видимому списку: с поиском или фильтрами — по найденным, остальной выбор не трогает */}
            {list.length > 0 && (
              <button
                type="button"
                role="checkbox"
                aria-checked={allVisible}
                onClick={toggleAll}
                className={`block h-[40px] w-full min-w-0 shrink-0 rounded-[4px] text-left ${pressableClass} ${focusRingClass}`}
              >
                <span className="flex h-full w-full min-w-0 items-center gap-[12px] py-[12px] pr-[12px]">
                  <span className="min-w-0 flex-1 truncate text-[13px] leading-[16px] tracking-[-0.13px]" style={{ color: tokens.black }}>
                    {narrowed ? "Выбрать найденные" : "Выбрать все"} ({pluralMeetings(list.length)})
                  </span>
                  <Checkbox checked={allVisible} />
                </span>
              </button>
            )}
            {list.length === 0 && (
              <div className="flex flex-1 flex-col items-center justify-center gap-[8px] text-center" style={{ color: tokens.black }}>
                <span className="text-[16px] font-medium leading-[normal] tracking-[-0.32px]">Не удалось ничего найти</span>
                <span className="w-[288px] text-[13px] leading-[16px] tracking-[-0.13px]">Попробуйте другой запрос или смените рабочее пространство</span>
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
                  // Флекс-раскладка не на самой <button>: Safari не ужимает длинный заголовок внутри кнопки-флекса,
                  // и чекбокс у строки с длинным названием уезжал вправо. Внутренний span ведет себя предсказуемо
                  className={`block h-[72px] w-full min-w-0 rounded-[4px] text-left ${pressableClass} ${focusRingClass}`}
                >
                  <span className="flex h-full w-full min-w-0 items-center gap-[12px] py-[12px] pr-[12px]">
                    <MeetingThumb thumb={m.thumb} width={80} height={48} />
                    <span className="flex min-w-0 flex-1 flex-col gap-[4px] overflow-hidden">
                      <span className="truncate text-[13px] font-medium leading-[normal] tracking-[-0.13px]" style={{ color: tokens.black }}>
                        {m.title}
                      </span>
                      <span className="flex items-center gap-[4px] text-[12px] leading-[normal] tracking-[-0.24px]" style={{ color: tokens.grey }}>
                        {m.time}
                        <span className="h-[3px] w-[3px] rounded-full" style={{ backgroundColor: tokens.grey }} />
                        {m.durationMin} мин
                      </span>
                    </span>
                    <Checkbox checked={on} />
                  </span>
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

function HeaderIconButton({
  icon,
  label,
  onClick,
  active,
  pressed,
  ariaExpanded,
}: {
  icon: "fig-pin" | "fig-pin-off" | "fig-ellipsis";
  label: string;
  onClick: () => void;
  /** визуально нажатая (заливка grey-20, черная иконка) — открытое меню */
  active?: boolean;
  /** состояние тоггла только для aria — закрепленный диалог выглядит как обычная кнопка, меняется лишь иконка */
  pressed?: boolean;
  ariaExpanded?: boolean;
}) {
  return (
    <Tip text={label} placement="bottom">
      <button
        type="button"
        aria-label={label}
        aria-pressed={pressed}
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

/** Текст гостевого режима — одинаковый в тултипе чипа и в плашке над композером (46770:15573) */
export const GUEST_NOTICE = "Вы просматриваете диалог как гость. Писать сообщения в чат может только его владелец";

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
  guest = false,
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
  /** Гостевой просмотр по ссылке (46770:15573): название без переключателя, чип «Общий доступ», без действий справа */
  guest?: boolean;
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
  // Пока открыто меню строки (оно в портале, вне switcherRef), клик по нему не должен закрывать переключатель
  useOutsideClose([switcherRef], switcherOpen && !rowMenuOpen, closeSwitcher);
  useOutsideClose([shareRef], shareOpen, closeShare);
  useOutsideClose([menuRef], menuOpen, closeMenu);
  const others = sortDialogs(dialogs);
  const switcherOrderKey = others.map((d) => d.id).join("|");
  const dialogId = dialog?.id ?? null;

  return (
    // Слева 10px + паддинг чипа 6px = текст «AI Агент» на тех же 16px, что и на стартовой — не скачет при переходе
    <header className="flex h-[54px] shrink-0 items-center justify-between py-[16px] pl-[10px] pr-[16px]">
      <div ref={switcherRef} className="relative flex min-w-0 items-center gap-[2px]">
        {/* «AI Агент» живет в шапке постоянно: на стартовой черный и некликабельный, в диалоге серый и ведет домой */}
        <button
          type="button"
          onClick={dialog ? onHome : undefined}
          tabIndex={dialog ? 0 : -1}
          aria-disabled={!dialog}
          className={`shrink-0 rounded-[3px] p-[6px] text-[13px] font-medium leading-[normal] tracking-[-0.13px] ${dialog ? "cursor-pointer text-[#818AA3] hover:bg-[#F7F7F8] hover:text-[#212833]" : "cursor-default text-[#212833]"} ${pressableClass} ${focusRingClass}`}
        >
          AI Агент
        </button>
        {dialog && (
        <div key={dialog.id} className="gc-enter flex min-w-0 items-center gap-[2px]">
        <span className="text-[13px] font-medium leading-[normal] tracking-[-0.13px]" style={{ color: tokens.grey }}>
          /
        </span>
        {guest ? (
          <>
            <span className="max-w-[420px] truncate p-[6px] text-[13px] font-medium leading-[normal] tracking-[-0.13px]" style={{ color: tokens.black }}>
              {dialog.title}
            </span>
            <Tip text={GUEST_NOTICE} placement="bottom">
              <span className="ml-[2px] flex h-[24px] shrink-0 items-center gap-[4px] rounded-[3px] px-[8px]" style={{ backgroundColor: "#E4ECFA", color: tokens.blue }}>
                <Ic name="fig-share-12" size={12} />
                <span className="text-[12px] leading-[normal] underline decoration-dotted underline-offset-[3px]" style={{ textDecorationColor: tokens.blue }}>
                  Общий доступ
                </span>
              </span>
            </Tip>
          </>
        ) : renaming ? (
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
        <Popover open={switcherOpen} direction="down" padding={4} style={{ boxShadow: shadow }} className="left-[45px] top-[calc(100%+4px)] w-max min-w-[320px] max-w-[560px]">
          {/* Список всегда скроллится: меню строк уходят в портал и не режутся, а строки не вываливаются за поповер */}
          <div role="menu" className="gc-scroll flex max-h-[360px] flex-col overflow-y-auto">
            {others.map((d) => (
              <motion.div key={d.id} layout={reduceMotion ? false : "position"} layoutDependency={switcherOrderKey} transition={ROW_IN} className="w-full">
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
                  menuPortal
                />
              </motion.div>
            ))}
          </div>
        </Popover>
        </div>
        )}
      </div>

      {dialog && !guest && (
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
          <Popover open={shareOpen} direction="down" padding={0} style={{ boxShadow: popoverShadow }} className="right-[-80px] top-[calc(100%+8px)] w-[360px]">
            <SharePopoverPanel onCopied={onCopyLink} />
          </Popover>
        </div>
        {/* Закрепленный диалог: кнопка показывает действие «открепить» — пин с перечеркиванием (46402:7460) */}
        <HeaderIconButton icon={dialog.pinned ? "fig-pin-off" : "fig-pin"} label={dialog.pinned ? "Открепить" : "Закрепить"} pressed={dialog.pinned} onClick={onPin} />
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
  // Поле ровно по ширине текста, как в макете: невидимый двойник в той же клетке грида задает ширину, инпут ее растягивает
  return (
    <span className="inline-grid min-w-0 max-w-[420px] items-center">
    <span aria-hidden className="invisible col-start-1 row-start-1 h-[22px] whitespace-pre px-[5px] text-[13px] leading-[22px] tracking-[-0.13px]">
      {value || " "}
    </span>
    <input
      autoFocus
      value={value}
      onFocus={(e) => {
        const n = e.currentTarget.value.length;
        e.currentTarget.setSelectionRange(n, n);
      }}
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
      className="col-start-1 row-start-1 h-[22px] w-full min-w-0 rounded-[3px] border bg-white px-[4px] text-[13px] leading-[normal] tracking-[-0.13px] outline-none"
      style={{ color: tokens.black, borderColor: tokens.blue }}
    />
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Сообщения
// ─────────────────────────────────────────────────────────────────────────────

export function UserBubble({ message }: { message: Message }) {
  return (
    <div className="gc-enter flex w-full flex-col items-end gap-[8px]">
      {/* Приложенные файлы (46753:8155): те же чипы, что в поле, над пузырем по правому краю */}
      {message.files?.map((f) => <FileChip key={f.id} file={f} />)}
      <div className="max-w-[560px] whitespace-pre-wrap rounded-[4px] p-[8px] text-[13px] leading-[20px] tracking-[-0.13px]" style={{ backgroundColor: tokens.bgSubtle, color: tokens.black }}>
        {message.text}
      </div>
    </div>
  );
}

/** Кружок цитаты по 46382:6582: 16×16 (две цифры — 22×16), рамка grey-40, цифра Semi Bold 10 grey, по центру
 *  по кап-высоте (text-box trim), в строке 13/20 стоит по вертикальному центру */
function CitationDot({ n, hover }: { n: number; hover?: boolean }) {
  return (
    <span
      className={`inline-flex h-[16px] shrink-0 items-center justify-center rounded-full border px-[4px] text-[10px] font-semibold leading-none tracking-[-0.2px] whitespace-nowrap ${n >= 10 ? "w-[22px]" : "w-[16px]"} ${pressableClass}`}
      style={{ borderColor: tokens.border, color: tokens.grey, backgroundColor: hover ? tokens.bgSubtle : "transparent" }}
    >
      {/* обрезка по кап-высоте на самом тексте — тогда flex центрирует именно цифру, а не строку с ее выносами */}
      <span className="block [text-box:trim-both_cap_alphabetic]">{n}</span>
    </span>
  );
}

/** Значок цитаты [n] с карточкой источника на ховере (46382:7400): шапка — миниатюра, название и дата,
 *  на ховере карточки дата уступает место стрелке; клик по карточке ведет на страницу встречи */
/** Просмотр диалога гостем (46770:15573): ссылки на встречи-источники недоступны — карточки цитат и строки шага
 *  показываются без стрелки перехода и не кликаются. Провайдер ставит страница */
export const ReadOnlyContext = createContext(false);

function CitationBadge({ n, meetingId }: { n: number; meetingId?: string }) {
  const readOnly = useContext(ReadOnlyContext);
  const [hover, setHover] = useState(false);
  const [cardHover, setCardHover] = useState(false);
  const [alignRight, setAlignRight] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
    },
    [],
  );
  const meeting = meetingId ? meetingById(meetingId) : undefined;
  const CARD_W = 340;
  return (
    <span
      className="relative mt-[2px] inline-flex h-[16px] align-top"
      onMouseEnter={(e) => {
        if (hoverTimer.current) clearTimeout(hoverTimer.current);
        // Вернулись до закрытия (с кружка на карточку через зазор) — просто остаемся открытыми
        if (hover) return;
        const rect = e.currentTarget.getBoundingClientRect();
        setAlignRight(rect.left + CARD_W > window.innerWidth - 24);
        // Небольшая задержка: проход мышью по тексту не должен мигать поповерами
        hoverTimer.current = setTimeout(() => setHover(true), 120);
      }}
      onMouseLeave={() => {
        if (hoverTimer.current) clearTimeout(hoverTimer.current);
        // Пауза перед закрытием: между кружком и карточкой 4px, курсор проходит их не мгновенно
        hoverTimer.current = setTimeout(() => {
          setHover(false);
          setCardHover(false);
        }, 160);
      }}
    >
      {/* К пробелам из текста добавляем по 2px с обеих сторон — так кружок не липнет ни к точке, ни к следующему слову */}
      <span className="mx-[2px] inline-flex">
        <CitationDot n={n} hover={hover} />
      </span>
      {meeting && (
        <Popover open={hover} direction="down" padding={0} style={{ boxShadow: "0 0 4px rgba(0,0,0,0.2)" }} className={`top-[20px] z-50 w-[340px] overflow-hidden ${alignRight ? "right-0" : "left-0"}`}>
          {/* В прототипе страница встречи одна — ведем на нее; у гостя карточка не кликается и без стрелки */}
          {(() => {
            const inner = (
            <>
            {/* Карточка по 46919:10663: один блок p-8 с gap-8, без разделителя; название Medium 12, дата text/disabled */}
            <span className="flex w-full flex-col gap-[8px] p-[8px]">
            <span className="flex w-full items-center gap-[6px]">
              <MeetingThumb thumb={meeting.thumb} width={26} height={16} radius={2} plain />
              <span className="min-w-0 flex-1 truncate text-[12px] font-medium leading-[normal] tracking-[-0.12px]" style={{ color: tokens.black }}>
                {meeting.title}
              </span>
              {/* Дата и стрелка стоят на одном месте: на ховере карточки дата гаснет, стрелка проявляется */}
              <span className="relative flex h-[16px] shrink-0 items-center justify-end">
                <span
                  className="whitespace-nowrap text-[12px] leading-[normal] tracking-[-0.24px] transition-opacity duration-[120ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
                  style={{ color: tokens.greyDisabled, opacity: cardHover ? 0 : 1 }}
                >
                  {formatLongDate(meeting.date)}
                </span>
                {!readOnly && (
                <span
                  className="absolute right-0 flex rotate-90 transition-opacity duration-[120ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
                  style={{ color: tokens.grey, opacity: cardHover ? 1 : 0 }}
                  aria-hidden="true"
                >
                  {/* в макете стрелка «наружу» повернута на 90° — смотрит вправо-вверх */}
                  <Ic name="fig-arrow-out" />
                </span>
                )}
              </span>
            </span>
            <span className="flex w-full flex-col text-[12px] leading-[18px] tracking-[-0.24px]" style={{ color: tokens.black }}>
              {/* таймкод момента в транскрипте перед тезисом (46521:6208), синий; в проде придет от бэка */}
              {meeting.summary.map((t, i) => (
                <span key={t}>
                  <span style={{ color: tokens.blue }}>{mockTimecode(meeting.durationMin, i, meeting.summary.length)}</span> {t}
                </span>
              ))}
            </span>
            </span>
            </>
            );
            return readOnly ? (
              <div className="flex w-full flex-col text-left">{inner}</div>
            ) : (
              <Link
                href="/ai-export-sharing"
                className={`flex w-full flex-col text-left ${focusRingClass}`}
                aria-label={`Открыть встречу «${meeting.title}»`}
                onMouseEnter={() => setCardHover(true)}
                onMouseLeave={() => setCardHover(false)}
              >
                {inner}
              </Link>
            );
          })()}
        </Popover>
      )}
    </span>
  );
}

/** Цитата-ссылка на сайт (46761:7994): кружок 16 с иконкой ссылки 10, по ховеру карточка с заголовком и доменом (46763:8492) */
function WebCitationBadge({ source, onOpen }: { source: WebSource; onOpen?: (title: string) => void }) {
  const [hover, setHover] = useState(false);
  const [alignRight, setAlignRight] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
    },
    [],
  );
  return (
    <span
      className="relative mt-[2px] inline-flex h-[16px] align-top"
      onMouseEnter={(e) => {
        if (hoverTimer.current) clearTimeout(hoverTimer.current);
        // У правого края колонки карточку прижимаем вправо, иначе ее режет скролл-контейнер
        const rect = e.currentTarget.getBoundingClientRect();
        setAlignRight(rect.left + 260 > window.innerWidth - 24 || rect.right + 200 > (e.currentTarget.closest(".group\\/answer")?.getBoundingClientRect().right ?? Infinity));
        hoverTimer.current = setTimeout(() => setHover(true), 120);
      }}
      onMouseLeave={() => {
        if (hoverTimer.current) clearTimeout(hoverTimer.current);
        hoverTimer.current = setTimeout(() => setHover(false), 160);
      }}
    >
      <button
        type="button"
        aria-label={`Источник: ${source.title}`}
        onClick={() => onOpen?.(source.title)}
        className={`mx-[2px] inline-flex h-[16px] w-[16px] items-center justify-center rounded-full border ${pressableClass} ${focusRingClass}`}
        style={{ borderColor: tokens.border, backgroundColor: hover ? tokens.bgSubtle : "transparent", color: tokens.grey }}
      >
        <Ic name="fig-link-10" size={10} />
      </button>
      <Popover open={hover} direction="down" padding={0} style={{ boxShadow: "0 0 4px rgba(0,0,0,0.2)" }} className={`top-[20px] z-50 w-max max-w-[260px] overflow-hidden ${alignRight ? "right-0" : "left-0"}`}>
        <span className="flex w-full flex-col gap-[8px] p-[8px] text-left">
          <span className="text-[13px] font-medium leading-[normal] tracking-[-0.13px]" style={{ color: tokens.black }}>
            {source.title}
          </span>
          <span className="flex items-center gap-[6px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={gcAsset(source.favicon)} alt="" className="h-[16px] w-[16px] shrink-0 object-contain" />
            <span className="text-[12px] leading-[normal] tracking-[-0.24px]" style={{ color: tokens.greyDisabled }}>
              {source.domain}
            </span>
          </span>
        </span>
      </Popover>
    </span>
  );
}

/** Строка текста с цитатами [n]: по встречам — кружки с номерами, по интернету — кружки-ссылки */
function InlineWithCitations({ text, sources, web, onOpenLink, keyPrefix }: { text: string; sources: string[]; web?: WebSource[]; onOpenLink?: (title: string) => void; keyPrefix: string }) {
  // Кроме цитат [n] понимаем выделение **так**: подводки тезисов набраны Semi Bold (46750:8049)
  const parts = text.split(/(\[\d+\]|\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) => {
        const bold = p.match(/^\*\*([^*]+)\*\*$/);
        if (bold) {
          return (
            <span key={`${keyPrefix}-${i}`} className="font-semibold">
              {bold[1]}
            </span>
          );
        }
        const m = p.match(/^\[(\d+)\]$/);
        if (m) {
          const n = Number(m[1]);
          if (web) {
            const src = web[n - 1];
            return src ? <WebCitationBadge key={`${keyPrefix}-${i}`} source={src} onOpen={onOpenLink} /> : null;
          }
          return <CitationBadge key={`${keyPrefix}-${i}`} n={n} meetingId={sources[n - 1]} />;
        }
        return <span key={`${keyPrefix}-${i}`}>{p}</span>;
      })}
    </>
  );
}

/** Текст ответа: абзацы, буллеты двух уровней, цитаты. 14/24, как в макете */
export function AnswerText({ text, sources = [], web, onOpenLink }: { text: string; sources?: string[]; web?: WebSource[]; onOpenLink?: (title: string) => void; /** оставлен в сигнатуре для вызовов; курсор стрима больше не рисуем */ streaming?: boolean }) {
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
            <InlineWithCitations text={c} sources={sources} web={web} onOpenLink={onOpenLink} keyPrefix={`${prefix}-${j}`} />
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
              <InlineWithCitations text={it.text} sources={sources} web={web} onOpenLink={onOpenLink} keyPrefix={`li-${k}-${i}`} />
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
        <InlineWithCitations text={raw} sources={sources} web={web} onOpenLink={onOpenLink} keyPrefix={`p-${i}`} />
      </p>,
    );
  });
  flush(lines.length);
  return (
    <div className="w-full text-[13px] leading-[20px] tracking-[-0.13px]" style={{ color: tokens.black }}>
      {blocks}
      {/* Курсор стрима убран по просьбе дизайнера: черный прямоугольник в начале строк отвлекал */}
    </div>
  );
}

/** Шаг «Смотрю встречи…»: клик раскрывает список просмотренных встреч */
/** Подпись шага по фазе (46738:7497 / 7646 / 7840): ищем → анализируем → посмотрели */
const STEP_LABEL: Record<"looking" | "analyzing" | "done", string> = {
  looking: "Ищу подходящие встречи",
  analyzing: "Анализирую встречи",
  done: "Посмотрел встречи",
};

function StepRow({ step, phase, accent, web, onOpenMeeting, onOpenLink }: { step: NonNullable<Message["step"]>; phase: "looking" | "analyzing" | "done"; /** акцент, пока аватар стоит напротив шага */ accent?: string; /** источники из интернета вместо встреч (46761:8022) */ web?: WebSource[]; onOpenMeeting?: (id: string) => void; onOpenLink?: (title: string) => void }) {
  const readOnly = useContext(ReadOnlyContext);
  const looking = phase !== "done";
  const label = web ? (looking ? "Ищу в интернете" : "Поискал в интернете") : STEP_LABEL[phase];
  const [open, setOpen] = useState(false);
  const labelRef = useRef<HTMLSpanElement>(null);
  const [labelWidth, setLabelWidth] = useState<number | null>(null);
  // Ширина текста нужна шиммеру, чтобы блик шел по тексту и шеврону как по одному элементу
  useLayoutEffect(() => {
    if (!looking) return;
    const el = labelRef.current;
    if (el) setLabelWidth(el.getBoundingClientRect().width);
  }, [looking, phase]);
  const shimmer = looking && labelWidth !== null;
  return (
    <div className="flex w-full flex-col gap-[16px]">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`group flex w-fit items-center gap-[2px] rounded-[2px] text-left ${shimmer ? "gc-shimmer-row" : ""} ${pressableClass} ${focusRingClass}`}
        style={shimmer ? ({ ["--gc-shim-w" as string]: `${labelWidth}px` } as React.CSSProperties) : undefined}
      >
        {/* цвет классами, не inline: инлайновый перебивал бы group-hover */}
        <span
          ref={labelRef}
          className={`text-[13px] leading-[20px] tracking-[-0.13px] ${shimmer ? "gc-shimmer-run-text" : accent ? "" : "text-[#818AA3] group-hover:text-[#585E6C]"} ${pressableClass}`}
          style={!shimmer && accent ? { color: accent } : undefined}
        >
          {label}
        </span>
        <span
          className={`flex h-[16px] w-[16px] translate-y-[1px] items-center justify-center transition-transform duration-[180ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none ${accent && !shimmer ? "" : "text-[#818AA3] group-hover:text-[#585E6C]"} ${open ? "rotate-90" : ""}`}
          style={!shimmer && accent ? { color: accent } : undefined}
        >
          {/* шеврон на 1px ниже центра строки — оптически по центру текста 13/20 */}
          <Ic name="chevron-right" color={shimmer ? "transparent" : undefined} className={shimmer ? "gc-shimmer-run-icon" : ""} />
        </span>
      </button>
      {open && (
        <div className="gc-enter flex w-full flex-col rounded-[4px] border p-[8px]" style={{ borderColor: tokens.border }}>
          {web?.map((w) => (
            <button
              key={w.title}
              type="button"
              onClick={() => onOpenLink?.(w.title)}
              className={`group/row flex w-full items-center gap-[6px] rounded-[2px] px-[8px] py-[8px] text-left hover:bg-[#F7F7F8] ${pressableClass} ${focusRingClass}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={gcAsset(w.favicon)} alt="" className="h-[16px] w-[16px] shrink-0 object-contain" />
              <span className="min-w-0 flex-1 truncate text-[13px] leading-[normal] tracking-[-0.13px]" style={{ color: tokens.black }}>
                {w.title}
              </span>
              <span className="relative flex h-[16px] shrink-0 items-center justify-end">
                <span
                  className="whitespace-nowrap text-[12px] leading-[normal] tracking-[-0.24px] transition-opacity duration-[120ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover/row:opacity-0 motion-reduce:transition-none"
                  style={{ color: tokens.greyDisabled }}
                >
                  {w.domain}
                </span>
                <span
                  className="absolute right-0 flex rotate-90 opacity-0 transition-opacity duration-[120ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover/row:opacity-100 motion-reduce:transition-none"
                  style={{ color: tokens.grey }}
                  aria-hidden="true"
                >
                  <Ic name="fig-arrow-out" />
                </span>
              </span>
            </button>
          ))}
          {step.meetingIds.map((id) => {
            const m = meetingById(id);
            if (!m) return null;
            // У гостя строка встречи — просто строка: без ховера, стрелки и перехода
            const Row = readOnly ? "div" : "button";
            return (
              <Row
                key={id}
                {...(readOnly ? {} : { type: "button" as const, onClick: () => onOpenMeeting?.(id) })}
                className={readOnly ? "flex w-full items-center gap-[6px] rounded-[2px] px-[8px] py-[8px] text-left" : `group/row flex w-full items-center gap-[6px] rounded-[2px] px-[8px] py-[8px] text-left hover:bg-[#F7F7F8] ${pressableClass} ${focusRingClass}`}
              >
                <MeetingThumb thumb={m.thumb} width={26} height={16} radius={2} plain />
                <span className="min-w-0 flex-1 truncate text-[13px] leading-[normal] tracking-[-0.13px]" style={{ color: tokens.black }}>
                  {m.title}
                </span>
                {/* Дата и стрелка перехода стоят на одном месте, как в карточке цитаты: на ховере строки дата гаснет, стрелка проявляется */}
                <span className="relative flex h-[16px] shrink-0 items-center justify-end">
                  <span
                    className="whitespace-nowrap text-[12px] leading-[normal] tracking-[-0.24px] transition-opacity duration-[120ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover/row:opacity-0 motion-reduce:transition-none"
                    style={{ color: tokens.greyDisabled }}
                  >
                    {formatLongDate(m.date)}
                  </span>
                  {!readOnly && (
                  <span
                    className="absolute right-0 flex rotate-90 opacity-0 transition-opacity duration-[120ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover/row:opacity-100 motion-reduce:transition-none"
                    style={{ color: tokens.grey }}
                    aria-hidden="true"
                  >
                    <Ic name="fig-arrow-out" />
                  </span>
                  )}
                </span>
              </Row>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Уточнение режима: две карточки, склеенные в стек (верхняя без нижней рамки) */
/** Таблица в ответе (46753:7815): рамка grey-40, шапка на grey-20 Medium 13, ячейки 13/20, px-16 py-12, вертикальные разделители */
function AnswerTableView({ table }: { table: AnswerTable }) {
  return (
    <div className="gc-enter w-full overflow-hidden rounded-[4px] border" style={{ borderColor: tokens.border }}>
      <div className="flex w-full border-b" style={{ backgroundColor: tokens.bgSubtle, borderColor: tokens.border }}>
        {table.head.map((h, i) => (
          <div key={h} className={`flex min-w-0 flex-1 items-center px-[16px] py-[12px] ${i < table.head.length - 1 ? "border-r" : ""}`} style={{ borderColor: tokens.border }}>
            <span className="text-[13px] font-medium leading-[normal] tracking-[-0.13px]" style={{ color: tokens.black }}>
              {h}
            </span>
          </div>
        ))}
      </div>
      {table.rows.map((row, r) => (
        <div key={r} className={`flex w-full ${r < table.rows.length - 1 ? "border-b" : ""}`} style={{ borderColor: tokens.border }}>
          {row.map((cell, c) => (
            <div key={c} className={`flex min-w-0 flex-1 items-center px-[16px] py-[12px] ${c < row.length - 1 ? "border-r" : ""}`} style={{ borderColor: tokens.border }}>
              <span className="text-[13px] leading-[20px] tracking-[-0.13px]" style={{ color: tokens.black }}>
                {cell}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/** Файл как результат ответа (46814:16822): карточка 360 с мини-превью документа, названием, форматом и «Скачать» */
function FileResultCard({ file, onDownload }: { file: Omit<FileAttachment, "id">; onDownload?: () => void }) {
  return (
    // Карточка режет содержимое сама (overflow-clip в макете): листок превью выше своего слота 50×36 и уходит под нижний край карточки
    <div className="gc-enter group/filecard flex w-[360px] max-w-full items-center gap-[12px] overflow-hidden rounded-[4px] border bg-white p-[16px]" style={{ borderColor: tokens.border }}>
      {/* превью: белый листок 48px, повернут на −4°, тень, заголовок 4px и семь серых строчек; слот не режет — только карточка */}
      <span className="relative flex h-[36px] w-[50px] shrink-0 items-start justify-center">
        {/* На ховере карточки листок выравнивается в 0°: мягко, как кладут бумагу на стол */}
        <span
          className="absolute left-[1px] top-[-2px] flex w-[48px] origin-center -rotate-4 flex-col gap-[3px] rounded-[3px] bg-white p-[6px] transition-[rotate] duration-[220ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover/filecard:rotate-0 motion-reduce:transition-none"
          style={{ boxShadow: "0 0 4px rgba(0,0,0,0.2)" }}
        >
          <span className="whitespace-nowrap text-[4px] font-semibold leading-[normal] tracking-[-0.04px]" style={{ color: "#585E6C" }}>
            {file.name}
          </span>
          {[36, 32, 35, 33, 35, 32, 33].map((w, i) => (
            <span key={i} className="block h-[3px] rounded-[1px]" style={{ width: w, backgroundColor: tokens.border }} />
          ))}
        </span>
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
        <span className="truncate text-[13px] font-medium leading-[normal] tracking-[-0.13px]" style={{ color: tokens.black }}>
          {file.name}
        </span>
        <span className="flex items-center gap-[4px] text-[12px] leading-[normal] tracking-[-0.24px]" style={{ color: tokens.grey }}>
          {file.ext}
          <span className="h-[3px] w-[3px] rounded-full" style={{ backgroundColor: tokens.grey }} />
          {file.size}
        </span>
      </span>
      <button
        type="button"
        onClick={onDownload}
        // Заливка классом, а не inline-стилем: иначе hover:bg не перебивал бы ее
        className={`flex shrink-0 items-center rounded-[4px] bg-[#F7F7F8] px-[12px] py-[10px] text-[13px] leading-[16px] tracking-[-0.13px] hover:bg-[#EFEFEF] ${pressableClass} ${focusRingClass}`}
        style={{ color: tokens.black }}
      >
        Скачать
      </button>
    </div>
  );
}

/** Бесплатные вопросы кончились (46768:12497): вместо ответа плашка 480 с иконкой апгрейда и шевроном */
export function LimitCard({ onUpgrade }: { onUpgrade?: () => void }) {
  return (
    <button
      type="button"
      onClick={onUpgrade}
      className={`gc-enter flex w-[480px] max-w-full items-center gap-[12px] rounded-[4px] border bg-white p-[16px] text-left hover:bg-[#FAFAFA] ${pressableClass} ${focusRingClass}`}
      style={{ borderColor: tokens.border }}
    >
      <span className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-[4px]" style={{ backgroundColor: tokens.bgSubtle, color: tokens.blue }}>
        <Ic name="fig-arrow-up-circle" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
        <span className="text-[13px] font-medium leading-[normal] tracking-[-0.13px]" style={{ color: tokens.black }}>
          Бесплатные вопросы в чате закончились
        </span>
        <span className="truncate text-[12px] leading-[normal] tracking-[-0.24px]" style={{ color: tokens.grey }}>
          Чат без лимита доступен на тарифах Pro и Business
        </span>
      </span>
      <span className="flex h-[20px] w-[20px] shrink-0 items-center justify-center" style={{ color: tokens.grey }}>
        <Ic name="fig-chevron-right-20" size={20} />
      </span>
    </button>
  );
}

/** Модалка обратной связи после дизлайка (46783:8999): тип проблемы дропдауном, комментарий, «Пропустить» и «Отправить» */
const FEEDBACK_REASONS = ["Не по тем встречам", "Придумал то, чего не было", "Ответ неполный", "Не понял вопрос", "Ссылки на встречи не сходятся", "Плохо читается", "Другое"];

function FeedbackModal({ open, onClose, onSubmit }: { open: boolean; onClose: () => void; onSubmit: () => void }) {
  return <AnimatePresence>{open && <FeedbackModalInner key="feedback" onClose={onClose} onSubmit={onSubmit} />}</AnimatePresence>;
}

function FeedbackModalInner({ onClose, onSubmit }: { onClose: () => void; onSubmit: () => void }) {
  const [reason, setReason] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  useOutsideClose([panelRef], true, useCallback(() => onClose(), [onClose]));
  useOutsideClose([menuRef], menuOpen, useCallback(() => setMenuOpen(false), []));
  const reduce = useReducedMotion();
  const canSend = reason !== null || comment.trim().length > 0;
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
      aria-label="Обратная связь"
    >
      <motion.div
        ref={panelRef}
        className="flex w-[400px] flex-col rounded-[4px] bg-white"
        style={{ boxShadow: "0 0 2.5px rgba(0,0,0,0.15)" }}
        initial={reduce ? { opacity: 0 } : { opacity: 0, transform: "scale(0.97)" }}
        animate={reduce ? { opacity: 1 } : { opacity: 1, transform: "scale(1)" }}
        exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, transform: "scale(0.98)", transition: { duration: 0.15, ease: easeOut } }}
        transition={{ duration: 0.22, ease: easeOut }}
      >
        <div className="flex items-center justify-between rounded-t-[4px] border-b p-[16px]" style={{ borderColor: tokens.border }}>
          <span className="flex items-center gap-[8px]">
            <span className="flex" style={{ color: tokens.grey }}>
              <Ic name="fig-chat" />
            </span>
            <span className="text-[14px] leading-[1.35] tracking-[-0.28px]" style={{ color: tokens.black }}>
              Обратная связь
            </span>
          </span>
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
        <div className="flex flex-col gap-[24px] px-[16px] py-[24px]">
          <div className="flex flex-col gap-[8px]">
            <span className="text-[13px] leading-[16px] tracking-[-0.13px]" style={{ color: tokens.black }}>
              Тип проблемы (опционально)
            </span>
            <div ref={menuRef} className="relative">
              <button
                type="button"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((v) => !v)}
                className={`flex w-full items-center gap-[8px] rounded-[4px] border bg-white px-[12px] py-[10px] text-left ${pressableClass} ${focusRingClass}`}
                style={{ borderColor: menuOpen ? tokens.blue : tokens.border }}
              >
                <span className="min-w-0 flex-1 truncate text-[13px] leading-[16px] tracking-[-0.13px]" style={{ color: tokens.black }}>
                  {reason ?? "Выберите"}
                </span>
                <span className={`flex transition-transform duration-[180ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none ${menuOpen ? "rotate-180" : ""}`} style={{ color: tokens.grey }}>
                  <Ic name="chevron-down" />
                </span>
              </button>
              <Popover open={menuOpen} direction="down" padding={4} style={{ boxShadow: shadow }} className="left-0 right-0 top-[calc(100%+4px)] z-10">
                <div role="listbox" className="flex flex-col">
                  {FEEDBACK_REASONS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      role="option"
                      aria-selected={reason === r}
                      onClick={() => {
                        setReason(r);
                        setMenuOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-[2px] px-[8px] py-[8px] text-left text-[13px] leading-[16px] tracking-[-0.13px] hover:bg-[#F7F7F8] ${pressableClass} ${focusRingClass}`}
                      style={{ color: tokens.black }}
                    >
                      {r}
                      {reason === r && (
                        <span className="flex" style={{ color: tokens.grey }}>
                          <Ic name="fig-check" />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </Popover>
            </div>
          </div>
          <div className="flex flex-col gap-[8px]">
            <span className="text-[13px] leading-[16px] tracking-[-0.13px]" style={{ color: tokens.black }}>
              Комментарий
            </span>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Мне не понравилось, что..."
              rows={3}
              className="w-full resize-none rounded-[4px] border bg-white px-[12px] py-[10px] text-[14px] leading-[1.35] tracking-[-0.28px] outline-none placeholder:text-[#C7C8CA] focus:border-[#0138C7]"
              style={{ borderColor: tokens.border, color: tokens.black }}
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-[8px] rounded-b-[4px] border-t p-[16px]" style={{ backgroundColor: tokens.bgSubtle, borderColor: tokens.border }}>
          <button
            type="button"
            onClick={onClose}
            className={`flex h-[36px] items-center justify-center rounded-[4px] bg-[#F7F7F8] px-[12px] text-[13px] leading-[normal] tracking-[-0.13px] hover:bg-[#EFEFEF] ${pressableClass} ${focusRingClass}`}
            style={{ color: tokens.black }}
          >
            Пропустить
          </button>
          <button
            type="button"
            disabled={!canSend}
            onClick={onSubmit}
            className={`flex h-[36px] items-center justify-center rounded-[4px] bg-[#0138C7] px-[12px] text-[13px] font-medium leading-[normal] tracking-[-0.13px] text-white hover:bg-[#0032B1] disabled:cursor-not-allowed disabled:bg-[#809BE3] disabled:hover:bg-[#809BE3] ${pressableClass} ${focusRingClass}`}
          >
            Отправить
          </button>
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  );
}

/** Вопрос про сервис (46738:7466): три ссылки-карточки 480px — база знаний, поддержка, продажи; иконки в своих цветах на плашке grey-20 */
const SUPPORT_LINKS: { icon: IconName; color: string; title: string; text: string }[] = [
  { icon: "fig-knowledge", color: tokens.green, title: "База знаний", text: "Инструкции по записи, отчетам, интеграциям и тарифам" },
  { icon: "fig-support", color: tokens.blue, title: "Написать в поддержку", text: "Ответим на почту в рабочее время" },
  { icon: "fig-sales", color: tokens.black, title: "Связаться с отделом продаж", text: "Командный тариф, оплата по счету, демо для команды" },
];

function SupportCards({ onPick }: { onPick?: (title: string) => void }) {
  return (
    <div className="flex w-[480px] max-w-full flex-col">
      {SUPPORT_LINKS.map((l, i) => (
        <button
          key={l.title}
          type="button"
          onClick={() => onPick?.(l.title)}
          className={`gc-enter flex w-full items-center gap-[12px] border bg-white p-[16px] text-left hover:bg-[#FAFAFA] ${i === 0 ? "rounded-t-[4px]" : "-mt-px"} ${i === SUPPORT_LINKS.length - 1 ? "rounded-b-[4px]" : ""} ${pressableClass} ${focusRingClass}`}
          style={{ borderColor: tokens.border, animationDelay: `${i * 50}ms` }}
        >
          <span className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-[4px]" style={{ backgroundColor: tokens.bgSubtle, color: l.color }}>
            <Ic name={l.icon} />
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
            <span className="text-[13px] font-medium leading-[normal] tracking-[-0.13px]" style={{ color: tokens.black }}>
              {l.title}
            </span>
            <span className="truncate text-[12px] leading-[normal] tracking-[-0.24px]" style={{ color: tokens.grey }}>
              {l.text}
            </span>
          </span>
          <span className="flex h-[20px] w-[20px] shrink-0 items-center justify-center" style={{ color: tokens.grey }}>
            <Ic name="fig-chevron-right-20" size={20} />
          </span>
        </button>
      ))}
    </div>
  );
}

function ClarifyCards({ clarify, onChoose }: { clarify: NonNullable<Message["clarify"]>; onChoose?: (mode: Mode) => void }) {
  const reduce = useReducedMotion();
  const options = clarify.chosen ? clarify.options.filter((o) => o.mode === clarify.chosen) : clarify.options;
  return (
    <div className="flex w-[480px] max-w-full flex-col">
      {/* Карточки по 46583:6622: 480px, плашка режима 32 с персонажем, название 13 Medium и описание 12 через 1px.
          После выбора невыбранная карточка схлопывается, выбранная остается на месте с галочкой */}
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
            data-avatar-hover
            className={`gc-enter flex w-full items-center gap-[12px] border bg-white p-[16px] text-left ${first ? "rounded-t-[4px]" : "-mt-px"} ${last ? "rounded-b-[4px]" : ""} ${done ? "cursor-default" : "hover:bg-[#FAFAFA]"} ${pressableClass} ${focusRingClass}`}
            style={{ borderColor: tokens.border, animationDelay: `${i * 50}ms` }}
          >
            {/* плашка 36 grey-20 с иконкой в цвете варианта: аналитика фиолетовая, вопрос оранжевый (46783:9150) */}
            <span className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-[4px]" style={{ backgroundColor: tokens.bgSubtle, color: m.color }}>
              <Ic name={o.mode === "analytics" ? "fig-chart" : "fig-bolt"} />
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
              <Ic name={done ? "fig-check" : "fig-chevron-right-20"} size={done ? 16 : 20} />
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
  onSupportLink,
  onUpgrade,
  onFeedback,
}: {
  message: Message;
  generation: Generation | null;
  onChoose?: (mode: Mode) => void;
  onOpenMeeting?: (id: string) => void;
  onCopy?: (text: string) => void;
  /** Клик по карточке «База знаний / Поддержка / Продажи», по источнику из интернета или по «Скачать» */
  onSupportLink?: (title: string) => void;
  onUpgrade?: () => void;
  onFeedback?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [vote, setVote] = useState<"up" | "down" | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
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
  // Счетчик секунд в статусе «Думаю N сек...» (46450:5960): тикает, пока модель думает
  const thinkingSince = mine === "thinking" ? generation?.startedAt ?? null : null;
  const [thinkSeconds, setThinkSeconds] = useState(0);
  useEffect(() => {
    if (thinkingSince === null) return;
    const tick = () => setThinkSeconds(Math.floor((Date.now() - thinkingSince) / 1000));
    const t = setInterval(tick, 250);
    return () => clearInterval(t);
  }, [thinkingSince]);
  // Шиммер на статусах — пока модель думает и смотрит встречи; с первым словом ответа гаснет
  const generating = mine === "thinking" || mine === "looking" || mine === "analyzing";
  const looking = mine === "looking" || mine === "analyzing";
  const streaming = mine === "streaming";
  const awaitingChoice = message.clarify && message.clarify.chosen === undefined;
  const idle = mine === null && !awaitingChoice;
  const done = idle && message.text.length > 0 && !message.support && !message.limited;
  // Аватар ответа: синий персонаж «Авто», один для всех ответов (режимы пользователю не показываем).
  // Живет снаружи колонки слева (left −24: 16 иконка + 8 отступ), поэтому текст статусов и ответа стоит
  // на одной вертикали и не сдвигается, когда аватар исчезает. Едет вниз вслед за этапом: «Думаю...» →
  // «Смотрю встречи…» → первая строка ответа; через 5с после конца ответа гаснет. У старых ответов его нет
  const accent = tokens.blue;
  const thinkRef = useRef<HTMLSpanElement>(null);
  const clarifyRef = useRef<HTMLParagraphElement>(null);
  const stepRef = useRef<HTMLDivElement>(null);
  const answerRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLSpanElement>(null);
  const avatarY = useRef<number | null>(null);
  const [avatarShown, setAvatarShown] = useState(mine !== null);
  useEffect(() => {
    if (mine !== null) {
      const t = setTimeout(() => setAvatarShown(true), 0);
      return () => clearTimeout(t);
    }
    if (!avatarShown) return;
    const t = setTimeout(() => setAvatarShown(false), AVATAR_LINGER_MS);
    return () => clearTimeout(t);
  }, [mine, avatarShown]);
  // В уточнении аватар стоит напротив вопроса «Не очень понял…» (46783:9028), а не напротив «Думаю»
  const stage = awaitingChoice ? "clarify" : streaming || (mine === null && message.text.length > 0) ? "answer" : looking ? "step" : "think";
  const blockRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const place = (animated: boolean) => {
      const el = avatarRef.current;
      const target = stage === "answer" ? answerRef.current : stage === "step" ? stepRef.current : stage === "clarify" ? clarifyRef.current : thinkRef.current;
      if (!el || !target) return;
      // offsetTop относительно блока (он relative); +1 — иконка 16 в строке 13/20 на глаз чуть выше центра,
      // так она стоит на одной оси с текстом статуса
      const y = target.offsetTop + 1;
      if (avatarY.current === y) return;
      const first = avatarY.current === null;
      const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
      const from = first ? y : avatarY.current;
      avatarY.current = y;
      el.getAnimations().forEach((an) => an.cancel());
      el.animate([{ transform: `translateY(${from}px)` }, { transform: `translateY(${y}px)` }], {
        duration: first || reduce || !animated ? 0 : 360,
        easing: "cubic-bezier(0.32, 0.72, 0, 1)",
        fill: "forwards",
      });
    };
    place(true);
    // Блок меняет высоту и без смены этапа: раскрыли список встреч, перенеслись строки — аватар едет за своей строкой
    const block = blockRef.current;
    if (!block || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => place(true));
    ro.observe(block);
    return () => ro.disconnect();
  }, [stage, avatarShown, message.step, awaitingChoice]);
  return (
    <div ref={blockRef} className="gc-enter group/answer relative flex w-full flex-col items-start gap-[16px]">
      <AnimatePresence>
        {avatarShown && (
          <motion.span
            key="avatar"
            className="absolute left-[-24px] top-0 flex"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            // Исчезновение: плавно тает за 400мс, без движения (позиция сидит на вложенном слое)
            exit={{ opacity: 0, transition: { duration: 0.4, ease: easeOut } }}
            transition={{ duration: 0.18, ease: easeOut }}
            aria-hidden="true"
          >
            <span ref={avatarRef} data-gc-answer-avatar className="flex">
              <ModeGlyph mode="auto" thinking={generating} />
            </span>
          </motion.span>
        )}
      </AnimatePresence>
      {/* Статус красится в цвет аватара, пока аватар стоит напротив него (46450:5960): во время думанья с бликом
          шиммера, в уточнении и паузах ровным цветом; когда аватар уехал дальше или исчез — серый.
          inline color перебивал бы color: transparent у шиммера, поэтому цвет шиммера через переменные */}
      {message.limited && <LimitCard onUpgrade={onUpgrade} />}
      {!message.limited && (
      <span
        ref={thinkRef}
        className={`text-[13px] leading-[20px] tracking-[-0.13px] ${mine === "thinking" ? "gc-shimmer-text" : ""}`}
        style={mine === "thinking" ? shimmerVars(accent) : avatarShown && stage === "think" ? { color: accent } : { color: tokens.grey }}
      >
        {mine === "thinking" ? (thinkSeconds > 0 ? `Думаю ${thinkSeconds} сек...` : "Думаю...") : message.thoughtSec ? `Думал ${message.thoughtSec} сек...` : "Думаю..."}
      </span>
      )}
      {message.clarify && (
        <>
          <p ref={clarifyRef} className="gc-enter text-[13px] leading-[20px] tracking-[-0.13px]" style={{ color: tokens.black }}>
            Не очень понял вопрос, уточните пожалуйста, что вы имеете в виду?
          </p>
          <ClarifyCards clarify={message.clarify} onChoose={onChoose} />
        </>
      )}
      {message.support && (
        <>
          <p ref={answerRef} className="gc-enter text-[13px] leading-[20px] tracking-[-0.13px]" style={{ color: tokens.black }}>
            {message.text}
          </p>
          <SupportCards onPick={onSupportLink} />
        </>
      )}
      {message.step && !awaitingChoice && (
        <div ref={stepRef} className="gc-enter w-full" style={looking ? shimmerVars(accent) : undefined}>
          <StepRow
            step={message.step}
            phase={mine === "looking" ? "looking" : mine === "analyzing" ? "analyzing" : "done"}
            accent={avatarShown && stage === "step" ? accent : undefined}
            web={message.web}
            onOpenMeeting={onOpenMeeting}
            onOpenLink={onSupportLink}
          />
        </div>
      )}
      {(message.text || streaming) && !awaitingChoice && !message.support && (
        <div ref={answerRef} className="flex w-full flex-col gap-[16px]">
          <AnswerText text={message.text} sources={message.sources} web={message.web} onOpenLink={onSupportLink} streaming={streaming} />
          {message.table && !streaming && <AnswerTableView table={message.table} />}
          {message.file && !streaming && <FileResultCard file={message.file} onDownload={() => onSupportLink?.(`${message.file?.name}.${message.file?.ext.toLowerCase()}`)} />}
        </div>
      )}
      {done && (
        <div className="flex items-center gap-[4px] opacity-0 transition-opacity duration-[120ms] group-hover/answer:opacity-100 focus-within:opacity-100 motion-reduce:transition-none">
          <AnswerAction icon="fig-copy" label={copied ? "Скопировано" : "Скопировать ответ"} onClick={copy} copied={copied} />
          {/* После оценки остается только выбранный палец: вторая иконка уходит, повторный клик снимает оценку */}
          {vote !== "down" && <AnswerAction icon="fig-thumb-up" label="Полезно" active={vote === "up"} onClick={() => setVote((v) => (v === "up" ? null : "up"))} />}
          {vote !== "up" && (
            <AnswerAction
              icon="fig-thumb-up"
              label="Не полезно"
              flip
              active={vote === "down"}
              onClick={() => {
                // Дизлайк засчитан по клику, форма — необязательный второй шаг (46761:6471)
                const next = vote === "down" ? null : "down";
                setVote(next);
                if (next === "down") setFeedbackOpen(true);
              }}
            />
          )}
        </div>
      )}
      <FeedbackModal
        open={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        onSubmit={() => {
          setFeedbackOpen(false);
          onFeedback?.();
        }}
      />
    </div>
  );
}
