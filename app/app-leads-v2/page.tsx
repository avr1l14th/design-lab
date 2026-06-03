"use client";

import { Inter } from "next/font/google";
import { useEffect, useLayoutEffect, useState } from "react";
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
const leadAsset = (p: string) => `${BASE}/app-leads-v2/${p}`;

const tokens = {
  blue: "#0138c7",
  black: "#212833",
  grey: "#818aa3",
  grey10: "#fafafa",
  grey15: "#f3f3f3",
  grey20: "#f7f7f8",
  grey40: "#efefef",
  grey50: "#dddedf",
  grey60: "#c7c8ca",
  blueSea: "#e4ecfa",
  red: "#c33",
};

// ─────────────────────────────────────────────────────────────────────────────
// Existing meeting list primitives (copied from search-filters)
// ─────────────────────────────────────────────────────────────────────────────

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
// Lead elements
// ─────────────────────────────────────────────────────────────────────────────

function TopBanner({ onOpen }: { onOpen: () => void }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => e.key === "Enter" && onOpen()}
      className="flex h-[40px] w-full shrink-0 cursor-pointer items-center justify-between border-b border-solid p-[12px] text-left hover:bg-[color:var(--_hover)] transition-colors"
      style={{ backgroundColor: tokens.grey10, borderColor: tokens.grey40, ["--_hover" as string]: tokens.grey20 }}
    >
      <div className="h-[16px] w-[16px]" />
      <div className="flex items-center gap-[8px]">
        <div className="flex items-center gap-[8px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={leadAsset("ic-team.svg")} alt="" className="h-[16px] w-[16px] shrink-0" />
          <span
            className="whitespace-nowrap text-[13px]"
            style={{ color: tokens.black, letterSpacing: "-0.13px" }}
          >
            Тариф Business с расширенным функционалом
          </span>
        </div>
        <span
          className="flex items-center gap-[4px] whitespace-nowrap text-[13px]"
          style={{ color: tokens.grey, letterSpacing: "-0.13px" }}
        >
          Подключить бесплатно
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={leadAsset("ic-arrow-right.svg")} alt="" className="h-[9px] w-[10px]" />
        </span>
      </div>
      <button
        type="button"
        aria-label="Закрыть"
        onClick={(e) => { e.stopPropagation(); setDismissed(true); }}
        className="flex h-[16px] w-[16px] items-center justify-center"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={leadAsset("ic-close.svg")} alt="" className="h-[16px] w-[16px]" />
      </button>
    </div>
  );
}

function MiniIconTile({ bg, icon }: { bg: string; icon: string }) {
  return (
    <div
      className="flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-[3px]"
      style={{ backgroundColor: bg }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={leadAsset(icon)} alt="" className="h-[12px] w-[12px]" />
    </div>
  );
}

function ListBanner({ onOpen }: { onOpen: () => void }) {
  const [dismissed, setDismissed] = useState(false);

  const col1 = [
    { bg: "rgba(242,195,0,0.15)", icon: "tile-gold.svg" },
    { bg: "rgba(1,56,199,0.16)", icon: "tile-blue.svg" },
    { bg: "rgba(129,138,163,0.15)", icon: "tile-grey.svg" },
  ];
  const col2 = [
    { bg: "rgba(33,40,51,0.15)", icon: "tile-dark.svg" },
    { bg: "rgba(139,47,232,0.15)", icon: "tile-dark.svg" },
    { bg: "rgba(13,150,85,0.15)", icon: "tile-green.svg" },
    { bg: "rgba(139,47,232,0.15)", icon: "tile-dark.svg" },
  ];
  const col3 = [
    { bg: "rgba(13,172,170,0.15)", icon: "tile-teal.svg" },
    { bg: "rgba(255,158,44,0.15)", icon: "tile-orange.svg" },
    { bg: "rgba(204,51,51,0.15)", icon: "tile-red.svg" },
  ];

  if (dismissed) return null;

  return (
    // mt-[-9px] pulls the wrapper up by 9px (cancels scroll container pt-[9px] visually),
    // pt-[9px] gives space inside for the icon to float above the banner border.
    <div className="group/row relative -mt-[9px] flex w-full items-center px-[16px] pt-[9px]">

      {/* ✕ dismiss — sits at top-right corner of banner edge, visible on row hover */}
      <button
        type="button"
        aria-label="Закрыть"
        onClick={(e) => { e.stopPropagation(); setDismissed(true); }}
        className="absolute right-[9px] top-[0px] z-10 flex items-center justify-center opacity-0 transition-opacity duration-150 group-hover/row:opacity-100"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={leadAsset("ic-list-close.svg")} width={16} height={16} alt="" />
      </button>

      {/* group/banner — whole banner is clickable; illustration hover scoped here */}
      <div
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(e) => e.key === "Enter" && onOpen()}
        className="group/banner flex h-[72px] w-full cursor-pointer items-center gap-[8px] overflow-clip rounded-[4px] border border-solid bg-white pl-[12px] pr-[18px] py-[12px] transition-colors hover:bg-[#FAFAFA] active:bg-[#F7F7F8]"
        style={{ borderColor: tokens.grey40 }}
      >
        {/* Illustration — columns drift on banner hover, clipped by overflow-clip */}
        <div className="relative h-[48px] w-[80px] shrink-0">
          <div className="absolute top-1/2 left-[calc(50%-2px)] flex -translate-x-1/2 -translate-y-1/2 items-center gap-[8px]">
            <div
              className="flex flex-col items-start gap-[8px] transition-transform duration-[600ms] ease-out group-hover/banner:-translate-y-[10px]"
              style={{ willChange: "transform" }}
            >
              {col1.map((c, i) => (
                <MiniIconTile key={i} bg={c.bg} icon={c.icon} />
              ))}
            </div>
            <div
              className="flex flex-col items-start gap-[8px] transition-transform duration-[600ms] ease-out group-hover/banner:translate-y-[10px]"
              style={{ willChange: "transform" }}
            >
              {col2.map((c, i) => (
                <MiniIconTile key={i} bg={c.bg} icon={c.icon} />
              ))}
            </div>
            <div
              className="flex flex-col items-start gap-[8px] transition-transform duration-[600ms] ease-out group-hover/banner:-translate-y-[10px]"
              style={{ willChange: "transform" }}
            >
              {col3.map((c, i) => (
                <MiniIconTile key={i} bg={c.bg} icon={c.icon} />
              ))}
            </div>
          </div>
        </div>

        {/* Text */}
        <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
          <p
            className="truncate text-[13px] font-medium"
            style={{ color: tokens.black, letterSpacing: "-0.13px" }}
          >
            Получите тестовый доступ на всю команду
          </p>
          <p
            className="truncate text-[12px]"
            style={{ color: tokens.grey, letterSpacing: "-0.24px" }}
          >
            Выдадим тариф Business и обсудим решение
          </p>
        </div>

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal — Тариф Business на команду
// ─────────────────────────────────────────────────────────────────────────────

const HEADCOUNT_OPTIONS = ["1–10", "11–50", "51–200", "201–500", "500+"];

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex w-full flex-col items-start justify-center gap-[6px]">
      <span
        className="whitespace-nowrap text-[13px] leading-[16px]"
        style={{ color: tokens.black, letterSpacing: "-0.13px" }}
      >
        {label}
      </span>
      {children}
    </div>
  );
}

function ModalLeftPanel({
  company,
  contact,
  headcount,
  setCompany,
  setContact,
  setHeadcount,
  onSubmit,
  filled,
}: {
  company: string;
  contact: string;
  headcount: string;
  setCompany: (v: string) => void;
  setContact: (v: string) => void;
  setHeadcount: (v: string) => void;
  onSubmit: () => void;
  filled: boolean;
}) {
  const [headcountOpen, setHeadcountOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "sent">("idle");

  function handleSubmit() {
    if (status !== "idle") return;
    setStatus("loading");
    setTimeout(() => {
      setStatus("sent");
      setTimeout(() => onSubmit(), 2000);
    }, 900);
  }

  return (
    <div className="relative flex h-full w-[410px] shrink-0 flex-col items-center justify-center gap-[24px] overflow-visible rounded-l-[4px] bg-white p-[32px]">
      <div className="flex w-full flex-col items-start gap-[12px]">
        <div className="flex w-full flex-col items-start gap-[6px]">
          {/* chip */}
          <div className="flex items-center justify-center overflow-clip rounded-[4px] p-[2px]">
            <span
              className="whitespace-nowrap text-[12px] font-medium"
              style={{ color: tokens.grey, letterSpacing: "-0.24px" }}
            >
              Решение для бизнеса
            </span>
          </div>
          {/* title */}
          <p
            className="w-full text-[24px] font-medium leading-[1]"
            style={{ color: tokens.black, letterSpacing: "-0.48px" }}
          >
            Тариф Business для команды
          </p>
        </div>
        <p
          className="w-full text-[13px] leading-[16px]"
          style={{ color: tokens.black, letterSpacing: "-0.13px" }}
        >
          Покажем и расскажем как можно использовать mymeet.ai в процессах вашей команды
        </p>
      </div>
      <div className="flex w-full flex-col items-start gap-[16px]">
        <FormField label="Название компании">
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Mymeet.ai"
            className="flex h-[36px] w-full items-center rounded-[4px] border border-solid bg-white px-[12px] py-[10px] text-[13px] outline-none placeholder:text-[color:var(--_p)]"
            style={{
              borderColor: tokens.grey40,
              color: tokens.black,
              letterSpacing: "-0.13px",
              ["--_p" as string]: tokens.grey60,
            }}
          />
        </FormField>
        <FormField label="Телефон или Telegram">
          <input
            type="text"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="+7 052 052 52 52"
            className="flex h-[36px] w-full items-center rounded-[4px] border border-solid bg-white px-[12px] py-[10px] text-[13px] outline-none placeholder:text-[color:var(--_p)]"
            style={{
              borderColor: tokens.grey40,
              color: tokens.black,
              letterSpacing: "-0.13px",
              ["--_p" as string]: tokens.grey60,
            }}
          />
        </FormField>
        <FormField label="Количество сотрудников">
          <div className="relative w-full">
            <button
              type="button"
              onClick={() => setHeadcountOpen((v) => !v)}
              className="flex h-[36px] w-full items-center justify-between rounded-[4px] border border-solid bg-white px-[12px] py-[10px]"
              style={{ borderColor: tokens.grey40 }}
            >
              <span
                className="text-[13px]"
                style={{
                  color: headcount ? tokens.black : tokens.grey60,
                  letterSpacing: "-0.13px",
                }}
              >
                {headcount || "Выберите"}
              </span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={leadAsset("modal-chevron.svg")}
                alt=""
                className="h-[16px] w-[16px]"
                style={{ transform: headcountOpen ? "rotate(180deg)" : "none", transition: "transform 200ms" }}
              />
            </button>
            {headcountOpen && (
              <div
                className="absolute left-0 right-0 top-[calc(100%+4px)] z-[2] flex flex-col rounded-[4px] border border-solid bg-white p-[4px]"
                style={{ borderColor: tokens.grey40, boxShadow: "0 0 4px 0 rgba(0,0,0,0.15)" }}
              >
                {HEADCOUNT_OPTIONS.map((o) => (
                  <button
                    key={o}
                    type="button"
                    onClick={() => {
                      setHeadcount(o);
                      setHeadcountOpen(false);
                    }}
                    className="flex h-[32px] w-full items-center rounded-[2px] px-[6px] hover:bg-[color:var(--_hover)] transition-colors"
                    style={{ ["--_hover" as string]: tokens.grey20 }}
                  >
                    <span
                      className="text-[13px]"
                      style={{ color: tokens.black, letterSpacing: "-0.13px" }}
                    >
                      {o}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </FormField>
        <button
          type="button"
          disabled={!filled && status === "idle"}
          onClick={handleSubmit}
          className="flex h-[36px] w-full items-center justify-center gap-[6px] overflow-hidden rounded-[4px] px-[12px]"
          style={{ backgroundColor: status === "sent" ? "#0D9655" : filled || status !== "idle" ? "#212833" : "#636971" }}
        >
          {status === "loading" ? (
            <div className="h-[16px] w-[16px] rounded-full border-2 border-white border-t-transparent animate-spin" />
          ) : (
            <span
              className="text-[13px] font-medium text-white text-center leading-[1.2] whitespace-nowrap"
              style={{ letterSpacing: "-0.13px" }}
            >
              {status === "sent" ? "Отправлено, свяжемся с вами в течение 24 часов" : "Получить тестовый доступ"}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

function FeatureCard({ icon, label }: { icon: string; label: string }) {
  return (
    <div
      className="flex w-full items-center gap-[8px] rounded-[4px] p-[8px]"
      style={{ backgroundColor: "rgba(255,255,255,0.16)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
    >
      <div
        className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-[4px] p-[8px]"
        style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={leadAsset(icon)} alt="" className="h-[16px] w-[16px]" />
      </div>
      <span
        className="whitespace-nowrap text-[13px] font-medium text-white"
        style={{ letterSpacing: "-0.13px" }}
      >
        {label}
      </span>
    </div>
  );
}

function ModalRightPanel({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="relative flex h-full w-[410px] shrink-0 flex-col items-start justify-center gap-[32px] overflow-clip rounded-r-[4px] p-[32px]"
      style={{
        backgroundColor: "#2b2f3a",
        backgroundImage: `url(${leadAsset("modal-bg.jpg")})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="relative z-[1] flex w-full flex-col items-start justify-center gap-[6px]">
        <FeatureCard icon="modal-feat-1.svg" label="Полнофункциональный медиаплеер" />
        <FeatureCard icon="modal-feat-2.svg" label="Кастомные отчеты" />
        <FeatureCard icon="modal-feat-3.svg" label="Кастомизация бота и словаря терминов" />
        <FeatureCard icon="modal-feat-4.svg" label="Личный аккаунт менеджер и поддержка" />
        <FeatureCard icon="modal-feat-5.svg" label="Командные варианты цен" />
      </div>
      <button
        type="button"
        aria-label="Закрыть"
        onClick={onClose}
        className="absolute right-[16px] top-[16px] z-[2] flex h-[16px] w-[16px] items-center justify-center"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={leadAsset("modal-close.svg")} alt="" className="h-[16px] w-[16px]" />
      </button>
    </div>
  );
}

const MODAL_CLOSE_DUR = 150;

function LeadsModal({ open, onClose, onSubmit }: { open: boolean; onClose: () => void; onSubmit: () => void }) {
  const [company, setCompany] = useState("");
  const [contact, setContact] = useState("");
  const [headcount, setHeadcount] = useState("");

  // Animation state machine: 'idle' (unmounted) → 'entering' (mount, opacity 0 / scale 0.96)
  // → 'open' (CSS .is-open → opacity 1 / scale 1) → 'closing' (.is-closing) → 'idle'
  const [phase, setPhase] = useState<"idle" | "entering" | "open" | "closing">("idle");

  // Mount + trigger enter when `open` becomes true; trigger close when false
  useEffect(() => {
    if (open) {
      if (phase === "idle" || phase === "closing") {
        setPhase("entering");
      }
      return;
    }
    if (phase === "entering" || phase === "open") {
      setPhase("closing");
    }
  }, [open, phase]);

  // entering → open: after one painted frame the browser has the "from" state
  // (opacity:0 / scale:0.96), then .is-open triggers the CSS transition.
  useEffect(() => {
    if (phase !== "entering") return;
    const id = window.setTimeout(() => setPhase((p) => (p === "entering" ? "open" : p)), 32);
    return () => clearTimeout(id);
  }, [phase]);

  // closing → idle after CSS transition finishes
  useEffect(() => {
    if (phase !== "closing") return;
    const id = window.setTimeout(() => {
      setPhase("idle");
      setCompany("");
      setContact("");
      setHeadcount("");
    }, MODAL_CLOSE_DUR);
    return () => clearTimeout(id);
  }, [phase]);

  // Lock scroll + ESC while mounted (any non-idle phase)
  useEffect(() => {
    if (phase === "idle") return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [phase, onClose]);

  if (phase === "idle") return null;

  const filled = company.trim() !== "" && contact.trim() !== "" && headcount !== "";
  const isOpen = phase === "open";
  const isClosing = phase === "closing";

  return (
    <div
      className={`t-backdrop fixed inset-0 z-[100] flex items-center justify-center${isOpen ? " is-open" : ""}${isClosing ? " is-closing" : ""}`}
      style={{ backgroundColor: "rgba(33,40,51,0.55)" }}
      onClick={onClose}
    >
      <div
        data-phase={phase}
        onClick={(e) => e.stopPropagation()}
        className={`t-modal relative flex h-[442px] w-[820px] items-start rounded-[4px] bg-white${isOpen ? " is-open" : ""}${isClosing ? " is-closing" : ""}`}
        style={{ pointerEvents: isOpen ? "auto" : "none" }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="leads-modal-title"
      >
        <ModalLeftPanel
          company={company}
          contact={contact}
          headcount={headcount}
          setCompany={setCompany}
          setContact={setContact}
          setHeadcount={setHeadcount}
          onSubmit={onSubmit}
          filled={filled}
        />
        <ModalRightPanel onClose={onClose} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Control panel
// ─────────────────────────────────────────────────────────────────────────────

type Toggles = {
  topBanner: boolean;
  listBanner: boolean;
};

function Switch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className="relative inline-flex h-[14px] w-[24px] shrink-0 items-center rounded-full transition-colors"
      style={{ backgroundColor: checked ? tokens.blue : tokens.grey50 }}
    >
      <span
        className="inline-block h-[10px] w-[10px] rounded-full bg-white transition-transform"
        style={{ transform: checked ? "translateX(12px)" : "translateX(2px)" }}
      />
    </button>
  );
}

function ControlPanel({
  toggles,
  setToggles,
}: {
  toggles: Toggles;
  setToggles: React.Dispatch<React.SetStateAction<Toggles>>;
}) {
  const rows: { key: keyof Toggles; label: string }[] = [
    { key: "topBanner", label: "Растяжка во всю ширину сверху" },
    { key: "listBanner", label: "Баннер в списке встреч" },
  ];
  return (
    <div
      className="fixed bottom-[16px] right-[16px] z-50 flex w-[200px] flex-col gap-[6px] rounded-[6px] border border-solid bg-white p-[10px]"
      style={{ borderColor: tokens.grey40, boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}
    >
      {rows.map((row) => (
        <label
          key={row.key}
          className="flex cursor-pointer items-center justify-between gap-[8px]"
        >
          <span className="text-[12px]" style={{ color: tokens.black, letterSpacing: "-0.12px" }}>
            {row.label}
          </span>
          <Switch
            checked={toggles[row.key]}
            onChange={() => setToggles((prev) => ({ ...prev, [row.key]: !prev[row.key] }))}
          />
        </label>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function AppLeadsV2Page() {
  const [toggles, setToggles] = useState<Toggles>({
    topBanner: true,
    listBanner: true,
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSource, setModalSource] = useState<string | null>(null);
  const [submittedSources, setSubmittedSources] = useState<Set<string>>(new Set());
  const openModal = (source: string) => { setModalSource(source); setModalOpen(true); };
  const closeModal = () => setModalOpen(false);
  const handleSubmit = () => {
    if (modalSource) setSubmittedSources((prev) => new Set(prev).add(modalSource));
    setModalOpen(false);
  };

  const groups = groupByDate(MEETINGS);

  return (
    <main
      className={`${inter.className} flex h-screen w-full flex-col overflow-hidden bg-white`}
      style={{ color: tokens.black }}
    >
      {toggles.topBanner && !submittedSources.has("topBanner") && <TopBanner onOpen={() => openModal("topBanner")} />}

      <div className="relative flex h-full min-h-0 flex-1 items-stretch bg-white">
        {/* Sidebar */}
        <aside
          className="sticky top-0 flex h-full w-[280px] shrink-0 flex-col justify-between border-r border-solid pt-[16px] pb-[4px]"
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
                <div
                  className="flex h-[36px] w-full items-center justify-between rounded-[4px] px-[12px] py-[10px]"
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
                <div className="relative h-[6px] w-full overflow-hidden rounded-[4px]" style={{ backgroundColor: tokens.blueSea }}>
                  <div className="h-full rounded-[4px]" style={{ width: "73.57%", backgroundColor: tokens.blue }} />
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
              <div
                className="flex items-center gap-[12px] whitespace-nowrap"
                style={{ marginLeft: 12 }}
              >
                <div className="h-[24px] w-px shrink-0" style={{ backgroundColor: tokens.grey40 }} />
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
            </div>
          </div>

          <div className="flex w-full min-h-0 flex-1 flex-col items-start overflow-y-auto pt-[9px]">
            {toggles.listBanner && !submittedSources.has("listBanner") && <ListBanner onOpen={() => openModal("listBanner")} />}
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

      <ControlPanel toggles={toggles} setToggles={setToggles} />
      <LeadsModal open={modalOpen} onClose={closeModal} onSubmit={handleSubmit} />
    </main>
  );
}
