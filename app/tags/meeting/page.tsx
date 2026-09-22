"use client";

import { Inter } from "next/font/google";
import Link from "next/link";
import { useRef, useState, useSyncExternalStore } from "react";
import { Ic } from "../../global-chat/_shared/icons";
import { SOURCE_META, getAuthor } from "../../search-filters/mock-data";
import { MEETINGS, formatDateTime, meetingById, type Tag, type TagMeeting } from "../_shared/data";
import { Sidebar } from "../_shared/Sidebar";
import { OPEN_MEETING_KEY, focusRingClass, gcAsset, pressableClass, sfAsset, tokens } from "../_shared/tokens";
import { AddTagChip, TagChip, TagChipMenu, TagPicker, ToastHost, useToast } from "../_shared/ui";
import { useTags, type TagsApi } from "../_shared/use-tags";

const inter = Inter({ subsets: ["latin", "cyrillic"], weight: ["400", "500", "600"] });

// ─────────────────────────────────────────────────────────────────────────────
// Страница встречи — верстка из прототипа глобального чата (шапка, карточка встречи, вкладки),
// открыта вкладка «Статья». Новое: теги в ряду чипов под заголовком — рядом с источником,
// автором и датой; «+» открывает тот же поповер, что и в списке; крестик снимает тег, клик по чипу —
// то же меню тега (имя, цвет, удалить), что у «…» в пикере, плюс «Убрать со встречи».
// ─────────────────────────────────────────────────────────────────────────────

const TABS: { key: string; label: string; icon: string }[] = [
  { key: "article", label: "Статья", icon: "mt-article.svg" },
  { key: "transcript", label: "Транскрипт", icon: "mt-transcript.svg" },
  { key: "chat", label: "Чат", icon: "mt-chat.svg" },
  { key: "tasks", label: "Задачи", icon: "mt-tasks.svg" },
];

/** Иконка вкладки: svg с цветом через маску */
function TabIcon({ file, size = 16 }: { file: string; size?: number }) {
  const src = gcAsset(file);
  return (
    <span
      aria-hidden="true"
      className="block shrink-0"
      style={{
        width: size,
        height: size,
        backgroundColor: "currentColor",
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

/** Шапка страницы встречи: «Назад» слева, справа AI-отчет ▾, Поделиться | ссылка, Экспорт */
function MeetingTopBar({ onAction }: { onAction: (label: string) => void }) {
  const btn = `flex h-[32px] items-center text-[13px] leading-[normal] tracking-[-0.13px] hover:bg-[#F7F7F8] ${pressableClass} ${focusRingClass}`;
  return (
    <header className="flex h-[54px] shrink-0 items-center justify-between pl-[24px] pr-[24px]">
      <Link href="/tags" className={`rounded-[3px] text-[13px] leading-[normal] tracking-[-0.13px] hover:text-[#585E6C] ${pressableClass} ${focusRingClass}`} style={{ color: tokens.black }}>
        Назад
      </Link>
      <div className="flex shrink-0 items-center gap-[8px]">
        <div className="flex h-[32px] items-center rounded-[4px] border" style={{ borderColor: tokens.border }}>
          <button type="button" aria-label="AI-отчет" onClick={() => onAction("AI-отчет")} className={`h-[30px] w-[30px] rounded-l-[3px] hover:bg-[#F7F7F8] ${pressableClass} ${focusRingClass}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={gcAsset("mt-ai-30.svg")} alt="" width={30} height={30} className="block" />
          </button>
          <button type="button" aria-label="Другие отчеты" onClick={() => onAction("Список отчетов")} className={`flex h-[30px] w-[30px] items-center justify-center rounded-r-[3px] bg-white hover:bg-[#F7F7F8] ${pressableClass} ${focusRingClass}`} style={{ color: tokens.grey }}>
            <Ic name="chevron-down" />
          </button>
        </div>
        <div className="flex h-[32px] items-center rounded-[4px] border" style={{ borderColor: tokens.border }}>
          <button type="button" onClick={() => onAction("Поделиться")} className={`${btn} rounded-l-[3px] border-r px-[8px]`} style={{ borderColor: tokens.border, color: tokens.black }}>
            Поделиться
          </button>
          <button type="button" aria-label="Скопировать ссылку" onClick={() => onAction("Ссылка скопирована")} className={`flex h-[30px] w-[30px] items-center justify-center rounded-r-[3px] bg-white hover:bg-[#F7F7F8] ${pressableClass} ${focusRingClass}`} style={{ color: tokens.grey }}>
            <Ic name="fig-link" />
          </button>
        </div>
        <button type="button" onClick={() => onAction("Экспорт")} className={`${btn} rounded-[4px] border px-[8px]`} style={{ borderColor: tokens.border, color: tokens.black }}>
          Экспорт
        </button>
      </div>
    </header>
  );
}

/** Чип тега на встрече: клик — меню тега под чипом, крестик на ховере — снять с встречи */
function MeetingTagChip({
  tag,
  meetingId,
  api,
  open,
  onToggle,
  onClose,
  onDeleted,
}: {
  tag: Tag;
  meetingId: string;
  api: TagsApi;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  onDeleted: (name: string, restore: () => void) => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  return (
    <span className="relative flex">
      <TagChip buttonRef={ref} name={tag.name} color={tag.color} size={23} active={open} onClick={onToggle} onRemove={() => api.toggle(meetingId, tag.id)} />
      <TagChipMenu tag={tag} api={api} open={open} onClose={onClose} anchorRef={ref} onUnassign={() => api.toggle(meetingId, tag.id)} onDeleted={(t, restore) => onDeleted(t.name, restore)} />
    </span>
  );
}

/** Ряд чипов под заголовком: источник, автор, дата — и теги пользователя с кнопкой добавления */
function MeetingInfo({ m, onCreated, onDeleted }: { m: TagMeeting; onCreated: (name: string) => void; onDeleted: (name: string, restore: () => void) => void }) {
  const api = useTags();
  const tags = api.tagsFor(m.id);
  const author = getAuthor(m.authorId);
  const source = SOURCE_META[m.source];
  const [open, setOpen] = useState(false);
  /** Какой чип открыл свое меню */
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const chip = "flex h-[23px] items-center gap-[4px] rounded-[3px] px-[8px] text-[12px] leading-[normal] tracking-[-0.24px]";

  return (
    <div className="flex w-full flex-col gap-[16px]">
      <h1 className="text-[32px] font-semibold leading-[normal] tracking-[-0.96px]" style={{ color: tokens.black }}>
        {m.title}
      </h1>
      {/* Один ряд с переносом: системные чипы и теги — отдельные элементы, теги докладываются в первую строку
          и переносятся по одному. Кнопка добавления видна всегда */}
      <div className="flex flex-wrap items-center gap-[6px]">
        <span className={chip} style={{ backgroundColor: tokens.bgSubtle, color: tokens.black }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={sfAsset(source.icon)} alt="" className="h-[12px] w-[12px] max-w-none shrink-0 object-contain" />
          {source.label}
        </span>
        <span className={`${chip} gap-[8px]`} style={{ backgroundColor: tokens.bgSubtle, color: tokens.black }}>
          <span className="flex h-[16px] w-[16px] shrink-0 items-center justify-center rounded-full text-[9px] font-medium tracking-[-0.18px] text-white" style={{ backgroundColor: author.avatarColor }}>
            {author.name.charAt(0)}
          </span>
          {author.email}
        </span>
        <span className={`${chip} whitespace-pre`} style={{ backgroundColor: tokens.bgSubtle, color: tokens.black }}>
          <TabIcon file="mt-calendar-12.svg" size={12} />
          {formatDateTime(m.date, m.time)}
        </span>
        {tags.map((t) => (
          <MeetingTagChip key={t.id} tag={t} meetingId={m.id} api={api} open={menuFor === t.id} onToggle={() => setMenuFor((v) => (v === t.id ? null : t.id))} onClose={() => setMenuFor(null)} onDeleted={onDeleted} />
        ))}
        <span className="relative flex">
          <AddTagChip
            buttonRef={btnRef}
            size={23}
            active={open}
            onClick={() => setOpen((v) => !v)}
            label={tags.length === 0 ? "Добавить тег" : undefined}
          />
          <TagPicker meetingId={m.id} api={api} open={open} onClose={() => setOpen(false)} onCreated={(t) => onCreated(t.name)} onDeleted={(t, restore) => onDeleted(t.name, restore)} anchorRef={btnRef} className="left-0 top-[calc(100%+6px)]" />
        </span>
      </div>
      <div className="flex w-full flex-col gap-[4px]">
        <span className="text-[13px] leading-[16px] tracking-[-0.13px] underline decoration-dotted underline-offset-[3px]" style={{ color: tokens.black, textDecorationColor: tokens.grey }}>
          Участники
        </span>
        <div className="flex w-full flex-wrap items-center gap-[2px]">
          {m.participants.map((name, i) => (
            <span key={name} className="flex items-center gap-[2px]">
              <span className="text-[13px] leading-[16px] tracking-[-0.13px] whitespace-nowrap" style={{ color: SPEAKER_COLORS[i % SPEAKER_COLORS.length] }}>
                {name}
              </span>
              {i < m.participants.length - 1 && (
                <span className="text-[14px] leading-[normal]" style={{ color: tokens.grey }}>
                  ,
                </span>
              )}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

const SPEAKER_COLORS = ["#F87527", "#7000E0", "#26BF00", "#A01070", "#0F55DD", "#B01414"];

/** Вкладки страницы встречи: активная — Medium, черная, подчерк 2px */
function MeetingTabs({ onPick }: { onPick: (label: string) => void }) {
  return (
    <div className="flex w-full items-center justify-between border-b" style={{ borderColor: tokens.border }}>
      <div className="flex items-center">
        {TABS.map((t) => {
          const active = t.key === "article";
          return (
            <button
              key={t.key}
              type="button"
              aria-current={active ? "page" : undefined}
              onClick={() => (active ? undefined : onPick(t.label))}
              className={`-mb-px flex items-center gap-[6px] px-[8px] pb-[12px] pt-[8px] text-[13px] leading-[normal] tracking-[-0.13px] ${active ? "border-b-2 border-black font-medium" : "hover:text-[#585E6C]"} ${pressableClass} ${focusRingClass}`}
              style={{ color: active ? tokens.black : tokens.grey }}
            >
              <TabIcon file={t.icon} />
              {t.label}
            </button>
          );
        })}
      </div>
      <span className="mb-[10px] flex" style={{ color: tokens.grey }}>
        <TabIcon file="mt-tabs-right.svg" />
      </span>
    </div>
  );
}

function ArticleCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex w-full flex-col items-start gap-[12px] rounded-[4px] p-[16px]" style={{ backgroundColor: tokens.bgLight }}>
      <h2 className="w-full text-[16px] font-medium leading-[normal] tracking-[-0.32px]" style={{ color: tokens.black }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

/** Статья: краткое содержание и ключевые моменты собраны из тезисов встречи */
function Article({ m }: { m: TagMeeting }) {
  const summary = `${m.summary.join(". ")}. Участники: ${m.participants.join(", ")}.`;
  return (
    <div className="flex w-full flex-col items-center gap-[16px] py-[24px]">
      <ArticleCard title="Краткое содержание:">
        <p className="w-full text-[13px] font-normal leading-[16px] tracking-[-0.13px]" style={{ color: tokens.black }}>
          {summary}
        </p>
      </ArticleCard>
      <ArticleCard title="Ключевые моменты:">
        <ul className="w-full list-disc pl-[20px] text-[13px] leading-[16px] tracking-[-0.13px]" style={{ color: tokens.black }}>
          {m.summary.map((s, i) => (
            <li key={i} className={i < m.summary.length - 1 ? "mb-[8px]" : ""}>
              {s}.{" "}
              <span style={{ color: tokens.blue }}>{`${i * 3 + 1}:${String((i * 17 + 8) % 60).padStart(2, "0")}`}</span>
            </li>
          ))}
        </ul>
      </ArticleCard>
      <ArticleCard title="Договоренности:">
        <ul className="w-full list-disc pl-[20px] text-[13px] leading-[16px] tracking-[-0.13px]" style={{ color: tokens.black }}>
          <li className="mb-[8px]">Ответственные за пункты назначены, сроки — до следующей встречи.</li>
          <li className="mb-[8px]">Материалы по итогам разослать участникам сегодня.</li>
          <li>Следующая встреча в том же составе через неделю.</li>
        </ul>
      </ArticleCard>
    </div>
  );
}

const subscribeNoop = () => () => {};
function readOpenMeeting(): TagMeeting | null {
  try {
    const id = window.sessionStorage.getItem(OPEN_MEETING_KEY);
    return (id && meetingById(id)) || MEETINGS[0];
  } catch {
    return MEETINGS[0];
  }
}

export default function TagsMeetingPage() {
  const toast = useToast();
  // Какую встречу открыли — из sessionStorage; на сервере и при гидрации — ничего, чтобы не мигать первой встречей
  const meeting = useSyncExternalStore(subscribeNoop, readOpenMeeting, () => null);

  const stub = (label: string) => toast.show(`Открываем «${label}»`, { icon: "arrow-right" });

  return (
    <main className={`${inter.className} h-screen min-h-[720px] w-full overflow-hidden bg-white`} style={{ color: tokens.black }}>
      <div className="flex h-full w-full bg-white">
        <Sidebar active="meetings" />
        <section className="relative flex h-full min-w-0 flex-1 flex-col bg-white">
          <MeetingTopBar onAction={(l) => (l === "Ссылка скопирована" ? toast.show(l) : stub(l))} />
          <div className="gc-noscroll flex min-h-0 flex-1 flex-col items-center overflow-y-auto pt-[32px]">
            <div className="flex w-[670px] max-w-full flex-col">
              {meeting && (
                <>
                  <div className="flex shrink-0 flex-col gap-[24px]">
                    <MeetingInfo m={meeting} onCreated={(name) => toast.show(`Тег «${name}» создан`)} onDeleted={(name, restore) => toast.show("Тег удален", { undo: restore })} />
                    <MeetingTabs onPick={stub} />
                  </div>
                  <Article m={meeting} />
                </>
              )}
            </div>
          </div>
          <ToastHost toast={toast.toast} visible={toast.visible} onHide={toast.hide} />
        </section>
      </div>
    </main>
  );
}
