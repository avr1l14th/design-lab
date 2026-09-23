"use client";

import { useState, type ReactNode } from "react";
import {
  AUTHORS,
  SOURCE_META,
  type Author,
  type MeetingSource,
} from "../../search-filters/mock-data";
import {
  formatDateRange,
  monthYearLabel,
  type FilterState as BaseFilterState,
} from "../../search-filters/use-filtered-meetings";
import { TODAY, type Tag, type TagMeeting } from "./data";
import { sfAsset, tokens } from "./tokens";
import { Checkbox, ColorDot, TgIc } from "./ui";

// ─────────────────────────────────────────────────────────────────────────────
// Фильтры встреч — из прототипа «Поиск и фильтры» (через глобальный чат) плюс
// четвертый пункт «Теги»: чекбоксы по тегам, использованным в этом пространстве,
// Внутри пункта — OR, между пунктами — AND, как у остальных.
// ─────────────────────────────────────────────────────────────────────────────

export type FilterTab = "sources" | "authors" | "date" | "tags";

export type FilterState = BaseFilterState & {
  tagIds: string[];
  /** Показать встречи без единого тега */
};

export const EMPTY_FILTERS: FilterState = {
  query: "",
  sources: [],
  authorIds: [],
  dateFrom: null,
  dateTo: null,
  tagIds: [],
};

export function hasActiveFilters(f: FilterState): boolean {
  return (
    f.sources.length > 0 ||
    f.authorIds.length > 0 ||
    f.dateFrom !== null ||
    f.dateTo !== null ||
    f.tagIds.length > 0
  );
}

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

/** Фильтр встреч: поиск по названию встречи и именам ее тегов, источники, авторы, дата и теги (AND между типами) */
export function filterMeetings(
  all: TagMeeting[],
  f: FilterState,
  tagsOf: (meetingId: string) => Tag[],
): TagMeeting[] {
  const q = f.query.trim().toLowerCase();
  return all.filter((m) => {
    const tags = tagsOf(m.id);
    if (
      q &&
      !m.title.toLowerCase().includes(q) &&
      !tags.some((t) => t.name.toLowerCase().includes(q))
    )
      return false;
    if (f.sources.length > 0 && !f.sources.includes(m.source)) return false;
    if (f.authorIds.length > 0 && !f.authorIds.includes(m.authorId))
      return false;
    if (f.dateFrom && m.date < f.dateFrom) return false;
    if (f.dateTo && m.date > f.dateTo) return false;
    if (f.tagIds.length > 0) {
      const ids = tags.map((t) => t.id);
      if (!f.tagIds.some((id) => ids.includes(id))) return false;
    }
    return true;
  });
}

function SourceIcon({ src }: { src: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={sfAsset(src)}
      alt=""
      className="h-[14px] w-[14px] max-w-none shrink-0 object-contain"
    />
  );
}

function AuthorAvatar({ color, letter }: { color: string; letter: string }) {
  return (
    <span
      className="flex h-[16px] w-[16px] shrink-0 items-center justify-center rounded-full text-[9px] font-medium text-white"
      style={{ backgroundColor: color, letterSpacing: "-0.18px" }}
    >
      {letter}
    </span>
  );
}

function MainPanelRow({
  icon,
  label,
  active,
  hasDot,
  onPick,
}: {
  icon: string | ReactNode;
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
      className="flex h-[32px] w-full items-center justify-between rounded-[2px] px-[6px] transition-colors hover:bg-[#F7F7F8]"
      style={{ backgroundColor: active ? tokens.bgSubtle : "transparent" }}
    >
      <span className="flex items-center gap-[6px]">
        {typeof icon === "string" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={sfAsset(icon)}
            alt=""
            className="h-[16px] w-[16px] max-w-none shrink-0"
          />
        ) : (
          <span
            className="flex h-[16px] w-[16px] shrink-0 items-center justify-center"
            style={{ color: tokens.grey }}
          >
            {icon}
          </span>
        )}
        <span
          className="whitespace-nowrap text-[13px] font-normal"
          style={{ color: tokens.black, letterSpacing: "-0.13px" }}
        >
          {label}
        </span>
      </span>
      {hasDot ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={sfAsset("icon-active-row.svg")}
          alt=""
          className="h-[16px] w-[24px] max-w-none shrink-0"
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={sfAsset("icon-chevron-right.svg")}
          alt=""
          className="h-[16px] w-[16px] max-w-none shrink-0"
        />
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
  const canClear = hasActiveFilters(filters);
  return (
    <div
      className="flex w-[200px] flex-col items-start rounded-[4px] bg-white p-[4px]"
      style={{ boxShadow: "0 0 4px 0 rgba(0,0,0,0.15)" }}
      role="menu"
    >
      <MainPanelRow
        icon={<TgIc name="tag" />}
        label="Теги"
        active={activeTab === "tags"}
        hasDot={filters.tagIds.length > 0}
        onPick={() => onPick("tags")}
      />
      <MainPanelRow
        icon="icon-menu-sources.svg"
        label="Источники"
        active={activeTab === "sources"}
        hasDot={filters.sources.length > 0}
        onPick={() => onPick("sources")}
      />
      <MainPanelRow
        icon="icon-menu-authors.svg"
        label="Авторы"
        active={activeTab === "authors"}
        hasDot={filters.authorIds.length > 0}
        onPick={() => onPick("authors")}
      />
      <MainPanelRow
        icon="icon-menu-date.svg"
        label="Дата"
        active={activeTab === "date"}
        hasDot={filters.dateFrom !== null || filters.dateTo !== null}
        onPick={() => onPick("date")}
      />
      <div
        className="h-px w-full"
        onMouseEnter={onLeaveTabs}
        style={{ backgroundColor: tokens.border }}
      />
      <button
        type="button"
        role="menuitem"
        disabled={!canClear}
        onMouseEnter={onLeaveTabs}
        onClick={onClear}
        className="flex h-[32px] w-full items-center rounded-[2px] px-[6px] transition-colors hover:bg-[#F7F7F8] disabled:cursor-not-allowed disabled:hover:bg-transparent"
      >
        <span
          className="whitespace-nowrap text-[13px] font-normal"
          style={{
            color: canClear ? tokens.black : tokens.greyDisabled,
            letterSpacing: "-0.13px",
          }}
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
      className="flex h-[32px] w-full items-center rounded-[2px] px-[6px] transition-colors hover:bg-[#F7F7F8]"
    >
      <span className="flex items-center gap-[8px]">
        {checked ? (
          <span
            className="flex h-[14px] w-[14px] shrink-0 items-center justify-center rounded-[2px]"
            style={{ backgroundColor: tokens.blue }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={sfAsset("icon-checkbox-check.svg")}
              alt=""
              className="h-[12px] w-[12px] max-w-none"
            />
          </span>
        ) : (
          <span
            className="h-[14px] w-[14px] shrink-0 rounded-[2px] border border-solid"
            style={{ borderColor: tokens.borderStrong }}
          />
        )}
        {iconSrc && <SourceIcon src={iconSrc} />}
        {avatar && <AuthorAvatar color={avatar.color} letter={avatar.letter} />}
        <span
          className="whitespace-nowrap text-[13px] font-normal"
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
  const toggle = (s: MeetingSource) => {
    const has = filters.sources.includes(s);
    onChange({
      ...filters,
      sources: has
        ? filters.sources.filter((x) => x !== s)
        : [...filters.sources, s],
    });
  };
  return (
    <div
      className="flex w-[200px] flex-col items-start rounded-[4px] bg-white p-[4px]"
      style={{ boxShadow: "0 0 4px 0 rgba(0,0,0,0.15)" }}
      role="menu"
    >
      {SOURCES_ORDER.map((s) => (
        <CheckboxRow
          key={s}
          checked={filters.sources.includes(s)}
          iconSrc={SOURCE_META[s].icon}
          label={SOURCE_META[s].label}
          onToggle={() => toggle(s)}
        />
      ))}
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
  const toggle = (a: Author) => {
    const has = filters.authorIds.includes(a.id);
    onChange({
      ...filters,
      authorIds: has
        ? filters.authorIds.filter((x) => x !== a.id)
        : [...filters.authorIds, a.id],
    });
  };
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

/** Подпанель «Теги»: теги текущего пространства */
function TagsPanel({
  filters,
  tags,
  onChange,
}: {
  filters: FilterState;
  tags: Tag[];
  onChange: (next: FilterState) => void;
}) {
  const toggle = (id: string) => {
    const has = filters.tagIds.includes(id);
    onChange({
      ...filters,
      tagIds: has
        ? filters.tagIds.filter((x) => x !== id)
        : [...filters.tagIds, id],
    });
  };
  return (
    <div
      className="flex w-[220px] flex-col items-start rounded-[4px] bg-white"
      style={{ boxShadow: "0 0 4px 0 rgba(0,0,0,0.15)" }}
      role="menu"
    >
      {tags.length === 0 ? (
        <p
          className="px-[10px] py-[12px] text-[12px] leading-[16px] tracking-[-0.24px]"
          style={{ color: tokens.grey }}
        >
          В этом пространстве тегов пока нет. Откройте встречу и добавьте первый
        </p>
      ) : (
        <div className="tg-scroll max-h-[264px] w-full overflow-y-auto p-[4px]">
          {tags.map((t) => (
            <button
              key={t.id}
              type="button"
              role="menuitemcheckbox"
              aria-checked={filters.tagIds.includes(t.id)}
              onClick={() => toggle(t.id)}
              className="flex h-[32px] w-full items-center gap-[8px] rounded-[3px] px-[8px] transition-colors hover:bg-[#F7F7F8]"
            >
              <span className="flex min-w-0 items-center gap-[8px]">
                <Checkbox checked={filters.tagIds.includes(t.id)} />
                <span className="flex h-[14px] w-[14px] shrink-0 items-center justify-center">
                  <ColorDot color={t.color} size={8} />
                </span>
                <span
                  className="truncate text-[13px] font-normal"
                  style={{ color: tokens.black, letterSpacing: "-0.13px" }}
                >
                  {t.name}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const isoFromYMD = (y: number, m: number, d: number) =>
  `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

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
    ? {
        y: Number(value.from.slice(0, 4)),
        m: Number(value.from.slice(5, 7)) - 1,
      }
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
    cells.push({
      y: view.m === 0 ? view.y - 1 : view.y,
      m: view.m === 0 ? 11 : view.m - 1,
      d,
      current: false,
    });
  }
  for (let d = 1; d <= daysInMonth; d++)
    cells.push({ y: view.y, m: view.m, d, current: true });
  while (cells.length % 7 !== 0 || cells.length < 42) {
    const last = cells[cells.length - 1];
    const next = new Date(last.y, last.m, last.d + 1);
    cells.push({
      y: next.getFullYear(),
      m: next.getMonth(),
      d: next.getDate(),
      current: false,
    });
    if (cells.length >= 42) break;
  }

  const isAfterMax = (c: Cell) =>
    c.y !== maxYear
      ? c.y > maxYear
      : c.m !== maxMonth
        ? c.m > maxMonth
        : c.d > maxDay;
  const isoOf = (c: Cell) => isoFromYMD(c.y, c.m, c.d);
  const isSelected = (c: Cell) =>
    isoOf(c) === value.from || isoOf(c) === value.to;
  const isInRange = (c: Cell) =>
    !!value.from &&
    !!value.to &&
    value.from !== value.to &&
    isoOf(c) > value.from &&
    isoOf(c) < value.to;

  const onDayClick = (c: Cell) => {
    if (isAfterMax(c)) return;
    const iso = isoOf(c);
    const isSingleSelected =
      value.from && (value.to === null || value.to === value.from);
    if (isSingleSelected && value.from === iso)
      return onChange({ from: null, to: null });
    if (value.from && value.to && value.from !== value.to)
      return onChange({ from: iso, to: null });
    if (!value.from) return onChange({ from: iso, to: null });
    if (iso < value.from) onChange({ from: iso, to: value.from });
    else onChange({ from: value.from, to: iso });
  };

  const nextDisabled = view.y === maxYear && view.m === maxMonth;
  const weekdays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

  return (
    <div className="flex w-[246px] flex-col gap-[16px]">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() =>
            setView((v) =>
              v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 },
            )
          }
          aria-label="Предыдущий месяц"
          className="flex h-[20px] w-[20px] shrink-0 items-center justify-center"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={sfAsset("icon-cal-prev.svg")}
            alt=""
            className="h-[20px] w-[20px] max-w-none"
          />
        </button>
        <span
          className="text-center text-[14px] font-medium"
          style={{
            color: tokens.black,
            letterSpacing: "-0.28px",
            lineHeight: 1.35,
          }}
        >
          {monthYearLabel(view.y, view.m)}
        </span>
        <button
          type="button"
          onClick={() =>
            !nextDisabled &&
            setView((v) =>
              v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 },
            )
          }
          disabled={nextDisabled}
          aria-label="Следующий месяц"
          className="flex h-[20px] w-[20px] shrink-0 items-center justify-center disabled:cursor-not-allowed disabled:opacity-30"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={sfAsset("icon-cal-next.svg")}
            alt=""
            className="h-[20px] w-[20px] max-w-none"
          />
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
            inBand &&
            col > 0 &&
            (isSelected(cells[i - 1]) || isInRange(cells[i - 1]));
          const nextInBand =
            inBand &&
            col < 6 &&
            (isSelected(cells[i + 1]) || isInRange(cells[i + 1]));
          return (
            <button
              key={i}
              type="button"
              onClick={() => onDayClick(c)}
              disabled={disabled}
              className="relative flex items-center justify-center text-[13px] leading-none"
              style={{
                color: selected
                  ? "#FFFFFF"
                  : !c.current || disabled
                    ? tokens.grey
                    : tokens.black,
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
  const handleCalendarChange = (next: CalendarValue) => {
    if (
      next.from === null &&
      next.to === null &&
      (filters.dateFrom !== null || filters.dateTo !== null)
    ) {
      setDraft(next);
      onChange({ ...filters, dateFrom: null, dateTo: null });
      onClose();
      return;
    }
    setDraft(next);
  };
  const canApply =
    draft.from !== null &&
    (draft.from !== filters.dateFrom || draft.to !== filters.dateTo);
  const previewText = formatDateRange(draft.from, draft.to);
  return (
    <div
      className="flex flex-col gap-[16px] rounded-[4px] bg-white p-[16px]"
      style={{ width: "278px", boxShadow: "0px 0px 4px 0px rgba(0,0,0,0.15)" }}
    >
      <Calendar value={draft} onChange={handleCalendarChange} maxISO={TODAY} />
      {canApply && (
        <div className="flex w-full flex-col gap-[10px]">
          <button
            type="button"
            onClick={() => {
              onChange({
                ...filters,
                dateFrom: draft.from,
                dateTo: draft.to ?? draft.from,
              });
              onClose();
            }}
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
              className="w-full text-center text-[12px] font-normal"
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

export function FilterPopover({
  containerRef,
  filters,
  activeTab,
  anchor,
  onPickTab,
  onLeaveTabs,
  onChange,
  onClear,
  onClose,
  tags,
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
  /** Теги для подпанели — использованные в текущем пространстве */
  tags: Tag[];
}) {
  const submenuOffset: Record<FilterTab, number> = {
    tags: 0,
    sources: 32,
    authors: 64,
    date: 96,
  };
  const submenuTop = activeTab !== null ? submenuOffset[activeTab] : 0;
  const submenuPos = anchor === "left" ? { left: 204 } : { right: 204 };
  return (
    <div
      ref={containerRef}
      className={`absolute ${anchor === "left" ? "left-0" : "right-0"} top-[calc(100%+8px)] z-20`}
    >
      <MainPanel
        filters={filters}
        activeTab={activeTab}
        onPick={onPickTab}
        onLeaveTabs={onLeaveTabs}
        onClear={onClear}
      />
      {activeTab !== null && (
        <div className="absolute" style={{ top: submenuTop, ...submenuPos }}>
          {activeTab === "sources" && (
            <SourcesPanel filters={filters} onChange={onChange} />
          )}
          {activeTab === "authors" && (
            <AuthorsPanel filters={filters} onChange={onChange} />
          )}
          {activeTab === "date" && (
            <DatePanel
              filters={filters}
              onChange={onChange}
              onClose={onClose}
            />
          )}
          {activeTab === "tags" && (
            <TagsPanel filters={filters} tags={tags} onChange={onChange} />
          )}
        </div>
      )}
    </div>
  );
}
