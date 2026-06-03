export type MeetingSource =
  | "uploaded"
  | "google-meet"
  | "extension"
  | "zoom"
  | "telemost"
  | "teams"
  | "kontur-tolk"
  | "jitsi"
  | "salute-jazz"
  | "trueconf"
  | "mts-link";

export type Author = {
  id: string;
  email: string;
  name: string;
  avatarColor: string;
};

export type ThumbKind =
  | "audio1"
  | "audio2"
  | "audio3"
  | "error"
  | "legacy"
  | "new"
  | "default"
  | "empty";

export type Meeting = {
  id: string;
  title: string;
  date: string;        // ISO "YYYY-MM-DD"
  startTime: string;   // "15:00"
  durationMin: number;
  authorId: string;
  source: MeetingSource;
  thumb: ThumbKind;
};

export const SOURCE_META: Record<
  MeetingSource,
  { label: string; icon: string }
> = {
  uploaded:     { label: "Загружено",        icon: "source-uploaded.svg" },
  "google-meet":{ label: "Google Meet",      icon: "source-google-meet.png" },
  extension:    { label: "Расширение",       icon: "source-extension.png" },
  zoom:         { label: "Zoom",             icon: "source-zoom.png" },
  telemost:     { label: "Я.Телемост",       icon: "source-telemost.png" },
  teams:        { label: "Microsoft Teams",  icon: "source-teams.png" },
  "kontur-tolk":{ label: "Контур.Толк",      icon: "source-kontur.png" },
  jitsi:        { label: "Jitsi",            icon: "source-jitsi.svg" },
  "salute-jazz":{ label: "SaluteJazz",       icon: "source-salute.png" },
  trueconf:     { label: "TrueConf",         icon: "source-trueconf.png" },
  "mts-link":   { label: "МТС Линк",         icon: "source-mts-link.svg" },
};

export const AUTHORS: Author[] = [
  { id: "u-fedos",   email: "d.fedorov@mymeet.ai",   name: "Дмитрий Федоров",   avatarColor: "#4F7CFF" },
  { id: "u-petrov",  email: "a.petrov@mymeet.ai",    name: "Алексей Петров",    avatarColor: "#F5A623" },
  { id: "u-ivanova", email: "m.ivanova@mymeet.ai",   name: "Мария Иванова",     avatarColor: "#E36FB8" },
  { id: "u-sidorova",email: "e.sidorova@mymeet.ai",  name: "Елена Сидорова",    avatarColor: "#2DBE8A" },
  { id: "u-kuznetsov",email: "i.kuznetsov@mymeet.ai",name: "Иван Кузнецов",     avatarColor: "#8B5CF6" },
  { id: "u-smirnova",email: "o.smirnova@mymeet.ai",  name: "Ольга Смирнова",    avatarColor: "#EF476F" },
  { id: "u-morozov", email: "p.morozov@mymeet.ai",   name: "Павел Морозов",     avatarColor: "#06B6D4" },
  { id: "u-volkova", email: "n.volkova@mymeet.ai",   name: "Наталья Волкова",   avatarColor: "#F97316" },
  { id: "u-novikov", email: "s.novikov@mymeet.ai",   name: "Сергей Новиков",    avatarColor: "#10B981" },
  { id: "u-lebedeva",email: "a.lebedeva@mymeet.ai",  name: "Анна Лебедева",     avatarColor: "#A855F7" },
];

export const MEETINGS: Meeting[] = [
  { id: "m-01", title: "Дизайн синк", date: "2026-04-24", startTime: "15:00", durationMin: 60, authorId: "u-fedos", source: "google-meet", thumb: "audio1" },
  { id: "m-02", title: "Еженедельный синк продуктовой команды", date: "2026-04-23", startTime: "11:30", durationMin: 45, authorId: "u-ivanova", source: "google-meet", thumb: "audio2" },
  { id: "m-03", title: "1:1 с Алексеем", date: "2026-04-23", startTime: "17:00", durationMin: 30, authorId: "u-petrov", source: "zoom", thumb: "default" },
  { id: "m-04", title: "Демо для клиента — банк Открытие", date: "2026-04-20", startTime: "14:00", durationMin: 55, authorId: "u-novikov", source: "telemost", thumb: "new" },
  { id: "m-05", title: "Ретро спринта 42", date: "2026-04-17", startTime: "18:00", durationMin: 75, authorId: "u-kuznetsov", source: "google-meet", thumb: "audio3" },
  { id: "m-06", title: "Интервью с кандидатом на Senior Frontend", date: "2026-04-15", startTime: "12:00", durationMin: 60, authorId: "u-sidorova", source: "teams", thumb: "default" },
  { id: "m-07", title: "Обсуждение нового онбординга", date: "2026-04-20", startTime: "10:30", durationMin: 50, authorId: "u-fedos", source: "google-meet", thumb: "audio1" },
  { id: "m-08", title: "Созвон с юристами по договору SaaS", date: "2026-04-15", startTime: "16:15", durationMin: 40, authorId: "u-lebedeva", source: "kontur-tolk", thumb: "legacy" },
  { id: "m-09", title: "Планёрка продаж B2B", date: "2026-03-30", startTime: "09:30", durationMin: 45, authorId: "u-morozov", source: "salute-jazz", thumb: "empty" },
  { id: "m-10", title: "Синк с командой mymeet.ai и обсуждение Framer", date: "2026-03-23", startTime: "15:00", durationMin: 124, authorId: "u-fedos", source: "google-meet", thumb: "audio2" },
  { id: "m-11", title: "Результаты спринта, синк", date: "2026-03-30", startTime: "17:30", durationMin: 60, authorId: "u-kuznetsov", source: "uploaded", thumb: "legacy" },
  { id: "m-12", title: "Квартальный ревью с CEO", date: "2026-03-23", startTime: "11:00", durationMin: 90, authorId: "u-ivanova", source: "zoom", thumb: "audio3" },
  { id: "m-13", title: "Research-интервью: сценарии использования AI-отчётов", date: "2026-02-20", startTime: "13:00", durationMin: 55, authorId: "u-smirnova", source: "uploaded", thumb: "default" },
  { id: "m-14", title: "Синк маркетинга: план на Q2", date: "2026-02-20", startTime: "10:00", durationMin: 65, authorId: "u-volkova", source: "mts-link", thumb: "audio1" },
  { id: "m-15", title: "Тех-собеседование — бекенд", date: "2026-01-28", startTime: "15:30", durationMin: 70, authorId: "u-kuznetsov", source: "jitsi", thumb: "error" },
  { id: "m-16", title: "Партнёрский звонок с интегратором", date: "2025-12-15", startTime: "16:00", durationMin: 40, authorId: "u-novikov", source: "trueconf", thumb: "default" },
  { id: "m-17", title: "Синк по редизайну лендинга", date: "2025-11-22", startTime: "12:30", durationMin: 50, authorId: "u-fedos", source: "extension", thumb: "audio2" },
  { id: "m-18", title: "Онбординг нового дизайнера", date: "2025-11-22", startTime: "14:00", durationMin: 30, authorId: "u-smirnova", source: "google-meet", thumb: "new" },
  { id: "m-19", title: "Созвон с командой саппорта", date: "2025-07-18", startTime: "11:00", durationMin: 35, authorId: "u-lebedeva", source: "mts-link", thumb: "audio3" },
  { id: "m-20", title: "Стратегическая сессия — вижен 2026", date: "2025-02-28", startTime: "10:00", durationMin: 120, authorId: "u-morozov", source: "uploaded", thumb: "default" },
];

export function getAuthor(id: string): Author {
  const a = AUTHORS.find((x) => x.id === id);
  if (!a) throw new Error(`Unknown author: ${id}`);
  return a;
}
