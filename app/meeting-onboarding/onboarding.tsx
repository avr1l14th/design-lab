"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CHAPTERS, DURATION } from "./welcome-content";

// Онбординг приветственной встречи «Добро пожаловать в mymeet.ai» (Figma 47774:14295 и 47774:14296):
// — тур из 7 тултипов по разделам встречи, по порядку, с кнопкой «Дальше»;
// — мини-плеер внизу страницы и плеер на весь экран с плашкой про тарифы.

const BASE = process.env.NODE_ENV === "production" ? "/design-lab" : "";
export const onbAsset = (name: string) => `${BASE}/meeting-onboarding/${name}`;

const tokens = {
  black: "#212833",
  grey: "#818AA3",
  placeholder: "#C7C8CA",
  border: "#EFEFEF",
  bgSubtle: "#F7F7F8",
} as const;

const pressableClass =
  "transition-colors duration-[120ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none";
const focusRingClass = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E4ECFA]";
const easeOut = [0.23, 1, 0.32, 1] as const;

/**
 * Держит элемент в DOM, пока доигрывает анимация скрытия, потом убирает.
 * Вместо AnimatePresence: во framer-motion 12.38 exit у него не завершается — скрытые
 * тултипы и плеер оставались в DOM с opacity 0 и перехватывали клики по странице.
 */
function usePresence(visible: boolean, exitMs: number) {
  const [prev, setPrev] = useState(visible);
  const [exiting, setExiting] = useState(false);
  if (visible !== prev) {
    setPrev(visible);
    setExiting(!visible);
  }
  useEffect(() => {
    if (!exiting) return;
    const t = setTimeout(() => setExiting(false), exitMs);
    return () => clearTimeout(t);
  }, [exiting, exitMs]);
  return visible || exiting;
}

// ─────────────────────────────────────────────────────────────────────────────
// Тур: шаги
// ─────────────────────────────────────────────────────────────────────────────

export type TourTab = "report" | "transcript" | "chat" | "tasks";

export type TourStep = {
  /** Значение data-onb у элемента, на который указывает тултип */
  anchor: string;
  title: string;
  text: string;
  /** Подзаголовок для Pro и Business, если отличается: без апселла */
  textPaid?: string;
  /** Какую вкладку встречи открыть на этом шаге */
  tab: TourTab;
  /** Тултип под элементом (по умолчанию) или над ним */
  placement?: "bottom" | "top";
  /** Зазор между элементом и носиком */
  gap?: number;
};

// Порядок и якоря — как в макете: вкладки → тег → шеринг → плеер.
// Тексты вместо «Что-то про …» из макета: что в разделе можно сделать, по механикам прототипов лабы
// (дропдаун отчетов, таймкоды → транскрипт, чат встречи, фильтры задач, теги пространства, шеринг и AI-экспорт)
export const TOUR_STEPS: TourStep[] = [
  {
    anchor: "tab-report",
    title: "Смотрите итоги встречи в AI Отчете",
    text: "Стройте новые отчеты и переключайтесь между ними по клику на вкладку",
    tab: "report",
  },
  {
    anchor: "tab-transcript",
    title: "Читайте расшифровку встречи целиком",
    text: "Главы помогают быстро найти нужную часть, а реплики можно отредактировать",
    tab: "transcript",
  },
  {
    anchor: "tab-chat",
    title: "Задавайте любые вопросы по встрече",
    text: "Например, что решили или кто за что отвечает — чат ответит по записи встречи",
    tab: "chat",
  },
  {
    anchor: "tab-tasks",
    title: "Следите за задачами со встречи",
    text: "Задачи с исполнителями и сроками можно редактировать и создавать новые",
    tab: "tasks",
  },
  {
    anchor: "tags",
    title: "Помечайте встречи тегами",
    text: "Теги общие для всего пространства — по ним потом легко можно найти нужные встречи",
    tab: "tasks",
  },
  {
    anchor: "share",
    title: "Делитесь встречей с коллегами",
    text: "Отправьте ссылку, скачайте PDF или откройте встречу в ChatGPT и Claude",
    tab: "tasks",
  },
  {
    anchor: "player",
    title: "Смотрите записи встреч в плеере",
    text: "В приветственной встрече плеер открыт бесплатно, для своих встреч улучшите тариф",
    textPaid: "Перематывайте запись к нужному моменту по главам и таймкодам",
    tab: "tasks",
    placement: "top",
    gap: 12,
  },
];

const TIP_WIDTH = 291;
const ARROW_W = 10.3923;
const ARROW_H = 6;
/** Отступ тултипа от края окна — как поля контента шапки */
const EDGE = 24;

/** top — верх тела тултипа; h — высота тела (без носика) */
type Place = { left: number; top: number; arrowLeft: number; placement: "bottom" | "top"; h: number };

function measure(step: TourStep, tipHeight: number): Place | null {
  const el = document.querySelector<HTMLElement>(`[data-onb="${step.anchor}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  const placement = step.placement ?? "bottom";
  const gap = step.gap ?? 4;
  // Тултип центрируется над элементом, носик — посередине тултипа. У края окна тултип упирается
  // в поле, а носик сдвигается к центру элемента
  const center = r.left + r.width / 2;
  const left = Math.max(EDGE, Math.min(center - TIP_WIDTH / 2, window.innerWidth - EDGE - TIP_WIDTH));
  const arrowLeft = Math.max(8, Math.min(center - left - ARROW_W / 2, TIP_WIDTH - 8 - ARROW_W));
  const top = placement === "bottom" ? r.bottom + gap + ARROW_H : r.top - gap - ARROW_H - tipHeight;
  return { left, top, arrowLeft, placement, h: tipHeight };
}

/** Высота носика — треугольник со скругленной вершиной из макета (Polygon 1, 10.39×5.47) */
const NOSE_H = 5.47247;

/**
 * Контур тултипа одной фигурой: тело с радиусом 4 и носик. Фон и блюр у них общие —
 * отдельный носик со своим backdrop-filter размывал другой фон и выходил темнее тела.
 */
function tipShape(w: number, h: number, a: number, placement: "bottom" | "top") {
  const r = 4;
  const W = ARROW_W;
  const f = (n: number) => Number(n.toFixed(3));
  if (placement === "bottom") {
    // Носик сверху: тело от y = NOSE_H до NOSE_H + h
    const y0 = NOSE_H;
    const y1 = NOSE_H + h;
    return `path('M ${r} ${f(y0)} H ${f(a)} L ${f(a + 4.44022)} 0.345346 C ${f(a + 4.83899)} -0.115115 ${f(a + 5.55331)} -0.115115 ${f(a + 5.95208)} 0.345346 L ${f(a + W)} ${f(y0)} H ${w - r} Q ${w} ${f(y0)} ${w} ${f(y0 + r)} V ${f(y1 - r)} Q ${w} ${f(y1)} ${w - r} ${f(y1)} H ${r} Q 0 ${f(y1)} 0 ${f(y1 - r)} V ${f(y0 + r)} Q 0 ${f(y0)} ${r} ${f(y0)} Z')`;
  }
  // Носик снизу: тело от 0 до h, вершина на h + NOSE_H
  const t = h + NOSE_H;
  return `path('M ${r} 0 H ${w - r} Q ${w} 0 ${w} ${r} V ${f(h - r)} Q ${w} ${f(h)} ${w - r} ${f(h)} H ${f(a + W)} L ${f(a + 5.95208)} ${f(t - 0.345346)} C ${f(a + 5.55331)} ${f(t + 0.115115)} ${f(a + 4.83899)} ${f(t + 0.115115)} ${f(a + 4.44022)} ${f(t - 0.345346)} L ${f(a)} ${f(h)} H ${r} Q 0 ${f(h)} 0 ${f(h - r)} V ${r} Q 0 0 ${r} 0 Z')`;
}

const tipSurface = {
  backgroundColor: "rgba(33,40,51,0.52)",
  backdropFilter: "blur(6px)",
  WebkitBackdropFilter: "blur(6px)",
} as const;

/**
 * Тур по встрече. Не блокирует страницу: тултип висит над своим разделом,
 * со страницей можно работать. «Дальше» — следующий шаг, «Понятно!» на последнем — тур пройден.
 * Esc тур не закрывает. Вкладка встречи переключается под шаг.
 */
export function OnboardingTour({
  step,
  onNext,
  onClose,
  hidden = false,
}: {
  step: number | null;
  onNext: () => void;
  onClose: () => void;
  /** Спрятать, пока открыт плеер на весь экран */
  hidden?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const tipRef = useRef<HTMLDivElement>(null);
  const [place, setPlace] = useState<Place | null>(null);
  const visible = step !== null && !hidden;
  const present = usePresence(visible, 140);
  // Последний показанный шаг: на нем тултип доигрывает скрытие после закрытия тура
  const [shownStep, setShownStep] = useState(step);
  if (step !== null && step !== shownStep) setShownStep(step);
  const current = present && shownStep !== null ? TOUR_STEPS[shownStep] : null;

  // Позиция пересчитывается каждый кадр, пока тур идет: ширина табов анимируется
  // (шеврон «Статьи»), контент скроллится, окно ресайзится
  useLayoutEffect(() => {
    if (!current) return;
    let raf = 0;
    const tick = () => {
      // Высота тела = высота фигуры минус носик
      const outer = tipRef.current?.offsetHeight;
      const next = measure(current, outer ? outer - NOSE_H : 100);
      setPlace((prev) =>
        prev &&
        next &&
        prev.left === next.left &&
        prev.top === next.top &&
        prev.arrowLeft === next.arrowLeft &&
        prev.placement === next.placement &&
        prev.h === next.h
          ? prev
          : next,
      );
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [current]);

  // Раздел шага — в зону видимости (если контент прокручен вниз)
  useEffect(() => {
    if (!current) return;
    const el = document.querySelector<HTMLElement>(`[data-onb="${current.anchor}"]`);
    el?.scrollIntoView({ block: "nearest", behavior: reduceMotion ? "auto" : "smooth" });
  }, [current, reduceMotion]);

  if (typeof document === "undefined") return null;
  const last = shownStep === TOUR_STEPS.length - 1;

  return createPortal(
    current &&
      place && (
        <motion.div
          key={shownStep}
          ref={tipRef}
          role="dialog"
          aria-label={current.title}
          data-placement={place.placement}
          data-nose-left={place.arrowLeft}
          // Слой 45: над шапкой (40) и мини-плеером (30), но под поповерами и тостами (50), модалками и плеером
          className="fixed z-[45] flex flex-col items-start gap-[12px] px-[12px]"
          style={{
            left: place.left,
            // Фигура включает носик: сверху он добавляет NOSE_H к верхнему полю, снизу — к нижнему
            top: place.placement === "bottom" ? place.top - NOSE_H : place.top,
            width: TIP_WIDTH,
            paddingTop: place.placement === "bottom" ? 12 + NOSE_H : 12,
            paddingBottom: place.placement === "bottom" ? 12 : 12 + NOSE_H,
            ...tipSurface,
            clipPath: tipShape(TIP_WIDTH, place.h, place.arrowLeft, place.placement),
            // Растет из носика
            transformOrigin: `${place.arrowLeft + ARROW_W / 2}px ${place.placement === "bottom" ? "0%" : "100%"}`,
            pointerEvents: visible ? "auto" : "none",
          }}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
          animate={visible ? { opacity: 1, scale: 1 } : reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
          transition={{ duration: visible ? 0.16 : 0.12, ease: easeOut, opacity: { duration: visible ? 0.14 : 0.1 } }}
        >
          <div className="flex w-full flex-col items-start gap-[4px]">
            <span className="whitespace-nowrap text-[13px] font-medium leading-[normal] tracking-[-0.13px] text-white">
              {current.title}
            </span>
            <span className="w-full text-[12px] font-normal leading-[normal] tracking-[-0.24px] text-white/[0.64]">
              {current.text}
            </span>
          </div>
          <div className="flex w-full items-center justify-between">
            <span className="whitespace-nowrap text-[12px] font-normal leading-[normal] tracking-[-0.24px] text-white/[0.64]">
              {(shownStep ?? 0) + 1}/{TOUR_STEPS.length}
            </span>
            <button
              type="button"
              onClick={last ? onClose : onNext}
              className={`-mx-[4px] -my-[2px] whitespace-nowrap rounded-[3px] px-[4px] py-[2px] text-[12px] font-medium leading-[normal] tracking-[-0.24px] text-white hover:text-white/[0.64] ${pressableClass} ${focusRingClass}`}
            >
              {last ? "Понятно!" : "Дальше"}
            </button>
          </div>
        </motion.div>
      ),
    document.body,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Плеер: общее время и главы
// ─────────────────────────────────────────────────────────────────────────────

// Главы и длительность — те же, что в транскрипте приветственной встречи (welcome-content.ts)
export { DURATION };

/** Границы глав в секундах: [начало, конец) */
const CHAPTER_SPANS = CHAPTERS.map((c, i) => ({
  title: c.title,
  start: c.start,
  end: i < CHAPTERS.length - 1 ? CHAPTERS[i + 1].start : DURATION,
}));

const chapterAt = (t: number) => {
  const i = CHAPTER_SPANS.findIndex((c) => t < c.end);
  return i === -1 ? CHAPTER_SPANS.length - 1 : i;
};

export const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/** Время и воспроизведение — одно на мини-плеер и плеер на весь экран */
export function usePlayback(initial = 144) {
  const [time, setTime] = useState(initial);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setTime((t) => {
        if (t + 1 >= DURATION) {
          setPlaying(false);
          return DURATION;
        }
        return t + 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [playing]);
  const seek = useCallback((delta: number) => setTime((t) => Math.max(0, Math.min(DURATION, t + delta))), []);
  const seekTo = useCallback((t: number) => setTime(Math.max(0, Math.min(DURATION, t))), []);
  return { time, playing, setPlaying, seek, seekTo };
}

type Playback = ReturnType<typeof usePlayback>;

/** Полоса глав: 6 сегментов с зазором 2, пройденная часть закрашена, точка — текущий момент */
function ChapterProgress({
  time,
  played,
  rest,
  dot,
  dotSize,
  onSeek,
}: {
  time: number;
  played: string;
  rest: string;
  dot: string;
  dotSize: number;
  onSeek: (t: number) => void;
}) {
  const barRef = useRef<HTMLDivElement>(null);
  const progress = time / DURATION;
  return (
    <div
      ref={barRef}
      className="relative flex w-full cursor-pointer items-center gap-[2px]"
      onClick={(e) => {
        const r = barRef.current?.getBoundingClientRect();
        if (!r) return;
        onSeek(((e.clientX - r.left) / r.width) * DURATION);
      }}
    >
      {/* Сегмент на главу, ширина — по длине главы */}
      {CHAPTER_SPANS.map((c) => {
        const fill = Math.max(0, Math.min(1, (time - c.start) / (c.end - c.start)));
        return (
          <div
            key={c.title}
            className="flex h-[8px] min-w-px flex-col items-center justify-center overflow-clip"
            style={{ flex: `${c.end - c.start} 1 0` }}
          >
            <div className="relative h-[3px] w-full" style={{ backgroundColor: rest }}>
              <div className="absolute inset-y-0 left-0" style={{ width: `${fill * 100}%`, backgroundColor: played }} />
            </div>
          </div>
        );
      })}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={onbAsset(dot)}
        alt=""
        className="pointer-events-none absolute top-1/2 max-w-none"
        style={{ left: `${progress * 100}%`, width: dotSize, height: dotSize, transform: "translate(-50%, -50%)" }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Мини-плеер внизу страницы (Main Container, 47690:1053)
// ─────────────────────────────────────────────────────────────────────────────

export function MiniPlayer({ playback, onOpen }: { playback: Playback; onOpen: (play: boolean) => void }) {
  const { time, seek, seekTo } = playback;
  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 flex h-[54px] items-center justify-between bg-[rgba(255,255,255,0.8)] py-[8px] pl-[10px] pr-[12px] backdrop-blur-[4px]">
      <div className="absolute left-0 right-0 top-[-3px]">
        <ChapterProgress time={time} played="#BABBBD" rest="#DDDEDF" dot="player-dot.svg" dotSize={14} onSeek={seekTo} />
      </div>

      <button
        type="button"
        onClick={() => onOpen(false)}
        aria-label="Открыть запись встречи"
        className={`group flex w-[141px] items-center gap-[8px] rounded-[4px] text-left ${focusRingClass}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          data-onb="player"
          src={onbAsset("video-thumb.jpg")}
          alt=""
          className="h-[35px] w-[56px] shrink-0 rounded-[4px] object-cover"
        />
        <span className="flex w-[77px] flex-col items-start justify-center gap-[2px]">
          <span className="whitespace-nowrap text-[12px] font-normal leading-[normal] tracking-[-0.24px]" style={{ color: tokens.black }}>
            {CHAPTER_SPANS[chapterAt(time)].title}
          </span>
          <span
            className="flex items-center gap-[2px] whitespace-nowrap text-[12px] font-normal leading-[normal] tracking-[-0.24px]"
            style={{ color: tokens.grey }}
          >
            <span>{formatTime(time)}</span>
            <span>/</span>
            <span>{formatTime(DURATION)}</span>
          </span>
        </span>
      </button>

      <div className="flex items-center gap-[8px]">
        <button
          type="button"
          aria-label="Назад на 10 секунд"
          onClick={() => seek(-10)}
          className={`flex items-center rounded-[4px] p-[4px] hover:opacity-70 ${pressableClass} ${focusRingClass}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={onbAsset("player-back.svg")} alt="" className="h-[16px] w-[16px] shrink-0" />
        </button>
        <button
          type="button"
          aria-label="Смотреть запись"
          onClick={() => onOpen(true)}
          className={`h-[32px] w-[32px] rounded-full hover:opacity-80 ${pressableClass} ${focusRingClass}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={onbAsset("player-play.svg")} alt="" className="h-[32px] w-[32px] shrink-0" />
        </button>
        <button
          type="button"
          aria-label="Вперед на 30 секунд"
          onClick={() => seek(30)}
          className={`flex items-center rounded-[4px] p-[4px] hover:opacity-70 ${pressableClass} ${focusRingClass}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={onbAsset("player-forward.svg")} alt="" className="h-[16px] w-[16px] shrink-0" />
        </button>
      </div>

      <div className="h-[24px] w-[141px]" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Плеер на весь экран (47634:7137) с плашкой про тарифы (47634:7208)
// ─────────────────────────────────────────────────────────────────────────────

function FsIcon({ file, className = "" }: { file: string; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={onbAsset(file)} alt="" width={16} height={16} className={`block h-[16px] w-[16px] shrink-0 ${className}`} />;
}

// Пауза — heroicons 20/solid, отрисована в 16×16: в макете есть только состояние «Играть»
function PauseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="white" aria-hidden="true" className="block shrink-0">
      <path d="M5.75 3a.75.75 0 0 0-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 0 0 .75-.75V3.75A.75.75 0 0 0 7.25 3h-1.5ZM12.75 3a.75.75 0 0 0-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 0 0 .75-.75V3.75a.75.75 0 0 0-.75-.75h-1.5Z" />
    </svg>
  );
}

const fsButton = `flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-[3px] hover:bg-white/[0.16] ${pressableClass} ${focusRingClass}`;

export function FullscreenPlayer({
  open,
  playback,
  onClose,
  onUpgrade,
}: {
  open: boolean;
  playback: Playback;
  onClose: () => void;
  onUpgrade: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const { time, playing, setPlaying, seek, seekTo } = playback;
  const [bannerClosed, setBannerClosed] = useState(false);
  const present = usePresence(open, 200);
  const bannerPresent = usePresence(!bannerClosed, 150);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === " " && !(e.target instanceof HTMLButtonElement)) {
        e.preventDefault();
        setPlaying((p) => !p);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose, setPlaying]);

  if (typeof document === "undefined") return null;

  return createPortal(
    present && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Добро пожаловать в mymeet.ai"
          className="fixed inset-0 z-[80] overflow-hidden bg-black"
          style={{ pointerEvents: open ? "auto" : "none" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: open ? 1 : 0 }}
          transition={{ duration: open ? 0.2 : 0.15, ease: easeOut }}
        >
          {/* Кадр записи: в макете — стоп-кадр видео по центру, 1200×713 */}
          <button
            type="button"
            aria-label={playing ? "Пауза" : "Играть"}
            onClick={() => setPlaying((p) => !p)}
            className="absolute inset-0 cursor-default focus-visible:outline-none"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={onbAsset("video-frame.jpg")} alt="" className="pointer-events-none h-full w-full object-contain" />
          </button>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(180deg, rgba(0, 0, 0, 0.36) 0%, rgba(0, 0, 0, 0.12) 20%, rgba(0, 0, 0, 0.08) 29.808%, rgba(0, 0, 0, 0.08) 70%, rgba(0, 0, 0, 0.12) 80%, rgba(0, 0, 0, 0.36) 100%)",
            }}
          />

          {/* Шапка: закрыть, название встречи, свернуть */}
          <div className="absolute left-0 right-0 top-0 flex items-center justify-between p-[8px]">
            <div className="flex items-center gap-[8px]">
              <button
                type="button"
                aria-label="Закрыть"
                onClick={onClose}
                className={`group flex items-center rounded-[40px] p-[4px] ${focusRingClass}`}
              >
                <span className={`flex items-center rounded-[40px] bg-white/[0.16] p-[4px] group-hover:bg-white/[0.24] ${pressableClass}`}>
                  <FsIcon file="fs-close.svg" />
                </span>
              </button>
              <span className="whitespace-nowrap text-[14px] font-medium leading-[1.35] tracking-[-0.28px] text-white">
                Добро пожаловать в mymeet.ai
              </span>
            </div>
            <button type="button" aria-label="Свернуть плеер" onClick={onClose} className={`p-[4px] ${focusRingClass} rounded-[3px]`}>
              <span className={`flex items-center justify-center rounded-[3px] p-[4px] hover:bg-white/[0.16] ${pressableClass}`}>
                <FsIcon file="fs-collapse.svg" />
              </span>
            </button>
          </div>

          {/* Плашка: плеер бесплатен только в приветственной встрече (47634:7208, ховер — 47789:14300).
              Клик — к тарифам. На ховере в углу появляется крестик: закрытая плашка не вернется до перезагрузки */}
          {bannerPresent && (
              <motion.div
                className="group absolute bottom-[68px] left-1/2 w-[640px] max-w-[calc(100%-32px)]"
                style={{ x: "-50%", pointerEvents: bannerClosed ? "none" : "auto" }}
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
                animate={bannerClosed ? (reduceMotion ? { opacity: 0 } : { opacity: 0, y: 4 }) : { opacity: 1, y: 0 }}
                transition={
                  bannerClosed
                    ? { duration: 0.15, ease: easeOut }
                    : { duration: 0.24, ease: easeOut, delay: reduceMotion ? 0 : 0.3 }
                }
              >
                <button
                  type="button"
                  onClick={onUpgrade}
                  className={`flex w-full items-center rounded-[4px] bg-white/[0.12] p-[16px] text-left backdrop-blur-[6px] ${focusRingClass}`}
                >
                  <span className="flex h-[36px] min-w-px flex-1 items-center justify-between">
                    <span className="flex min-w-px flex-1 items-center gap-[12px]">
                      <span className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-[4px] bg-white/[0.08] p-[8px]">
                        <FsIcon file="banner-play-pause.svg" />
                      </span>
                      <span className="flex min-w-px flex-1 flex-col items-start gap-[2px]">
                        <span className="whitespace-nowrap text-[13px] font-medium leading-[normal] tracking-[-0.13px] text-white">
                          Смотрите записи встреч в Pro и Business
                        </span>
                        <span className="w-full text-[12px] font-normal leading-[normal] tracking-[-0.24px] text-white">
                          Плеер открыт бесплатно в приветственной встрече, для остальных нужен платный тариф
                        </span>
                      </span>
                    </span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={onbAsset("banner-chevron.svg")} alt="" width={20} height={20} className="block h-[20px] w-[20px] shrink-0" />
                  </span>
                </button>
                <button
                  type="button"
                  aria-label="Скрыть плашку"
                  onClick={() => setBannerClosed(true)}
                  className={`absolute right-[-6px] top-[-6px] h-[16px] w-[16px] rounded-full opacity-0 backdrop-blur-[6px] transition-opacity duration-[120ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:opacity-100 focus-visible:opacity-100 motion-reduce:transition-none ${focusRingClass}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={onbAsset("banner-close.svg")} alt="" width={16} height={16} className="block h-[16px] w-[16px]" />
                </button>
              </motion.div>
            )}

          {/* Управление */}
          <div className="absolute bottom-0 left-0 right-0 flex flex-col items-start gap-[12px] p-[12px]">
            <ChapterProgress time={time} played="#FFFFFF" rest="rgba(255,255,255,0.24)" dot="fs-dot.svg" dotSize={14} onSeek={seekTo} />
            <div className="flex h-[16px] w-full items-center justify-between">
              <div className="flex h-full items-center gap-[12px]">
                <div className="flex items-center gap-[8px]">
                  <button type="button" aria-label="Назад на 10 секунд" onClick={() => seek(-10)} className={fsButton}>
                    <FsIcon file="fs-back.svg" />
                  </button>
                  <button type="button" aria-label={playing ? "Пауза" : "Играть"} onClick={() => setPlaying((p) => !p)} className={fsButton}>
                    {playing ? <PauseIcon /> : <FsIcon file="fs-play.svg" />}
                  </button>
                  <button type="button" aria-label="Вперед на 30 секунд" onClick={() => seek(30)} className={fsButton}>
                    <FsIcon file="fs-forward.svg" />
                  </button>
                </div>
                <span aria-hidden="true" className="h-[16px] w-px shrink-0 bg-white/[0.32]" />
                <div className="flex items-center gap-[6px] text-[12px] font-normal leading-[normal] tracking-[-0.24px] text-white">
                  <span className="flex items-center gap-[2px] whitespace-nowrap">
                    <span>{formatTime(time)}</span>
                    <span>/</span>
                    <span>{formatTime(DURATION)}</span>
                  </span>
                  <span className="font-black">·</span>
                  <span className="w-[400px] truncate">{CHAPTER_SPANS[chapterAt(time)].title}</span>
                </div>
              </div>
              <div className="flex items-center gap-[8px]">
                <button type="button" aria-label="Скачать запись" className={fsButton}>
                  <FsIcon file="fs-download.svg" />
                </button>
                <button type="button" aria-label="Звук" className={fsButton}>
                  <FsIcon file="fs-volume.svg" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      ),
    document.body,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Вкладка «Чат» (47774:6105): подсказки и поле ввода, прижатые к низу
// ─────────────────────────────────────────────────────────────────────────────

const SUGGESTIONS = ["Что умеет mymeet.ai?", "Как подключить бота к встрече?", "Какие отчеты можно получить?"];

export function ChatContent() {
  const boxRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(undefined);
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Блок тянется до плеера: 54 — мини-плеер, 16 — зазор над ним
  useLayoutEffect(() => {
    const update = () => {
      const el = boxRef.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top;
      setHeight(Math.max(320, window.innerHeight - top - 54 - 16));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <div ref={boxRef} className="flex w-full flex-col items-center justify-end gap-[32px]" style={{ height: height ?? 480 }}>
      <div className="flex w-full flex-col items-center gap-[12px]">
        <div className="flex w-full flex-col items-start px-[12px]">
          {SUGGESTIONS.map((s, i) => (
            <div key={s} className="flex w-full flex-col">
              {i > 0 && <span aria-hidden="true" className="h-px w-full" style={{ backgroundColor: tokens.border }} />}
              <button
                type="button"
                onClick={() => {
                  setText(s);
                  inputRef.current?.focus();
                }}
                className={`flex w-full items-center justify-between rounded-[4px] px-[8px] py-[12px] text-left hover:bg-[#F7F7F8] ${pressableClass} ${focusRingClass}`}
              >
                <span className="text-[13px] font-normal leading-[16px] tracking-[-0.13px]" style={{ color: tokens.black }}>
                  {s}
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={onbAsset("chat-arrow.svg")} alt="" width={16} height={16} className="block h-[16px] w-[16px] shrink-0 rotate-90" />
              </button>
            </div>
          ))}
        </div>
        <div
          className="flex w-full flex-col items-start gap-[12px] rounded-[4px] border bg-white p-[12px]"
          style={{ borderColor: tokens.border, filter: "drop-shadow(0px 12px 16px rgba(33,40,51,0.04))" }}
        >
          <div className="flex w-full items-center justify-center px-[4px] pt-[4px]">
            <textarea
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={2}
              placeholder="Спросите что-нибудь о встречах…"
              className="h-[32px] min-w-px flex-1 resize-none bg-transparent text-[13px] font-normal leading-[16px] tracking-[-0.13px] outline-none placeholder:text-[#C7C8CA]"
              style={{ color: tokens.black }}
            />
          </div>
          <div className="flex w-full items-end justify-between">
            <button
              type="button"
              aria-label="Прикрепить файл"
              className={`flex h-[32px] w-[32px] items-center justify-center rounded-[4px] border bg-white hover:bg-[#F7F7F8] ${pressableClass} ${focusRingClass}`}
              style={{ borderColor: tokens.border }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={onbAsset("chat-clip.svg")} alt="" width={16} height={16} className="block h-[16px] w-[16px]" />
            </button>
            <button
              type="button"
              aria-label="Отправить"
              disabled={!text.trim()}
              onClick={() => setText("")}
              className={`flex h-[32px] w-[32px] items-center justify-center rounded-[4px] bg-[#F7F7F8] hover:bg-[#EFEFEF] disabled:cursor-not-allowed disabled:hover:bg-[#F7F7F8] ${pressableClass} ${focusRingClass}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={onbAsset("chat-send.svg")} alt="" width={16} height={16} className="block h-[16px] w-[16px]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
