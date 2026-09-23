"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import {
  MEETINGS,
  SEED_STATE,
  TAG_COLORS,
  WORKSPACES,
  type Tag,
  type TagColor,
  type TagsState,
} from "./data";
import { STORAGE_KEY, TAG_NAME_MAX } from "./tokens";

// ─────────────────────────────────────────────────────────────────────────────
// Хранилище тегов: внешний стор + localStorage, как диалоги в глобальном чате.
// На сервере и при гидрации — стартовая разметка, на клиенте — сохраненная.
// Теги принадлежат пространству и видны всем его участникам без ролей: у тега есть
// workspaceId, хук отдает только теги текущего пространства.
// ─────────────────────────────────────────────────────────────────────────────

type Store = { value: TagsState; listeners: Set<() => void> };
let store: Store | null = null;

function readStorage(): TagsState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_STATE;
    const parsed = JSON.parse(raw) as Partial<TagsState>;
    if (
      !parsed ||
      !Array.isArray(parsed.tags) ||
      typeof parsed.assignments !== "object"
    )
      return SEED_STATE;
    const workspaceId = WORKSPACES.some((w) => w.id === parsed.workspaceId)
      ? (parsed.workspaceId as string)
      : SEED_STATE.workspaceId;
    // Сохраненное состояние старой модели (без workspaceId у тегов) не переносим — начинаем с сида
    if (parsed.tags.some((t) => !t.workspaceId)) return SEED_STATE;
    const tags = parsed.tags.map((t, i) => ({
      ...t,
      color: t.color ?? TAG_COLORS[(i % (TAG_COLORS.length - 1)) + 1].id,
    }));
    return { tags, assignments: parsed.assignments ?? {}, workspaceId };
  } catch {
    return SEED_STATE;
  }
}

function getStore(): Store {
  if (!store) store = { value: readStorage(), listeners: new Set() };
  return store;
}

function update(next: TagsState) {
  const s = getStore();
  if (next === s.value) return;
  s.value = next;
  s.listeners.forEach((l) => l());
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // storage недоступен — прототип живет в памяти
  }
}

const subscribe = (listener: () => void) => {
  const s = getStore();
  s.listeners.add(listener);
  return () => {
    s.listeners.delete(listener);
  };
};

/** Имя для сравнения: без хвостовых пробелов, без учета регистра */
export const normalizeName = (name: string) =>
  name.trim().replace(/\s+/g, " ").toLowerCase();

export const cleanName = (name: string) =>
  name.trim().replace(/\s+/g, " ").slice(0, TAG_NAME_MAX);

export type TagUsage = { meetings: number };

/** Снимок для «Отменить» после удаления тега */
export type RemovedTag = { tag: Tag; assignments: Record<string, string[]> };

let idCounter = 0;
const nextId = () => `tag-${Date.now().toString(36)}-${++idCounter}`;

export function useTags() {
  const state = useSyncExternalStore(
    subscribe,
    () => getStore().value,
    () => SEED_STATE,
  );

  const workspace =
    WORKSPACES.find((w) => w.id === state.workspaceId) ?? WORKSPACES[0];
  /** Теги текущего пространства по алфавиту */
  // Порядок — по времени создания, от старых к новым (дизайнер 2026-09-23: не по алфавиту)
  const tags = useMemo(
    () =>
      state.tags
        .filter((t) => t.workspaceId === workspace.id)
        .sort((a, b) => a.createdAt - b.createdAt),
    [state.tags, workspace.id],
  );
  const tagById = useCallback(
    (id: string) => state.tags.find((t) => t.id === id),
    [state.tags],
  );

  /** Теги встречи в порядке, в котором их ставили */
  const tagsFor = useCallback(
    (meetingId: string): Tag[] =>
      (state.assignments[meetingId] ?? [])
        .map((id) => state.tags.find((t) => t.id === id))
        .filter((t): t is Tag => Boolean(t)),
    [state.assignments, state.tags],
  );

  const findByName = useCallback(
    (name: string) =>
      tags.find((t) => normalizeName(t.name) === normalizeName(name)),
    [tags],
  );

  const usage = useCallback(
    (tagId: string): TagUsage => {
      let meetings = 0;
      for (const ids of Object.values(state.assignments))
        if (ids.includes(tagId)) meetings += 1;
      return { meetings };
    },
    [state.assignments],
  );

  /** Теги, которые стоят хотя бы на одной встрече этого пространства */
  const tagsUsedIn = useCallback(
    (workspaceId: string): Tag[] => {
      const used = new Set<string>();
      for (const m of MEETINGS) {
        if (m.workspaceId !== workspaceId) continue;
        for (const id of state.assignments[m.id] ?? []) used.add(id);
      }
      return state.tags
        .filter((t) => t.workspaceId === workspaceId && used.has(t.id))
        .sort((a, b) => a.createdAt - b.createdAt);
    },
    [state.assignments, state.tags],
  );

  const toggle = useCallback((meetingId: string, tagId: string) => {
    const s = getStore().value;
    const current = s.assignments[meetingId] ?? [];
    const next = current.includes(tagId)
      ? current.filter((id) => id !== tagId)
      : [...current, tagId];
    update({ ...s, assignments: { ...s.assignments, [meetingId]: next } });
  }, []);

  /** Создает тег в пространстве встречи (или текущем); при совпадении имени возвращает существующий. Цвет — заданный или следующий по кругу */
  const create = useCallback(
    (rawName: string, assignTo?: string, color?: TagColor): Tag | null => {
      const name = cleanName(rawName);
      if (!name) return null;
      const s = getStore().value;
      const wsId =
        (assignTo && MEETINGS.find((m) => m.id === assignTo)?.workspaceId) ||
        s.workspaceId;
      const wsTags = s.tags.filter((t) => t.workspaceId === wsId);
      const existing = wsTags.find(
        (t) => normalizeName(t.name) === normalizeName(name),
      );
      const palette = TAG_COLORS.slice(1);
      const autoColor = palette[wsTags.length % palette.length].id;
      const tag: Tag = existing ?? {
        id: nextId(),
        name,
        createdAt: Date.now(),
        color: color ?? autoColor,
        workspaceId: wsId,
      };
      const tagsNext = existing ? s.tags : [...s.tags, tag];
      let assignments = s.assignments;
      if (assignTo) {
        const current = s.assignments[assignTo] ?? [];
        if (!current.includes(tag.id))
          assignments = { ...s.assignments, [assignTo]: [...current, tag.id] };
      }
      update({ ...s, tags: tagsNext, assignments });
      return tag;
    },
    [],
  );

  /** Переименование; возвращает false, если такое имя уже занято другим тегом */
  const rename = useCallback((tagId: string, rawName: string): boolean => {
    const name = cleanName(rawName);
    if (!name) return false;
    const s = getStore().value;
    const self = s.tags.find((t) => t.id === tagId);
    const clash = s.tags.find(
      (t) =>
        t.id !== tagId &&
        t.workspaceId === self?.workspaceId &&
        normalizeName(t.name) === normalizeName(name),
    );
    if (clash) return false;
    update({
      ...s,
      tags: s.tags.map((t) => (t.id === tagId ? { ...t, name } : t)),
    });
    return true;
  }, []);

  const setColor = useCallback((tagId: string, color: TagColor) => {
    const s = getStore().value;
    update({
      ...s,
      tags: s.tags.map((t) => (t.id === tagId ? { ...t, color } : t)),
    });
  }, []);

  const remove = useCallback((tagId: string): RemovedTag | null => {
    const s = getStore().value;
    const tag = s.tags.find((t) => t.id === tagId);
    if (!tag) return null;
    const removedAssignments: Record<string, string[]> = {};
    const assignments: Record<string, string[]> = {};
    for (const [meetingId, ids] of Object.entries(s.assignments)) {
      if (ids.includes(tagId)) removedAssignments[meetingId] = ids;
      assignments[meetingId] = ids.filter((id) => id !== tagId);
    }
    update({ ...s, tags: s.tags.filter((t) => t.id !== tagId), assignments });
    return { tag, assignments: removedAssignments };
  }, []);

  const restore = useCallback((snapshot: RemovedTag) => {
    const s = getStore().value;
    if (s.tags.some((t) => t.id === snapshot.tag.id)) return;
    update({
      ...s,
      tags: [...s.tags, snapshot.tag],
      assignments: { ...s.assignments, ...snapshot.assignments },
    });
  }, []);

  const setWorkspace = useCallback((workspaceId: string) => {
    const s = getStore().value;
    if (s.workspaceId === workspaceId) return;
    update({ ...s, workspaceId });
  }, []);

  return {
    tags,
    tagById,
    tagsFor,
    findByName,
    usage,
    tagsUsedIn,
    toggle,
    create,
    rename,
    setColor,
    remove,
    restore,
    workspace,
    setWorkspace,
  };
}

export type TagsApi = ReturnType<typeof useTags>;
