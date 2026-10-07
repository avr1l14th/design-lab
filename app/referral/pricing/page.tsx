"use client";

import { Inter } from "next/font/google";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { DevPanel } from "../_shared/DevPanel";
import { focusRingClass, pressableClass, rfAsset, tokens } from "../_shared/tokens";

const inter = Inter({ subsets: ["latin", "cyrillic"], weight: ["400", "500"] });

// ─────────────────────────────────────────────────────────────────────────────
// Прайсинг приглашенного (Figma 48545:482, 48607:337, 48607:626): три периода, на Lite и Pro —
// плашка «Реферальная скидка» поверх шапки и цена со скидкой рядом с зачеркнутой ценой
// за месяц при помесячной оплате (на помесячном периоде зачеркнутой нет). Business без скидки. Буллиты — с текущего прода (2026-10-07).
// Скидка 30% округлена ВНИЗ (решение 2026-10-07, чтобы реальная скидка была не меньше 30%):
// ₽: 1100→770, 3300→2310, 850→590, 2750→1920, 790→550, 2290→1600; $: 10→7, 32→22, 8→5, 28→19, 7→4, 24→16.
// Валюта переключается кнопкой RUB/USD в шапке (в Figma только рубли).
// ─────────────────────────────────────────────────────────────────────────────

const fig = (name: string) => rfAsset(`figma/${name}`);
const T13 = "text-[13px] font-normal leading-[normal] tracking-[-0.13px]";

type Period = "monthly" | "half" | "year";
const PERIODS: { id: Period; label: string }[] = [
  { id: "monthly", label: "Ежемесячно" },
  { id: "half", label: "6 месяцев" },
  { id: "year", label: "12 месяцев" },
];

type Currency = "RUB" | "USD";
const CURRENCIES: Currency[] = ["RUB", "USD"];

type PricePair = [string, string | null];
type PeriodPrices = { lite: PricePair; pro: PricePair; note: string };

const NOTES: Record<Period, string> = {
  monthly: "На пользователя/мес, ежемесячно",
  half: "На пользователя/мес, каждые 6 мес",
  year: "На пользователя/мес, ежегодно",
};

/** Цены по валюте и периоду: [со скидкой 30%, зачеркнутая цена за месяц при помесячной оплате].
 *  На помесячном периоде зачеркнутой цены нет — как сейчас на проде */
const PRICES: Record<Currency, Record<Period, PeriodPrices>> = {
  RUB: {
    monthly: { lite: ["770₽", null], pro: ["2310₽", null], note: NOTES.monthly },
    half: { lite: ["590₽", "1100₽"], pro: ["1920₽", "3300₽"], note: NOTES.half },
    year: { lite: ["550₽", "1100₽"], pro: ["1600₽", "3300₽"], note: NOTES.year },
  },
  USD: {
    monthly: { lite: ["$7", null], pro: ["$22", null], note: NOTES.monthly },
    half: { lite: ["$5", "$10"], pro: ["$19", "$32"], note: NOTES.half },
    year: { lite: ["$4", "$10"], pro: ["$16", "$32"], note: NOTES.year },
  },
};

type Feature = { text: string; dotted?: boolean; /** Двухстрочный пункт идет с интерлиньяжем 20 и фиксированной шириной */ tall?: boolean };

type PlanCard = {
  id: "free" | "lite" | "pro" | "business";
  word: { src: string; w: number; h: number; left: number; top: number };
  header: { bg?: string; image?: string; blend?: string; blendMode?: string };
  discount?: boolean;
  featuresTitle: string;
  features: Feature[];
};

const PLANS: PlanCard[] = [
  {
    id: "free",
    word: { src: "word-free.svg", w: 62, h: 24, left: 17, top: 71 },
    header: { bg: "#F3F3F3" },
    featuresTitle: "Что включено в тариф:",
    features: [
      { text: "180 мин в месяц", dotted: true },
      { text: "10 запросов в AI чат", dotted: true },
      { text: "Календари и ВКС-интеграции" },
      { text: "AI-отчет" },
      { text: "Файлы размера 1 ГБ" },
      { text: "Аудиоплеер" },
    ],
  },
  {
    id: "lite",
    word: { src: "word-lite.svg", w: 51, h: 25, left: 17, top: 70 },
    header: { image: "price-lite.png", blend: "#EF9735", blendMode: "color" },
    discount: true,
    featuresTitle: "Что включено в тариф:",
    features: [
      { text: "500 мин в месяц", dotted: true },
      { text: "10 запросов в AI-чат", dotted: true },
      { text: "Аудиоплеер" },
      { text: "Календари и ВКС-интеграции" },
      { text: "AI-отчет" },
      { text: "Файлы размера 1 ГБ" },
      { text: "API и MCP Сервер" },
    ],
  },
  {
    id: "pro",
    word: { src: "word-pro.svg", w: 47, h: 24, left: 17, top: 72 },
    header: { image: "price-pro.png", blend: "#1E58F0", blendMode: "hue" },
    discount: true,
    featuresTitle: "Что включено в тариф:",
    features: [
      { text: "Бесплатные минуты для ВКС и десктоп приложения", dotted: true, tall: true },
      { text: "2000 мин в месяц для файлов", dotted: true },
      { text: "AI-чат без ограничений", dotted: true },
      { text: "Календари и ВКС-интеграции" },
      { text: "Аудио и видеоплеер" },
      { text: "Скачивание записей" },
      { text: "Кастомные AI Отчеты" },
      { text: "Файлы размера 3 ГБ" },
      { text: "Поддержка 24/7" },
      { text: "API и MCP Сервер" },
    ],
  },
  {
    id: "business",
    word: { src: "word-business.svg", w: 130, h: 25, left: 17, top: 71.27 },
    header: { image: "price-business.png", blend: "#212833", blendMode: "saturation" },
    featuresTitle: "Все функции PRO, а также:",
    features: [
      { text: "Минимум от 3 сотрудников" },
      { text: "Полнофункциональное демо" },
      { text: "Личный аккаунт менеджер" },
      { text: "Командные варианты цен" },
      { text: "Оплата по счету" },
      { text: "On-premise решение" },
      { text: "Аудио и видеоплеер" },
      { text: "Скачивание записей" },
      { text: "Кастомные AI Отчеты" },
      { text: "Кастомизация бота" },
      { text: "Аналитика рабочего пространства", tall: true },
      { text: "API и MCP Сервер" },
    ],
  },
];

function FeatureRow({ f }: { f: Feature }) {
  return (
    <div className={`flex gap-[8px] ${f.tall ? "items-start" : "items-center"}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={fig("ic-price-check.svg")} alt="" width={16} height={16} className="block h-[16px] w-[16px] shrink-0" />
      <span
        className={`text-[13px] font-normal tracking-[-0.13px] ${f.dotted ? "underline decoration-dotted decoration-[#818AA3] [text-decoration-thickness:12%]" : ""} ${f.tall ? "w-[208.816px] shrink-0" : "whitespace-nowrap"}`}
        style={{ color: tokens.black, lineHeight: f.tall ? "20px" : "16px" }}
      >
        {f.text}
      </span>
    </div>
  );
}

function GreyBtn({ children, outline, dark, invisible, className = "" }: { children: ReactNode; outline?: boolean; dark?: boolean; invisible?: boolean; className?: string }) {
  return (
    <button
      type="button"
      tabIndex={invisible ? -1 : 0}
      className={`flex h-[36px] items-center justify-center rounded-[4px] px-[12px] py-[10px] ${outline ? "border border-solid hover:bg-[#FAFAFA]" : dark ? "hover:bg-[#32394a]" : "hover:bg-[#EFEFEF]"} ${invisible ? "opacity-0" : ""} ${pressableClass} ${focusRingClass} ${className}`}
      style={{ backgroundColor: outline ? "transparent" : dark ? tokens.black : tokens.bgSubtle, borderColor: outline ? tokens.border : undefined }}
    >
      {children}
    </button>
  );
}

function Price({ now, old }: { now: string; old: string | null }) {
  return (
    <div className="flex items-center gap-[8px] whitespace-nowrap font-medium">
      <span className="text-[28px] leading-[normal] tracking-[-0.84px]" style={{ color: tokens.black }}>
        {now}
      </span>
      {old && (
        <span className="text-[20px] leading-[normal] tracking-[-0.6px] line-through" style={{ color: tokens.greyDisabled }}>
          {old}
        </span>
      )}
    </div>
  );
}

function BuyButtons() {
  return (
    <>
      <GreyBtn className="w-full">
        <span className={T13} style={{ color: "#21232C" }}>
          Купить
        </span>
      </GreyBtn>
      <GreyBtn outline className="w-[230px]">
        <span className={T13} style={{ color: tokens.black }}>
          Оплатить по счету
        </span>
      </GreyBtn>
    </>
  );
}

function DiscountBadge() {
  return (
    <div className="absolute left-0 top-0 flex w-[262px] flex-col items-start rounded-t-[4px]" style={{ backgroundColor: "rgba(0,0,0,0.3)" }}>
      <div className="flex w-full flex-col justify-center p-[8px]">
        <div className="flex items-start gap-[8px] px-[8px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={fig("ic-price-referral.svg")} alt="" width={16} height={16} className="block h-[16px] w-[16px] shrink-0" />
          <span className="whitespace-nowrap text-[13px] font-medium leading-[normal] tracking-[-0.13px] text-white">Реферальная скидка</span>
        </div>
      </div>
    </div>
  );
}

/** Блок цены, подписи и кнопок — зависит от тарифа и периода */
function PlanOffer({ id, period, currency }: { id: PlanCard["id"]; period: Period; currency: Currency }) {
  const pr = PRICES[currency][period];
  if (id === "free") {
    return (
      <>
        <div className="flex h-[57px] flex-col justify-center">
          <span className="w-[164px] text-[28px] font-medium leading-[normal] tracking-[-0.84px]" style={{ color: tokens.black }}>
            {currency === "RUB" ? "0₽" : "$0"}
          </span>
          <span className="whitespace-nowrap text-[13px] leading-[16px] tracking-[-0.13px] text-white">Per user/month, billed monthly</span>
        </div>
        <div className="flex w-full flex-col items-start gap-[8px]">
          <GreyBtn className="w-[230px]">
            <span className={T13} style={{ color: tokens.greyHover }}>
              Текущий
            </span>
          </GreyBtn>
          <GreyBtn className="w-[230px]" invisible>
            <span className={T13}>Оплатить по счету</span>
          </GreyBtn>
        </div>
      </>
    );
  }
  if (id === "business") {
    return (
      <>
        <div className="flex flex-col items-start gap-[4px] whitespace-nowrap">
          <span className="text-[28px] font-medium leading-[normal] tracking-[-0.84px]" style={{ color: tokens.black }}>
            По запросу
          </span>
          <span className="text-[14px] font-medium leading-[1.35] tracking-[-0.28px]" style={{ color: tokens.black }}>
            От 3 пользователей/6 мес
          </span>
        </div>
        <div className="flex w-full flex-col items-start gap-[8px]">
          <GreyBtn dark className="w-[238px]">
            <span className="text-[13px] font-medium leading-[normal] tracking-[-0.13px] text-white">Оставить заявку</span>
          </GreyBtn>
          <GreyBtn outline className="w-full">
            <span className={T13} style={{ color: tokens.black }}>
              Подробнее о тарифе
            </span>
          </GreyBtn>
        </div>
      </>
    );
  }
  const [now, old] = id === "lite" ? pr.lite : pr.pro;
  return (
    <>
      <div className="flex flex-col items-start gap-[4px] whitespace-nowrap">
        <Price now={now} old={old} />
        <span className="text-[14px] font-medium leading-[1.35] tracking-[-0.28px]" style={{ color: tokens.black }}>
          {pr.note}
        </span>
      </div>
      <div className="flex w-full flex-col items-start gap-[8px]">
        <BuyButtons />
      </div>
    </>
  );
}

function PlanCardView({ p, period, currency }: { p: PlanCard; period: Period; currency: Currency }) {
  const biz = p.id === "business";
  return (
    <div className="flex w-[262px] shrink-0 flex-col items-start self-stretch">
      <div className="relative h-[110px] w-full shrink-0 overflow-clip rounded-t-[4px] [isolation:isolate]" style={{ backgroundColor: p.header.bg }}>
        {p.header.image && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={fig(p.header.image)} alt="" className="absolute inset-0 h-full w-full max-w-none object-cover" />
            <div className="absolute inset-0" style={{ backgroundColor: p.header.blend, mixBlendMode: p.header.blendMode as "color" }} />
          </>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={fig(p.word.src)} alt={p.id} width={p.word.w} height={p.word.h} className="absolute block" style={{ left: p.word.left, top: p.word.top, width: p.word.w, height: p.word.h }} />
        {p.discount && <DiscountBadge />}
      </div>
      <div className="flex min-h-px w-full flex-1 flex-col items-start rounded-b-[4px] border-b border-l border-r border-solid" style={{ borderColor: tokens.grey30 }}>
        <div className="flex w-full flex-col items-start px-[8px] pb-[8px] pt-[20px]">
          <div className={`flex w-full flex-col gap-[24px] px-[8px] ${biz ? "items-center" : "items-start"}`}>
            <div className={`flex flex-col items-start gap-[20px] ${biz ? "w-[238px]" : "w-full"}`}>
              <PlanOffer id={p.id} period={period} currency={currency} />
            </div>
            <div className="h-px w-full shrink-0" style={{ backgroundColor: tokens.border }} />
            <div className={`flex flex-col items-start gap-[16px] ${biz ? "w-full" : "w-[230px]"}`}>
              <span className="whitespace-nowrap text-[13px] font-medium leading-[normal] tracking-[-0.13px]" style={{ color: tokens.black }}>
                {p.featuresTitle}
              </span>
              <div className="flex w-full flex-col items-start gap-[8px]">
                {p.features.map((f) => (
                  <FeatureRow key={f.text} f={f} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InviteePricingPage() {
  const [period, setPeriod] = useState<Period>("half");
  const [currency, setCurrency] = useState<Currency>("RUB");
  const [currencyOpen, setCurrencyOpen] = useState(false);
  return (
    <main className={`${inter.className} flex h-screen min-h-[720px] w-full flex-col items-center gap-[16px] overflow-y-auto bg-white`} style={{ color: tokens.black }}>
      <div className="flex h-[60px] w-full shrink-0 items-center justify-between bg-white px-[24px] py-[16px]">
        <Link href="/referral/invitee" className={`flex items-center gap-[16px] whitespace-nowrap text-[16px] leading-[normal] tracking-[-0.32px] ${focusRingClass}`}>
          <span className="font-medium" style={{ color: tokens.grey }}>
            ←
          </span>
          <span className="font-normal" style={{ color: tokens.black }}>
            Назад
          </span>
        </Link>
        {/* Валюта: кнопка как на макете, по клику — список RUB / USD */}
        <div className="relative">
          <button
            type="button"
            aria-haspopup="listbox"
            aria-expanded={currencyOpen}
            onClick={() => setCurrencyOpen((v) => !v)}
            onBlur={(e) => !e.currentTarget.parentElement?.contains(e.relatedTarget as Node | null) && setCurrencyOpen(false)}
            className={`flex h-[36px] w-[80px] items-center justify-center gap-[12px] rounded-[4px] border border-solid bg-white px-[12px] py-[8px] hover:bg-[#FAFAFA] ${pressableClass} ${focusRingClass}`}
            style={{ borderColor: tokens.border }}
          >
            <span className={T13} style={{ color: tokens.black }}>
              {currency}
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={fig("ic-chevron.svg")} alt="" width={16} height={16} className={`block h-[16px] w-[16px] transition-transform ${currencyOpen ? "rotate-180" : ""}`} />
          </button>
          {currencyOpen && (
            <div role="listbox" className="absolute right-0 top-[40px] z-[20] flex w-[80px] flex-col gap-[2px] rounded-[4px] border border-solid bg-white p-[4px]" style={{ borderColor: tokens.border, boxShadow: "0 4px 16px rgba(33,40,51,0.08)" }}>
              {CURRENCIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  role="option"
                  aria-selected={c === currency}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setCurrency(c);
                    setCurrencyOpen(false);
                  }}
                  className={`flex h-[28px] items-center rounded-[3px] px-[8px] hover:bg-[#F7F7F8] ${T13}`}
                  style={{ color: c === currency ? tokens.black : tokens.grey, backgroundColor: c === currency ? tokens.bgSubtle : undefined }}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-center justify-center gap-[16px] pb-[24px]">
        <div className="flex items-start gap-[2px] rounded-[4px] p-[4px]" style={{ backgroundColor: tokens.bgSubtle }}>
          {PERIODS.map((p) => {
            const on = p.id === period;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriod(p.id)}
                className={`flex items-center justify-center rounded-[3px] px-[8px] py-[6px] text-[13px] leading-[normal] tracking-[-0.13px] whitespace-nowrap ${on ? "bg-white font-medium" : "font-normal hover:text-[#585E6C]"} ${pressableClass} ${focusRingClass}`}
                style={{ color: on ? tokens.black : tokens.grey }}
              >
                {p.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-stretch gap-[8px]">
          {PLANS.map((p) => (
            <PlanCardView key={p.id} p={p} period={period} currency={currency} />
          ))}
        </div>
      </div>
      <DevPanel />
    </main>
  );
}
