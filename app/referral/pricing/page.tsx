"use client";

import { Inter } from "next/font/google";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { DevPanel } from "../_shared/DevPanel";
import { INVITEE_DISCOUNT } from "../_shared/data";
import { focusRingClass, pressableClass, rfAsset, tokens } from "../_shared/tokens";

const inter = Inter({ subsets: ["latin", "cyrillic"], weight: ["400", "500"] });

// ─────────────────────────────────────────────────────────────────────────────
// Прайсинг приглашенного (Figma 48487:5025): страница тарифов, на Lite и Pro — плашка
// «Реферальная скидка 30%» поверх шапки карточки и цена со скидкой рядом с зачеркнутой.
// Business без скидки. Цены и тексты — 1-в-1 с макета (период «6 месяцев»).
// ─────────────────────────────────────────────────────────────────────────────

const fig = (name: string) => rfAsset(`figma/${name}`);
const T13 = "text-[13px] font-normal leading-[normal] tracking-[-0.13px]";

type Feature = { text: string; dotted?: boolean; icon?: "check" | "check2" };

type PlanCard = {
  id: string;
  word: { src: string; w: number; h: number; left: number; top: number };
  header: { bg?: string; image?: string; blend?: string; blendMode?: string };
  discount?: boolean;
  price: ReactNode;
  note: string;
  buttons: ReactNode;
  featuresTitle: string;
  features: Feature[];
};

function FeatureRow({ f }: { f: Feature }) {
  return (
    <div className="flex items-start gap-[8px]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={fig(f.icon === "check2" ? "ic-biz-2.svg" : "ic-price-check.svg")} alt="" width={16} height={16} className="block h-[16px] w-[16px] shrink-0" />
      <span
        className={`text-[13px] font-normal tracking-[-0.13px] ${f.dotted ? "underline decoration-dotted decoration-[#818AA3] [text-decoration-thickness:12%]" : ""}`}
        style={{ color: tokens.black, lineHeight: f.dotted ? "normal" : "16px" }}
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

const PLANS: PlanCard[] = [
  {
    id: "free",
    word: { src: "word-free.svg", w: 62, h: 24, left: 17, top: 71 },
    header: { bg: "#F3F3F3" },
    price: (
      <div className="flex h-[57px] flex-col justify-center">
        <span className="w-[164px] text-[28px] font-medium leading-[normal] tracking-[-0.84px]" style={{ color: tokens.black }}>
          0₽
        </span>
        <span className="whitespace-nowrap text-[13px] leading-[16px] tracking-[-0.13px] text-white">Per user/month, billed monthly</span>
      </div>
    ),
    note: "",
    buttons: (
      <>
        <GreyBtn className="w-[230px]">
          <span className={T13} style={{ color: tokens.greyHover }}>
            Текущий
          </span>
        </GreyBtn>
        <GreyBtn className="w-[230px]" invisible>
          <span className={T13}>Оплатить по счету</span>
        </GreyBtn>
      </>
    ),
    featuresTitle: "Идеально для начинающих:",
    features: [
      { text: "180 мин в месяц", dotted: true },
      { text: "10 запросов в AI-чат", dotted: true },
      { text: "Календари и ВКС-интеграции", dotted: true },
      { text: "Файлы размера 1 ГБ" },
      { text: "AI-отчет" },
    ],
  },
  {
    id: "lite",
    word: { src: "word-lite.svg", w: 51, h: 25, left: 17, top: 70 },
    header: { image: "price-lite.png", blend: "#EF9735", blendMode: "color" },
    discount: true,
    price: <Price now="600₽" old="850₽" />,
    note: "На пользователя/месяц",
    buttons: <BuyButtons />,
    featuresTitle: "Для 3-8 встреч в неделю:",
    features: [
      { text: "500 мин в месяц", dotted: true },
      { text: "10 запросов в AI-чат", dotted: true },
      { text: "Календари и ВКС-интеграции", dotted: true },
      { text: "Файлы размера 1 ГБ", icon: "check2" },
      { text: "AI-отчет" },
    ],
  },
  {
    id: "pro",
    word: { src: "word-pro.svg", w: 47, h: 24, left: 17, top: 72 },
    header: { image: "price-pro.png", blend: "#1E58F0", blendMode: "hue" },
    discount: true,
    price: <Price now="1 930₽" old="2 750₽" />,
    note: "На пользователя/месяц",
    buttons: <BuyButtons />,
    featuresTitle: "Для 10-12 встреч в неделю:",
    features: [
      { text: "Бесплатные минуты для онлайн-встреч и хром-расширения", dotted: true },
      { text: "2000 мин в месяц для файлов", dotted: true },
      { text: "Календари и ВКС-интеграции", dotted: true },
      { text: "AI-Улучшение транскрипта", dotted: true },
      { text: "3 AI Отчета на встречу", dotted: true },
      { text: "AI-чат без ограничений" },
      { text: "Файлы размера 3 ГБ" },
    ],
  },
  {
    id: "business",
    word: { src: "word-business.svg", w: 130, h: 25, left: 17, top: 71.27 },
    header: { image: "price-business.png", blend: "#212833", blendMode: "saturation" },
    price: (
      <span className="whitespace-nowrap text-[28px] font-medium leading-[normal] tracking-[-0.84px]" style={{ color: tokens.black }}>
        По запросу
      </span>
    ),
    note: "От 3 пользователей/6 мес",
    buttons: (
      <>
        <GreyBtn dark className="w-[238px]">
          <span className="text-[13px] font-medium leading-[normal] tracking-[-0.13px] text-white">Оставить заявку</span>
        </GreyBtn>
        <GreyBtn outline className="w-full">
          <span className={T13} style={{ color: tokens.black }}>
            Подробнее о тарифе
          </span>
        </GreyBtn>
      </>
    ),
    featuresTitle: "Все функции PRO, а также:",
    features: [
      { text: "Минимум от 3 сотрудников" },
      { text: "Полифункциональное демо", icon: "check2" },
      { text: "Личный аккаунт менеджер", icon: "check2" },
      { text: "SSO вход для сотрудников", icon: "check2" },
      { text: "Командные варианты цен", icon: "check2" },
      { text: "Оплата по счету", icon: "check2" },
      { text: "On-premise решение" },
    ],
  },
];

function Price({ now, old }: { now: string; old: string }) {
  return (
    <div className="flex items-center gap-[8px] whitespace-nowrap font-medium">
      <span className="text-[28px] leading-[normal] tracking-[-0.84px]" style={{ color: tokens.black }}>
        {now}
      </span>
      <span className="text-[20px] leading-[normal] tracking-[-0.6px] line-through" style={{ color: tokens.greyDisabled }}>
        {old}
      </span>
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
          <span className="whitespace-nowrap text-[13px] font-medium leading-[normal] tracking-[-0.13px] text-white">Реферальная скидка {INVITEE_DISCOUNT}%</span>
        </div>
      </div>
    </div>
  );
}

function PlanCardView({ p }: { p: PlanCard }) {
  const biz = p.id === "business";
  return (
    <div className="flex h-full w-[262px] shrink-0 flex-col items-start">
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
              <div className="flex flex-col items-start gap-[4px] whitespace-nowrap">
                {p.price}
                {p.note && (
                  <span className="text-[14px] font-medium leading-[1.35] tracking-[-0.28px]" style={{ color: tokens.black }}>
                    {p.note}
                  </span>
                )}
              </div>
              <div className="flex w-full flex-col items-start gap-[8px]">{p.buttons}</div>
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

const PERIODS = ["Ежемесячно", "6 месяцев", "12 месяцев"] as const;

export default function InviteePricingPage() {
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>("6 месяцев");
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
        <button type="button" className={`flex h-[36px] w-[80px] items-center justify-center gap-[12px] rounded-[4px] border border-solid bg-white px-[12px] py-[8px] hover:bg-[#FAFAFA] ${pressableClass} ${focusRingClass}`} style={{ borderColor: tokens.border }}>
          <span className={T13} style={{ color: tokens.black }}>
            RUB
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={fig("ic-chevron.svg")} alt="" width={16} height={16} className="block h-[16px] w-[16px]" />
        </button>
      </div>

      <div className="flex shrink-0 flex-col items-center justify-center gap-[16px] pb-[24px]">
        <div className="flex items-start gap-[2px] rounded-[4px] p-[4px]" style={{ backgroundColor: tokens.bgSubtle }}>
          {PERIODS.map((p) => {
            const on = p === period;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`flex items-center justify-center rounded-[3px] px-[8px] py-[6px] text-[13px] leading-[normal] tracking-[-0.13px] whitespace-nowrap ${on ? "bg-white font-medium" : "font-normal hover:text-[#585E6C]"} ${pressableClass} ${focusRingClass}`}
                style={{ color: on ? tokens.black : tokens.grey }}
              >
                {p}
              </button>
            );
          })}
        </div>
        <div className="flex h-[600px] items-start gap-[8px]">
          {PLANS.map((p) => (
            <PlanCardView key={p.id} p={p} />
          ))}
        </div>
      </div>
      <DevPanel />
    </main>
  );
}
