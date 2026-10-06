// ─────────────────────────────────────────────────────────────────────────────
// Данные прототипа «Реферальная программа» (макет Федора, секция Figma 48467:788, 2026-10-06).
// Награду получает пригласивший за каждого приглашенного, который КУПИЛ подписку.
// Приглашенный при регистрации по ссылке получает скидку 30% на любой тариф, кроме Business.
// TODO: replace with real API
// ─────────────────────────────────────────────────────────────────────────────

export type Plan =
  | "registered" // зарегистрировался по ссылке, подписку пока не купил
  | "paid"; // купил подписку — засчитывается в награды

export type Referral = {
  id: string;
  email: string;
  /** ISO YYYY-MM-DD — дата регистрации */
  date: string;
  plan: Plan;
  /** Цвет аватарки, если нужен конкретный (как на макете); иначе — по хешу почты */
  avatar?: string;
};

export const isPaid = (r: Referral) => r.plan === "paid";

export type Milestone = {
  /** Сколько приглашенных с подпиской нужно */
  count: number;
  title: string;
  /** Иконка плашки: «PRO» — бейдж тарифа, остальное — svg из макета */
  icon: "pro" | "tennis" | "party";
};

/** Награды — тексты 1-в-1 с макета (обновление 2026-10-06: «оплаты» вместо «подписок») */
export const MILESTONES: Milestone[] = [
  { count: 3, title: "3 месяца Pro", icon: "pro" },
  { count: 10, title: "1 год Pro", icon: "pro" },
  { count: 35, title: "Pro навсегда", icon: "pro" },
  { count: 60, title: "200 тренировок по паделу с CEO mymeet.ai", icon: "tennis" },
  { count: 100, title: "Приглашение на новогодний корпоратив mymeet.ai", icon: "party" },
];

export const plural = (n: number, one: string, few: string, many: string) => {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
};

/** «3 оплаты», «10 оплат», «26 оплат» */
export const paysLabel = (n: number) => `${n} ${plural(n, "оплата", "оплаты", "оплат")}`;

/** Скидка приглашенному */
export const INVITEE_DISCOUNT = 30;

/** DD.MM.YYYY — как в таблице на макете */
export function fmtDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

/** Первые две буквы почты — инициалы на аватарке (как на макете: FE, AN, IV, EV) */
export const initials = (email: string) => email.slice(0, 2).toUpperCase();

const extra: [string, string, Plan][] = [
  ["olga@mymeet.ai", "2026-09-28", "paid"],
  ["dmitry@mymeet.ai", "2026-09-28", "paid"],
  ["anna@mymeet.ai", "2026-09-29", "paid"],
  ["sergey@mymeet.ai", "2026-09-29", "paid"],
  ["maria@mymeet.ai", "2026-09-29", "registered"],
  ["pavel@mymeet.ai", "2026-09-30", "paid"],
  ["natalia@mymeet.ai", "2026-09-30", "paid"],
  ["kirill@mymeet.ai", "2026-09-30", "paid"],
  ["elena@mymeet.ai", "2026-10-01", "paid"],
  ["roman@mymeet.ai", "2026-10-01", "paid"],
  ["yulia@mymeet.ai", "2026-10-01", "paid"],
  ["denis@mymeet.ai", "2026-10-01", "paid"],
  ["ksenia@mymeet.ai", "2026-10-02", "registered"],
  ["artem@mymeet.ai", "2026-10-02", "paid"],
  ["polina@mymeet.ai", "2026-10-02", "paid"],
  ["nikita@mymeet.ai", "2026-10-02", "paid"],
  ["daria@mymeet.ai", "2026-10-03", "paid"],
  ["maxim@mymeet.ai", "2026-10-03", "paid"],
  ["vera@mymeet.ai", "2026-10-03", "paid"],
  ["igor@mymeet.ai", "2026-10-04", "paid"],
  ["sofia@mymeet.ai", "2026-10-04", "paid"],
  ["gleb@mymeet.ai", "2026-10-04", "paid"],
  ["alina@mymeet.ai", "2026-10-05", "paid"],
  ["timur@mymeet.ai", "2026-10-05", "paid"],
  ["lida@mymeet.ai", "2026-10-05", "paid"],
  ["boris@mymeet.ai", "2026-10-06", "paid"],
];

/** Основной сценарий: первые четыре строки — 1-в-1 с макета, дальше добито до 26 оплат (как в счетчике на макете) */
export const REFERRALS: Referral[] = [
  { id: "r1", email: "fedos@mymeet.ai", date: "2026-08-05", plan: "registered", avatar: "#0138C7" },
  { id: "r2", email: "andrey@mymeet.ai", date: "2026-08-22", plan: "registered", avatar: "#0D9655" },
  { id: "r3", email: "ivan@mymeet.ai", date: "2026-09-17", plan: "paid", avatar: "#FF736A" },
  { id: "r4", email: "evgeniy@mymeet.ai", date: "2026-09-27", plan: "paid", avatar: "#FF9E2C" },
  ...extra.map(([email, date, plan], i) => ({ id: `r${i + 5}`, email, date, plan })),
];
