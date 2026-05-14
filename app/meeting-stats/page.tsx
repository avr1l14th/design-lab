"use client";

import { Inter } from "next/font/google";
import { useMemo, useState } from "react";

const inter = Inter({ subsets: ["latin", "cyrillic"], weight: ["400", "500", "600"] });

/* ─────────────────────────── DS TOKENS — из mymeet.ai DESIGN_SYSTEM.md ─────────────────────────── */

const tokens = {
  // Brand blue
  blue: "#0138C7",
  blueHover: "#0032B1",
  bluePressed: "#002C9C",
  blueSea: "#E4ECFA",
  blueLightest: "#F6F8FE",

  // Secondary action
  actionSecondary: "#EFEFEF",

  // Text
  textPrimary: "#212833",
  textSecondary: "#818AA3",
  textDisabled: "#C7C8CA",
  textOnAction: "#FFFFFF",

  // Surfaces
  surfacePage: "#FFFFFF",
  surfaceRaised: "#FFFFFF",
  surfaceLight: "#FAFAFA",
  surfaceSubtle: "#F7F7F8",

  // Borders
  border: "#EFEFEF",
  borderStrong: "#DDDEDF",

  // Semantic
  danger: "#CC3333",
  success: "#0D9655",

  // Accent
  purple: "#8A38F5",
  orange: "#FF9E2C",
  teal: "#0DACAA",
  pink: "#E36FB8",
} as const;

/* ─────────────────────────── REAL FIGMA ASSETS (через MCP get_design_context) ─────────────────────────── */
/* Свежие URL'ы ассетов из узлов mymeet.ai library. Живут ~7 дней.                                          */

const FIGMA_ASSETS = {
  // Integrations/GoogleMeet/16 — 1 layer
  googleMeet: "https://www.figma.com/api/mcp/asset/cabc7af8-25b6-46e2-99f0-2c8101a9b506",

  // Integrations/Zoom/16 — 4 layers (composite)
  zoom: [
    "https://www.figma.com/api/mcp/asset/32792ca0-1e98-457e-8779-93da949ed265",
    "https://www.figma.com/api/mcp/asset/ca34fde2-a5b2-40bc-8e88-d68397667923",
    "https://www.figma.com/api/mcp/asset/5f04cda0-f3f2-4814-85b9-f3688ebda744",
  ],
  zoomInner: "https://www.figma.com/api/mcp/asset/b08acb8a-7448-43f0-b1b7-33ad2ea71a18",

  // Integrations/Telemost/16 — 4 layers
  telemost: "https://www.figma.com/api/mcp/asset/09bbf074-c554-42df-b9c8-cf65fdf7e76d",
  telemostV1: "https://www.figma.com/api/mcp/asset/3090992d-8791-42a5-adb1-d9485e0b282e",
  telemostV2: "https://www.figma.com/api/mcp/asset/4b7e8921-f4ad-4891-9226-05e3b364a744",
  telemostV3: "https://www.figma.com/api/mcp/asset/6f139465-2a8d-441b-af2c-1dae515a9102",

  // Integrations/Teams/16 — 13 layers
  teams: [
    "https://www.figma.com/api/mcp/asset/f1947d2f-4f33-4905-94dc-0e6041c43a78",
    "https://www.figma.com/api/mcp/asset/276bfd6d-07fb-4cd6-9842-674e41130e01",
    "https://www.figma.com/api/mcp/asset/4c6951bd-4312-43fd-8396-51cc8272c876",
    "https://www.figma.com/api/mcp/asset/3539a1df-4ec7-4316-8ef4-82e619ce07e5",
    "https://www.figma.com/api/mcp/asset/bae8a826-c209-4b5a-8c15-62cf8348a6ed",
    "https://www.figma.com/api/mcp/asset/5585d860-28ea-443b-836e-86a496e947ae",
    "https://www.figma.com/api/mcp/asset/d5f7ce94-3c9f-447a-9b67-d8f359f66606",
    "https://www.figma.com/api/mcp/asset/45cad8af-49dd-44f9-9412-ea77641747d7",
    "https://www.figma.com/api/mcp/asset/9391caf1-06a1-4432-b6de-4cfb4c2acf4a",
    "https://www.figma.com/api/mcp/asset/c723f6de-fb2a-45aa-b478-91384c479a92",
    "https://www.figma.com/api/mcp/asset/a3966364-6a59-47f2-b65a-432ea2dc35f8",
    "https://www.figma.com/api/mcp/asset/bc6a3edd-afe4-47d3-904c-6d1fdbe2b9f5",
    "https://www.figma.com/api/mcp/asset/e0a49aa6-ecbe-4486-b4af-b236d87daa64",
  ],
  // Insets for Teams layers (from get_design_context spec)
  teamsInsets: [
    "0 2.63% 0 50%",       // bottom 0, left 50%, right 2.63%, top 42.11%
    "36.84% 18.42% 0 13.16%",
    "36.84% 18.42% 0 13.16%",
    "36.84% 18.42% 0 13.16%",
    "10.53% 7.89% 63.16% 65.79%",
    "10.53% 7.89% 63.16% 65.79%",
    "10.53% 7.89% 63.16% 65.79%",
    "0 44.74% 68.42% 23.68%",
    "0 44.74% 68.42% 23.68%",
    "0 44.74% 68.42% 23.68%",
    "50% 55.26% 7.89% 2.63%",
    "50% 55.26% 7.89% 2.63%",
    "59.02% 67.16% 16.92% 14.53%",
  ],
};

/* ─────────────────────────── ICONS — Integrations/&lt;Provider&gt;/16 из либы ─────────────────────────── */
/* eslint-disable @next/next/no-img-element */

function IntegrationsGoogleMeet16() {
  return (
    <div className="relative size-[16px] overflow-hidden">
      <img alt="" src={FIGMA_ASSETS.googleMeet}
        className="absolute left-1/2 top-1/2 h-[13.166px] w-[16px] -translate-x-1/2 -translate-y-1/2 max-w-none" />
    </div>
  );
}

function IntegrationsZoom16() {
  return (
    <div className="relative size-[16px] overflow-hidden">
      {FIGMA_ASSETS.zoom.map((src, i) => (
        <img key={i} alt="" src={src} className="absolute inset-0 size-full max-w-none" />
      ))}
      <div className="absolute inset-[32.14%_21.43%]">
        <img alt="" src={FIGMA_ASSETS.zoomInner} className="absolute inset-0 size-full max-w-none" />
      </div>
    </div>
  );
}

function IntegrationsTelemost16() {
  return (
    <div className="relative size-[16px] overflow-hidden">
      <img alt="" src={FIGMA_ASSETS.telemost} className="absolute inset-0 size-full max-w-none" />
      <div className="absolute inset-[37.5%_51.03%_53.13%_39.59%]">
        <img alt="" src={FIGMA_ASSETS.telemostV1} className="absolute inset-0 size-full max-w-none" />
      </div>
      <div className="absolute inset-[28.13%_40.63%_28.13%_15.63%]">
        <div className="absolute inset-[-5.36%]">
          <img alt="" src={FIGMA_ASSETS.telemostV2} className="block size-full max-w-none" />
        </div>
      </div>
      <div className="absolute inset-[40.63%_12.5%_40.63%_68.75%]">
        <img alt="" src={FIGMA_ASSETS.telemostV3} className="absolute inset-0 size-full max-w-none" />
      </div>
    </div>
  );
}

function IntegrationsTeams16() {
  // 13-слойный SVG из библиотеки — реальная Teams-иконка
  return (
    <div className="relative size-[16px] overflow-hidden">
      {FIGMA_ASSETS.teams.map((src, i) => {
        const [t, r, b, l] = FIGMA_ASSETS.teamsInsets[i].split(" ");
        return (
          <div key={i} className="absolute" style={{ top: t, right: r, bottom: b, left: l }}>
            <img alt="" src={src} className="absolute inset-0 block size-full max-w-none" />
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────── INLINE NAV ICONS (Sidebar leading icons) ─────────────────────────── */
/* В либе для каждого пункта Sidebar используется свой Icons/&lt;Name&gt;/16. Здесь — упрощённые
   inline SVG в том же стиле (16x16, stroke #212833 currentColor). */

function NavIcon({ children }: { children: React.ReactNode }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor"
      strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

const NAV_ICONS = {
  meetings:     <NavIcon><rect x="2" y="2" width="5" height="5" rx="0.8" /><rect x="9" y="2" width="5" height="5" rx="0.8" /><rect x="2" y="9" width="5" height="5" rx="0.8" /><rect x="9" y="9" width="5" height="5" rx="0.8" /></NavIcon>,
  stats:        <NavIcon><path d="M2 2v12h12" /><path d="M5 11l3-3 2 2 4-4" /></NavIcon>,
  integrations: <NavIcon><path d="M6 8L3 5a1.5 1.5 0 1 1 2-2l3 3" /><path d="M10 8l3 3a1.5 1.5 0 1 1-2 2l-3-3" /><path d="M11 5l2-2" /><path d="M3 13l2-2" /></NavIcon>,
  settings:     <NavIcon><circle cx="8" cy="8" r="2" /><path d="M8 1.5v1.5M8 13v1.5M2.5 8H1M15 8h-1.5M12.5 3.5l-1 1M4.5 11.5l-1 1M12.5 12.5l-1-1M4.5 4.5l-1-1" /></NavIcon>,
  support:      <NavIcon><circle cx="8" cy="8" r="6" /><path d="M6 6.5A2 2 0 0 1 10 7c0 1.5-2 2-2 2.5" /><circle cx="8" cy="12" r="0.5" fill="currentColor" /></NavIcon>,
  book:         <NavIcon><path d="M2.5 13A1.5 1.5 0 0 1 4 11.5h9.5" /><path d="M4 1.5h9.5v13H4A1.5 1.5 0 0 1 2.5 13V3A1.5 1.5 0 0 1 4 1.5z" /></NavIcon>,
  gift:         <NavIcon><rect x="2" y="5.5" width="12" height="2.5" rx="0.5" /><path d="M8 5.5v9" /><path d="M12.5 8v5.5a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1V8" /><path d="M5 5.5a1.5 1.5 0 0 1 0-3C7 2.5 8 5.5 8 5.5s1-3 3-3a1.5 1.5 0 0 1 0 3" /></NavIcon>,
  telegram:     <NavIcon><path d="M14 2L1.5 7l3.5 1.5 1.5 4 2.5-2.5 3.5 2.5L14 2z" /></NavIcon>,
  logout:       <NavIcon><path d="M6 14H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h3" /><path d="M10.5 11l3-3-3-3" /><path d="M13.5 8H6" /></NavIcon>,
} as const;

/* ─────────────────────────── UTILITY: Avatar / Plus ─────────────────────────── */

function Avatar16({ color, initial }: { color: string; initial?: string }) {
  return (
    <span className="relative inline-flex size-[16px] shrink-0 items-center justify-center overflow-hidden rounded-full"
      style={{ backgroundColor: color }}>
      {initial && (
        <span className="font-medium text-[9px] leading-none text-white" style={{ letterSpacing: "-0.18px" }}>
          {initial}
        </span>
      )}
    </span>
  );
}

function IconPlus({ size = 16, color = "#FFFFFF" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M8 3v10M3 8h10" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/* ─────────────────────────── DATA ─────────────────────────── */

type Period = "7d" | "30d" | "90d";

const PERIOD_LABELS: Record<Period, string> = {
  "7d": "7 дней",
  "30d": "30 дней",
  "90d": "90 дней",
};

const STATS: Record<Period, {
  total: number; totalDelta: number;
  hours: number; hoursDelta: number;
  avgMin: number; avgDelta: number;
  participants: number; participantsDelta: number;
}> = {
  "7d":  { total: 18,  totalDelta: 12, hours: 14.2,  hoursDelta: 8,   avgMin: 47, avgDelta: -4, participants: 22, participantsDelta: 5 },
  "30d": { total: 84,  totalDelta: 23, hours: 67.5,  hoursDelta: 18,  avgMin: 48, avgDelta: -2, participants: 47, participantsDelta: 11 },
  "90d": { total: 241, totalDelta: 31, hours: 192.4, hoursDelta: 28,  avgMin: 48, avgDelta: 0,  participants: 89, participantsDelta: 24 },
};

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const ACTIVITY: Record<Period, number[]> = {
  "7d":  [3, 5, 4, 2, 3, 1, 0],
  "30d": [16, 22, 19, 14, 11, 1, 1],
  "90d": [42, 58, 49, 38, 41, 8, 5],
};

type SourceKey = "google-meet" | "zoom" | "telemost" | "teams" | "upload";

const SOURCES: { key: SourceKey; label: string; count: number; brandColor: string }[] = [
  { key: "google-meet", label: "Google Meet",       count: 32, brandColor: "#00897B" },
  { key: "zoom",        label: "Zoom",              count: 21, brandColor: "#2D8CFF" },
  { key: "telemost",    label: "Я.Телемост",        count: 14, brandColor: "#FF0000" },
  { key: "teams",       label: "Microsoft Teams",   count: 6,  brandColor: "#5059C9" },
  { key: "upload",      label: "Загруженные файлы", count: 11, brandColor: tokens.textSecondary },
];

type RecentMeeting = {
  id: number; title: string; time: string; duration: string;
  source: SourceKey; sourceLabel: string;
  author: { name: string; email: string; color: string };
  isRecording?: boolean;
};

const RECENT_MEETINGS: RecentMeeting[] = [
  { id: 1, title: "Sync команды дизайна",            time: "Сегодня, 11:00", duration: "42 мин",
    source: "google-meet", sourceLabel: "Google Meet",
    author: { name: "А", email: "anna@mymeet.ai", color: tokens.purple } },
  { id: 2, title: "Демо MVP стейкхолдерам",          time: "Сегодня, 09:30", duration: "58 мин",
    source: "zoom",        sourceLabel: "Zoom",
    author: { name: "М", email: "max@mymeet.ai",  color: tokens.orange },
    isRecording: true },
  { id: 3, title: "1:1 с Лидом продукта",            time: "Вчера, 16:00",   duration: "31 мин",
    source: "google-meet", sourceLabel: "Google Meet",
    author: { name: "К", email: "kate@mymeet.ai", color: tokens.teal } },
  { id: 4, title: "Обсуждение архитектуры дашборда", time: "Вчера, 14:00",   duration: "67 мин",
    source: "telemost",    sourceLabel: "Я.Телемост",
    author: { name: "В", email: "vlad@mymeet.ai", color: tokens.blue } },
  { id: 5, title: "Ретро спринта 24",                time: "12 апр, 18:00",  duration: "51 мин",
    source: "google-meet", sourceLabel: "Google Meet",
    author: { name: "А", email: "anna@mymeet.ai", color: tokens.purple } },
];

function getSourceIcon(key: SourceKey) {
  switch (key) {
    case "google-meet": return <IntegrationsGoogleMeet16 />;
    case "zoom":        return <IntegrationsZoom16 />;
    case "telemost":    return <IntegrationsTelemost16 />;
    case "teams":       return <IntegrationsTeams16 />;
    case "upload":      return <span className="size-[16px] shrink-0" />;
  }
}

/* ─────────────────────────── COMPONENTS (1:1 с mymeet.ai library) ─────────────────────────── */

/**
 * SidebarItem — mymeet.ai/components/SidebarItem (node 32798:5090)
 * spec: gap 8, padding 4, rounded 3, text Inter Regular 13 #212833.
 * variants: Inactive (transparent) | Hover (#FAFAFA) | Active/Pressed (#F7F7F8).
 */
function SidebarItem({ icon, label, active }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <button type="button"
      className="group relative flex w-full items-center gap-[8px] rounded-[3px] p-[4px] transition-colors"
      style={{ backgroundColor: active ? tokens.surfaceSubtle : "transparent" }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.backgroundColor = tokens.surfaceLight;
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.backgroundColor = "transparent";
      }}>
      <span className="relative flex size-[16px] shrink-0 items-center justify-center"
        style={{ color: tokens.textPrimary }}>
        {icon}
      </span>
      <span className="whitespace-nowrap text-[13px] font-normal leading-none"
        style={{ color: tokens.textPrimary, letterSpacing: "-0.13px" }}>
        {label}
      </span>
    </button>
  );
}

/**
 * TabSegmented — mymeet.ai/components/Tab/Segmented (node 32491:2683)
 * spec: container bg #F7F7F8, gap 2, padding 4, rounded 4.
 * tab: padding 6/8, rounded 3. Active: bg white, Inter Medium 13 #212833.
 *      Inactive: Inter Regular 13 #818AA3.
 */
function TabSegmented({ period, onChange }: { period: Period; onChange: (p: Period) => void }) {
  return (
    <div className="inline-flex items-start gap-[2px] rounded-[4px] p-[4px]"
      style={{ backgroundColor: tokens.surfaceSubtle }}>
      {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => {
        const active = period === p;
        return (
          <button key={p} type="button" onClick={() => onChange(p)}
            className="flex items-center justify-center rounded-[3px] px-[8px] py-[6px] transition-colors"
            style={{
              backgroundColor: active ? tokens.surfaceRaised : "transparent",
              color: active ? tokens.textPrimary : tokens.textSecondary,
            }}>
            <span className="whitespace-nowrap text-[13px] leading-none"
              style={{ fontWeight: active ? 500 : 400, letterSpacing: "-0.13px" }}>
              {PERIOD_LABELS[p]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * MeetingListItem — mymeet.ai/components/MeetingListItem (node 32507:12542)
 * spec: h 72, padding 12/24. Structure: Thumbnail (80x48) + title/meta || Badge(author) || Badge(source) || trash.
 * states: default (bg white) | hover (#FAFAFA) | pressed (#F7F7F8) | disabled.
 */
function Thumbnail({ recording }: { recording?: boolean }) {
  if (recording) {
    return (
      <div className="flex h-[48px] w-[80px] shrink-0 items-center justify-center overflow-hidden rounded-[4px] border"
        style={{ backgroundColor: tokens.surfaceSubtle, borderColor: tokens.border }}>
        <div className="flex items-center gap-[4px]">
          <span className="relative inline-flex size-[10px] items-center justify-center rounded-full"
            style={{ backgroundColor: "rgba(204,51,51,0.4)" }}>
            <span className="absolute size-[5px] rounded-full" style={{ backgroundColor: tokens.danger }} />
          </span>
          <span className="text-[12px] font-medium leading-none"
            style={{ color: tokens.textPrimary, letterSpacing: "-0.24px" }}>REC</span>
        </div>
      </div>
    );
  }
  // Video preview placeholder — градиентный фон с воспроизведением
  return (
    <div className="relative flex h-[48px] w-[80px] shrink-0 items-center justify-center overflow-hidden rounded-[4px]"
      style={{ background: `linear-gradient(135deg, ${tokens.blue} 0%, ${tokens.purple} 100%)` }}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M5 3.5l7 4.5-7 4.5z" fill="white" />
      </svg>
    </div>
  );
}

function Badge({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="inline-flex h-[24px] items-center justify-center gap-[8px] rounded-[3px] px-[8px] py-[4px]">
      <span className="flex size-[16px] shrink-0 items-center justify-center">{icon}</span>
      <span className="whitespace-nowrap text-[12px] font-normal leading-none"
        style={{ color: tokens.textPrimary, letterSpacing: "-0.24px" }}>{text}</span>
    </div>
  );
}

function MeetingListItem({ m, isLast }: { m: RecentMeeting; isLast: boolean }) {
  const [hover, setHover] = useState(false);
  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      className="flex h-[72px] w-full cursor-pointer items-center justify-between px-[24px] py-[12px] transition-colors"
      style={{
        backgroundColor: hover ? tokens.surfaceLight : tokens.surfacePage,
        borderBottom: isLast ? "none" : `1px solid ${tokens.border}`,
      }}>
      <div className="flex min-w-0 flex-1 items-center gap-[24px]">
        {/* Колонка 1: Thumbnail + Title/Meta */}
        <div className="flex min-w-0 max-w-[420px] flex-1 items-center gap-[12px]">
          <Thumbnail recording={m.isRecording} />
          <div className="flex min-w-0 flex-1 flex-col gap-[4px]">
            <span className="truncate text-[13px] font-medium leading-none"
              style={{ color: tokens.textPrimary, letterSpacing: "-0.13px" }}>
              {m.title}
            </span>
            <div className="flex items-center gap-[6px]">
              <span className="text-[12px] leading-none"
                style={{ color: tokens.textSecondary, letterSpacing: "-0.24px" }}>{m.time}</span>
              <span className="size-[3px] rounded-full" style={{ backgroundColor: tokens.textSecondary }} />
              <span className="text-[12px] leading-none"
                style={{ color: tokens.textSecondary, letterSpacing: "-0.24px" }}>{m.duration}</span>
            </div>
          </div>
        </div>

        {/* Колонка 2: Author Badge */}
        <div className="hidden w-[200px] shrink-0 items-center md:flex">
          <Badge icon={<Avatar16 color={m.author.color} initial={m.author.name} />} text={m.author.email} />
        </div>

        {/* Колонка 3: Source Badge */}
        <div className="hidden w-[180px] shrink-0 items-center lg:flex">
          <Badge icon={getSourceIcon(m.source)} text={m.sourceLabel} />
        </div>
      </div>

      {/* Trash icon — видна только в hover */}
      <div className="size-[16px] shrink-0" style={{ opacity: hover ? 1 : 0 }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M3 4h10M6.5 4V2.5h3V4M5 4l0.5 9a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1L11 4"
            stroke={tokens.textSecondary} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

/* ─────────────────────────── SIDEBAR (структура из app/search-filters) ─────────────────────────── */

function MymeetLogo() {
  return (
    <div className="flex items-center gap-[8px]">
      <div className="flex h-[24px] w-[24px] items-center justify-center rounded-[6px]"
        style={{ background: `linear-gradient(135deg, ${tokens.blue} 0%, #4F7CFF 100%)` }}>
        <span className="text-[13px] font-medium text-white" style={{ letterSpacing: "-0.13px" }}>m</span>
      </div>
      <span className="text-[15px] font-medium" style={{ color: tokens.textPrimary, letterSpacing: "-0.32px" }}>
        mymeet.ai
      </span>
    </div>
  );
}

function Sidebar() {
  return (
    <aside className="sticky top-0 flex h-screen w-[240px] shrink-0 flex-col border-r"
      style={{ borderColor: tokens.border, backgroundColor: tokens.surfacePage }}>
      <div className="flex h-[56px] items-center px-[16px]"><MymeetLogo /></div>

      {/* CTA */}
      <div className="px-[12px] pb-[16px]">
        <button type="button"
          className="flex h-[36px] w-full items-center justify-center gap-[6px] rounded-[4px] transition-colors"
          style={{ backgroundColor: tokens.blue }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = tokens.blueHover)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = tokens.blue)}>
          <IconPlus size={16} color="#FFFFFF" />
          <span className="text-[13px] font-medium text-white" style={{ letterSpacing: "-0.13px" }}>
            Добавить встречу
          </span>
        </button>
      </div>

      {/* Primary nav */}
      <nav className="flex flex-col gap-[2px] px-[12px]">
        <SidebarItem icon={NAV_ICONS.meetings} label="Встречи" />
        <SidebarItem icon={NAV_ICONS.stats} label="Статистика" active />
        <SidebarItem icon={NAV_ICONS.integrations} label="Интеграции" />
        <SidebarItem icon={NAV_ICONS.settings} label="Настройки" />
      </nav>

      <div className="my-[16px] mx-[12px] h-px" style={{ backgroundColor: tokens.border }} />

      {/* Secondary nav */}
      <nav className="flex flex-col gap-[2px] px-[12px]">
        <SidebarItem icon={NAV_ICONS.support} label="Поддержка" />
        <SidebarItem icon={NAV_ICONS.book} label="База знаний" />
        <SidebarItem icon={NAV_ICONS.gift} label="Бесплатные минуты" />
        <SidebarItem icon={NAV_ICONS.telegram} label="Телеграм-бот" />
        <SidebarItem icon={NAV_ICONS.logout} label="Выйти" />
      </nav>

      <div className="flex-1" />

      <div className="border-t px-[12px] py-[12px]" style={{ borderColor: tokens.border }}>
        <div className="flex cursor-pointer items-center gap-[8px] rounded-[4px] px-[6px] py-[6px]"
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = tokens.surfaceLight)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
          <div className="h-[28px] w-[28px] shrink-0 rounded-[6px]"
            style={{ background: `linear-gradient(135deg, #4F7CFF 0%, ${tokens.purple} 100%)` }} />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-[13px] font-medium"
              style={{ color: tokens.textPrimary, letterSpacing: "-0.13px" }}>
              fz4884&apos;s space
            </span>
            <span className="text-[12px]" style={{ color: tokens.textSecondary, letterSpacing: "-0.24px" }}>
              Владелец
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}

/* ─────────────────────────── METRIC CARD ─────────────────────────── */

function MetricCard({ label, value, unit, delta }: {
  label: string; value: string; unit?: string; delta: number;
}) {
  const isPositive = delta > 0;
  const isZero = delta === 0;
  const deltaColor = isZero ? tokens.textSecondary : isPositive ? tokens.success : tokens.danger;
  const deltaSign = isZero ? "" : isPositive ? "+" : "";
  return (
    <div className="flex flex-1 flex-col gap-[12px] rounded-[4px] border bg-white p-[20px]"
      style={{ borderColor: tokens.border }}>
      <span className="text-[13px] font-normal" style={{ color: tokens.textSecondary, letterSpacing: "-0.13px" }}>
        {label}
      </span>
      <div className="flex items-baseline gap-[6px]">
        <span className="text-[32px] font-medium"
          style={{ color: tokens.textPrimary, letterSpacing: "-0.96px", lineHeight: 1 }}>{value}</span>
        {unit && (
          <span className="text-[14px] font-normal" style={{ color: tokens.textSecondary, letterSpacing: "-0.28px" }}>
            {unit}
          </span>
        )}
      </div>
      <div className="flex items-center gap-[6px]">
        <span className="text-[12px] font-medium" style={{ color: deltaColor, letterSpacing: "-0.24px" }}>
          {deltaSign}{delta}%
        </span>
        <span className="text-[12px]" style={{ color: tokens.textSecondary, letterSpacing: "-0.24px" }}>
          к прошлому периоду
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────── ACTIVITY CHART ─────────────────────────── */

function ActivityChart({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex h-[220px] w-full items-end justify-between gap-[16px] pt-[24px]">
      {data.map((v, i) => {
        const heightPct = (v / max) * 100;
        const isWeekend = i >= 5;
        return (
          <div key={i} className="flex h-full flex-1 flex-col items-center gap-[8px]">
            <div className="relative w-full flex-1">
              <div className="absolute bottom-0 left-0 right-0 rounded-[4px] transition-all"
                style={{ height: `${heightPct}%`, backgroundColor: isWeekend ? tokens.blueSea : tokens.blue }} />
              {v > 0 && (
                <span className="absolute -top-[20px] left-1/2 -translate-x-1/2 whitespace-nowrap text-[12px] font-medium"
                  style={{ color: tokens.textPrimary, letterSpacing: "-0.24px" }}>{v}</span>
              )}
            </div>
            <span className="text-[12px]" style={{ color: tokens.textSecondary, letterSpacing: "-0.24px" }}>
              {WEEKDAYS[i]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────── SOURCE ROW ─────────────────────────── */

function SourceRow({ sourceKey, label, count, total, brandColor }: {
  sourceKey: SourceKey; label: string; count: number; total: number; brandColor: string;
}) {
  const pct = (count / total) * 100;
  return (
    <div className="flex w-full flex-col gap-[8px]">
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-[8px]">
          {getSourceIcon(sourceKey)}
          <span className="text-[13px]" style={{ color: tokens.textPrimary, letterSpacing: "-0.13px" }}>{label}</span>
        </div>
        <div className="flex items-center gap-[8px]">
          <span className="text-[13px] font-medium"
            style={{ color: tokens.textPrimary, letterSpacing: "-0.13px" }}>{count}</span>
          <span className="text-[12px]" style={{ color: tokens.textSecondary, letterSpacing: "-0.24px" }}>
            {Math.round(pct)}%
          </span>
        </div>
      </div>
      <div className="relative h-[6px] w-full overflow-hidden rounded-[4px]"
        style={{ backgroundColor: tokens.surfaceSubtle }}>
        <div className="h-full rounded-[4px] transition-all"
          style={{ width: `${pct}%`, backgroundColor: brandColor }} />
      </div>
    </div>
  );
}

/* ─────────────────────────── PAGE ─────────────────────────── */

export default function MeetingStatsPage() {
  const [period, setPeriod] = useState<Period>("30d");
  const stats = STATS[period];
  const activity = ACTIVITY[period];
  const sourcesTotal = useMemo(() => SOURCES.reduce((s, x) => s + x.count, 0), []);

  return (
    <main className={`${inter.className} flex h-screen w-full overflow-hidden`}
      style={{ backgroundColor: tokens.surfacePage, color: tokens.textPrimary }}>
      <Sidebar />

      <section className="flex h-full min-w-0 flex-1 flex-col overflow-y-auto">
        <div className="flex h-[56px] shrink-0 items-center justify-between px-[40px]">
          <h1 className="text-[24px] font-medium"
            style={{ color: tokens.textPrimary, letterSpacing: "-0.72px" }}>
            Статистика
          </h1>
          <TabSegmented period={period} onChange={setPeriod} />
        </div>

        <div className="flex w-full flex-col gap-[24px] px-[40px] pb-[40px]">
          {/* 4 metric cards */}
          <div className="flex w-full gap-[16px]">
            <MetricCard label="Всего встреч"          value={stats.total.toString()}   delta={stats.totalDelta} />
            <MetricCard label="Часов записано"        value={stats.hours.toFixed(1)}    unit="ч"   delta={stats.hoursDelta} />
            <MetricCard label="Средняя длительность"  value={stats.avgMin.toString()}   unit="мин" delta={stats.avgDelta} />
            <MetricCard label="Уникальных участников" value={stats.participants.toString()} delta={stats.participantsDelta} />
          </div>

          {/* Activity chart + sources */}
          <div className="flex w-full gap-[16px]">
            <div className="flex flex-[2] flex-col gap-[20px] rounded-[4px] border bg-white p-[24px]"
              style={{ borderColor: tokens.border }}>
              <div className="flex flex-col gap-[4px]">
                <span className="text-[16px] font-medium"
                  style={{ color: tokens.textPrimary, letterSpacing: "-0.32px" }}>
                  Активность по дням
                </span>
                <span className="text-[13px]" style={{ color: tokens.textSecondary, letterSpacing: "-0.13px" }}>
                  Распределение встреч за {PERIOD_LABELS[period].toLowerCase()}
                </span>
              </div>
              <ActivityChart data={activity} />
            </div>

            <div className="flex flex-1 flex-col gap-[20px] rounded-[4px] border bg-white p-[24px]"
              style={{ borderColor: tokens.border }}>
              <div className="flex flex-col gap-[4px]">
                <span className="text-[16px] font-medium"
                  style={{ color: tokens.textPrimary, letterSpacing: "-0.32px" }}>
                  Источники встреч
                </span>
                <span className="text-[13px]" style={{ color: tokens.textSecondary, letterSpacing: "-0.13px" }}>
                  Всего {sourcesTotal} встреч
                </span>
              </div>
              <div className="flex flex-col gap-[16px]">
                {SOURCES.map((s) => (
                  <SourceRow key={s.key} sourceKey={s.key} label={s.label}
                    count={s.count} total={sourcesTotal} brandColor={s.brandColor} />
                ))}
              </div>
            </div>
          </div>

          {/* Recent meetings */}
          <div className="flex w-full flex-col rounded-[4px] border bg-white"
            style={{ borderColor: tokens.border }}>
            <div className="flex h-[56px] w-full shrink-0 items-center justify-between border-b px-[24px]"
              style={{ borderColor: tokens.border }}>
              <span className="text-[16px] font-medium"
                style={{ color: tokens.textPrimary, letterSpacing: "-0.32px" }}>
                Последние встречи
              </span>
              <button type="button" className="text-[13px] font-medium"
                style={{ color: tokens.blue, letterSpacing: "-0.13px" }}>
                Все встречи
              </button>
            </div>
            <div className="flex w-full flex-col">
              {RECENT_MEETINGS.map((m, i) => (
                <MeetingListItem key={m.id} m={m} isLast={i === RECENT_MEETINGS.length - 1} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
