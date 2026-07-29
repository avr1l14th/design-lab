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
  grey70: "#BABBBD",
  overlay: "rgba(33, 40, 51, 0.4)",
} as const;

const BASE = process.env.NODE_ENV === "production" ? "/design-lab" : "";
const asset = (name: string) => `${BASE}/add-meeting-update/${name}`;
const meetingAsset = (name: string) => `${BASE}/search-filters/${name}`;
const resolveIconAsset = (name: string) => name.startsWith("/") ? `${BASE}${name}` : asset(name);

const pressableClass = "transition-colors duration-[120ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none";
// Морф высоты (баннер, ошибка): grid-rows 0fr->1fr — прерываемый CSS-transition без замера высоты.
const morphRowsClass = "grid w-full transition-[grid-template-rows] duration-[300ms] ease-[cubic-bezier(0.77,0,0.175,1)] motion-reduce:transition-none";
const morphFadeClass = "transition-opacity duration-[200ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none";

type Item = {
  label: string;
  icon: string;
  muted?: boolean;
  active?: boolean;
  badge?: string;
  onSelect?: () => void;
};
type WorkspaceRole = "owner" | "employee";

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
      className="h-[16px] w-[16px] shrink-0 bg-[#818AA3]"
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

function WorkspaceMenuIcon({ name, danger = false }: { name: string; danger?: boolean }) {
  const src = resolveIconAsset(name);
  return (
    <span
      aria-hidden="true"
      className={`h-[16px] w-[16px] shrink-0 ${danger ? "bg-[#CC3333]" : "bg-[#818AA3]"}`}
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
      onClick={item.onSelect}
      className={`group flex w-full items-center justify-between rounded-[3px] text-left hover:bg-[#F7F7F8] ${
        item.badge ? "py-[8px] pl-[6px] pr-[10px]" : "p-[6px]"
      } ${item.active ? "bg-[#F7F7F8]" : ""} ${pressableClass}`}
    >
      <span className="flex items-center gap-[6px]">
        <span className="flex h-[16px] w-[16px] shrink-0 items-center justify-center">
          <MenuIcon name={item.icon} />
        </span>
        <span
          className="text-[13px] font-normal leading-[16px] tracking-[-0.13px]"
          style={{ color: item.muted ? tokens.grey : tokens.black }}
        >
          {item.label}
        </span>
      </span>
      {item.badge && (
        <span className="text-[10px] font-medium leading-[normal] tracking-[-0.1px]" style={{ color: tokens.blue }}>
          {item.badge}
        </span>
      )}
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
        <WorkspaceMenuIcon name={icon} danger={danger} />
        <span className="text-[13px] font-normal leading-[normal] tracking-[-0.13px]" style={{ color: danger ? tokens.red : tokens.black }}>
          {label}
        </span>
      </span>
      {trailing}
    </button>
  );
}

function ThemeSubmenu({
  top,
  onMouseEnter,
  onMouseLeave,
}: {
  top: number;
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
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, transform: "translateX(-4px) scale(0.985)" }}
      animate={reduceMotion ? { opacity: 1 } : { opacity: 1, transform: "translateX(0px) scale(1)" }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, transform: "translateX(-2px) scale(0.99)" }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
      className="fixed left-[292px] z-50 flex w-[200px] origin-top-left flex-col items-start rounded-[4px] bg-white p-[4px] will-change-[opacity,transform]"
      style={{ top, boxShadow: "0 0 2px 0 rgba(0, 0, 0, 0.15)" }}
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

function WorkspacePopover({ role }: { role: WorkspaceRole }) {
  const reduceMotion = useReducedMotion();
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [themeSubmenuTop, setThemeSubmenuTop] = useState(0);
  const themeCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isOwner = role === "owner";
  const currentWorkspaceRole = isOwner ? "Владелец" : "Сотрудник";

  const keepThemeMenuOpen = useCallback(() => {
    if (themeCloseTimer.current) {
      clearTimeout(themeCloseTimer.current);
      themeCloseTimer.current = null;
    }
    setThemeMenuOpen(true);
  }, []);

  const showThemeMenu: MouseEventHandler<HTMLButtonElement> = useCallback((event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setThemeSubmenuTop(rect.top - 4);
    keepThemeMenuOpen();
  }, [keepThemeMenuOpen]);

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
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, transform: "translateY(-6px) scale(0.965)" }}
        animate={reduceMotion ? { opacity: 1 } : { opacity: 1, transform: "translateY(0px) scale(1)" }}
        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, transform: "translateY(-2px) scale(0.985)" }}
        transition={reduceMotion ? { duration: 0 } : { duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
        className="fixed left-[8px] top-[53px] z-50 flex w-[280px] origin-top-left flex-col items-start overflow-hidden rounded-[4px] bg-white will-change-[opacity,transform]"
        style={{ boxShadow: "0 0 4px 0 rgba(0, 0, 0, 0.15)" }}
      >
        <div className="flex w-full shrink-0 flex-col items-start gap-[4px] border-b px-[4px] pb-[4px]" style={{ borderColor: tokens.border }}>
          <div className="flex w-full items-center rounded-[2px] pl-[6px] pt-[8px]">
            <span className="text-[12px] font-medium leading-[normal] tracking-[-0.24px]" style={{ color: tokens.grey }}>fz4884@gmail.com</span>
          </div>

          <div className="flex w-full flex-col items-start">
            <button type="button" className="flex w-full items-center gap-[8px] rounded-[4px] px-[6px] py-[8px] text-left transition-colors duration-150 ease-out hover:bg-[#F7F7F8]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={asset("team-avatar.png")} alt="" className="h-[32px] w-[32px] shrink-0 rounded-[4px] object-cover" />
              <div className="flex min-w-0 flex-1 flex-col items-start gap-[2px]">
                <span className="w-full truncate text-[13px] font-medium leading-[normal] tracking-[-0.13px]" style={{ color: tokens.black }}>mymeet.ai design team</span>
                <span className="flex items-center gap-[4px] text-[12px] font-normal leading-[normal] tracking-[-0.24px]" style={{ color: tokens.grey }}>
                  <span>Сотрудник</span><span className="h-[3px] w-[3px] rounded-full" style={{ backgroundColor: tokens.interpunctLight }} /><span>Pro</span>
                </span>
              </div>
            </button>

            <button type="button" className="flex w-full items-center gap-[8px] rounded-[4px] py-[8px] pl-[6px] pr-[10px] text-left transition-colors duration-150 ease-out hover:bg-[#F7F7F8]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={asset("workspace-avatar.png")} alt="" className="h-[32px] w-[32px] shrink-0 rounded-[4px] object-cover" />
              <div className="flex min-w-0 flex-1 flex-col items-start gap-[2px]">
                <span className="w-full truncate text-[13px] font-medium leading-[normal] tracking-[-0.13px]" style={{ color: tokens.black }}>fz4884’s space</span>
                <span className="flex items-center gap-[4px] text-[12px] font-normal leading-[normal] tracking-[-0.24px]" style={{ color: tokens.grey }}>
                  <span>{currentWorkspaceRole}</span><span className="h-[3px] w-[3px] rounded-full" style={{ backgroundColor: tokens.interpunctLight }} /><span>Business</span>
                </span>
              </div>
              <Icon name="workspace-selected.svg" />
            </button>
          </div>
        </div>

        {isOwner && (
          <div className="flex h-[72px] w-full shrink-0 flex-col items-center border-b p-[4px]" style={{ borderColor: tokens.border }}>
            <WorkspaceMenuItem icon="invite.svg" label="Пригласить участников" />
            <WorkspaceMenuItem icon="workspace-settings.svg" label="Настройки пространства" />
          </div>
        )}

        <div className={`${isOwner ? "h-[168px]" : "h-[136px]"} flex w-full shrink-0 flex-col items-center border-b p-[4px]`} style={{ borderColor: tokens.border }}>
          <WorkspaceMenuItem
            icon="theme.svg"
            label="Тема оформления"
            active={themeMenuOpen}
            onMouseEnter={showThemeMenu}
            onMouseLeave={scheduleHideThemeMenu}
            trailing={<span className="flex h-[16px] w-[16px] -rotate-90 items-center justify-center"><Icon name="submenu-chevron.svg" /></span>}
          />
          {isOwner && <WorkspaceMenuItem icon="plans.svg" label="Тарифные планы" />}
          <WorkspaceMenuItem icon="submenu-settings.svg" label="Настройки" />
          <WorkspaceMenuItem icon="tg.svg" label="Телеграм-бот" />
          <WorkspaceMenuItem icon="website.svg" label="Сайт" />
        </div>

        <div className="flex h-[40px] w-full shrink-0 flex-col items-center p-[4px]">
          <WorkspaceMenuItem icon="logout.svg" label="Выйти" danger />
        </div>
      </motion.div>
      <AnimatePresence>
        {themeMenuOpen && (
          <ThemeSubmenu top={themeSubmenuTop} onMouseEnter={keepThemeMenuOpen} onMouseLeave={scheduleHideThemeMenu} />
        )}
      </AnimatePresence>
    </>
  );
}

// Порядок как во фрейме 41455:7384 — Google Meet первым, дальше по кругу.
const vksPlatforms = [
  { icon: "vks-google-meet-v2.svg", name: "Google Meet", placeholder: "https://meet.google.com/my-mee-tisbest", match: /meet\.google/i },
  { icon: "vks-zoom.svg", name: "Zoom", placeholder: "https://us05web.zoom.us/my-mee-tisbest", match: /zoom\./i, banner: "zoom" as const, hasPassword: true },
  { icon: "vks-telemost.svg", name: "Яндекс.Телемост", short: "Я.Телемост", placeholder: "https://telemost.yandex.ru/my-mee-tisbest", match: /telemost|yandex/i },
  { icon: "vks-teams.svg", name: "Microsoft Teams", placeholder: "https://teams.live.com/meet/939554952", match: /teams\.|microsoft/i },
  { icon: "vks-mts-link.svg", name: "МТС Линк", placeholder: "https://my.mts-link.ru/j/163143600/17017741000", match: /mts-link|mts\./i, banner: "mts" as const },
  { icon: "vks-kontur-talk.svg", name: "Контур.Толк", placeholder: "https://3kb76je3.ktalk.ru/agiqeyc860mq", match: /kontur|ktalk/i },
  { icon: "vks-jitsi.svg", name: "Jitsi", placeholder: "https://meet.jit.si/mymeetai", match: /jitsi|jit\.si/i, hasPassword: true },
  { icon: "vks-salute-jazz.png", name: "SaluteJazz", placeholder: "https://salutejazz.ru/oynx65?psw=OEYRDhwLVwxcVh", match: /jazz|salute|sber/i },
  // TrueConf часто self-hosted — ссылка может быть просто IP, как в примере из макета.
  { icon: "vks-trueconf.svg", name: "TrueConf", placeholder: "https://35.226.34.88/c/1968763145", match: /trueconf|^(https?:\/\/)?\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/i, hasPassword: true },
];

// Индекс платформы по введенной ссылке; -1 если не распознали.
const detectPlatformIndex = (link: string) => {
  const value = link.trim();
  if (!value) return -1;
  return vksPlatforms.findIndex(({ match }) => match.test(value));
};

const VKS_HOLD_MS = 1100;
const VKS_ENTER_MS = 350;
const VKS_EXIT_MS = 240;

// Иконка ВКС в строке «Пригласить бота»: тихий zoom-through по кругу.
// Уходящий логотип растворяется «к зрителю» (scale 1.15), новый прибывает из глубины (scale 0.8) —
// blur 2px склеивает их в одно превращение вместо наложения двух картинок.
// Выход быстрее входа (240 против 350), чтобы в середине кроссфейда не было «двух призраков».
// Все 9 иконок смонтированы сразу (без догрузок), меняются только opacity/transform/filter.
// Цикл платформ: активен только пока active=true (в модалке останавливается при вводе ссылки).
function useVksCycle(active: boolean) {
  const reduceMotion = useReducedMotion();
  const [cycle, setCycle] = useState({ index: 0, prev: -1 });

  useEffect(() => {
    if (reduceMotion || !active) return;
    const timer = setInterval(() => {
      // Скрытая вкладка — пропускаем тик, чтобы по возвращении иконка не прыгала посреди смены.
      if (document.hidden) return;
      setCycle(({ index }) => ({ index: (index + 1) % vksPlatforms.length, prev: index }));
    }, VKS_HOLD_MS);
    return () => clearInterval(timer);
  }, [reduceMotion, active]);

  return [cycle, setCycle] as const;
}

function VksCycleGlyph({ index, prev }: { index: number; prev: number }) {
  return (
    <span aria-hidden="true" className="relative block h-[14px] w-[14px]">
      {vksPlatforms.map(({ icon: name }, i) => {
        const state = i === index ? "active" : i === prev ? "leaving" : "resting";
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={name}
            src={asset(name)}
            alt=""
            width={14}
            height={14}
            className="absolute inset-0 block h-[14px] w-[14px] transition-[opacity,transform,filter] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
            style={{
              // resting снапается мгновенно (невидимо) в исходную глубину — вход всегда начинается сзади.
              transitionDuration: state === "active" ? `${VKS_ENTER_MS}ms` : state === "leaving" ? `${VKS_EXIT_MS}ms` : "0ms",
              opacity: state === "active" ? 1 : 0,
              transform: state === "active" ? "scale(1)" : state === "leaving" ? "scale(1.15)" : "scale(0.8)",
              filter: state === "active" ? "blur(0px)" : "blur(2px)",
              // Уходящий движется к зрителю — держим его над входящим.
              zIndex: state === "leaving" ? 2 : state === "active" ? 1 : 0,
            }}
          />
        );
      })}
    </span>
  );
}

function VksCycleIcon() {
  const [cycle] = useVksCycle(true);
  return <VksCycleGlyph index={cycle.index} prev={cycle.prev} />;
}

const addMeetingOptions: { icon: string; iconSize: number; title: string; caption: string; action?: "desktop" | "invite"; cycleVks?: boolean }[] = [
  { icon: "dd-google-meet.svg", iconSize: 14, title: "Пригласить бота", caption: "Для онлайн-встреч по ссылке", cycleVks: true, action: "invite" },
  { icon: "dd-upload.svg", iconSize: 16, title: "Загрузить запись", caption: "Любые аудио- или видеофайлы" },
  { icon: "dd-monitor.svg", iconSize: 16, title: "Записать на компьютере", caption: "Запись без ботов через приложение", action: "desktop" },
];

function AddMeetingMenu({
  left,
  top,
  onDesktopSelect,
  onInviteSelect,
}: {
  left: number;
  top: number;
  onDesktopSelect: () => void;
  onInviteSelect: () => void;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      data-add-meeting-menu="true"
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, transform: "translateY(-4px) scale(0.985)" }}
      animate={reduceMotion ? { opacity: 1 } : { opacity: 1, transform: "translateY(0px) scale(1)" }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, transform: "translateY(-2px) scale(0.99)" }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
      className="fixed z-50 flex w-[285px] origin-top-left flex-col items-start rounded-[4px] border bg-white p-[4px]"
      style={{ left, top, borderColor: tokens.border, boxShadow: "0 0 2px rgba(0, 0, 0, 0.16)" }}
    >
      {addMeetingOptions.map((option) => (
        <button
          key={option.title}
          type="button"
          onClick={option.action === "desktop" ? onDesktopSelect : option.action === "invite" ? onInviteSelect : undefined}
          className={`flex w-full items-center gap-[12px] rounded-[4px] p-[8px] text-left hover:bg-[#F7F7F8] ${pressableClass}`}
        >
          <span
            className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-[4px]"
            style={{ backgroundColor: tokens.bgSubtle }}
          >
            {option.cycleVks ? <VksCycleIcon /> : <Icon name={option.icon} size={option.iconSize} />}
          </span>
          <span className="flex flex-col items-start gap-[2px] whitespace-nowrap">
            <span className="text-[13px] font-medium leading-[normal] tracking-[-0.13px]" style={{ color: tokens.black }}>
              {option.title}
            </span>
            <span className="text-[12px] font-normal leading-[normal] tracking-[-0.24px]" style={{ color: tokens.grey }}>
              {option.caption}
            </span>
          </span>
        </button>
      ))}
    </motion.div>
  );
}

function AddMeetingMenuPortal(props: { left: number; top: number; onDesktopSelect: () => void; onInviteSelect: () => void }) {
  if (typeof document === "undefined") return null;
  return createPortal(<AddMeetingMenu {...props} />, document.body);
}

const desktopFeatures = [
  { icon: "promo-video.svg", label: "Работа с любыми платформами для встреч" },
  { icon: "promo-mic.svg", label: "Локальная запись микрофона и звука системы" },
  { icon: "promo-autostart.svg", label: "Автоматический старт записи при начале звонка" },
  { icon: "promo-folder.svg", label: "Локальное хранение записей на компьютере" },
  { icon: "promo-send.svg", label: "Отправка записи в mymeet.ai для обработки" },
];

function DesktopPromoModal({ onClose }: { onClose: () => void }) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <motion.div
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
      className="fixed inset-0 z-[60] flex items-center justify-center"
      style={{ backgroundColor: tokens.overlay }}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Десктоп приложение"
        onClick={(event) => event.stopPropagation()}
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, transform: "scale(0.985)" }}
        animate={reduceMotion ? { opacity: 1 } : { opacity: 1, transform: "scale(1)" }}
        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, transform: "scale(0.99)" }}
        transition={reduceMotion ? { duration: 0 } : { duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
        className="flex h-[424px] w-[820px] overflow-hidden rounded-[4px] bg-white will-change-[opacity,transform]"
      >
        <div className="flex h-full w-[410px] shrink-0 flex-col items-center justify-center gap-[32px] bg-white p-[32px]">
          <div className="flex w-full flex-col items-start gap-[24px]">
            <div className="flex w-full flex-col items-start gap-[12px]">
              <div className="flex w-full flex-col items-start gap-[4px]">
                <span className="flex items-center justify-center overflow-hidden rounded-[4px] p-[2px]">
                  <span className="text-[12px] font-medium leading-[normal] tracking-[-0.24px]" style={{ color: tokens.grey }}>
                    Десктоп приложение
                  </span>
                </span>
                <span className="w-full text-[24px] font-medium leading-[normal] tracking-[-0.48px]" style={{ color: tokens.black }}>
                  Запись встреч без ботов
                </span>
              </div>
              <p className="w-full text-[13px] font-normal leading-[16px] tracking-[-0.13px]" style={{ color: tokens.black }}>
                Записывайте все онлайн-встречи и звонки локально прямо с компьютера. Без подключения ботов
              </p>
            </div>

            <div className="flex w-full flex-col items-start gap-[12px] px-[2px]">
              {desktopFeatures.map((feature) => (
                <div key={feature.label} className="flex w-full items-center gap-[8px]">
                  <Icon name={feature.icon} />
                  <span className="flex-1 text-[13px] font-normal leading-[16px] tracking-[-0.13px]" style={{ color: tokens.black }}>
                    {feature.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex w-full flex-col items-center gap-[8px]">
            <div className="flex w-full items-start gap-[8px]">
              {["macOS Silicone", "macOS Intel"].map((label) => (
                <button
                  key={label}
                  type="button"
                  className={`flex flex-1 items-center justify-center gap-[6px] rounded-[4px] bg-[#0138C7] px-[12px] py-[10px] hover:bg-[#0032B1] ${pressableClass}`}
                >
                  <span className="relative block h-[16px] w-[16px] shrink-0 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={asset("apple-logo.svg")}
                      alt=""
                      className="absolute left-[1.9px] top-1/2 block h-[16px] w-[12.334px] -translate-y-1/2"
                    />
                  </span>
                  <span className="whitespace-nowrap text-[13px] font-medium leading-[normal] tracking-[-0.13px] text-white">
                    {label}
                  </span>
                </button>
              ))}
            </div>
            <div
              aria-disabled="true"
              className="flex w-full items-center justify-center gap-[6px] rounded-[4px] px-[12px] py-[10px]"
              style={{ backgroundColor: tokens.bgSubtle }}
            >
              <span className="relative block h-[16px] w-[16px] shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={asset("windows-logo.svg")} alt="" className="absolute left-px top-px block h-[14px] w-[14px]" />
              </span>
              <span className="whitespace-nowrap text-[13px] font-medium leading-[normal] tracking-[-0.13px]" style={{ color: tokens.grey70 }}>
                Windows (скоро)
              </span>
            </div>
          </div>
        </div>

        <div className="relative h-full w-[410px] shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset("desktop-promo.png")} alt="" className="block h-full w-full scale-[1.02] object-cover" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="absolute right-[10px] top-[10px] h-[28px] w-[28px] rounded-full"
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

function DesktopPromoModalPortal({ onClose }: { onClose: () => void }) {
  if (typeof document === "undefined") return null;
  return createPortal(<DesktopPromoModal onClose={onClose} />, document.body);
}

// Иконки шапки/дропдауна модалки — инлайн-SVG, а не <img>: вектор растеризуется
// вместе со слоем на финальном масштабе, поэтому 1px-глифы не мылятся.
function OmLinkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="block shrink-0">
      <path d="M9.78594 3.38534C10.1611 3.01022 10.6698 2.79948 11.2003 2.79948C11.7308 2.79948 12.2396 3.01022 12.6147 3.38534C12.9899 3.76046 13.2006 4.26924 13.2006 4.79974C13.2006 5.33024 12.9899 5.83902 12.6147 6.21414L11.6347 7.19334C11.5255 7.30655 11.4651 7.45814 11.4665 7.61546C11.468 7.77278 11.5311 7.92324 11.6424 8.03443C11.7537 8.14562 11.9043 8.20865 12.0616 8.20995C12.2189 8.21124 12.3704 8.15069 12.4835 8.04134L13.4627 7.06214C14.0456 6.45861 14.3682 5.65029 14.3609 4.81126C14.3536 3.97223 14.0171 3.16963 13.4238 2.57632C12.8305 1.98302 12.0279 1.64647 11.1888 1.63918C10.3498 1.63189 9.54147 1.95443 8.93794 2.53734L6.53794 4.93734C6.22622 5.24909 5.98227 5.62189 5.82141 6.03236C5.66054 6.44283 5.58623 6.88211 5.60313 7.32266C5.62003 7.7632 5.72778 8.19549 5.91962 8.59243C6.11146 8.98937 6.38325 9.34239 6.71794 9.62934C6.839 9.73041 6.99497 9.77975 7.15213 9.7667C7.30929 9.75364 7.45499 9.67924 7.55771 9.55959C7.66044 9.43994 7.71192 9.28466 7.70104 9.12734C7.69015 8.97001 7.61777 8.8233 7.49954 8.71894C7.29011 8.53967 7.12 8.31903 6.9999 8.07088C6.8798 7.82274 6.8123 7.55244 6.80163 7.27697C6.79096 7.00149 6.83736 6.72678 6.93791 6.47009C7.03847 6.2134 7.191 5.98027 7.38594 5.78534L9.78594 3.38534Z" fill="#818AA3"/>
      <path d="M9.28266 6.37067C9.1616 6.2696 9.00563 6.22026 8.84847 6.23331C8.69131 6.24636 8.54561 6.32076 8.44289 6.44041C8.34016 6.56007 8.28868 6.71535 8.29956 6.87267C8.31045 7.02999 8.38283 7.1767 8.50106 7.28107C8.71049 7.46034 8.8806 7.68098 9.0007 7.92912C9.1208 8.17727 9.1883 8.44757 9.19897 8.72304C9.20964 8.99852 9.16324 9.27322 9.06269 9.52991C8.96213 9.7866 8.8096 10.0197 8.61466 10.2147L6.21466 12.6147C5.83954 12.9898 5.33076 13.2005 4.80026 13.2005C4.26976 13.2005 3.76098 12.9898 3.38586 12.6147C3.01074 12.2395 2.8 11.7308 2.8 11.2003C2.8 10.6698 3.01074 10.161 3.38586 9.78587L4.36586 8.80667C4.4751 8.69345 4.53551 8.54186 4.53407 8.38455C4.53263 8.22723 4.46945 8.07677 4.35816 7.96558C4.24686 7.85438 4.09634 7.79135 3.93902 7.79006C3.7817 7.78877 3.63017 7.84932 3.51706 7.95867L2.53786 8.93787C2.23223 9.23306 1.98844 9.58616 1.82074 9.97657C1.65303 10.367 1.56475 10.7869 1.56106 11.2118C1.55737 11.6367 1.63833 12.0581 1.79923 12.4513C1.96013 12.8446 2.19774 13.2019 2.4982 13.5023C2.79865 13.8028 3.15594 14.0404 3.54921 14.2013C3.94248 14.3622 4.36385 14.4432 4.78874 14.4395C5.21364 14.4358 5.63354 14.3475 6.02395 14.1798C6.41437 14.0121 6.76747 13.7683 7.06266 13.4627L9.46266 11.0627C9.77438 10.7509 10.0183 10.3781 10.1792 9.96764C10.3401 9.55717 10.4144 9.11789 10.3975 8.67735C10.3806 8.23681 10.2728 7.80451 10.081 7.40758C9.88914 7.01064 9.61735 6.65762 9.28266 6.37067Z" fill="#818AA3"/>
    </svg>
  );
}

function OmCloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="block shrink-0">
      <rect width="16" height="16" rx="8" fill="#F7F7F8" />
      <path d="M5.62886 4.92961C5.5382 4.84482 5.4183 4.79866 5.29441 4.80086C5.17052 4.80305 5.05232 4.85343 4.9647 4.94137C4.87709 5.02931 4.8269 5.14796 4.82471 5.27231C4.82253 5.39667 4.86851 5.51702 4.95298 5.60801L7.32491 7.98881L4.95298 10.3696C4.906 10.4136 4.86832 10.4665 4.84218 10.5254C4.81604 10.5843 4.80199 10.6479 4.80086 10.7123C4.79972 10.7768 4.81153 10.8408 4.83559 10.9006C4.85964 10.9603 4.89544 11.0146 4.94085 11.0602C4.98626 11.1058 5.04035 11.1417 5.09989 11.1658C5.15944 11.19 5.22322 11.2018 5.28743 11.2007C5.35164 11.1996 5.41496 11.1855 5.47362 11.1592C5.53228 11.133 5.58508 11.0952 5.62886 11.048L8.00078 8.66721L10.3727 11.048C10.4165 11.0952 10.4693 11.133 10.5279 11.1592C10.5866 11.1855 10.6499 11.1996 10.7141 11.2007C10.7783 11.2018 10.8421 11.19 10.9017 11.1658C10.9612 11.1417 11.0153 11.1058 11.0607 11.0602C11.1061 11.0146 11.1419 10.9603 11.166 10.9006C11.19 10.8408 11.2018 10.7768 11.2007 10.7123C11.1996 10.6479 11.1855 10.5843 11.1594 10.5254C11.1332 10.4665 11.0956 10.4136 11.0486 10.3696L8.67665 7.98881L11.0486 5.60801C11.133 5.51702 11.179 5.39667 11.1769 5.27231C11.1747 5.14796 11.1245 5.02931 11.0369 4.94137C10.9492 4.85343 10.831 4.80305 10.7071 4.80086C10.5833 4.79866 10.4634 4.84482 10.3727 4.92961L8.00078 7.31041L5.62886 4.92961Z" fill="#818AA3"/>
    </svg>
  );
}

function OmChevronIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="block shrink-0">
      <path fillRule="evenodd" clipRule="evenodd" d="M4.18362 5.76878C4.29823 5.65851 4.45193 5.59826 4.61093 5.60126C4.76994 5.60426 4.92126 5.67027 5.03162 5.78478L7.99962 8.93518L10.9676 5.78478C11.0216 5.7253 11.0869 5.67726 11.1598 5.6435C11.2326 5.60974 11.3115 5.59094 11.3918 5.58823C11.472 5.58552 11.552 5.59895 11.627 5.62771C11.7019 5.65648 11.7704 5.7 11.8282 5.7557C11.8861 5.8114 11.9321 5.87814 11.9637 5.95197C11.9953 6.0258 12.0117 6.10522 12.012 6.18552C12.0123 6.26581 11.9965 6.34536 11.9656 6.41944C11.9346 6.49352 11.889 6.56062 11.8316 6.61678L8.43162 10.2168C8.37565 10.2748 8.30855 10.321 8.23432 10.3526C8.1601 10.3841 8.08028 10.4004 7.99962 10.4004C7.91897 10.4004 7.83915 10.3841 7.76492 10.3526C7.6907 10.321 7.62359 10.2748 7.56762 10.2168L4.16762 6.61678C4.05736 6.50217 3.99711 6.34847 4.00011 6.18946C4.00311 6.03046 4.06911 5.87914 4.18362 5.76878Z" fill="#818AA3"/>
    </svg>
  );
}

// Баннеры над формой: Zoom — предупреждение про ботов, МТС Линк — про вебинары.
function LinkBanner({ kind }: { kind: "zoom" | "mts" }) {
  return (
    <div
      className="flex w-full flex-col items-start gap-[6px] rounded-[4px] p-[12px]"
      style={{ backgroundColor: kind === "zoom" ? "#FFEFDE" : "#EDEFFB" }}
    >
      <div className="flex w-full items-center gap-[8px]">
        <Icon name={kind === "zoom" ? "banner-warning.svg" : "banner-info.svg"} />
        <span className="min-w-px flex-1 text-[13px] font-medium leading-[normal] tracking-[-0.13px]" style={{ color: tokens.black }}>
          {kind === "zoom" ? "Боты работают нестабильно" : "Пока не поддерживаем вебинары"}
        </span>
      </div>
      <p className="w-full text-[13px] font-normal leading-[16px] tracking-[-0.13px]" style={{ color: tokens.black }}>
        {kind === "zoom" ? (
          <>
            Запишите встречу в Zoom и загрузите файл — или используйте{" "}
            <span className="cursor-pointer underline [text-decoration-thickness:from-font]">расширение</span> для Chrome
          </>
        ) : (
          "Записываем только обычные встречи, поддержку вебинаров добавим в ближайших обновлениях"
        )}
      </p>
    </div>
  );
}

function ModalField({
  label,
  dottedLabel = false,
  children,
}: {
  label: string;
  dottedLabel?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex w-full flex-col items-start gap-[8px]">
      <span
        className={`text-[13px] font-normal leading-[16px] tracking-[-0.13px] ${
          dottedLabel ? "underline decoration-[#BABBBD] decoration-dotted underline-offset-[3px]" : ""
        }`}
        style={{ color: tokens.black }}
      >
        {label}
      </span>
      {children}
    </div>
  );
}

function ModalTextInput({
  value,
  placeholder,
  onChange,
  onBlur,
}: {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div
      className="flex h-[36px] w-full flex-col items-start justify-center rounded-[4px] border bg-white px-[12px] py-[10px] transition-colors duration-150 ease-out"
      style={{ borderColor: focused ? tokens.blue : tokens.border }}
    >
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          onBlur?.();
        }}
        className="w-full bg-transparent text-[14px] font-normal leading-[1.35] tracking-[-0.28px] outline-none placeholder:text-[color:var(--_p)]"
        style={{ color: tokens.black, ["--_p" as string]: "#BABBBD" }}
      />
    </div>
  );
}

function OnlineMeetingModal({ onClose }: { onClose: () => void }) {
  const reduceMotion = useReducedMotion();
  const [link, setLink] = useState("");
  // Название — обычный редактируемый текст: пока пользователь его не менял,
  // оно живет само (подставляется ВКС из ссылки); ручная правка отключает автозаполнение,
  // очистка поля — возвращает.
  const [title, setTitle] = useState("");
  const [titleEdited, setTitleEdited] = useState(false);
  const [password, setPassword] = useState("");
  const [linkFocused, setLinkFocused] = useState(false);
  // «Отстоявшееся» значение ссылки: догоняет link через 700ms тишины.
  // Ошибку показываем только когда ввод устаканился — не мигает, пока печатают.
  const [settledLink, setSettledLink] = useState("");
  const linkFilled = link.trim().length > 0;

  // Пока ссылка не введена — иконка и пример ссылки крутятся синхронно.
  // Ввели ссылку — цикл замирает; если платформа распознана, иконка доезжает до нее.
  const [cycle, setCycle] = useVksCycle(!linkFilled);
  const lockedIndex = detectPlatformIndex(link);
  const canSubmit = linkFilled && lockedIndex >= 0;
  const linkError = linkFilled && lockedIndex < 0 && settledLink === link;

  useEffect(() => {
    const timer = setTimeout(() => setSettledLink(link), 700);
    return () => clearTimeout(timer);
  }, [link]);

  // Стерли распознанную ссылку — цикл продолжает с ее платформы, а не прыгает
  // к застывшему индексу (prev = index, чтобы ничего не «уходило» в этот момент).
  const handleLinkChange = useCallback((value: string) => {
    const prevLocked = detectPlatformIndex(link);
    const nextLocked = detectPlatformIndex(value);
    if (prevLocked >= 0 && nextLocked < 0) {
      setCycle({ index: prevLocked, prev: prevLocked });
    }
    setLink(value);
  }, [link, setCycle]);

  // Тултип «Поддерживаем: ...» по ховеру плитки с иконкой.
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const showTooltip = useCallback(() => setTooltipOpen(true), []);
  const hideTooltip = useCallback(() => setTooltipOpen(false), []);
  const displayIndex = lockedIndex >= 0 ? lockedIndex : cycle.index;
  const displayPrev = lockedIndex >= 0 && lockedIndex !== cycle.index ? cycle.index : cycle.prev;
  const dateLabel = new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
  const autoTitle = lockedIndex >= 0
    ? `${vksPlatforms[lockedIndex].name} - ${dateLabel}`
    : `Онлайн-встреча ${dateLabel}`;
  const titleValue = titleEdited ? title : autoTitle;
  const activeBanner = lockedIndex >= 0 ? vksPlatforms[lockedIndex].banner ?? null : null;
  const showPassword = lockedIndex >= 0 && Boolean(vksPlatforms[lockedIndex].hasPassword);
  // Пока баннер схлопывается, внутри должен оставаться последний контент — храним вид в стейте
  // (setState во время рендера с условием — легальный React-паттерн «derived state»).
  const [lastBanner, setLastBanner] = useState<"zoom" | "mts">("zoom");
  if (activeBanner && activeBanner !== lastBanner) setLastBanner(activeBanner);
  // Пока поле в фокусе, пустая строка легальна (иначе автоназвание перезаписывает текст
  // прямо под курсором при backspace). Автозаполнение возвращается на blur пустого поля.
  const handleTitleChange = useCallback((value: string) => {
    setTitle(value);
    setTitleEdited(true);
  }, []);
  const handleTitleBlur = useCallback(() => {
    setTitle((current) => {
      if (current.trim() === "") {
        setTitleEdited(false);
        return "";
      }
      return current;
    });
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <motion.div
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
      className="fixed inset-0 z-[60] flex items-center justify-center"
      style={{ backgroundColor: tokens.overlay }}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Запись онлайн-встречи"
        onClick={(event) => event.stopPropagation()}
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, transform: "scale(0.985)" }}
        animate={reduceMotion ? { opacity: 1 } : { opacity: 1, transform: "scale(1)" }}
        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, transform: "scale(0.99)" }}
        transition={reduceMotion ? { duration: 0 } : { duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
        className="flex max-h-[calc(100vh-48px)] w-[400px] flex-col items-start rounded-[4px]"
        style={{ boxShadow: "0 0 2.5px rgba(0, 0, 0, 0.15)" }}
      >
        <div
          className="flex h-[51px] w-full shrink-0 items-center justify-between rounded-t-[4px] border-b bg-white px-[16px]"
          style={{ borderColor: tokens.border }}
        >
          <div className="flex items-center gap-[8px]">
            <OmLinkIcon />
            <span className="text-[14px] font-medium leading-[1.35] tracking-[-0.28px]" style={{ color: tokens.black }}>
              Запись онлайн-встречи
            </span>
          </div>
          <button type="button" onClick={onClose} aria-label="Закрыть" className={`shrink-0 rounded-full ${pressableClass}`}>
            <OmCloseIcon />
          </button>
        </div>

        <div className="flex min-h-0 w-full flex-col items-start overflow-y-auto bg-white px-[16px] py-[24px]">
          {/* inert: схлопнутый блок не должен ловить Tab и клики */}
          <div className={morphRowsClass} style={{ gridTemplateRows: activeBanner ? "1fr" : "0fr" }} aria-hidden={!activeBanner} inert={!activeBanner}>
            <div className="min-h-0 w-full overflow-hidden">
              <div className={`pb-[24px] ${morphFadeClass}`} style={{ opacity: activeBanner ? 1 : 0 }}>
                <LinkBanner kind={activeBanner ?? lastBanner} />
              </div>
            </div>
          </div>
          <div className="flex w-full flex-col items-start gap-[24px]">
          <ModalField label="Ссылка на вашу встречу" dottedLabel>
            <div className="flex w-full flex-col items-start">
            <div className="flex w-full items-start">
              <div className="relative shrink-0">
                <div
                  onMouseEnter={showTooltip}
                  onMouseLeave={hideTooltip}
                  className="flex h-[36px] w-[36px] items-center justify-center rounded-l-[4px] border bg-white"
                  style={{ borderColor: tokens.border }}
                >
                  <span className="relative flex h-[16px] w-[16px] items-center justify-center">
                    <span
                      className="flex items-center justify-center transition-[opacity,transform,filter] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
                      style={{
                        transitionDuration: linkError ? `${VKS_EXIT_MS}ms` : `${VKS_ENTER_MS}ms`,
                        opacity: linkError ? 0 : 1,
                        transform: linkError ? "scale(0.8)" : "scale(1)",
                        filter: linkError ? "blur(2px)" : "blur(0px)",
                      }}
                    >
                      <VksCycleGlyph index={displayIndex} prev={displayPrev} />
                    </span>
                    <span
                      className="absolute inset-0 flex items-center justify-center transition-[opacity,transform,filter] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
                      style={{
                        transitionDuration: linkError ? `${VKS_ENTER_MS}ms` : `${VKS_EXIT_MS}ms`,
                        opacity: linkError ? 1 : 0,
                        transform: linkError ? "scale(1)" : "scale(0.8)",
                        filter: linkError ? "blur(0px)" : "blur(2px)",
                      }}
                    >
                      <Icon name="om-error.svg" />
                    </span>
                  </span>
                </div>
                {tooltipOpen && (
                  <motion.div
                    initial={reduceMotion ? { opacity: 0 } : { opacity: 0, transform: "scale(0.97)" }}
                    animate={reduceMotion ? { opacity: 1 } : { opacity: 1, transform: "scale(1)" }}
                    transition={reduceMotion ? { duration: 0 } : { duration: 0.125, ease: [0.23, 1, 0.32, 1] }}
                    className="pointer-events-none absolute left-0 top-[calc(100%+6px)] z-10 flex w-[108px] origin-top-left flex-col items-start gap-[6px] rounded-[3px] p-[8px] backdrop-blur-[8px] will-change-[opacity,transform]"
                    style={{ backgroundColor: tokens.overlay }}
                  >
                    <span className="text-[10px] font-normal leading-[normal] tracking-[-0.1px] text-white">Поддерживаем:</span>
                    {vksPlatforms.map((platform) => (
                      <span key={platform.name} className="flex items-center gap-[4px]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={asset(platform.icon)} alt="" width={10} height={10} className="block h-[10px] w-[10px] shrink-0" />
                        <span className="whitespace-nowrap text-[10px] font-normal leading-[normal] tracking-[-0.1px] text-white">
                          {platform.short ?? platform.name}
                        </span>
                      </span>
                    ))}
                  </motion.div>
                )}
              </div>
              <div
                className="relative -ml-px flex h-[36px] min-w-px flex-1 flex-col items-start justify-center rounded-r-[4px] border bg-white px-[12px] py-[10px] transition-colors duration-150 ease-out"
                style={{ borderColor: linkFocused ? tokens.blue : tokens.border, zIndex: linkFocused ? 1 : 0 }}
              >
                <input
                  type="text"
                  value={link}
                  aria-label="Ссылка на вашу встречу"
                  onChange={(event) => handleLinkChange(event.target.value)}
                  onFocus={() => setLinkFocused(true)}
                  onBlur={() => setLinkFocused(false)}
                  className="relative z-[1] w-full bg-transparent text-[14px] font-normal leading-[1.35] tracking-[-0.28px] outline-none"
                  style={{ color: tokens.black }}
                />
                {link === "" && (
                  <span aria-hidden="true" className="pointer-events-none absolute inset-x-[12px] inset-y-0 flex items-center overflow-hidden">
                    {vksPlatforms.map(({ placeholder }, i) => {
                      const state = i === cycle.index ? "active" : i === cycle.prev ? "leaving" : "resting";
                      return (
                        <span
                          key={placeholder}
                          className="absolute inset-0 flex items-center text-[14px] font-normal leading-[1.35] tracking-[-0.28px] transition-opacity ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
                          style={{
                            color: "#BABBBD",
                            transitionDuration: state === "active" ? `${VKS_ENTER_MS}ms` : state === "leaving" ? `${VKS_EXIT_MS}ms` : "0ms",
                            opacity: state === "active" ? 1 : 0,
                          }}
                        >
                          {/* truncate не работает на flex-контейнере — многоточие рисует вложенный блок */}
                          <span className="w-full truncate">{placeholder}</span>
                        </span>
                      );
                    })}
                  </span>
                )}
              </div>
            </div>
            <div className={morphRowsClass} style={{ gridTemplateRows: linkError ? "1fr" : "0fr" }} aria-hidden={!linkError} inert={!linkError}>
              <div className="min-h-0 w-full overflow-hidden">
                <span
                  className={`block pt-[8px] text-[12px] font-normal leading-[normal] tracking-[-0.24px] ${morphFadeClass}`}
                  style={{ color: tokens.red, opacity: linkError ? 1 : 0 }}
                >
                  Не удалось распознать ссылку на встречу
                </span>
              </div>
            </div>
            </div>
          </ModalField>

          <ModalField label="Выбрать AI-отчет">
            <button
              type="button"
              className="flex h-[36px] w-full items-center justify-between rounded-[4px] border bg-white px-[12px] py-[8px]"
              style={{ borderColor: tokens.border }}
            >
              <span className="flex items-center gap-[8px]">
                <span className="relative block h-[16px] w-[16px] overflow-hidden rounded-[2px]" style={{ backgroundColor: tokens.black }}>
                  <span className="absolute left-[4px] top-1/2 block h-[8px] w-[8px] -translate-y-1/2 rounded-[4px] bg-white" />
                </span>
                <span className="text-[13px] font-normal leading-[normal] tracking-[-0.13px]" style={{ color: tokens.black }}>
                  Обычная встреча
                </span>
              </span>
              <OmChevronIcon />
            </button>
          </ModalField>

          <ModalField label="Название встречи (опционально)">
            <ModalTextInput value={titleValue} placeholder="" onChange={handleTitleChange} onBlur={handleTitleBlur} />
          </ModalField>

          </div>
          <div className={morphRowsClass} style={{ gridTemplateRows: showPassword ? "1fr" : "0fr" }} aria-hidden={!showPassword} inert={!showPassword}>
            <div className="min-h-0 w-full overflow-hidden">
              <div className={`pt-[24px] ${morphFadeClass}`} style={{ opacity: showPassword ? 1 : 0 }}>
                <ModalField label="Пароль (опционально)">
                  <ModalTextInput value={password} placeholder="123456789" onChange={setPassword} />
                </ModalField>
              </div>
            </div>
          </div>
        </div>

        <div
          className="flex h-[68px] w-full shrink-0 flex-col items-start justify-center rounded-b-[4px] border-t px-[16px]"
          style={{ backgroundColor: tokens.bgSubtle, borderColor: tokens.border }}
        >
          <div className="flex w-full items-center justify-end">
            <button
              type="button"
              disabled={!canSubmit}
              onClick={onClose}
              className={`flex h-[36px] items-center justify-center rounded-[4px] px-[12px] py-[10px] ${
                canSubmit ? "cursor-pointer bg-[#0138C7] hover:bg-[#0032B1]" : "cursor-default bg-[#809BE3]"
              } ${pressableClass}`}
            >
              <span className="whitespace-nowrap text-[13px] font-medium leading-[normal] tracking-[-0.13px] text-white">
                Записать встречу
              </span>
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function OnlineMeetingModalPortal({ onClose }: { onClose: () => void }) {
  if (typeof document === "undefined") return null;
  return createPortal(<OnlineMeetingModal onClose={onClose} />, document.body);
}

function WorkspacePopoverPortal({
  role,
}: {
  role: WorkspaceRole;
}) {
  if (typeof document === "undefined") return null;
  return createPortal(<WorkspacePopover role={role} />, document.body);
}

function Sidebar({ workspaceRole }: { workspaceRole: WorkspaceRole }) {
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [addMenuAnchor, setAddMenuAnchor] = useState({ left: 16, top: 112 });
  const [desktopModalOpen, setDesktopModalOpen] = useState(false);
  const [onlineModalOpen, setOnlineModalOpen] = useState(false);
  const workspaceButtonRef = useRef<HTMLButtonElement>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);

  const closeAddMenu = useCallback(() => setAddMenuOpen(false), []);

  const openDesktopModal = useCallback(() => {
    setAddMenuOpen(false);
    setDesktopModalOpen(true);
  }, []);

  const openOnlineModal = useCallback(() => {
    setAddMenuOpen(false);
    setOnlineModalOpen(true);
  }, []);

  useEffect(() => {
    if (!addMenuOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (addButtonRef.current?.contains(target) || target.closest("[data-add-meeting-menu='true']")) return;
      closeAddMenu();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeAddMenu();
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [addMenuOpen, closeAddMenu]);

  const sidebarResourceItems: Item[] = [
    ...resourceItems,
    { label: "Десктоп приложение", icon: "desktop-app.svg", badge: "NEW", onSelect: () => setDesktopModalOpen(true) },
  ];

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
      if (
        workspaceButtonRef.current?.contains(target) ||
        target.closest("[data-workspace-popover='true']") ||
        target.closest("[data-theme-submenu='true']")
      ) return;
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
              {workspaceMenuOpen && <WorkspacePopoverPortal role={workspaceRole} />}
            </AnimatePresence>
          </div>

          <div className="flex w-full flex-col gap-[12px] p-[16px]">
            <div className="relative w-full">
              <button
                ref={addButtonRef}
                type="button"
                aria-expanded={addMenuOpen}
                aria-haspopup="menu"
                onClick={() => {
                  const rect = addButtonRef.current?.getBoundingClientRect();
                  if (rect) setAddMenuAnchor({ left: rect.left, top: rect.bottom + 6 });
                  setAddMenuOpen((open) => !open);
                }}
                className={`relative flex h-[36px] w-full items-center justify-between overflow-hidden rounded-[4px] px-[12px] py-[10px] ${pressableClass}`}
                style={{ backgroundColor: tokens.blue }}
              >
                <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-[4px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={asset("add-btn-paint.png")}
                    alt=""
                    className="absolute left-0 top-[-187.97%] block h-[475.95%] w-full max-w-none"
                  />
                  <span className="absolute inset-0 rounded-[4px]" style={{ backgroundColor: "rgba(1, 56, 199, 0.6)" }} />
                </span>
                <span className="relative text-[13px] font-medium leading-[normal] tracking-[-0.13px] text-white">Добавить встречу</span>
                <span className="relative flex h-[16px] w-[16px] items-center justify-center">
                  <Icon name="add.svg" />
                </span>
              </button>
              <AnimatePresence>
                {addMenuOpen && (
                  <AddMeetingMenuPortal
                    left={addMenuAnchor.left}
                    top={addMenuAnchor.top}
                    onDesktopSelect={openDesktopModal}
                    onInviteSelect={openOnlineModal}
                  />
                )}
              </AnimatePresence>
            </div>

            <MenuGroup items={primaryItems} />
            <MenuGroup title="Ресурсы" items={sidebarResourceItems} />
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
      <AnimatePresence>
        {desktopModalOpen && <DesktopPromoModalPortal onClose={() => setDesktopModalOpen(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {onlineModalOpen && <OnlineMeetingModalPortal onClose={() => setOnlineModalOpen(false)} />}
      </AnimatePresence>
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
  const workspaceRole: WorkspaceRole = "owner";

  return (
    <main className={`${inter.className} h-screen min-h-[720px] w-full overflow-hidden bg-white`} style={{ color: tokens.black }}>
      <div className="flex h-full w-full bg-white">
        <Sidebar workspaceRole={workspaceRole} />
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
