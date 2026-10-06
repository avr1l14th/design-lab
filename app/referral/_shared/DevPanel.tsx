"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { tokens } from "./tokens";

// Панель прототипа (как в app-leads-v2): переходы между экранами секции и тоглы состояний.

const SCREENS: { href: string; label: string }[] = [
  { href: "/referral/meetings", label: "Точки входа" },
  { href: "/referral", label: "Реферальная программа" },
  { href: "/referral/invitee", label: "Модалка приглашенного" },
  { href: "/referral/pricing", label: "Прайсинг приглашенного" },
];

export function Switch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className="relative inline-flex h-[14px] w-[24px] shrink-0 items-center rounded-full transition-colors"
      style={{ backgroundColor: checked ? tokens.blue : tokens.borderStrong }}
    >
      <span className="inline-block h-[10px] w-[10px] rounded-full bg-white transition-transform" style={{ transform: checked ? "translateX(12px)" : "translateX(2px)" }} />
    </button>
  );
}

export function DevPanel({ children }: { children?: ReactNode }) {
  const pathname = usePathname() ?? "";
  const norm = pathname.replace(/\/design-lab(?=\/)/, "").replace(/\/$/, "") || "/";
  return (
    <div
      className="fixed bottom-[72px] right-[16px] z-[60] flex w-[220px] flex-col gap-[6px] rounded-[6px] border border-solid bg-white p-[10px]"
      style={{ borderColor: tokens.border, boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}
    >
      {SCREENS.map((s) => {
        const on = norm === s.href;
        return (
          <Link
            key={s.href}
            href={s.href}
            className="flex items-center justify-between rounded-[3px] px-[6px] py-[4px] text-[12px] leading-[normal] tracking-[-0.12px] hover:bg-[#F7F7F8]"
            style={{ color: on ? tokens.black : tokens.grey, backgroundColor: on ? tokens.bgSubtle : undefined }}
          >
            {s.label}
          </Link>
        );
      })}
      {children && (
        <>
          <div className="h-px w-full" style={{ backgroundColor: tokens.border }} />
          {children}
        </>
      )}
    </div>
  );
}
