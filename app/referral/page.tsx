"use client";

import { Inter } from "next/font/google";
import { useEffect, useRef, useState } from "react";
import { GiftCard } from "./_shared/cards";
import { INVITEE_DISCOUNT, MILESTONES, REFERRALS, fmtDate, initials, isPaid, subsLabel, type Milestone, type Referral } from "./_shared/data";
import { DevPanel, Switch } from "./_shared/DevPanel";
import { Sidebar } from "./_shared/Sidebar";
import { INVITE_LINK, focusRingClass, pressableClass, rfAsset, tokens } from "./_shared/tokens";
import { ToastHost, avatarColor, useToast } from "./_shared/ui";

const inter = Inter({ subsets: ["latin", "cyrillic"], weight: ["400", "500"] });

// ─────────────────────────────────────────────────────────────────────────────
// Реферальная программа — 1-в-1 по секции Федора в Figma (48467:788, 2026-10-06):
// шапка «Назад», колонка 560, табы «Обзор» / «Приглашенные».
// Обзор: герой (заголовок, описание, кнопка, подарочная карта, срезанная правым краем карточки)
// и «Награды» — вертикальный список с линией-коннектором и кружком-чекбоксом справа.
// Приглашенные: таблица Почта / Дата регистрации / Статус. Пустые состояния — по макету.
// ─────────────────────────────────────────────────────────────────────────────

const T13 = "text-[13px] font-normal leading-[16px] tracking-[-0.13px]";
const T12 = "text-[12px] font-normal leading-[normal] tracking-[-0.24px]";
const T12M = "text-[12px] font-medium leading-[normal] tracking-[-0.24px]";

const fig = (name: string) => rfAsset(`figma/${name}`);

/* ─────────────────────────── ГЕРОЙ ─────────────────────────── */

function Hero({ onCopied }: { onCopied: () => void }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    // Состояние показываем сразу, не дожидаясь буфера: в песочнице запрос к clipboard может висеть
    setCopied(true);
    onCopied();
    setTimeout(() => setCopied(false), 2000);
    navigator.clipboard?.writeText(`https://${INVITE_LINK}`).catch(() => {
      // clipboard недоступен — в прототипе достаточно показать состояние
    });
  };

  return (
    <div className="relative flex w-full flex-col items-center overflow-clip rounded-[4px] border border-solid bg-white px-[24px] py-[24px]" style={{ borderColor: tokens.border }}>
      <div className="relative flex w-full flex-col items-start gap-[16px]">
        <div className="flex w-full flex-col gap-[8px]" style={{ color: tokens.black }}>
          <h1 className="flex h-[28px] w-[288px] flex-col justify-end whitespace-nowrap text-[24px] font-medium leading-[normal] tracking-[-0.48px]">Реферальная программа</h1>
          <p className={`w-[295px] ${T13}`}>Делитесь ссылкой со знакомыми: они получат скидку {INVITEE_DISCOUNT}%, а вы — награды за их подписки</p>
        </div>
        <button
          type="button"
          onClick={copy}
          className={`flex h-[36px] w-[155px] items-center rounded-[4px] py-[8px] pl-[12px] pr-[6px] hover:bg-[#0032B1] ${pressableClass} ${focusRingClass}`}
          style={{ backgroundColor: tokens.blue }}
        >
          <span className="truncate whitespace-nowrap text-[13px] font-medium leading-[normal] tracking-[-0.13px] text-white">{copied ? "Ссылка скопирована" : "Скопировать ссылку"}</span>
        </button>
        {/* Карта стоит абсолютно на 340px от края контента и режется правым краем карточки — как на макете */}
        <div className="absolute left-[340px] top-0">
          <GiftCard size="hero" />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── НАГРАДЫ ─────────────────────────── */

function BadgeContainer({ icon, done }: { icon: Milestone["icon"]; done: boolean }) {
  return (
    <div
      className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-[4px] border border-solid p-[8px]"
      style={{ backgroundColor: tokens.bgSubtle, borderColor: done ? tokens.green : "transparent" }}
    >
      {icon === "pro" ? (
        <span className="flex items-center justify-center rounded-[2px] p-[3px]" style={{ backgroundColor: done ? tokens.green : tokens.grey }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={fig("ic-pro.svg")} alt="" width={12} height={4.613} className="block h-[4.613px] w-[12px]" />
        </span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={fig(icon === "tennis" ? "ic-tennis.svg" : "ic-party.svg")} alt="" width={16} height={16} className="block h-[16px] w-[16px]" />
      )}
    </div>
  );
}

function Checkbox({ done }: { done: boolean }) {
  return (
    <div className="flex shrink-0 items-center justify-center p-[8px]">
      {done ? (
        <span className="relative block h-[16px] w-[16px] rounded-full" style={{ backgroundColor: tokens.green }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={fig("ic-check-12.svg")} alt="" width={12} height={12} className="absolute left-1/2 top-1/2 block h-[12px] w-[12px] -translate-x-1/2 -translate-y-1/2" />
        </span>
      ) : (
        <span className="block h-[16px] w-[16px] rounded-full border border-solid" style={{ borderColor: tokens.border }} />
      )}
    </div>
  );
}

function RewardsCard({ paid }: { paid: number }) {
  return (
    <div className="flex w-full flex-col items-start gap-[24px] rounded-[4px] border border-solid bg-white p-[24px]" style={{ borderColor: tokens.border }}>
      <div className="flex w-full items-end justify-between whitespace-nowrap">
        <span className="text-[14px] font-medium leading-[1.35] tracking-[-0.28px]" style={{ color: tokens.black }}>
          Награды
        </span>
        <span className={T12} style={{ color: tokens.grey }}>
          {paid}/{MILESTONES[MILESTONES.length - 1].count} подписок
        </span>
      </div>
      <div className="flex w-full flex-col items-start">
        {MILESTONES.map((m, i) => {
          const done = paid >= m.count;
          return (
            <div key={m.count} className="contents">
              {i > 0 && (
                <div className="flex h-[24px] w-[36px] shrink-0 justify-center">
                  {/* Линия-коннектор: зеленая после полученной награды */}
                  <span className="block h-full w-px" style={{ backgroundColor: paid >= MILESTONES[i - 1].count ? tokens.green : tokens.border }} />
                </div>
              )}
              <div className="flex w-full items-center gap-[12px]">
                <BadgeContainer icon={m.icon} done={done} />
                <div className="flex min-w-px flex-1 flex-col items-start gap-[2px]">
                  <span className="w-full text-[13px] font-medium leading-[normal] tracking-[-0.13px]" style={{ color: tokens.black }}>
                    {m.title}
                  </span>
                  <span className={`w-full ${T12}`} style={{ color: tokens.grey }}>
                    {subsLabel(m.count)}
                  </span>
                </div>
                <Checkbox done={done} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────── ПРИГЛАШЕННЫЕ ─────────────────────────── */

function StatusChip({ r }: { r: Referral }) {
  const paid = isPaid(r);
  return (
    <span className="flex items-center justify-center rounded-[3px] px-[8px] py-[4px]" style={{ backgroundColor: tokens.bgSubtle }}>
      <span className={`whitespace-nowrap ${T12}`} style={{ color: paid ? tokens.green : tokens.black }}>
        {paid ? "Купил" : "Зарегистрировался"}
      </span>
    </span>
  );
}

function ReferralsTable({ rows }: { rows: Referral[] }) {
  return (
    <div className="flex w-full flex-col items-start overflow-clip rounded-[4px] border border-solid" style={{ borderColor: tokens.border }}>
      <div className="flex h-[52px] w-full items-center gap-[24px] border-b border-solid px-[16px] py-[12px]" style={{ backgroundColor: tokens.bgSubtle, borderColor: tokens.border }}>
        <span className={`w-[220px] shrink-0 ${T12M}`} style={{ color: tokens.black }}>
          Почта
        </span>
        <span className={`w-[110px] shrink-0 ${T12M}`} style={{ color: tokens.black }}>
          Дата регистрации
        </span>
        <span className={`min-w-px flex-1 ${T12M}`} style={{ color: tokens.black }}>
          Статус
        </span>
      </div>
      {rows.length === 0 ? (
        <div className="flex h-[240px] w-full items-center justify-center px-[16px] py-[4px]">
          <div className="flex flex-col items-center gap-[12px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={fig("ic-empty-20.svg")} alt="" width={20} height={20} className="block h-[20px] w-[20px]" />
            <span className={`whitespace-nowrap text-center ${T13}`} style={{ color: "#BABBBD" }}>
              По вашей ссылке пока нет регистраций
            </span>
          </div>
        </div>
      ) : (
        rows.map((r) => (
          <div key={r.id} className="flex h-[52px] w-full items-center gap-[24px] border-b border-solid bg-white px-[16px] py-[4px] last:border-b-0" style={{ borderColor: tokens.border }}>
            <div className="flex w-[220px] shrink-0 items-center gap-[8px]">
              <span
                className="flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full text-[10px] font-normal leading-[normal] tracking-[-0.1px] text-white"
                style={{ backgroundColor: r.avatar ?? avatarColor(r.email) }}
              >
                {initials(r.email)}
              </span>
              <span className={`truncate ${T13}`} style={{ color: tokens.black }}>
                {r.email}
              </span>
            </div>
            <span className={`w-[110px] shrink-0 ${T12}`} style={{ color: tokens.black }}>
              {fmtDate(r.date)}
            </span>
            <div className="flex min-w-px flex-1 items-center">
              <StatusChip r={r} />
            </div>
          </div>
        ))
      )}
    </div>
  );
}

/* ─────────────────────────── СТРАНИЦА ─────────────────────────── */

type Tab = "overview" | "list";

export default function ReferralPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [empty, setEmpty] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [tab]);
  const { toast, visible, show, hide } = useToast();
  const rows = empty ? [] : REFERRALS;
  const paid = rows.filter(isPaid).length;

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Обзор" },
    { id: "list", label: "Приглашенные" },
  ];

  return (
    <main className={`${inter.className} relative flex h-screen min-h-[720px] w-full overflow-hidden bg-white`} style={{ color: tokens.black }}>
      <Sidebar active="referral" />

      <section className="relative flex h-full min-w-0 flex-1 flex-col bg-white">
        <div className="flex h-[54px] w-full shrink-0 items-center bg-white p-[16px]">
          <button type="button" className={`-mx-[8px] flex cursor-pointer items-center rounded-[3px] px-[8px] py-[6px] hover:bg-[#F7F7F8] ${pressableClass} ${focusRingClass}`}>
            <span className={T13} style={{ color: tokens.black }}>
              Назад
            </span>
          </button>
        </div>

        <div ref={scrollRef} className="flex w-full min-h-0 flex-1 flex-col items-center overflow-y-auto [scrollbar-gutter:stable_both-edges]">
          <div className="flex w-[560px] shrink-0 flex-col items-center gap-[16px] pb-[24px] pt-[24px]">
            <div className="flex w-full items-center">
              <div className="flex h-[36px] items-center">
                {tabs.map((t) => {
                  const on = tab === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTab(t.id)}
                      className={`flex h-full items-center justify-center rounded-[4px] p-[10px] ${on ? "" : "hover:bg-[#FAFAFA]"} ${pressableClass} ${focusRingClass}`}
                      style={{ backgroundColor: on ? tokens.bgSubtle : "transparent" }}
                    >
                      <span className={`whitespace-nowrap ${T13}`} style={{ color: on ? tokens.black : tokens.grey }}>
                        {t.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {tab === "overview" ? (
              <>
                <Hero onCopied={() => show("Ссылка скопирована")} />
                <RewardsCard paid={paid} />
              </>
            ) : (
              <ReferralsTable rows={rows} />
            )}
          </div>
        </div>
        <ToastHost toast={toast} visible={visible} onHide={hide} />
      </section>

      <DevPanel>
        <label className="flex cursor-pointer items-center justify-between gap-[8px] px-[6px] py-[2px]">
          <span className="text-[12px] tracking-[-0.12px]" style={{ color: tokens.black }}>
            Пустое состояние
          </span>
          <Switch checked={empty} onChange={() => setEmpty((v) => !v)} />
        </label>
      </DevPanel>
    </main>
  );
}
