"use client";

import { Inter } from "next/font/google";
import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  MEETINGS,
  SOURCE_META,
  getAuthor,
  type Meeting,
  type ThumbKind,
} from "./mock-data";
import {
  EMPTY_FILTERS,
  filterMeetings,
  groupByDate,
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
            <div
              className="flex h-[16px] w-[16px] shrink-0 items-center justify-center rounded-full text-[9px] font-medium text-white"
              style={{ backgroundColor: author.avatarColor, letterSpacing: "-0.18px" }}
              title={author.name}
            >
              {author.name.charAt(0)}
            </div>
            <p className="min-w-0 flex-1 truncate text-[12px]" style={{ color: tokens.black, letterSpacing: "-0.24px" }}>
              {author.email}
            </p>
          </div>
        </div>
        <div className="flex w-[180px] flex-col items-start overflow-clip">
          <div className="flex w-full items-center gap-[8px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={asset(source.icon)} alt="" className="h-[14px] w-[14px] shrink-0 object-contain" />
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

export default function SearchFiltersPage() {
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

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
    <main className={`${inter.className} flex min-h-screen w-full bg-white`} style={{ color: tokens.black }}>
      <div className="relative flex min-h-screen flex-1 items-start bg-white">
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
                <div className="flex w-[256px] flex-col items-start gap-[4px]">
                  <SidebarMenuItem icon="icon-meetings.svg" label="Встречи" active />
                  <SidebarMenuItem icon="icon-ai.svg" label="AI Отчеты" />
                  <SidebarMenuItem icon="icon-integrations.svg" label="Интеграции" />
                  <SidebarMenuItem icon="icon-settings.svg" label="Настройки" />
                </div>
              </div>
            </div>
            <div className="h-px w-full" style={{ backgroundColor: tokens.grey40 }} />
            <div className="flex w-full flex-col items-start gap-[4px] px-[12px]">
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
                  <span className="text-[10px] font-medium" style={{ color: tokens.black, letterSpacing: "-0.1px" }}>
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
        <section className="flex min-w-0 flex-1 flex-col items-start justify-center">
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
                Мои встречи
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

          <div className="flex w-full items-center overflow-hidden bg-white pl-[16px] pr-[24px] py-[16px]">
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
                  className={`flex h-[36px] min-w-0 items-center gap-[10px] overflow-hidden rounded-[4px] border border-solid bg-white px-[10px] ${
                    searchOpen ? "" : "cursor-pointer"
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
                <button
                  type="button"
                  className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-[4px] border border-solid bg-white"
                  style={{ borderColor: tokens.grey40 }}
                  aria-label="Фильтры"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={asset("icon-filter.svg")} alt="" className="h-[16px] w-[16px] max-w-none shrink-0" />
                </button>
              </div>
              <AnimatePresence mode="popLayout" initial={false}>
                {!searchOpen && (
                  <motion.div
                    key="tabs-group"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1], delay: 0.42 } }}
                    exit={{ opacity: 0, transition: { duration: 0.08, ease: "linear" } }}
                    style={{ willChange: "opacity" }}
                    className="flex items-center gap-[12px] overflow-hidden whitespace-nowrap"
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
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

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
          ) : (
            <div className="flex w-[1160px] flex-col items-start">
              {groups.length === 0 ? (
                <div className="w-full px-[24px] py-[48px] text-center text-[13px]" style={{ color: tokens.grey }}>
                  Ничего не найдено
                </div>
              ) : (
                groups.map((g) => (
                  <div key={g.key} className="flex w-full flex-col">
                    <DateHeader label={g.label} subLabel={g.subLabel} />
                    {g.meetings.map((m) => (
                      <MeetingRow key={m.id} m={m} />
                    ))}
                  </div>
                ))
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
