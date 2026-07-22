"use client";

import { Inter } from "next/font/google";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { MouseEventHandler } from "react";
import { monthYearLabel } from "../search-filters/use-filtered-meetings";

const inter = Inter({ subsets: ["latin", "cyrillic"], weight: ["400", "500"] });

const BASE = process.env.NODE_ENV === "production" ? "/design-lab" : "";
const asset = (name: string) => `${BASE}/usage-stats/${name}`;
const sidebarAsset = (name: string) => `${BASE}/sidebar-menu-update/${name}`;
const ctaAsset = (name: string) => `${BASE}/b2c-upgrade-cta/${name}`;
const meetingAsset = (name: string) => `${BASE}/search-filters/${name}`;

const tokens = {
  blue: "#0138C7",
  black: "#212833",
  grey: "#818AA3",
  greyTertiary: "#585E6C",
  greyDisabled: "#C7C8CA",
  grey15: "#F3F3F3",
  bgSubtle: "#F7F7F8",
  border: "#EFEFEF",
  blueSea: "#E4ECFA",
  red: "#CC3333",
  green: "#0D9655",
  orange: "#FF9E15",
} as const;

const pressableClass =
  "transition-colors duration-[120ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none";

/* ─────────────────────────── PERIOD / DATES ───────────────────────────
   «Сегодня» в прототипе закреплено: 17 июля 2026 (правая граница периода из макета). */

const TODAY_ISO = "2026-07-17";

const MONTHS_GENITIVE = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];

function isoToDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function dateToISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isoAddDays(iso: string, delta: number): string {
  const d = isoToDate(iso);
  d.setDate(d.getDate() + delta);
  return dateToISO(d);
}

function diffDays(fromISO: string, toISO: string): number {
  return Math.max(1, Math.round((isoToDate(toISO).getTime() - isoToDate(fromISO).getTime()) / 86400000));
}

function shortDateLabel(iso: string): string {
  const d = isoToDate(iso);
  return `${d.getDate()} ${MONTHS_GENITIVE[d.getMonth()]}`;
}

function rangeLabel(fromISO: string, toISO: string): string {
  return `${shortDateLabel(fromISO)} – ${shortDateLabel(toISO)}`;
}

type PeriodDays = 1 | 30 | 90 | 120 | "all";
type PeriodPreset = PeriodDays | "custom";
type DateRange = { from: string; to: string };

// «За все время» — с даты создания воркспейса (мок)
const ALL_TIME_FROM = "2025-09-17";

function presetLabelFor(preset: PeriodPreset): string {
  if (preset === "custom") return "Кастомный период";
  if (preset === "all") return "Все время";
  if (preset === 1) return "Сегодня";
  return `Последние ${preset} дней`;
}

/* ─────────────────────────── CHART GEOMETRY (1:1 из Figma 40613:2903) ───────────────────────────
   Полилинии перенесены из векторов макета. Y — в координатах канвы 688×235.                        */

const CHART_W = 688;
const CHART_H = 235;

// X-станции общей сетки (28 точек на 30 дней: 17 июня – 17 июля)
const X = [0, 19.96, 46.54, 68.04, 90.32, 138.02, 160.69, 183.36, 207.21, 227.53, 274.44, 300.24, 321.35, 343.63, 367.09, 388.98, 414.0, 458.17, 481.23, 504.3, 527.75, 550.03, 573.1, 596.94, 618.44, 641.51, 664.18, 688];

// Y линии «Всего» (offset +9), fill закрывается на y=164
const TOTAL_Y = [107.83, 108.46, 4.38, 9.43, 9.43, 29.61, 114.13, 114.13, 1.23, 14.47, 20.78, 38.44, 124.23, 117.92, 23.93, 14.47, 20.78, 46.01, 117.92, 112.24, 20.78, 23.93, 14.47, 32.76, 40.96, 112.24, 112.24, 69.98].map((y) => y + 9);

// Y линии «Онлайн» (offset +39), fill до y=226
const ONLINE_Y = [129.63, 130.39, 5.16, 11.23, 11.23, 35.52, 137.22, 137.22, 1.36, 17.3, 24.89, 46.14, 149.36, 141.77, 28.69, 17.3, 24.89, 55.25, 141.77, 134.94, 24.89, 28.69, 17.3, 39.31, 49.18, 134.94, 134.94, 84.09].map((y) => y + 39);

// «Файлы» (offset +164), в макете меньше станций — интерполируем на общую сетку
const FILES_RAW: [number, number][] = [
  [0, 43.3], [19.95, 43.55], [46.53, 2.09], [68.03, 4.1], [90.31, 4.1], [138, 12.14],
  [160.67, 45.81], [207.19, 0.83], [227.52, 6.11], [274.43, 8.62], [300.23, 15.66],
  [321.34, 49.83], [343.62, 47.32], [367.07, 9.88], [388.96, 6.11], [413.98, 8.62],
  [458.16, 18.67], [481.22, 47.32], [504.28, 45.06], [550.02, 9.88], [641.49, 45.06],
  [664.16, 45.06], [688, 28.22],
];

function interpolateAt(x: number, pts: [number, number][]) {
  if (x <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    if (x <= pts[i][0]) {
      const [x0, y0] = pts[i - 1];
      const [x1, y1] = pts[i];
      return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
    }
  }
  return pts[pts.length - 1][1];
}

const FILES_Y = X.map((x) => interpolateAt(x, FILES_RAW) + 164);

type SeriesKey = "total" | "online" | "files";

const SERIES: {
  key: SeriesKey;
  label: string;
  color: string;
  fillBottom: number;
  fillTop: number;
  // Диапазон Y линии в канве (для генерации кривых не-базовых периодов)
  genTop: number;
  genBottom: number;
  // value = (baseline - y) * k — правдоподобные числа для тултипа
  baseline: number;
  k: number;
}[] = [
  { key: "total",  label: "Всего",  color: tokens.black, fillBottom: 164, fillTop: 8,   genTop: 10,  genBottom: 133, baseline: 164, k: 1.25 },
  { key: "online", label: "Онлайн", color: tokens.blue,  fillBottom: 226, fillTop: 38,  genTop: 40,  genBottom: 188, baseline: 226, k: 0.85 },
  { key: "files",  label: "Файлы",  color: tokens.orange, fillBottom: 226, fillTop: 164, genTop: 166, genBottom: 213, baseline: 226, k: 0.4 },
];

function linePath(ys: number[]) {
  return X.map((x, i) => `${i === 0 ? "M" : "L"}${x} ${ys[i]}`).join("");
}

function areaPath(ys: number[], bottom: number) {
  return `${linePath(ys)}L${CHART_W} ${bottom}L0 ${bottom}Z`;
}

// Час станции при почасовом (1 день) режиме: 0..23
function stationHour(x: number) {
  return Math.min(23, Math.round((x / CHART_W) * 24));
}

// Подпись станции в тултипе: «17 июля» либо «17 июля, 16:00» для почасового режима
function stationLabel(x: number, range: DateRange, hourly: boolean) {
  if (hourly) {
    return `${shortDateLabel(range.from)}, ${String(stationHour(x)).padStart(2, "0")}:00`;
  }
  const day = Math.round((x / CHART_W) * diffDays(range.from, range.to));
  return shortDateLabel(isoAddDays(range.from, day));
}

function tooltipValue(seriesIndex: number, y: number) {
  const s = SERIES[seriesIndex];
  const v = Math.max(1, Math.round((s.baseline - y) * s.k));
  return v.toLocaleString("en-US"); // формат «2,719» как в макете
}

/* ─────────────────────────── MOCK DATA ПО ПЕРИОДАМ ───────────────────────────
   Для 30 дней — точные значения из макета. Для 90/120/кастомного периода данные
   генерируются детерминированно (без Math.random — SSR и клиент считают одинаково). */

function fmt(n: number): string {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

type ParticipantRow = { initials: string; color: string; email: string; online: number; files: number; minutes: number };

const PARTICIPANTS_BASE: ParticipantRow[] = [
  { initials: "FE", color: "#2F3031", email: "fedos@mymeet.ai",  online: 412, files: 0,  minutes: 30478 },
  { initials: "AN", color: "#0138C7", email: "andrey@mymeet.ai", online: 389, files: 1,  minutes: 28232 },
  { initials: "IV", color: "#818AA3", email: "ivan@mymeet.ai",   online: 299, files: 0,  minutes: 17333 },
  { initials: "FE", color: "#0D9655", email: "fedor@mymeet.ai",  online: 288, files: 0,  minutes: 12489 },
  { initials: "IL", color: "#E3ACFD", email: "ilya@mymeet.ai",   online: 288, files: 13, minutes: 10642 },
  { initials: "NI", color: "#FF9E2C", email: "nikita@mymeet.ai", online: 288, files: 1,  minutes: 7345 },
  { initials: "EM", color: "#8C75FF", email: "emma@mymeet.ai",   online: 317, files: 2,  minutes: 6980 },
  { initials: "JO", color: "#4ABC2B", email: "john@mymeet.ai",   online: 204, files: 1,  minutes: 4125 },
  { initials: "AL", color: "#A1D3FF", email: "alex@mymeet.ai",   online: 152, files: 0,  minutes: 3210 },
];

const BREAKDOWN_BASE_COUNTS = [142, 96, 83, 48, 12];
const BREAKDOWN_WIDTHS_30 = [267, 196, 185, 101, 22];

type Delta = { kind: "down" | "up" | "zero"; value: string };
// delta отсутствует для «За все время» — сравнивать не с чем; hint — пояснение по ховеру лейбла
type Metric = { label: string; value: string; delta?: Delta; hint?: string };

// Пояснение к метрике «Активных пользователей»
const ACTIVE_USERS_HINT = "Пользователи, у которых была хотя бы одна встреча за последние 30 дней";
// Общий терм для всех процентных чипсов
const DELTA_HINT = "По сравнению с предыдущим периодом";

type PeriodData = {
  meetingsTotal: string;
  metrics: Metric[];
  seriesYs: Record<SeriesKey, number[]>;
  legend: Record<SeriesKey, string>;
  breakdownCounts: number[];
  breakdownWidths: number[];
  participants: ParticipantRow[];
  totals: { online: number; files: number; minutes: number };
};

// Недельный степ-паттерн как в макете: плато по будням, провал в выходные + лёгкая волна
function genYs(days: number, top: number, bottom: number, phase: number): number[] {
  return X.map((x) => {
    const day = (x / CHART_W) * days;
    const dow = (Math.floor(day) + phase) % 7;
    const weekend = dow >= 5;
    const wobble = Math.sin(day * 1.7 + days) * 0.08 + Math.sin(day * 0.53 + days * 2.1) * 0.07;
    const level = weekend ? Math.max(0.06, 0.16 + wobble) : Math.min(0.98, 0.84 + wobble);
    return bottom - (bottom - top) * level;
  });
}

// Суточный паттерн (режим «1 день»): тихо ночью, подъём к обеду, пик ~14:00, спад к вечеру
function genHourlyYs(top: number, bottom: number, phase: number): number[] {
  return X.map((x) => {
    const h = (x / CHART_W) * 24;
    const bump = Math.exp(-Math.pow((h - 14) / 5.2, 2));
    const wobble = Math.sin(h * 1.6 + phase) * 0.05 + Math.sin(h * 0.7 + phase * 2) * 0.04;
    const level = Math.max(0.05, Math.min(0.97, 0.08 + 0.85 * bump + wobble));
    return bottom - (bottom - top) * level;
  });
}

const DATA_30: PeriodData = {
  meetingsTotal: "3 972",
  metrics: [
    { label: "Всего встреч", value: "3 972", delta: { kind: "down", value: "24%" } },
    { label: "Минут обработано", value: "121 234", delta: { kind: "up", value: "70%" } },
    { label: "Активных пользователей", value: "20/20", delta: { kind: "zero", value: "0%" }, hint: ACTIVE_USERS_HINT },
  ],
  seriesYs: { total: TOTAL_Y, online: ONLINE_Y, files: FILES_Y },
  legend: { total: "964", online: "840", files: "124" },
  breakdownCounts: BREAKDOWN_BASE_COUNTS,
  breakdownWidths: BREAKDOWN_WIDTHS_30,
  participants: PARTICIPANTS_BASE,
  totals: { online: 2637, files: 18, minutes: 120834 },
};

function getPeriodData(range: DateRange, allTime = false, hourly = false): PeriodData {
  const days = diffDays(range.from, range.to);
  if (days === 30 && !allTime && !hourly) return DATA_30;

  // Для режима «1 день» берём долю одного дня, но кривые — суточные (почасовые)
  const k = hourly ? 1 / 30 : days / 30;
  const jit = (i: number) => 1 + 0.12 * Math.sin(i * 2.7 + (hourly ? 1 : days) * 1.3);

  const meetings = Math.max(1, Math.round(3972 * k * jit(7)));
  const minutes = Math.max(30, Math.round(121234 * k * jit(8)));
  const activeUsers = hourly ? 14 : Math.min(20, Math.max(2, Math.round(20 * Math.min(1, days / 14))));

  const deltas =
    days === 90
      ? { meetings: 11, minutes: 34 }
      : days === 120
        ? { meetings: 6, minutes: 21 }
        : { meetings: 8 + ((days * 7) % 23), minutes: 12 + ((days * 11) % 41) };

  const counts = BREAKDOWN_BASE_COUNTS.map((c, i) => Math.max(1, Math.round(c * k * jit(i))));
  const maxCount = Math.max(...counts);
  const widths = counts.map((c) => Math.max(22, Math.round((c / maxCount) * 267)));

  const participants = PARTICIPANTS_BASE.map((p, i) => ({
    ...p,
    online: Math.max(1, Math.round(p.online * k * jit(i + 1))),
    files: Math.max(0, Math.round(p.files * k * jit(i + 2))),
    minutes: Math.max(30, Math.round(p.minutes * k * jit(i + 3))),
  }));
  const totals = participants.reduce(
    (acc, p) => ({ online: acc.online + p.online, files: acc.files + p.files, minutes: acc.minutes + p.minutes }),
    { online: 0, files: 0, minutes: 0 }
  );

  return {
    meetingsTotal: fmt(meetings),
    metrics: [
      { label: "Всего встреч", value: fmt(meetings), delta: allTime ? undefined : { kind: "down", value: `${deltas.meetings}%` } },
      { label: "Минут обработано", value: fmt(minutes), delta: allTime ? undefined : { kind: "up", value: `${deltas.minutes}%` } },
      { label: "Активных пользователей", value: `${activeUsers}/20`, delta: allTime ? undefined : { kind: "zero", value: "0%" }, hint: ACTIVE_USERS_HINT },
    ],
    seriesYs: hourly
      ? {
          total: genHourlyYs(SERIES[0].genTop, SERIES[0].genBottom, 0),
          online: genHourlyYs(SERIES[1].genTop, SERIES[1].genBottom, 0.4),
          files: genHourlyYs(SERIES[2].genTop, SERIES[2].genBottom, 2),
        }
      : {
          total: genYs(days, SERIES[0].genTop, SERIES[0].genBottom, 1),
          online: genYs(days, SERIES[1].genTop, SERIES[1].genBottom, 1),
          files: genYs(days, SERIES[2].genTop, SERIES[2].genBottom, 4),
        },
    legend: {
      total: fmt(Math.max(1, 964 * k * jit(4))),
      online: fmt(Math.max(1, 840 * k * jit(5))),
      files: fmt(Math.max(1, 124 * k * jit(6))),
    },
    breakdownCounts: counts,
    breakdownWidths: widths,
    participants,
    totals,
  };
}

/* ─────────────────────────── SIDEBAR (структура из sidebar-menu-update + b2c-upgrade-cta) ── */

type NavItem = { label: string; icon: string; active?: boolean };

const primaryItems: NavItem[] = [
  { label: "Встречи", icon: "meetings.svg" },
  { label: "AI Отчеты", icon: "ai-reports.svg" },
  { label: "Интеграции", icon: "integrations.svg" },
  { label: "Настройки", icon: "settings-figma.svg", active: true },
];

const resourceItems: NavItem[] = [
  { label: "База знаний", icon: "knowledge.svg" },
  { label: "Поддержка", icon: "support.svg" },
  { label: "Бесплатные минуты", icon: "gift.svg" },
  { label: "Телеграм-бот", icon: "tg.svg" },
];

function MenuIcon({ name }: { name: string }) {
  const src = sidebarAsset(name);
  return (
    <span
      aria-hidden="true"
      className="h-[16px] w-[16px] shrink-0 bg-[#818AA3]"
      style={{
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

function MenuItem({ item }: { item: NavItem }) {
  return (
    <button
      type="button"
      className={`group flex w-full items-center rounded-[3px] p-[6px] text-left hover:bg-[#F7F7F8] ${item.active ? "bg-[#F7F7F8]" : ""} ${pressableClass}`}
    >
      <span className="flex items-center gap-[6px]">
        <span className="flex h-[16px] w-[16px] shrink-0 items-center justify-center">
          <MenuIcon name={item.icon} />
        </span>
        <span
          className="text-[13px] font-normal leading-[normal] tracking-[-0.13px]"
          style={{ color: tokens.black }}
        >
          {item.label}
        </span>
      </span>
    </button>
  );
}

function SectionChevron({ expanded }: { expanded: boolean }) {
  return (
    <span className="flex h-[16px] w-[16px] shrink-0 items-center justify-center opacity-0 transition-opacity duration-[120ms] ease-out group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none">
      <span
        className={`flex h-[16px] w-[16px] origin-center items-center justify-center will-change-transform transition-transform duration-[180ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none ${
          expanded ? "rotate-0" : "-rotate-90"
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={sidebarAsset("section-chevron-figma.svg")} alt="" className="block h-[16px] w-[16px] shrink-0" />
      </span>
    </span>
  );
}

function MenuGroup({ title, items }: { title?: string; items: NavItem[] }) {
  const [expanded, setExpanded] = useState(true);
  return (
    <div className="flex w-full flex-col gap-px">
      {title && (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
          className={`group flex w-full items-center rounded-[3px] p-[6px] text-left hover:bg-[#F7F7F8] ${pressableClass}`}
        >
          <span className="flex items-center gap-px">
            <span className="text-[12px] font-medium leading-[normal] tracking-[-0.24px]" style={{ color: tokens.grey }}>
              {title}
            </span>
            <SectionChevron expanded={expanded} />
          </span>
        </button>
      )}
      {(!title || expanded) && items.map((item) => <MenuItem key={item.label} item={item} />)}
    </div>
  );
}

function ArrowUpCircle({ size, animated = false }: { size: number; animated?: boolean }) {
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-full"
      style={{ width: size, height: size, backgroundColor: tokens.blue }}
    >
      {animated ? (
        <div className="flex flex-col transition-transform duration-[180ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:-translate-y-1/2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ctaAsset("ic-arrow-up-white.svg")} alt="" className="block shrink-0" style={{ width: size, height: size }} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ctaAsset("ic-arrow-up-white.svg")} alt="" aria-hidden="true" className="block shrink-0" style={{ width: size, height: size }} />
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={ctaAsset("ic-arrow-up-white.svg")} alt="" className="block shrink-0" style={{ width: size, height: size }} />
      )}
    </div>
  );
}

function UpgradePlanCTA() {
  return (
    <div
      role="button"
      tabIndex={0}
      className="group relative flex h-[40px] w-full shrink-0 cursor-pointer items-center overflow-hidden border-b border-solid px-[16px]"
      style={{ backgroundColor: tokens.grey15, borderColor: tokens.border }}
    >
      <div className="flex items-center gap-[8px]">
        <ArrowUpCircle size={16} animated />
        <span
          className="whitespace-nowrap text-[13px] font-medium leading-none"
          style={{ color: tokens.blue, letterSpacing: "-0.13px" }}
        >
          Улучшить план
        </span>
      </div>

      {/* 3 стэкнутые плитки интеграций (геометрия из b2c-upgrade-cta, x=173 по макету) */}
      <div className="absolute h-[38.389px] w-[91px] left-[173px] top-[1px]">
        <div
          className="absolute flex h-[32px] w-[32px] items-center justify-center rounded-[4px] border-[1.021px] border-solid bg-white rotate-[16deg] transition-transform duration-200 ease-out group-hover:translate-x-[3px] group-hover:-translate-y-[3px] group-hover:rotate-[22deg]"
          style={{ borderColor: tokens.border, left: "56px", top: "6px" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ctaAsset("ic-tile-music.svg")} alt="" className="h-[16.335px] w-[16.335px] shrink-0" />
        </div>
        <div
          className="absolute flex h-[32px] w-[32px] items-center justify-center rounded-[4px] border-[1.021px] border-solid bg-white -rotate-[16deg] transition-transform duration-200 ease-out group-hover:-translate-x-[3px] group-hover:-translate-y-[3px] group-hover:-rotate-[22deg]"
          style={{ borderColor: tokens.border, left: "4px", top: "6px" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ctaAsset("ic-tile-bolt.svg")} alt="" className="h-[18.286px] w-[18.286px] shrink-0" />
        </div>
        <div
          className="absolute flex h-[32px] w-[32px] items-center justify-center rounded-[4px] border-[1.021px] border-solid bg-white transition-transform duration-200 ease-out group-hover:-translate-y-[2px]"
          style={{ borderColor: tokens.border, left: "30px", top: "6px" }}
        >
          <ArrowUpCircle size={18.286} />
        </div>
      </div>
    </div>
  );
}

function WorkspaceMenuIcon({ name, danger = false }: { name: string; danger?: boolean }) {
  const src = sidebarAsset(name);
  return (
    <span
      aria-hidden="true"
      className={`h-[16px] w-[16px] shrink-0 ${danger ? "bg-[#CC3333]" : "bg-[#818AA3]"}`}
      style={{
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

function WorkspaceMenuItem({
  icon,
  label,
  trailing,
  danger = false,
  active = false,
  onMouseEnter,
  onMouseLeave,
}: {
  icon: string;
  label: string;
  trailing?: React.ReactNode;
  danger?: boolean;
  active?: boolean;
  onMouseEnter?: MouseEventHandler<HTMLButtonElement>;
  onMouseLeave?: MouseEventHandler<HTMLButtonElement>;
}) {
  return (
    <button
      type="button"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`group flex h-[32px] w-full shrink-0 items-center justify-between rounded-[3px] p-[6px] text-left hover:bg-[#F7F7F8] ${active ? "bg-[#F7F7F8]" : ""} ${pressableClass}`}
    >
      <span className="flex items-center gap-[6px]">
        <WorkspaceMenuIcon name={icon} danger={danger} />
        <span className="text-[13px] font-normal leading-[normal] tracking-[-0.13px]" style={{ color: danger ? tokens.red : tokens.black }}>
          {label}
        </span>
      </span>
      {trailing}
    </button>
  );
}

function ThemeSubmenu({
  top,
  onMouseEnter,
  onMouseLeave,
}: {
  top: number;
  onMouseEnter: MouseEventHandler<HTMLDivElement>;
  onMouseLeave: MouseEventHandler<HTMLDivElement>;
}) {
  const reduceMotion = useReducedMotion();
  const items = [
    { label: "Как в системе", selected: false },
    { label: "Светлая", selected: true },
    { label: "Темная", selected: false },
  ];

  return (
    <motion.div
      data-theme-submenu="true"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, transform: "translateX(-4px) scale(0.985)" }}
      animate={reduceMotion ? { opacity: 1 } : { opacity: 1, transform: "translateX(0px) scale(1)" }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, transform: "translateX(-2px) scale(0.99)" }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
      className="fixed left-[292px] z-50 flex w-[200px] origin-top-left flex-col items-start rounded-[4px] bg-white p-[4px] will-change-[opacity,transform]"
      style={{ top, boxShadow: "0 0 2px 0 rgba(0, 0, 0, 0.15)" }}
    >
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          className={`group flex h-[32px] w-full shrink-0 items-center justify-between rounded-[3px] p-[6px] text-left hover:bg-[#F7F7F8] ${pressableClass}`}
        >
          <span className="truncate text-[13px] font-normal leading-[normal] tracking-[-0.13px]" style={{ color: tokens.black }}>
            {item.label}
          </span>
          {item.selected && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={sidebarAsset("workspace-selected.svg")} alt="" width={16} height={16} className="shrink-0" />
          )}
        </button>
      ))}
    </motion.div>
  );
}

function WorkspacePopover() {
  const reduceMotion = useReducedMotion();
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [themeSubmenuTop, setThemeSubmenuTop] = useState(0);
  const themeCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const keepThemeMenuOpen = useCallback(() => {
    if (themeCloseTimer.current) {
      clearTimeout(themeCloseTimer.current);
      themeCloseTimer.current = null;
    }
    setThemeMenuOpen(true);
  }, []);

  const showThemeMenu: MouseEventHandler<HTMLButtonElement> = useCallback((event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setThemeSubmenuTop(rect.top - 4);
    keepThemeMenuOpen();
  }, [keepThemeMenuOpen]);

  const scheduleHideThemeMenu = useCallback(() => {
    if (themeCloseTimer.current) clearTimeout(themeCloseTimer.current);
    themeCloseTimer.current = setTimeout(() => {
      setThemeMenuOpen(false);
      themeCloseTimer.current = null;
    }, 90);
  }, []);

  useEffect(() => {
    return () => {
      if (themeCloseTimer.current) clearTimeout(themeCloseTimer.current);
    };
  }, []);

  return (
    <>
      <motion.div
        data-workspace-popover="true"
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, transform: "translateY(-6px) scale(0.965)" }}
        animate={reduceMotion ? { opacity: 1 } : { opacity: 1, transform: "translateY(0px) scale(1)" }}
        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, transform: "translateY(-2px) scale(0.985)" }}
        transition={reduceMotion ? { duration: 0 } : { duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
        className="fixed left-[8px] top-[53px] z-50 flex w-[280px] origin-top-left flex-col items-start overflow-hidden rounded-[4px] bg-white will-change-[opacity,transform]"
        style={{ boxShadow: "0 0 4px 0 rgba(0, 0, 0, 0.15)" }}
      >
        <div className="flex w-full shrink-0 flex-col items-start gap-[4px] border-b px-[4px] pb-[4px]" style={{ borderColor: tokens.border }}>
          <div className="flex w-full items-center rounded-[2px] pl-[6px] pt-[8px]">
            <span className="text-[12px] font-medium leading-[normal] tracking-[-0.24px]" style={{ color: tokens.grey }}>fz4884@gmail.com</span>
          </div>

          <div className="flex w-full flex-col items-start">
            <button type="button" className="flex w-full items-center gap-[8px] rounded-[4px] px-[6px] py-[8px] text-left transition-colors duration-150 ease-out hover:bg-[#F7F7F8]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={sidebarAsset("team-avatar.png")} alt="" className="h-[32px] w-[32px] shrink-0 rounded-[4px] object-cover" />
              <div className="flex min-w-0 flex-1 flex-col items-start gap-[2px]">
                <span className="w-full truncate text-[13px] font-medium leading-[normal] tracking-[-0.13px]" style={{ color: tokens.black }}>mymeet.ai design team</span>
                <span className="flex items-center gap-[4px] text-[12px] font-normal leading-[normal] tracking-[-0.24px]" style={{ color: tokens.grey }}>
                  <span>Сотрудник</span><span className="h-[3px] w-[3px] rounded-full" style={{ backgroundColor: "#CDD0DA" }} /><span>Pro</span>
                </span>
              </div>
            </button>

            <button type="button" className="flex w-full items-center gap-[8px] rounded-[4px] py-[8px] pl-[6px] pr-[10px] text-left transition-colors duration-150 ease-out hover:bg-[#F7F7F8]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={sidebarAsset("workspace-avatar.png")} alt="" className="h-[32px] w-[32px] shrink-0 rounded-[4px] object-cover" />
              <div className="flex min-w-0 flex-1 flex-col items-start gap-[2px]">
                <span className="w-full truncate text-[13px] font-medium leading-[normal] tracking-[-0.13px]" style={{ color: tokens.black }}>fz4884&rsquo;s space</span>
                <span className="flex items-center gap-[4px] text-[12px] font-normal leading-[normal] tracking-[-0.24px]" style={{ color: tokens.grey }}>
                  <span>Владелец</span><span className="h-[3px] w-[3px] rounded-full" style={{ backgroundColor: "#CDD0DA" }} /><span>Business</span>
                </span>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={sidebarAsset("workspace-selected.svg")} alt="" width={16} height={16} className="shrink-0" />
            </button>
          </div>
        </div>

        <div className="flex h-[72px] w-full shrink-0 flex-col items-center border-b p-[4px]" style={{ borderColor: tokens.border }}>
          <WorkspaceMenuItem icon="invite.svg" label="Пригласить участников" />
          <WorkspaceMenuItem icon="workspace-settings.svg" label="Настройки пространства" />
        </div>

        <div className="flex h-[168px] w-full shrink-0 flex-col items-center border-b p-[4px]" style={{ borderColor: tokens.border }}>
          <WorkspaceMenuItem
            icon="theme.svg"
            label="Тема оформления"
            active={themeMenuOpen}
            onMouseEnter={showThemeMenu}
            onMouseLeave={scheduleHideThemeMenu}
            trailing={
              <span className="flex h-[16px] w-[16px] -rotate-90 items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={sidebarAsset("submenu-chevron.svg")} alt="" width={16} height={16} className="shrink-0" />
              </span>
            }
          />
          <WorkspaceMenuItem icon="plans.svg" label="Тарифные планы" />
          <WorkspaceMenuItem icon="submenu-settings.svg" label="Настройки" />
          <WorkspaceMenuItem icon="tg.svg" label="Телеграм-бот" />
          <WorkspaceMenuItem icon="website.svg" label="Сайт" />
        </div>

        <div className="flex h-[40px] w-full shrink-0 flex-col items-center p-[4px]">
          <WorkspaceMenuItem icon="logout.svg" label="Выйти" danger />
        </div>
      </motion.div>
      <AnimatePresence>
        {themeMenuOpen && (
          <ThemeSubmenu top={themeSubmenuTop} onMouseEnter={keepThemeMenuOpen} onMouseLeave={scheduleHideThemeMenu} />
        )}
      </AnimatePresence>
    </>
  );
}

function WorkspacePopoverPortal() {
  if (typeof document === "undefined") return null;
  return createPortal(<WorkspacePopover />, document.body);
}

function Sidebar() {
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const workspaceButtonRef = useRef<HTMLButtonElement>(null);

  const closeWorkspaceMenu = useCallback(() => {
    setWorkspaceMenuOpen(false);
  }, []);

  useEffect(() => {
    if (!workspaceMenuOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (
        workspaceButtonRef.current?.contains(target) ||
        target.closest("[data-workspace-popover='true']") ||
        target.closest("[data-theme-submenu='true']")
      ) return;
      closeWorkspaceMenu();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeWorkspaceMenu();
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [closeWorkspaceMenu, workspaceMenuOpen]);

  return (
    <aside className="relative h-full w-[280px] shrink-0 overflow-hidden bg-white">
      <div
        className="flex h-full w-[280px] flex-col justify-between border-r bg-white"
        style={{ borderColor: tokens.border }}
      >
        <div className="w-full">
          <div className="relative">
            <div
              className="flex h-[54px] w-[280px] items-center border-b border-r bg-white pl-[10px] pr-[16px]"
              style={{ borderColor: tokens.border }}
            >
              <button
                ref={workspaceButtonRef}
                type="button"
                aria-expanded={workspaceMenuOpen}
                aria-haspopup="menu"
                onClick={() => setWorkspaceMenuOpen((v) => !v)}
                className={`flex h-[40px] shrink-0 items-center rounded-[4px] p-[6px] text-left outline-none transition-colors duration-150 ease-out hover:bg-[#F7F7F8] ${workspaceMenuOpen ? "bg-[#F7F7F8]" : "bg-transparent"} ${pressableClass}`}
              >
                <span className="flex items-center gap-[8px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={sidebarAsset("workspace-avatar.png")} alt="" className="h-[28px] w-[28px] shrink-0 rounded-[3px] object-cover" />
                  <span className="flex min-w-0 items-center gap-[8px]">
                    <span className="truncate text-[13px] font-medium leading-[normal] tracking-[-0.13px]" style={{ color: tokens.black }}>
                      fz4884&rsquo;s space
                    </span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={sidebarAsset(workspaceMenuOpen ? "workspace-chevron-open.svg" : "chevron-down.svg")}
                      alt=""
                      width={16}
                      height={16}
                      className="shrink-0"
                    />
                  </span>
                </span>
              </button>
            </div>
            <AnimatePresence>
              {workspaceMenuOpen && <WorkspacePopoverPortal />}
            </AnimatePresence>
          </div>

          <div className="flex w-full flex-col gap-[12px] p-[16px]">
            <button
              type="button"
              className={`flex h-[36px] w-full items-center justify-between rounded-[4px] px-[12px] py-[10px] ${pressableClass}`}
              style={{ backgroundColor: tokens.blue }}
            >
              <span className="text-[13px] font-medium leading-[normal] tracking-[-0.13px] text-white">Добавить встречу</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={sidebarAsset("add.svg")} alt="" width={16} height={16} className="shrink-0" />
            </button>

            <MenuGroup items={primaryItems} />
            <MenuGroup title="Ресурсы" items={resourceItems} />
          </div>
        </div>

        <div className="flex w-full shrink-0 flex-col items-start border-t border-solid" style={{ borderColor: tokens.border }}>
          <UpgradePlanCTA />
          <div className="flex w-full flex-col gap-[8px] px-[16px] pb-[12px] pt-[12px]">
            <div className="flex w-full items-end justify-between whitespace-nowrap">
              <span className="text-[13px] font-medium tracking-[-0.13px]" style={{ color: tokens.black }}>Free</span>
              <span className="text-[12px] font-medium tracking-[-0.24px]" style={{ color: tokens.black }}>Доступно 100 из 180</span>
            </div>
            <div className="relative h-[6px] w-full overflow-hidden rounded-full" style={{ backgroundColor: tokens.blueSea }}>
              <div className="h-full rounded-full" style={{ width: `${(100 / 180) * 100}%`, backgroundColor: tokens.blue }} />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

/* ─────────────────────────── METRIC CARDS ─────────────────────────── */

function DeltaChip({ delta }: { delta: Delta }) {
  const styles = {
    down: { bg: "rgba(204,51,51,0.12)", color: tokens.red, icon: "arrow-down12.svg" },
    up: { bg: "rgba(13,150,85,0.12)", color: tokens.green, icon: "arrow-up12.svg" },
    zero: { bg: "rgba(129,138,163,0.12)", color: tokens.grey, icon: null },
  }[delta.kind];
  return (
    <div
      className="flex items-center gap-[2px] rounded-[3px] px-[4px] py-[2px]"
      style={{ backgroundColor: styles.bg }}
    >
      {styles.icon && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={asset(styles.icon)}
          alt=""
          width={12}
          height={12}
          className={`shrink-0 ${delta.kind === "up" ? "rotate-180" : ""}`}
        />
      )}
      <span className="text-[12px] font-medium leading-[normal] tracking-[-0.24px]" style={{ color: styles.color }}>
        {delta.value}
      </span>
    </div>
  );
}

/**
 * Tooltip — переиспользуемый бабл в стиле блюр-карточки графика (белый фон + backdrop-blur).
 * Появляется над триггером по ховеру. align: "start" | "center" | "end" — как выравнивать по X.
 */
function Tooltip({
  text,
  children,
  align = "center",
}: {
  text: string;
  children: React.ReactNode;
  align?: "start" | "center" | "end";
}) {
  const alignClass =
    align === "start" ? "left-0" : align === "end" ? "right-0" : "left-1/2 -translate-x-1/2";
  return (
    <span className="group/tip relative inline-flex">
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute bottom-[calc(100%+8px)] z-30 w-max max-w-[240px] whitespace-normal rounded-[4px] border border-solid p-[8px] text-left text-[12px] font-normal leading-[1.35] tracking-[-0.24px] opacity-0 backdrop-blur-[4px] transition-opacity duration-[120ms] ease-out group-hover/tip:opacity-100 ${alignClass}`}
        style={{
          borderColor: tokens.border,
          backgroundColor: "rgba(255,255,255,0.85)",
          color: tokens.black,
          boxShadow: "0 0 4px 0 rgba(0,0,0,0.1)",
        }}
      >
        {text}
      </span>
    </span>
  );
}

function MetricCard({ label, value, delta, hint }: Metric) {
  const showChip = delta && delta.kind !== "zero";
  return (
    <div
      className="flex min-w-px flex-1 flex-col gap-[12px] rounded-[4px] border border-solid bg-white p-[16px]"
      style={{ borderColor: tokens.border }}
    >
      {hint ? (
        <Tooltip text={hint} align="end">
          <span
            className="cursor-default text-[13px] font-normal leading-[16px] tracking-[-0.13px] decoration-dotted underline-offset-2 group-hover/tip:underline"
            style={{ color: tokens.grey, textDecorationColor: tokens.greyDisabled }}
          >
            {label}
          </span>
        </Tooltip>
      ) : (
        <span className="text-[13px] font-normal leading-[16px] tracking-[-0.13px]" style={{ color: tokens.grey }}>
          {label}
        </span>
      )}
      <div className="flex items-center gap-[8px]">
        <span className="text-[24px] font-medium leading-[normal] tracking-[-0.48px]" style={{ color: tokens.black }}>
          {value}
        </span>
        {showChip && (
          <Tooltip text={DELTA_HINT} align="center">
            <DeltaChip delta={delta} />
          </Tooltip>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────── MEETINGS CHART ─────────────────────────── */

function MeetingsChart({ range, data, hourly }: { range: DateRange; data: PeriodData; hourly: boolean }) {
  const reduceMotion = useReducedMotion();
  const [enabled, setEnabled] = useState<Record<SeriesKey, boolean>>({ total: true, online: true, files: true });
  // station не сбрасывается при уходе мыши — маркеры и тултип плавно гаснут на месте, а не прыгают в 0
  const [station, setStation] = useState(0);
  const [hovered, setHovered] = useState(false);
  // ховер по чипсе легенды — подсветить её график, остальные приглушить
  const [focusedKey, setFocusedKey] = useState<SeriesKey | null>(null);

  const enabledCount = SERIES.filter((s) => enabled[s.key]).length;
  const toggle = (key: SeriesKey) =>
    setEnabled((prev) => {
      // нельзя отжать последнюю активную серию — иначе график опустеет
      if (prev[key] && Object.values(prev).filter(Boolean).length === 1) return prev;
      return { ...prev, [key]: !prev[key] };
    });

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * CHART_W;
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < X.length; i++) {
      const d = Math.abs(X[i] - x);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    setStation(best);
    setHovered(true);
  };

  const visibleSeries = SERIES.filter((s) => enabled[s.key]);
  // Рисуем от «Файлы» к «Всего»: оранжевый слой уходит вниз стека, серый — наверх (как в Figma)
  const drawOrder = [...visibleSeries].reverse();
  const tooltipLeftPct = useMemo(() => {
    const x = X[station];
    const left = x + 244 > CHART_W ? x - 244 : x + 24;
    return (left / CHART_W) * 100;
  }, [station]);

  const smoothMove = "transition-[left,top,opacity] duration-[150ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none";

  // Коэффициенты приглушения: сфокусированная серия — на полную, остальные — тише
  const dimFor = (key: SeriesKey) => (focusedKey === null || focusedKey === key ? 1 : 0.2);

  return (
    <div
      className="flex w-full flex-col gap-[12px] rounded-[4px] border border-solid bg-white p-[16px]"
      style={{ borderColor: tokens.border }}
    >
      <div className="flex w-full flex-col gap-[4px]">
        <span className="text-[14px] font-medium leading-[1.35] tracking-[-0.28px]" style={{ color: tokens.black }}>
          Встречи
        </span>
        <span className="text-[13px] font-normal leading-[16px] tracking-[-0.13px]" style={{ color: tokens.grey }}>
          {data.meetingsTotal} встреч за период
        </span>
      </div>

      <div className="flex w-full flex-col gap-[8px]">
        <div
          className="relative h-[235px] w-full overflow-visible rounded-[4px]"
          onMouseMove={onMove}
          onMouseLeave={() => setHovered(false)}
        >
          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${CHART_W} ${CHART_H}`}
            preserveAspectRatio="none"
            className="block"
          >
            <defs>
              {SERIES.map((s) => (
                <linearGradient
                  key={s.key}
                  id={`fill-${s.key}`}
                  x1={CHART_W / 2}
                  y1={s.fillTop}
                  x2={CHART_W / 2}
                  y2={s.fillBottom}
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor={s.color} stopOpacity="0.2" />
                  <stop offset="0.5" stopColor={s.color} stopOpacity="0.16" />
                  <stop offset="1" stopColor="white" stopOpacity="0" />
                </linearGradient>
              ))}
            </defs>
            {/* Морфинг формы при смене периода: число точек всех кривых одинаковое, framer интерполирует d */}
            {/* Порядок слоёв как в Figma: «Файлы» (оранжевый) в самом низу стека, «Всего» — сверху.
                Иначе оранжевая заливка ложится поверх синей и выглядит грязной. */}
            {/* opacity-приглушение вешаем на обёрточный <g>, а не на motion.path:
                framer перетирает inline-style motion-компонента на каждом рендере, <g> он не трогает */}
            {drawOrder.map((s) => (
              <g key={`area-${s.key}`} style={{ opacity: 0.4 * dimFor(s.key), transition: "opacity 200ms ease-out" }}>
                <motion.path
                  initial={false}
                  animate={{ d: areaPath(data.seriesYs[s.key], s.fillBottom) }}
                  transition={reduceMotion ? { duration: 0 } : { duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  fill={`url(#fill-${s.key})`}
                  fillOpacity="0.8"
                />
              </g>
            ))}
            {drawOrder.map((s) => (
              <g key={`line-${s.key}`} style={{ opacity: dimFor(s.key), transition: "opacity 200ms ease-out" }}>
                <motion.path
                  initial={false}
                  animate={{ d: linePath(data.seriesYs[s.key]) }}
                  transition={reduceMotion ? { duration: 0 } : { duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  fill="none"
                  stroke={s.color}
                  strokeWidth="1"
                />
              </g>
            ))}
          </svg>

          {/* Маркеры серий — div'ы с CSS-переходами, чтобы плавно скользить между станциями */}
          {visibleSeries.map((s) => (
            <span
              key={`marker-${s.key}`}
              className={`pointer-events-none absolute h-[6px] w-[6px] -translate-x-1/2 -translate-y-1/2 rounded-full ${smoothMove}`}
              style={{
                left: `${(X[station] / CHART_W) * 100}%`,
                top: `${(data.seriesYs[s.key][station] / CHART_H) * 100}%`,
                backgroundColor: s.color,
                opacity: hovered ? 1 : 0,
              }}
            />
          ))}

          <div
            className={`pointer-events-none absolute top-[48px] flex w-[220px] flex-col gap-[8px] rounded-[4px] border border-solid p-[12px] backdrop-blur-[4px] ${smoothMove}`}
            style={{
              left: `${tooltipLeftPct}%`,
              borderColor: tokens.border,
              backgroundColor: "rgba(255,255,255,0.85)",
              opacity: hovered ? 1 : 0,
              transform: hovered ? "translateY(0px)" : "translateY(4px)",
              transitionProperty: "left, top, opacity, transform",
            }}
          >
            <span className="w-full text-[12px] font-normal leading-[normal] tracking-[-0.24px]" style={{ color: tokens.grey }}>
              {stationLabel(X[station], range, hourly)}
            </span>
            <div className="h-px w-full" style={{ backgroundColor: tokens.border }} />
            {SERIES.map((s, i) =>
              enabled[s.key] ? (
                <div key={s.key} className="flex w-full items-center justify-between">
                  <div className="flex items-center gap-[8px]">
                    <span className="h-[8px] w-[8px] shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-[12px] font-normal leading-[normal] tracking-[-0.24px]" style={{ color: tokens.black }}>
                      {s.label}
                    </span>
                  </div>
                  <span className="text-[12px] font-medium leading-[normal] tracking-[-0.24px]" style={{ color: tokens.black }}>
                    {tooltipValue(i, data.seriesYs[s.key][station])}
                  </span>
                </div>
              ) : null
            )}
          </div>
        </div>

        <div className="flex w-full flex-col items-end gap-[8px]">
          <div className="h-px w-full" style={{ backgroundColor: tokens.border }} />
          <div className="flex w-full items-center justify-between">
            {/* режим «1 день» — часы по оси; иначе даты границ периода */}
            {(hourly
              ? ["00:00", "06:00", "12:00", "18:00", "00:00"]
              : [shortDateLabel(range.from), shortDateLabel(range.to)]
            ).map((label, i) => (
              <span
                key={i}
                className="text-[12px] font-normal leading-[normal] tracking-[-0.24px]"
                style={{ color: tokens.grey }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-start gap-[6px]">
        {SERIES.map((s) => {
          const on = enabled[s.key];
          const isLastActive = on && enabledCount === 1;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => toggle(s.key)}
              onMouseEnter={() => on && setFocusedKey(s.key)}
              onMouseLeave={() => setFocusedKey(null)}
              disabled={isLastActive}
              className={`flex h-[24px] items-center justify-center gap-[4px] rounded-[3px] px-[8px] py-[4px] ${isLastActive ? "cursor-default" : "cursor-pointer"} ${pressableClass}`}
              style={{ backgroundColor: tokens.bgSubtle }}
            >
              <span className="flex h-[12px] w-[12px] shrink-0 items-center justify-center">
                <span
                  className="h-[8px] w-[8px] rounded-full transition-colors duration-[120ms]"
                  style={{ backgroundColor: on ? s.color : tokens.greyDisabled }}
                />
              </span>
              <span
                className="text-[12px] font-normal leading-[normal] tracking-[-0.24px] transition-colors duration-[120ms]"
                style={{ color: on ? tokens.black : tokens.greyDisabled }}
              >
                {s.label}
              </span>
              <span
                className="text-[12px] font-normal leading-[normal] tracking-[-0.24px] transition-colors duration-[120ms]"
                style={{ color: on ? tokens.grey : tokens.greyDisabled }}
              >
                {data.legend[s.key]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────── BREAKDOWN CARDS (AI Отчеты / Интеграции) ─────────────────────────── */

type BreakdownRow = { icon: string; label: string; count: string; pct: string; barWidth: number; iconSize?: number };

const AI_REPORT_LABELS = [
  { icon: asset("report-icon-1.svg"), label: "Обычная встреча" },
  { icon: asset("report-icon-2.svg"), label: "Командный синк" },
  { icon: asset("report-icon-3.svg"), label: "Встреча с клиентом" },
  { icon: asset("report-icon-4.svg"), label: "Синк по проекту" },
  { icon: asset("report-icon-5.svg"), label: "Анекдот по встрече" },
];

const INTEGRATION_LABELS = [
  { icon: meetingAsset("source-google-meet.png"), label: "Google Meet", iconSize: 14 },
  { icon: meetingAsset("source-zoom.png"), label: "Zoom", iconSize: 14 },
  { icon: meetingAsset("source-telemost.png"), label: "Я.Телемост", iconSize: 14 },
  { icon: meetingAsset("source-teams.png"), label: "Microsoft Teams", iconSize: 14 },
  { icon: meetingAsset("source-uploaded.svg"), label: "Загруженные файлы", iconSize: 14 },
];

function buildBreakdownRows(labels: { icon: string; label: string; iconSize?: number }[], data: PeriodData): BreakdownRow[] {
  const sum = data.breakdownCounts.reduce((a, b) => a + b, 0);
  return labels.map((l, i) => ({
    ...l,
    count: fmt(data.breakdownCounts[i]),
    pct: `${Math.round((data.breakdownCounts[i] / sum) * 100)}%`,
    barWidth: data.breakdownWidths[i],
  }));
}

function BreakdownCard({ title, rows }: { title: string; rows: BreakdownRow[] }) {
  // По ховеру на список числа во всех строках показываются в процентах от суммы
  const [showPct, setShowPct] = useState(false);
  return (
    <div
      className="flex h-[255px] min-w-px flex-1 flex-col gap-[12px] rounded-[4px] border border-solid bg-white p-[16px]"
      style={{ borderColor: tokens.border }}
    >
      <span className="w-full text-[14px] font-medium leading-[1.35] tracking-[-0.28px]" style={{ color: tokens.black }}>
        {title}
      </span>
      <div className="flex w-full flex-col gap-[8px]">
        {rows.map((row) => (
          <div key={row.label} className="flex w-full items-center justify-between">
            <div
              className="flex shrink-0 items-center gap-[6px] rounded-[3px] p-[8px]"
              style={{ backgroundColor: tokens.bgSubtle, width: row.barWidth }}
            >
              <span className="flex h-[16px] w-[16px] shrink-0 items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={row.icon}
                  alt=""
                  className="max-w-none shrink-0 object-contain"
                  style={{ width: row.iconSize ?? 16, height: row.iconSize ?? 16 }}
                />
              </span>
              <span
                className="whitespace-nowrap text-[12px] font-normal leading-[normal] tracking-[-0.24px]"
                style={{ color: tokens.black }}
              >
                {row.label}
              </span>
            </div>
            {/* Ховер именно по контейнеру цифры переключает все строки на проценты */}
            <span
              onMouseEnter={() => setShowPct(true)}
              onMouseLeave={() => setShowPct(false)}
              className="text-[12px] font-normal leading-[normal] tracking-[-0.24px]"
              style={{ color: tokens.black }}
            >
              {showPct ? row.pct : row.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────── PARTICIPANTS TABLE ─────────────────────────── */

function ParticipantsTable({ data }: { data: PeriodData }) {
  const [minutesDesc, setMinutesDesc] = useState(true);
  const sorted = useMemo(
    () =>
      [...data.participants].sort((a, b) => (minutesDesc ? b.minutes - a.minutes : a.minutes - b.minutes)),
    [data, minutesDesc]
  );

  return (
    <div
      className="flex w-full flex-col overflow-clip rounded-[4px] border border-solid"
      style={{ borderColor: tokens.border }}
    >
      <div
        className="flex w-full items-center gap-[24px] border-b border-solid px-[16px] py-[12px]"
        style={{ backgroundColor: tokens.bgSubtle, borderColor: tokens.border }}
      >
        <span className="w-[280px] text-[12px] font-medium leading-[normal] tracking-[-0.24px]" style={{ color: tokens.black }}>
          Почта
        </span>
        <span className="min-w-px flex-1 text-[12px] font-medium leading-[normal] tracking-[-0.24px]" style={{ color: tokens.black }}>
          Онлайн встречи
        </span>
        <span className="w-[124px] shrink-0 text-[12px] font-medium leading-[normal] tracking-[-0.24px]" style={{ color: tokens.black }}>
          Загруженные файлы
        </span>
        <div className="flex min-w-px flex-1 items-center">
          <button
            type="button"
            onClick={() => setMinutesDesc((v) => !v)}
            aria-label={minutesDesc ? "Сортировать по возрастанию" : "Сортировать по убыванию"}
            className={`flex cursor-pointer items-center gap-[2px] ${pressableClass}`}
          >
            <span className="text-[12px] font-medium leading-[normal] tracking-[-0.24px]" style={{ color: tokens.black }}>
              Минуты
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={asset("sort-arrow12.svg")}
              alt=""
              width={12}
              height={12}
              className={`shrink-0 transition-transform duration-[180ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none ${minutesDesc ? "" : "rotate-180"}`}
            />
          </button>
        </div>
      </div>

      {sorted.map((p) => (
        <div
          key={p.email}
          className="flex h-[52px] w-full items-center gap-[24px] border-b border-solid bg-white px-[16px] py-[4px]"
          style={{ borderColor: tokens.border }}
        >
          <div className="flex w-[280px] shrink-0 items-center gap-[8px]">
            <span
              className="flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full text-[10px] font-normal leading-[normal] text-white"
              style={{ backgroundColor: p.color, letterSpacing: "-0.1px" }}
            >
              {p.initials}
            </span>
            <span className="whitespace-nowrap text-[13px] font-normal leading-[16px] tracking-[-0.13px]" style={{ color: tokens.black }}>
              {p.email}
            </span>
          </div>
          <span className="min-w-px flex-1 text-[12px] font-normal leading-[normal] tracking-[-0.24px]" style={{ color: tokens.black }}>
            {fmt(p.online)}
          </span>
          <span className="w-[124px] shrink-0 text-[12px] font-normal leading-[normal] tracking-[-0.24px]" style={{ color: tokens.black }}>
            {fmt(p.files)}
          </span>
          <span className="min-w-px flex-1 text-[12px] font-normal leading-[normal] tracking-[-0.24px]" style={{ color: tokens.black }}>
            {fmt(p.minutes)}
          </span>
        </div>
      ))}

      <div
        className="flex h-[52px] w-full items-center gap-[24px] px-[16px] py-[4px]"
        style={{ backgroundColor: tokens.bgSubtle }}
      >
        <span className="w-[280px] text-[12px] font-medium leading-[normal] tracking-[-0.24px]" style={{ color: tokens.black }}>
          Итого
        </span>
        <span className="min-w-px flex-1 text-[12px] font-medium leading-[normal] tracking-[-0.24px]" style={{ color: tokens.black }}>
          {fmt(data.totals.online)}
        </span>
        <span className="w-[124px] shrink-0 text-[12px] font-medium leading-[normal] tracking-[-0.24px]" style={{ color: tokens.black }}>
          {fmt(data.totals.files)}
        </span>
        <span className="min-w-px flex-1 text-[12px] font-medium leading-[normal] tracking-[-0.24px]" style={{ color: tokens.black }}>
          {fmt(data.totals.minutes)}
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────── CALENDAR (порт из прототипа «Поиск и фильтры») ─────────────────────────── */

function isoFromYMD(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

type CalendarValue = { from: string | null; to: string | null };

function Calendar({
  value,
  onChange,
  maxISO,
}: {
  value: CalendarValue;
  onChange: (next: CalendarValue) => void;
  maxISO: string;
}) {
  const [yy, mm, dd] = maxISO.split("-").map(Number);
  const maxYear = yy;
  const maxMonth = mm - 1;
  const maxDay = dd;

  const initial = value.from
    ? { y: Number(value.from.slice(0, 4)), m: Number(value.from.slice(5, 7)) - 1 }
    : { y: maxYear, m: maxMonth };
  const [view, setView] = useState<{ y: number; m: number }>(initial);

  const monthFirst = new Date(view.y, view.m, 1);
  const startWeekday = (monthFirst.getDay() + 6) % 7;
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const prevMonthDays = new Date(view.y, view.m, 0).getDate();

  type Cell = { y: number; m: number; d: number; current: boolean };
  const cells: Cell[] = [];
  for (let i = 0; i < startWeekday; i++) {
    const d = prevMonthDays - startWeekday + 1 + i;
    const prevM = view.m === 0 ? 11 : view.m - 1;
    const prevY = view.m === 0 ? view.y - 1 : view.y;
    cells.push({ y: prevY, m: prevM, d, current: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ y: view.y, m: view.m, d, current: true });
  }
  while (cells.length % 7 !== 0 || cells.length < 42) {
    const last = cells[cells.length - 1];
    const next = new Date(last.y, last.m, last.d + 1);
    cells.push({ y: next.getFullYear(), m: next.getMonth(), d: next.getDate(), current: false });
    if (cells.length >= 42) break;
  }

  function isAfterMax(c: Cell): boolean {
    if (c.y > maxYear) return true;
    if (c.y < maxYear) return false;
    if (c.m > maxMonth) return true;
    if (c.m < maxMonth) return false;
    return c.d > maxDay;
  }

  function isoOf(c: Cell): string {
    return isoFromYMD(c.y, c.m, c.d);
  }

  function isSelected(c: Cell): boolean {
    const iso = isoOf(c);
    return iso === value.from || iso === value.to;
  }

  function isInRange(c: Cell): boolean {
    if (!value.from || !value.to || value.from === value.to) return false;
    const iso = isoOf(c);
    return iso > value.from && iso < value.to;
  }

  function onDayClick(c: Cell) {
    if (isAfterMax(c)) return;
    const iso = isoOf(c);
    const isSingleSelected = value.from && (value.to === null || value.to === value.from);
    if (isSingleSelected && value.from === iso) {
      onChange({ from: null, to: null });
      return;
    }
    if (value.from && value.to && value.from !== value.to) {
      onChange({ from: iso, to: null });
      return;
    }
    if (!value.from) {
      onChange({ from: iso, to: null });
      return;
    }
    if (iso < value.from) onChange({ from: iso, to: value.from });
    else onChange({ from: value.from, to: iso });
  }

  function goPrev() {
    setView((v) => (v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 }));
  }
  function goNext() {
    if (view.y === maxYear && view.m === maxMonth) return;
    setView((v) => (v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 }));
  }
  const nextDisabled = view.y === maxYear && view.m === maxMonth;

  const weekdays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

  return (
    <div className="flex w-[246px] flex-col gap-[16px]">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={goPrev}
          aria-label="Предыдущий месяц"
          className="flex h-[20px] w-[20px] shrink-0 cursor-pointer items-center justify-center"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={meetingAsset("icon-cal-prev.svg")} alt="" className="h-[20px] w-[20px] max-w-none" />
        </button>
        <span
          className="text-center text-[14px] font-medium"
          style={{ color: tokens.black, letterSpacing: "-0.28px", lineHeight: 1.35 }}
        >
          {monthYearLabel(view.y, view.m)}
        </span>
        <button
          type="button"
          onClick={goNext}
          disabled={nextDisabled}
          aria-label="Следующий месяц"
          className="flex h-[20px] w-[20px] shrink-0 cursor-pointer items-center justify-center disabled:cursor-not-allowed disabled:opacity-30"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={meetingAsset("icon-cal-next.svg")} alt="" className="h-[20px] w-[20px] max-w-none" />
        </button>
      </div>
      <div className="grid w-full grid-cols-7 text-center" style={{ columnGap: "12px", rowGap: "13px" }}>
        {weekdays.map((w) => (
          <span key={w} className="text-[12px] font-normal" style={{ color: tokens.grey, letterSpacing: "-0.24px" }}>
            {w}
          </span>
        ))}
        {cells.map((c, i) => {
          const selected = isSelected(c);
          const inRange = isInRange(c);
          const disabled = isAfterMax(c);
          const inBand = selected || inRange;
          const col = i % 7;
          const prevInBand = inBand && col > 0 && (isSelected(cells[i - 1]) || isInRange(cells[i - 1]));
          const nextInBand = inBand && col < 6 && (isSelected(cells[i + 1]) || isInRange(cells[i + 1]));
          return (
            <button
              key={i}
              type="button"
              onClick={() => onDayClick(c)}
              disabled={disabled}
              className="relative flex items-center justify-center text-[13px] leading-none"
              style={{
                color: selected ? "#FFFFFF" : !c.current || disabled ? tokens.grey : tokens.black,
                fontWeight: selected ? 500 : 400,
                letterSpacing: "-0.13px",
                cursor: disabled ? "not-allowed" : "pointer",
              }}
            >
              {inBand && (
                <span
                  className="pointer-events-none absolute"
                  style={{
                    height: "24px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    left: prevInBand ? "-6px" : "50%",
                    right: nextInBand ? "-6px" : "50%",
                    marginLeft: prevInBand ? 0 : "-12px",
                    marginRight: nextInBand ? 0 : "-12px",
                    backgroundColor: tokens.blueSea,
                  }}
                />
              )}
              {selected && (
                <span
                  className="pointer-events-none absolute"
                  style={{
                    width: "24px",
                    height: "24px",
                    left: "50%",
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                    backgroundColor: tokens.blue,
                    borderRadius: "3px",
                  }}
                />
              )}
              <span className="relative">{c.d}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DateRangePanel({ range, onApply }: { range: DateRange; onApply: (from: string, to: string) => void }) {
  const [draft, setDraft] = useState<CalendarValue>({ from: range.from, to: range.to });

  const draftDifferent = draft.from !== range.from || draft.to !== range.to;
  const canApply = draft.from !== null && draftDifferent;
  const previewText = draft.from
    ? rangeLabel(draft.from, draft.to ?? draft.from)
    : null;

  return (
    <div
      className="flex flex-col gap-[16px] rounded-[4px] bg-white p-[16px]"
      style={{ width: "278px", boxShadow: "0px 0px 4px 0px rgba(0,0,0,0.15)" }}
    >
      <Calendar value={draft} onChange={setDraft} maxISO={TODAY_ISO} />
      {canApply && (
        <div className="flex w-full flex-col gap-[10px]">
          <button
            type="button"
            onClick={() => onApply(draft.from!, draft.to ?? draft.from!)}
            className={`flex h-[36px] w-[246px] cursor-pointer items-center justify-center rounded-[4px] p-[10px] hover:bg-[#0032B1] ${pressableClass}`}
            style={{ backgroundColor: tokens.blue }}
          >
            <span className="text-[13px] font-medium text-white" style={{ letterSpacing: "-0.13px" }}>
              Применить
            </span>
          </button>
          {previewText && (
            <span className="w-full text-center text-[12px] font-normal" style={{ color: tokens.grey, letterSpacing: "-0.24px" }}>
              {previewText}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────── TABS + FILTERS ROW ─────────────────────────── */

type Tab = "overview" | "participants";

const PRESETS: { days: PeriodDays; label: string }[] = [
  { days: 1, label: "Сегодня" },
  { days: 30, label: "Последние 30 дней" },
  { days: 90, label: "Последние 90 дней" },
  { days: 120, label: "Последние 120 дней" },
  { days: "all", label: "Все время" },
];

function TabsAndFilters({
  tab,
  onTabChange,
  preset,
  range,
  onPickPreset,
  onApplyCustom,
}: {
  tab: Tab;
  onTabChange: (t: Tab) => void;
  preset: PeriodPreset;
  range: DateRange;
  onPickPreset: (days: PeriodDays) => void;
  onApplyCustom: (from: string, to: string) => void;
}) {
  const [openPanel, setOpenPanel] = useState<"preset" | "calendar" | null>(null);
  const filtersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (openPanel === null) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (filtersRef.current?.contains(target)) return;
      setOpenPanel(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenPanel(null);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [openPanel]);

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Обзор" },
    { id: "participants", label: "Участники" },
  ];

  const presetLabel = presetLabelFor(preset);

  return (
    <div className="flex h-[36px] w-full items-center justify-between">
      <div className="flex h-full items-center">
        {tabs.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onTabChange(t.id)}
              className={`flex h-full items-center justify-center rounded-[4px] p-[10px] ${active ? "" : "hover:bg-[#FAFAFA]"} ${pressableClass}`}
              style={{ backgroundColor: active ? tokens.bgSubtle : "transparent" }}
            >
              <span
                className="whitespace-nowrap text-[13px] font-normal leading-[16px] tracking-[-0.13px]"
                style={{ color: active ? tokens.black : tokens.grey }}
              >
                {t.label}
              </span>
            </button>
          );
        })}
      </div>

      <div ref={filtersRef} className="relative flex items-center">
        <div className="relative">
          <button
            type="button"
            aria-expanded={openPanel === "preset"}
            aria-haspopup="menu"
            onClick={() => setOpenPanel((p) => (p === "preset" ? null : "preset"))}
            className={`flex w-full cursor-pointer items-center justify-between gap-[8px] rounded-l-[4px] border border-solid px-[12px] py-[10px] hover:bg-[#FAFAFA] ${openPanel === "preset" ? "bg-[#FAFAFA]" : "bg-white"} ${pressableClass}`}
            style={{ borderColor: tokens.border }}
          >
            <span className="whitespace-nowrap text-[13px] font-normal leading-[16px] tracking-[-0.13px]" style={{ color: tokens.black }}>
              {presetLabel}
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={sidebarAsset("chevron-down.svg")}
              alt=""
              width={16}
              height={16}
              className={`shrink-0 transition-transform duration-[180ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none ${openPanel === "preset" ? "rotate-180" : ""}`}
            />
          </button>

          <AnimatePresence>
            {openPanel === "preset" && (
              <motion.div
                initial={{ opacity: 0, transform: "translateY(-4px) scale(0.985)" }}
                animate={{ opacity: 1, transform: "translateY(0px) scale(1)" }}
                exit={{ opacity: 0, transform: "translateY(-2px) scale(0.99)" }}
                transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
                className="absolute left-0 top-[calc(100%+8px)] z-20 flex w-max min-w-full origin-top flex-col rounded-[4px] bg-white p-[4px] will-change-[opacity,transform]"
                style={{ boxShadow: "0 0 4px 0 rgba(0,0,0,0.15)" }}
                role="menu"
              >
                {PRESETS.map((p) => (
                  <button
                    key={p.days}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      onPickPreset(p.days);
                      setOpenPanel(null);
                    }}
                    className={`flex h-[32px] w-full shrink-0 items-center justify-between rounded-[3px] p-[6px] text-left hover:bg-[#F7F7F8] ${pressableClass}`}
                  >
                    <span className="whitespace-nowrap text-[13px] font-normal leading-[normal] tracking-[-0.13px]" style={{ color: tokens.black }}>
                      {p.label}
                    </span>
                    {preset === p.days && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={sidebarAsset("workspace-selected.svg")} alt="" width={16} height={16} className="shrink-0" />
                    )}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <button
          type="button"
          aria-expanded={openPanel === "calendar"}
          aria-haspopup="dialog"
          onClick={() => setOpenPanel((p) => (p === "calendar" ? null : "calendar"))}
          className={`flex cursor-pointer items-center gap-[6px] rounded-r-[4px] border-y border-r border-solid px-[12px] py-[10px] hover:bg-[#FAFAFA] ${openPanel === "calendar" ? "bg-[#FAFAFA]" : "bg-white"} ${pressableClass}`}
          style={{ borderColor: tokens.border }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset("calendar16.svg")} alt="" width={16} height={16} className="shrink-0" />
          <span className="whitespace-nowrap text-[13px] font-normal leading-[normal] tracking-[-0.13px]" style={{ color: tokens.black }}>
            {range.from === range.to ? shortDateLabel(range.from) : rangeLabel(range.from, range.to)}
          </span>
        </button>

        <AnimatePresence>
          {openPanel === "calendar" && (
            <motion.div
              key="calendar"
              initial={{ opacity: 0, transform: "translateY(-4px) scale(0.985)" }}
              animate={{ opacity: 1, transform: "translateY(0px) scale(1)" }}
              exit={{ opacity: 0, transform: "translateY(-2px) scale(0.99)" }}
              transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
              className="absolute right-0 top-[calc(100%+8px)] z-20 origin-top-right will-change-[opacity,transform]"
            >
              <DateRangePanel
                range={range}
                onApply={(from, to) => {
                  onApplyCustom(from, to);
                  setOpenPanel(null);
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ─────────────────────────── EXPORT POPOVER (Figma 40609:2707) ─────────────────────────── */

const EXPORT_FORMATS = ["HTML", "PDF", "CSV"] as const;

function ExportPopover({ initialPeriod, onClose }: { initialPeriod: string; onClose: () => void }) {
  const [format, setFormat] = useState<(typeof EXPORT_FORMATS)[number]>("HTML");
  const [period, setPeriod] = useState(initialPeriod);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, transform: "translateY(-4px) scale(0.985)" }}
      animate={{ opacity: 1, transform: "translateY(0px) scale(1)" }}
      exit={{ opacity: 0, transform: "translateY(-2px) scale(0.99)" }}
      transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
      className="absolute right-0 top-[calc(100%+6px)] z-30 flex w-[320px] origin-top-right flex-col rounded-[4px] bg-white will-change-[opacity,transform]"
      style={{ boxShadow: "0 0 2px 0 rgba(0,0,0,0.15)" }}
      role="dialog"
      aria-label="Экспорт статистики"
    >
      <div className="flex w-full items-center gap-[8px] rounded-t-[4px] bg-white p-[16px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset("export16.svg")} alt="" width={16} height={16} className="shrink-0" />
        <span className="whitespace-nowrap text-[14px] font-medium leading-[1.35] tracking-[-0.28px]" style={{ color: tokens.black }}>
          Экспорт статистики
        </span>
      </div>

      <div
        className="flex w-full flex-col items-end gap-[16px] border-t border-solid bg-white p-[16px]"
        style={{ borderColor: tokens.border }}
      >
        <div
          className="flex h-[40px] w-full items-start gap-[2px] rounded-[4px] p-[4px]"
          style={{ backgroundColor: tokens.bgSubtle }}
        >
          {EXPORT_FORMATS.map((f) => {
            const active = format === f;
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFormat(f)}
                className={`flex h-full min-w-px flex-1 cursor-pointer items-center justify-center rounded-[3px] px-[8px] py-[6px] ${active ? "bg-white" : "hover:bg-white/60"} ${pressableClass}`}
              >
                <span
                  className="whitespace-nowrap text-[13px] leading-[normal] tracking-[-0.13px]"
                  style={{ color: active ? tokens.black : tokens.grey, fontWeight: active ? 500 : 400 }}
                >
                  {f}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex w-full flex-col gap-[8px]">
          <span className="text-[13px] font-normal leading-[16px] tracking-[-0.13px]" style={{ color: tokens.black }}>
            Период
          </span>
          <div className="relative w-full">
            <button
              type="button"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              onClick={() => setMenuOpen((v) => !v)}
              className={`flex w-full cursor-pointer items-center justify-between rounded-[4px] border border-solid px-[12px] py-[10px] hover:bg-[#FAFAFA] ${menuOpen ? "bg-[#FAFAFA]" : "bg-white"} ${pressableClass}`}
              style={{ borderColor: tokens.border }}
            >
              <span className="whitespace-nowrap text-[13px] font-normal leading-[16px] tracking-[-0.13px]" style={{ color: tokens.black }}>
                {period}
              </span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={sidebarAsset("chevron-down.svg")}
                alt=""
                width={16}
                height={16}
                className={`shrink-0 transition-transform duration-[180ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none ${menuOpen ? "rotate-180" : ""}`}
              />
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, transform: "translateY(-4px) scale(0.985)" }}
                  animate={{ opacity: 1, transform: "translateY(0px) scale(1)" }}
                  exit={{ opacity: 0, transform: "translateY(-2px) scale(0.99)" }}
                  transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
                  className="absolute left-0 top-[calc(100%+8px)] z-40 flex w-max min-w-full origin-top flex-col rounded-[4px] bg-white p-[4px] will-change-[opacity,transform]"
                  style={{ boxShadow: "0 0 4px 0 rgba(0,0,0,0.15)" }}
                  role="menu"
                >
                  {PRESETS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setPeriod(p.label);
                        setMenuOpen(false);
                      }}
                      className={`flex h-[32px] w-full shrink-0 items-center justify-between rounded-[3px] p-[6px] text-left hover:bg-[#F7F7F8] ${pressableClass}`}
                    >
                      <span className="whitespace-nowrap text-[13px] font-normal leading-[normal] tracking-[-0.13px]" style={{ color: tokens.black }}>
                        {p.label}
                      </span>
                      {period === p.label && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={sidebarAsset("workspace-selected.svg")} alt="" width={16} height={16} className="shrink-0" />
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className={`flex h-[36px] w-full cursor-pointer items-center justify-center rounded-[4px] p-[10px] hover:bg-[#0032B1] ${pressableClass}`}
          style={{ backgroundColor: tokens.blue }}
        >
          <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-medium leading-[normal] tracking-[-0.13px] text-white">
            Скачать
          </span>
        </button>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────── PAGE ─────────────────────────── */

export default function UsageStatsPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [preset, setPreset] = useState<PeriodPreset>(30);
  const [range, setRange] = useState<DateRange>({ from: isoAddDays(TODAY_ISO, -30), to: TODAY_ISO });
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const pickPreset = (days: PeriodDays) => {
    setPreset(days);
    if (days === "all") setRange({ from: ALL_TIME_FROM, to: TODAY_ISO });
    else if (days === 1) setRange({ from: TODAY_ISO, to: TODAY_ISO });
    else setRange({ from: isoAddDays(TODAY_ISO, -days), to: TODAY_ISO });
  };

  const applyCustom = (from: string, to: string) => {
    setPreset("custom");
    setRange({ from, to });
  };

  const hourly = preset === 1;
  const data = useMemo(() => getPeriodData(range, preset === "all", hourly), [range, preset, hourly]);

  const presetLabel = presetLabelFor(preset);

  useEffect(() => {
    if (!exportOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (exportRef.current?.contains(target)) return;
      setExportOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExportOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [exportOpen]);

  return (
    <main
      className={`${inter.className} flex h-screen min-h-[720px] w-full overflow-hidden bg-white`}
      style={{ color: tokens.black }}
    >
      <Sidebar />

      <section className="flex h-full min-w-0 flex-1 flex-col bg-white">
        <div className="flex h-[54px] w-full shrink-0 items-center justify-between bg-white p-[16px]">
          <h1 className="text-[13px] font-medium leading-[normal] tracking-[-0.13px]" style={{ color: tokens.black }}>
            Статистика использования
          </h1>
          <div ref={exportRef} className="relative">
            <button
              type="button"
              aria-expanded={exportOpen}
              aria-haspopup="dialog"
              onClick={() => setExportOpen((v) => !v)}
              className={`flex cursor-pointer items-center rounded-[3px] px-[8px] py-[6px] hover:bg-[#F7F7F8] ${pressableClass}`}
              style={{ backgroundColor: exportOpen ? tokens.bgSubtle : "transparent" }}
            >
              <span className="whitespace-nowrap text-[13px] font-normal leading-[16px] tracking-[-0.13px]" style={{ color: tokens.black }}>
                Экспорт
              </span>
            </button>
            <AnimatePresence>
              {exportOpen && <ExportPopover initialPeriod={presetLabel} onClose={() => setExportOpen(false)} />}
            </AnimatePresence>
          </div>
        </div>

        {/* scrollbar-gutter: stable both-edges — скроллбар не сдвигает контент при переключении вкладок */}
        <div className="flex w-full min-h-0 flex-1 flex-col items-center overflow-y-auto [scrollbar-gutter:stable_both-edges]">
          <div className="flex w-[720px] shrink-0 flex-col gap-[24px] pb-[24px] pt-[24px]">
            <TabsAndFilters
              tab={tab}
              onTabChange={setTab}
              preset={preset}
              range={range}
              onPickPreset={pickPreset}
              onApplyCustom={applyCustom}
            />

            {tab === "overview" ? (
              <div className="flex w-full flex-col gap-[16px]">
                <div className="flex w-full items-center gap-[12px]">
                  {data.metrics.map((m) => (
                    <MetricCard key={m.label} label={m.label} value={m.value} delta={m.delta} hint={m.hint} />
                  ))}
                </div>
                <MeetingsChart range={range} data={data} hourly={hourly} />
                <div className="flex w-full items-start gap-[16px]">
                  <BreakdownCard title="AI Отчеты" rows={buildBreakdownRows(AI_REPORT_LABELS, data)} />
                  <BreakdownCard title="Источники встреч" rows={buildBreakdownRows(INTEGRATION_LABELS, data)} />
                </div>
              </div>
            ) : (
              <ParticipantsTable data={data} />
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
