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
  { icon: "menu-claude.svg", label: "Открыть в Claude", external: true },
  { icon: "menu-chatgpt.svg", label: "Открыть в ChatGPT", external: true },
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
      className="absolute right-0 top-[38px] z-50 flex w-[200px] origin-top-right flex-col items-start overflow-clip rounded-[4px] bg-white shadow-[0_0_4px_0_rgba(0,0,0,0.15)] will-change-[opacity,transform]"
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
  // Дефолтное действие — ChatGPT (aiMenuTop[1])
  const [aiAction, setAiAction] = useState<AiMenuItem>(aiMenuTop[1]);
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
// Tabs
// ─────────────────────────────────────────────────────────────────────────────

function ContentTabs() {
  return (
    <div className="flex w-full items-center border-b" style={{ borderColor: tokens.border }}>
      <button type="button" aria-label="Комментарии" className={`flex items-center justify-center px-[8px] pb-[12px] pt-[8px] hover:opacity-70 ${pressableClass}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset("tab-chat.svg")} alt="" className="h-[16px] w-[16px] shrink-0" />
      </button>
      <button
        type="button"
        className="-mb-px flex items-center justify-center gap-[8px] border-b-2 border-solid px-[8px] pb-[12px] pt-[8px]"
        style={{ borderColor: tokens.black }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset("tab-transcript.svg")} alt="" className="h-[16px] w-[16px] shrink-0" />
        <span className="text-[13px] font-medium leading-[normal] tracking-[-0.13px]" style={{ color: tokens.black }}>
          Транскрипт
        </span>
      </button>
      <button type="button" aria-label="Участники" className={`flex items-center justify-center px-[8px] pb-[12px] pt-[8px] hover:opacity-70 ${pressableClass}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset("tab-participants.svg")} alt="" className="h-[16px] w-[16px] shrink-0" />
      </button>
      <button type="button" aria-label="Добавить вкладку" className={`flex items-center justify-center px-[4px] pb-[12px] pt-[8px] hover:opacity-70 ${pressableClass}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset("tab-plus.svg")} alt="" className="h-[16px] w-[16px] shrink-0" />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Transcript: chapters + replicas
// ─────────────────────────────────────────────────────────────────────────────

const LINE =
  "Hello Ruth! I hope everything is going wonderfully for you! How have you been lately? Hello Ruth! I hope ";

type Replica = { speaker: string; color: string; time: string; lines: number };

const chapter1Replicas: Replica[] = [
  { speaker: "Speaker B", color: speakerColors.orange, time: "0:02", lines: 2 },
  { speaker: "Speaker A", color: speakerColors.green, time: "0:08", lines: 1 },
];

const replicas: Replica[] = [
  { speaker: "Speaker A", color: speakerColors.green, time: "0:12", lines: 1 },
  { speaker: "Speaker A", color: speakerColors.purple, time: "0:12", lines: 3 },
  { speaker: "Speaker B", color: speakerColors.orange, time: "0:12", lines: 2 },
  { speaker: "Speaker A", color: speakerColors.green, time: "00:12", lines: 1 },
  { speaker: "Speaker A", color: speakerColors.green, time: "00:12", lines: 1 },
  { speaker: "Speaker B", color: speakerColors.orange, time: "0:12", lines: 2 },
  { speaker: "Speaker A", color: speakerColors.purple, time: "0:12", lines: 3 },
  { speaker: "Speaker A", color: speakerColors.blue, time: "00:12", lines: 1 },
  { speaker: "Speaker B", color: speakerColors.orange, time: "0:12", lines: 2 },
];

function replicaText(lines: number) {
  if (lines === 2) {
    return "Hello Ruth! I hope everything is going wonderfully for you! How have you been lately? Hello Ruth! I hope everything is going wonderfully for you! How have you been lately?";
  }
  return LINE.repeat(lines).trimEnd();
}

function hexToRgba(hex: string, alpha: number) {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function ReplicaBlock({ replica }: { replica: Replica }) {
  return (
    <div className="flex w-full items-start bg-white p-[8px]">
      <div className="flex min-w-0 flex-1 flex-col items-start gap-[8px]">
        <div className="flex items-center gap-[8px]">
          <span className="text-[13px] font-medium leading-[normal] tracking-[-0.13px]" style={{ color: replica.color }}>
            {replica.speaker}
          </span>
          <span
            className="pt-px text-[12px] font-normal leading-[normal] tracking-[-0.24px]"
            style={{ color: hexToRgba(replica.color, 0.64) }}
          >
            {replica.time}
          </span>
        </div>
        <p
          className={`w-[654px] text-[13px] font-normal leading-[16px] tracking-[-0.13px] ${replica.lines === 1 ? "truncate" : ""}`}
          style={{ color: tokens.black }}
        >
          {replicaText(replica.lines)}
        </p>
      </div>
    </div>
  );
}

function ChapterAccordion({
  title,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="flex w-full flex-col gap-[8px]">
      <button
        type="button"
        aria-expanded={expanded}
        onClick={onToggle}
        className={`flex w-full items-center justify-between rounded-[4px] border border-solid px-[12px] py-[10px] text-left hover:bg-[#F7F7F8] ${pressableClass}`}
        style={{ borderColor: tokens.border }}
      >
        <span className="text-[13px] font-medium leading-[normal] tracking-[-0.13px]" style={{ color: tokens.black }}>
          {title}
        </span>
        <span
          className={`flex h-[16px] w-[16px] items-center justify-center transition-transform duration-[180ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none ${expanded ? "rotate-180" : "rotate-0"}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset("accordion-chevron.svg")} alt="" className="h-[16px] w-[16px] shrink-0" />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {expanded && children && (
          <motion.div
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, height: "auto" }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="flex w-full flex-col gap-[8px] overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
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

export default function AiExportSharingPage() {
  const [chapter1Open, setChapter1Open] = useState(false);
  const [chapter2Open, setChapter2Open] = useState(true);
  const [linkCopied, setLinkCopied] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    showToast("Скопировано для ИИ!");
  };

  useEffect(() => {
    return () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

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
                <ContentTabs />
              </div>
              <div className="flex w-full flex-col gap-[8px]">
                <ChapterAccordion
                  title="1. Обсуждение ягодного лукошка и ожидание участников"
                  expanded={chapter1Open}
                  onToggle={() => setChapter1Open((value) => !value)}
                >
                  {chapter1Replicas.map((replica, index) => (
                    <ReplicaBlock key={index} replica={replica} />
                  ))}
                </ChapterAccordion>
                <ChapterAccordion
                  title="2. Greetings and start of the meeting"
                  expanded={chapter2Open}
                  onToggle={() => setChapter2Open((value) => !value)}
                >
                  {replicas.map((replica, index) => (
                    <ReplicaBlock key={index} replica={replica} />
                  ))}
                </ChapterAccordion>
              </div>
            </div>
          </div>
          <PlayerBar toastVisible={toastVisible} toastMessage={toastMessage} />
        </section>
      </div>
    </main>
  );
}
