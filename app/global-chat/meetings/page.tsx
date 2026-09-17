"use client";

import { Inter } from "next/font/google";
import Link from "next/link";
import { useMemo, useState } from "react";
import { MeetingThumb } from "../_shared/chat-ui";
import { MEETINGS, type ChatMeeting } from "../_shared/data";
import { Sidebar } from "../_shared/Sidebar";
import { StateSwitcher } from "../_shared/StateSwitcher";
import { focusRingClass, pressableClass, sfAsset, tokens } from "../_shared/tokens";
import { SOURCE_META, getAuthor } from "../../search-filters/mock-data";

const inter = Inter({ subsets: ["latin", "cyrillic"], weight: ["400", "500", "600"] });

// ─────────────────────────────────────────────────────────────────────────────
// Список встреч — пункт «Встречи» в сайдбаре. Верстка взята из прототипа «Поиск и фильтры»
// (app/search-filters): шапка 54, панель с фильтром, поиском и табами, группы по датам, строки 72
// с миниатюрой, автором и источником. Данные — те же встречи, что видит чат; клик по строке
// открывает страницу встречи с вкладкой «Чат».
// ─────────────────────────────────────────────────────────────────────────────

const MONTHS_GENITIVE = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
const WEEKDAYS = ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];
/** «Сегодня» прототипа — день самой свежей встречи в моках, чтобы список читался как живой */
const TODAY_ISO = MEETINGS.map((m) => m.date).sort().at(-1) ?? "2026-09-03";

function parseISO(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function isoDaysBefore(iso: string, days: number) {
  const d = parseISO(iso);
  d.setDate(d.getDate() - days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function dateLabels(iso: string) {
  const d = parseISO(iso);
  const weekday = WEEKDAYS[d.getDay()];
  if (iso === TODAY_ISO) return { label: "Сегодня", subLabel: weekday };
  if (iso === isoDaysBefore(TODAY_ISO, 1)) return { label: "Вчера", subLabel: weekday };
  return { label: `${d.getDate()} ${MONTHS_GENITIVE[d.getMonth()]}`, subLabel: weekday };
}

function groupByDate(meetings: ChatMeeting[]) {
  const byDate = new Map<string, ChatMeeting[]>();
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

/** Строка встречи (72px): миниатюра, название и время, автор, источник — как в «Поиске и фильтрах» */
function MeetingRow({ m }: { m: ChatMeeting }) {
  const author = getAuthor(m.authorId);
  const source = SOURCE_META[m.source];
  return (
    <Link
      href="/global-chat/meeting"
      className={`flex h-[72px] w-full items-center justify-between bg-white px-[24px] py-[12px] hover:bg-[#FAFAFA] ${pressableClass} ${focusRingClass}`}
    >
      <span className="flex min-w-0 items-center gap-[24px]">
        <span className="flex w-[446px] min-w-0 items-center gap-[12px]">
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
        <span className="flex w-[180px] items-center gap-[8px]">
          <AuthorAvatar color={author.avatarColor} letter={author.name.charAt(0)} title={author.name} />
          <span className="min-w-0 flex-1 truncate text-[12px] leading-[normal] tracking-[-0.24px]" style={{ color: tokens.black }}>
            {author.email}
          </span>
        </span>
        <span className="flex w-[180px] items-center gap-[8px] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={sfAsset(source.icon)} alt="" className="h-[14px] w-[14px] max-w-none shrink-0 object-contain" />
          <span className="truncate text-[12px] leading-[normal] tracking-[-0.24px]" style={{ color: tokens.black }}>
            {source.label}
          </span>
        </span>
      </span>
    </Link>
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

export default function MeetingsPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Все встречи");
  const [query, setQuery] = useState("");
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MEETINGS.filter((m) => (tab === "Мои встречи" ? m.authorId === "u-fedos" : true)).filter((m) => !q || m.title.toLowerCase().includes(q));
  }, [tab, query]);
  const groups = useMemo(() => groupByDate(list), [list]);

  return (
    <main className={`${inter.className} h-screen min-h-[720px] w-full overflow-hidden bg-white`} style={{ color: tokens.black }}>
      <div className="flex h-full w-full bg-white">
        <Sidebar active="meetings" />
        <section className="flex h-full min-w-0 flex-1 flex-col bg-white">
          <div className="flex h-[54px] w-full shrink-0 items-center border-b p-[16px]" style={{ borderColor: tokens.border }}>
            <h1 className="text-[13px] font-medium leading-[normal] tracking-[-0.13px]" style={{ color: tokens.black }}>
              Встречи
            </h1>
          </div>

          {/* Панель: фильтр, поиск и табы — как в «Поиске и фильтрах», без анимации раскрытия поиска */}
          <div className="flex w-full shrink-0 items-center gap-[8px] px-[16px] py-[16px]">
            <button
              type="button"
              aria-label="Фильтры"
              className={`flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-[4px] border bg-white hover:bg-[#F7F7F8] ${pressableClass} ${focusRingClass}`}
              style={{ borderColor: tokens.border }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={sfAsset("icon-filter.svg")} alt="" className="h-[16px] w-[16px] max-w-none shrink-0" />
            </button>
            <label className={`flex h-[36px] w-[320px] items-center gap-[10px] rounded-[4px] border bg-white px-[10px] focus-within:border-[#0138C7] ${pressableClass}`} style={{ borderColor: tokens.border }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={sfAsset("icon-search.svg")} alt="" className="h-[16px] w-[16px] max-w-none shrink-0" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Поиск по названию встречи"
                aria-label="Поиск по названию встречи"
                className="min-w-0 flex-1 bg-transparent text-[13px] leading-[normal] tracking-[-0.13px] outline-none placeholder:text-[#C7C8CA]"
                style={{ color: tokens.black }}
              />
            </label>
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

          <div className="gc-noscroll flex min-h-0 w-full flex-1 flex-col overflow-y-auto">
            {groups.length === 0 ? (
              <div className="flex w-full flex-1 items-center justify-center py-[120px]">
                <div className="flex flex-col items-center gap-[12px] text-center">
                  <p className="text-[24px] font-medium leading-[normal] tracking-[-0.48px]" style={{ color: tokens.black }}>
                    Не удалось ничего найти
                  </p>
                  <p className="w-[288px] text-[14px] leading-[1.35] tracking-[-0.28px]" style={{ color: tokens.black }}>
                    Попробуйте другой запрос или смените рабочее пространство
                  </p>
                </div>
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
        </section>
      </div>
      <StateSwitcher />
    </main>
  );
}
