"use client";

import { Inter } from "next/font/google";
import { useEffect, useRef, useState } from "react";
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

export default function GlobalChatPage() {
  // Стартуем с пустой историей — так виден дефолт «нет предыдущих диалогов»
  const api = useDialogs(null, []);
  const toast = useToast();
  const [composer, setComposer] = useState<ComposerState>(EMPTY_COMPOSER);
  const [meetingsOpen, setMeetingsOpen] = useState(false);
  const [prevExpanded, setPrevExpanded] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renamingRowId, setRenamingRowId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

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
    api.selectDialog(id);
    setRenaming(false);
    if (d) patch({ mode: d.mode, meetingIds: [], files: [] });
  };

  const goHome = () => {
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

  return (
    <main className={`${inter.className} h-screen min-h-[720px] w-full overflow-hidden bg-white`} style={{ color: tokens.black }}>
      <div className="flex h-full w-full bg-white">
        <Sidebar active="chat" />
        <section className="relative flex h-full min-w-0 flex-1 flex-col bg-white">
          {active ? (
            <>
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
                  api.renameDialog(active.id, t);
                  setRenaming(false);
                }}
                onCancelRename={() => setRenaming(false)}
              />
              <div key={active.id} className="gc-enter flex min-h-0 flex-1 flex-col items-center">
                <div className="flex min-h-0 w-[640px] max-w-full flex-1 flex-col justify-between pb-[16px]">
                  <div ref={scrollRef} className="gc-scroll min-h-0 flex-1 overflow-y-auto">
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
            </>
          ) : (
            <>
              <header className="flex h-[54px] shrink-0 items-center p-[16px]">
                <span className="text-[13px] font-medium leading-[normal] tracking-[-0.13px]" style={{ color: tokens.black }}>
                  Чат
                </span>
              </header>
              {/* Центрируется блок как в макете дефолта: заголовок + поле + слот под карточки (100px).
                  Слот фиксированной высоты, поэтому строки-подсказки или список чатов (они выше карточек)
                  выходят за него вниз и не сдвигают поле по вертикали */}
              <div className="gc-enter flex min-h-0 flex-1 flex-col items-center justify-center px-[24px]">
                <div className="flex w-[640px] max-w-full flex-col items-center gap-[24px]">
                  <div className="flex w-full flex-col items-center gap-[24px]">
                    <HomeTitle mode={composer.mode} />
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
                  <div className={`relative h-[100px] w-full ${hasDialogs ? "mt-[16px]" : ""}`}>
                    <div className="absolute left-0 right-0 top-0 flex flex-col items-center">
                    {hasDialogs ? (
                      <PreviousChats
                        dialogs={api.dialogs}
                        expanded={prevExpanded}
                        onToggle={() => setPrevExpanded((v) => !v)}
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

      <MeetingsModal open={meetingsOpen} initial={active ? active.context : composer.meetingIds} onClose={() => setMeetingsOpen(false)} onApply={applyMeetings} />
    </main>
  );
}
