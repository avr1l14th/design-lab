"use client";

import { useEffect } from "react";
import type { Milestone } from "./data";
import { focusRingClass, pressableClass, rfAsset, sbAsset, tokens } from "./tokens";

// ─────────────────────────────────────────────────────────────────────────────
// Модалки наград (Figma 48586:370…525): показываются приглашающему, когда счетчик оплат
// достиг порога. Шапка «Реферальная награда» с иконкой подарка, иллюстрация 468×276, заголовок
// и текст, одна кнопка: у Pro-наград «Ура, отлично!» закрывает, у падела и корпоратива
// «Связаться с нами» ведет на hello@mymeet.ai.
// ─────────────────────────────────────────────────────────────────────────────

const fig = (name: string) => rfAsset(`figma/${name}`);
export const CONTACT_EMAIL = "hello@mymeet.ai";

type RewardCopy = { title: string; text: string; cta: string; contact?: boolean };

/** Тексты 1-в-1 с макета, по порогу. Тексты Pro-наград нейтральные: подходят и Free-пользователю без списаний */
export const REWARD_COPY: Record<number, RewardCopy> = {
  3: { title: "Вы получили 3 месяца Pro!", text: "Трое приглашенных оплатили подписку. Pro уже подключен на три месяца", cta: "Ура, отлично!" },
  10: { title: "Вы получили год Pro!", text: "Десять приглашенных оплатили подписку. Год Pro уже подключен, за наш счет", cta: "Ура, отлично!" },
  35: { title: "Pro навсегда ваш!", text: "35 приглашенных оплатили подписку. Pro подключен навсегда, продлевать его больше не нужно", cta: "Ура, отлично!" },
  60: { title: "Вы выиграли падел с CEO mymeet.ai!", text: "60 приглашенных оплатили подписку, и это уже серьезно. Напишите нам, договоримся о корте и времени", cta: "Связаться с нами", contact: true },
  100: { title: "Ждем вас на корпоративе mymeet.ai!", text: "100 приглашенных оплатили подписку. Вы привели очень много людей, так что встречать Новый год будем вместе. Напишите нам", cta: "Связаться с нами", contact: true },
};

/** Иллюстрация: для Pro-наград — бейдж PRO 80×80 с зеленой галкой, для остальных — готовый svg с макета */
function RewardArt({ icon }: { icon: Milestone["icon"] }) {
  if (icon !== "pro") {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={fig(icon === "tennis" ? "reward-padel.svg" : "reward-party.svg")} alt="" width={468} height={276} className="block h-[276px] w-[468px] rounded-[5.099px]" />;
  }
  return (
    <div className="relative h-[276px] w-[468px] overflow-clip rounded-[5.099px]" style={{ backgroundColor: tokens.bgSubtle }}>
      <div className="absolute left-1/2 top-1/2 h-[80px] w-[80px] -translate-x-1/2 -translate-y-1/2">
        <div className="absolute left-0 flex w-[80px] items-center justify-center rounded-[8.889px] p-[13.333px]" style={{ top: "calc(50% + 1.36px)", transform: "translateY(-50%)", backgroundColor: tokens.grey }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={fig("ic-pro-big.svg")} alt="" width={53.333} height={20.5} className="block h-[20.5px] w-[53.333px]" />
        </div>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={fig("ic-check-badge.svg")} alt="" width={38} height={38} className="absolute block h-[38px] w-[38px]" style={{ left: 253, top: 95 }} />
    </div>
  );
}

export function RewardModal({ milestone, onClose }: { milestone: Milestone; onClose: () => void }) {
  const copy = REWARD_COPY[milestone.count];
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const ctaClass = `flex h-[36px] items-center justify-center rounded-[4px] px-[12px] py-[10px] hover:bg-[#0032B1] ${pressableClass} ${focusRingClass}`;
  const ctaLabel = <span className="whitespace-nowrap text-[13px] font-medium leading-[normal] tracking-[-0.26px] text-white">{copy.cta}</span>;

  return (
    <div className="fixed inset-0 z-[50] flex items-center justify-center" style={{ backgroundColor: tokens.backdrop }} onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="reward-modal-title" onClick={(e) => e.stopPropagation()} className="flex w-[500px] flex-col items-start rounded-[4px] bg-white" style={{ color: tokens.black }}>
        <div className="flex w-full flex-col justify-center border-b border-solid p-[16px]" style={{ borderColor: tokens.border }}>
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-[8px]">
              <span
                aria-hidden="true"
                className="block h-[16px] w-[16px] shrink-0"
                style={{
                  backgroundColor: tokens.grey,
                  WebkitMaskImage: `url(${sbAsset("gift.svg")})`,
                  maskImage: `url(${sbAsset("gift.svg")})`,
                  WebkitMaskSize: "contain",
                  maskSize: "contain",
                  WebkitMaskRepeat: "no-repeat",
                  maskRepeat: "no-repeat",
                  WebkitMaskPosition: "center",
                  maskPosition: "center",
                }}
              />
              <span id="reward-modal-title" className="whitespace-nowrap text-[14px] font-normal leading-[1.35] tracking-[-0.28px]">
                Реферальная награда
              </span>
            </div>
            <button type="button" aria-label="Закрыть" onClick={onClose} className={`flex h-[16px] w-[16px] shrink-0 items-center justify-center rounded-full ${focusRingClass}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={fig("ic-modal-close.svg")} alt="" width={16} height={16} className="block h-[16px] w-[16px]" />
            </button>
          </div>
        </div>

        <div className="flex w-full flex-col items-start gap-[24px] px-[16px] py-[24px]">
          <RewardArt icon={milestone.icon} />
          <div className="flex w-full flex-col items-start justify-center gap-[8px]">
            <p className="w-full text-[14px] font-medium leading-[1.35] tracking-[-0.28px]">{copy.title}</p>
            <p className="w-full text-[13px] font-normal leading-[normal] tracking-[-0.13px]">{copy.text}</p>
          </div>
        </div>

        <div className="flex w-full flex-col items-start rounded-b-[4px] border-t border-solid p-[16px]" style={{ backgroundColor: tokens.bgSubtle, borderColor: tokens.border }}>
          <div className="flex w-full items-center justify-end">
            {copy.contact ? (
              <a href={`mailto:${CONTACT_EMAIL}`} className={ctaClass} style={{ backgroundColor: tokens.blue }}>
                {ctaLabel}
              </a>
            ) : (
              <button type="button" onClick={onClose} className={ctaClass} style={{ backgroundColor: tokens.blue }}>
                {ctaLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

