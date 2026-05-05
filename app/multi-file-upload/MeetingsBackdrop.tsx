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
import type { ProcessingMeeting } from "./types";

const inter = Inter({ subsets: ["latin", "cyrillic"], weight: ["400", "500"] });

const BASE = process.env.NODE_ENV === "production" ? "/design-lab" : "";
const asset = (p: string) => `${BASE}/search-filters/${p}`;

const tokens = {
  blue: "#0138c7",
  black: "#212833",
  grey: "#818aa3",
  grey20: "#f7f7f8",
  grey40: "#efefef",
  grey50: "#dddedf",
  grey60: "#c7c8ca",
  blueSea: "#e4ecfa",
  red: "#c33",
  green: "#2dbe8a",
};

function SourceIcon({ src }: { src: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={asset(src)}
      alt=""
      className="h-[14px] w-[14px] max-w-none shrink-0 object-contain"
    />
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
        <span
          className="text-[12px] font-medium"
          style={{ color: tokens.red, letterSpacing: "-0.24px" }}
        >
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
      <div className="h-[48px] w-[80px] shrink-0 overflow-clip rounded-[4px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset("property1.png")} alt="" className="h-full w-full object-cover" />
      </div>
    );
  }
  // audio1 / audio2 / audio3
  const map: Record<string, string> = {
    audio1: "audio1.png",
    audio2: "audio2.png",
    audio3: "audio3.png",
  };
  return (
    <div className="h-[48px] w-[80px] shrink-0 overflow-clip rounded-[4px]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={asset(map[kind] ?? "audio1.png")} alt="" className="h-full w-full object-cover" />
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
            <p
              className="truncate text-[13px] font-medium"
              style={{ color: tokens.black, letterSpacing: "-0.13px" }}
            >
              {m.title}
            </p>
            <div className="flex items-center gap-[4px]">
              <span
                className="text-[12px]"
                style={{ color: tokens.grey, letterSpacing: "-0.24px" }}
              >
                {m.startTime}
              </span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={asset("dot.svg")} alt="" className="h-[3px] w-[3px]" />
              <span
                className="text-[12px]"
                style={{ color: tokens.grey, letterSpacing: "-0.24px" }}
              >
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

function ProcessingRow({
  m,
  reducedMotion,
}: {
  m: ProcessingMeeting;
  reducedMotion: boolean;
}) {
  return (
    <div
      className="flex h-[72px] w-full items-center justify-between bg-white px-[24px] py-[12px]"
      style={{
        animation: reducedMotion ? "none" : "mfu-slide-in 280ms cubic-bezier(0.22,1,0.36,1)",
      }}
    >
      <div className="flex items-center gap-[24px]">
        <div className="flex w-[446px] items-center gap-[12px]">
          {m.kind === "audio" ? (
            <div className="h-[48px] w-[80px] shrink-0 overflow-clip rounded-[4px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${BASE}/multi-file-upload/audio-thumbnail.svg`}
                alt=""
                className="h-full w-full"
                style={{ display: "block" }}
              />
            </div>
          ) : (
            <div
              className="flex h-[48px] w-[80px] shrink-0 items-center justify-center overflow-clip rounded-[4px] border border-solid p-[8px]"
              style={{ backgroundColor: tokens.grey20, borderColor: tokens.grey40 }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${BASE}/multi-file-upload/video-icon.svg`}
                alt=""
                className="h-[20px] w-[20px]"
              />
            </div>
          )}
          <div className="flex min-w-0 flex-1 flex-col gap-[4px]">
            <p
              className="truncate text-[13px] font-medium"
              style={{ color: tokens.black, letterSpacing: "-0.13px" }}
            >
              {m.title}
            </p>
            <div className="flex items-center gap-[6px]">
              {m.isProcessing ? (
                <>
                  <span
                    className="inline-block h-[6px] w-[6px] rounded-full"
                    style={{
                      backgroundColor: tokens.blue,
                      animation: reducedMotion ? "none" : "mfu-pulse 1.4s ease-in-out infinite",
                    }}
                  />
                  <span
                    className="text-[12px] font-medium"
                    style={{ color: tokens.blue, letterSpacing: "-0.24px" }}
                  >
                    Обрабатывается
                  </span>
                </>
              ) : (
                <>
                  <span
                    className="text-[12px]"
                    style={{ color: tokens.grey, letterSpacing: "-0.24px" }}
                  >
                    {m.durationMin} min
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex w-[180px] flex-col items-start">
          <div className="flex w-[156px] items-center gap-[8px]">
            <AuthorAvatar color="#4F7CFF" letter="M" title="Mymeet.ai" />
            <p className="min-w-0 flex-1 truncate text-[12px]" style={{ color: tokens.black, letterSpacing: "-0.24px" }}>
              hello@mymeet.ai
            </p>
          </div>
        </div>
        <div className="flex w-[180px] flex-col items-start overflow-clip">
          <div className="flex w-full items-center gap-[8px]">
            <SourceIcon src={SOURCE_META.uploaded.icon} />
            <span className="truncate text-[12px]" style={{ color: tokens.black, letterSpacing: "-0.24px" }}>
              {SOURCE_META.uploaded.label}
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

export default function MeetingsBackdrop({
  onAddMeetingClick,
  injectedTopMeetings,
  reducedMotion,
}: {
  onAddMeetingClick: () => void;
  injectedTopMeetings: ProcessingMeeting[];
  reducedMotion: boolean;
}) {
  const groups = groupByDate(MEETINGS);

  return (
    <main
      className={`min-h-screen w-full ${inter.className}`}
      style={{ backgroundColor: "#fff", color: tokens.black }}
    >
      {/* keyframes used by ProcessingRow */}
      <style jsx global>{`
        @keyframes mfu-slide-in {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes mfu-pulse {
          0%, 100% { opacity: 0.4; }
          50%      { opacity: 1; }
        }

        /* Text-state swap (uploading ↔ done ↔ error) */
        :root {
          --text-swap-dur: 140ms;
          --text-swap-translate-y: 8px;
          --text-swap-blur: 2px;
          --text-swap-ease: ease-out;
        }
        .t-text-swap {
          display: inline-block;
          transform: translateY(0);
          filter: blur(0);
          opacity: 1;
          transition:
            transform var(--text-swap-dur) var(--text-swap-ease),
            filter    var(--text-swap-dur) var(--text-swap-ease),
            opacity   var(--text-swap-dur) var(--text-swap-ease);
          will-change: transform, filter, opacity;
        }
        .t-text-swap.is-exit {
          transform: translateY(calc(var(--text-swap-translate-y) * -1));
          filter: blur(var(--text-swap-blur));
          opacity: 0;
        }
        .t-text-swap.is-enter-start {
          transform: translateY(var(--text-swap-translate-y));
          filter: blur(var(--text-swap-blur));
          opacity: 0;
          transition: none;
        }
        @media (prefers-reduced-motion: reduce) {
          .t-text-swap { transition: none !important; }
        }

        /* File queue scrollbar — thumb only, no track */
        .mfu-queue-scroll {
          scrollbar-width: thin;
          scrollbar-color: ${tokens.grey60} transparent;
        }
        .mfu-queue-scroll::-webkit-scrollbar {
          width: 8px;
          height: 8px;
          background: transparent;
        }
        .mfu-queue-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .mfu-queue-scroll::-webkit-scrollbar-thumb {
          background: ${tokens.grey60};
          border-radius: 8px;
        }
        .mfu-queue-scroll::-webkit-scrollbar-thumb:hover {
          background: ${tokens.grey};
        }
      `}</style>

      <div className="flex w-full">
        {/* Sidebar */}
        <aside
          className="sticky top-0 flex h-screen w-[280px] shrink-0 flex-col justify-between border-r border-solid pt-[16px] pb-[4px]"
          style={{ borderColor: tokens.grey40 }}
        >
          <div className="flex w-[280px] flex-col gap-[12px]">
            <div className="flex w-full flex-col gap-[24px] px-[12px]">
              <div className="flex items-center">
                <div className="flex w-[128.941px] items-center justify-center gap-[9.412px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={asset("logo-icon.svg")} alt="" className="h-[30.118px] w-[30.118px]" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={asset("mymeet-text.svg")} alt="mymeet.ai" className="h-[18.353px] w-[87.53px]" />
                </div>
              </div>
              <div className="flex w-full flex-col gap-[16px]">
                <button
                  type="button"
                  onClick={onAddMeetingClick}
                  className="flex h-[36px] w-full items-center justify-between rounded-[4px] px-[12px] py-[10px] hover:opacity-90"
                  style={{ backgroundColor: tokens.blue }}
                >
                  <span
                    className="text-[13px] font-medium text-white"
                    style={{ letterSpacing: "-0.13px" }}
                  >
                    Добавить встречу
                  </span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={asset("icon-add.svg")} alt="" className="h-[16px] w-[16px]" />
                </button>
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
          <div className="flex w-[280px] flex-col items-start rounded-[4px]">
            <div className="h-px w-full" style={{ backgroundColor: tokens.grey40 }} />
            <div className="flex w-full flex-col items-start rounded-t-[4px] pl-[8px] pr-[4px] py-[4px]">
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
                <span className="text-[12px]" style={{ color: tokens.grey50 }}>
                  ⋯
                </span>
              </div>
            </div>
            <div className="h-px w-full" style={{ backgroundColor: tokens.grey40 }} />
            <div className="flex w-full flex-col items-start rounded-b-[4px] px-[8px] py-[4px]">
              <div className="flex w-full flex-col gap-[8px] p-[4px]">
                <div className="flex w-full items-end justify-between">
                  <span className="text-[13px] font-medium" style={{ color: tokens.black, letterSpacing: "-0.13px" }}>
                    Pro plan
                  </span>
                  <span className="text-[12px] font-medium" style={{ color: tokens.black, letterSpacing: "-0.24px" }}>
                    Доступно 1850 из 2500
                  </span>
                </div>
                <div className="relative h-[6px] w-full overflow-hidden rounded-[4px]" style={{ backgroundColor: tokens.blueSea }}>
                  <div className="h-full rounded-[4px]" style={{ width: "73.57%", backgroundColor: tokens.blue }} />
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <section className="flex h-full min-w-0 min-h-0 flex-1 flex-col items-start justify-start">
          <div
            className="flex h-[54px] w-full items-center border-b border-solid bg-white p-[16px]"
            style={{ borderColor: tokens.grey40 }}
          >
            <h1 className="text-[13px] font-medium" style={{ color: tokens.black, letterSpacing: "-0.13px" }}>
              Встречи
            </h1>
          </div>

          <div className="flex w-full items-center bg-white px-[16px] py-[16px]">
            <div className="flex h-[36px] items-center">
              <div
                className="flex h-full flex-col items-center justify-center rounded-[4px] px-[10px] py-[8px]"
                style={{ backgroundColor: tokens.grey20 }}
              >
                <span className="whitespace-nowrap text-[13px]" style={{ color: tokens.black, letterSpacing: "-0.13px" }}>
                  Все встречи
                </span>
              </div>
              <div className="flex h-full flex-col items-center justify-center rounded-[4px] px-[10px] py-[8px]">
                <span className="whitespace-nowrap text-[13px]" style={{ color: tokens.grey, letterSpacing: "-0.13px" }}>
                  Мои встречи
                </span>
              </div>
              <div className="flex h-full flex-col items-center justify-center px-[10px] py-[8px]">
                <span className="whitespace-nowrap text-[13px]" style={{ color: tokens.grey, letterSpacing: "-0.13px" }}>
                  Доступные мне
                </span>
              </div>
            </div>
          </div>

          <div className="flex w-full min-h-0 flex-1 flex-col items-start overflow-y-auto">
            <div className="flex w-full flex-col items-start">
              {groups.map((g, gi) => (
                <div key={g.key} className="flex w-full flex-col">
                  <DateHeader label={g.label} subLabel={g.subLabel} />
                  {/* injected items go on top of "Сегодня" / first group */}
                  {gi === 0 &&
                    injectedTopMeetings.map((pm) => (
                      <ProcessingRow key={pm.id} m={pm} reducedMotion={reducedMotion} />
                    ))}
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
