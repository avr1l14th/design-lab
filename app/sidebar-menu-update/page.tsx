"use client";

import { Inter } from "next/font/google";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { MouseEventHandler } from "react";
import {
  MEETINGS,
  SOURCE_META,
  getAuthor,
  type Meeting,
  type ThumbKind,
} from "../search-filters/mock-data";
import { groupByDate } from "../search-filters/use-filtered-meetings";

const inter = Inter({ subsets: ["latin", "cyrillic"], weight: ["400", "500"] });

const tokens = {
  blue: "#0138C7",
  black: "#212833",
  grey: "#818AA3",
  bgPage: "#FFFFFF",
  bgSubtle: "#F7F7F8",
  border: "#EFEFEF",
  blueSea: "#E4ECFA",
  red: "#CC3333",
  interpunctLight: "#CDD0DA",
} as const;

const BASE = process.env.NODE_ENV === "production" ? "/design-lab" : "";
const asset = (name: string) => `${BASE}/sidebar-menu-update/${name}`;
const meetingAsset = (name: string) => `${BASE}/search-filters/${name}`;
const resolveIconAsset = (name: string) => name.startsWith("/") ? `${BASE}${name}` : asset(name);

const pressableClass = "transition-colors duration-[120ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none";

type Item = { label: string; icon: string; muted?: boolean; active?: boolean };

const primaryItems: Item[] = [
  { label: "Встречи", icon: "meetings.svg", active: true },
  { label: "AI Отчеты", icon: "ai-reports.svg" },
  { label: "Интеграции", icon: "integrations.svg" },
  { label: "Настройки", icon: "settings-figma.svg" },
];

const resourceItems: Item[] = [
  { label: "База знаний", icon: "knowledge.svg" },
  { label: "Поддержка", icon: "support.svg" },
  { label: "Бесплатные минуты", icon: "gift.svg" },
  { label: "Телеграм-бот", icon: "tg.svg" },
];

function Icon({ name, size = 16 }: { name: string; size?: number }) {
  const src = resolveIconAsset(name);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" width={size} height={size} className="shrink-0" />
  );
}

function MenuIcon({ name }: { name: string }) {
  const src = resolveIconAsset(name);
  return (
    <span
      aria-hidden="true"
      className="h-[16px] w-[16px] shrink-0 bg-[#818AA3] group-hover:bg-[#585E6C]"
      style={{
        WebkitMaskImage: `url(${src})`,
        maskImage: `url(${src})`,
        WebkitMaskPosition: "center",
        maskPosition: "center",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskSize: "contain",
        maskSize: "contain",
      }}
    />
  );
}

function WorkspaceMenuIcon({ name, danger = false, active = false }: { name: string; danger?: boolean; active?: boolean }) {
  const src = resolveIconAsset(name);
  return (
    <span
      aria-hidden="true"
      className={`h-[16px] w-[16px] shrink-0 ${danger ? "bg-[#CC3333]" : active ? "bg-[#585E6C]" : "bg-[#818AA3] group-hover:bg-[#585E6C]"}`}
      style={{
        WebkitMaskImage: `url(${src})`,
        maskImage: `url(${src})`,
        WebkitMaskPosition: "center",
        maskPosition: "center",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskSize: "contain",
        maskSize: "contain",
      }}
    />
  );
}

function MenuItem({ item }: { item: Item }) {
  return (
    <button
      type="button"
      className={`group flex w-full items-center rounded-[3px] p-[6px] text-left hover:bg-[#F7F7F8] ${item.active ? "bg-[#F7F7F8]" : ""} ${pressableClass}`}
    >
      <span className="flex items-center gap-[6px]">
        <span className="flex h-[16px] w-[16px] shrink-0 items-center justify-center">
          <MenuIcon name={item.icon} />
        </span>
        <span
          className="text-[13px] font-normal leading-[normal] tracking-[-0.13px]"
          style={{ color: item.muted ? tokens.grey : tokens.black }}
        >
          {item.label}
        </span>
      </span>
    </button>
  );
}

function SectionChevron({ expanded }: { expanded: boolean }) {
  return (
    <span className="flex h-[16px] w-[16px] shrink-0 items-center justify-center opacity-0 transition-opacity duration-[120ms] ease-out group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none">
      <span
        className={`flex h-[16px] w-[16px] origin-center items-center justify-center will-change-transform transition-transform duration-[180ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none ${
          expanded ? "rotate-0" : "-rotate-90"
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset("section-chevron-figma.svg")} alt="" className="block h-[16px] w-[16px] shrink-0" />
      </span>
    </span>
  );
}

function MenuGroup({ title, items }: { title?: string; items: Item[] }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="flex w-full flex-col gap-px">
      {title && (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
          className={`group flex w-full items-center rounded-[3px] p-[6px] text-left hover:bg-[#F7F7F8] ${pressableClass}`}
        >
          <span className="flex items-center gap-px">
            <span className="text-[12px] font-medium leading-[normal] tracking-[-0.24px]" style={{ color: tokens.grey }}>
              {title}
            </span>
            <SectionChevron expanded={expanded} />
          </span>
        </button>
      )}
      {(!title || expanded) && items.map((item) => <MenuItem key={item.label} item={item} />)}
    </div>
  );
}

function WorkspaceMenuItem({
  icon,
  label,
  trailing,
  danger = false,
  active = false,
  onMouseEnter,
  onMouseLeave,
}: {
  icon: string;
  label: string;
  trailing?: React.ReactNode;
  danger?: boolean;
  active?: boolean;
  onMouseEnter?: MouseEventHandler<HTMLButtonElement>;
  onMouseLeave?: MouseEventHandler<HTMLButtonElement>;
}) {
  return (
    <button
      type="button"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`group flex h-[32px] w-full shrink-0 items-center justify-between rounded-[3px] p-[6px] text-left hover:bg-[#F7F7F8] ${active ? "bg-[#F7F7F8]" : ""} ${pressableClass}`}
    >
      <span className="flex items-center gap-[6px]">
        <WorkspaceMenuIcon name={icon} danger={danger} active={active} />
        <span className="text-[13px] font-normal leading-[normal] tracking-[-0.13px]" style={{ color: danger ? tokens.red : tokens.black }}>
          {label}
        </span>
      </span>
      {trailing}
    </button>
  );
}

function ThemeSubmenu({
  onMouseEnter,
  onMouseLeave,
}: {
  onMouseEnter: MouseEventHandler<HTMLDivElement>;
  onMouseLeave: MouseEventHandler<HTMLDivElement>;
}) {
  const reduceMotion = useReducedMotion();
  const items = [
    { label: "Как в системе", selected: false },
    { label: "Светлая", selected: true },
    { label: "Темная", selected: false },
  ];

  return (
    <motion.div
      data-theme-submenu="true"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      initial={
        reduceMotion
          ? { opacity: 0 }
          : { opacity: 0, transform: "translateX(-4px) scale(0.985)" }
      }
      animate={
        reduceMotion
          ? { opacity: 1 }
          : { opacity: 1, transform: "translateX(0px) scale(1)" }
      }
      exit={
        reduceMotion
          ? { opacity: 0 }
          : { opacity: 0, transform: "translateX(-2px) scale(0.99)" }
      }
      transition={
        reduceMotion
          ? { duration: 0 }
          : { duration: 0.16, ease: [0.23, 1, 0.32, 1] }
      }
      className="fixed left-[292px] top-[245px] z-50 flex w-[200px] origin-top-left flex-col items-start rounded-[4px] bg-white p-[4px] will-change-[opacity,transform]"
      style={{ boxShadow: "0 0 2px 0 rgba(0, 0, 0, 0.15)" }}
    >
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          className={`group flex h-[32px] w-full shrink-0 items-center justify-between rounded-[3px] p-[6px] text-left hover:bg-[#F7F7F8] ${pressableClass}`}
        >
          <span className="truncate text-[13px] font-normal leading-[normal] tracking-[-0.13px]" style={{ color: tokens.black }}>
            {item.label}
          </span>
          {item.selected && <Icon name="workspace-selected.svg" />}
        </button>
      ))}
    </motion.div>
  );
}

function WorkspacePopover() {
  const reduceMotion = useReducedMotion();
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const themeCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showThemeMenu = useCallback(() => {
    if (themeCloseTimer.current) {
      clearTimeout(themeCloseTimer.current);
      themeCloseTimer.current = null;
    }
    setThemeMenuOpen(true);
  }, []);

  const scheduleHideThemeMenu = useCallback(() => {
    if (themeCloseTimer.current) clearTimeout(themeCloseTimer.current);
    themeCloseTimer.current = setTimeout(() => {
      setThemeMenuOpen(false);
      themeCloseTimer.current = null;
    }, 90);
  }, []);

  useEffect(() => {
    return () => {
      if (themeCloseTimer.current) clearTimeout(themeCloseTimer.current);
    };
  }, []);

  return (
    <>
      <motion.div
        data-workspace-popover="true"
        initial={
          reduceMotion
            ? { opacity: 0 }
            : { opacity: 0, transform: "translateY(-6px) scale(0.965)" }
        }
        animate={
          reduceMotion
            ? { opacity: 1 }
            : { opacity: 1, transform: "translateY(0px) scale(1)" }
        }
        exit={
          reduceMotion
            ? { opacity: 0 }
            : { opacity: 0, transform: "translateY(-2px) scale(0.985)" }
        }
        transition={
          reduceMotion
            ? { duration: 0 }
            : { duration: 0.18, ease: [0.23, 1, 0.32, 1] }
        }
        className="fixed left-[8px] top-[53px] z-50 flex w-[280px] origin-top-left flex-col items-start overflow-hidden rounded-[4px] bg-white will-change-[opacity,transform]"
        style={{ boxShadow: "0 0 4px 0 rgba(0, 0, 0, 0.15)" }}
      >
        <div className="flex w-full shrink-0 flex-col items-start gap-[4px] border-b px-[4px] pb-[4px]" style={{ borderColor: tokens.border }}>
          <div className="flex w-full items-center rounded-[2px] pl-[6px] pt-[8px]">
            <span className="text-[12px] font-medium leading-[normal] tracking-[-0.24px]" style={{ color: tokens.grey }}>fz4884@gmail.com</span>
          </div>

          <div className="flex w-full flex-col items-start">
            <button type="button" className="flex w-full items-center gap-[8px] rounded-[4px] p-[6px] text-left transition-colors duration-150 ease-out hover:bg-[#F7F7F8]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={asset("team-avatar.png")} alt="" className="h-[32px] w-[32px] shrink-0 rounded-[4px] object-cover" />
              <div className="flex min-w-0 flex-1 flex-col items-start gap-[2px]">
                <span className="w-full truncate text-[13px] font-medium leading-[normal] tracking-[-0.13px]" style={{ color: tokens.black }}>mymeet.ai design team</span>
                <span className="flex items-center gap-[4px] text-[12px] font-normal leading-[normal] tracking-[-0.24px]" style={{ color: tokens.grey }}>
                  <span>Сотрудник</span><span className="h-[3px] w-[3px] rounded-full" style={{ backgroundColor: tokens.interpunctLight }} /><span>Pro</span>
                </span>
              </div>
            </button>

            <button type="button" className="flex w-full items-center gap-[8px] rounded-[4px] p-[6px] text-left transition-colors duration-150 ease-out hover:bg-[#F7F7F8]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={asset("workspace-avatar.png")} alt="" className="h-[32px] w-[32px] shrink-0 rounded-[4px] object-cover" />
              <div className="flex min-w-0 flex-1 flex-col items-start gap-[2px]">
                <span className="w-full truncate text-[13px] font-medium leading-[normal] tracking-[-0.13px]" style={{ color: tokens.black }}>fz4884’s space</span>
                <span className="flex items-center gap-[4px] text-[12px] font-normal leading-[normal] tracking-[-0.24px]" style={{ color: tokens.grey }}>
                  <span>Владелец</span><span className="h-[3px] w-[3px] rounded-full" style={{ backgroundColor: tokens.interpunctLight }} /><span>Business</span>
                </span>
              </div>
              <Icon name="workspace-selected.svg" />
            </button>
          </div>
        </div>

        <div className="flex h-[72px] w-full shrink-0 flex-col items-center border-b p-[4px]" style={{ borderColor: tokens.border }}>
          <WorkspaceMenuItem icon="invite.svg" label="Пригласить участников" />
          <WorkspaceMenuItem icon="workspace-settings.svg" label="Настройки пространства" />
        </div>

        <div className="flex h-[136px] w-full shrink-0 flex-col items-center border-b p-[4px]" style={{ borderColor: tokens.border }}>
          <WorkspaceMenuItem
            icon="theme.svg"
            label="Тема оформления"
            active={themeMenuOpen}
            onMouseEnter={showThemeMenu}
            onMouseLeave={scheduleHideThemeMenu}
            trailing={<span className="flex h-[16px] w-[16px] -rotate-90 items-center justify-center"><Icon name="submenu-chevron.svg" /></span>}
          />
          <WorkspaceMenuItem icon="plans.svg" label="Тарифные планы" />
          <WorkspaceMenuItem icon="submenu-settings.svg" label="Настройки" />
          <WorkspaceMenuItem icon="website.svg" label="Сайт" />
        </div>

        <div className="flex h-[40px] w-full shrink-0 flex-col items-center p-[4px]">
          <WorkspaceMenuItem icon="logout.svg" label="Выйти" danger />
        </div>
      </motion.div>

      <AnimatePresence>
        {themeMenuOpen && <ThemeSubmenu onMouseEnter={showThemeMenu} onMouseLeave={scheduleHideThemeMenu} />}
      </AnimatePresence>
    </>
  );
}

function WorkspacePopoverPortal() {
  if (typeof document === "undefined") return null;
  return createPortal(<WorkspacePopover />, document.body);
}

function Sidebar() {
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const workspaceButtonRef = useRef<HTMLButtonElement>(null);

  const openWorkspaceMenu = useCallback(() => {
    setWorkspaceMenuOpen(true);
  }, []);

  const closeWorkspaceMenu = useCallback(() => {
    setWorkspaceMenuOpen(false);
  }, []);

  useEffect(() => {
    if (!workspaceMenuOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (workspaceButtonRef.current?.contains(target) || target.closest("[data-workspace-popover='true']")) return;
      closeWorkspaceMenu();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeWorkspaceMenu();
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [closeWorkspaceMenu, workspaceMenuOpen]);

  return (
    <aside className="relative h-full w-[280px] shrink-0 overflow-hidden bg-white">
      <motion.div
        initial={{ opacity: 1, transform: "translateX(0px)" }}
        animate={{ opacity: 1, transform: "translateX(0px)" }}
        exit={{ opacity: 1, transform: "translateX(0px)" }}
        transition={{ duration: 0 }}
        className="flex h-full w-[280px] flex-col justify-between border-r bg-white will-change-[opacity,transform]"
        style={{ borderColor: tokens.border }}
      >
        <div className="w-full">
          <div className="relative">
            <div
              className="flex h-[54px] w-[280px] items-center border-b border-r bg-white pl-[10px] pr-[16px]"
              style={{ borderColor: tokens.border }}
            >
              <button
                ref={workspaceButtonRef}
                type="button"
                aria-expanded={workspaceMenuOpen}
                aria-haspopup="menu"
                onClick={() => (workspaceMenuOpen ? closeWorkspaceMenu() : openWorkspaceMenu())}
                className={`flex h-[40px] shrink-0 items-center rounded-[4px] p-[6px] text-left outline-none transition-colors duration-150 ease-out hover:bg-[#F7F7F8] ${workspaceMenuOpen ? "bg-[#F7F7F8]" : "bg-transparent"} ${pressableClass}`}
              >
                <span className="flex items-center gap-[8px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={asset("workspace-avatar.png")} alt="" className="h-[28px] w-[28px] shrink-0 rounded-[3px] object-cover" />
                  <span className="flex min-w-0 items-center gap-[8px]">
                    <span className="truncate text-[13px] font-medium leading-[normal] tracking-[-0.13px]" style={{ color: tokens.black }}>
                      fz4884’s space
                    </span>
                    <Icon name={workspaceMenuOpen ? "workspace-chevron-open.svg" : "chevron-down.svg"} />
                  </span>
                </span>
              </button>
            </div>
            <AnimatePresence>
              {workspaceMenuOpen && <WorkspacePopoverPortal />}
            </AnimatePresence>
          </div>

          <div className="flex w-full flex-col gap-[12px] p-[16px]">
            <button
              type="button"
              className={`flex h-[36px] w-full items-center justify-between rounded-[4px] px-[12px] py-[10px] ${pressableClass}`}
              style={{ backgroundColor: tokens.blue }}
            >
              <span className="text-[13px] font-medium leading-[normal] tracking-[-0.13px] text-white">Добавить встречу</span>
              <Icon name="add.svg" />
            </button>

            <MenuGroup items={primaryItems} />
            <MenuGroup title="Ресурсы" items={resourceItems} />
            <MenuGroup title="Папки" items={[{ label: "Новая папка", icon: "new-folder.svg" }]} />
          </div>
        </div>

        <div className="flex w-full flex-col items-start border-t px-[8px] py-[4px]" style={{ borderColor: tokens.border }}>
          <div className="flex w-full flex-col gap-[8px] p-[4px]">
            <div className="flex w-full items-end justify-between whitespace-nowrap">
              <span className="text-[13px] font-medium tracking-[-0.13px]" style={{ color: tokens.black }}>Pro plan</span>
              <span className="text-[12px] font-medium tracking-[-0.24px]" style={{ color: tokens.black }}>Доступно 1850 из 2500</span>
            </div>
            <div className="relative h-[6px] w-full overflow-hidden rounded-full" style={{ backgroundColor: tokens.blueSea }}>
              <div className="h-full w-[73.57%] rounded-full" style={{ backgroundColor: tokens.blue }} />
            </div>
          </div>
        </div>
      </motion.div>
    </aside>
  );
}

function AppHeader() {
  return (
    <header className="flex h-[54px] shrink-0 items-center border-b bg-white p-[16px]" style={{ borderColor: tokens.border }}>
      <h1 className="flex h-[16px] items-center text-[13px] font-medium leading-[16px] tracking-[-0.13px]" style={{ color: tokens.black }}>
        Встречи
      </h1>
    </header>
  );
}

function MeetingsToolbar() {
  return (
    <div className="flex w-full items-center bg-white py-[16px] pl-[16px] pr-[24px]">
      <div className="flex items-center gap-[12px]">
        <div className="flex items-center gap-[8px]">
          <button type="button" aria-label="Фильтры" className={`flex h-[36px] w-[36px] items-center justify-center rounded-[4px] border hover:bg-[#F7F7F8] ${pressableClass}`} style={{ borderColor: tokens.border }}>
            <Icon name="filter.svg" />
          </button>
          <button type="button" aria-label="Поиск" className={`flex h-[36px] w-[36px] items-center justify-center rounded-[4px] border hover:bg-[#F7F7F8] ${pressableClass}`} style={{ borderColor: tokens.border }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={meetingAsset("icon-search.svg")} alt="" className="h-[16px] w-[16px] max-w-none shrink-0" />
          </button>
        </div>
        <div className="h-[24px] w-px" style={{ backgroundColor: tokens.border }} />
        <div className="flex h-[36px] items-center">
          {[
            ["Все встречи", true],
            ["Мои встречи", false],
            ["Доступные мне", false],
          ].map(([label, active]) => (
            <button
              type="button"
              key={String(label)}
              className={`flex h-full items-center justify-center rounded-[4px] px-[8px] py-[8px] text-[13px] font-normal leading-[normal] tracking-[-0.13px] hover:bg-[#F7F7F8] ${pressableClass}`}
              style={{ backgroundColor: active ? tokens.bgSubtle : "transparent", color: active ? tokens.black : tokens.grey }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function SourceIcon({ src }: { src: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={meetingAsset(src)} alt="" className="h-[14px] w-[14px] max-w-none shrink-0 object-contain" />
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
      <div className="flex h-[48px] w-[80px] shrink-0 items-center justify-center overflow-clip rounded-[4px] border p-[8px]" style={{ backgroundColor: tokens.bgSubtle, borderColor: tokens.border }}>
        <span className="text-[12px] font-medium tracking-[-0.24px]" style={{ color: "#CC3333" }}>ERROR</span>
      </div>
    );
  }
  if (kind === "legacy" || kind === "empty") {
    const src = kind === "legacy" ? "image442.png" : "frame-audio2.svg";
    const size = kind === "legacy" ? 18 : 20;
    return (
      <div className="flex h-[48px] w-[80px] shrink-0 items-center justify-center overflow-clip rounded-[4px] border p-[8px]" style={{ backgroundColor: tokens.bgSubtle, borderColor: tokens.border }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={meetingAsset(src)} alt="" style={{ width: size, height: size }} />
      </div>
    );
  }
  if (kind === "new") {
    return (
      <div className="relative h-[48px] w-[80px] shrink-0 overflow-clip rounded-[4px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={meetingAsset("property2.png")} alt="" className="absolute inset-0 h-full w-full rounded-[4px] object-cover" />
        <div className="absolute inset-0 rounded-[4px] bg-white/[0.24] backdrop-blur-[3px]" />
        <div className="absolute inset-0 flex items-center justify-center text-[12px] font-medium tracking-[-0.24px] text-white">NEW</div>
      </div>
    );
  }
  if (kind === "default") {
    return (
      <div className="relative h-[48px] w-[80px] shrink-0 overflow-clip rounded-[4px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={meetingAsset("property2.png")} alt="" className="absolute inset-0 h-full w-full rounded-[4px] object-cover" />
      </div>
    );
  }
  return (
    <div className="relative h-[48px] w-[80px] shrink-0 overflow-clip rounded-[4px]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={meetingAsset(`${kind}.png`)} alt="" className="absolute inset-0 h-full w-full rounded-[4px] object-cover" />
      <div className="absolute inset-0 rounded-[4px] bg-black/[0.08]" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={meetingAsset("frame-audio.svg")} alt="" className="absolute left-1/2 top-1/2 h-[20px] w-[20px] -translate-x-1/2 -translate-y-1/2" />
    </div>
  );
}

function MeetingDateHeader({ label, subLabel }: { label: string; subLabel: string }) {
  return (
    <div className="flex w-full shrink-0 flex-col items-start pt-[12px]">
      <div className="flex w-full flex-col items-start gap-[8px]">
        <div className="flex items-center gap-[6px] px-[24px] text-[13px] tracking-[-0.13px]">
          <span className="font-medium" style={{ color: tokens.black }}>{label}</span>
          <span className="font-normal" style={{ color: tokens.grey }}>{subLabel}</span>
        </div>
        <div className="h-px w-full shrink-0" style={{ backgroundColor: tokens.border }} />
      </div>
    </div>
  );
}

function MeetingRow({ meeting }: { meeting: Meeting }) {
  const author = getAuthor(meeting.authorId);
  const source = SOURCE_META[meeting.source];
  return (
    <div className="flex h-[72px] w-full items-center justify-between bg-white px-[24px] py-[12px]">
      <div className="flex items-center gap-[24px]">
        <div className="flex w-[446px] items-center gap-[12px]">
          <Thumb kind={meeting.thumb} />
          <div className="flex min-w-0 flex-1 flex-col gap-[4px]">
            <p className="truncate text-[13px] font-medium tracking-[-0.13px]" style={{ color: tokens.black }}>{meeting.title}</p>
            <div className="flex items-center gap-[4px] text-[12px] font-normal leading-[normal] tracking-[-0.24px]" style={{ color: tokens.grey }}>
              <span>{meeting.startTime}</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={meetingAsset("dot.svg")} alt="" className="h-[3px] w-[3px]" />
              <span>{meeting.durationMin} min</span>
            </div>
          </div>
        </div>
        <div className="flex w-[180px] flex-col items-start">
          <div className="flex w-[156px] items-center gap-[8px]">
            <AuthorAvatar color={author.avatarColor} letter={author.name.charAt(0)} title={author.name} />
            <span className="min-w-0 flex-1 truncate text-[12px] font-normal tracking-[-0.24px]" style={{ color: tokens.black }}>{author.email}</span>
          </div>
        </div>
        <div className="flex w-[180px] flex-col items-start overflow-clip">
          <div className="flex w-full items-center gap-[8px]">
            <SourceIcon src={source.icon} />
            <span className="truncate text-[12px] font-normal tracking-[-0.24px]" style={{ color: tokens.black }}>{source.label}</span>
          </div>
        </div>
      </div>
      <div className="h-[16px] w-[16px] opacity-0" />
    </div>
  );
}

export default function SidebarMenuUpdatePage() {
  const groups = groupByDate(MEETINGS);

  return (
    <main className={`${inter.className} h-screen min-h-[720px] w-full overflow-hidden bg-white`} style={{ color: tokens.black }}>
      <div className="flex h-full w-full bg-white">
        <Sidebar />
        <section className="flex min-w-0 flex-1 flex-col bg-white">
          <AppHeader />
          <MeetingsToolbar />
          <div className="flex w-full min-h-0 flex-1 flex-col items-start overflow-y-auto pt-[8px]">
            <div className="flex w-full flex-col items-start">
              {groups.map((group) => (
                <div key={group.key} className="flex w-full flex-col">
                  <MeetingDateHeader label={group.label} subLabel={group.subLabel} />
                  {group.meetings.map((meeting) => <MeetingRow key={meeting.id} meeting={meeting} />)}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
