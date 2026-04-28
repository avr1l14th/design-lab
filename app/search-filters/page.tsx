"use client";

import { Inter } from "next/font/google";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AUTHORS,
  MEETINGS,
  SOURCE_META,
  getAuthor,
  type Author,
  type Meeting,
  type MeetingSource,
  type ThumbKind,
} from "./mock-data";
import {
  EMPTY_FILTERS,
  filterMeetings,
  formatDateRange,
  groupByDate,
  hasActiveFilters,
  monthYearLabel,
  todayISOPinned,
  type FilterState,
} from "./use-filtered-meetings";

const inter = Inter({ subsets: ["latin", "cyrillic"], weight: ["400", "500"] });

const BASE = process.env.NODE_ENV === "production" ? "/design-lab" : "";
const asset = (p: string) => `${BASE}/search-filters/${p}`;

// Design tokens from Figma
const tokens = {
  blue: "#0138c7",
  black: "#212833",
  grey: "#818aa3",
  grey20: "#f7f7f8",
  grey40: "#efefef",
  grey50: "#dddedf",
  grey60: "#c7c8ca",
  blueSea: "#e4ecfa",
  red: "#c33",
};

function SourceIcon({ src }: { src: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={asset(src)}
      alt=""
      className="h-[14px] w-[14px] max-w-none shrink-0 object-contain"
    />
  );
}

function AuthorAvatar({ color, letter, title }: { color: string; letter: string; title?: string }) {
  return (
    <span
      className="flex h-[16px] w-[16px] shrink-0 items-center justify-center rounded-full text-[9px] font-medium text-white"
      style={{ backgroundColor: color, letterSpacing: "-0.18px" }}
      title={title}
    >
      {letter}
    </span>
  );
}

function Thumb({ kind }: { kind: ThumbKind }) {
  if (kind === "error") {
    return (
      <div
        className="flex h-[48px] w-[80px] shrink-0 items-center justify-center overflow-clip rounded-[4px] border border-solid p-[8px]"
        style={{ backgroundColor: tokens.grey20, borderColor: tokens.grey40 }}
      >
        <span
          className="text-[12px] font-medium"
          style={{ color: tokens.red, letterSpacing: "-0.24px" }}
        >
          ERROR
        </span>
      </div>
    );
  }
  if (kind === "legacy") {
    return (
      <div
        className="flex h-[48px] w-[80px] shrink-0 items-center justify-center overflow-clip rounded-[4px] border border-solid p-[8px]"
        style={{ backgroundColor: tokens.grey20, borderColor: tokens.grey40 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset("image442.png")} alt="" className="h-[18px] w-[18px] object-cover" />
      </div>
    );
  }
  if (kind === "empty") {
    return (
      <div
        className="flex h-[48px] w-[80px] shrink-0 items-center justify-center overflow-clip rounded-[4px] border border-solid p-[8px]"
        style={{ backgroundColor: tokens.grey20, borderColor: tokens.grey40 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset("frame-audio2.svg")} alt="" className="h-[20px] w-[20px]" />
      </div>
    );
  }
  if (kind === "new") {
    return (
      <div className="relative h-[48px] w-[80px] shrink-0 overflow-clip rounded-[4px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset("property2.png")} alt="" className="absolute inset-0 h-full w-full rounded-[4px] object-cover" />
        <div className="absolute inset-0 rounded-[4px] backdrop-blur-[3px] bg-[rgba(0,0,0,0.01)]" />
        <div className="absolute inset-0 rounded-[4px] bg-[rgba(255,255,255,0.24)]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="text-[12px] font-medium text-white"
            style={{ letterSpacing: "-0.24px", fontFamily: inter.style.fontFamily }}
          >
            NEW
          </span>
        </div>
      </div>
    );
  }
  if (kind === "default") {
    return (
      <div className="relative h-[48px] w-[80px] shrink-0 overflow-clip rounded-[4px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset("property2.png")} alt="" className="absolute inset-0 h-full w-full rounded-[4px] object-cover" />
      </div>
    );
  }
  const imgMap: Record<string, string> = {
    audio1: "audio1.png",
    audio2: "audio2.png",
    audio3: "audio3.png",
  };
  return (
    <div className="relative h-[48px] w-[80px] shrink-0 overflow-clip rounded-[4px]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={asset(imgMap[kind])} alt="" className="absolute inset-0 h-full w-full rounded-[4px] object-cover" />
      <div className="absolute inset-0 rounded-[4px] bg-[rgba(0,0,0,0.08)]" />
      <div className="absolute inset-0 flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset("frame-audio.svg")} alt="" className="h-[20px] w-[20px]" />
      </div>
    </div>
  );
}

function MeetingRow({ m }: { m: Meeting }) {
  const author = getAuthor(m.authorId);
  const source = SOURCE_META[m.source];
  return (
    <div className="flex h-[72px] w-full items-center justify-between bg-white px-[24px] py-[12px]">
      <div className="flex items-center gap-[24px]">
        <div className="flex w-[446px] items-center gap-[12px]">
          <Thumb kind={m.thumb} />
          <div className="flex min-w-0 flex-1 flex-col gap-[4px]">
            <p
              className="truncate text-[13px] font-medium"
              style={{ color: tokens.black, letterSpacing: "-0.13px" }}
            >
              {m.title}
            </p>
            <div className="flex items-center gap-[4px]">
              <span
                className="text-[12px]"
                style={{ color: tokens.grey, letterSpacing: "-0.24px" }}
              >
                {m.startTime}
              </span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={asset("dot.svg")} alt="" className="h-[3px] w-[3px]" />
              <span
                className="text-[12px]"
                style={{ color: tokens.grey, letterSpacing: "-0.24px" }}
              >
                {m.durationMin} min
              </span>
            </div>
          </div>
        </div>
        <div className="flex w-[180px] flex-col items-start">
          <div className="flex w-[156px] items-center gap-[8px]">
            <AuthorAvatar color={author.avatarColor} letter={author.name.charAt(0)} title={author.name} />
            <p className="min-w-0 flex-1 truncate text-[12px]" style={{ color: tokens.black, letterSpacing: "-0.24px" }}>
              {author.email}
            </p>
          </div>
        </div>
        <div className="flex w-[180px] flex-col items-start overflow-clip">
          <div className="flex w-full items-center gap-[8px]">
            <SourceIcon src={source.icon} />
            <span className="truncate text-[12px]" style={{ color: tokens.black, letterSpacing: "-0.24px" }}>
              {source.label}
            </span>
          </div>
        </div>
      </div>
      <div className="h-[16px] w-[16px] opacity-0" />
    </div>
  );
}

function DateHeader({ label, subLabel }: { label: string; subLabel: string }) {
  return (
    <div className="flex w-full shrink-0 flex-col items-start pt-[12px]">
      <div className="flex w-full flex-col items-start gap-[8px]">
        <div className="flex items-center gap-[6px] px-[24px] text-[13px]" style={{ letterSpacing: "-0.13px" }}>
          <span className="font-medium" style={{ color: tokens.black }}>
            {label}
          </span>
          <span className="font-normal" style={{ color: tokens.grey }}>
            {subLabel}
          </span>
        </div>
        <div className="h-px w-full shrink-0" style={{ backgroundColor: tokens.grey40 }} />
      </div>
    </div>
  );
}

function SidebarMenuItem({
  icon,
  label,
  active,
}: {
  icon: string;
  label: string;
  active?: boolean;
}) {
  return (
    <div
      className="flex w-full items-center rounded-[4px] p-[4px]"
      style={{ backgroundColor: active ? tokens.grey20 : "#fff" }}
    >
      <div className="flex items-center gap-[8px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset(icon)} alt="" className="h-[16px] w-[16px] shrink-0" />
        <span className="text-[13px]" style={{ color: tokens.black, letterSpacing: "-0.13px" }}>
          {label}
        </span>
      </div>
    </div>
  );
}

function SkeletonBar({ width, height = 16, radius = 2 }: { width: number; height?: number; radius?: number }) {
  return (
    <div
      className="skeleton-shimmer shrink-0"
      style={{ width, height, borderRadius: radius }}
    />
  );
}

function SkeletonDateHeader() {
  return (
    <div className="flex h-[60px] w-full flex-col items-start justify-center px-[24px] py-[12px]">
      <div className="flex h-[36px] items-center">
        <div className="flex h-full items-center justify-center px-[10px] py-[8px]">
          <SkeletonBar width={78} height={16} />
        </div>
        <div className="flex h-full items-center justify-center px-[10px] py-[8px]">
          <SkeletonBar width={78} height={16} />
        </div>
      </div>
    </div>
  );
}

function SkeletonRow({ titleWidth = 280 }: { titleWidth?: number }) {
  return (
    <div className="flex h-[72px] w-full items-center justify-between bg-white px-[24px] py-[12px]">
      <div className="flex items-center gap-[24px]">
        <div className="flex w-[446px] items-center gap-[12px]">
          <SkeletonBar width={80} height={48} radius={4} />
          <div className="flex min-w-0 flex-1 flex-col items-start gap-[4px]">
            <SkeletonBar width={titleWidth} height={16} />
            <SkeletonBar width={88} height={15} />
          </div>
        </div>
        <div className="flex w-[180px] flex-col items-start">
          <SkeletonBar width={111} height={16} />
        </div>
        <SkeletonBar width={87} height={15} />
      </div>
    </div>
  );
}

function SkeletonGroup({ titleWidths }: { titleWidths: number[] }) {
  return (
    <div className="flex w-full flex-col">
      <SkeletonDateHeader />
      {titleWidths.map((w, i) => (
        <SkeletonRow key={i} titleWidth={w} />
      ))}
    </div>
  );
}

type FilterTab = "sources" | "authors" | "date";

const SOURCES_ORDER: MeetingSource[] = [
  "uploaded",
  "google-meet",
  "extension",
  "zoom",
  "telemost",
  "mts-link",
  "teams",
  "kontur-tolk",
  "jitsi",
  "salute-jazz",
  "trueconf",
];

function MainPanelRow({
  icon,
  label,
  active,
  hasDot,
  onPick,
}: {
  icon: string;
  label: string;
  active: boolean;
  hasDot: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onMouseEnter={onPick}
      onFocus={onPick}
      onClick={onPick}
      className="flex h-[32px] w-full items-center justify-between rounded-[2px] px-[6px] hover:bg-[color:var(--_hover)] transition-colors"
      style={{
        ["--_hover" as string]: tokens.grey20,
        backgroundColor: active ? tokens.grey20 : "transparent",
      }}
    >
      <span className="flex items-center gap-[6px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset(icon)} alt="" className="h-[16px] w-[16px] max-w-none shrink-0" />
        <span
          className="text-[13px] font-normal whitespace-nowrap"
          style={{ color: tokens.black, letterSpacing: "-0.13px" }}
        >
          {label}
        </span>
      </span>
      {hasDot ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={asset("icon-active-row.svg")} alt="" className="h-[16px] w-[24px] max-w-none shrink-0" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={asset("icon-chevron-right.svg")} alt="" className="h-[16px] w-[16px] max-w-none shrink-0" />
      )}
    </button>
  );
}

function MainPanel({
  filters,
  activeTab,
  onPick,
  onLeaveTabs,
  onClear,
}: {
  filters: FilterState;
  activeTab: FilterTab | null;
  onPick: (tab: FilterTab) => void;
  onLeaveTabs: () => void;
  onClear: () => void;
}) {
  const sourcesActive = filters.sources.length > 0;
  const authorsActive = filters.authorIds.length > 0;
  const dateActive = filters.dateFrom !== null || filters.dateTo !== null;
  const canClear = hasActiveFilters(filters);
  return (
    <div
      className="flex w-[200px] flex-col items-start rounded-[4px] bg-white p-[4px]"
      style={{ boxShadow: "0 0 4px 0 rgba(0,0,0,0.15)" }}
      role="menu"
    >
      <MainPanelRow
        icon="icon-menu-sources.svg"
        label="Источники"
        active={activeTab === "sources"}
        hasDot={sourcesActive}
        onPick={() => onPick("sources")}
      />
      <MainPanelRow
        icon="icon-menu-authors.svg"
        label="Авторы"
        active={activeTab === "authors"}
        hasDot={authorsActive}
        onPick={() => onPick("authors")}
      />
      <MainPanelRow
        icon="icon-menu-date.svg"
        label="Дата"
        active={activeTab === "date"}
        hasDot={dateActive}
        onPick={() => onPick("date")}
      />
      <div className="h-px w-full" onMouseEnter={onLeaveTabs} style={{ backgroundColor: tokens.grey40 }} />
      <button
        type="button"
        role="menuitem"
        disabled={!canClear}
        onMouseEnter={onLeaveTabs}
        onClick={onClear}
        className="flex h-[32px] w-full items-center rounded-[2px] px-[6px] hover:bg-[color:var(--_hover)] transition-colors disabled:cursor-not-allowed disabled:hover:bg-transparent"
        style={{ ["--_hover" as string]: tokens.grey20 }}
      >
        <span
          className="text-[13px] font-normal whitespace-nowrap"
          style={{ color: canClear ? tokens.black : tokens.grey60, letterSpacing: "-0.13px" }}
        >
          Очистить фильтры
        </span>
      </button>
    </div>
  );
}

function CheckboxRow({
  checked,
  iconSrc,
  avatar,
  label,
  onToggle,
}: {
  checked: boolean;
  iconSrc?: string | null;
  avatar?: { color: string; letter: string } | null;
  label: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitemcheckbox"
      aria-checked={checked}
      onClick={onToggle}
      className="flex h-[32px] w-full items-center rounded-[2px] px-[6px] hover:bg-[color:var(--_hover)] transition-colors"
      style={{ ["--_hover" as string]: tokens.grey20 }}
    >
      <span className="flex items-center gap-[8px]">
        {checked ? (
          <span
            className="flex h-[14px] w-[14px] shrink-0 items-center justify-center rounded-[2px]"
            style={{ backgroundColor: tokens.blue }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={asset("icon-checkbox-check.svg")} alt="" className="h-[12px] w-[12px] max-w-none" />
          </span>
        ) : (
          <span
            className="h-[14px] w-[14px] shrink-0 rounded-[2px] border border-solid"
            style={{ borderColor: tokens.grey50 }}
          />
        )}
        {iconSrc && <SourceIcon src={iconSrc} />}
        {avatar && <AuthorAvatar color={avatar.color} letter={avatar.letter} />}
        <span
          className="text-[13px] font-normal whitespace-nowrap"
          style={{ color: tokens.black, letterSpacing: "-0.13px" }}
        >
          {label}
        </span>
      </span>
    </button>
  );
}

function SourcesPanel({
  filters,
  onChange,
}: {
  filters: FilterState;
  onChange: (next: FilterState) => void;
}) {
  function toggle(s: MeetingSource) {
    const has = filters.sources.includes(s);
    const next = has ? filters.sources.filter((x) => x !== s) : [...filters.sources, s];
    onChange({ ...filters, sources: next });
  }
  return (
    <div
      className="flex w-[200px] flex-col items-start rounded-[4px] bg-white p-[4px]"
      style={{ boxShadow: "0 0 4px 0 rgba(0,0,0,0.15)" }}
      role="menu"
    >
      {SOURCES_ORDER.map((s) => {
        const meta = SOURCE_META[s];
        return (
          <CheckboxRow
            key={s}
            checked={filters.sources.includes(s)}
            iconSrc={meta.icon}
            label={meta.label}
            onToggle={() => toggle(s)}
          />
        );
      })}
    </div>
  );
}

function AuthorsPanel({
  filters,
  onChange,
}: {
  filters: FilterState;
  onChange: (next: FilterState) => void;
}) {
  function toggle(a: Author) {
    const has = filters.authorIds.includes(a.id);
    const next = has ? filters.authorIds.filter((x) => x !== a.id) : [...filters.authorIds, a.id];
    onChange({ ...filters, authorIds: next });
  }
  return (
    <div
      className="flex w-[240px] flex-col items-start rounded-[4px] bg-white p-[4px]"
      style={{ boxShadow: "0 0 4px 0 rgba(0,0,0,0.15)" }}
      role="menu"
    >
      {AUTHORS.map((a) => (
        <CheckboxRow
          key={a.id}
          checked={filters.authorIds.includes(a.id)}
          avatar={{ color: a.avatarColor, letter: a.name.charAt(0) }}
          label={a.email}
          onToggle={() => toggle(a)}
        />
      ))}
    </div>
  );
}

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
          className="flex h-[20px] w-[20px] shrink-0 items-center justify-center"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset("icon-cal-prev.svg")} alt="" className="h-[20px] w-[20px] max-w-none" />
        </button>
        <span
          className="text-[14px] font-medium text-center"
          style={{ color: tokens.black, letterSpacing: "-0.28px", lineHeight: 1.35 }}
        >
          {monthYearLabel(view.y, view.m)}
        </span>
        <button
          type="button"
          onClick={goNext}
          disabled={nextDisabled}
          aria-label="Следующий месяц"
          className="flex h-[20px] w-[20px] shrink-0 items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset("icon-cal-next.svg")} alt="" className="h-[20px] w-[20px] max-w-none" />
        </button>
      </div>
      <div
        className="grid w-full grid-cols-7 text-center"
        style={{ columnGap: "12px", rowGap: "13px" }}
      >
        {weekdays.map((w) => (
          <span
            key={w}
            className="text-[12px] font-normal"
            style={{ color: tokens.grey, letterSpacing: "-0.24px" }}
          >
            {w}
          </span>
        ))}
        {cells.map((c, i) => {
          const selected = isSelected(c);
          const inRange = isInRange(c);
          const disabled = isAfterMax(c);
          const inBand = selected || inRange;
          const col = i % 7;
          const prevInBand =
            inBand && col > 0 && (isSelected(cells[i - 1]) || isInRange(cells[i - 1]));
          const nextInBand =
            inBand && col < 6 && (isSelected(cells[i + 1]) || isInRange(cells[i + 1]));
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
                  className="absolute pointer-events-none"
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
                  className="absolute pointer-events-none"
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

function DatePanel({
  filters,
  onChange,
  onClose,
}: {
  filters: FilterState;
  onChange: (next: FilterState) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<CalendarValue>({
    from: filters.dateFrom,
    to: filters.dateTo,
  });

  function handleCalendarChange(next: CalendarValue) {
    if (next.from === null && next.to === null && (filters.dateFrom !== null || filters.dateTo !== null)) {
      setDraft(next);
      onChange({ ...filters, dateFrom: null, dateTo: null });
      onClose();
      return;
    }
    setDraft(next);
  }

  const draftDifferent =
    draft.from !== filters.dateFrom || draft.to !== filters.dateTo;
  const canApply = draft.from !== null && draftDifferent;

  function apply() {
    onChange({
      ...filters,
      dateFrom: draft.from,
      dateTo: draft.to ?? draft.from,
    });
    onClose();
  }

  const previewText = formatDateRange(draft.from, draft.to);

  return (
    <div
      className="flex flex-col gap-[16px] rounded-[4px] bg-white p-[16px]"
      style={{ width: "278px", boxShadow: "0px 0px 4px 0px rgba(0,0,0,0.15)" }}
    >
      <Calendar value={draft} onChange={handleCalendarChange} maxISO={todayISOPinned()} />
      {canApply && (
        <div className="flex w-full flex-col gap-[10px]">
          <button
            type="button"
            onClick={apply}
            className="flex h-[36px] w-[246px] items-center justify-center rounded-[4px] p-[10px]"
            style={{ backgroundColor: tokens.blue }}
          >
            <span
              className="text-[13px] font-medium text-white"
              style={{ letterSpacing: "-0.13px" }}
            >
              Применить
            </span>
          </button>
          {previewText && (
            <span
              className="text-[12px] font-normal text-center w-full"
              style={{ color: tokens.grey, letterSpacing: "-0.24px" }}
            >
              {previewText}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function FilterPopover({
  containerRef,
  filters,
  activeTab,
  anchor,
  onPickTab,
  onLeaveTabs,
  onChange,
  onClear,
  onClose,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
  filters: FilterState;
  activeTab: FilterTab | null;
  anchor: "left" | "right";
  onPickTab: (tab: FilterTab) => void;
  onLeaveTabs: () => void;
  onChange: (next: FilterState) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const positionClass = anchor === "left" ? "left-0" : "right-0";
  const submenuOffset: Record<FilterTab, number> = { sources: 0, authors: 32, date: 64 };
  const submenuTop = activeTab !== null ? submenuOffset[activeTab] : 0;
  const submenuPos =
    anchor === "left"
      ? { left: 204 }
      : { right: 204 };
  return (
    <div
      ref={containerRef}
      className={`absolute ${positionClass} top-[calc(100%+8px)] z-20`}
    >
      <MainPanel filters={filters} activeTab={activeTab} onPick={onPickTab} onLeaveTabs={onLeaveTabs} onClear={onClear} />
      {activeTab !== null && (
        <div className="absolute" style={{ top: submenuTop, ...submenuPos }}>
          {activeTab === "sources" && <SourcesPanel filters={filters} onChange={onChange} />}
          {activeTab === "authors" && <AuthorsPanel filters={filters} onChange={onChange} />}
          {activeTab === "date" && <DatePanel filters={filters} onChange={onChange} onClose={onClose} />}
        </div>
      )}
    </div>
  );
}

export default function SearchFiltersPage() {
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [activeFilterTab, setActiveFilterTab] = useState<FilterTab | null>(null);
  const [isFiltering, setIsFiltering] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const filterTriggerRef = useRef<HTMLButtonElement>(null);
  const filterPanelRef = useRef<HTMLDivElement>(null);

  const filtersHaveActive = hasActiveFilters(filters);

  function applyFilterChange(next: FilterState) {
    setFilters(next);
    setIsFiltering(true);
  }

  useEffect(() => {
    if (!isFiltering) return;
    const t = setTimeout(() => setIsFiltering(false), 350);
    return () => clearTimeout(t);
  }, [isFiltering, filters]);

  useEffect(() => {
    if (!filterPanelOpen) return;
    function handler(e: MouseEvent) {
      const t = e.target as Node;
      if (filterPanelRef.current?.contains(t)) return;
      if (filterTriggerRef.current?.contains(t)) return;
      setFilterPanelOpen(false);
      setActiveFilterTab(null);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (activeFilterTab !== null) setActiveFilterTab(null);
        else setFilterPanelOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", onKey);
    };
  }, [filterPanelOpen, activeFilterTab]);

  // Debounced fake "loading" on query change — show shimmer skeletons briefly
  useEffect(() => {
    if (filters.query.trim() === "") {
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    const t = setTimeout(() => setIsSearching(false), 700);
    return () => clearTimeout(t);
  }, [filters.query]);

  const openSearch = () => {
    setSearchOpen(true);
    requestAnimationFrame(() => searchInputRef.current?.focus());
  };
  const closeSearch = () => {
    setSearchOpen(false);
    setFilters((f) => ({ ...f, query: "" }));
  };

  const groups = useMemo(
    () => groupByDate(filterMeetings(MEETINGS, filters)),
    [filters]
  );

  const showEmptyState = searchOpen && filters.query.trim() === "";

  return (
    <main className={`${inter.className} flex h-screen w-full overflow-hidden bg-white`} style={{ color: tokens.black }}>
      <div className="relative flex h-full flex-1 items-stretch bg-white">
        {/* Sidebar — sticky, fills viewport height */}
        <aside
          className="sticky top-0 flex h-screen w-[280px] shrink-0 flex-col justify-between border-r border-solid pt-[16px] pb-[4px]"
          style={{ borderColor: tokens.grey40 }}
        >
          <div className="flex w-[280px] flex-col gap-[12px]">
            <div className="flex w-full flex-col gap-[24px] px-[12px]">
              <div className="flex items-center">
                <div className="flex w-[128.941px] items-center justify-center gap-[9.412px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={asset("logo-icon.svg")} alt="" className="h-[30.118px] w-[30.118px]" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={asset("mymeet-text.svg")} alt="mymeet.ai" className="h-[18.353px] w-[87.53px]" />
                </div>
              </div>
              <div className="flex w-full flex-col gap-[16px]">
                <div
                  className="flex h-[36px] w-full items-center justify-between rounded-[4px] px-[12px] py-[10px]"
                  style={{ backgroundColor: tokens.blue }}
                >
                  <span
                    className="text-[13px] font-medium text-white"
                    style={{ letterSpacing: "-0.13px" }}
                  >
                    Добавить встречу
                  </span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={asset("icon-add.svg")} alt="" className="h-[16px] w-[16px]" />
                </div>
                <div className="flex w-[256px] flex-col items-start gap-[2px]">
                  <SidebarMenuItem icon="icon-meetings.svg" label="Встречи" active />
                  <SidebarMenuItem icon="icon-ai.svg" label="AI Отчеты" />
                  <SidebarMenuItem icon="icon-integrations.svg" label="Интеграции" />
                  <SidebarMenuItem icon="icon-settings.svg" label="Настройки" />
                </div>
              </div>
            </div>
            <div className="h-px w-full" style={{ backgroundColor: tokens.grey40 }} />
            <div className="flex w-full flex-col items-start gap-[2px] px-[12px]">
              <SidebarMenuItem icon="icon-support.svg" label="Поддержка" />
              <SidebarMenuItem icon="icon-kb.svg" label="База знаний" />
              <SidebarMenuItem icon="icon-free.svg" label="Бесплатные минуты" />
              <SidebarMenuItem icon="icon-telegram.svg" label="Телеграм-бот" />
              <SidebarMenuItem icon="icon-power.svg" label="Выйти" />
            </div>
          </div>
          <div className="flex w-[280px] flex-col items-start rounded-[4px]">
            <div className="h-px w-full" style={{ backgroundColor: tokens.grey40 }} />
            <div className="flex w-full flex-col items-start rounded-t-[4px] pl-[8px] pr-[4px] py-[4px]">
              <div className="flex w-full items-center justify-between rounded-[4px] pl-[4px] pr-[8px] py-[4px]">
                <div className="flex items-center gap-[8px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={asset("user-avatar.png")} alt="" className="h-[32px] w-[32px] rounded-[3px] object-cover" />
                  <div className="flex flex-col items-start">
                    <p className="text-[13px] font-medium" style={{ color: tokens.black, letterSpacing: "-0.13px" }}>
                      Mymeet.ai
                    </p>
                    <p className="text-[12px]" style={{ color: tokens.grey, letterSpacing: "-0.24px" }}>
                      Владелец
                    </p>
                  </div>
                </div>
                <span className="text-[12px]" style={{ color: tokens.grey50 }}>
                  ⋯
                </span>
              </div>
            </div>
            <div className="h-px w-full" style={{ backgroundColor: tokens.grey40 }} />
            <div className="flex w-full flex-col items-start rounded-b-[4px] px-[8px] py-[4px]">
              <div className="flex w-full flex-col gap-[8px] p-[4px]">
                <div className="flex w-full items-end justify-between">
                  <span className="text-[13px] font-medium" style={{ color: tokens.black, letterSpacing: "-0.13px" }}>
                    Pro plan
                  </span>
                  <span className="text-[12px] font-medium" style={{ color: tokens.black, letterSpacing: "-0.24px" }}>
                    Доступно 1850 из 2500
                  </span>
                </div>
                <div className="relative h-[6px] w-full overflow-hidden rounded-[4px]" style={{ backgroundColor: tokens.blueSea }}>
                  <div className="h-full rounded-[4px]" style={{ width: "73.57%", backgroundColor: tokens.blue }} />
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <section className="flex h-full min-w-0 min-h-0 flex-1 flex-col items-start justify-start">
          <div
            className="flex h-[54px] w-full items-center border-b border-solid bg-white p-[16px]"
            style={{ borderColor: tokens.grey40 }}
          >
            <h1 className="relative grid text-[13px] font-medium" style={{ color: tokens.black, letterSpacing: "-0.13px" }}>
              <span
                className="col-start-1 row-start-1 whitespace-nowrap"
                style={{
                  opacity: searchOpen ? 0 : 1,
                  transition: "opacity 280ms cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              >
                Встречи
              </span>
              <span
                className="col-start-1 row-start-1 whitespace-nowrap"
                style={{
                  opacity: searchOpen ? 1 : 0,
                  transition: "opacity 280ms cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              >
                Поиск
              </span>
            </h1>
          </div>

          <div className="flex w-full items-center bg-white px-[16px] py-[16px]">
            <div className="flex w-full items-center gap-[12px]">
              <div
                className="flex min-w-0 flex-1 items-center gap-[8px]"
                style={{
                  maxWidth: searchOpen ? "100%" : "80px",
                  transition: "max-width 500ms cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              >
                <div
                  style={{
                    flex: "1 1 auto",
                    minWidth: 0,
                    borderColor: tokens.grey40,
                  }}
                  onClick={searchOpen ? undefined : openSearch}
                  role={searchOpen ? undefined : "button"}
                  tabIndex={searchOpen ? undefined : 0}
                  onKeyDown={
                    searchOpen
                      ? undefined
                      : (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            openSearch();
                          }
                        }
                  }
                  className={`flex h-[36px] min-w-0 items-center gap-[10px] overflow-hidden rounded-[4px] border border-solid bg-white px-[10px] transition-colors ${
                    searchOpen ? "" : "cursor-pointer hover:bg-[#F7F7F8]"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={asset("icon-search.svg")}
                    alt=""
                    className="h-[16px] w-[16px] max-w-none shrink-0"
                  />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={filters.query}
                    onChange={(e) =>
                      setFilters((f) => ({ ...f, query: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Escape") closeSearch();
                    }}
                    placeholder="Поиск по названию или содержанию встречи"
                    tabIndex={searchOpen ? 0 : -1}
                    aria-hidden={!searchOpen}
                    className={`min-w-0 bg-transparent text-[13px] outline-none placeholder:text-[color:var(--_p)] ${
                      searchOpen ? "flex-1" : "w-0 flex-none"
                    }`}
                    style={
                      {
                        color: tokens.black,
                        letterSpacing: "-0.13px",
                        opacity: searchOpen ? 1 : 0,
                        pointerEvents: searchOpen ? "auto" : "none",
                        transition: searchOpen
                          ? "opacity 240ms cubic-bezier(0.22, 1, 0.36, 1) 220ms"
                          : "opacity 120ms linear",
                        ["--_p" as string]: tokens.grey60,
                      } as React.CSSProperties
                    }
                  />
                  <button
                    type="button"
                    onClick={closeSearch}
                    tabIndex={searchOpen ? 0 : -1}
                    aria-hidden={!searchOpen}
                    className={`flex h-[16px] shrink-0 items-center justify-center ${
                      searchOpen ? "w-[16px]" : "w-0"
                    }`}
                    style={{
                      opacity: searchOpen ? 1 : 0,
                      pointerEvents: searchOpen ? "auto" : "none",
                      transition: searchOpen
                        ? "opacity 240ms cubic-bezier(0.22, 1, 0.36, 1) 220ms"
                        : "opacity 120ms linear",
                    }}
                    aria-label="Закрыть поиск"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={asset("icon-close.svg")} alt="" className="h-[16px] w-[16px] max-w-none" />
                  </button>
                </div>
                <div className="relative shrink-0">
                  <button
                    ref={filterTriggerRef}
                    type="button"
                    onClick={() => {
                      if (filterPanelOpen) setActiveFilterTab(null);
                      setFilterPanelOpen((v) => !v);
                    }}
                    className={`flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-[4px] border border-solid transition-colors hover:bg-[#F7F7F8] ${filterPanelOpen ? "bg-[#F7F7F8]" : "bg-white"}`}
                    style={{ borderColor: tokens.grey40 }}
                    aria-label="Фильтры"
                    aria-expanded={filterPanelOpen}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={asset(filtersHaveActive ? "icon-filter-active.svg" : "icon-filter.svg")}
                      alt=""
                      className="h-[16px] w-[16px] max-w-none shrink-0"
                    />
                  </button>
                  {filterPanelOpen && (
                    <FilterPopover
                      containerRef={filterPanelRef}
                      filters={filters}
                      activeTab={activeFilterTab}
                      anchor={searchOpen ? "right" : "left"}
                      onPickTab={(t) => setActiveFilterTab(t)}
                      onLeaveTabs={() => setActiveFilterTab(null)}
                      onChange={applyFilterChange}
                      onClear={() => {
                        applyFilterChange({ ...filters, sources: [], authorIds: [], dateFrom: null, dateTo: null });
                        setActiveFilterTab(null);
                      }}
                      onClose={() => {
                        setFilterPanelOpen(false);
                        setActiveFilterTab(null);
                      }}
                    />
                  )}
                </div>
              </div>
              <div
                aria-hidden={searchOpen || filtersHaveActive}
                className="flex items-center gap-[12px] overflow-hidden whitespace-nowrap"
                style={{
                  maxWidth: searchOpen || filtersHaveActive ? 0 : 340,
                  opacity: searchOpen || filtersHaveActive ? 0 : 1,
                  transform: searchOpen || filtersHaveActive ? "translateX(16px)" : "translateX(0)",
                  pointerEvents: searchOpen || filtersHaveActive ? "none" : "auto",
                  transition: searchOpen || filtersHaveActive
                    ? "max-width 500ms cubic-bezier(0.22, 1, 0.36, 1), opacity 180ms cubic-bezier(0.22, 1, 0.36, 1), transform 500ms cubic-bezier(0.22, 1, 0.36, 1)"
                    : "max-width 500ms cubic-bezier(0.22, 1, 0.36, 1), opacity 320ms cubic-bezier(0.22, 1, 0.36, 1) 160ms, transform 500ms cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              >
                <div className="h-[24px] w-px shrink-0" style={{ backgroundColor: tokens.grey40 }} />
                <div className="flex h-[36px] items-center">
                  <div
                    className="flex h-full flex-col items-center justify-center rounded-[4px] px-[10px] py-[8px]"
                    style={{ backgroundColor: tokens.grey20 }}
                  >
                    <span className="whitespace-nowrap text-[13px]" style={{ color: tokens.black, letterSpacing: "-0.13px" }}>
                      Все встречи
                    </span>
                  </div>
                  <div className="flex h-full flex-col items-center justify-center rounded-[4px] px-[10px] py-[8px]">
                    <span className="whitespace-nowrap text-[13px]" style={{ color: tokens.grey, letterSpacing: "-0.13px" }}>
                      Мои встречи
                    </span>
                  </div>
                  <div className="flex h-full flex-col items-center justify-center px-[10px] py-[8px]">
                    <span className="whitespace-nowrap text-[13px]" style={{ color: tokens.grey, letterSpacing: "-0.13px" }}>
                      Доступные мне
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex w-full min-h-0 flex-1 flex-col items-start overflow-y-auto">
            {showEmptyState ? (
              <div className="flex w-full flex-1 items-center justify-center py-[120px]">
                <div className="flex flex-col items-center gap-[16px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={asset("empty-monkey.gif")} alt="" className="h-[124px] w-[124px] rounded-[4px] object-cover" />
                  <div className="flex flex-col items-center gap-[12px] text-center">
                    <p className="text-[24px] font-medium" style={{ color: tokens.black, letterSpacing: "-0.48px" }}>
                      Поиск по встречам
                    </p>
                    <p className="w-[288px] text-[14px]" style={{ color: tokens.black, letterSpacing: "-0.28px", lineHeight: 1.35 }}>
                      Введите ключевые слова — найдем все совпадения в этом рабочем пространстве
                    </p>
                  </div>
                </div>
              </div>
            ) : isSearching || isFiltering ? (
              <div className="flex w-full flex-col items-start">
                <SkeletonGroup titleWidths={[280, 280, 185]} />
                <SkeletonGroup titleWidths={[280, 280, 185]} />
                <SkeletonGroup titleWidths={[280, 280, 185]} />
              </div>
            ) : (
              groups.length === 0 ? (
                <div className="flex w-full flex-1 items-center justify-center py-[120px]">
                  <div className="flex flex-col items-center gap-[16px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={asset("no-results-monkey.gif")} alt="" className="h-[124px] w-[124px] rounded-[4px] object-cover" />
                    <div className="flex flex-col items-center gap-[12px] text-center">
                      <p className="text-[24px] font-medium" style={{ color: tokens.black, letterSpacing: "-0.48px" }}>
                        Не удалось ничего найти
                      </p>
                      <p className="w-[288px] text-[14px]" style={{ color: tokens.black, letterSpacing: "-0.28px", lineHeight: 1.35 }}>
                        {filtersHaveActive
                          ? "По выбранным фильтрам встречи не найдены, измените или очистите фильтры"
                          : "Попробуйте другой запрос или смените рабочее пространство"}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex w-full flex-col items-start">
                  {groups.map((g) => (
                    <div key={g.key} className="flex w-full flex-col">
                      <DateHeader label={g.label} subLabel={g.subLabel} />
                      {g.meetings.map((m) => (
                        <MeetingRow key={m.id} m={m} />
                      ))}
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
