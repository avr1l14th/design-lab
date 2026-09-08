"use client";

import { Inter } from "next/font/google";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  AssistantBlock,
  Composer,
  DialogHeader,
  HomeTitle,
  MeetingsModal,
  PreviousChats,
  SuggestionCards,
  SuggestionList,
  UserBubble,
  type ComposerState,
} from "./_shared/chat-ui";
import { SAMPLE_FILE, SUGGESTIONS, meetingById, nextId, type Suggestion } from "./_shared/data";
import { Sidebar } from "./_shared/Sidebar";
import { tokens } from "./_shared/tokens";
import { ToastHost, useToast } from "./_shared/ui";
import { useDialogs } from "./_shared/use-dialogs";

const inter = Inter({ subsets: ["latin", "cyrillic"], weight: ["400", "500", "600"] });

// ─────────────────────────────────────────────────────────────────────────────
// Глобальный чат — по макету (Figma: секции «Чат» и «Диалог»).
// Стартовая: «Салют! Чем могу помочь?», композер, подсказки / предыдущие чаты.
// Диалог: «Чат / Название», вопрос, «Думаю...» → «Смотрю встречи…» → ответ с цитатами.
// ─────────────────────────────────────────────────────────────────────────────

const EMPTY_COMPOSER: ComposerState = { text: "", mode: "auto", meetingIds: [], files: [] };

/** Кривая «переезда» по экрану: быстрый старт, мягкая остановка (iOS drawer) */
const TRAVEL_EASING = "cubic-bezier(0.32, 0.72, 0, 1)";
/** 340ms — поле проходит ~420px; быстрее ощущается как рывок, медленнее — как ожидание */
const TRAVEL_MS = 340;
/** Остальное содержимое экрана догоняет поле с этой задержкой (≈ треть переезда) */
const TRAVEL_FOLLOW_DELAY = "110ms";

/**
 * FLIP-переезд композера: перед сменой экрана запоминаем top поля, после рендера нового экрана
 * поле стартует со старой позиции и доезжает до новой одним движением (WAAPI, только transform).
 * Ширина и X у обоих композеров одинаковые (640, по центру), поэтому хватает translateY.
 */
function useComposerTravel() {
  const fromTop = useRef<number | null>(null);
  const remember = (el: HTMLElement | null) => {
    fromTop.current = el ? el.getBoundingClientRect().top : null;
  };
  const useArrive = (ref: React.RefObject<HTMLDivElement | null>, key: string) => {
    useLayoutEffect(() => {
      const el = ref.current;
      // Оба композера (стартовой и диалога) слушают переезд; забирает точку только тот, кто сейчас в DOM
      if (el === null) return;
      const from = fromTop.current;
      fromTop.current = null;
      if (from === null) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const dy = from - el.getBoundingClientRect().top;
      if (Math.abs(dy) < 2) return;
      el.animate([{ transform: `translateY(${dy}px)` }, { transform: "translateY(0)" }], { duration: TRAVEL_MS, easing: TRAVEL_EASING });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key]);
  };
  return { remember, useArrive };
}

export default function GlobalChatPage() {
  // Стартуем с пустой историей — так виден дефолт «нет предыдущих диалогов»
  const api = useDialogs(null, []);
  const toast = useToast();
  const [composer, setComposer] = useState<ComposerState>(EMPTY_COMPOSER);
  const [meetingsOpen, setMeetingsOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renamingRowId, setRenamingRowId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const homeComposerRef = useRef<HTMLDivElement>(null);
  const dialogComposerRef = useRef<HTMLDivElement>(null);
  const travel = useComposerTravel();

  const patch = (p: Partial<ComposerState>) => setComposer((c) => ({ ...c, ...p }));
  const active = api.active;

  // Автоскролл ленты к последнему сообщению во время генерации
  const lastText = active?.messages[active.messages.length - 1]?.text;
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [active?.id, active?.messages.length, lastText, api.generation?.phase]);

  const send = () => {
    if (!composer.text.trim() || api.isGenerating) return;
    // Первый вопрос: поле уезжает с середины стартовой вниз экрана диалога
    if (!active) travel.remember(homeComposerRef.current);
    api.sendMessage({ text: composer.text, mode: composer.mode, meetingIds: composer.meetingIds, files: composer.files });
    // Встречи уходят в контекст диалога, файлы и текст — отправлены
    setComposer((c) => ({ ...c, text: "", meetingIds: [], files: [] }));
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
    if (composer.files.length) return;
    patch({ files: [{ id: nextId("file"), ...SAMPLE_FILE }] });
  };

  const applyMeetings = (ids: string[]) => {
    if (active) {
      // В диалоге модалка редактирует контекст диалога целиком
      api.setDialogContext(active.id, ids);
      patch({ meetingIds: [] });
    } else {
      patch({ meetingIds: ids });
    }
    setMeetingsOpen(false);
  };

  const openDialog = (id: string) => {
    const d = api.dialogs.find((x) => x.id === id);
    // Со стартовой в старый диалог поле уезжает вниз так же, как при первом вопросе
    if (!active) travel.remember(homeComposerRef.current);
    api.selectDialog(id);
    setRenaming(false);
    if (d) patch({ mode: d.mode, meetingIds: [], files: [] });
  };

  const goHome = () => {
    // Обратно на стартовую — поле возвращается снизу в центр
    travel.remember(dialogComposerRef.current);
    api.goHome();
    setRenaming(false);
    setComposer((c) => ({ ...c, meetingIds: [], files: [] }));
  };

  const deleteActive = () => {
    if (!active) return;
    const undo = api.deleteDialog(active.id);
    toast.show("Диалог удален", { undo });
  };

  const pinActive = () => {
    if (!active) return;
    api.togglePin(active.id);
    toast.show(active.pinned ? "Диалог откреплен" : "Диалог закреплен", { icon: "fig-pin" });
  };

  const hasDialogs = api.dialogs.length > 0;
  travel.useArrive(dialogComposerRef, active ? active.id : "");
  travel.useArrive(homeComposerRef, active ? "" : "home");
  // Остальное содержимое экрана появляется чуть позже композера — при переезде движение читается первым
  const enterDelay = { animationDelay: TRAVEL_FOLLOW_DELAY };

  return (
    <main className={`${inter.className} h-screen min-h-[720px] w-full overflow-hidden bg-white`} style={{ color: tokens.black }}>
      <div className="flex h-full w-full bg-white">
        <Sidebar active="chat" />
        <section className="relative flex h-full min-w-0 flex-1 flex-col bg-white">
          {/* Шапка общая для стартовой и диалога: «Чат» стоит на месте и лишь меняет цвет, остальное проявляется рядом */}
          <DialogHeader
                dialog={active}
                dialogs={api.dialogs}
                onHome={goHome}
                onSwitch={openDialog}
                onCopyLink={() => toast.show("Ссылка скопирована")}
                onPin={pinActive}
                onRename={() => setRenaming(true)}
                onDelete={deleteActive}
                renaming={renaming}
                onCommitRename={(t) => {
                  if (active) api.renameDialog(active.id, t);
                  setRenaming(false);
                }}
                onCancelRename={() => setRenaming(false)}
          />
          {active ? (
            <>
              <div key={active.id} className="flex min-h-0 flex-1 flex-col items-center">
                <div className="flex min-h-0 w-[640px] max-w-full flex-1 flex-col justify-between pb-[16px]">
                  <div ref={scrollRef} className="gc-enter gc-noscroll min-h-0 flex-1 overflow-y-auto" style={enterDelay}>
                    <div className="flex w-full flex-col items-end gap-[40px] pb-[40px] pt-[40px]">
                      {active.messages.map((m) =>
                        m.role === "user" ? (
                          <UserBubble key={m.id} message={m} />
                        ) : (
                          <AssistantBlock
                            key={m.id}
                            message={m}
                            generation={api.generation}
                            onChoose={(mode) => {
                              api.resolveClarification(active.id, m.id, mode);
                              patch({ mode });
                            }}
                            onOpenMeeting={(id) => toast.show(`Открываем «${meetingById(id)?.title}»`, { icon: "arrow-right" })}
                            onCopy={() => toast.show("Ответ скопирован")}
                          />
                        ),
                      )}
                    </div>
                  </div>
                  <div ref={dialogComposerRef} className="relative z-10 w-full will-change-transform">
                    <Composer
                      state={composer}
                      onChange={patch}
                      onSend={send}
                      onOpenMeetings={() => setMeetingsOpen(true)}
                      onAddFile={addFile}
                      onRemoveFile={(id) => patch({ files: composer.files.filter((f) => f.id !== id) })}
                      contextIds={active.context}
                      disabled={api.isGenerating}
                      textareaRef={textareaRef}
                      menuDirection="up"
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Центрируется блок как в макете дефолта: заголовок + поле + слот под карточки (100px).
                  Слот фиксированной высоты, поэтому строки-подсказки или список чатов (они выше карточек)
                  выходят за него вниз и не сдвигают поле по вертикали */}
              <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-[24px]">
                <div className="flex w-[640px] max-w-full flex-col items-center gap-[24px]">
                  <div className="flex w-full flex-col items-center gap-[24px]">
                    <div className="gc-enter" style={enterDelay}>
                      <HomeTitle mode={composer.mode} />
                    </div>
                    <div ref={homeComposerRef} className="relative z-10 w-full will-change-transform">
                      <Composer
                        state={composer}
                        onChange={patch}
                        onSend={send}
                        onOpenMeetings={() => setMeetingsOpen(true)}
                        onAddFile={addFile}
                        onRemoveFile={(id) => patch({ files: composer.files.filter((f) => f.id !== id) })}
                        autoFocus
                        textareaRef={textareaRef}
                      />
                    </div>
                  </div>
                  <div className={`gc-enter relative h-[100px] w-full ${hasDialogs ? "mt-[16px]" : ""}`} style={enterDelay}>
                    <div className="absolute left-0 right-0 top-0 flex flex-col items-center">
                    {hasDialogs ? (
                      <PreviousChats
                        dialogs={api.dialogs}
                        onOpen={openDialog}
                        renamingId={renamingRowId}
                        onCommitRename={(id, t) => {
                          api.renameDialog(id, t);
                          setRenamingRowId(null);
                        }}
                        onCancelRename={() => setRenamingRowId(null)}
                        actions={{
                          onPin: (id) => {
                            const d = api.dialogs.find((x) => x.id === id);
                            api.togglePin(id);
                            toast.show(d?.pinned ? "Диалог откреплен" : "Диалог закреплен", { icon: "fig-pin" });
                          },
                          onRename: (id) => setRenamingRowId(id),
                          onDelete: (id) => {
                            const undo = api.deleteDialog(id);
                            toast.show("Диалог удален", { undo });
                          },
                        }}
                      />
                    ) : composer.mode === "auto" ? (
                      <SuggestionCards items={SUGGESTIONS.auto} onPick={pickSuggestion} />
                    ) : (
                      <SuggestionList key={composer.mode} items={SUGGESTIONS[composer.mode]} onPick={pickSuggestion} />
                    )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          <ToastHost toast={toast.toast} visible={toast.visible} onHide={toast.hide} />
        </section>
      </div>

      <MeetingsModal open={meetingsOpen} initial={active ? active.context : composer.meetingIds} onClose={() => setMeetingsOpen(false)} onApply={applyMeetings} onReset={() => applyMeetings([])} />
    </main>
  );
}
