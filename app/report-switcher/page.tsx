"use client";

import { Inter } from "next/font/google";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const inter = Inter({ subsets: ["latin", "cyrillic"], weight: ["400", "500", "600"] });

const tokens = {
  blue: "#0138C7",
  black: "#212833",
  grey: "#818AA3",
  bgPage: "#FFFFFF",
  bgSubtle: "#F7F7F8",
  bgCard: "#FAFAFA",
  border: "#EFEFEF",
  blueSea: "#E4ECFA",
} as const;

const speakerColors = {
  green: "#26BF00",
  purple: "#8A38F5",
  orange: "#F87527",
  blue: "#0138C7",
  deepPurple: "#7000E0",
  red: "#D82020",
} as const;

const BASE = process.env.NODE_ENV === "production" ? "/design-lab" : "";
const asset = (name: string) => `${BASE}/ai-export-sharing/${name}`;
const sbAsset = (name: string) => `${BASE}/sidebar-menu-update/${name}`;
const ctaAsset = (name: string) => `${BASE}/b2c-upgrade-cta/${name}`;
const rsAsset = (name: string) => `${BASE}/report-switcher/${name}`;

const pressableClass =
  "transition-colors duration-[120ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none";

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar (переиспользован из sidebar-menu-update + CTA из b2c-upgrade-cta)
// ─────────────────────────────────────────────────────────────────────────────

type Item = { label: string; icon: string; active?: boolean };

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
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={sbAsset(name)} alt="" width={size} height={size} className="shrink-0" />
  );
}

function MenuIcon({ name }: { name: string }) {
  const src = sbAsset(name);
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
          className="text-[13px] font-normal leading-[16px] tracking-[-0.13px]"
          style={{ color: tokens.black }}
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
        <img src={sbAsset("section-chevron-figma.svg")} alt="" className="block h-[16px] w-[16px] shrink-0" />
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

function UpgradePlanCTA() {
  return (
    <div
      role="button"
      tabIndex={0}
      className="group relative flex h-[40px] w-full cursor-pointer items-center gap-[4px] overflow-hidden border-t border-solid px-[16px] py-[8px]"
      style={{ backgroundColor: tokens.bgSubtle, borderColor: tokens.border }}
    >
      <div className="flex items-center gap-[8px] rounded-[4px]">
        <ArrowUpCircle size={16} animated />
        <span
          className="whitespace-nowrap text-[13px] font-medium leading-none"
          style={{ color: tokens.blue, letterSpacing: "-0.13px" }}
        >
          Улучшить план
        </span>
      </div>

      <div className="absolute h-[38.389px] w-[91px] left-[173px] top-[7px]">
        <div
          className="absolute flex h-[32px] w-[32px] items-center justify-center rounded-[4px] border-[1.021px] border-solid bg-white rotate-[16deg] transition-transform duration-200 ease-out group-hover:translate-x-[3px] group-hover:-translate-y-[3px] group-hover:rotate-[22deg]"
          style={{ borderColor: tokens.border, left: "56px", top: "6px" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ctaAsset("ic-tile-music.svg")} alt="" className="h-[16.335px] w-[16.335px] shrink-0" />
        </div>
        <div
          className="absolute flex h-[32px] w-[32px] items-center justify-center rounded-[4px] border-[1.021px] border-solid bg-white -rotate-[16deg] transition-transform duration-200 ease-out group-hover:-translate-x-[3px] group-hover:-translate-y-[3px] group-hover:-rotate-[22deg]"
          style={{ borderColor: tokens.border, left: "4px", top: "6px" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ctaAsset("ic-tile-bolt.svg")} alt="" className="h-[18.286px] w-[18.286px] shrink-0" />
        </div>
        <div
          className="absolute flex h-[32px] w-[32px] items-center justify-center rounded-[4px] border-[1.021px] border-solid bg-white transition-transform duration-200 ease-out group-hover:-translate-y-[2px]"
          style={{ borderColor: tokens.border, left: "30px", top: "6px" }}
        >
          <ArrowUpCircle size={18.286} />
        </div>
      </div>
    </div>
  );
}

function Sidebar() {
  return (
    <aside
      className="flex h-full w-[280px] shrink-0 flex-col justify-between border-r bg-white"
      style={{ borderColor: tokens.border }}
    >
      <div className="w-full">
        <div
          className="flex h-[54px] w-full items-center border-b bg-white pl-[10px] pr-[16px]"
          style={{ borderColor: tokens.border }}
        >
          <button
            type="button"
            className={`flex h-[40px] shrink-0 items-center rounded-[4px] p-[6px] text-left outline-none hover:bg-[#F7F7F8] ${pressableClass}`}
          >
            <span className="flex items-center gap-[8px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={sbAsset("workspace-avatar.png")} alt="" className="h-[28px] w-[28px] shrink-0 rounded-[3px] object-cover" />
              <span className="flex min-w-0 items-center gap-[4px]">
                <span className="truncate text-[13px] font-medium leading-[normal] tracking-[-0.13px]" style={{ color: tokens.black }}>
                  fz4884’s space
                </span>
                <Icon name="chevron-down.svg" />
              </span>
            </span>
          </button>
        </div>

        <div className="flex w-full flex-col gap-[12px] p-[16px]">
          <button
            type="button"
            className={`flex h-[36px] w-full items-center justify-between rounded-[4px] px-[12px] py-[10px] hover:bg-[#0032B1] ${pressableClass}`}
            style={{ backgroundColor: tokens.blue }}
          >
            <span className="text-[13px] font-medium leading-[normal] tracking-[-0.13px] text-white">Добавить встречу</span>
            <Icon name="add.svg" />
          </button>

          <MenuGroup items={primaryItems} />
          <MenuGroup title="Ресурсы" items={resourceItems} />
        </div>
      </div>

      <div className="flex w-full flex-col">
        <UpgradePlanCTA />
        <div
          className="flex w-full flex-col items-center justify-center gap-[8px] border-t px-[16px] py-[12px]"
          style={{ borderColor: tokens.border }}
        >
          <div className="flex w-full items-end justify-between whitespace-nowrap">
            <span className="text-[13px] font-medium tracking-[-0.13px]" style={{ color: tokens.black }}>Free</span>
            <span className="text-[12px] font-medium tracking-[-0.24px]" style={{ color: tokens.black }}>Доступно 100 из 180</span>
          </div>
          <div className="relative h-[6px] w-full overflow-hidden rounded-full" style={{ backgroundColor: tokens.blueSea }}>
            <div className="h-full w-[55.6%]" style={{ backgroundColor: tokens.blue }} />
          </div>
        </div>
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Header: Назад + AI / Поделиться / Экспорт (+ поповеры состояний)
// ─────────────────────────────────────────────────────────────────────────────

const popoverMotion = {
  initial: { opacity: 0, transform: "translateY(-6px) scale(0.965)" },
  animate: { opacity: 1, transform: "translateY(0px) scale(1)" },
  exit: { opacity: 0, transform: "translateY(-2px) scale(0.985)" },
} as const;

function usePopoverMotion() {
  const reduceMotion = useReducedMotion();
  return {
    initial: reduceMotion ? { opacity: 0 } : popoverMotion.initial,
    animate: reduceMotion ? { opacity: 1 } : popoverMotion.animate,
    exit: reduceMotion ? { opacity: 0 } : popoverMotion.exit,
    transition: reduceMotion ? { duration: 0 } : { duration: 0.18, ease: [0.23, 1, 0.32, 1] as const },
  };
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className="relative h-[16px] w-[24px] shrink-0 cursor-pointer rounded-full transition-colors duration-[180ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
      style={{ backgroundColor: on ? tokens.blue : "#C7C8CA" }}
    >
      <span
        className="absolute top-[4px] h-[8px] w-[8px] rounded-full bg-white transition-[left] duration-[180ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
        style={{ left: on ? "12px" : "4px" }}
      />
    </button>
  );
}

type AiMenuItem = { icon: string; label: string; external: boolean; deepseek?: boolean };

const aiMenuTop: AiMenuItem[] = [
  { icon: "menu-chatgpt.svg", label: "Открыть в ChatGPT", external: true },
  { icon: "menu-claude.svg", label: "Открыть в Claude", external: true },
  { icon: "menu-deepseek.svg", label: "Открыть в DeepSeek", external: true, deepseek: true },
];

const aiMenuBottom: AiMenuItem[] = [
  { icon: "menu-copy.svg", label: "Скопировать для AI", external: false },
  { icon: "menu-download.svg", label: "Скачать для AI", external: false },
];

function AiMenuRow({ item, onSelect }: { item: AiMenuItem; onSelect: (item: AiMenuItem) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className={`flex w-full items-center justify-between rounded-[2px] px-[6px] py-[8px] text-left hover:bg-[#F7F7F8] ${pressableClass}`}
    >
      <span className="flex items-center gap-[6px]">
        <span className="flex h-[16px] w-[16px] shrink-0 items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={asset(item.icon)}
            alt=""
            className={item.deepseek ? "h-[11.774px] w-[16px] shrink-0" : "h-[16px] w-[16px] shrink-0"}
          />
        </span>
        <span className="whitespace-nowrap text-[13px] font-normal leading-[normal] tracking-[-0.13px]" style={{ color: tokens.black }}>
          {item.label}
        </span>
      </span>
      {item.external && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={asset("menu-external.svg")} alt="" className="h-[16px] w-[16px] shrink-0" />
      )}
    </button>
  );
}

function AiExportMenu({ onSelect }: { onSelect: (item: AiMenuItem) => void }) {
  const motionProps = usePopoverMotion();
  return (
    <motion.div
      {...motionProps}
      className="absolute right-0 top-[38px] z-50 flex w-[210px] origin-top-right flex-col items-start overflow-clip rounded-[4px] bg-white shadow-[0_0_4px_0_rgba(0,0,0,0.15)] will-change-[opacity,transform]"
    >
      <div className="flex w-full flex-col items-center border-b p-[4px]" style={{ borderColor: tokens.border }}>
        {aiMenuTop.map((item) => (
          <AiMenuRow key={item.label} item={item} onSelect={onSelect} />
        ))}
      </div>
      <div className="flex w-full flex-col items-center p-[4px]">
        {aiMenuBottom.map((item) => (
          <AiMenuRow key={item.label} item={item} onSelect={onSelect} />
        ))}
      </div>
    </motion.div>
  );
}

function SharePopover() {
  const motionProps = usePopoverMotion();
  const [focused, setFocused] = useState(false);
  const [shareAccess, setShareAccess] = useState(true);

  return (
    <motion.div
      {...motionProps}
      className="absolute right-0 top-[38px] z-50 flex w-[380px] origin-top-right flex-col items-center overflow-clip rounded-[4px] bg-white drop-shadow-[0px_0px_2px_rgba(0,0,0,0.15)] will-change-[opacity,transform]"
    >
      <div className="flex w-full items-center border-b bg-white p-[16px]" style={{ borderColor: tokens.border }}>
        <div className="flex items-center gap-[8px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset("share-title.svg")} alt="" className="h-[16px] w-[16px] shrink-0" />
          <span className="whitespace-nowrap text-[14px] font-medium leading-[1.35] tracking-[-0.28px]" style={{ color: tokens.black }}>
            Поделиться встречей
          </span>
        </div>
      </div>

      <div className="flex w-full flex-col items-start bg-white p-[16px]">
        <div className="flex h-[36px] w-full items-start gap-[8px]">
          <div
            className="flex h-[36px] min-w-px flex-1 items-center rounded-[4px] border border-solid bg-white py-[8px] pl-[12px] pr-[6px] transition-colors"
            style={{ borderColor: focused ? tokens.blue : tokens.border }}
          >
            <input
              type="text"
              placeholder="Введите email"
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              className="w-full bg-transparent text-[13px] font-normal leading-[normal] tracking-[-0.13px] outline-none placeholder:text-[#C7C8CA]"
              style={{ color: tokens.black }}
            />
          </div>
          <button
            type="button"
            className={`flex h-[36px] shrink-0 items-center rounded-[4px] px-[12px] py-[8px] hover:bg-[#EFEFEF] ${pressableClass}`}
            style={{ backgroundColor: tokens.bgSubtle }}
          >
            <span className="whitespace-nowrap text-[13px] font-normal leading-[16px] tracking-[-0.13px]" style={{ color: tokens.black }}>
              Отправить
            </span>
          </button>
        </div>
      </div>

      <div className="flex w-full flex-col items-start gap-[16px] border-t bg-white p-[16px]" style={{ borderColor: tokens.border }}>
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-[12px]">
            <div className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-[4px] p-[8px]" style={{ backgroundColor: tokens.bgSubtle }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={asset("share-link.svg")} alt="" className="h-[16px] w-[16px] shrink-0" />
            </div>
            <div className="flex flex-col items-start gap-[2px]">
              <span
                className="whitespace-nowrap text-[14px] font-medium leading-[1.35] tracking-[-0.28px] underline decoration-dotted decoration-[#babbbd] underline-offset-[3px]"
                style={{ color: tokens.black }}
              >
                Общий доступ
              </span>
              <span className="whitespace-nowrap text-[12px] font-normal leading-[normal] tracking-[-0.24px]" style={{ color: tokens.grey }}>
                Просмотр встречи по ссылке
              </span>
            </div>
          </div>
          <Toggle on={shareAccess} onToggle={() => setShareAccess((value) => !value)} />
        </div>
        <button
          type="button"
          className={`flex h-[36px] w-full items-center justify-center rounded-[4px] p-[10px] hover:bg-[#0032B1] ${pressableClass}`}
          style={{ backgroundColor: tokens.blue }}
        >
          <span className="whitespace-nowrap text-[13px] font-medium leading-[normal] tracking-[-0.13px] text-white">
            Скопировать ссылку
          </span>
        </button>
      </div>
    </motion.div>
  );
}

const exportFormats = ["PDF", "DOCX", "MD", "JSON"] as const;

function ExportPopover() {
  const motionProps = usePopoverMotion();
  const [format, setFormat] = useState<(typeof exportFormats)[number]>("PDF");
  const [aiReport, setAiReport] = useState(true);
  const [aiTasks, setAiTasks] = useState(true);

  return (
    <motion.div
      {...motionProps}
      className="absolute right-0 top-[38px] z-50 flex w-[320px] origin-top-right flex-col items-center overflow-clip rounded-[4px] bg-white drop-shadow-[0px_0px_2px_rgba(0,0,0,0.15)] will-change-[opacity,transform]"
    >
      <div className="flex w-full items-center bg-white p-[16px]">
        <div className="flex items-center gap-[8px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset("export-title.svg")} alt="" className="h-[16px] w-[16px] shrink-0" />
          <span className="whitespace-nowrap text-[14px] font-medium leading-[1.35] tracking-[-0.28px]" style={{ color: tokens.black }}>
            Экспорт встречи
          </span>
        </div>
      </div>

      <div className="flex w-full flex-col items-end gap-[24px] border-t bg-white p-[16px]" style={{ borderColor: tokens.border }}>
        <div className="flex w-full flex-col items-start gap-[24px]">
          <div className="flex h-[40px] w-full items-start gap-[2px] rounded-[4px] p-[4px]" style={{ backgroundColor: tokens.bgSubtle }}>
            {exportFormats.map((item) => {
              const active = format === item;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setFormat(item)}
                  className={`flex h-full min-w-px flex-1 items-center justify-center rounded-[3px] px-[8px] py-[6px] ${pressableClass} ${active ? "bg-white" : "hover:bg-white/60"}`}
                >
                  <span
                    className={`whitespace-nowrap text-[13px] leading-[16px] tracking-[-0.13px] ${active ? "font-medium" : "font-normal"}`}
                    style={{ color: active ? tokens.black : tokens.grey }}
                  >
                    {item}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex w-full flex-col items-start gap-[16px]">
            <div className="flex w-full flex-col items-start gap-[12px]">
              <div className="flex w-full items-center justify-between">
                <span className="whitespace-nowrap text-[13px] font-normal leading-[16px] tracking-[-0.13px]" style={{ color: tokens.black }}>
                  Добавить AI отчет
                </span>
                <Toggle on={aiReport} onToggle={() => setAiReport((value) => !value)} />
              </div>
              <button
                type="button"
                className={`flex h-[36px] w-full items-center justify-between rounded-[4px] border border-solid px-[12px] py-[8px] hover:bg-[#F7F7F8] ${pressableClass}`}
                style={{ borderColor: tokens.border }}
              >
                <span className="flex items-center gap-[8px]">
                  <span className="relative h-[16px] w-[16px] shrink-0 overflow-clip rounded-[2px]" style={{ backgroundColor: tokens.grey }}>
                    <span className="absolute left-[4px] top-[4px] h-[8px] w-[8px] rounded-[4px] bg-white" />
                  </span>
                  <span className="whitespace-nowrap text-[13px] font-normal leading-[normal] tracking-[-0.13px]" style={{ color: tokens.black }}>
                    Обычная встреча
                  </span>
                </span>
                <Icon name="chevron-down.svg" />
              </button>
            </div>
            <div className="h-px w-full" style={{ backgroundColor: tokens.border }} />
            <div className="flex w-full items-center justify-between">
              <span className="whitespace-nowrap text-[13px] font-normal leading-[16px] tracking-[-0.13px]" style={{ color: tokens.black }}>
                Добавить AI задачи
              </span>
              <Toggle on={aiTasks} onToggle={() => setAiTasks((value) => !value)} />
            </div>
          </div>
        </div>

        <button
          type="button"
          className={`flex h-[36px] w-full items-center justify-center rounded-[4px] p-[10px] hover:bg-[#0032B1] ${pressableClass}`}
          style={{ backgroundColor: tokens.blue }}
        >
          <span className="whitespace-nowrap text-[13px] font-medium leading-[normal] tracking-[-0.13px] text-white">
            Скачать
          </span>
        </button>
      </div>
    </motion.div>
  );
}

type HeaderPanel = "ai" | "share" | "export" | null;

const AI_COPY_LABEL = "Скопировать для AI";

function MeetingHeader({
  linkCopied,
  onCopyLink,
  onAiCopy,
}: {
  linkCopied: boolean;
  onCopyLink: () => void;
  onAiCopy: () => void;
}) {
  const [openPanel, setOpenPanel] = useState<HeaderPanel>(null);
  // Дефолтное действие — ChatGPT (первый пункт меню)
  const [aiAction, setAiAction] = useState<AiMenuItem>(aiMenuTop[0]);
  const [aiCopied, setAiCopied] = useState(false);
  const [tip, setTip] = useState<HeaderTip | null>(null);
  const [tipVisible, setTipVisible] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);
  const aiCopyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showTip = (text: string) => (event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTip({ text, left: rect.left + rect.width / 2, top: rect.bottom + 8 });
    setTipVisible(true);
  };

  const hideTip = () => setTipVisible(false);

  const togglePanel = (panel: Exclude<HeaderPanel, null>) =>
    setOpenPanel((value) => (value === panel ? null : panel));

  const triggerAiCopy = () => {
    onAiCopy();
    setAiCopied(true);
    if (aiCopyTimer.current) clearTimeout(aiCopyTimer.current);
    aiCopyTimer.current = setTimeout(() => {
      setAiCopied(false);
      aiCopyTimer.current = null;
    }, 2000);
  };

  const handleAiSelect = (item: AiMenuItem) => {
    setAiAction(item);
    setOpenPanel(null);
    if (item.label === AI_COPY_LABEL) triggerAiCopy();
  };

  const handleAiActionClick = () => {
    if (aiAction.label === AI_COPY_LABEL) triggerAiCopy();
  };

  useEffect(() => {
    return () => {
      if (aiCopyTimer.current) clearTimeout(aiCopyTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!openPanel) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (actionsRef.current?.contains(target)) return;
      setOpenPanel(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenPanel(null);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [openPanel]);

  return (
    <header className="relative z-40 flex h-[54px] w-full shrink-0 items-center justify-between bg-white px-[24px] py-[16px]">
      <button
        type="button"
        className={`rounded-[4px] text-[13px] font-normal leading-[normal] tracking-[-0.13px] hover:opacity-70 ${pressableClass}`}
        style={{ color: tokens.black }}
      >
        Назад
      </button>

      <div ref={actionsRef} className="relative flex items-center gap-[8px]">
        {/* AI split button */}
        <div className="relative">
          <div className="flex h-[32px] items-center overflow-hidden rounded-[4px] border border-solid" style={{ borderColor: tokens.border }}>
            <button
              type="button"
              aria-label={aiAction.label}
              onClick={handleAiActionClick}
              onMouseEnter={showTip(aiAction.label)}
              onMouseLeave={hideTip}
              className={`flex h-[30px] w-[30px] shrink-0 items-center justify-center hover:bg-[#F7F7F8] ${pressableClass}`}
            >
              <span className="relative flex h-[16px] w-[16px] shrink-0 items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={asset(aiAction.icon)}
                  alt=""
                  className={`${aiAction.deepseek ? "h-[11.774px] w-[16px]" : "h-[16px] w-[16px]"} shrink-0 transition-[opacity,transform] duration-[120ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none`}
                  style={{ opacity: aiCopied ? 0 : 1, transform: aiCopied ? "scale(0.7)" : "scale(1)" }}
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={asset("check-circle.svg")}
                  alt=""
                  className="absolute inset-0 h-[16px] w-[16px] transition-[opacity,transform] duration-[120ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
                  style={{ opacity: aiCopied ? 1 : 0, transform: aiCopied ? "scale(1)" : "scale(0.7)" }}
                />
              </span>
            </button>
            <div className="h-full w-px shrink-0" style={{ backgroundColor: tokens.border }} />
            <button
              type="button"
              aria-label="Открыть меню AI"
              aria-expanded={openPanel === "ai"}
              onClick={() => togglePanel("ai")}
              className={`flex h-[30px] w-[30px] shrink-0 items-center justify-center hover:bg-[#F7F7F8] ${openPanel === "ai" ? "bg-[#F7F7F8]" : "bg-white"} ${pressableClass}`}
            >
              <Icon name="chevron-down.svg" />
            </button>
          </div>
          <AnimatePresence>{openPanel === "ai" && <AiExportMenu onSelect={handleAiSelect} />}</AnimatePresence>
        </div>

        {/* Share split button */}
        <div className="flex h-[32px] items-center overflow-hidden rounded-[3px] border border-solid" style={{ borderColor: tokens.border }}>
          <button
            type="button"
            aria-expanded={openPanel === "share"}
            onClick={() => togglePanel("share")}
            className={`flex h-[30px] items-center gap-[6px] px-[8px] hover:bg-[#F7F7F8] ${openPanel === "share" ? "bg-[#F7F7F8]" : ""} ${pressableClass}`}
          >
            <span className="text-[13px] font-normal leading-[normal] tracking-[-0.13px]" style={{ color: tokens.black }}>
              Поделиться
            </span>
          </button>
          <div className="h-full w-px shrink-0" style={{ backgroundColor: tokens.border }} />
          <button
            type="button"
            aria-label="Скопировать ссылку"
            onClick={onCopyLink}
            onMouseEnter={showTip("Скопировать ссылку")}
            onMouseLeave={hideTip}
            className={`flex h-[30px] w-[30px] shrink-0 items-center justify-center bg-white hover:bg-[#F7F7F8] ${pressableClass}`}
          >
            <span className="relative h-[16px] w-[16px] shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={asset("link.svg")}
                alt=""
                className="absolute inset-0 h-[16px] w-[16px] transition-[opacity,transform] duration-[120ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
                style={{ opacity: linkCopied ? 0 : 1, transform: linkCopied ? "scale(0.7)" : "scale(1)" }}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={asset("check-circle.svg")}
                alt=""
                className="absolute inset-0 h-[16px] w-[16px] transition-[opacity,transform] duration-[120ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
                style={{ opacity: linkCopied ? 1 : 0, transform: linkCopied ? "scale(1)" : "scale(0.7)" }}
              />
            </span>
          </button>
        </div>

        {/* Export button */}
        <button
          type="button"
          aria-expanded={openPanel === "export"}
          onClick={() => togglePanel("export")}
          className={`flex h-[32px] items-center justify-center gap-[6px] rounded-[4px] border border-solid px-[8px] py-[6px] hover:bg-[#F7F7F8] ${openPanel === "export" ? "bg-[#F7F7F8]" : ""} ${pressableClass}`}
          style={{ borderColor: tokens.border }}
        >
          <span className="text-[13px] font-normal leading-[normal] tracking-[-0.13px]" style={{ color: tokens.black }}>
            Экспорт
          </span>
        </button>

        {/* Поповеры шеринга и экспорта прибиты к правому краю группы кнопок */}
        <AnimatePresence>{openPanel === "share" && <SharePopover />}</AnimatePresence>
        <AnimatePresence>{openPanel === "export" && <ExportPopover />}</AnimatePresence>
      </div>
      <HeaderTooltip tip={tip} visible={tipVisible} />
    </header>
  );
}

// Тост-подтверждение — заякорен к самому плееру: absolute внутри PlayerBar,
// 8px над его верхней кромкой, по центру его ширины. CSS-transitions вместо framer.
function CopiedToast({ visible, message }: { visible: boolean; message: string }) {
  return (
    <div
      className="absolute bottom-[calc(100%+8px)] left-1/2 z-50 flex h-[36px] items-center justify-center gap-[8px] rounded-[4px] px-[12px] py-[10px] transition-[opacity,transform] duration-[200ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
      style={{
        backgroundColor: tokens.black,
        opacity: visible ? 1 : 0,
        transform: visible
          ? "translateX(-50%) translateY(0px) scale(1)"
          : "translateX(-50%) translateY(8px) scale(0.97)",
        pointerEvents: "none",
      }}
      role="status"
      aria-hidden={!visible}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={asset("toast-check.svg")} alt="" className="h-[16px] w-[16px] shrink-0" />
      <span className="whitespace-nowrap text-[13px] font-medium leading-[normal] tracking-[-0.13px] text-white">
        {message}
      </span>
    </div>
  );
}

// Наш тултип — полупрозрачный черный с блюром (как в usage-stats/current-meeting),
// порталом в body: кнопки шапки сидят в overflow-hidden контейнерах.
type HeaderTip = { text: string; left: number; top: number };

function HeaderTooltip({ tip, visible }: { tip: HeaderTip | null; visible: boolean }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted || !tip) return null;
  return createPortal(
    <span
      role="tooltip"
      className="pointer-events-none fixed z-[60] w-max max-w-[240px] -translate-x-1/2 rounded-[3px] p-[8px] text-left text-[10px] font-normal leading-[normal] tracking-[-0.1px] text-white transition-opacity duration-[120ms] ease-out motion-reduce:transition-none"
      style={{
        left: tip.left,
        top: tip.top,
        opacity: visible ? 1 : 0,
        backgroundColor: "rgba(33,40,51,0.4)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      }}
    >
      {tip.text}
    </span>,
    document.body,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Meeting info: title, badges, speakers
// ─────────────────────────────────────────────────────────────────────────────

function MeetingInfo() {
  const speakers = [
    { name: "Marisa McGill", color: speakerColors.orange },
    { name: "Jordan Lee", color: speakerColors.deepPurple },
    { name: "Ashley Chen", color: speakerColors.green },
    { name: "Samira Patel", color: speakerColors.red },
  ];

  return (
    <div className="flex flex-col items-start gap-[16px]">
      <h1
        className="text-[32px] font-semibold leading-[normal]"
        style={{ color: tokens.black, letterSpacing: "-0.96px" }}
      >
        Design team workshop #26
      </h1>

      <div className="flex items-center gap-[4px]">
        <div className="flex items-center justify-center gap-[4px] rounded-[3px] px-[8px] py-[4px]" style={{ backgroundColor: tokens.bgSubtle }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset("badge-uploaded.svg")} alt="" className="h-[12px] w-[12px] shrink-0" />
          <span className="text-[12px] font-normal leading-[normal] tracking-[-0.24px]" style={{ color: tokens.black }}>
            Uploaded
          </span>
        </div>
        <div className="flex h-[23px] items-center justify-center gap-[8px] rounded-[3px] px-[8px]" style={{ backgroundColor: tokens.bgSubtle }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset("email-avatar.png")} alt="" className="h-[16px] w-[16px] shrink-0 rounded-full object-cover" />
          <span className="text-[12px] font-normal leading-[normal] tracking-[-0.24px]" style={{ color: tokens.black }}>
            hello@mymeet.ai
          </span>
        </div>
        <div className="flex items-center justify-center gap-[4px] rounded-[3px] px-[8px] py-[4px]" style={{ backgroundColor: tokens.bgSubtle }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset("badge-calendar.svg")} alt="" className="h-[12px] w-[12px] shrink-0" />
          <span className="whitespace-pre text-[12px] font-normal leading-[normal] tracking-[-0.24px]" style={{ color: tokens.black }}>
            {"15.11.2022  13:40"}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-start gap-[4px]">
        <span
          className="text-[13px] font-normal leading-[16px] tracking-[-0.13px] underline decoration-dotted decoration-[#818aa3] underline-offset-[3px]"
          style={{ color: tokens.black }}
        >
          Speakers
        </span>
        <div className="flex w-[400px] flex-wrap items-start gap-y-[2px] leading-[16px]">
          {speakers.map((speaker, index) => (
            <span key={speaker.name} className="whitespace-nowrap">
              <span className="text-[13px] font-normal tracking-[-0.13px]" style={{ color: speaker.color }}>
                {speaker.name}
              </span>
              {index < speakers.length - 1 && (
                <span className="text-[14px] font-normal" style={{ color: tokens.grey }}>,</span>
              )}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Отчеты: данные
// ─────────────────────────────────────────────────────────────────────────────

type ReportIconDef =
  | { kind: "svg"; file: string }
  | { kind: "badge"; letter: string; file: string };

type Report = {
  id: string;
  label: string;
  icon: ReportIconDef;
  group: "custom" | "preset";
};

// Дефолтный отчет встречи — применен изначально
const articleReport: Report = {
  id: "article",
  label: "Статья",
  icon: { kind: "svg", file: "report-article.svg" },
  group: "preset",
};

const customReports: Report[] = [
  { id: "design-sync", label: "Дизайн-синк отчет", icon: { kind: "badge", letter: "Д", file: "badge-green.svg" }, group: "custom" },
  { id: "antimat", label: "Антимат", icon: { kind: "badge", letter: "А", file: "badge-yellow.svg" }, group: "custom" },
];

const presetReports: Report[] = [
  { id: "regular", label: "Обычная встреча", icon: { kind: "svg", file: "preset-regular.svg" }, group: "preset" },
  { id: "client", label: "Встреча с клиентом", icon: { kind: "svg", file: "preset-client.svg" }, group: "preset" },
  { id: "sales", label: "Коуч по продажам", icon: { kind: "svg", file: "preset-sales.svg" }, group: "preset" },
  { id: "hr", label: "HR интервью", icon: { kind: "svg", file: "preset-hr.svg" }, group: "preset" },
  { id: "research", label: "Исследование", icon: { kind: "svg", file: "preset-research.svg" }, group: "preset" },
  { id: "teamsync", label: "Командный синк", icon: { kind: "svg", file: "preset-teamsync.svg" }, group: "preset" },
  { id: "one-on-one", label: "Один-на-один", icon: { kind: "svg", file: "preset-oneonone.svg" }, group: "preset" },
  { id: "notes", label: "Конспект", icon: { kind: "svg", file: "preset-notes.svg" }, group: "preset" },
  { id: "protocol", label: "Протокол", icon: { kind: "svg", file: "preset-protocol.svg" }, group: "preset" },
  { id: "medicine", label: "Медицина", icon: { kind: "svg", file: "preset-medicine.svg" }, group: "preset" },
];

const allReports: Report[] = [articleReport, ...customReports, ...presetReports];

// Иконка отчета: обычный SVG или бейдж кастомного отчета (подложка + буква)
function ReportIcon({ report, size = 16 }: { report: Report; size?: number }) {
  const scale = size / 16;
  if (report.icon.kind === "svg") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={rsAsset(report.icon.file)} alt="" className="shrink-0" style={{ width: size, height: size }} />
    );
  }
  return (
    <span className="relative block shrink-0 overflow-clip" style={{ width: size, height: size }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={rsAsset(report.icon.file)}
        alt=""
        className="absolute"
        style={{ top: "6.28%", right: "11.74%", bottom: "6.26%", left: "11.72%", width: "76.54%", height: "87.46%" }}
      />
      <span
        className="absolute left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center text-center font-bold uppercase leading-[normal] text-white"
        style={{ top: `calc(50% + ${0.5 * scale}px)`, fontSize: 8 * scale, width: 12 * scale, height: 13 * scale }}
      >
        {report.icon.letter}
      </span>
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Дропдаун выбора отчета: примененные / кастомные / предустановленные
// ─────────────────────────────────────────────────────────────────────────────

function ReportRow({
  report,
  isCurrent,
  onSelect,
  onReload,
}: {
  report: Report;
  isCurrent?: boolean;
  onSelect: () => void;
  onReload?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-center gap-[6px] rounded-[2px] px-[6px] py-[8px] text-left hover:bg-[#F7F7F8] ${pressableClass}`}
    >
      <ReportIcon report={report} />
      <span
        className="min-w-0 flex-1 truncate text-[13px] font-normal leading-[normal] tracking-[-0.13px]"
        style={{ color: tokens.black }}
      >
        {report.label}
      </span>
      {isCurrent && (
        <span className="flex shrink-0 items-center gap-[6px]">
          <span
            role="button"
            tabIndex={0}
            aria-label="Пересоздать отчет"
            onClick={(event) => {
              event.stopPropagation();
              onReload?.();
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.stopPropagation();
                onReload?.();
              }
            }}
            className={`flex h-[16px] w-[16px] items-center justify-center hover:opacity-70 ${pressableClass}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={rsAsset("ic-reload.svg")} alt="" className="h-[16px] w-[16px] shrink-0" />
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={rsAsset("ic-check.svg")} alt="" className="h-[16px] w-[16px] shrink-0" />
        </span>
      )}
    </button>
  );
}

function ReportDropdown({
  applied,
  currentId,
  onSelect,
  onReload,
  onClose,
}: {
  applied: Report[];
  currentId: string;
  onSelect: (report: Report) => void;
  onReload: () => void;
  onClose: () => void;
}) {
  const motionProps = usePopoverMotion();
  const appliedIds = applied.map((report) => report.id);
  const availableCustom = customReports.filter((report) => !appliedIds.includes(report.id));
  const availablePresets = presetReports.filter((report) => !appliedIds.includes(report.id));

  return (
    <motion.div
      {...motionProps}
      className="absolute left-0 top-[calc(100%+6px)] z-50 flex max-h-[368px] w-[220px] origin-top-left flex-col items-start overflow-y-auto overflow-x-clip overscroll-contain rounded-[4px] bg-white shadow-[0_0_4px_0_rgba(0,0,0,0.15)] will-change-[opacity,transform] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-[2px] [&::-webkit-scrollbar-thumb]:border-solid [&::-webkit-scrollbar-thumb]:border-transparent [&::-webkit-scrollbar-thumb]:bg-[#DDDEDF] [&::-webkit-scrollbar-thumb]:bg-clip-padding [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-track]:[margin:4px_0] [&::-webkit-scrollbar]:w-[8px]"
    >
      {/* Примененные к этой встрече отчеты */}
      <div className="flex w-full shrink-0 flex-col items-center border-b p-[4px]" style={{ borderColor: tokens.border }}>
        {applied.map((report) => (
          <ReportRow
            key={report.id}
            report={report}
            isCurrent={report.id === currentId}
            onSelect={() => onSelect(report)}
            onReload={onReload}
          />
        ))}
      </div>

      {/* Кастомные отчеты + создание */}
      <div className="flex w-full shrink-0 flex-col items-center border-b p-[4px]" style={{ borderColor: tokens.border }}>
        {availableCustom.map((report) => (
          <ReportRow key={report.id} report={report} onSelect={() => onSelect(report)} />
        ))}
        <button
          type="button"
          onClick={onClose}
          className={`flex w-full items-center gap-[6px] rounded-[2px] px-[6px] py-[8px] text-left hover:bg-[#F7F7F8] ${pressableClass}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={rsAsset("ic-plus.svg")} alt="" className="h-[16px] w-[16px] shrink-0" />
          <span
            className="min-w-0 flex-1 truncate text-[13px] font-normal leading-[normal] tracking-[-0.13px]"
            style={{ color: tokens.black }}
          >
            Создать отчет
          </span>
        </button>
      </div>

      {/* Предустановленные отчеты */}
      {availablePresets.length > 0 && (
        <div className="flex w-full shrink-0 flex-col items-center p-[4px]">
          {availablePresets.map((report) => (
            <ReportRow key={report.id} report={report} onSelect={() => onSelect(report)} />
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Табы: текущий отчет (дропдаун) + Транскрипт / Чат / Задачи
// ─────────────────────────────────────────────────────────────────────────────

function ReportTabs({
  current,
  open,
  onToggle,
  applied,
  currentId,
  onSelect,
  onReload,
  onClose,
}: {
  current: Report;
  open: boolean;
  onToggle: () => void;
  applied: Report[];
  currentId: string;
  onSelect: (report: Report) => void;
  onReload: () => void;
  onClose: () => void;
}) {
  return (
    <div className="relative w-full">
      <div className="flex w-full items-center border-b" style={{ borderColor: tokens.border }}>
        <button
          type="button"
          aria-expanded={open}
          onClick={onToggle}
          className={`-mb-px flex items-center justify-center gap-[6px] border-b-2 border-solid px-[8px] pb-[12px] pt-[8px] ${pressableClass}`}
          style={{ borderColor: tokens.black }}
        >
          <ReportIcon report={current} />
          <span className="whitespace-nowrap text-[13px] font-medium leading-[normal] tracking-[-0.13px]" style={{ color: tokens.black }}>
            {current.label}
          </span>
          <span
            className={`flex h-[16px] w-[16px] items-center justify-center transition-transform duration-[180ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none ${open ? "rotate-180" : "rotate-0"}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={rsAsset("tab-chevron.svg")} alt="" className="h-[16px] w-[16px] shrink-0" />
          </span>
        </button>
        <button type="button" className={`flex items-center justify-center gap-[6px] px-[8px] pb-[12px] pt-[8px] hover:opacity-70 ${pressableClass}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={rsAsset("tab-transcript.svg")} alt="" className="h-[16px] w-[16px] shrink-0" />
          <span className="whitespace-nowrap text-[13px] font-normal leading-[normal] tracking-[-0.13px]" style={{ color: tokens.grey }}>
            Транскрипт
          </span>
        </button>
        <button type="button" className={`flex items-center justify-center gap-[6px] px-[8px] pb-[12px] pt-[8px] hover:opacity-70 ${pressableClass}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={rsAsset("tab-chat.svg")} alt="" className="h-[12.023px] w-[12.948px] shrink-0" />
          <span className="whitespace-nowrap text-[13px] font-normal leading-[normal] tracking-[-0.13px]" style={{ color: tokens.grey }}>
            Чат
          </span>
        </button>
        <button type="button" className={`flex items-center justify-center gap-[6px] px-[8px] pb-[12px] pt-[8px] hover:opacity-70 ${pressableClass}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={rsAsset("tab-tasks.svg")} alt="" className="h-[16px] w-[16px] shrink-0" />
          <span className="whitespace-nowrap text-[13px] font-normal leading-[normal] tracking-[-0.13px]" style={{ color: tokens.grey }}>
            Задачи
          </span>
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <ReportDropdown applied={applied} currentId={currentId} onSelect={onSelect} onReload={onReload} onClose={onClose} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Контент отчета: карточки статьи + заглушка генерации
// ─────────────────────────────────────────────────────────────────────────────

function ReportCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex w-full flex-col items-start gap-[12px] rounded-[4px] p-[16px]" style={{ backgroundColor: tokens.bgCard }}>
      <h2 className="w-full text-[16px] font-medium leading-[normal] tracking-[-0.32px]" style={{ color: tokens.black }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

// Моковый контент отчетов: у каждого отчета свои разделы по смыслу
// TODO: replace with real API
type SectionItem = { text: string; time?: string };

type ReportSection =
  | { kind: "paragraph"; title: string; text: string }
  | { kind: "bullets"; title: string; intro?: string; items: SectionItem[]; underlined?: boolean };

const articleSummary = "Обсудить подходы к работе с референсами для создания визуального образа цифрового продукта. Рассмотреть комбинаторный и антропоморфный подходы, их применение и глубину погружения в процесс. Определить этапы создания брифа, включая цели, компетенции продукта, позиционирование бренда и описание аудитории. Подготовить семиотическое поле для генерации ассоциаций и метафор, необходимых для написания нарратива. Завершить создание текстовой рамки, которая будет служить основой для будущего дизайн-продукта.";

const reportSections: Record<string, ReportSection[]> = {
  article: [
    { kind: "paragraph", title: "Супер краткое содержание:", text: articleSummary },
    {
      kind: "bullets",
      title: "Саммари по темам:",
      intro: "Подходы к работе с референсами",
      underlined: true,
      items: [
        { text: "Используйте комбинаторный подход для создания нового визуального образа, комбинируя элементы из различных референсов, таких как шрифты, цвета и лейауты. ", time: "0:09" },
        { text: "Применяйте антропоморфный подход, наделяя продукт человеческими характеристиками, чтобы создать более глубокий и образный визуальный стиль. ", time: "1:29" },
        { text: "Определите глубину погружения в каждый подход заранее: поверхностная комбинаторика дает быстрый результат, глубокий антропоморфизм — уникальность, но требует времени. ", time: "2:42" },
        { text: "Соберите семиотическое поле ассоциаций и метафор до начала работы над нарративом, иначе текст придется переписывать под найденные образы. ", time: "4:14" },
        { text: "Фиксируйте источник каждого референса — при передаче концепта команде это экономит часы обсуждений. ", time: "5:12" },
      ],
    },
    {
      kind: "bullets",
      title: "Саммари по темам:",
      intro: "Создание брифа",
      items: [
        { text: "Зафиксируйте цель проекта, текущие и будущие компетенции продукта и позиционирование бренда — это скелет, на который ложится все остальное. ", time: "6:03" },
        { text: "Опишите аудиторию с акцентом на социопсихологические характеристики: ценности, страхи, привычки потребления, а не только демографию. ", time: "7:41" },
        { text: "Разделите бриф на пять разделов и назначьте ответственного за каждый, чтобы документ не завис в общем доступе. ", time: "8:27" },
        { text: "Текстовая рамка завершает бриф и становится основой будущего дизайн-продукта: каждый концепт проверяется на соответствие ей. ", time: "9:18" },
        { text: "Возвращайтесь к брифу после каждой крупной итерации — расхождение между документом и реальностью копится незаметно. ", time: "11:36" },
      ],
    },
  ],
  "design-sync": [
    {
      kind: "paragraph",
      title: "Контекст синка:",
      text: "Двадцать шестой воркшоп дизайн-команды, посвященный визуальному образу продукта. На прошлой встрече договорились попробовать два подхода к референсам параллельно — сегодня сравнивали результаты и принимали решение, с чем идем дальше. Участвовали все четверо, модерировала Marisa.",
    },
    {
      kind: "bullets",
      title: "Решения по дизайну:",
      items: [
        { text: "Комбинаторный подход утвержден как основной для визуального образа продукта — он дал более предсказуемый результат на тестовых концептах. ", time: "0:42" },
        { text: "Антропоморфный подход оставляем как дополняющий: используем для персонажа-маскота и тональности иллюстраций. ", time: "2:07" },
        { text: "Референсы собираем на общей доске, каждый добавляет по 3–5 примеров до пятницы с короткой подписью, чем пример полезен. ", time: "3:18" },
        { text: "Текстовая рамка становится основой для первых визуальных концептов — без нее концепты в работу не берем. ", time: "7:05" },
        { text: "Шрифтовую пару выбираем после сборки семиотического поля, а не до, чтобы не подгонять смыслы под форму. ", time: "8:33" },
      ],
    },
    {
      kind: "bullets",
      title: "Открытые вопросы:",
      items: [
        { text: "Насколько глубоко прорабатываем антропоморфный подход на этом этапе — рискуем закопаться в детализацию маскота раньше времени. ", time: "4:56" },
        { text: "Кто отвечает за семиотическое поле и генерацию метафор для нарратива: нужен один владелец, а не коллективная ответственность. ", time: "9:12" },
        { text: "Успеваем ли показать первые концепты бренд-команде до конца спринта или переносим на следующий. ", time: "10:48" },
      ],
    },
    {
      kind: "bullets",
      title: "Следующие шаги:",
      items: [
        { text: "Собрать бриф с целями, компетенциями продукта, позиционированием и описанием аудитории. " },
        { text: "Подготовить драфт нарратива к следующему дизайн-синку. " },
        { text: "Разметить доску референсов тегами по подходам, чтобы примеры не смешивались. " },
        { text: "Запланировать получасовой разбор семиотического поля с бренд-командой. " },
      ],
    },
  ],
  antimat: [
    {
      kind: "paragraph",
      title: "Чистота речи:",
      text: "За встречу зафиксировано 14 выражений, требующих замены — это на 40% меньше, чем на прошлом воркшопе, динамика положительная. Самый эмоциональный участник — Speaker B, на него приходится 9 из 14 фрагментов. Пик экспрессии пришелся на обсуждение референсов в середине встречи, когда выяснилось, что половина примеров ведет на несуществующие страницы. В остальном транскрипт чистый, замены не искажают смысл реплик и помечены скобками.",
    },
    {
      kind: "bullets",
      title: "Замененные фрагменты:",
      items: [
        { text: "«Ну это же [гениально] придумано, коллеги, просто [восхитительно]». ", time: "1:12" },
        { text: "«Кто [этот удивительный человек], который удалил доску с референсами?» ", time: "3:29" },
        { text: "«Какой [дальновидный человек] предложил этот лейаут?» ", time: "5:47" },
        { text: "«[Прекрасно], шрифт опять не тот, что в макете». ", time: "8:15" },
        { text: "«Да [ничего себе], опять все переделывать». ", time: "11:03" },
        { text: "«Ладно, [шут] с ним, с нарративом, давайте про бриф». ", time: "12:20" },
      ],
    },
    {
      kind: "bullets",
      title: "Рекомендации:",
      items: [
        { text: "Транскрипт готов к шерингу внешним участникам и стейкхолдерам без дополнительной вычитки. " },
        { text: "Speaker B рекомендуем показывать этот отчет перед каждой встречей с клиентами. " },
      ],
    },
  ],
  regular: [
    {
      kind: "paragraph",
      title: "Краткое содержание:",
      text: "Команда дизайна провела воркшоп по работе с референсами для визуального образа продукта. Сравнили два подхода — комбинаторный и антропоморфный, разобрали их сильные стороны на живых примерах и договорились, в каких задачах применять каждый. Отдельным блоком прошлись по структуре брифа: от целей проекта и компетенций продукта до позиционирования бренда и описания аудитории. В конце распределили подготовку материалов к следующей встрече и зафиксировали сроки.",
    },
    {
      kind: "bullets",
      title: "Ключевые моменты:",
      items: [
        { text: "Сравнили комбинаторный и антропоморфный подходы на живых примерах из собранных референсов. ", time: "0:58" },
        { text: "Комбинаторика выигрывает по скорости, антропоморфизм — по глубине и запоминаемости образа. ", time: "2:31" },
        { text: "Прошлись по этапам создания брифа от целей до описания аудитории и назначили ответственных за разделы. ", time: "5:24" },
        { text: "Описание аудитории решили строить на социопсихологических характеристиках, а не на демографии. ", time: "6:49" },
        { text: "Обсудили, как семиотическое поле помогает генерировать метафоры для нарратива, и посмотрели пример из прошлого проекта. ", time: "8:37" },
        { text: "Зафиксировали, что текстовая рамка — обязательный вход для любого визуального концепта. ", time: "10:15" },
      ],
    },
    {
      kind: "bullets",
      title: "Договоренности:",
      items: [
        { text: "Каждый участник приносит по 3–5 референсов на общую доску до пятницы. " },
        { text: "Драфт текстовой рамки готовим к следующему воркшопу. " },
        { text: "Бриф заполняем по разделам: у каждого раздела один владелец. " },
        { text: "Следующая встреча — через неделю, в том же составе. " },
      ],
    },
  ],
  client: [
    {
      kind: "paragraph",
      title: "О клиенте:",
      text: "Продуктовая команда цифрового сервиса, запускает редизайн визуального образа в этом квартале. В команде шесть дизайнеров и два арт-директора, процессы выстроены вокруг спринтов. Решение о подрядчике принимает арт-директор совместно с продакт-менеджером, бюджет на квартал утвержден. Раньше с внешними командами по дизайну не работали — весь визуал делали внутри.",
    },
    {
      kind: "bullets",
      title: "Потребности и боли:",
      items: [
        { text: "Текущий визуальный стиль не отражает позиционирование бренда и выглядит устаревшим на фоне конкурентов. ", time: "1:44" },
        { text: "Нет единой системы работы с референсами — каждый дизайнер собирает их по-своему, примеры теряются между инструментами. ", time: "4:02" },
        { text: "Брифы приходят без описания аудитории, дизайнерам приходится додумывать контекст самим. ", time: "6:51" },
        { text: "Концепты защищаются «на вкус» — нет текстовой рамки, на которую можно опереться в споре. ", time: "7:58" },
        { text: "Онбординг новых дизайнеров занимает месяцы, потому что знания о стиле нигде не зафиксированы. ", time: "8:44" },
      ],
    },
    {
      kind: "bullets",
      title: "Возражения:",
      items: [
        { text: "Опасаются, что глубокая проработка нарратива затянет сроки запуска редизайна. ", time: "9:26" },
        { text: "Смущает необходимость вовлекать бренд-команду — у той свой бэклог и другие приоритеты. ", time: "10:37" },
        { text: "Не уверены, что семиотическое поле приживется в команде после окончания проекта. ", time: "11:29" },
      ],
    },
    {
      kind: "bullets",
      title: "Следующие шаги:",
      items: [
        { text: "Отправить структуру брифа и примеры семиотического поля до конца недели. " },
        { text: "Назначить встречу с арт-директором по итогам воркшопа. " },
        { text: "Подготовить оценку сроков с разбивкой по этапам, чтобы снять возражение про запуск. " },
        { text: "Прислать кейс похожего редизайна с цифрами до и после. " },
      ],
    },
  ],
  sales: [
    {
      kind: "paragraph",
      title: "Оценка звонка:",
      text: "Общая оценка — 7 из 10. Менеджер уверенно вел дискавери, задавал открытые вопросы и хорошо раскрыл боли клиента вокруг процессов работы с референсами и брифами. Структура звонка выдержана: знакомство, контекст, боли, демонстрация ценности. Главный недобор — закрепление следующего шага: договоренность о встрече прозвучала размыто, без конкретной даты и ответственного, а вопрос бюджета всплыл слишком поздно и остался без развития.",
    },
    {
      kind: "bullets",
      title: "Сильные стороны:",
      items: [
        { text: "Открытые вопросы про процесс работы с референсами раскрыли реальную боль клиента, а не декларируемую. ", time: "2:15" },
        { text: "Активное слушание: менеджер трижды переформулировал слова клиента и уточнил приоритеты болей. ", time: "5:12" },
        { text: "Хорошая работа с возражением про сроки — пример из похожего кейса с конкретными цифрами. ", time: "9:40" },
        { text: "Уверенная подача ценности: не функции, а результат для команды клиента. ", time: "10:22" },
      ],
    },
    {
      kind: "bullets",
      title: "Зоны роста:",
      items: [
        { text: "Стоило раньше спросить про бюджет и процесс принятия решения — тема всплыла на восьмой минуте случайно. ", time: "7:08" },
        { text: "Возражение про вовлечение бренд-команды осталось неотработанным, клиент сам сменил тему. ", time: "10:37" },
        { text: "Не зафиксирован конкретный следующий шаг с датой и ответственным. ", time: "11:52" },
        { text: "В конце не хватило короткого резюме договоренностей — клиент мог унести другое понимание итогов. ", time: "12:31" },
      ],
    },
    {
      kind: "bullets",
      title: "Рекомендации:",
      items: [
        { text: "Внести вопросы про бюджет и ЛПР в первую треть скрипта дискавери. " },
        { text: "Завершать звонок проговариванием следующего шага: что, кто, когда. " },
        { text: "Разобрать запись отработки возражений на ближайшей коуч-сессии. " },
      ],
    },
  ],
  hr: [
    {
      kind: "paragraph",
      title: "О кандидате:",
      text: "Продуктовый дизайнер с опытом 5 лет, последние два года — в команде цифрового сервиса с миллионной аудиторией. Ведет проекты от брифа до передачи в разработку, уверенно рассказывает о процессе и решениях, отвечает по существу и честно признает, где были ошибки. На интервью держался спокойно, вопросы к команде и продукту подготовил заранее — спрашивал про дизайн-культуру, процессы ревью и горизонт планирования.",
    },
    {
      kind: "bullets",
      title: "Опыт и навыки:",
      items: [
        { text: "Строил систему работы с референсами и вижуал-ресерчем в прошлой команде — сократил время на старт концепта с недели до двух дней. ", time: "3:12" },
        { text: "Умеет собирать бриф: цели, компетенции продукта, позиционирование, аудитория — привел рабочий пример структуры. ", time: "6:45" },
        { text: "Работал с семиотическим полем и нарративами на двух проектах, понимает ценность подхода и его ограничения. ", time: "8:03" },
        { text: "Есть опыт фасилитации дизайн-воркшопов на 8–10 человек, включая смешанные группы с продактами. ", time: "10:20" },
        { text: "Из инструментов: Figma на уровне компонентных систем, прототипирование, базовая аналитика. ", time: "11:14" },
      ],
    },
    {
      kind: "paragraph",
      title: "Мотивация:",
      text: "Ищет команду с сильной дизайн-культурой и возможностью влиять на продукт на уровне стратегии, а не только исполнения. Текущее место устраивает по деньгам, но задачи стали повторяться, роста внутри не видит. Зарплатные ожидания в рамках вилки, готов выйти через месяц после оффера.",
    },
    {
      kind: "paragraph",
      title: "Рекомендация:",
      text: "Рекомендуем позвать на следующий этап — портфолио-ревью с командой. Сильный процессный бэкграунд, совпадение по ценностям и адекватные ожидания. Стоит отдельно проверить опыт работы с метриками и исследованиями: в рассказе опирался в основном на качественные сигналы, цифры приводил редко.",
    },
  ],
  research: [
    {
      kind: "paragraph",
      title: "Контекст исследования:",
      text: "Групповое интервью с дизайн-командой в рамках дискавери про процессы работы с референсами и брифами. Четыре респондента с опытом от двух до восьми лет, модерируемая дискуссия на 13 минут. Цель — проверить гипотезы о том, где команда теряет больше всего времени на старте визуальных проектов.",
    },
    {
      kind: "bullets",
      title: "Гипотезы:",
      items: [
        { text: "Дизайнеры тратят больше времени на поиск референсов, чем на их анализ — подтвердилась. " },
        { text: "Единая структура брифа снижает количество итераций на старте проекта — подтвердилась частично, нужна количественная проверка. " },
        { text: "Команды готовы вести общую доску референсов, если она встроена в текущий инструмент — не подтвердилась: готовы и на отдельный инструмент, барьер не в этом. " },
        { text: "Нарратив пишет один человек, остальные не вовлекаются — опровергнута: хотят участвовать, но не понимают формат. " },
      ],
    },
    {
      kind: "bullets",
      title: "Инсайты:",
      items: [
        { text: "Участники смешивают комбинаторный и антропоморфный подходы, не разделяя их осознанно — терминология появилась только на этом воркшопе. ", time: "2:33" },
        { text: "Референсы теряются между четырьмя-пятью инструментами: доски, папки, мессенджеры, закладки. ", time: "3:41" },
        { text: "Описание аудитории — самый пропускаемый раздел брифа, хотя все четверо назвали его важным. ", time: "6:17" },
        { text: "Защита концептов проходит «на вкус»: аргументация через текстовую рамку знакома только одному участнику. ", time: "8:22" },
        { text: "Семиотическое поле воспринимается как «продвинутая» практика, но никто не применяет его системно — нет шаблона и примера. ", time: "9:54" },
      ],
    },
    {
      kind: "bullets",
      title: "Цитаты:",
      underlined: true,
      items: [
        { text: "«Я собираю референсы в пять разных мест, а потом не могу найти нужный». ", time: "3:08" },
        { text: "«Бриф обычно — это два абзаца в таске, дальше додумывай сам». ", time: "5:36" },
        { text: "«Аудиторию описываем, когда клиент попросит. Сами — никогда». ", time: "6:52" },
        { text: "«Без текстовой рамки каждый концепт приходится объяснять заново». ", time: "10:41" },
      ],
    },
  ],
  teamsync: [
    {
      kind: "paragraph",
      title: "Общий статус:",
      text: "Спринт идет по плану, из четырех направлений три в графике. Основной риск недели — позиционирование: без ответа бренд-команды встает раздел брифа, а за ним и нарратив. Настроение в команде рабочее, перегрузов не отмечено.",
    },
    {
      kind: "bullets",
      title: "Статусы по направлениям:",
      items: [
        { text: "Вижуал-ресерч: доска с референсами собрана на 60%, дедлайн — пятница, идем в графике. " },
        { text: "Бриф: структура утверждена, заполнены разделы целей и компетенций продукта, осталось позиционирование и аудитория. " },
        { text: "Семиотическое поле: собран первый пул ассоциаций, нужна валидация с бренд-командой. " },
        { text: "Нарратив: ждет семиотическое поле, старт на следующей неделе, ответственный назначен. " },
        { text: "Концепты: не начаты по плану — стартуют после утверждения текстовой рамки. " },
      ],
    },
    {
      kind: "bullets",
      title: "Блокеры:",
      items: [
        { text: "Нет ответа от бренд-команды по позиционированию — блокирует раздел брифа и каскадом задерживает нарратив. ", time: "4:29" },
        { text: "Доступ к аналитике аудитории до сих пор не выдан двоим участникам. ", time: "6:15" },
        { text: "Общая доска референсов упирается в лимит бесплатного тарифа. ", time: "7:33" },
      ],
    },
    {
      kind: "bullets",
      title: "Решения:",
      items: [
        { text: "Эскалируем вопрос позиционирования на лида бренд-команды сегодня, дедлайн ответа — среда. ", time: "5:02" },
        { text: "Заявку на доступы к аналитике заводит Jordan до конца дня. ", time: "6:40" },
        { text: "Апгрейд тарифа доски согласуем с операционным менеджером на этой неделе. ", time: "8:01" },
        { text: "Следующий синк переносим на час раньше, чтобы успевала вся команда. ", time: "12:10" },
      ],
    },
  ],
  "one-on-one": [
    {
      kind: "paragraph",
      title: "Настроение и вовлеченность:",
      text: "Разговор прошел в спокойном, открытом тоне. Сотрудник вовлечен в проект редизайна и явно им горит — сам предложил взять на себя часть подготовки следующего воркшопа. При этом отмечает усталость от количества параллельных задач: переключение между тремя проектами съедает время на глубокую работу с референсами, из-за чего появляется ощущение, что все делается наполовину. Признаков выгорания нет, но сигнал стоит держать в поле зрения.",
    },
    {
      kind: "bullets",
      title: "Темы разговора:",
      items: [
        { text: "Загрузка: три параллельных проекта, хочется сфокусироваться на одном и довести его до результата. ", time: "1:37" },
        { text: "Процессы: ревью концептов затягивается, потому что нет единых критериев — предложил опираться на текстовую рамку. ", time: "3:58" },
        { text: "Рост: интересно попробовать фасилитацию воркшопов и ведение брифов, спрашивал про горизонт до сеньорской позиции. ", time: "5:55" },
        { text: "Команда: отношения ровные, отметил, что стало проще после введения общей доски референсов. ", time: "8:12" },
        { text: "Обратная связь по последнему концепту — договорились о разборе с арт-директором. ", time: "9:44" },
      ],
    },
    {
      kind: "bullets",
      title: "Договоренности:",
      items: [
        { text: "Снять один из проектов до конца спринта, приоритет — редизайн. " },
        { text: "Следующий воркшоп по референсам проводит сотрудник, лид подстраховывает. " },
        { text: "Составить план развития до сеньорской позиции к следующему one-on-one. " },
        { text: "Разбор концепта с арт-директором — на этой неделе. " },
      ],
    },
  ],
  notes: [
    {
      kind: "bullets",
      title: "Основные тезисы:",
      items: [
        { text: "Визуальный образ продукта собирается из референсов двумя путями — комбинаторикой и антропоморфизмом; они не исключают друг друга. ", time: "0:51" },
        { text: "Комбинаторика: берем лучшие элементы разных референсов — шрифты, цвета, лейауты — и собираем новое целое. ", time: "1:48" },
        { text: "Антропоморфизм: представляем продукт человеком и описываем его характер, голос, манеры — из этого рождается стиль. ", time: "2:56" },
        { text: "Бриф отвечает на вопросы: зачем продукт существует, что умеет сейчас и что должен уметь в будущем. ", time: "5:33" },
        { text: "Аудиторию описываем через ценности и поведение, демография вторична. ", time: "7:02" },
        { text: "Нарратив пишется после сборки семиотического поля, а не до — иначе метафоры придется натягивать на готовый текст. ", time: "8:49" },
        { text: "Текстовая рамка — фильтр для всех будущих концептов: не проходит рамку — не идет в работу. ", time: "10:57" },
      ],
    },
    {
      kind: "bullets",
      title: "Термины и определения:",
      items: [
        { text: "Комбинаторный подход — сборка нового образа из элементов разных референсов: шрифтов, цветов, лейаутов. " },
        { text: "Антропоморфный подход — наделение продукта человеческими характеристиками для более образного стиля. " },
        { text: "Семиотическое поле — набор ассоциаций и метафор вокруг продукта, из которого рождается нарратив. " },
        { text: "Нарратив — связный рассказ о продукте, задающий логику визуальных решений. " },
        { text: "Текстовая рамка — короткий документ с границами образа: что продукт есть и чем он точно не является. " },
      ],
    },
    {
      kind: "bullets",
      title: "Открытые вопросы:",
      items: [
        { text: "Как измерять, что новый визуальный образ работает лучше старого. " },
        { text: "Кто поддерживает семиотическое поле актуальным после запуска. " },
        { text: "Нужен ли отдельный воркшоп по нарративу или хватит асинхронного драфта. " },
      ],
    },
  ],
  protocol: [
    {
      kind: "paragraph",
      title: "Общие сведения:",
      text: "Дизайн-воркшоп №26, 15.11.2022, 13:40, длительность 12 минут 56 секунд. Присутствовали: Marisa McGill (модератор), Jordan Lee, Ashley Chen, Samira Patel. Кворум есть, все решения приняты единогласно. Запись и транскрипт приложены к протоколу.",
    },
    {
      kind: "bullets",
      title: "Повестка:",
      items: [
        { text: "Подходы к работе с референсами для визуального образа продукта. " },
        { text: "Структура брифа и зоны ответственности по разделам. " },
        { text: "Семиотическое поле и план подготовки нарратива. " },
        { text: "Сроки и формат следующей встречи. " },
      ],
    },
    {
      kind: "bullets",
      title: "Решения:",
      items: [
        { text: "Принять комбинаторный подход как основной, антропоморфный — как дополняющий для маскота и иллюстраций. ", time: "3:26" },
        { text: "Вести единую доску референсов; личные подборки считаются черновиками. ", time: "4:44" },
        { text: "Утвердить структуру брифа из пяти разделов, включая описание аудитории. ", time: "7:14" },
        { text: "Стартовать нарратив только после валидации семиотического поля с бренд-командой. ", time: "9:31" },
      ],
    },
    {
      kind: "bullets",
      title: "Поручения:",
      items: [
        { text: "Marisa — собрать доску референсов и разметить примеры тегами до пятницы. " },
        { text: "Jordan — драфт семиотического поля к следующей встрече. " },
        { text: "Ashley — заполнить разделы брифа по позиционированию и аудитории. " },
        { text: "Samira — согласовать слот валидации с бренд-командой на этой неделе. " },
        { text: "Всем — принести по 3–5 референсов с подписями до пятницы. " },
      ],
    },
  ],
  medicine: [
    {
      kind: "paragraph",
      title: "Жалобы и анамнез:",
      text: "Команда обратилась с жалобами на хроническую разрозненность референсов и периодические приступы правок «на вкус». Симптомы наблюдаются последние три спринта, обостряются перед релизами и при контакте с новыми стейкхолдерами. Ранее самолечение общими досками эффекта не дало: доски заводились, но забрасывались в течение недели. Наследственность отягощена — предыдущая команда работала без брифов вовсе.",
    },
    {
      kind: "bullets",
      title: "Наблюдения:",
      items: [
        { text: "Выраженный дефицит структурированного брифа, осложненный отсутствием описания аудитории. ", time: "2:08" },
        { text: "Референсы рассеяны по пяти инструментам — классическая картина референсной фрагментации. ", time: "3:44" },
        { text: "Здоровая реакция на комбинаторный подход, отторжения не выявлено. ", time: "6:39" },
        { text: "Семиотическое поле в зачаточном состоянии, но ткани жизнеспособны — прогноз благоприятный. ", time: "9:57" },
      ],
    },
    {
      kind: "bullets",
      title: "Рекомендации:",
      items: [
        { text: "Курс: единая доска референсов, применять ежедневно до полного выздоровления процессов. " },
        { text: "Профилактика: текстовая рамка перед каждым новым концептом, без пропусков. " },
        { text: "Диета: не более трех параллельных проектов на дизайнера. " },
        { text: "Контрольный осмотр — через два спринта на ретроспективе. " },
      ],
    },
  ],
};

function BulletList({ section }: { section: Extract<ReportSection, { kind: "bullets" }> }) {
  return (
    <div className="w-full text-[13px] font-normal tracking-[-0.13px]" style={{ color: tokens.black }}>
      {section.intro && <p className="mb-0 text-[13px] font-medium leading-[16px]">{section.intro}</p>}
      <ul className="list-disc pl-[20px] leading-[16px]">
        {section.items.map((item, index) => (
          <li key={index} className={index < section.items.length - 1 ? "mb-[8px]" : ""}>
            {item.text}
            {item.time && (
              <span
                className={section.underlined ? "underline decoration-solid [text-decoration-skip-ink:none]" : ""}
                style={{ color: tokens.blue }}
              >
                {item.time}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ReportContent({ report }: { report: Report }) {
  const sections = reportSections[report.id] ?? reportSections.article;

  return (
    <div className="flex w-full flex-col items-center gap-[16px]">
      {sections.map((section, index) => (
        <ReportCard key={index} title={section.title}>
          {section.kind === "paragraph" ? (
            <p className="w-full text-[13px] font-normal leading-[16px] tracking-[-0.13px]" style={{ color: tokens.black }}>
              {section.text}
            </p>
          ) : (
            <BulletList section={section} />
          )}
        </ReportCard>
      ))}
    </div>
  );
}

// Заглушка на время применения отчета (иконка текущего отчета в 48px)
function GeneratingPlaceholder({ report }: { report: Report }) {
  return (
    <div className="flex h-[400px] w-full flex-col items-center justify-center rounded-[4px] p-[16px]" style={{ backgroundColor: tokens.bgCard }}>
      <div className="flex w-full flex-col items-center gap-[12px]">
        <div className="report-breathe">
          <ReportIcon report={report} size={48} />
        </div>
        <div className="flex w-full flex-col items-center gap-[8px]">
          <span className="whitespace-nowrap text-[13px] font-medium leading-[normal] tracking-[-0.13px]" style={{ color: tokens.grey }}>
            Применяем отчет...
          </span>
          <span className="whitespace-nowrap text-[13px] font-medium leading-[normal] tracking-[-0.13px]" style={{ color: tokens.grey }}>
            Обычно это занимает около 20 секунд
          </span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Player bar
// ─────────────────────────────────────────────────────────────────────────────

function PlayerBar({ toastVisible, toastMessage }: { toastVisible: boolean; toastMessage: string }) {
  const segments = [
    { played: true },
    { played: true },
    { played: false },
    { played: false },
    { played: false },
    { played: false },
  ];

  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 flex h-[54px] items-center justify-between bg-[rgba(255,255,255,0.8)] py-[8px] pl-[10px] pr-[12px] backdrop-blur-[4px]">
      <CopiedToast visible={toastVisible} message={toastMessage} />
      <div className="absolute left-0 right-0 top-[-3px] flex items-center gap-[2px]">
        {segments.map((segment, index) => (
          <div key={index} className="flex h-[8px] min-w-px flex-1 flex-col items-center justify-center overflow-clip">
            <div className="h-[3px] w-full" style={{ backgroundColor: segment.played ? "#BABBBD" : "#DDDEDF" }} />
          </div>
        ))}
        <div className="absolute left-[384px] top-[-1px] h-[10px] w-[10px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset("progress-dot.svg")} alt="" className="block h-full w-full max-w-none scale-[1.4]" />
        </div>
      </div>

      <div className="flex w-[141px] items-center gap-[8px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset("player-thumb.png")} alt="" className="h-[35px] w-[56px] shrink-0 rounded-[4px] object-cover" />
        <div className="flex w-[77px] flex-col items-start justify-center gap-[2px]">
          <span
            className="whitespace-nowrap text-[12px] font-normal leading-[normal] tracking-[-0.24px]"
            style={{ color: tokens.black, fontFeatureSettings: '"lnum" 1, "tnum" 1' }}
          >
            2. Greetings and start of the meeting
          </span>
          <span
            className="flex items-center gap-[2px] text-[12px] font-normal leading-[normal] tracking-[-0.24px]"
            style={{ color: tokens.grey, fontFeatureSettings: '"lnum" 1, "tnum" 1' }}
          >
            <span>2:24</span>
            <span>/</span>
            <span>12:56</span>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-[8px]">
        <button type="button" aria-label="Назад 10 секунд" className={`flex cursor-pointer items-center p-[4px] hover:opacity-70 ${pressableClass}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset("player-back.svg")} alt="" className="h-[16px] w-[16px] shrink-0" />
        </button>
        <button type="button" aria-label="Играть" className={`h-[32px] w-[32px] cursor-pointer hover:opacity-80 ${pressableClass}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset("player-play.svg")} alt="" className="h-[32px] w-[32px] shrink-0" />
        </button>
        <button type="button" aria-label="Вперед 10 секунд" className={`flex cursor-pointer items-center p-[4px] hover:opacity-70 ${pressableClass}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset("player-forward.svg")} alt="" className="h-[16px] w-[16px] shrink-0" />
        </button>
      </div>

      <div className="h-[24px] w-[141px]" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function ReportSwitcherPage() {
  const reduceMotion = useReducedMotion();
  const [linkCopied, setLinkCopied] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Отчеты: примененные, текущий, генерация, дропдаун
  const [appliedIds, setAppliedIds] = useState<string[]>([articleReport.id]);
  const [currentId, setCurrentId] = useState(articleReport.id);
  const [generating, setGenerating] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const generateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tabsAreaRef = useRef<HTMLDivElement>(null);

  const applied = appliedIds.flatMap((id) => {
    const report = allReports.find((item) => item.id === id);
    return report ? [report] : [];
  });
  const current = allReports.find((report) => report.id === currentId) ?? articleReport;

  const startGenerating = () => {
    setGenerating(true);
    if (generateTimer.current) clearTimeout(generateTimer.current);
    generateTimer.current = setTimeout(() => {
      setGenerating(false);
      generateTimer.current = null;
    }, 3000);
  };

  const handleSelectReport = (report: Report) => {
    setDropdownOpen(false);
    if (appliedIds.includes(report.id)) {
      // Уже примененный отчет переключается мгновенно
      setCurrentId(report.id);
      return;
    }
    // Новый отчет перемещается в секцию примененных и генерируется
    setAppliedIds((prev) => [report.id, ...prev]);
    setCurrentId(report.id);
    startGenerating();
  };

  const handleReloadReport = () => {
    setDropdownOpen(false);
    startGenerating();
  };

  useEffect(() => {
    if (!dropdownOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (tabsAreaRef.current?.contains(target)) return;
      setDropdownOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDropdownOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [dropdownOpen]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setToastVisible(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => {
      setToastVisible(false);
      toastTimer.current = null;
    }, 2000);
  };

  const handleCopyLink = () => {
    setLinkCopied(true);
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => {
      setLinkCopied(false);
      copyTimer.current = null;
    }, 2000);
    showToast("Ссылка скопирована!");
  };

  const handleAiCopy = () => {
    showToast("Скопировано для AI!");
  };

  useEffect(() => {
    return () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
      if (toastTimer.current) clearTimeout(toastTimer.current);
      if (generateTimer.current) clearTimeout(generateTimer.current);
    };
  }, []);

  const fadeProps = {
    initial: reduceMotion ? { opacity: 1 } : { opacity: 0 },
    animate: { opacity: 1 },
    transition: reduceMotion ? { duration: 0 } : { duration: 0.18, ease: [0.23, 1, 0.32, 1] as const },
  };

  return (
    <main className={`${inter.className} h-screen min-h-[720px] w-full overflow-hidden bg-white`} style={{ color: tokens.black }}>
      <div className="flex h-full w-full bg-white">
        <Sidebar />
        <section className="relative flex h-full min-w-0 flex-1 flex-col bg-white">
          <MeetingHeader linkCopied={linkCopied} onCopyLink={handleCopyLink} onAiCopy={handleAiCopy} />
          <div className="flex min-h-0 w-full flex-1 flex-col items-center overflow-y-auto">
            <div className="flex w-[670px] shrink-0 flex-col gap-[16px] pb-[80px] pt-[32px]">
              <div className="flex w-full flex-col gap-[24px]">
                <MeetingInfo />
                <div ref={tabsAreaRef} className="w-full">
                  <ReportTabs
                    current={current}
                    open={dropdownOpen}
                    onToggle={() => setDropdownOpen((value) => !value)}
                    applied={applied}
                    currentId={currentId}
                    onSelect={handleSelectReport}
                    onReload={handleReloadReport}
                    onClose={() => setDropdownOpen(false)}
                  />
                </div>
              </div>
              <motion.div key={generating ? "generating" : `content-${current.id}`} {...fadeProps} className="w-full">
                {generating ? <GeneratingPlaceholder report={current} /> : <ReportContent report={current} />}
              </motion.div>
            </div>
          </div>
          <PlayerBar toastVisible={toastVisible} toastMessage={toastMessage} />
        </section>
      </div>
    </main>
  );
}
