"use client";

import { Inter } from "next/font/google";
import {
  MEETINGS,
  SOURCE_META,
  getAuthor,
  type Meeting,
  type ThumbKind,
} from "../search-filters/mock-data";
import { groupByDate } from "../search-filters/use-filtered-meetings";

const inter = Inter({ subsets: ["latin", "cyrillic"], weight: ["400", "500"] });

const BASE = process.env.NODE_ENV === "production" ? "/design-lab" : "";
const asset = (p: string) => `${BASE}/search-filters/${p}`;
const ctaAsset = (p: string) => `${BASE}/b2c-upgrade-cta/${p}`;

const tokens = {
  blue: "#0138c7",
  black: "#212833",
  grey: "#818aa3",
  grey15: "#f3f3f3",
  grey20: "#f7f7f8",
  grey40: "#efefef",
  blueSea: "#e4ecfa",
  red: "#c33",
};

// ─────────────────────────────────────────────────────────────────────────────
// Meeting list primitives (slimmed copy from search-filters / app-leads-v2)
// ─────────────────────────────────────────────────────────────────────────────

function SourceIcon({ src }: { src: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={asset(src)} alt="" className="h-[14px] w-[14px] max-w-none shrink-0 object-contain" />
  );
}

function AuthorAvatar({ color, letter, title }: { color: string; letter: string; title?: string }) {
  return (
    <span
      className="flex h-[16px] w-[16px] shrink-0 items-center justify-center rounded-full text-[9px] font-medium text-white"
      style={{ backgroundColor: color, letterSpacing: "-0.18px" }}
      title={title}
    >
      {letter}
    </span>
  );
}

function Thumb({ kind }: { kind: ThumbKind }) {
  if (kind === "error") {
    return (
      <div
        className="flex h-[48px] w-[80px] shrink-0 items-center justify-center overflow-clip rounded-[4px] border border-solid p-[8px]"
        style={{ backgroundColor: tokens.grey20, borderColor: tokens.grey40 }}
      >
        <span className="text-[12px] font-medium" style={{ color: tokens.red, letterSpacing: "-0.24px" }}>
          ERROR
        </span>
      </div>
    );
  }
  if (kind === "legacy") {
    return (
      <div
        className="flex h-[48px] w-[80px] shrink-0 items-center justify-center overflow-clip rounded-[4px] border border-solid p-[8px]"
        style={{ backgroundColor: tokens.grey20, borderColor: tokens.grey40 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset("image442.png")} alt="" className="h-[18px] w-[18px] object-cover" />
      </div>
    );
  }
  if (kind === "empty") {
    return (
      <div
        className="flex h-[48px] w-[80px] shrink-0 items-center justify-center overflow-clip rounded-[4px] border border-solid p-[8px]"
        style={{ backgroundColor: tokens.grey20, borderColor: tokens.grey40 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset("frame-audio2.svg")} alt="" className="h-[20px] w-[20px]" />
      </div>
    );
  }
  if (kind === "new") {
    return (
      <div className="relative h-[48px] w-[80px] shrink-0 overflow-clip rounded-[4px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset("property2.png")} alt="" className="absolute inset-0 h-full w-full rounded-[4px] object-cover" />
        <div className="absolute inset-0 rounded-[4px] backdrop-blur-[3px] bg-[rgba(0,0,0,0.01)]" />
        <div className="absolute inset-0 rounded-[4px] bg-[rgba(255,255,255,0.24)]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="text-[12px] font-medium text-white"
            style={{ letterSpacing: "-0.24px", fontFamily: inter.style.fontFamily }}
          >
            NEW
          </span>
        </div>
      </div>
    );
  }
  if (kind === "default") {
    return (
      <div className="relative h-[48px] w-[80px] shrink-0 overflow-clip rounded-[4px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset("property2.png")} alt="" className="absolute inset-0 h-full w-full rounded-[4px] object-cover" />
      </div>
    );
  }
  const imgMap: Record<string, string> = {
    audio1: "audio1.png",
    audio2: "audio2.png",
    audio3: "audio3.png",
  };
  return (
    <div className="relative h-[48px] w-[80px] shrink-0 overflow-clip rounded-[4px]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={asset(imgMap[kind])} alt="" className="absolute inset-0 h-full w-full rounded-[4px] object-cover" />
      <div className="absolute inset-0 rounded-[4px] bg-[rgba(0,0,0,0.08)]" />
      <div className="absolute inset-0 flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset("frame-audio.svg")} alt="" className="h-[20px] w-[20px]" />
      </div>
    </div>
  );
}

function MeetingRow({ m }: { m: Meeting }) {
  const author = getAuthor(m.authorId);
  const source = SOURCE_META[m.source];
  return (
    <div className="flex h-[72px] w-full items-center justify-between bg-white px-[24px] py-[12px]">
      <div className="flex items-center gap-[24px]">
        <div className="flex w-[446px] items-center gap-[12px]">
          <Thumb kind={m.thumb} />
          <div className="flex min-w-0 flex-1 flex-col gap-[4px]">
            <p className="truncate text-[13px] font-medium" style={{ color: tokens.black, letterSpacing: "-0.13px" }}>
              {m.title}
            </p>
            <div className="flex items-center gap-[4px]">
              <span className="text-[12px]" style={{ color: tokens.grey, letterSpacing: "-0.24px" }}>
                {m.startTime}
              </span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={asset("dot.svg")} alt="" className="h-[3px] w-[3px]" />
              <span className="text-[12px]" style={{ color: tokens.grey, letterSpacing: "-0.24px" }}>
                {m.durationMin} min
              </span>
            </div>
          </div>
        </div>
        <div className="flex w-[180px] flex-col items-start">
          <div className="flex w-[156px] items-center gap-[8px]">
            <AuthorAvatar color={author.avatarColor} letter={author.name.charAt(0)} title={author.name} />
            <p className="min-w-0 flex-1 truncate text-[12px]" style={{ color: tokens.black, letterSpacing: "-0.24px" }}>
              {author.email}
            </p>
          </div>
        </div>
        <div className="flex w-[180px] flex-col items-start overflow-clip">
          <div className="flex w-full items-center gap-[8px]">
            <SourceIcon src={source.icon} />
            <span className="truncate text-[12px]" style={{ color: tokens.black, letterSpacing: "-0.24px" }}>
              {source.label}
            </span>
          </div>
        </div>
      </div>
      <div className="h-[16px] w-[16px] opacity-0" />
    </div>
  );
}

function DateHeader({ label, subLabel }: { label: string; subLabel: string }) {
  return (
    <div className="flex w-full shrink-0 flex-col items-start pt-[12px]">
      <div className="flex w-full flex-col items-start gap-[8px]">
        <div className="flex items-center gap-[6px] px-[24px] text-[13px]" style={{ letterSpacing: "-0.13px" }}>
          <span className="font-medium" style={{ color: tokens.black }}>
            {label}
          </span>
          <span className="font-normal" style={{ color: tokens.grey }}>
            {subLabel}
          </span>
        </div>
        <div className="h-px w-full shrink-0" style={{ backgroundColor: tokens.grey40 }} />
      </div>
    </div>
  );
}

function SidebarMenuItem({
  icon,
  label,
  active,
}: {
  icon: string;
  label: string;
  active?: boolean;
}) {
  return (
    <div
      className="flex w-full items-center rounded-[4px] p-[4px]"
      style={{ backgroundColor: active ? tokens.grey20 : "#fff" }}
    >
      <div className="flex items-center gap-[8px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset(icon)} alt="" className="h-[16px] w-[16px] shrink-0" />
        <span className="text-[13px]" style={{ color: tokens.black, letterSpacing: "-0.13px" }}>
          {label}
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Notion-style drum-roll arrow inside a static blue circle.
// On group-hover: arrow scrolls up & out, identical arrow scrolls in from below.
// Circle stays put; only the inner column translates.
// ─────────────────────────────────────────────────────────────────────────────

function ArrowUpCircle({ size, animated = false }: { size: number; animated?: boolean }) {
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-full"
      style={{ width: size, height: size, backgroundColor: tokens.blue }}
    >
      {animated ? (
        <div className="flex flex-col transition-transform duration-[180ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:-translate-y-1/2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ctaAsset("ic-arrow-up-white.svg")} alt="" className="block shrink-0" style={{ width: size, height: size }} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ctaAsset("ic-arrow-up-white.svg")} alt="" aria-hidden="true" className="block shrink-0" style={{ width: size, height: size }} />
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={ctaAsset("ic-arrow-up-white.svg")} alt="" className="block shrink-0" style={{ width: size, height: size }} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NEW: Upgrade Plan CTA (B2C STA element)
// ─────────────────────────────────────────────────────────────────────────────

function UpgradePlanCTA() {
  // Pixel-perfect against Figma node 35707:25224.
  // Banner 280×54 (w-full of 280 sidebar + the 38px tile stack overflowing into pr-12).
  // 3 stacked tiles container: absolute left[181] top[8] w[91] h[38.388].
  return (
    <div
      role="button"
      tabIndex={0}
      className="group relative flex w-full cursor-pointer items-start gap-[4px] overflow-hidden border-b border-solid pl-[8px] pr-[12px] py-[8px]"
      style={{ backgroundColor: tokens.grey15, borderColor: tokens.grey40 }}
    >
      {/* Text cluster */}
      <div className="flex items-center gap-[8px] rounded-[4px] p-[4px]">
        <ArrowUpCircle size={16} animated />
        <span
          className="whitespace-nowrap text-[13px] font-medium leading-none"
          style={{ color: tokens.blue, letterSpacing: "-0.13px" }}
        >
          Улучшить план
        </span>
      </div>

      {/*
        3 stacked tiles — pixel-mapped from Figma frame 35707:25229.
        Wrappers in Figma: left (0.21, 2.21, 39.58), right (52.21, 2.21, 39.58),
        middle tile (30, 6, 32). The 39.58 wrappers are the AABB of a rotated
        32-tile, so positioning my 32-tile by tile-top-left = wrapper + (3.79, 3.79)
        keeps centers identical to Figma. All 3 tile centers at y=22 (same height).
      */}
      <div className="absolute h-[38.389px] w-[91px] left-[181px] top-[10px]">
        {/* Right tile (green music, +16° → +22°) — rendered first so it sits behind */}
        <div
          className="absolute h-[32px] w-[32px] flex items-center justify-center rounded-[4px] border-[1.021px] border-solid bg-white rotate-[16deg] transition-transform duration-200 ease-out group-hover:translate-x-[3px] group-hover:-translate-y-[3px] group-hover:rotate-[22deg]"
          style={{ borderColor: tokens.grey40, left: "56px", top: "6px" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ctaAsset("ic-tile-music.svg")} alt="" className="h-[16.335px] w-[16.335px] shrink-0" />
        </div>

        {/* Left tile (orange bolt, -16° → -22°) */}
        <div
          className="absolute h-[32px] w-[32px] flex items-center justify-center rounded-[4px] border-[1.021px] border-solid bg-white -rotate-[16deg] transition-transform duration-200 ease-out group-hover:-translate-x-[3px] group-hover:-translate-y-[3px] group-hover:-rotate-[22deg]"
          style={{ borderColor: tokens.grey40, left: "4px", top: "6px" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ctaAsset("ic-tile-bolt.svg")} alt="" className="h-[18.286px] w-[18.286px] shrink-0" />
        </div>

        {/* Middle tile (blue arrow circle, no rotation) — on top, lifts straight up */}
        <div
          className="absolute h-[32px] w-[32px] flex items-center justify-center rounded-[4px] border-[1.021px] border-solid bg-white transition-transform duration-200 ease-out group-hover:-translate-y-[2px]"
          style={{ borderColor: tokens.grey40, left: "30px", top: "6px" }}
        >
          <ArrowUpCircle size={18.286} />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function B2CUpgradeCTAPage() {
  const groups = groupByDate(MEETINGS);

  return (
    <main
      className={`${inter.className} flex h-screen w-full flex-col overflow-hidden bg-white`}
      style={{ color: tokens.black }}
    >
      <div className="relative flex h-full min-h-0 flex-1 items-stretch bg-white">
        {/* Sidebar */}
        <aside
          className="sticky top-0 flex h-full w-[280px] shrink-0 flex-col justify-between border-r border-solid pt-[16px] pb-[4px]"
          style={{ borderColor: tokens.grey40 }}
        >
          <div className="flex w-[280px] flex-col gap-[12px]">
            <div className="flex w-full flex-col gap-[24px] px-[12px]">
              <div className="flex items-center">
                <div className="flex w-[128.941px] items-center justify-center gap-[8px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={asset("logo-icon.svg")} alt="" className="h-[32px] w-[32px]" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={asset("mymeet-text.svg")} alt="mymeet.ai" className="h-[18px] w-[88px]" />
                </div>
              </div>
              <div className="flex w-full flex-col gap-[16px]">
                <div
                  className="flex h-[36px] w-full items-center justify-between rounded-[4px] px-[12px] py-[8px]"
                  style={{ backgroundColor: tokens.blue }}
                >
                  <span className="text-[13px] font-medium text-white" style={{ letterSpacing: "-0.13px" }}>
                    Добавить встречу
                  </span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={asset("icon-add.svg")} alt="" className="h-[16px] w-[16px]" />
                </div>
                <div className="flex w-[256px] flex-col items-start gap-[2px]">
                  <SidebarMenuItem icon="icon-meetings.svg" label="Встречи" active />
                  <SidebarMenuItem icon="icon-ai.svg" label="AI Отчеты" />
                  <SidebarMenuItem icon="icon-integrations.svg" label="Интеграции" />
                  <SidebarMenuItem icon="icon-settings.svg" label="Настройки" />
                </div>
              </div>
            </div>
            <div className="h-px w-full" style={{ backgroundColor: tokens.grey40 }} />
            <div className="flex w-full flex-col items-start gap-[2px] px-[12px]">
              <SidebarMenuItem icon="icon-support.svg" label="Поддержка" />
              <SidebarMenuItem icon="icon-kb.svg" label="База знаний" />
              <SidebarMenuItem icon="icon-free.svg" label="Бесплатные минуты" />
              <SidebarMenuItem icon="icon-telegram.svg" label="Телеграм-бот" />
              <SidebarMenuItem icon="icon-power.svg" label="Выйти" />
            </div>
          </div>

          <div className="flex w-[280px] flex-col items-start">
            <div className="h-px w-full" style={{ backgroundColor: tokens.grey40 }} />

            {/* NEW B2C STA element */}
            <UpgradePlanCTA />

            <div className="flex w-full flex-col items-start pl-[8px] pr-[4px] py-[4px]">
              <div className="flex w-full items-center justify-between rounded-[4px] pl-[4px] pr-[8px] py-[4px]">
                <div className="flex items-center gap-[8px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={asset("user-avatar.png")} alt="" className="h-[32px] w-[32px] rounded-[3px] object-cover" />
                  <div className="flex flex-col items-start">
                    <p className="text-[13px] font-medium" style={{ color: tokens.black, letterSpacing: "-0.13px" }}>
                      Mymeet.ai
                    </p>
                    <p className="text-[12px]" style={{ color: tokens.grey, letterSpacing: "-0.24px" }}>
                      Владелец
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="h-px w-full" style={{ backgroundColor: tokens.grey40 }} />
            <div className="flex w-full flex-col items-start px-[8px] py-[4px]">
              <div className="flex w-full flex-col gap-[8px] p-[4px]">
                <div className="flex w-full items-end justify-between">
                  <span className="text-[13px] font-medium" style={{ color: tokens.black, letterSpacing: "-0.13px" }}>
                    Pro plan
                  </span>
                  <span className="text-[12px] font-medium" style={{ color: tokens.black, letterSpacing: "-0.24px" }}>
                    Доступно 1850 из 2500
                  </span>
                </div>
                <div className="relative h-[6px] w-full overflow-hidden rounded-full" style={{ backgroundColor: tokens.blueSea }}>
                  <div className="h-full rounded-full" style={{ width: "73.57%", backgroundColor: tokens.blue }} />
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <section className="flex h-full min-w-0 min-h-0 flex-1 flex-col items-start justify-start">
          <div
            className="flex h-[54px] w-full shrink-0 items-center border-b border-solid bg-white p-[16px]"
            style={{ borderColor: tokens.grey40 }}
          >
            <h1 className="text-[13px] font-medium" style={{ color: tokens.black, letterSpacing: "-0.13px" }}>
              Встречи
            </h1>
          </div>

          <div className="flex w-full shrink-0 items-center bg-white px-[16px] py-[16px]">
            <div className="flex w-full items-center">
              <div className="flex items-center gap-[8px]">
                <div
                  className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-[4px] border border-solid bg-white"
                  style={{ borderColor: tokens.grey40 }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={asset("icon-filter.svg")} alt="" className="h-[16px] w-[16px] max-w-none shrink-0" />
                </div>
                <div
                  className="flex h-[36px] w-[36px] items-center justify-center rounded-[4px] border border-solid bg-white"
                  style={{ borderColor: tokens.grey40 }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={asset("icon-search.svg")} alt="" className="h-[16px] w-[16px] max-w-none shrink-0" />
                </div>
              </div>
              <div className="flex items-center gap-[12px] whitespace-nowrap" style={{ marginLeft: 12 }}>
                <div className="h-[24px] w-px shrink-0" style={{ backgroundColor: tokens.grey40 }} />
                <div className="flex h-[36px] items-center">
                  <div
                    className="flex h-full flex-col items-center justify-center rounded-[4px] px-[8px] py-[8px]"
                    style={{ backgroundColor: tokens.grey20 }}
                  >
                    <span className="whitespace-nowrap text-[13px]" style={{ color: tokens.black, letterSpacing: "-0.13px" }}>
                      Все встречи
                    </span>
                  </div>
                  <div className="flex h-full flex-col items-center justify-center rounded-[4px] px-[8px] py-[8px]">
                    <span className="whitespace-nowrap text-[13px]" style={{ color: tokens.grey, letterSpacing: "-0.13px" }}>
                      Мои встречи
                    </span>
                  </div>
                  <div className="flex h-full flex-col items-center justify-center px-[8px] py-[8px]">
                    <span className="whitespace-nowrap text-[13px]" style={{ color: tokens.grey, letterSpacing: "-0.13px" }}>
                      Доступные мне
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex w-full min-h-0 flex-1 flex-col items-start overflow-y-auto pt-[8px]">
            <div className="flex w-full flex-col items-start">
              {groups.map((g) => (
                <div key={g.key} className="flex w-full flex-col">
                  <DateHeader label={g.label} subLabel={g.subLabel} />
                  {g.meetings.map((m) => (
                    <MeetingRow key={m.id} m={m} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
