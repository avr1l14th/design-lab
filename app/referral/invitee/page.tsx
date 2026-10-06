"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GiftCard } from "../_shared/cards";
import { INVITEE_DISCOUNT } from "../_shared/data";
import { DevPanel } from "../_shared/DevPanel";
import { MeetingsPage } from "../_shared/MeetingsPage";
import { focusRingClass, pressableClass, rfAsset, tokens } from "../_shared/tokens";

// Модалка приглашенного (Figma 48487:4994): показывается после регистрации по реферальной ссылке
// поверх списка встреч. «Выбрать тариф» ведет на прайсинг со скидкой, крестик и Esc закрывают.

const fig = (name: string) => rfAsset(`figma/${name}`);

function InviteeModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[50] flex items-center justify-center" style={{ backgroundColor: tokens.backdrop }} onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="invitee-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="flex w-[500px] flex-col items-start rounded-[4px] bg-white"
        style={{ color: tokens.black }}
      >
        <div className="flex w-full flex-col justify-center border-b border-solid p-[16px]" style={{ borderColor: tokens.border }}>
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-[8px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={fig("ic-modal-referral.svg")} alt="" width={16} height={16} className="block h-[16px] w-[16px] shrink-0" />
              <span id="invitee-modal-title" className="whitespace-nowrap text-[14px] font-normal leading-[1.35] tracking-[-0.28px]">
                Реферальная скидка
              </span>
            </div>
            <button type="button" aria-label="Закрыть" onClick={onClose} className={`flex h-[16px] w-[16px] shrink-0 items-center justify-center rounded-full ${focusRingClass}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={fig("ic-modal-close.svg")} alt="" width={16} height={16} className="block h-[16px] w-[16px]" />
            </button>
          </div>
        </div>

        <div className="flex w-full flex-col items-start gap-[24px] px-[16px] py-[24px]">
          <div className="relative flex h-[276px] w-[468px] items-center justify-center overflow-clip rounded-[4px]" style={{ backgroundColor: tokens.bgSubtle }}>
            <GiftCard size="modal" />
          </div>
          <div className="flex w-full flex-col items-start justify-center gap-[8px]">
            <p className="w-full text-[14px] font-medium leading-[1.35] tracking-[-0.28px]">Вам доступна скидка {INVITEE_DISCOUNT}%!</p>
            <p className="w-full text-[13px] font-normal leading-[normal] tracking-[-0.13px]">
              Вы зарегистрировались по приглашению. Скидка {INVITEE_DISCOUNT}% действует на любой тариф, кроме Business, и применится автоматически при оплате
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col items-start rounded-b-[4px] border-t border-solid p-[16px]" style={{ backgroundColor: tokens.bgSubtle, borderColor: tokens.border }}>
          <div className="flex w-full items-center justify-end">
            <Link
              href="/referral/pricing"
              className={`flex h-[36px] items-center justify-center rounded-[4px] px-[12px] py-[10px] hover:bg-[#0032B1] ${pressableClass} ${focusRingClass}`}
              style={{ backgroundColor: tokens.blue }}
            >
              <span className="whitespace-nowrap text-[13px] font-medium leading-[normal] tracking-[-0.26px] text-white">Выбрать тариф</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InviteePage() {
  const [open, setOpen] = useState(true);
  return (
    <MeetingsPage overlay={open ? <InviteeModal onClose={() => setOpen(false)} /> : null}>
      <DevPanel>
        {!open && (
          <button type="button" onClick={() => setOpen(true)} className="rounded-[3px] px-[6px] py-[4px] text-left text-[12px] tracking-[-0.12px] hover:bg-[#F7F7F8]" style={{ color: tokens.blue }}>
            Показать модалку снова
          </button>
        )}
      </DevPanel>
    </MeetingsPage>
  );
}
