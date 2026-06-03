import type { Meeting, MeetingSource } from "./mock-data";

export type FilterState = {
  query: string;
  sources: MeetingSource[];
  authorIds: string[];
  dateFrom: string | null;
  dateTo: string | null;
};

export const EMPTY_FILTERS: FilterState = {
  query: "",
  sources: [],
  authorIds: [],
  dateFrom: null,
  dateTo: null,
};

export function hasActiveFilters(f: FilterState): boolean {
  return f.sources.length > 0 || f.authorIds.length > 0 || f.dateFrom !== null || f.dateTo !== null;
}

const MONTHS_GENITIVE_FULL = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];

export function todayISOPinned(): string {
  return "2026-04-24";
}

function isoToDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function formatDateRange(from: string | null, to: string | null): string {
  if (!from) return "";
  const a = isoToDate(from);
  if (!to || from === to) {
    return `${a.getDate()} ${MONTHS_GENITIVE_FULL[a.getMonth()]}, ${a.getFullYear()}`;
  }
  const b = isoToDate(to);
  if (a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()) {
    return `${a.getDate()}–${b.getDate()} ${MONTHS_GENITIVE_FULL[a.getMonth()]}, ${a.getFullYear()}`;
  }
  if (a.getFullYear() === b.getFullYear()) {
    return `${a.getDate()} ${MONTHS_GENITIVE_FULL[a.getMonth()]} – ${b.getDate()} ${MONTHS_GENITIVE_FULL[b.getMonth()]}, ${a.getFullYear()}`;
  }
  return `${a.getDate()} ${MONTHS_GENITIVE_FULL[a.getMonth()]} ${a.getFullYear()} – ${b.getDate()} ${MONTHS_GENITIVE_FULL[b.getMonth()]} ${b.getFullYear()}`;
}

const MONTHS_NOMINATIVE = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];

export function monthYearLabel(year: number, month: number): string {
  return `${MONTHS_NOMINATIVE[month]} ${year}`;
}

export function filterMeetings(all: Meeting[], f: FilterState): Meeting[] {
  const q = f.query.trim().toLowerCase();
  return all.filter((m) => {
    if (q && !m.title.toLowerCase().includes(q)) return false;
    if (f.sources.length > 0 && !f.sources.includes(m.source)) return false;
    if (f.authorIds.length > 0 && !f.authorIds.includes(m.authorId)) return false;
    if (f.dateFrom && m.date < f.dateFrom) return false;
    if (f.dateTo && m.date > f.dateTo) return false;
    return true;
  });
}

export type MeetingGroup = {
  key: string;
  label: string;
  subLabel: string;
  meetings: Meeting[];
};

const MONTHS_GENITIVE = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];
const WEEKDAYS = [
  "Воскресенье", "Понедельник", "Вторник", "Среда",
  "Четверг", "Пятница", "Суббота",
];

function parseISO(d: string): Date {
  const [y, m, day] = d.split("-").map(Number);
  return new Date(y, m - 1, day);
}

function todayISO(): string {
  // Prototype is pinned to the design date to keep mock data meaningful
  // regardless of when someone opens it later.
  return "2026-04-24";
}

function isoDaysBefore(iso: string, n: number): string {
  const d = parseISO(iso);
  d.setDate(d.getDate() - n);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatLabels(iso: string): { label: string; subLabel: string } {
  const today = todayISO();
  const yesterday = isoDaysBefore(today, 1);
  const d = parseISO(iso);
  const weekday = WEEKDAYS[d.getDay()];
  if (iso === today) return { label: "Сегодня", subLabel: weekday };
  if (iso === yesterday) return { label: "Вчера", subLabel: weekday };
  return { label: `${d.getDate()} ${MONTHS_GENITIVE[d.getMonth()]}`, subLabel: weekday };
}

export function groupByDate(meetings: Meeting[]): MeetingGroup[] {
  const byDate = new Map<string, Meeting[]>();
  for (const m of meetings) {
    const list = byDate.get(m.date) ?? [];
    list.push(m);
    byDate.set(m.date, list);
  }
  const sortedDates = Array.from(byDate.keys()).sort((a, b) => (a < b ? 1 : -1));
  return sortedDates.map((iso) => {
    const { label, subLabel } = formatLabels(iso);
    const meetingsInDay = (byDate.get(iso) ?? []).sort((a, b) =>
      a.startTime < b.startTime ? 1 : -1
    );
    return { key: iso, label, subLabel, meetings: meetingsInDay };
  });
}
