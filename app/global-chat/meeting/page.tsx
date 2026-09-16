"use client";

import { Inter } from "next/font/google";
import { useEffect, useRef, useState } from "react";
import { AssistantBlock, Composer, SuggestionList, UserBubble, type ComposerState } from "../_shared/chat-ui";
import { SAMPLE_FILES, nextId, type Suggestion } from "../_shared/data";
import { Ic } from "../_shared/icons";
import { Sidebar } from "../_shared/Sidebar";
import { StateSwitcher } from "../_shared/StateSwitcher";
import { focusRingClass, gcAsset, pressableClass, tokens } from "../_shared/tokens";
import { ToastHost, useToast } from "../_shared/ui";
import { useDialogs } from "../_shared/use-dialogs";

const inter = Inter({ subsets: ["latin", "cyrillic"], weight: ["400", "500", "600"] });

// ─────────────────────────────────────────────────────────────────────────────
// Чат внутри встречи (секция «Чат внутри встречи», 46773:16377 и 46789:10725): тот же движок, что в глобальном
// чате, но контекст — одна эта встреча, поэтому в композере нет кнопки «Встречи», а в ответе нет шага
// «Посмотрел встречи» и цитат по встречам. Открывается вкладкой «Чат» на странице встречи.
// ─────────────────────────────────────────────────────────────────────────────

const EMPTY_COMPOSER: ComposerState = { text: "", mode: "auto", meetingIds: [], files: [] };
/** Встреча из моков, по которой отвечает чат */
const MEETING_ID = "m1";

/** Подсказки пустого чата встречи (46814:16977): те же шаблоны, что на стартовой, но про эту встречу */
const MEETING_SUGGESTIONS: Suggestion[] = [
  { text: "Что решили на этой встрече?", mode: "auto" },
  { text: "Какие договоренности у меня с участниками?", mode: "auto" },
  { text: "Какие задачи назначили и на кого?", mode: "auto" },
];

/** Спикеры с цветами из макета (46773:16502) */
const SPEAKERS: { name: string; color: string }[] = [
  { name: "Андрюха (Speaker F)", color: "#F87527" },
  { name: "Саша (Speaker D)", color: "#7000E0" },
  { name: "Санек (Speaker A)", color: "#26BF00" },
  { name: "Федор Захаров", color: "#A01070" },
  { name: "Экран мои встречи", color: "#0F55DD" },
  { name: "Федор Жилкин", color: "#B01414" },
  { name: "Egor", color: "#444444" },
];

const TABS: { key: string; label: string; icon: string }[] = [
  { key: "article", label: "Статья", icon: "mt-article.svg" },
  { key: "transcript", label: "Транскрипт", icon: "mt-transcript.svg" },
  { key: "chat", label: "Чат", icon: "mt-chat.svg" },
  { key: "tasks", label: "Задачи", icon: "mt-tasks.svg" },
];

/** Иконка вкладки: svg с цветом через маску, как Ic, но имена файлов свои (не из реестра IconName) */
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

/** Шапка страницы встречи (46773:16462): «Назад» слева, справа AI-отчет ▾, Поделиться | ссылка, Экспорт */
function MeetingTopBar({ onAction }: { onAction: (label: string) => void }) {
  const btn = `flex h-[32px] items-center text-[13px] leading-[normal] tracking-[-0.13px] hover:bg-[#F7F7F8] ${pressableClass} ${focusRingClass}`;
  return (
    <header className="flex h-[54px] shrink-0 items-center justify-between pl-[24px] pr-[24px]">
      <button type="button" onClick={() => onAction("Назад")} className={`rounded-[3px] text-[13px] leading-[normal] tracking-[-0.13px] hover:text-[#585E6C] ${pressableClass} ${focusRingClass}`} style={{ color: tokens.black }}>
        Назад
      </button>
      <div className="flex shrink-0 items-center gap-[8px]">
        {/* Сплит «AI-отчет | ▾» — иконка приходит из макета готовой картинкой с правой границей */}
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

/** Карточка встречи над вкладками (46773:16481): заголовок 32, чипы источника/автора/даты, участники */
function MeetingInfo() {
  return (
    <div className="flex w-full flex-col gap-[16px]">
      <h1 className="text-[32px] font-semibold leading-[normal] tracking-[-0.96px]" style={{ color: tokens.black }}>
        Design team workshop #26
      </h1>
      <div className="flex items-center gap-[4px]">
        <span className="flex h-[23px] items-center gap-[4px] rounded-[3px] px-[8px] text-[12px] leading-[normal] tracking-[-0.24px]" style={{ backgroundColor: tokens.bgSubtle, color: tokens.black }}>
          <TabIcon file="mt-upload-12.svg" size={12} />
          Uploaded
        </span>
        <span className="flex h-[23px] items-center gap-[8px] rounded-[3px] px-[8px] text-[12px] leading-[normal] tracking-[-0.24px]" style={{ backgroundColor: tokens.bgSubtle, color: tokens.black }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={gcAsset("mt-avatar.png")} alt="" width={16} height={16} className="block h-[16px] w-[16px] rounded-full" />
          hello@mymeet.ai
        </span>
        <span className="flex h-[23px] items-center gap-[4px] rounded-[3px] px-[8px] text-[12px] leading-[normal] tracking-[-0.24px] whitespace-pre" style={{ backgroundColor: tokens.bgSubtle, color: tokens.black }}>
          <TabIcon file="mt-calendar-12.svg" size={12} />
          {"15.11.2022  13:40"}
        </span>
      </div>
      <div className="flex w-full flex-col gap-[4px]">
        <span className="text-[13px] leading-[16px] tracking-[-0.13px] underline decoration-dotted underline-offset-[3px]" style={{ color: tokens.black, textDecorationColor: tokens.grey }}>
          Участники
        </span>
        <div className="flex w-full flex-wrap items-center gap-[2px]">
          {SPEAKERS.map((s, i) => (
            <span key={s.name} className="flex items-center gap-[2px]">
              <span className="text-[13px] leading-[16px] tracking-[-0.13px] whitespace-nowrap" style={{ color: s.color }}>
                {s.name}
              </span>
              {i < SPEAKERS.length - 1 && (
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

/** Вкладки страницы встречи (46773:16516): активная — Medium, черная, подчерк 2px; справа иконка раскладки */
function MeetingTabs({ onPick }: { onPick: (label: string) => void }) {
  return (
    <div className="flex w-full items-center justify-between border-b" style={{ borderColor: tokens.border }}>
      <div className="flex items-center">
        {TABS.map((t) => {
          const active = t.key === "chat";
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

export default function MeetingChatPage() {
  // Своя история: чат встречи не смешивается с глобальным
  const api = useDialogs(null, [], "gc:meeting:v1");
  const toast = useToast();
  const [composer, setComposer] = useState<ComposerState>(EMPTY_COMPOSER);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const patch = (p: Partial<ComposerState>) => setComposer((c) => ({ ...c, ...p }));
  const active = api.active;

  // Если история сохранилась с прошлого раза — сразу открываем ее
  useEffect(() => {
    const t = setTimeout(() => {
      const first = api.dialogs[0];
      if (first && !api.active) api.selectDialog(first.id);
    }, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api.dialogs.length]);

  const lastText = active?.messages[active.messages.length - 1]?.text;
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, [active?.messages.length, lastText, api.generation?.phase]);

  const send = () => {
    if (!composer.text.trim() || api.isGenerating) return;
    api.sendMessage({ text: composer.text, mode: composer.mode, meetingIds: [MEETING_ID], files: composer.files });
    setComposer((c) => ({ ...c, text: "", files: [] }));
  };

  const pickSuggestion = (s: Suggestion) => {
    patch({ text: s.text, mode: s.mode });
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      el?.focus();
      el?.setSelectionRange(s.text.length, s.text.length);
    });
  };

  const addFile = () => {
    const next = SAMPLE_FILES[composer.files.length];
    if (!next) return;
    patch({ files: [...composer.files, { id: nextId("file"), ...next }] });
  };

  const stub = (label: string) => toast.show(`Открываем «${label}»`, { icon: "arrow-right" });

  const composerEl = (
    <Composer
      state={composer}
      onChange={patch}
      onSend={send}
      onOpenMeetings={() => undefined}
      onAddFile={addFile}
      onRemoveFile={(id) => patch({ files: composer.files.filter((f) => f.id !== id) })}
      disabled={api.isGenerating}
      textareaRef={textareaRef}
      generating={api.isGenerating}
      onStop={api.stopGenerating}
      hideMeetings
      placeholder="Спросите что-нибудь о встрече…"
      autoFocus={!active}
    />
  );

  return (
    <main className={`${inter.className} h-screen min-h-[720px] w-full overflow-hidden bg-white`} style={{ color: tokens.black }}>
      <div className="flex h-full w-full bg-white">
        <Sidebar active="meetings" />
        <section className="relative flex h-full min-w-0 flex-1 flex-col bg-white">
          <MeetingTopBar onAction={(l) => (l === "Ссылка скопирована" ? toast.show(l) : stub(l))} />
          {/* Колонка 670 по центру, 32px под шапкой (46773:16479); карточка встречи и вкладки стоят, чат под ними скроллится */}
          <div className="flex min-h-0 flex-1 flex-col items-center pt-[32px]">
            <div className="flex min-h-0 w-[670px] max-w-full flex-1 flex-col">
              <div className="flex shrink-0 flex-col gap-[24px]">
                <MeetingInfo />
                <MeetingTabs onPick={stub} />
              </div>
              {active ? (
                <div className="flex min-h-0 flex-1 flex-col justify-between pb-[16px] pt-[16px]">
                  {/* Лента во всю ширину колонки 670; отрицательные поля — под аватар ответа слева */}
                  <div ref={scrollRef} className="gc-noscroll -mx-[24px] min-h-0 flex-1 overflow-y-auto px-[24px]">
                    <div className="flex w-full flex-col items-end gap-[40px] pb-[40px]">
                      {active.messages.map((m) =>
                        m.role === "user" ? (
                          <UserBubble key={m.id} message={m} />
                        ) : (
                          <AssistantBlock
                            key={m.id}
                            // Контекст — одна встреча: шаг «Посмотрел встречи» и цитаты по встречам не показываем (46773:16770)
                            message={{ ...m, step: undefined, sources: [], text: m.text.replace(/ ?\[\d+\]/g, "") }}
                            generation={api.generation}
                            onChoose={(mode) => {
                              api.resolveClarification(active.id, m.id, mode);
                              patch({ mode });
                            }}
                            onCopy={() => toast.show("Ответ скопирован")}
                            onSupportLink={stub}
                            onUpgrade={() => stub("Тарифы")}
                            onFeedback={() => toast.show("Спасибо, разберемся")}
                          />
                        ),
                      )}
                    </div>
                  </div>
                  {composerEl}
                </div>
              ) : (
                // Пустой чат встречи (46789:10725): подсказки и поле прижаты к низу, во всю ширину колонки 670
                <div className="flex min-h-0 flex-1 flex-col justify-end pb-[16px]">
                  <div className="flex w-full flex-col gap-[24px]">
                    <SuggestionList items={MEETING_SUGGESTIONS} onPick={pickSuggestion} inset={false} />
                    {composerEl}
                  </div>
                </div>
              )}
            </div>
          </div>
          <ToastHost toast={toast.toast} visible={toast.visible} onHide={toast.hide} />
        </section>
      </div>
      <StateSwitcher />
    </main>
  );
}
