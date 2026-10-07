"use client";

import { useState } from "react";
import { BASE, pressableClass, rfAsset, tokens } from "./tokens";

// ─────────────────────────────────────────────────────────────────────────────
// Точки входа в рефералку (Figma 48497:9653). Верстка, логика и поведение — из прототипа
// app-leads-v2 (TopBanner / ListBanner): заменены только иконки и тексты.
//  — растяжка: вся полоса кликабельна, крестик справа закрывает только ее;
//  — баннер в списке: кликабелен целиком, крестик появляется на ховере в правом верхнем углу,
//    иллюстрация на ховере «плывет» (1-й столбец вверх, 2-й вниз, 3-й вверх).
// ─────────────────────────────────────────────────────────────────────────────

const fig = (name: string) => rfAsset(`figma/${name}`);
const leadAsset = (p: string) => `${BASE}/app-leads-v2/${p}`;

export function TopBanner({ onOpen }: { onOpen: () => void }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => e.key === "Enter" && onOpen()}
      className={`flex h-[40px] w-full shrink-0 cursor-pointer items-center justify-between border-b border-solid p-[12px] text-left hover:bg-[#F7F7F8] ${pressableClass}`}
      style={{ backgroundColor: tokens.bgLight, borderColor: tokens.border }}
    >
      <div className="h-[16px] w-[16px]" />
      <div className="flex items-center gap-[8px]">
        <div className="flex items-center gap-[8px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={fig("ic-referral.svg")} alt="" width={16} height={16} className="h-[16px] w-[16px] shrink-0" />
          <span className="whitespace-nowrap text-[13px] leading-[16px] tracking-[-0.13px]" style={{ color: tokens.black }}>
            Приглашайте знакомых и получайте награды
          </span>
        </div>
        <span className="flex items-center gap-[4px] whitespace-nowrap text-[13px] leading-[16px] tracking-[-0.13px]" style={{ color: tokens.grey }}>
          Перейти
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={leadAsset("ic-arrow-right.svg")} alt="" width={10} height={9} className="h-[9px] w-[10px]" />
        </span>
      </div>
      <button
        type="button"
        aria-label="Закрыть"
        onClick={(e) => {
          e.stopPropagation();
          setDismissed(true);
        }}
        className="flex h-[16px] w-[16px] items-center justify-center"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={fig("ic-banner-close.svg")} alt="" width={16} height={16} className="h-[16px] w-[16px]" />
      </button>
    </div>
  );
}

function MiniIconTile({ bg, icon }: { bg: string; icon: string }) {
  return (
    <div className="flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: bg }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={fig(icon)} alt="" width={12} height={12} className="h-[12px] w-[12px]" />
    </div>
  );
}

/** Столбцы иллюстрации — цвета и иконки 1-в-1 с макета */
const col1 = [
  { bg: "#FDF5D6", icon: "mini-1.svg" },
  { bg: "#D6DFF6", icon: "mini-2.svg" },
  { bg: "#EBECF0", icon: "mini-3.svg" },
  { bg: "#FDF5D6", icon: "mini-1.svg" },
];
const col2 = [
  { bg: "#DBDDDE", icon: "mini-4.svg" },
  { bg: "#ECDEFB", icon: "mini-5.svg" },
  { bg: "#D8EEE4", icon: "mini-6.svg" },
  { bg: "#DEF5FF", icon: "mini-7.svg" },
];
const col3 = [
  { bg: "#D8F2F1", icon: "mini-8.svg" },
  { bg: "#FFEFDD", icon: "mini-9.svg" },
  { bg: "#F7DEDE", icon: "mini-10.svg" },
  { bg: "#D8F2F1", icon: "mini-8.svg" },
];

const colBase = "absolute flex flex-col items-start gap-[8px] transition-transform duration-[600ms] ease-out";

export function ListBanner({ onOpen }: { onOpen: () => void }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="group/row relative flex w-full shrink-0 items-center px-[16px] py-[8px]">
      {/* ✕ — на углу рамки баннера, виден на ховере строки */}
      <button
        type="button"
        aria-label="Закрыть"
        onClick={(e) => {
          e.stopPropagation();
          setDismissed(true);
        }}
        className="absolute right-[8px] top-0 z-10 flex items-center justify-center opacity-0 transition-opacity duration-150 group-hover/row:opacity-100"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={leadAsset("ic-list-close.svg")} width={16} height={16} alt="" />
      </button>

      <div
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(e) => e.key === "Enter" && onOpen()}
        className="group/banner flex h-[72px] w-full cursor-pointer items-center gap-[8px] overflow-clip rounded-[4px] border border-solid bg-white py-[12px] pl-[12px] pr-[18px] transition-colors hover:bg-[#FAFAFA]"
        style={{ borderColor: tokens.border }}
      >
        {/* Иллюстрация 80×72: три столбца кружков, на ховере плывут, лишнее режется overflow-clip */}
        <div className="relative h-[72px] w-[80px] shrink-0">
          <div className={`${colBase} left-0 top-[-2px] group-hover/banner:-translate-y-[10px]`} style={{ willChange: "transform" }}>
            {col1.map((c, i) => (
              <MiniIconTile key={i} bg={c.bg} icon={c.icon} />
            ))}
          </div>
          <div className={`${colBase} left-[28px] top-1/2 -translate-y-1/2 group-hover/banner:translate-y-[calc(-50%+10px)]`} style={{ willChange: "transform" }}>
            {col2.map((c, i) => (
              <MiniIconTile key={i} bg={c.bg} icon={c.icon} />
            ))}
          </div>
          <div className={`${colBase} left-[56px] top-[-2px] group-hover/banner:-translate-y-[10px]`} style={{ willChange: "transform" }}>
            {col3.map((c, i) => (
              <MiniIconTile key={i} bg={c.bg} icon={c.icon} />
            ))}
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-[4px]">
          <p className="truncate text-[13px] font-medium leading-[normal] tracking-[-0.13px]" style={{ color: tokens.black }}>
            Приглашайте знакомых и получайте награды
          </p>
          <p className="truncate text-[12px] leading-[normal] tracking-[-0.24px]" style={{ color: tokens.grey }}>
            Они получат скидку 30%, а вы — награды за их оплаты
          </p>
        </div>
      </div>
    </div>
  );
}
