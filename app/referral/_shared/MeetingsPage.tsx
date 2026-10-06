"use client";

import { Inter } from "next/font/google";
import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import { MeetingThumb } from "../../global-chat/_shared/chat-ui";
import { SOURCE_META, getAuthor } from "../../search-filters/mock-data";
import { MEETINGS, ME_ID, dateLabels, type TagMeeting } from "../../tags/_shared/data";
import { EMPTY_FILTERS, FilterPopover, filterMeetings, hasActiveFilters, type FilterState, type FilterTab } from "../../tags/_shared/filters";
import { TagChipRow, ToastHost, useOutsideClose, useToast } from "../../tags/_shared/ui";
import { useTags, type TagsApi } from "../../tags/_shared/use-tags";
import { Sidebar } from "./Sidebar";
import { focusRingClass, pressableClass, sfAsset, tokens } from "./tokens";

const inter = Inter({ subsets: ["latin", "cyrillic"], weight: ["400", "500", "600"] });

// ─────────────────────────────────────────────────────────────────────────────
// Экран «Встречи» для точек входа в рефералку — копия страницы прототипа «Теги» (на макете
// Федора фреймы так и называются TagsMeetingsPage), теги только показываются. Слоты:
//  topBanner  — растяжка над всей страницей (над сайдбаром и контентом);
//  listBanner — баннер в ленте, над первой группой встреч;
//  overlay    — модалка поверх страницы.
// ─────────────────────────────────────────────────────────────────────────────

function groupByDate(meetings: TagMeeting[]) {
  const byDate = new Map<string, TagMeeting[]>();
  for (const m of meetings) byDate.set(m.date, [...(byDate.get(m.date) ?? []), m]);
  return Array.from(byDate.keys())
    .sort((a, b) => (a < b ? 1 : -1))
    .map((iso) => ({ key: iso, ...dateLabels(iso), meetings: (byDate.get(iso) ?? []).sort((a, b) => (a.time < b.time ? 1 : -1)) }));
}

function AuthorAvatar({ color, letter, title }: { color: string; letter: string; title?: string }) {
  return (
    <span className="flex h-[16px] w-[16px] shrink-0 items-center justify-center rounded-full text-[9px] font-medium tracking-[-0.18px] text-white" style={{ backgroundColor: color }} title={title}>
      {letter}
    </span>
  );
}

function MeetingRow({ m, api }: { m: TagMeeting; api: TagsApi }) {
  const author = getAuthor(m.authorId);
  const source = SOURCE_META[m.source];
  return (
    <div className="group relative flex h-[72px] w-full cursor-pointer items-center bg-white px-[24px] hover:bg-[#FAFAFA]">
      <div className="relative flex min-w-0 flex-1 items-center gap-[24px]">
        <span className="flex w-[446px] min-w-0 shrink-0 items-center gap-[12px]">
          <MeetingThumb thumb={m.thumb} width={80} height={48} />
          <span className="flex min-w-0 flex-1 flex-col gap-[4px]">
            <span className="truncate text-[13px] font-medium leading-[normal] tracking-[-0.13px]" style={{ color: tokens.black }}>
              {m.title}
            </span>
            <span className="flex items-center gap-[4px] text-[12px] leading-[normal] tracking-[-0.24px]" style={{ color: tokens.grey }}>
              {m.time}
              <span className="h-[3px] w-[3px] rounded-full" style={{ backgroundColor: tokens.grey }} />
              {m.durationMin} мин
            </span>
          </span>
        </span>
        <span className="flex w-[180px] shrink-0 items-center gap-[8px]">
          <AuthorAvatar color={author.avatarColor} letter={author.name.charAt(0)} title={author.name} />
          <span className="min-w-0 flex-1 truncate text-[12px] leading-[normal] tracking-[-0.24px]" style={{ color: tokens.black }}>
            {author.email}
          </span>
        </span>
        <span className="flex w-[160px] shrink-0 items-center gap-[8px] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={sfAsset(source.icon)} alt="" className="h-[14px] w-[14px] max-w-none shrink-0 object-contain" />
          <span className="truncate text-[12px] leading-[normal] tracking-[-0.24px]" style={{ color: tokens.black }}>
            {source.label}
          </span>
        </span>
        <div className="pointer-events-none flex min-w-0 flex-1 items-center gap-[4px]">
          <TagChipRow tags={api.tagsFor(m.id)} meetingId={m.id} api={api} max={2} readOnly />
        </div>
      </div>
    </div>
  );
}

function DateHeader({ label, subLabel }: { label: string; subLabel: string }) {
  return (
    <div className="flex w-full shrink-0 flex-col gap-[8px] pt-[12px]">
      <div className="flex items-center gap-[6px] px-[24px] text-[13px] leading-[normal] tracking-[-0.13px]">
        <span className="font-medium" style={{ color: tokens.black }}>
          {label}
        </span>
        <span style={{ color: tokens.grey }}>{subLabel}</span>
      </div>
      <div className="h-px w-full shrink-0" style={{ backgroundColor: tokens.border }} />
    </div>
  );
}

const TABS = ["Все встречи", "Мои встречи", "Доступные мне"] as const;

export function MeetingsPage({ topBanner, listBanner, overlay, children }: { topBanner?: ReactNode; listBanner?: ReactNode; overlay?: ReactNode; children?: ReactNode }) {
  const api = useTags();
  const toast = useToast();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Все встречи");
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [searchOpen, setSearchOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab | null>(null);
  const filterBtnRef = useRef<HTMLButtonElement>(null);
  const filterPopRef = useRef<HTMLDivElement>(null);
  const closeFilters = useCallback(() => {
    setFiltersOpen(false);
    setActiveTab(null);
  }, []);
  useOutsideClose([filterBtnRef, filterPopRef], filtersOpen, closeFilters);

  const wsMeetings = useMemo(() => MEETINGS.filter((m) => m.workspaceId === api.workspace.id), [api.workspace.id]);
  const tagsOf = useCallback((id: string) => api.tagsFor(id), [api]);
  const effectiveFilters = useMemo(() => {
    const alive = filters.tagIds.filter((id) => api.tags.some((t) => t.id === id));
    return alive.length === filters.tagIds.length ? filters : { ...filters, tagIds: alive };
  }, [filters, api.tags]);
  const list = useMemo(() => {
    const byTab = wsMeetings.filter((m) => (tab === "Мои встречи" ? m.authorId === ME_ID : tab === "Доступные мне" ? m.authorId !== ME_ID : true));
    return filterMeetings(byTab, effectiveFilters, tagsOf);
  }, [wsMeetings, tab, effectiveFilters, tagsOf]);
  const groups = useMemo(() => groupByDate(list), [list]);
  const active = hasActiveFilters(effectiveFilters);

  return (
    <main className={`${inter.className} flex h-screen min-h-[720px] w-full flex-col overflow-hidden bg-white`} style={{ color: tokens.black }}>
      {topBanner}
      <div className="flex min-h-0 w-full flex-1 bg-white">
        <Sidebar active="meetings" />
        <section className="relative flex h-full min-w-0 flex-1 flex-col bg-white">
          <div className="flex h-[54px] w-full shrink-0 items-center border-b p-[16px]" style={{ borderColor: tokens.border }}>
            <h1 className="text-[13px] font-medium leading-[normal] tracking-[-0.13px]" style={{ color: tokens.black }}>
              Встречи
            </h1>
          </div>

          {/* Панель: фильтр, поиск и табы */}
          <div className="flex w-full shrink-0 items-center gap-[8px] px-[16px] py-[16px]">
            <div className="relative">
              <button
                ref={filterBtnRef}
                type="button"
                aria-label="Фильтры"
                aria-expanded={filtersOpen}
                onClick={() => (filtersOpen ? closeFilters() : setFiltersOpen(true))}
                className={`flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-[4px] border bg-white hover:bg-[#F7F7F8] ${filtersOpen ? "bg-[#F7F7F8]" : ""} ${pressableClass} ${focusRingClass}`}
                style={{ borderColor: tokens.border }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={sfAsset(active ? "icon-filter-active.svg" : "icon-filter.svg")} alt="" className="h-[16px] w-[16px] max-w-none shrink-0" />
              </button>
              {filtersOpen && (
                <FilterPopover
                  containerRef={filterPopRef}
                  filters={effectiveFilters}
                  activeTab={activeTab}
                  anchor="left"
                  onPickTab={setActiveTab}
                  onLeaveTabs={() => setActiveTab(null)}
                  onChange={setFilters}
                  onClear={() => {
                    setFilters({ ...EMPTY_FILTERS, query: filters.query });
                    closeFilters();
                  }}
                  onClose={closeFilters}
                  tags={api.tags}
                />
              )}
            </div>
            {searchOpen ? (
              <label className={`flex h-[36px] w-[320px] items-center gap-[10px] rounded-[4px] border bg-white px-[10px] focus-within:border-[#0138C7] ${pressableClass}`} style={{ borderColor: tokens.border }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={sfAsset("icon-search.svg")} alt="" className="h-[16px] w-[16px] max-w-none shrink-0" />
                <input
                  autoFocus
                  value={filters.query}
                  onChange={(e) => setFilters({ ...filters, query: e.target.value })}
                  onBlur={() => {
                    if (!filters.query.trim()) setSearchOpen(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setFilters({ ...filters, query: "" });
                      setSearchOpen(false);
                    }
                  }}
                  placeholder="Поиск по названию встречи или тегу"
                  aria-label="Поиск по названию встречи или тегу"
                  className="min-w-0 flex-1 bg-transparent text-[13px] leading-[normal] tracking-[-0.13px] outline-none placeholder:text-[#C7C8CA]"
                  style={{ color: tokens.black }}
                />
              </label>
            ) : (
              <button
                type="button"
                aria-label="Поиск по названию встречи или тегу"
                onClick={() => setSearchOpen(true)}
                className={`flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-[4px] border bg-white hover:bg-[#F7F7F8] ${pressableClass} ${focusRingClass}`}
                style={{ borderColor: tokens.border }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={sfAsset("icon-search.svg")} alt="" className="h-[16px] w-[16px] max-w-none shrink-0" />
              </button>
            )}
            <div className="ml-[4px] h-[24px] w-px shrink-0" style={{ backgroundColor: tokens.border }} />
            <div className="flex h-[36px] items-center">
              {TABS.map((t) => {
                const on = t === tab;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    className={`flex h-full items-center rounded-[4px] px-[10px] py-[8px] text-[13px] leading-[normal] tracking-[-0.13px] whitespace-nowrap ${on ? "" : "hover:text-[#585E6C]"} ${pressableClass} ${focusRingClass}`}
                    style={{ color: on ? tokens.black : tokens.grey, backgroundColor: on ? tokens.bgSubtle : undefined }}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="gc-noscroll flex min-h-0 w-full flex-1 flex-col overflow-y-auto pb-[24px]">
            {listBanner}
            {groups.length === 0 ? (
              <div className="flex w-full flex-1 items-center justify-center py-[120px]">
                <div className="flex flex-col items-center gap-[12px] text-center">
                  <p className="text-[24px] font-medium leading-[normal] tracking-[-0.48px]" style={{ color: tokens.black }}>
                    Не удалось ничего найти
                  </p>
                  <p className="w-[288px] text-[14px] leading-[1.35] tracking-[-0.28px]" style={{ color: tokens.black }}>
                    {active ? "По выбранным фильтрам встречи не найдены, измените или очистите фильтры" : "Попробуйте другой запрос или смените рабочее пространство"}
                  </p>
                </div>
              </div>
            ) : (
              groups.map((g) => (
                <div key={g.key} className="flex w-full flex-col">
                  <DateHeader label={g.label} subLabel={g.subLabel} />
                  {g.meetings.map((m) => (
                    <MeetingRow key={m.id} m={m} api={api} />
                  ))}
                </div>
              ))
            )}
          </div>
          <ToastHost toast={toast.toast} visible={toast.visible} onHide={toast.hide} />
        </section>
      </div>
      {overlay}
      {children}
    </main>
  );
}
