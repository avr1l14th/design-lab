import { tokens } from "./tokens";
import type { MeetingSource } from "../../search-filters/mock-data";

// ─────────────────────────────────────────────────────────────────────────────
// Режимы (по макету: иконка и цвет режима окрашивают «Салют!» и подсказки)
// ─────────────────────────────────────────────────────────────────────────────

export type Mode = "auto" | "ask" | "analytics";

/** Режимы внутренние: пользователь их не выбирает, роутер решает сам. Цвета остались у аватаров в карточках уточнения */
export type ModeDef = {
  id: Mode;
  label: string;
  color: string;
};

export const MODES: ModeDef[] = [
  { id: "auto", label: "Авто", color: tokens.blue },
  { id: "ask", label: "Спросить", color: tokens.orange },
  { id: "analytics", label: "Аналитика", color: tokens.purple },
];

export const modeById = (id: Mode) => MODES.find((m) => m.id === id) ?? MODES[0];

// ─────────────────────────────────────────────────────────────────────────────
// Встречи (контекст и источники цитат)
// ─────────────────────────────────────────────────────────────────────────────

export type Thumb = "photo1" | "photo2" | "photo3" | "people" | "legacy";

export type ChatMeeting = {
  id: string;
  title: string;
  date: string; // ISO YYYY-MM-DD
  time: string;
  durationMin: number;
  thumb: Thumb;
  participants: string[];
  /** тезисы для поповера цитаты */
  summary: string[];
  /** источник и автор — для фильтров из прототипа «Поиск и фильтры» */
  source: MeetingSource;
  authorId: string;
};

export const TODAY = "2026-09-03";

export const MEETINGS: ChatMeeting[] = [
  {
    id: "m1",
    title: "Дизайн-синк",
    date: "2026-09-03",
    time: "11:00",
    durationMin: 45,
    thumb: "photo1",
    participants: ["Федор", "Андрей", "Саша"],
    summary: ["Выполненные задачи остаются на месте, без перелета вниз", "Копирование задач по активной вкладке исполнителя", "Постановщика задачи из прототипа убираем"],
    source: "google-meet",
    authorId: "u-fedos",
  },
  {
    id: "m2",
    title: "Еженедельный синк продуктовой команды",
    date: "2026-09-02",
    time: "15:00",
    durationMin: 60,
    thumb: "photo2",
    participants: ["Мария", "Федор", "Иван", "Ольга"],
    summary: ["Онбординг сокращаем до 3 шагов", "Промо десктопа — A/B-тест, дедлайн не назначен", "Тексты шагов ждут ревью маркетинга"],
    source: "google-meet",
    authorId: "u-ivanova",
  },
  {
    id: "m3",
    title: "1:1 с Алексеем",
    date: "2026-09-02",
    time: "17:30",
    durationMin: 30,
    thumb: "people",
    participants: ["Федор", "Алексей"],
    summary: ["План перехода на новый плеер до 10 сентября", "Метрики времени обработки встреч за август", "Доступ к дашборду аналитики"],
    source: "zoom",
    authorId: "u-fedos",
  },
  {
    id: "m4",
    title: "Демо для клиента — банк Открытие",
    date: "2026-09-01",
    time: "14:00",
    durationMin: 55,
    thumb: "photo3",
    participants: ["Сергей", "Наталья", "Клиент"],
    summary: ["Вопросы про безопасность хранения записей", "Нужна интеграция с Контур.Толк", "Цена за пользователя при 200+ сотрудниках"],
    source: "telemost",
    authorId: "u-novikov",
  },
  {
    id: "m5",
    title: "Ретро спринта 42",
    date: "2026-08-29",
    time: "18:00",
    durationMin: 75,
    thumb: "photo1",
    participants: ["Иван", "Мария", "Федор", "Павел"],
    summary: ["Релиз плеера задержался из-за поздних правок дизайна", "Тесты интеграции с Zoom падали на нестабильном стенде", "Закрывать дизайн за два дня до конца спринта"],
    source: "google-meet",
    authorId: "u-kuznetsov",
  },
  {
    id: "m6",
    title: "Планерка продаж B2B",
    date: "2026-08-28",
    time: "09:30",
    durationMin: 45,
    thumb: "legacy",
    participants: ["Павел", "Сергей", "Наталья"],
    summary: ["Заготовки на возражения про безопасность и ВКС", "Enterprise-тариф в скрипт демо не включен", "Одностраничник по безопасности — подготовить"],
    source: "uploaded",
    authorId: "u-morozov",
  },
  {
    id: "m7",
    title: "Обсуждение нового онбординга",
    date: "2026-08-27",
    time: "10:30",
    durationMin: 50,
    thumb: "photo2",
    participants: ["Федор", "Мария", "Анна"],
    summary: ["Первый отчет генерируем на демо-встрече автоматически", "Кнопка «Пропустить» только на шаге с ролью", "Шаги «цели» и «тариф» уходят в настройки"],
    source: "google-meet",
    authorId: "u-fedos",
  },
  {
    id: "m8",
    title: "Квартальный ревью с CEO",
    date: "2026-08-25",
    time: "11:00",
    durationMin: 90,
    thumb: "photo3",
    participants: ["Мария", "Павел", "Иван", "Федор"],
    summary: ["Фокус квартала — B2B и интеграции", "Найм двух разработчиков до конца октября", "Пересмотр тарифной сетки в Q4"],
    source: "teams",
    authorId: "u-ivanova",
  },
  {
    id: "m9",
    title: "Интервью с кандидатом на Senior Frontend",
    date: "2026-08-22",
    time: "12:00",
    durationMin: 60,
    thumb: "people",
    participants: ["Елена", "Иван"],
    summary: ["Сильный опыт с React и анимациями", "Слабее в тестировании", "Рекомендация — второй этап с командой"],
    source: "teams",
    authorId: "u-sidorova",
  },
  {
    id: "m10",
    title: "Синк маркетинга: план на Q4",
    date: "2026-08-20",
    time: "10:00",
    durationMin: 65,
    thumb: "photo1",
    participants: ["Наталья", "Ольга", "Федор"],
    summary: ["Кампания «AI-отчеты для продаж» в октябре", "Две интеграционные статьи в месяц", "Вебинар с партнером в ноябре"],
    source: "google-meet",
    authorId: "u-volkova",
  },
  {
    id: "m11",
    title: "Созвон с юристами по договору SaaS",
    date: "2026-08-18",
    time: "16:15",
    durationMin: 40,
    thumb: "legacy",
    participants: ["Анна", "Павел"],
    summary: ["Убрать автопродление без уведомления за 30 дней", "Хранение записей на серверах в РФ", "Лимит компенсации за простой"],
    source: "kontur-tolk",
    authorId: "u-lebedeva",
  },
  {
    id: "m12",
    title: "Research-интервью: сценарии AI-отчетов",
    date: "2026-08-14",
    time: "13:00",
    durationMin: 55,
    thumb: "photo2",
    participants: ["Ольга", "Федор"],
    summary: ["Пользователи хотят отчет по нескольким встречам сразу", "Шаблоны отчетов путают", "Экспорт в Notion — частый запрос"],
    source: "zoom",
    authorId: "u-smirnova",
  },
];

export const meetingById = (id: string) => MEETINGS.find((m) => m.id === id);

const MONTHS_SHORT = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
const MONTHS_GEN = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];

/** «2 сен» — даты в списке предыдущих чатов */
export function formatShortDate(iso: string) {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  return `${d.getUTCDate()} ${MONTHS_SHORT[d.getUTCMonth()]}`;
}

/** «28 августа» — даты в поповере цитаты и в списке просмотренных встреч */
export function formatLongDate(iso: string) {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  return `${d.getUTCDate()} ${MONTHS_GEN[d.getUTCMonth()]}`;
}

export function pluralMeetings(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} встреча`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${n} встречи`;
  return `${n} встреч`;
}

/** «Добавить 4 встречи» — винительный падеж */
export function pluralMeetingsAcc(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} встречу`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${n} встречи`;
  return `${n} встреч`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Вложения, сообщения, диалоги
// ─────────────────────────────────────────────────────────────────────────────

export type FileAttachment = { id: string; name: string; ext: string; size: string };

/** Источник из интернета (46761:8022): фавиконка, заголовок страницы, домен */
export type WebSource = { title: string; domain: string; favicon: string };

/** Таблица в ответе (46753:7815) */
export type AnswerTable = { head: string[]; rows: string[][] };

export type ClarifyOption = { mode: Mode; label: string; description: string };

export type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  mode?: Mode;
  /** встречи, приложенные к вопросу */
  meetingIds?: string[];
  files?: FileAttachment[];
  /** шаг «Смотрю встречи…» с раскрывающимся списком */
  step?: { label: string; meetingIds: string[] };
  /** уточнение режима: варианты и выбранный */
  clarify?: { question: string; options: ClarifyOption[]; chosen?: Mode };
  /** источники цитат [1], [2]… — порядок совпадает с номерами */
  sources?: string[];
  /** сколько секунд модель думала — статус «Думал N сек...» после думанья */
  thoughtSec?: number;
  /** вопрос про сам сервис (46738:7318): вместо ответа три карточки, куда идти */
  support?: boolean;
  /** ответ из интернета (46761:7869): источники вместо встреч, цитаты-ссылки */
  web?: WebSource[];
  /** таблица в ответе (46753:7230) */
  table?: AnswerTable;
  /** файл как результат ответа (46753:7914) */
  file?: Omit<FileAttachment, "id">;
  /** бесплатные вопросы кончились (46763:8520): вместо ответа плашка с апгрейдом */
  limited?: boolean;
};

export type Dialog = {
  id: string;
  title: string;
  pinned: boolean;
  updatedAt: string; // ISO datetime
  mode: Mode;
  context: string[];
  messages: Message[];
  /** Ответ пришел, пока диалог не был открыт — в списках у строки «Готово» до первого открытия */
  unread?: boolean;
};

// Стартуем счетчик от времени: при hot reload модуль пересоздается, а старые id остаются в состоянии
let idCounter = Date.now() % 1_000_000;
export const nextId = (prefix = "id") => `${prefix}-${++idCounter}`;

export const DIALOGS: Dialog[] = [
  {
    id: "d1",
    title: "Что в итоге решили делать?",
    pinned: false,
    updatedAt: "2026-09-02T16:20:00",
    mode: "auto",
    context: ["m2", "m7"],
    messages: [
      { id: "d1-1", role: "user", text: "Что в итоге решили делать с онбордингом?", mode: "auto", meetingIds: ["m2", "m7"] },
      {
        id: "d1-2",
        role: "assistant",
        thoughtSec: 16,
        mode: "auto",
        step: { label: "Смотрю встречи по онбордингу", meetingIds: ["m2", "m7"] },
        sources: ["m7", "m2"],
        text: `Онбординг сокращаем и переносим часть шагов в настройки:
- Остаются три шага: источник встреч, роль и формат отчета. Шаги «цели» и «тариф» уходят в настройки. [1]
- Первый отчет генерируем автоматически на демо-встрече, чтобы ценность была видна до подключения календаря. [1]
- Открытым остался вопрос про промо десктопа внутри онбординга — Мария предложила A/B-тест, дедлайн не назначен. [2]`,
      },
    ],
  },
  {
    id: "d2",
    title: "Возражения клиентов на демо",
    pinned: false,
    updatedAt: "2026-09-01T18:05:00",
    mode: "analytics",
    context: ["m4", "m6"],
    messages: [
      { id: "d2-1", role: "user", text: "Сравни возражения на демо звонках с тем, что готовили на планерке продаж", mode: "analytics", meetingIds: ["m4", "m6"] },
      {
        id: "d2-2",
        role: "assistant",
        thoughtSec: 9,
        mode: "analytics",
        step: { label: "Смотрю демо и планерку продаж", meetingIds: ["m4", "m6"] },
        sources: ["m4", "m6"],
        text: `Заготовки сработали на две из трех тем:
- Безопасность хранения записей и интеграция с Контур.Толк были в списке ожидаемых возражений — ответы были готовы. [1]
- Цену для команд от 200 человек не прорабатывали: Сергей отвечал импровизацией, без ссылки на Enterprise-тариф. [2]
- После встречи клиент просил одностраничник по безопасности — его еще нет. [1]
Рекомендация: добавить в скрипт демо блок про Enterprise-тариф и подготовить одностраничник.`,
      },
    ],
  },
  {
    id: "d3",
    title: "Задачи Алексея после 1:1",
    pinned: false,
    updatedAt: "2026-08-28T12:40:00",
    mode: "ask",
    context: ["m3"],
    messages: [
      { id: "d3-1", role: "user", text: "Какие задачи взял Алексей на 1:1?", mode: "ask", meetingIds: ["m3"] },
      {
        id: "d3-2",
        role: "assistant",
        thoughtSec: 12,
        mode: "ask",
        step: { label: "Смотрю встречу 1:1 с Алексеем", meetingIds: ["m3"] },
        sources: ["m3"],
        text: `Алексей взял две задачи: подготовить план перехода на новый плеер до 10 сентября и собрать метрики по времени обработки встреч за август. [1] Вы обещали дать ему доступ к дашборду аналитики.`,
      },
    ],
  },
  {
    id: "d5",
    title: "Итоги ретро 42",
    pinned: false,
    updatedAt: "2026-08-25T20:15:00",
    mode: "auto",
    context: ["m5"],
    messages: [
      { id: "d5-1", role: "user", text: "Кратко: что пошло не так в спринте 42 и что решили менять?", mode: "auto", meetingIds: ["m5"] },
      {
        id: "d5-2",
        role: "assistant",
        thoughtSec: 7,
        mode: "auto",
        step: { label: "Смотрю ретро спринта 42", meetingIds: ["m5"] },
        sources: ["m5"],
        text: `Не так пошли две вещи: релиз плеера задержался из-за поздних правок дизайна, а тесты интеграции с Zoom падали из-за нестабильного стенда. [1] Решили закрывать дизайн за два дня до конца спринта и выделить Павла на стабилизацию стенда. [1]`,
      },
    ],
  },
];

export function sortDialogs(dialogs: Dialog[]) {
  return [...dialogs].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.updatedAt.localeCompare(a.updatedAt);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Подсказки на стартовой
// ─────────────────────────────────────────────────────────────────────────────

export type Suggestion = { text: string; mode: Mode };

/** Подсказки под композером на стартовой (46724:12963): персональные, собраны из встреч пользователя по шаблонам
 *  «Что решили на {название} {когда}?», «Какие договоренности у меня с {участник}?», «Сравни {повторяющиеся встречи} за месяц» */
export const SUGGESTIONS: Suggestion[] = [
  { text: "Что решили на дизайн-синке вчера?", mode: "auto" },
  { text: "Какие договоренности у меня с Алексеем?", mode: "auto" },
  { text: "Сравни демо для клиентов за месяц", mode: "auto" },
];

/** Обезличенные подсказки для аккаунта без встреч (46724:10732) */
export const ZERO_SUGGESTIONS: Suggestion[] = [
  { text: "Что важного было на встречах за эту неделю?", mode: "auto" },
  { text: "Какие договоренности и дедлайны у меня на этой неделе?", mode: "auto" },
  { text: "Что я пропустил на встречах, пока меня не было?", mode: "auto" },
];

/** Образцы файлов для скрепки (46726:16060): первый клик — PDF, второй — DOCX */
export const SAMPLE_FILES: Omit<FileAttachment, "id">[] = [
  { name: "telemost-11-march-2026", ext: "PDF", size: "164 КБ" },
  { name: "Письмо_заинтересованности_шаблон", ext: "DOCX", size: "164 КБ" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Генерация ответа (мок)
// ─────────────────────────────────────────────────────────────────────────────

const ANALYTICS_RE = /проанализ|сравни|тренд|динамик|почему|разбер|подробн|глубок|аналит|выдели|систематиз|риск/i;

export function resolveAutoMode(question: string): Mode {
  if (ANALYTICS_RE.test(question)) return "analytics";
  return "ask";
}

/**
 * «Авто» переспрашивает, когда вопрос можно понять и как просьбу об анализе,
 * и как быстрый вопрос: есть слово «анализ», но нет явного глагола
 */
/** Вопрос про сам сервис, а не про встречи: как подключить, тариф, поддержка и т.п. — чат отправляет в базу знаний и поддержку */
const SUPPORT_RE = /как (подключ|настро|подел|экспорт|удал|измен|добав|включ|отключ|оплат)|тариф|где найти|как работает|не работает|поддержк|mcp|календар|интеграци|оплат/i;
export function isProductQuestion(question: string) {
  return SUPPORT_RE.test(question);
}

export function needsClarification(question: string, mode: Mode) {
  if (mode !== "auto") return false;
  return /анализ/i.test(question) && !/проанализируй|сравни|разбери/i.test(question);
}

export function clarifyOptions(): ClarifyOption[] {
  return [
    { mode: "analytics", label: "Проанализировать", description: "Проанализировать и подробно разобрать встречи" },
    { mode: "ask", label: "Просто спросить", description: "Быстро задать вопрос по встречам" },
  ];
}

const RECENT_WEEK = ["m1", "m2", "m3", "m4", "m5"];

/** Источники для ответа из интернета — из макета 46761:8022 */
export const WEB_SOURCES: WebSource[] = [
  { title: "K Definition & Meaning | Dictionary.com", domain: "dictionary.com", favicon: "fav-dictionary.png" },
  { title: "What does \"K\" mean? - Quora", domain: "quora.com", favicon: "fav-quora.png" },
  { title: "Why do we use the letter 'K' for a 'Thousand'? - YouTube", domain: "youtube.com", favicon: "fav-youtube.png" },
  { title: "K - Wikipedia", domain: "en.wikipedia.org", favicon: "fav-wikipedia.png" },
];

/** Общий вопрос не про встречи: чат идет в интернет (46761:7869) */
const GENERAL_RE = /^(кто|что такое|что значит|что означает|сколько|где|когда|почему|зачем|какой|какая)(?=\s|$)/i;
/** Явная просьба поискать в интернете — идем в веб независимо от формы вопроса */
const WEB_RE = /интернет|в сети|погугл|гугл|поищи|найди в|в вебе|онлайн/i;
const MEETING_RE = /встреч|синк|ретро|демо|созвон|команд|клиент|обсужд|решил|договор/i;
export function isGeneralQuestion(question: string) {
  if (WEB_RE.test(question)) return true;
  return GENERAL_RE.test(question.trim()) && !MEETING_RE.test(question);
}

const TABLE_ANSWER: AnswerTable = {
  head: ["Шаг", "Что сделать", "Результат"],
  rows: [
    ["1. Освободить стол", "Убрать все, что не связано с текущей задачей", "Больше порядка и меньше отвлечений"],
    ["2. Настроить кресло", "Поставить стопы на пол, выпрямить спину, расслабить плечи", "Более комфортная поза"],
    ["4. Настроить освещение", "Поставить его прямо перед собой, немного ниже уровня глаз", "Меньше нагрузки на шею и глаза"],
    ["5. Подготовить компьютер", "Убрать блики, направить свет сбоку или сзади", "Комфортная работа с экраном"],
    ["6. Ограничить уведомления", "Отключить второстепенные звуки и всплывающие сообщения", "Меньше перерывов и отвлечений"],
  ],
};

export function generateAnswer(question: string, mode: Mode, contextIds: string[]): { resolvedMode: Mode; sources: string[]; step?: { label: string; meetingIds: string[] }; text: string; extra?: Partial<Message> } {
  const resolved: Mode = mode === "auto" ? resolveAutoMode(question) : mode;
  const sources = contextIds.length ? contextIds.slice(0, 3) : RECENT_WEEK.slice(0, 3);
  const stepLabel = contextIds.length ? `Смотрю ${pluralMeetingsAcc(contextIds.length)} из контекста` : "Смотрю встречи за последнюю неделю";
  const stepMeetings = contextIds.length ? contextIds : RECENT_WEEK;

  // Общий вопрос — ответ из интернета: шаг «Поискал в интернете» со списком источников, цитаты ведут на сайты
  if (isGeneralQuestion(question)) {
    return {
      resolvedMode: resolved,
      sources: [],
      step: { label: "", meetingIds: [] },
      extra: { web: WEB_SOURCES },
      text: `K — это сокращение от «кило», приставки со значением «тысяча»: 10K означает 10 000. [1] В переписке K часто используют и как короткое «okay», особенно в англоязычных чатах. [2]
- В финансах и вакансиях K пишут после суммы: 120K это 120 тысяч. [3]
- Происхождение — греческое chilioi, «тысяча», через французское kilo. [4]`,
    };
  }

  // Просьба про таблицу — ответ с таблицей (46753:7230)
  if (/таблиц/i.test(question)) {
    return {
      resolvedMode: resolved,
      sources: [],
      extra: { table: TABLE_ANSWER },
      text: "Конечно. Вот краткая таблица быстрой настройки рабочего пространства:",
    };
  }

  // Просьба про файл — ответ с карточкой для скачивания (46753:7914)
  if (/pdf|docx|docs?\b|документ|файл|фаил|выжимк|скачать|скачива|экспортируй|сохрани в|в word|в ворд|в эксел|xlsx|презентац/i.test(question)) {
    return {
      resolvedMode: resolved,
      sources: [],
      step: { label: "", meetingIds: stepMeetings },
      extra: { file: { name: "Meeting analytics", ext: "PDF", size: "164 КБ" } },
      text: "Собрал главное по встречам за неделю в один документ:",
    };
  }

  if (resolved === "analytics") {
    const n = sources.length;
    const total = stepMeetings.length;
    return {
      resolvedMode: resolved,
      sources,
      step: { label: stepLabel, meetingIds: stepMeetings },
      text: `Главное по ${total === 1 ? "встрече" : `${total} встречам`} — три наблюдения:
  - Решения принимаются быстро, но без назначенных ответственных: в двух случаях задача осталась «на команде». [1]
  - Сроки называются устно и не фиксируются: один дедлайн с прошлой недели уже прошел без апдейта. [2]
${n > 2 ? "  - Больше всего времени уходит на приоритеты, а не на статусы — хороший знак для зрелости команды. [3]\n" : ""}- Coverage note: прочитал ${pluralMeetingsAcc(stepMeetings.length)} за последние 7 дней. Выводы опираются на ${n === 1 ? "одну содержательную заметку" : `${n} содержательные заметки`}.`,
    };
  }

  return {
    resolvedMode: resolved,
    sources: sources.slice(0, 2),
    step: { label: stepLabel, meetingIds: stepMeetings },
    text: `Да, это обсуждали. Команда согласовала подход и назначила ответственного, дедлайн — конец следующей недели. [1] Открытым остался вопрос про интеграцию с календарем — его перенесли на следующий синк. [2]`,
  };
}

/** Заголовок нового диалога по первому вопросу */
/** Заголовок диалога — вопрос целиком; режем только совсем длинные, в строках списка текст сам уходит в троеточие по ширине */
export function titleFromQuestion(q: string) {
  const clean = q.replace(/[?!.]+$/g, "").trim();
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  if (clean.length <= 120) return cap(clean);
  const cut = clean.slice(0, 120);
  const lastSpace = cut.lastIndexOf(" ");
  return cap(`${cut.slice(0, lastSpace > 60 ? lastSpace : 120)}…`);
}

/** Мок-timestamp «сейчас» в контексте прототипа */
export function nowIso() {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${TODAY}T${hh}:${mm}:00`;
}

export const SHARE_LINK = "https://app.mymeet.ai/chat/s/7fK2q-9xLm";
