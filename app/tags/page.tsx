"use client";

import { Inter } from "next/font/google";
import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";
import { MeetingThumb } from "../global-chat/_shared/chat-ui";
import { SOURCE_META, getAuthor } from "../search-filters/mock-data";
import { MEETINGS, ME_ID, dateLabels, type TagMeeting } from "./_shared/data";
import { EMPTY_FILTERS, FilterPopover, filterMeetings, hasActiveFilters, type FilterState, type FilterTab } from "./_shared/filters";
import { Sidebar } from "./_shared/Sidebar";
import { OPEN_MEETING_KEY, focusRingClass, pressableClass, sfAsset, tokens } from "./_shared/tokens";
import { AddTagChip, TagChipRow, TagPicker, ToastHost, useOutsideClose, useToast } from "./_shared/ui";
import { useTags, type TagsApi } from "./_shared/use-tags";

const inter = Inter({ subsets: ["latin", "cyrillic"], weight: ["400", "500", "600"] });

// ─────────────────────────────────────────────────────────────────────────────
// Экран «Встречи» с тегами. Верстка — из прототипа глобального чата (а тот — из «Поиска
// и фильтров»): шапка 54, панель с фильтром, поиском и табами, группы по датам, строки 72.
// Новое: чипы тегов в строке после времени, кнопка «Теги» на ховере строки с поповером
// выбора, четвертый пункт «Теги» в фильтрах.
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

/** Запоминаем, какую встречу открыли — страница встречи прочитает при загрузке */
function rememberOpen(id: string) {
  try {
    window.sessionStorage.setItem(OPEN_MEETING_KEY, id);
  } catch {
    // storage недоступен — страница встречи покажет первую
  }
}

/** Колонка тегов в строке: чипы и «+» на ховере (без тегов — «+ Добавить тег»).
 * Чип открывает меню тега (как на странице встречи), «+» и «+N» — пикер */
function TagsCell({ m, api, onCreated, onDeleted }: { m: TagMeeting; api: TagsApi; onCreated: (name: string) => void; onDeleted: (name: string, restore: () => void) => void }) {
  const tags = api.tagsFor(m.id);
  /** Кто открыл пикер: "more" («+N») или "plus»; null — закрыт. Открывший держит серую заливку */
  const [openFrom, setOpenFrom] = useState<string | null>(null);
  const open = openFrom !== null;
  const [direction, setDirection] = useState<"down" | "up">("down");
  const cellRef = useRef<HTMLDivElement>(null);

  /** Направление поповеров: у нижних строк — вверх */
  const measure = () => {
    const rect = cellRef.current?.getBoundingClientRect();
    setDirection(rect && window.innerHeight - rect.bottom < 360 ? "up" : "down");
  };

  const toggle = (_e: React.MouseEvent<HTMLElement>, source = "plus") => {
    if (!open) {
      // У нижних строк поповер открывается вверх, чтобы не уйти под край списка
      const rect = cellRef.current?.getBoundingClientRect();
      setDirection(rect && window.innerHeight - rect.bottom < 360 ? "up" : "down");
    }
    setOpenFrom((v) => (v === null ? source : null));
  };

  return (
    <div ref={cellRef} onMouseEnter={measure} className="relative flex min-w-0 flex-1 items-center gap-[4px]">
      {/* Два чипа до 120px + «+N» + плюс гарантированно влезают в колонку на 1280+ */}
      <TagChipRow tags={tags} meetingId={m.id} api={api} max={2} onMore={(e) => toggle(e, "more")} moreActive={openFrom === "more"} onDeleted={(t, restore) => onDeleted(t.name, restore)} direction={direction} />
      {/* Только на ховере строки: без тегов — «+ Добавить тег», с тегами — квадрат с плюсом */}
      <AddTagChip onClick={(e) => toggle(e, "plus")} active={openFrom === "plus"} label={tags.length === 0 ? "Добавить тег" : undefined} className={open ? "" : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100"} />
      <TagPicker
        meetingId={m.id}
        api={api}
        open={open}
        onClose={() => setOpenFrom(null)}
        onCreated={(t) => onCreated(t.name)}
        onDeleted={(t, restore) => onDeleted(t.name, restore)}
        anchorRef={cellRef}
        direction={direction}
        className={direction === "down" ? "left-0 top-[calc(100%+6px)]" : "left-0 bottom-[calc(100%+6px)]"}
      />
    </div>
  );
}

/** Строка встречи (72px): миниатюра, название и время, автор, источник, теги */
function MeetingRow({ m, api, onCreated, onDeleted }: { m: TagMeeting; api: TagsApi; onCreated: (name: string) => void; onDeleted: (name: string, restore: () => void) => void }) {
  const author = getAuthor(m.authorId);
  const source = SOURCE_META[m.source];

  return (
    <div className="group relative flex h-[72px] w-full items-center bg-white px-[24px] hover:bg-[#FAFAFA]">
      {/* Ссылка на встречу — растянута на всю строку под контентом */}
      <Link href="/tags/meeting" onClick={() => rememberOpen(m.id)} aria-label={m.title} className={`absolute inset-0 ${focusRingClass}`} />
      <div className="pointer-events-none relative flex min-w-0 flex-1 items-center gap-[24px]">
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
        {/* Колонка тегов интерактивна поверх ссылки */}
        <div className="pointer-events-auto flex min-w-0 flex-1">
          <TagsCell m={m} api={api} onCreated={onCreated} onDeleted={onDeleted} />
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

export default function TagsMeetingsPage() {
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
  const tagIdsOf = useCallback((id: string) => api.tagsFor(id).map((t) => t.id), [api]);
  // Удаленный (или из другого пространства) тег не должен висеть в фильтре невидимым условием
  const effectiveFilters = useMemo(() => {
    const alive = filters.tagIds.filter((id) => api.tags.some((t) => t.id === id));
    return alive.length === filters.tagIds.length ? filters : { ...filters, tagIds: alive };
  }, [filters, api.tags]);
  const list = useMemo(() => {
    const byTab = wsMeetings.filter((m) => (tab === "Мои встречи" ? m.authorId === ME_ID : tab === "Доступные мне" ? m.authorId !== ME_ID : true));
    return filterMeetings(byTab, effectiveFilters, tagIdsOf);
  }, [wsMeetings, tab, effectiveFilters, tagIdsOf]);
  const groups = useMemo(() => groupByDate(list), [list]);
  const active = hasActiveFilters(effectiveFilters);

  return (
    <main className={`${inter.className} h-screen min-h-[720px] w-full overflow-hidden bg-white`} style={{ color: tokens.black }}>
      <div className="flex h-full w-full bg-white">
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
                  countOf={(id) => api.usage(id).meetings}
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
                  placeholder="Поиск по названию встречи"
                  aria-label="Поиск по названию встречи"
                  className="min-w-0 flex-1 bg-transparent text-[13px] leading-[normal] tracking-[-0.13px] outline-none placeholder:text-[#C7C8CA]"
                  style={{ color: tokens.black }}
                />
              </label>
            ) : (
              <button
                type="button"
                aria-label="Поиск по названию встречи"
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
                    <MeetingRow key={m.id} m={m} api={api} onCreated={(name) => toast.show(`Тег «${name}» создан`)} onDeleted={(name, restore) => toast.show("Тег удален", { undo: restore })} />
                  ))}
                </div>
              ))
            )}
          </div>
          <ToastHost toast={toast.toast} visible={toast.visible} onHide={toast.hide} />
        </section>
      </div>
    </main>
  );
}
