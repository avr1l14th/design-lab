"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { focusRingClass, pressableClass, shadow, tokens } from "./tokens";

// ─────────────────────────────────────────────────────────────────────────────
// Служебная переключалка состояний прототипа (не часть дизайна): плашка в правом нижнем углу
// со ссылками на все страницы глобального чата. Сворачивается в кружок, чтобы не мешать на скринах.
// ─────────────────────────────────────────────────────────────────────────────

const PAGES: { href: string; label: string }[] = [
  { href: "/global-chat", label: "Стартовая" },
  { href: "/global-chat/meetings", label: "Встречи" },
  { href: "/global-chat/zero", label: "Пустой аккаунт" },
  { href: "/global-chat/limit", label: "Лимит" },
  { href: "/global-chat/guest", label: "Гость" },
  { href: "/global-chat/noaccess", label: "Нет доступа" },
  { href: "/global-chat/meeting", label: "Чат встречи" },
];

export function StateSwitcher() {
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(true);
  // basePath на GitHub Pages добавляется к pathname, поэтому сравниваем по хвосту
  const current = pathname.replace(/\/$/, "");
  const isActive = (href: string) => current.endsWith(href);

  return (
    <div className="fixed bottom-[88px] right-[16px] z-[70] flex flex-col items-end gap-[6px]">
      {open && (
        <div className="flex flex-col rounded-[4px] bg-white p-[4px]" style={{ boxShadow: shadow }}>
          {PAGES.map((p) => {
            const active = isActive(p.href);
            return (
              <Link
                key={p.href}
                href={p.href}
                className={`rounded-[2px] px-[8px] py-[6px] text-[12px] leading-[normal] tracking-[-0.24px] hover:bg-[#F7F7F8] ${pressableClass} ${focusRingClass}`}
                style={{ color: active ? tokens.blue : tokens.black, backgroundColor: active ? tokens.blueLightest : undefined, fontWeight: active ? 500 : 400 }}
              >
                {p.label}
              </Link>
            );
          })}
        </div>
      )}
      <button
        type="button"
        aria-label={open ? "Свернуть переключалку страниц" : "Показать переключалку страниц"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`flex h-[24px] w-[24px] items-center justify-center rounded-full bg-white text-[11px] font-medium leading-none hover:bg-[#F7F7F8] ${pressableClass} ${focusRingClass}`}
        style={{ boxShadow: shadow, color: tokens.grey }}
      >
        {open ? "×" : "≡"}
      </button>
    </div>
  );
}
