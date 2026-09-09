"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type SetStateAction } from "react";
import {
  DIALOGS,
  clarifyOptions,
  generateAnswer,
  needsClarification,
  nextId,
  nowIso,
  titleFromQuestion,
  type Dialog,
  type FileAttachment,
  type Message,
  type Mode,
} from "./data";

/**
 * Фазы имитации ответа (по макету):
 *  thinking  — «Думаю...»
 *  clarify   — модель переспросила режим, ждем выбор пользователя
 *  looking   — «Смотрю встречи…» (шаг с раскрывающимся списком)
 *  streaming — текст ответа появляется словами
 */
export type Generation = {
  dialogId: string;
  messageId: string;
  phase: "thinking" | "clarify" | "looking" | "streaming";
};

export type SendPayload = {
  text: string;
  mode: Mode;
  meetingIds: string[];
  files: FileAttachment[];
};

// Этапы идут друг за другом и не спеша: сначала «Думаю...», потом «Смотрю встречи…», потом текст
const THINK_MS = 1600;
const LOOK_MS = 2200;
const TICK_MS = 26;

// ─────────────────────────────────────────────────────────────────────────────
// Хранилище диалогов в localStorage: прошлые чаты переживают перезагрузку страницы.
// Внешний стор через useSyncExternalStore: на сервере и при гидрации — пустой список,
// на клиенте сразу после гидрации — сохраненный, без мигания стартового экрана
// ─────────────────────────────────────────────────────────────────────────────

const EMPTY: Dialog[] = [];
const SAVE_DELAY_MS = 150;

type Store = { value: Dialog[]; listeners: Set<() => void>; saveTimer?: ReturnType<typeof setTimeout> };
const stores = new Map<string, Store>();

/** Убираем хвосты прерванной генерации: пустой ответ ассистента вместе с вопросом перед ним, диалоги без сообщений */
function sanitize(dialogs: Dialog[]): Dialog[] {
  return dialogs
    .map((d) => {
      const messages: Message[] = [];
      for (const m of d.messages) {
        const interrupted = m.role === "assistant" && m.text.length === 0 && !m.clarify;
        if (interrupted) {
          if (messages[messages.length - 1]?.role === "user") messages.pop();
          continue;
        }
        messages.push(m);
      }
      // Старые сохраненные диалоги получили заголовок, обрезанный до 42 символов — пересобираем из вопроса
      const firstQuestion = messages.find((m) => m.role === "user")?.text;
      const title = d.title.endsWith("…") && firstQuestion ? titleFromQuestion(firstQuestion) : d.title;
      return { ...d, title, messages };
    })
    .filter((d) => d.messages.length > 0);
}

function readStorage(key: string): Dialog[] {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return EMPTY;
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? sanitize(parsed as Dialog[]) : EMPTY;
  } catch {
    return EMPTY;
  }
}

function getStore(key: string): Store {
  let store = stores.get(key);
  if (!store) {
    store = { value: readStorage(key), listeners: new Set() };
    stores.set(key, store);
  }
  return store;
}

function updateStore(key: string, action: SetStateAction<Dialog[]>) {
  const store = getStore(key);
  const next = typeof action === "function" ? action(store.value) : action;
  if (next === store.value) return;
  store.value = next;
  store.listeners.forEach((l) => l());
  // Стрим пишет каждые ~26мс — сохраняем с задержкой, последний тик все равно попадет в storage
  if (store.saveTimer) clearTimeout(store.saveTimer);
  store.saveTimer = setTimeout(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(store.value));
    } catch {
      // storage недоступен (приватный режим, квота) — прототип продолжает работать в памяти
    }
  }, SAVE_DELAY_MS);
}

/** Состояние списка диалогов: с ключом — в localStorage, без ключа — обычный useState */
function useDialogsState(storageKey: string | null, initial: Dialog[]): [Dialog[], (action: SetStateAction<Dialog[]>) => void] {
  const [local, setLocal] = useState<Dialog[]>(initial);
  const subscribe = useCallback(
    (listener: () => void) => {
      if (!storageKey) return () => {};
      const store = getStore(storageKey);
      store.listeners.add(listener);
      return () => store.listeners.delete(listener);
    },
    [storageKey],
  );
  const stored = useSyncExternalStore(
    subscribe,
    () => (storageKey ? getStore(storageKey).value : EMPTY),
    () => EMPTY,
  );
  const setStored = useCallback((action: SetStateAction<Dialog[]>) => {
    if (storageKey) updateStore(storageKey, action);
  }, [storageKey]);
  return storageKey ? [stored, setStored] : [local, setLocal];
}

export function useDialogs(initialActiveId: string | null = null, initialDialogs: Dialog[] = DIALOGS, storageKey: string | null = null) {
  const [dialogs, setDialogs] = useDialogsState(storageKey, initialDialogs);
  const [activeId, setActiveId] = useState<string | null>(initialActiveId);
  const [generation, setGeneration] = useState<Generation | null>(null);
  const timers = useRef<{ think?: ReturnType<typeof setTimeout>; look?: ReturnType<typeof setTimeout>; tick?: ReturnType<typeof setInterval> }>({});

  const active = useMemo(() => dialogs.find((d) => d.id === activeId) ?? null, [dialogs, activeId]);

  const clearTimers = () => {
    if (timers.current.think) clearTimeout(timers.current.think);
    if (timers.current.look) clearTimeout(timers.current.look);
    if (timers.current.tick) clearInterval(timers.current.tick);
    timers.current = {};
  };

  useEffect(() => () => clearTimers(), []);

  const patchDialog = useCallback((id: string, patch: Partial<Dialog> | ((d: Dialog) => Partial<Dialog>)) => {
    setDialogs((prev) => prev.map((d) => (d.id === id ? { ...d, ...(typeof patch === "function" ? patch(d) : patch) } : d)));
  }, [setDialogs]);

  const patchMessage = useCallback(
    (dialogId: string, messageId: string, patch: Partial<Message> | ((m: Message) => Partial<Message>)) => {
      patchDialog(dialogId, (d) => ({
        messages: d.messages.map((m) => (m.id === messageId ? { ...m, ...(typeof patch === "function" ? patch(m) : patch) } : m)),
      }));
    },
    [patchDialog],
  );

  const selectDialog = useCallback((id: string | null) => setActiveId(id), []);
  const goHome = useCallback(() => setActiveId(null), []);

  const renameDialog = useCallback(
    (id: string, title: string) => {
      const clean = title.trim();
      if (clean) patchDialog(id, { title: clean });
    },
    [patchDialog],
  );

  const togglePin = useCallback((id: string) => patchDialog(id, (d) => ({ pinned: !d.pinned })), [patchDialog]);

  /** Встречи-контекст диалога (меняются через модалку «Добавление встреч») */
  const setDialogContext = useCallback((id: string, context: string[]) => patchDialog(id, { context }), [patchDialog]);

  /** Удаление с отменой: возвращает функцию undo */
  const deleteDialog = useCallback((id: string) => {
    let removed: Dialog | undefined;
    let index = -1;
    setDialogs((prev) => {
      index = prev.findIndex((d) => d.id === id);
      removed = prev[index];
      return prev.filter((d) => d.id !== id);
    });
    setActiveId((cur) => (cur === id ? null : cur));
    return () => {
      if (!removed) return;
      const back = removed;
      setDialogs((prev) => {
        if (prev.some((d) => d.id === back.id)) return prev;
        const next = [...prev];
        next.splice(Math.min(index, next.length), 0, back);
        return next;
      });
    };
  }, [setDialogs]);

  /** Шаг «Смотрю встречи…», затем стрим текста */
  const lookAndStream = useCallback(
    (dialogId: string, messageId: string, question: string, mode: Mode, context: string[]) => {
      const answer = generateAnswer(question, mode, context);
      if (answer.step) {
        patchMessage(dialogId, messageId, { step: answer.step, sources: answer.sources });
        setGeneration({ dialogId, messageId, phase: "looking" });
      } else {
        patchMessage(dialogId, messageId, { sources: answer.sources });
      }
      const startStream = () => {
        const words = answer.text.split(/(\s+)/);
        let i = 0;
        const startedAt = Date.now();
        setGeneration({ dialogId, messageId, phase: "streaming" });
        timers.current.tick = setInterval(() => {
          // Прогресс по времени: фоновые вкладки троттлят таймеры
          i = Math.max(i + 2, Math.floor((Date.now() - startedAt) / TICK_MS) * 2);
          patchMessage(dialogId, messageId, { text: words.slice(0, i).join("") });
          if (i >= words.length) {
            clearTimers();
            setGeneration(null);
          }
        }, TICK_MS);
      };
      timers.current.look = setTimeout(startStream, answer.step ? LOOK_MS : 200);
    },
    [patchMessage],
  );

  const sendMessage = useCallback(
    (payload: SendPayload) => {
      const text = payload.text.trim();
      if (!text) return null;
      clearTimers();

      const userMsg: Message = {
        id: nextId("msg"),
        role: "user",
        text,
        mode: payload.mode,
        meetingIds: payload.meetingIds.length ? payload.meetingIds : undefined,
        files: payload.files.length ? payload.files : undefined,
      };
      const assistantMsg: Message = { id: nextId("msg"), role: "assistant", text: "", mode: payload.mode };

      let dialogId = activeId;
      let context: string[];
      if (!dialogId) {
        dialogId = nextId("d");
        context = payload.meetingIds;
        const created: Dialog = {
          id: dialogId,
          title: titleFromQuestion(text),
          pinned: false,
          updatedAt: nowIso(),
          mode: payload.mode,
          context,
          messages: [userMsg, assistantMsg],
        };
        setDialogs((prev) => [created, ...prev]);
        setActiveId(dialogId);
      } else {
        const existing = dialogs.find((d) => d.id === dialogId);
        context = Array.from(new Set([...(existing?.context ?? []), ...payload.meetingIds]));
        patchDialog(dialogId, (d) => ({ messages: [...d.messages, userMsg, assistantMsg], updatedAt: nowIso(), mode: payload.mode, context }));
      }

      const finalId = dialogId;
      setGeneration({ dialogId: finalId, messageId: assistantMsg.id, phase: "thinking" });
      timers.current.think = setTimeout(() => {
        if (needsClarification(text, payload.mode)) {
          patchMessage(finalId, assistantMsg.id, {
            text: "Не очень понял вопрос, уточните пожалуйста, что вы имеете в виду?",
            clarify: { question: text, options: clarifyOptions(text) },
          });
          setGeneration({ dialogId: finalId, messageId: assistantMsg.id, phase: "clarify" });
          return;
        }
        lookAndStream(finalId, assistantMsg.id, text, payload.mode, context);
      }, THINK_MS);

      return dialogId;
    },
    [activeId, dialogs, patchDialog, patchMessage, lookAndStream, setDialogs],
  );

  /** Пользователь выбрал режим в уточнении — продолжаем ответ в этом режиме */
  const resolveClarification = useCallback(
    (dialogId: string, messageId: string, mode: Mode) => {
      const d = dialogs.find((x) => x.id === dialogId);
      const m = d?.messages.find((x) => x.id === messageId);
      if (!d || !m?.clarify) return;
      patchMessage(dialogId, messageId, { clarify: { ...m.clarify, chosen: mode }, text: "", mode });
      patchDialog(dialogId, { mode });
      setGeneration({ dialogId, messageId, phase: "thinking" });
      timers.current.think = setTimeout(() => lookAndStream(dialogId, messageId, m.clarify!.question, mode, d.context), 400);
    },
    [dialogs, patchDialog, patchMessage, lookAndStream],
  );

  const stopGenerating = useCallback(() => {
    clearTimers();
    setGeneration(null);
  }, []);

  return {
    dialogs,
    activeId,
    active,
    generation,
    isGenerating: generation !== null && generation.phase !== "clarify",
    awaitingClarification: generation?.phase === "clarify",
    selectDialog,
    goHome,
    renameDialog,
    togglePin,
    setDialogContext,
    deleteDialog,
    sendMessage,
    resolveClarification,
    stopGenerating,
  };
}

export type DialogsApi = ReturnType<typeof useDialogs>;
