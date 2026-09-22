import { MEETINGS as CHAT_MEETINGS, type Thumb } from "../../global-chat/_shared/data";
import type { MeetingSource } from "../../search-filters/mock-data";

// ─────────────────────────────────────────────────────────────────────────────
// Данные прототипа «Теги»: два рабочих пространства одного пользователя.
// Теги принадлежат пространству и общие для всех его участников (решение с лидом 2026-09-21).
// TODO: replace with real API
// ─────────────────────────────────────────────────────────────────────────────

export type Workspace = { id: string; name: string; /** буква на плашке, если нет картинки */ initial: string; color: string };

export const WORKSPACES: Workspace[] = [
  { id: "ws-personal", name: "fz4884’s space", initial: "F", color: "#0138C7" },
  { id: "ws-team", name: "mymeet.ai team", initial: "M", color: "#8A38F5" },
];

export type TagMeeting = {
  id: string;
  workspaceId: string;
  title: string;
  date: string; // ISO YYYY-MM-DD
  time: string;
  durationMin: number;
  thumb: Thumb;
  source: MeetingSource;
  authorId: string;
  participants: string[];
  summary: string[];
};

/** «Сегодня» прототипа — день самой свежей встречи */
export const TODAY = "2026-09-03";

/** Встречи второго воркспейса — команда; автор «я» — u-fedos */
const TEAM_MEETINGS: TagMeeting[] = [
  {
    id: "t1",
    workspaceId: "ws-team",
    title: "Интервью с кандидатом на Senior Frontend",
    date: "2026-09-03",
    time: "13:00",
    durationMin: 60,
    thumb: "people",
    source: "google-meet",
    authorId: "u-fedos",
    participants: ["Федор", "Иван", "Кандидат"],
    summary: ["Сильный опыт с Next.js и анимациями", "Слабее в тестировании, но готов учиться", "Зовем на техническое собеседование"],
  },
  {
    id: "t2",
    workspaceId: "ws-team",
    title: "Синк маркетинга: план на Q4",
    date: "2026-09-02",
    time: "12:00",
    durationMin: 45,
    thumb: "photo2",
    source: "zoom",
    authorId: "u-ivanova",
    participants: ["Мария", "Анна", "Федор"],
    summary: ["Три рассылки про десктоп в октябре", "Лендинг тегов готовим к релизу", "Бюджет на подкасты пока не согласован"],
  },
  {
    id: "t3",
    workspaceId: "ws-team",
    title: "Тех-собеседование — бекенд",
    date: "2026-09-01",
    time: "16:00",
    durationMin: 50,
    thumb: "legacy",
    source: "telemost",
    authorId: "u-kuznetsov",
    participants: ["Иван", "Павел", "Кандидат"],
    summary: ["Уверенно решил задачу на очереди", "Опыт с MongoDB есть, с Quart нет", "Оффер обсуждаем в пятницу"],
  },
  {
    id: "t4",
    workspaceId: "ws-team",
    title: "Созвон с юристами по договору SaaS",
    date: "2026-08-29",
    time: "11:30",
    durationMin: 40,
    thumb: "photo3",
    source: "uploaded",
    authorId: "u-fedos",
    participants: ["Федор", "Юристы"],
    summary: ["Пункт о хранении записей переписываем", "Срок ответа на запрос клиента — 5 дней", "Финальную версию ждем к среде"],
  },
  {
    id: "t5",
    workspaceId: "ws-team",
    title: "Партнерский звонок с интегратором",
    date: "2026-08-28",
    time: "15:00",
    durationMin: 35,
    thumb: "photo1",
    source: "teams",
    authorId: "u-novikov",
    participants: ["Сергей", "Партнер"],
    summary: ["Интегратор берет внедрение в двух банках", "Нужна инструкция по SSO", "Следующий шаг — пилот на 50 мест"],
  },
  {
    id: "t6",
    workspaceId: "ws-team",
    title: "Онбординг нового дизайнера",
    date: "2026-08-27",
    time: "10:00",
    durationMin: 30,
    thumb: "people",
    source: "google-meet",
    authorId: "u-fedos",
    participants: ["Федор", "Ольга"],
    summary: ["Доступы в Figma и дизайн-лабу выданы", "Первая задача — иконки источников", "Синк по средам"],
  },
];

/** Встречи из прототипа глобального чата — первое (личное) пространство */
const PERSONAL_MEETINGS: TagMeeting[] = CHAT_MEETINGS.map((m) => ({
  id: m.id,
  workspaceId: "ws-personal",
  title: m.title,
  date: m.date,
  time: m.time,
  durationMin: m.durationMin,
  thumb: m.thumb,
  source: m.source,
  authorId: m.authorId,
  participants: m.participants,
  summary: m.summary,
}));

export const MEETINGS: TagMeeting[] = [...PERSONAL_MEETINGS, ...TEAM_MEETINGS];

export const meetingById = (id: string) => MEETINGS.find((m) => m.id === id);

/** Текущий пользователь прототипа */
export const ME_ID = "u-fedos";

// ─────────────────────────────────────────────────────────────────────────────
// Теги
// ─────────────────────────────────────────────────────────────────────────────

/** Цвет тега — кружок в чипе. Палитра из accent-цветов DS плюс нейтральный */
export type TagColor = "grey" | "blue" | "purple" | "orange" | "yellow" | "teal" | "green" | "red";

export const TAG_COLORS: { id: TagColor; hex: string; label: string }[] = [
  { id: "grey", hex: "#C7C8CA", label: "Серый" },
  { id: "blue", hex: "#0138C7", label: "Синий" },
  { id: "purple", hex: "#8A38F5", label: "Фиолетовый" },
  { id: "orange", hex: "#FF9E2C", label: "Оранжевый" },
  { id: "yellow", hex: "#F2C300", label: "Желтый" },
  { id: "teal", hex: "#0DACAA", label: "Бирюзовый" },
  { id: "green", hex: "#0D9655", label: "Зеленый" },
  { id: "red", hex: "#CC3333", label: "Красный" },
];

export const tagColorHex = (c: TagColor | undefined) => TAG_COLORS.find((x) => x.id === c)?.hex ?? TAG_COLORS[0].hex;

export type Tag = { id: string; name: string; createdAt: number; color: TagColor; workspaceId: string };

export type TagsState = {
  tags: Tag[];
  /** встреча → теги пространства, которые на ней стоят */
  assignments: Record<string, string[]>;
  workspaceId: string;
};

/** Стартовая разметка: у каждого пространства свой набор тегов */
export const SEED_STATE: TagsState = {
  tags: [
    { id: "tag-product", name: "Продукт", createdAt: 1, color: "blue", workspaceId: "ws-personal" },
    { id: "tag-clients", name: "Клиенты", createdAt: 2, color: "orange", workspaceId: "ws-personal" },
    { id: "tag-design", name: "Дизайн", createdAt: 3, color: "purple", workspaceId: "ws-personal" },
    { id: "tag-1on1", name: "1:1", createdAt: 4, color: "teal", workspaceId: "ws-personal" },
    { id: "tag-t-hiring", name: "Найм", createdAt: 5, color: "green", workspaceId: "ws-team" },
    { id: "tag-t-partners", name: "Партнеры", createdAt: 6, color: "orange", workspaceId: "ws-team" },
    { id: "tag-t-legal", name: "Юристы", createdAt: 7, color: "red", workspaceId: "ws-team" },
    { id: "tag-t-onboarding", name: "Онбординг", createdAt: 8, color: "teal", workspaceId: "ws-team" },
  ],
  assignments: {
    m1: ["tag-design", "tag-product"],
    m2: ["tag-product"],
    m3: ["tag-1on1"],
    m4: ["tag-clients"],
    m7: ["tag-product", "tag-design"],
    t1: ["tag-t-hiring"],
    t3: ["tag-t-hiring"],
    t4: ["tag-t-legal"],
    t5: ["tag-t-partners"],
    t6: ["tag-t-onboarding"],
  },
  workspaceId: "ws-personal",
};

const MONTHS_GENITIVE = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
const WEEKDAYS = ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];

export function parseISO(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function isoDaysBefore(iso: string, days: number) {
  const d = parseISO(iso);
  d.setDate(d.getDate() - days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function dateLabels(iso: string) {
  const d = parseISO(iso);
  const weekday = WEEKDAYS[d.getDay()];
  if (iso === TODAY) return { label: "Сегодня", subLabel: weekday };
  if (iso === isoDaysBefore(TODAY, 1)) return { label: "Вчера", subLabel: weekday };
  return { label: `${d.getDate()} ${MONTHS_GENITIVE[d.getMonth()]}`, subLabel: weekday };
}

/** «15.11.2022  13:40» — как в чипе даты на странице встречи */
export function formatDateTime(iso: string, time: string) {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}  ${time}`;
}

export function pluralMeetings(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} встреча`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${n} встречи`;
  return `${n} встреч`;
}

/** Родительный падеж: «с 12 встреч», «с 1 встречи» */
export function pluralMeetingsGen(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} встречи`;
  return `${n} встреч`;
}

export function pluralWorkspaces(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} пространстве`;
  return `${n} пространствах`;
}
