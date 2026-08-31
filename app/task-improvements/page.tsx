"use client";

import { Inter } from "next/font/google";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  Reorder,
  useDragControls,
  useReducedMotion,
  type DragControls,
  type Transition,
} from "framer-motion";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
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
const tiAsset = (name: string) => `${BASE}/task-improvements/${name}`;

// Иконки heroicons 20/solid в нужном размере через CSS-маску:
// цвет = background (bg-current следует за цветом текста)
const tiMask = (file: string) =>
  ({
    WebkitMaskImage: `url(${tiAsset(file)})`,
    maskImage: `url(${tiAsset(file)})`,
    WebkitMaskPosition: "center",
    maskPosition: "center",
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskSize: "contain",
    maskSize: "contain",
  }) as const;

// Свой focus-visible ринг вместо браузерного синего outline
const focusRingClass = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E4ECFA]";

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

// Тост-подтверждение — absolute у нижней кромки контентной секции, по центру.
// CSS-transitions вместо framer.
function CopiedToast({ visible, message }: { visible: boolean; message: string }) {
  return (
    <div
      className="absolute bottom-[24px] left-1/2 z-50 flex h-[36px] items-center justify-center gap-[8px] rounded-[4px] px-[12px] py-[10px] transition-[opacity,transform] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
      style={{
        backgroundColor: tokens.black,
        // Убираем свое быстрее, чем показываем
        transitionDuration: visible ? "200ms" : "150ms",
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

// Тост с действием: «Задача удалена | Отменить» — та же плашка, что CopiedToast,
// плюс разделитель и кнопка отмены
function UndoToast({ visible, message, onUndo }: { visible: boolean; message: string; onUndo: () => void }) {
  return (
    <div
      className="absolute bottom-[24px] left-1/2 z-50 flex h-[36px] items-center gap-[8px] rounded-[4px] py-[10px] pl-[12px] pr-[6px] transition-[opacity,transform] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
      style={{
        backgroundColor: tokens.black,
        transitionDuration: visible ? "200ms" : "150ms",
        opacity: visible ? 1 : 0,
        transform: visible
          ? "translateX(-50%) translateY(0px) scale(1)"
          : "translateX(-50%) translateY(8px) scale(0.97)",
        pointerEvents: visible ? "auto" : "none",
      }}
      role="status"
      aria-hidden={!visible}
    >
      <span className="whitespace-nowrap text-[13px] font-medium leading-[normal] tracking-[-0.13px] text-white">
        {message}
      </span>
      <span aria-hidden="true" className="h-[16px] w-px shrink-0 bg-white/20" />
      <button
        type="button"
        onClick={onUndo}
        className={`rounded-[3px] px-[6px] py-[2px] text-[13px] font-medium leading-[normal] tracking-[-0.13px] text-white/80 hover:text-white ${pressableClass} ${focusRingClass}`}
      >
        Отменить
      </button>
    </div>
  );
}

// Наш тултип — полупрозрачный черный с блюром (как в usage-stats/current-meeting),
// порталом в body: кнопки шапки сидят в overflow-hidden контейнерах.
type HeaderTip = { text: string; left: number; top: number; placement?: "top" | "bottom" };

function HeaderTooltip({ tip, visible }: { tip: HeaderTip | null; visible: boolean }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted || !tip) return null;
  return createPortal(
    <span
      role="tooltip"
      className={`pointer-events-none fixed z-[60] w-max max-w-[240px] -translate-x-1/2 rounded-[3px] p-[8px] text-left text-[10px] font-normal leading-[normal] tracking-[-0.1px] text-white transition-opacity duration-[120ms] ease-out motion-reduce:transition-none ${tip.placement === "top" ? "-translate-y-full" : ""}`}
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
    { name: "Андрюха (Speaker F)", color: speakerColors.orange },
    { name: "Саша (Speaker D)", color: speakerColors.deepPurple },
    { name: "Санек (Speaker A)", color: speakerColors.green },
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
          Участники
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

// Полный продуктовый список предустановленных отчетов (порядок как в настройках)
const presetReports: Report[] = [
  { id: "regular", label: "Обычная встреча", icon: { kind: "svg", file: "preset-regular.svg" }, group: "preset" },
  { id: "daily", label: "Дейлик", icon: { kind: "svg", file: "preset-daily.svg" }, group: "preset" },
  { id: "demo", label: "Демо", icon: { kind: "svg", file: "preset-demo.svg" }, group: "preset" },
  { id: "one-on-one", label: "Один-на-один", icon: { kind: "svg", file: "preset-oneonone.svg" }, group: "preset" },
  { id: "grooming", label: "Груминг бэклога", icon: { kind: "svg", file: "preset-grooming.svg" }, group: "preset" },
  { id: "brainstorm", label: "Брейншторм", icon: { kind: "svg", file: "preset-brainstorm.svg" }, group: "preset" },
  { id: "followup", label: "Follow-up письмо", icon: { kind: "svg", file: "preset-followup.svg" }, group: "preset" },
  { id: "project-sync", label: "Синк по проекту", icon: { kind: "svg", file: "preset-projectsync.svg" }, group: "preset" },
  { id: "protocol", label: "Протокол встречи", icon: { kind: "svg", file: "preset-protocol.svg" }, group: "preset" },
  { id: "retro", label: "Ретроспектива", icon: { kind: "svg", file: "preset-retro.svg" }, group: "preset" },
  { id: "sprint", label: "Планирование спринта", icon: { kind: "svg", file: "preset-sprint.svg" }, group: "preset" },
  { id: "teamsync", label: "Командный синк", icon: { kind: "svg", file: "preset-teamsync.svg" }, group: "preset" },
  { id: "tech-review", label: "Техническое ревью", icon: { kind: "svg", file: "preset-techreview.svg" }, group: "preset" },
  { id: "sales", label: "Коуч по продажам", icon: { kind: "svg", file: "preset-sales.svg" }, group: "preset" },
  { id: "client", label: "Встреча с клиентом", icon: { kind: "svg", file: "preset-client.svg" }, group: "preset" },
  { id: "existing-client", label: "Встреча с действующим клиентом", icon: { kind: "svg", file: "preset-existing-client.svg" }, group: "preset" },
  { id: "client-onboarding", label: "Онбординг клиента", icon: { kind: "svg", file: "preset-client-onboarding.svg" }, group: "preset" },
  articleReport,
  { id: "joke", label: "Анекдот по встрече", icon: { kind: "svg", file: "preset-joke.svg" }, group: "preset" },
  { id: "hr", label: "HR интервью", icon: { kind: "svg", file: "preset-hr.svg" }, group: "preset" },
  { id: "research", label: "Исследование", icon: { kind: "svg", file: "preset-research.svg" }, group: "preset" },
  { id: "medicine", label: "Медицинский анамнез", icon: { kind: "svg", file: "preset-medicine.svg" }, group: "preset" },
  { id: "notes", label: "Конспект", icon: { kind: "svg", file: "preset-notes.svg" }, group: "preset" },
  { id: "meddic", label: "MEDDIC", icon: { kind: "svg", file: "preset-meddic.svg" }, group: "preset" },
  { id: "ux-interview", label: "UX-интервью с пользователем", icon: { kind: "svg", file: "preset-ux-interview.svg" }, group: "preset" },
  { id: "prd", label: "PRD", icon: { kind: "svg", file: "preset-prd.svg" }, group: "preset" },
  { id: "usability", label: "Юзабилити-тестирование", icon: { kind: "svg", file: "preset-usability.svg" }, group: "preset" },
];

const allReports: Report[] = [...customReports, ...presetReports];

// CSS-маска для перекрашиваемых иконок (цвет задается через background)
const maskStyle = (file: string) => ({
  WebkitMaskImage: `url(${rsAsset(file)})`,
  maskImage: `url(${rsAsset(file)})`,
  WebkitMaskPosition: "center",
  maskPosition: "center",
  WebkitMaskRepeat: "no-repeat",
  maskRepeat: "no-repeat",
  WebkitMaskSize: "contain",
  maskSize: "contain",
} as const);

// Серый вариант иконки с ховером в 585E6C — для неактивных табов (внутри group/tab)
const mutedGlyphClass =
  "shrink-0 bg-[#818AA3] transition-colors duration-[120ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover/tab:bg-[#585E6C] motion-reduce:transition-none";

// Иконка отчета: обычный SVG или бейдж кастомного отчета (подложка + буква).
// muted — серый силуэт для неактивного таба
function ReportIcon({ report, size = 16, muted = false }: { report: Report; size?: number; muted?: boolean }) {
  const scale = size / 16;
  if (report.icon.kind === "svg") {
    if (muted) {
      return <span aria-hidden="true" className={mutedGlyphClass} style={{ width: size, height: size, ...maskStyle(report.icon.file) }} />;
    }
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={rsAsset(report.icon.file)} alt="" className="shrink-0" style={{ width: size, height: size }} />
    );
  }
  return (
    <span className="relative block shrink-0 overflow-clip" style={{ width: size, height: size }}>
      {muted ? (
        <span
          aria-hidden="true"
          className={`absolute ${mutedGlyphClass}`}
          style={{ top: "6.28%", right: "11.74%", bottom: "6.26%", left: "11.72%", width: "76.54%", height: "87.46%", ...maskStyle(report.icon.file) }}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={rsAsset(report.icon.file)}
          alt=""
          className="absolute"
          style={{ top: "6.28%", right: "11.74%", bottom: "6.26%", left: "11.72%", width: "76.54%", height: "87.46%" }}
        />
      )}
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
  onReloadTipShow,
  onReloadTipHide,
  onLabelTipShow,
  onLabelTipHide,
}: {
  report: Report;
  isCurrent?: boolean;
  onSelect: () => void;
  onReload?: () => void;
  onReloadTipShow?: (event: React.MouseEvent<HTMLElement>) => void;
  onReloadTipHide?: () => void;
  onLabelTipShow?: (text: string, event: { currentTarget: HTMLElement }) => void;
  onLabelTipHide?: () => void;
}) {
  // Переприменять заново можно только кастомные отчеты; у обычных — просто галочка
  const canReload = report.group === "custom";
  const labelRef = useRef<HTMLSpanElement>(null);

  return (
    <button
      type="button"
      onClick={onSelect}
      onMouseEnter={(event) => {
        // Тултип с полным названием — только если оно обрезано троеточием
        const label = labelRef.current;
        if (label && label.scrollWidth > label.clientWidth + 1) {
          onLabelTipShow?.(report.label, event);
        }
      }}
      onMouseLeave={() => onLabelTipHide?.()}
      className={`flex w-full items-center gap-[6px] rounded-[2px] px-[6px] py-[8px] text-left hover:bg-[#F7F7F8] ${pressableClass}`}
    >
      <ReportIcon report={report} />
      <span
        ref={labelRef}
        className="min-w-0 flex-1 truncate text-[13px] font-normal leading-[normal] tracking-[-0.13px]"
        style={{ color: tokens.black }}
      >
        {report.label}
      </span>
      {isCurrent && (
        <span className="flex shrink-0 items-center gap-[6px]">
          {canReload && (
            <span
              role="button"
              tabIndex={0}
              aria-label="Применить заново"
              onClick={(event) => {
                event.stopPropagation();
                onReloadTipHide?.();
                onReload?.();
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.stopPropagation();
                  onReloadTipHide?.();
                  onReload?.();
                }
              }}
              onMouseEnter={onReloadTipShow}
              onMouseLeave={onReloadTipHide}
              className="group/reload flex h-[16px] w-[16px] items-center justify-center"
            >
              {/* Маска вместо img, чтобы красить иконку по ховеру */}
              <span
                aria-hidden="true"
                className={`h-[16px] w-[16px] shrink-0 bg-[#818AA3] group-hover/reload:bg-[#585E6C] ${pressableClass}`}
                style={{
                  WebkitMaskImage: `url(${rsAsset("ic-reload.svg")})`,
                  maskImage: `url(${rsAsset("ic-reload.svg")})`,
                  WebkitMaskPosition: "center",
                  maskPosition: "center",
                  WebkitMaskRepeat: "no-repeat",
                  maskRepeat: "no-repeat",
                  WebkitMaskSize: "contain",
                  maskSize: "contain",
                }}
              />
            </span>
          )}
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

  // Тултип «Применить заново» над иконкой перезагрузки — наш блюр-тултип порталом
  const [tip, setTip] = useState<HeaderTip | null>(null);
  const [tipVisible, setTipVisible] = useState(false);

  const showReloadTip = (event: React.MouseEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTip({ text: "Применить заново", left: rect.left + rect.width / 2, top: rect.top - 8, placement: "top" });
    setTipVisible(true);
  };
  const hideReloadTip = () => setTipVisible(false);

  // Тултип с полным названием отчета — для строк, где название обрезано
  const showLabelTip = (text: string, event: { currentTarget: HTMLElement }) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTip({ text, left: rect.left + rect.width / 2, top: rect.top - 8, placement: "top" });
    setTipVisible(true);
  };

  return (
    <motion.div
      {...motionProps}
      onScroll={hideReloadTip}
      className="absolute left-0 top-[calc(100%+6px)] z-50 flex max-h-[368px] w-[240px] origin-top-left flex-col items-start overflow-y-auto overflow-x-clip overscroll-contain rounded-[4px] bg-white shadow-[0_0_4px_0_rgba(0,0,0,0.15)] will-change-[opacity,transform] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-[2px] [&::-webkit-scrollbar-thumb]:border-solid [&::-webkit-scrollbar-thumb]:border-transparent [&::-webkit-scrollbar-thumb]:bg-[#DDDEDF] [&::-webkit-scrollbar-thumb]:bg-clip-padding [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-track]:[margin:4px_0] [&::-webkit-scrollbar]:w-[8px]"
    >
      {/* Примененные к этой встрече отчеты */}
      <div className="flex w-full shrink-0 flex-col items-center border-b py-[4px] pl-[4px] pr-[2px]" style={{ borderColor: tokens.border }}>
        {applied.map((report) => (
          <ReportRow
            key={report.id}
            report={report}
            isCurrent={report.id === currentId}
            onSelect={() => onSelect(report)}
            onReload={onReload}
            onReloadTipShow={showReloadTip}
            onReloadTipHide={hideReloadTip}
            onLabelTipShow={showLabelTip}
            onLabelTipHide={hideReloadTip}
          />
        ))}
      </div>

      {/* Кастомные отчеты + создание */}
      <div className="flex w-full shrink-0 flex-col items-center border-b py-[4px] pl-[4px] pr-[2px]" style={{ borderColor: tokens.border }}>
        {availableCustom.map((report) => (
          <ReportRow
            key={report.id}
            report={report}
            onSelect={() => onSelect(report)}
            onLabelTipShow={showLabelTip}
            onLabelTipHide={hideReloadTip}
          />
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
        <div className="flex w-full shrink-0 flex-col items-center py-[4px] pl-[4px] pr-[2px]">
          {availablePresets.map((report) => (
            <ReportRow
              key={report.id}
              report={report}
              onSelect={() => onSelect(report)}
              onLabelTipShow={showLabelTip}
              onLabelTipHide={hideReloadTip}
            />
          ))}
        </div>
      )}
      <HeaderTooltip tip={tip} visible={tipVisible} />
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Табы: текущий отчет (дропдаун) + Транскрипт / Чат / Задачи
// ─────────────────────────────────────────────────────────────────────────────

type MeetingTab = "report" | "transcript" | "tasks";

// Лейбл неактивного таба: серый, по ховеру таба — 585E6C
const inactiveTabLabelClass =
  "whitespace-nowrap text-[13px] font-normal leading-[normal] tracking-[-0.13px] text-[#818AA3] transition-colors duration-[120ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover/tab:text-[#585E6C] motion-reduce:transition-none";

// Иконка таба через маску: активная — 212833, неактивная — 818AA3 с ховером 585E6C
function TabGlyph({ file, active, width = 16, height = 16 }: { file: string; active?: boolean; width?: number; height?: number }) {
  return (
    <span
      aria-hidden="true"
      className={
        active
          ? "shrink-0 bg-[#212833]"
          : "shrink-0 bg-[#818AA3] transition-colors duration-[120ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover/tab:bg-[#585E6C] motion-reduce:transition-none"
      }
      style={{ width, height, ...maskStyle(file) }}
    />
  );
}

function ReportTabs({
  current,
  open,
  onToggle,
  activeTab,
  onSelectTab,
  applied,
  currentId,
  onSelect,
  onReload,
  onClose,
  trailing,
}: {
  current: Report;
  open: boolean;
  onToggle: () => void;
  activeTab: MeetingTab;
  onSelectTab: (tab: MeetingTab) => void;
  applied: Report[];
  currentId: string;
  onSelect: (report: Report) => void;
  onReload: () => void;
  onClose: () => void;
  trailing?: React.ReactNode;
}) {
  const reportActive = activeTab === "report";
  const transcriptActive = activeTab === "transcript";
  const tasksActive = activeTab === "tasks";
  const reduceMotion = useReducedMotion();

  // Подчеркивание-индикатор скользит между табами (shared layout)
  const underline = (
    <motion.span
      layoutId="meeting-tab-underline"
      transition={reduceMotion ? { duration: 0 } : { duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
      className="absolute inset-x-0 -bottom-px h-[2px] bg-[#212833]"
    />
  );

  return (
    <div className="relative w-full">
      <div className="flex w-full items-center border-b" style={{ borderColor: tokens.border }}>
        {/* Таб текущего отчета: активный — с индикатором и шевроном дропдауна,
            неактивный — серый, без индикатора и шеврона */}
        <button
          type="button"
          aria-expanded={reportActive ? open : undefined}
          onClick={() => (reportActive ? onToggle() : onSelectTab("report"))}
          className={`group/tab relative flex items-center justify-center gap-[6px] px-[8px] pb-[12px] pt-[8px] ${pressableClass}`}
        >
          <ReportIcon report={current} muted={!reportActive} />
          <span
            className={
              reportActive
                ? "whitespace-nowrap text-[13px] font-medium leading-[normal] tracking-[-0.13px] text-[#212833]"
                : inactiveTabLabelClass
            }
          >
            {current.label}
          </span>
          {/* Шеврон плавно схлопывается, когда таб неактивен */}
          <span
            className="flex h-[16px] shrink-0 items-center justify-center overflow-hidden transition-[width,margin-left,opacity] duration-[180ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
            style={{ width: reportActive ? 16 : 0, marginLeft: reportActive ? 0 : -6, opacity: reportActive ? 1 : 0 }}
          >
            <span
              className={`flex h-[16px] w-[16px] shrink-0 items-center justify-center transition-transform duration-[180ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none ${open ? "rotate-180" : "rotate-0"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={rsAsset("tab-chevron.svg")} alt="" className="h-[16px] w-[16px] shrink-0" />
            </span>
          </span>
          {reportActive && underline}
        </button>

        {/* Транскрипт */}
        <button
          type="button"
          onClick={() => onSelectTab("transcript")}
          className={`group/tab relative flex items-center justify-center gap-[6px] px-[8px] pb-[12px] pt-[8px] ${pressableClass}`}
        >
          <TabGlyph file="tab-transcript.svg" active={transcriptActive} />
          <span
            className={
              transcriptActive
                ? "whitespace-nowrap text-[13px] font-medium leading-[normal] tracking-[-0.13px] text-[#212833]"
                : inactiveTabLabelClass
            }
          >
            Транскрипт
          </span>
          {transcriptActive && underline}
        </button>

        <button type="button" className={`group/tab flex items-center justify-center gap-[6px] px-[8px] pb-[12px] pt-[8px] ${pressableClass}`}>
          <TabGlyph file="tab-chat.svg" width={12.948} height={12.023} />
          <span className={inactiveTabLabelClass}>Чат</span>
        </button>
        <button
          type="button"
          onClick={() => onSelectTab("tasks")}
          className={`group/tab relative flex items-center justify-center gap-[6px] px-[8px] pb-[12px] pt-[8px] ${pressableClass}`}
        >
          <TabGlyph file="tab-tasks.svg" active={tasksActive} />
          <span
            className={
              tasksActive
                ? "whitespace-nowrap text-[13px] font-medium leading-[normal] tracking-[-0.13px] text-[#212833]"
                : inactiveTabLabelClass
            }
          >
            Задачи
          </span>
          {tasksActive && underline}
        </button>
        {trailing}
      </div>
      <AnimatePresence>
        {reportActive && open && (
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
  daily: [
    {
      kind: "bullets",
      title: "Вчера:",
      items: [
        { text: "Marisa — закрыла разметку доски референсов тегами по подходам. ", time: "0:44" },
        { text: "Jordan — собрал первый пул ассоциаций для семиотического поля. ", time: "1:21" },
        { text: "Ashley — заполнила разделы брифа по целям и компетенциям продукта. ", time: "2:03" },
        { text: "Samira — свела фидбэк бренд-команды по прошлым концептам в один документ. ", time: "2:47" },
      ],
    },
    {
      kind: "bullets",
      title: "Сегодня:",
      items: [
        { text: "Marisa — добор референсов по антропоморфному подходу, 3–5 примеров. ", time: "3:30" },
        { text: "Jordan — валидация семиотического поля с бренд-командой в 15:00. ", time: "4:12" },
        { text: "Ashley — драфт раздела про аудиторию с социопсихологией. ", time: "4:58" },
        { text: "Samira — подготовка структуры текстовой рамки к завтрашнему ревью. ", time: "5:26" },
      ],
    },
    {
      kind: "bullets",
      title: "Блокеры:",
      items: [
        { text: "Ждем позиционирование от бренд-команды — без него не закрыть бриф. ", time: "6:15" },
        { text: "У Ashley до сих пор нет доступа к аналитике аудитории. ", time: "6:52" },
      ],
    },
  ],
  demo: [
    {
      kind: "paragraph",
      title: "Что показывали:",
      text: "Демо процесса работы с референсами для смежных команд: живой прогон комбинаторного подхода на реальном примере — от сбора примеров на доске до сборки текстовой рамки. Показали, как из разрозненных шрифтов, палитр и лейаутов собирается целостный визуальный образ, и чем этот процесс отличается от «сделаем красиво на вкус».",
    },
    {
      kind: "bullets",
      title: "Реакция аудитории:",
      items: [
        { text: "Продакты сразу спросили, можно ли применить подход к питч-декам — интерес живой. ", time: "3:24" },
        { text: "Момент со сборкой текстовой рамки вызвал больше всего вопросов и скриншотов. ", time: "6:12" },
        { text: "Маркетинг попросил отдельный прогон для лендингов. ", time: "8:45" },
      ],
    },
    {
      kind: "bullets",
      title: "Вопросы с демо:",
      items: [
        { text: "Сколько времени занимает полный цикл от референсов до концепта. ", time: "9:03" },
        { text: "Кто владелец семиотического поля после передачи проекта. ", time: "10:17" },
        { text: "Можно ли пропускать нарратив на маленьких задачах. ", time: "11:29" },
      ],
    },
    {
      kind: "bullets",
      title: "Фоллоу-апы:",
      items: [
        { text: "Расшарить запись демо и шаблон текстовой рамки всем участникам. " },
        { text: "Назначить отдельный прогон для маркетинга на следующей неделе. " },
      ],
    },
  ],
  grooming: [
    {
      kind: "paragraph",
      title: "Итоги груминга:",
      text: "Разобрали 12 задач из дизайн-бэклога: 7 оценили и приоритизировали, 3 отправили в архив как неактуальные после смены подхода к референсам, 2 требуют уточнения от продакта. Средний размер задач уменьшился — крупные эпики про визуальный образ распилили по этапам воркшопа.",
    },
    {
      kind: "bullets",
      title: "Оценено и приоритизировано:",
      items: [
        { text: "Сборка единой доски референсов — S, приоритет высокий, берем в ближайший спринт. ", time: "1:38" },
        { text: "Шаблон брифа из пяти разделов — M, высокий, зависит от позиционирования. ", time: "3:05" },
        { text: "Семиотическое поле: воркшоп + шаблон — M, средний. ", time: "4:47" },
        { text: "Ревизия старых концептов против текстовой рамки — L, низкий, после запуска. ", time: "6:20" },
      ],
    },
    {
      kind: "bullets",
      title: "В архив:",
      items: [
        { text: "Мудборд «по настроению» — заменен структурной доской референсов. ", time: "8:11" },
        { text: "Конкурс вариантов лого внутри команды — не бьется с новым процессом. ", time: "8:56" },
      ],
    },
    {
      kind: "bullets",
      title: "Требуют уточнения:",
      items: [
        { text: "Анимация маскота: ждем решения, насколько глубоко идем в антропоморфизм. " },
        { text: "Гайд по тону иллюстраций: нужен вход от бренд-команды. " },
      ],
    },
  ],
  brainstorm: [
    {
      kind: "paragraph",
      title: "Тема и рамки:",
      text: "Генерили метафоры для семиотического поля продукта. Правила: без критики на этапе генерации, любая ассоциация записывается, отбор — голосованием в конце. За 25 минут собрали 23 идеи, до финала дошли шесть.",
    },
    {
      kind: "bullets",
      title: "Идеи:",
      items: [
        { text: "Продукт как «дирижер» — собирает разрозненные инструменты в оркестр. ", time: "2:14" },
        { text: "Метафора «переводчика» — переводит хаос встреч на язык решений. ", time: "3:41" },
        { text: "«Компас» — направление в потоке информации, а не еще один поток. ", time: "5:02" },
        { text: "«Второй пилот» — рядом, но штурвал у пользователя. ", time: "6:33" },
        { text: "«Сад» — знания растут и требуют ухода, продукт — садовник. ", time: "7:58" },
        { text: "«Монтажер» — из сырого материала собирает финальный фильм. ", time: "9:12" },
      ],
    },
    {
      kind: "bullets",
      title: "Отобрано в работу:",
      items: [
        { text: "«Дирижер» и «второй пилот» — идут в семиотическое поле как основные. " },
        { text: "«Монтажер» — резерв для нарратива про отчеты. " },
      ],
    },
  ],
  followup: [
    {
      kind: "paragraph",
      title: "Кому и зачем:",
      text: "Письмо участникам воркшопа и бренд-команде: зафиксировать договоренности, приложить материалы и обозначить дедлайны, пока контекст свежий. Тон — рабочий, без формальностей.",
    },
    {
      kind: "paragraph",
      title: "Черновик письма:",
      text: "Привет! Спасибо за плотный воркшоп по референсам. Коротко о главном: утвердили комбинаторный подход как основной, антропоморфный оставили для маскота. Доску референсов пополняем до пятницы — по 3–5 примеров с подписями. Бриф собираем по разделам, за каждым закреплен владелец. Семиотическое поле валидируем с бренд-командой в среду, после этого стартует нарратив. Запись встречи и шаблоны — во вложении. Вопросы — в тред.",
    },
    {
      kind: "bullets",
      title: "Вложения и ссылки:",
      items: [
        { text: "Запись воркшопа и таймкоды ключевых моментов. " },
        { text: "Шаблон брифа из пяти разделов с примерами заполнения. " },
        { text: "Доска референсов с тегами по подходам. " },
      ],
    },
  ],
  "project-sync": [
    {
      kind: "paragraph",
      title: "Статус проекта:",
      text: "Редизайн визуального образа идет по плану, вторая неделя из шести. Вижуал-ресерч почти закрыт, бриф в работе, нарратив стартует после валидации семиотического поля. Бюджет и сроки без изменений, эскалаций нет.",
    },
    {
      kind: "bullets",
      title: "Риски:",
      items: [
        { text: "Позиционирование от бренд-команды задерживается — каскадно двигает бриф и нарратив. ", time: "3:15" },
        { text: "Отпуск Jordan через две недели попадает на пик работы над нарративом. ", time: "5:40" },
        { text: "Смежная команда может забрать Samira на квартальный проект. ", time: "7:22" },
      ],
    },
    {
      kind: "bullets",
      title: "Следующие вехи:",
      items: [
        { text: "Среда — валидация семиотического поля с бренд-командой. " },
        { text: "Пятница — полная доска референсов и закрытый бриф. " },
        { text: "Следующая пятница — драфт нарратива и первые визуальные концепты. " },
      ],
    },
  ],
  retro: [
    {
      kind: "bullets",
      title: "Что было хорошо:",
      items: [
        { text: "Формат воркшопа с живыми примерами зашел лучше лекционного — вовлеченность заметно выше. ", time: "1:05" },
        { text: "Единая доска референсов сразу сняла хаос из пяти инструментов. ", time: "2:36" },
        { text: "Решения фиксировали по ходу встречи, а не по памяти после. ", time: "3:58" },
      ],
    },
    {
      kind: "bullets",
      title: "Что можно улучшить:",
      items: [
        { text: "Опять вышли за таймбокс на обсуждении подходов — 12 минут вместо семи. ", time: "5:14" },
        { text: "Бренд-команду надо звать на воркшопы сразу, а не согласовывать после. ", time: "6:47" },
        { text: "Часть терминов (семиотическое поле, текстовая рамка) понимали по-разному до середины встречи. ", time: "8:09" },
      ],
    },
    {
      kind: "bullets",
      title: "Экшен-айтемы:",
      items: [
        { text: "Завести глоссарий терминов дизайн-процесса и приложить к брифу — Ashley. " },
        { text: "Жесткий таймбокс с таймером на следующем воркшопе — Marisa. " },
        { text: "Приглашение бренд-команде на все воркшопы серии — Samira. " },
      ],
    },
    {
      kind: "paragraph",
      title: "Настроение команды:",
      text: "По быстрому опросу — 4.2 из 5, выше прошлого спринта. Команда чувствует движение: процесс перестал быть «правками на вкус» и обрел структуру. Основной источник напряжения — зависимость от внешних команд.",
    },
  ],
  sprint: [
    {
      kind: "paragraph",
      title: "Цель спринта:",
      text: "Закрыть фундамент визуального образа: полный бриф, провалидированное семиотическое поле и драфт нарратива. Критерий успеха — любой новый концепт можно проверить на соответствие текстовой рамке без участия автора.",
    },
    {
      kind: "bullets",
      title: "Взято в спринт:",
      items: [
        { text: "Доска референсов: добор, теги, чистка дублей — 3 стори-поинта. ", time: "2:20" },
        { text: "Бриф: разделы позиционирования и аудитории — 5 поинтов. ", time: "3:47" },
        { text: "Семиотическое поле: воркшоп с бренд-командой и фиксация — 5 поинтов. ", time: "5:12" },
        { text: "Драфт нарратива и текстовой рамки — 8 поинтов. ", time: "6:38" },
      ],
    },
    {
      kind: "paragraph",
      title: "Емкость команды:",
      text: "Четыре человека, 21 поинт при обычной емкости 24: у Jordan два дня на смежный проект, минус пятница на демо. Буфер на непредвиденное — три поинта, задача про ревизию старых концептов уходит кандидатом на выпил.",
    },
    {
      kind: "bullets",
      title: "Риски спринта:",
      items: [
        { text: "Валидация с бренд-командой может съехать — тогда нарратив не успеет к демо. " },
        { text: "Оценка нарратива в 8 поинтов дана с низкой уверенностью, задача плохо изучена. " },
      ],
    },
  ],
  "tech-review": [
    {
      kind: "paragraph",
      title: "Скоуп ревью:",
      text: "Смотрели реализацию дизайн-токенов и компонентной базы под новый визуальный образ: палитра, типографика, спейсинги и сборка тем. Отдельно — как токены переживут смену образа после утверждения нарратива.",
    },
    {
      kind: "bullets",
      title: "Замечания:",
      items: [
        { text: "Цвета захардкожены в 14 компонентах мимо токенов — миграция обязательна до смены палитры. ", time: "2:41" },
        { text: "Типографическая шкала в коде расходится с фигмой на двух размерах. ", time: "4:15" },
        { text: "Спейсинги местами арбитрарные — 13px, 17px вне сетки. ", time: "5:52" },
      ],
    },
    {
      kind: "bullets",
      title: "Технический долг:",
      items: [
        { text: "Старая тема лежит рядом с новой — двойная поддержка до конца квартала. ", time: "7:30" },
        { text: "Нет автопроверки соответствия токенов фигма-переменным. ", time: "8:44" },
      ],
    },
    {
      kind: "bullets",
      title: "Решения:",
      items: [
        { text: "Миграцию хардкода на токены берем в ближайший спринт, до утверждения палитры. ", time: "10:05" },
        { text: "Заводим линтер-правило на арбитрарные значения вне шкалы. ", time: "11:12" },
      ],
    },
  ],
  "existing-client": [
    {
      kind: "paragraph",
      title: "Контекст аккаунта:",
      text: "Клиент с нами восемь месяцев, команда дизайна из шести человек, тариф командный. Пользуются в основном отчетами и транскриптами, интеграции подключены наполовину. Продление через два месяца.",
    },
    {
      kind: "bullets",
      title: "Здоровье аккаунта:",
      items: [
        { text: "Активность стабильная: 40+ встреч в месяц, вся команда в продукте еженедельно. ", time: "1:30" },
        { text: "NPS от ключевого контакта — 9, от команды в среднем 7.5. ", time: "2:48" },
        { text: "Тикетов в поддержку за квартал — два, оба закрыты в SLA. ", time: "3:35" },
      ],
    },
    {
      kind: "bullets",
      title: "Новые запросы:",
      items: [
        { text: "Хотят кастомные отчеты под свои дизайн-ритуалы — как раз наш новый флоу. ", time: "5:09" },
        { text: "Просят выгрузку отчетов в их вики по API. ", time: "6:54" },
        { text: "Интересуются местами для смежной команды продактов — потенциал расширения. ", time: "8:27" },
      ],
    },
    {
      kind: "bullets",
      title: "Риски оттока:",
      items: [
        { text: "Смена руководителя дизайна в следующем квартале — новый человек, новые предпочтения. ", time: "9:41" },
        { text: "Финансовый отдел клиента пересматривает подписки — нужен кейс с цифрами ценности. ", time: "10:36" },
      ],
    },
    {
      kind: "bullets",
      title: "Следующие шаги:",
      items: [
        { text: "Показать бету кастомных отчетов до конца месяца. " },
        { text: "Подготовить value-кейс с метриками использования к переговорам о продлении. " },
        { text: "Познакомиться с новым руководителем дизайна до смены. " },
      ],
    },
  ],
  "client-onboarding": [
    {
      kind: "paragraph",
      title: "Профиль клиента:",
      text: "Дизайн-агентство на 15 человек, пришли за протоколами клиентских встреч и передачей контекста между проектами. Драйвер внедрения — операционный директор, скептик — арт-директор («еще один инструмент»).",
    },
    {
      kind: "bullets",
      title: "Пройдено на онбординге:",
      items: [
        { text: "Подключили календарь и первую тройку регулярных встреч. ", time: "1:55" },
        { text: "Прогнали живую встречу через бота — отчет получили за 40 секунд, вау-момент случился. ", time: "4:20" },
        { text: "Настроили воркспейс и роли для всей команды. ", time: "6:41" },
        { text: "Показали смену отчетов в одной вкладке под разные типы встреч. ", time: "8:15" },
      ],
    },
    {
      kind: "bullets",
      title: "Открытые вопросы:",
      items: [
        { text: "Нужна политика хранения записей клиентских встреч — у агентства NDA с частью заказчиков. ", time: "9:38" },
        { text: "Спрашивали про кастомные шаблоны под их формат брифинга. ", time: "10:52" },
      ],
    },
    {
      kind: "bullets",
      title: "План на первые 30 дней:",
      items: [
        { text: "Неделя 1–2: вся команда проводит встречи через продукт, чекап в конце недели. " },
        { text: "Неделя 3: подключение интеграций с их таск-трекером. " },
        { text: "Неделя 4: разбор метрик использования и решение по расширению мест. " },
      ],
    },
  ],
  joke: [
    {
      kind: "paragraph",
      title: "Анекдот:",
      text: "Приходит дизайнер к арт-директору: «Я собрал визуальный образ из пятидесяти референсов!» Арт-директор: «И что получилось?» — «Пока не знаю, доска не грузится». Мораль от команды: сначала текстовая рамка, потом референсы, и никогда — наоборот.",
    },
    {
      kind: "paragraph",
      title: "По мотивам момента:",
      text: "Родился на 5:47, когда выяснилось, что половина собранных референсов ведет на несуществующие страницы, а вторая половина — на один и тот же дриббл-шот с разных аккаунтов.",
    },
    {
      kind: "bullets",
      title: "Оценка зала:",
      items: [
        { text: "Смеялись трое из четырех — Jordan предложил свою версию, она вошла в протокол. " },
        { text: "Уровень кринжа: приемлемый, к публикации в общий чат допущен. " },
      ],
    },
  ],
  meddic: [
    {
      kind: "paragraph",
      title: "Metrics:",
      text: "Клиент теряет около 30 часов дизайнеров в месяц на пересборку контекста между встречами и проектами. Целевая метрика — сократить время от встречи до зафиксированных решений с двух дней до 15 минут, экономия оценочно 4500$ в месяц на команду.",
    },
    {
      kind: "paragraph",
      title: "Economic Buyer:",
      text: "Бюджет держит операционный директор, финальная подпись — у CEO при сумме выше 10к$ в год. На встрече присутствовал опердир, реагировал на цифры экономии, попросил кейс похожей команды.",
    },
    {
      kind: "bullets",
      title: "Decision Criteria:",
      items: [
        { text: "Безопасность данных и NDA-совместимость — критично из-за клиентских встреч. ", time: "4:18" },
        { text: "Скорость внедрения без обучения — команда не готова тратить больше недели. ", time: "5:33" },
        { text: "Кастомизация отчетов под их ритуалы — обязательное условие арт-директора. ", time: "6:50" },
      ],
    },
    {
      kind: "bullets",
      title: "Decision Process:",
      items: [
        { text: "Пилот на одной проектной команде две недели → разбор метрик → решение опердира. ", time: "8:02" },
        { text: "Юридическая проверка договора займет еще неделю — заложить в план. ", time: "9:15" },
      ],
    },
    {
      kind: "paragraph",
      title: "Identify Pain:",
      text: "Решения с клиентских встреч теряются между проектами, новые дизайнеры месяцами входят в контекст, а протоколы пишет тот, кто медленнее всех отказывался. Боль подтверждена тремя участниками независимо.",
    },
    {
      kind: "paragraph",
      title: "Champion:",
      text: "Лид проектной команды — уже пользовалась продуктом на прошлом месте, готова вести пилот и защищать результаты перед опердиром. Дать ей доступ к бете кастомных отчетов и материалы для внутренней презентации.",
    },
  ],
  "ux-interview": [
    {
      kind: "paragraph",
      title: "Профиль респондента:",
      text: "Продуктовый дизайнер, 4 года опыта, ведет 8–10 встреч в неделю. Наш продукт использует три месяца, до этого конспектировал вручную в заметки. Технически подкован, любит горячие клавиши, не читает документацию.",
    },
    {
      kind: "bullets",
      title: "Сценарии и задачи:",
      items: [
        { text: "Найти решение с встречи двухнедельной давности — справился за 40 секунд через поиск. ", time: "2:10" },
        { text: "Применить другой отчет к прошедшей встрече — нашел дропдаун со второй попытки. ", time: "4:26" },
        { text: "Поделиться отчетом с коллегой без аккаунта — уперся в выбор между ссылкой и экспортом. ", time: "7:44" },
      ],
    },
    {
      kind: "bullets",
      title: "Наблюдения:",
      items: [
        { text: "Сначала кликнул на иконку вкладки, а не на название с шевроном — ожидал меню по правому клику. ", time: "4:40" },
        { text: "Заглушку генерации прочитал полностью — «20 секунд» снизило тревожность ожидания. ", time: "5:58" },
        { text: "Пытался перетащить отчеты в дропдауне, чтобы поменять порядок примененных. ", time: "6:31" },
      ],
    },
    {
      kind: "bullets",
      title: "Цитаты:",
      underlined: true,
      items: [
        { text: "«О, они переезжают наверх — это удобно, мой набор всегда под рукой». ", time: "6:05" },
        { text: "«А почему у Антимата есть перезапуск, а у Статьи нет? А, кастомный, понял». ", time: "8:19" },
      ],
    },
    {
      kind: "bullets",
      title: "Выводы:",
      items: [
        { text: "Механика перемещения примененных наверх считывается без объяснений — оставляем. " },
        { text: "Стоит проверить драг-н-дроп порядка примененных отчетов на большем числе респондентов. " },
        { text: "Развилку «поделиться vs экспорт» разобрать отдельным исследованием. " },
      ],
    },
  ],
  prd: [
    {
      kind: "paragraph",
      title: "Проблема:",
      text: "Отчеты по встрече разбросаны по отдельным вкладкам: применил три отчета — получил три вкладки, между которыми нет связи. Пользователи не понимают, какие отчеты уже применены, применяют повторно и теряют сгенерированное. 23% тикетов в поддержку за квартал — про «куда делся мой отчет».",
    },
    {
      kind: "paragraph",
      title: "Целевая аудитория:",
      text: "Активные пользователи с 5+ встречами в неделю, применяющие два и более отчета к одной встрече: тимлиды, продакты, аккаунт-менеджеры. Вторичная — новички, которым нужен понятный вход в многообразие отчетов.",
    },
    {
      kind: "bullets",
      title: "Пользовательские сценарии:",
      items: [
        { text: "Переключиться между примененными отчетами в один клик, не теряя контекст встречи. ", time: "3:12" },
        { text: "Применить новый отчет из пресетов или кастомных и сразу увидеть прогресс генерации. ", time: "4:36" },
        { text: "Пересоздать кастомный отчет после правки его промпта. ", time: "5:50" },
      ],
    },
    {
      kind: "bullets",
      title: "Требования:",
      items: [
        { text: "Один таб отчета с дропдауном: секции примененных, кастомных и пресетов через дивайдеры. " },
        { text: "Примененные перемещаются в верхнюю секцию, текущий помечен галочкой. " },
        { text: "Заглушка генерации с иконкой отчета и ожидаемым временем. " },
        { text: "Пересоздание — только у кастомных отчетов. " },
      ],
    },
    {
      kind: "bullets",
      title: "Метрики успеха:",
      items: [
        { text: "Доля встреч с 2+ примененными отчетами: рост с 14% до 25% за квартал. " },
        { text: "Тикеты «потерял отчет»: минус 80%. " },
        { text: "Время до первого применения второго отчета у новичков: меньше двух дней. " },
      ],
    },
    {
      kind: "bullets",
      title: "Вне скоупа:",
      items: [
        { text: "Редактор кастомных отчетов — отдельный эпик. " },
        { text: "Порядок примененных отчетов драг-н-дропом — после валидации на исследовании. " },
      ],
    },
  ],
  usability: [
    {
      kind: "paragraph",
      title: "Сетап теста:",
      text: "Модерируемый тест нового переключателя отчетов: пять респондентов, прототип на живых данных, по 20 минут на сессию. Задачи покрывали переключение, применение нового отчета и пересоздание кастомного.",
    },
    {
      kind: "bullets",
      title: "Задания:",
      items: [
        { text: "Открыть отчет «Исследование» на встрече — 5 из 5 справились без подсказок. ", time: "1:24" },
        { text: "Применить кастомный «Антимат» — 4 из 5, один искал кнопку в шапке. ", time: "3:47" },
        { text: "Пересоздать текущий отчет — 3 из 5 нашли иконку сразу, двое после наведения. ", time: "6:02" },
      ],
    },
    {
      kind: "bullets",
      title: "Найденные проблемы:",
      items: [
        { text: "Средняя: иконка пересоздания без ховера не считывается — тултип спасает, но поздно. ", time: "6:30" },
        { text: "Низкая: двое ожидали, что «Создать отчет» откроет форму прямо в дропдауне. ", time: "8:14" },
        { text: "Низкая: один респондент не заметил перемещения отчета наверх — искал в пресетах. ", time: "9:26" },
      ],
    },
    {
      kind: "bullets",
      title: "Метрики выполнения:",
      items: [
        { text: "Успешность задач: 87% против 61% на старом флоу с вкладками. " },
        { text: "Среднее время переключения отчета: 3.2 секунды против 8.7. " },
        { text: "SUS: 84 балла — «отлично», старый флоу набирал 67. " },
      ],
    },
    {
      kind: "bullets",
      title: "Рекомендации:",
      items: [
        { text: "Оставить механику как есть, докрутить заметность иконки пересоздания. " },
        { text: "Подумать про подсветку строки, переехавшей наверх, после применения. " },
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

// ─────────────────────────────────────────────────────────────────────────────
// Транскрипт (перенесен из ai-export-sharing): главы + реплики
// ─────────────────────────────────────────────────────────────────────────────

const LINE =
  "Hello Ruth! I hope everything is going wonderfully for you! How have you been lately? Hello Ruth! I hope ";

type Replica = { speaker: string; color: string; time: string; lines: number };

const chapter1Replicas: Replica[] = [
  { speaker: "Speaker B", color: speakerColors.orange, time: "0:02", lines: 2 },
  { speaker: "Speaker A", color: speakerColors.green, time: "0:08", lines: 1 },
];

const chapter2Replicas: Replica[] = [
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
// Вкладка «Задачи» — по макету «улучшение задач» (фреймы 44978:11508 default,
// 44997:14469 hover): бейджи-фильтры, ховер строки = фон + копирование + удаление
// ─────────────────────────────────────────────────────────────────────────────

type Assignee = { id: string; label: string; full: string; color: string };

const taskAssignees: Assignee[] = [
  { id: "andryukha", label: "Андрюха", full: "Андрюха (Speaker F)", color: speakerColors.orange },
  { id: "sasha", label: "Саша", full: "Саша (Speaker D)", color: speakerColors.deepPurple },
  { id: "sanek", label: "Санек", full: "Санек (Speaker A)", color: speakerColors.green },
];

const assigneeById = (id: string | null) => taskAssignees.find((item) => item.id === id) ?? null;

// Время только в обработчиках событий (обертка — чтобы react-hooks/purity
// не принимал вызов в хендлере за вызов на рендере)
const nowMs = () => Date.now();

// Ручка перетаскивания (6 точек) — общая для строки и композера
function GripIcon() {
  return (
    <svg width="8" height="12" viewBox="0 0 8 12" fill="currentColor" className="shrink-0">
      <circle cx="2" cy="2" r="1.1" />
      <circle cx="6" cy="2" r="1.1" />
      <circle cx="2" cy="6" r="1.1" />
      <circle cx="6" cy="6" r="1.1" />
      <circle cx="2" cy="10" r="1.1" />
      <circle cx="6" cy="10" r="1.1" />
    </svg>
  );
}

type Task = {
  id: string;
  text: string;
  assigneeId: string | null;
  time?: string;
  done: boolean;
};

// Порядок, таймкоды и выполненность — как в макете
const initialTasks: Task[] = [
  {
    id: "signals",
    text: "Передать список признаков и весов для определения пользователей, которым показывать B2B коммуникации (Срок: В течение 2 дней)",
    assigneeId: null,
    time: "4:32",
    done: false,
  },
  {
    id: "segment-script",
    text: "Разработать и запустить скрипт, который раз в сутки пересчитывает принадлежность пользователей к сегменту и формирует флаг для показа коммуникаций",
    assigneeId: "andryukha",
    time: "6:58",
    done: false,
  },
  {
    id: "tracking",
    text: "Настроить трекинг событий: показы баннеров, клики по баннерам, закрытия, отправки форм и ошибки в формах, обсудить логику перезаписи ошибок при успешной отправке",
    assigneeId: "sasha",
    time: "12:02",
    done: false,
  },
  {
    id: "sheet-access",
    text: "Обеспечить запись данных пользователей, достигших события form.submit.access, в Google таблицу с логином, временем и заполненными полями формы",
    assigneeId: "andryukha",
    time: "13:31",
    done: false,
  },
  {
    id: "sheet-pricing",
    text: "Создать отдельную Google таблицу для записи данных форм, открываемых через прайсинг и апгрейд, чтобы отделить статистику от баннеров (Срок: Следующая неделя)",
    assigneeId: "andryukha",
    time: "17:09",
    done: false,
  },
  {
    id: "modals-frontend",
    text: "Начать разработку фронтенда модалок, подготовить к интеграции с формулой скоринга и логикой показа коммуникаций",
    assigneeId: "sanek",
    time: "22:48",
    done: false,
  },
  {
    id: "spec-md",
    text: "Скинуть MD-шку с описанием спецификации в DevChat для команды разработки",
    assigneeId: "andryukha",
    time: "23:37",
    done: false,
  },
  {
    id: "tracking-details",
    text: "Обсудить и уточнить технические детали трекинга кликов и событий на фронтенде, включая использование внешних метрик и базы данных",
    assigneeId: "sasha",
    time: "24:08",
    done: false,
  },
  {
    id: "spec-review",
    text: "Санек изучит спецификацию и при необходимости задаст вопросы Андрюхе по технической части (Срок: Понедельник)",
    assigneeId: "sanek",
    time: "27:11",
    done: false,
  },
  {
    id: "cooldown",
    text: "Реализовать логику кулдауна на 30 дней для пользователей, которые закрыли баннер крестиком или отправили форму",
    assigneeId: "andryukha",
    time: "8:19",
    done: true,
  },
];

// Конфетти при отметке: фиксированный паттерн разлета (углы/размеры/цвета палитры)
const burstParticles = [
  { dx: 0, dy: -13, size: 2, color: "#0D9655", delay: 0 },
  { dx: 9, dy: -9, size: 1.5, color: "rgba(13,150,85,0.55)", delay: 25 },
  { dx: 13, dy: 0, size: 2, color: "#0D9655", delay: 5 },
  { dx: 9, dy: 9, size: 1.5, color: "rgba(13,150,85,0.7)", delay: 35 },
  { dx: 0, dy: 12, size: 2, color: "rgba(13,150,85,0.55)", delay: 15 },
  { dx: -9, dy: 9, size: 1.5, color: "#0D9655", delay: 30 },
  { dx: -13, dy: 0, size: 2, color: "rgba(13,150,85,0.7)", delay: 10 },
  { dx: -9, dy: -9, size: 1.5, color: "rgba(13,150,85,0.55)", delay: 20 },
];

function TaskCheckbox({ checked, onToggle, label }: { checked: boolean; onToggle: () => void; label: string }) {
  const reduceMotion = useReducedMotion();
  const buttonRef = useRef<HTMLButtonElement>(null);
  // Счетчик отметок: key для перезапуска конфетти; только при клике «отметить»
  const [burst, setBurst] = useState(0);
  // Отметка играет на месте (галочка + конфетти), и только потом задача
  // улетает вниз — иначе строка ремаунтится в «выполненных» и анимация гибнет
  const [pending, setPending] = useState(false);
  const visualChecked = checked || pending;

  const handleClick = () => {
    if (pending) return;
    if (checked || reduceMotion) {
      onToggle();
      return;
    }
    setPending(true);
    setBurst((value) => value + 1);
    // Пружинный поп самого чекбокса — WAAPI, вне main thread и без ремаунта
    buttonRef.current?.animate(
      [
        { transform: "scale(1)" },
        { transform: "scale(0.8)", offset: 0.3 },
        { transform: "scale(1.12)", offset: 0.7 },
        { transform: "scale(1)" },
      ],
      { duration: 300, easing: "cubic-bezier(0.23, 1, 0.32, 1)" },
    );
    // Не чистим таймер при анмаунте: toggleTask по id безопасен и после него.
    // 300мс: галочка успевает прорисоваться (180мс) + короткий бит — и отлет
    setTimeout(() => onToggle(), 300);
  };

  return (
    <button
      ref={buttonRef}
      type="button"
      role="checkbox"
      aria-checked={visualChecked}
      aria-label={label}
      onClick={handleClick}
      className={`relative flex h-[16px] w-[16px] shrink-0 items-center justify-center rounded-[2px] border border-solid transition-[background-color,border-color] duration-[120ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none ${focusRingClass} ${
        visualChecked ? "border-[#0D9655] bg-[#0D9655]" : "border-[#C7C8CA] bg-transparent hover:border-[#818AA3]"
      }`}
    >
      {burst > 0 && visualChecked && (
        <span key={burst} aria-hidden="true" className="pointer-events-none absolute inset-0">
          {burstParticles.map((particle, index) => (
            <span
              key={index}
              className="task-burst-particle absolute left-1/2 top-1/2 rounded-full"
              style={
                {
                  width: particle.size,
                  height: particle.size,
                  marginLeft: -particle.size / 2,
                  marginTop: -particle.size / 2,
                  backgroundColor: particle.color,
                  animationDelay: `${particle.delay}ms`,
                  "--burst-dx": `${particle.dx}px`,
                  "--burst-dy": `${particle.dy}px`,
                } as React.CSSProperties
              }
            />
          ))}
        </span>
      )}
      {/* Глиф = продуктовый Icons/Check/12 из макета, штрихом ради анимации прорисовки */}
      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" className="shrink-0">
        <motion.path
          d="M2.5 6.5L5 9L9.5 3.5"
          stroke="white"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={false}
          animate={{ pathLength: visualChecked ? 1 : 0, opacity: visualChecked ? 1 : 0 }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : { duration: visualChecked ? 0.18 : 0.1, ease: [0.23, 1, 0.32, 1] }
          }
        />
      </svg>
    </button>
  );
}

// Аватар исполнителя: сплошной цвет спикера, белый инициал (Avatar/Initials из макета)
function TaskAvatar({ assignee, size = 16 }: { assignee: Assignee; size?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full"
      style={{ width: size, height: size, backgroundColor: assignee.color }}
    >
      <span
        className="font-medium leading-none text-white"
        style={{ fontSize: size <= 14 ? 9 : 10, letterSpacing: "-0.1px" }}
      >
        {assignee.label[0]}
      </span>
    </span>
  );
}

// Заглушка исполнителя (спека из фигмы): круг 16, stroke 1.5 dashed 3/3,
// прямые торцы, всегда #818AA3. pathLength=48 = 8 целых периодов dash+gap,
// чтобы пунктир замыкался без обрубка (CSS border-dashed так не умеет)
function AssigneePlaceholder() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
      <circle cx="8" cy="8" r="7.25" stroke="#818AA3" strokeWidth="1.5" strokeDasharray="3 3" pathLength={48} />
    </svg>
  );
}

// Меню исполнителя (макет 45046:18074): 210px, «Без исполнителя» первым,
// у выбранного — серая галочка справа. Общее для строки и композера
function AssigneeMenu({
  value,
  onSelect,
  direction = "down",
}: {
  value: string | null;
  onSelect: (id: string | null) => void;
  direction?: "down" | "up";
}) {
  const reduceMotion = useReducedMotion();
  // Меню въезжает со стороны триггера: вниз — сверху, вверх — снизу
  const shift = direction === "up" ? 6 : -6;
  const motionProps = {
    initial: reduceMotion ? { opacity: 0 } : { opacity: 0, transform: `translateY(${shift}px) scale(0.965)` },
    animate: reduceMotion ? { opacity: 1 } : { opacity: 1, transform: "translateY(0px) scale(1)" },
    exit: reduceMotion ? { opacity: 0 } : { opacity: 0, transform: `translateY(${shift / 3}px) scale(0.985)` },
    transition: reduceMotion ? { duration: 0 } : { duration: 0.18, ease: [0.23, 1, 0.32, 1] as const },
  };
  const options: { id: string | null; label: string; assignee: Assignee | null }[] = [
    { id: null, label: "Без исполнителя", assignee: null },
    ...taskAssignees.map((item) => ({ id: item.id, label: item.full, assignee: item })),
  ];
  return (
    <motion.div
      {...motionProps}
      className={`absolute right-0 z-30 flex w-[210px] flex-col rounded-[4px] bg-white p-[4px] shadow-[0px_0px_2px_0px_rgba(0,0,0,0.15)] ${
        direction === "up" ? "bottom-[calc(100%+6px)] origin-bottom-right" : "top-[calc(100%+6px)] origin-top-right"
      }`}
    >
      {options.map((option) => (
        <button
          key={option.id ?? "none"}
          type="button"
          onClick={() => onSelect(option.id)}
          className={`flex h-[32px] w-full shrink-0 items-center justify-between rounded-[2px] px-[6px] py-[8px] text-left hover:bg-[#F7F7F8] ${pressableClass} ${focusRingClass}`}
        >
          <span className="flex items-center gap-[6px]">
            {option.assignee ? (
              <TaskAvatar assignee={option.assignee} />
            ) : (
              <span className="flex">
                <AssigneePlaceholder />
              </span>
            )}
            <span className="whitespace-nowrap text-[13px] font-normal leading-[normal] tracking-[-0.13px] text-[#212833]">
              {option.label}
            </span>
          </span>
          {value === option.id && (
            <span aria-hidden="true" className="h-[16px] w-[16px] shrink-0 bg-[#818AA3]" style={tiMask("fig-check-menu.svg")} />
          )}
        </button>
      ))}
    </motion.div>
  );
}

function TaskRow({
  task,
  onToggle,
  onTimeClick,
  onEdit,
  onDelete,
  onCopied,
  onAssign,
  showTip,
  hideTip,
  dragControls,
}: {
  task: Task;
  onToggle: () => void;
  onTimeClick: () => void;
  onEdit: (text: string) => void;
  onDelete: () => void;
  onCopied: () => void;
  onAssign: (assigneeId: string | null) => void;
  showTip: (text: string) => (event: React.MouseEvent<HTMLElement>) => void;
  hideTip: () => void;
  dragControls?: DragControls;
}) {
  const assignee = assigneeById(task.assigneeId);
  const [assigneeMenuOpen, setAssigneeMenuOpen] = useState(false);
  const [assigneeMenuDir, setAssigneeMenuDir] = useState<"down" | "up">("down");
  const assigneeAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!assigneeMenuOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (assigneeAreaRef.current?.contains(target)) return;
      setAssigneeMenuOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAssigneeMenuOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [assigneeMenuOpen]);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.text);
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    };
  }, []);

  const autoSize = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  const startEdit = () => {
    setDraft(task.text);
    setEditing(true);
  };

  const commitEdit = () => {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== task.text) onEdit(trimmed);
  };

  const copyTask = () => {
    hideTip();
    const meta = [assignee?.full, task.time].filter(Boolean).join(", ");
    navigator.clipboard?.writeText(meta ? `${task.text} (${meta})` : task.text).catch(() => {});
    onCopied();
    setCopied(true);
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => {
      setCopied(false);
      copyTimer.current = null;
    }, 1200);
  };

  return (
    <div
      className={`group/row relative flex w-full items-start gap-[8px] rounded-[4px] p-[8px] hover:bg-[#FAFAFA] ${pressableClass}`}
    >
      {/* Ручка перетаскивания — за левым краем строки (зеркально крестику), на ховере */}
      {dragControls && !editing && (
        <span
          onPointerDown={(event) => {
            // preventDefault не дает браузеру начать выделение текста при перетаскивании
            event.preventDefault();
            dragControls.start(event);
          }}
          aria-hidden="true"
          className="absolute left-[-20px] top-[8px] flex h-[16px] w-[16px] cursor-grab touch-none select-none items-center justify-center text-[#C7C8CA] opacity-0 transition-opacity duration-[120ms] ease-out hover:text-[#818AA3] group-hover/row:opacity-100 motion-reduce:transition-none"
        >
          <GripIcon />
        </span>
      )}
      <TaskCheckbox checked={task.done} onToggle={onToggle} label={task.text} />
      {editing ? (
        <textarea
          ref={(el) => {
            if (el) {
              autoSize(el);
              el.focus();
              el.setSelectionRange(el.value.length, el.value.length);
            }
          }}
          value={draft}
          rows={1}
          onChange={(event) => {
            setDraft(event.target.value);
            autoSize(event.target);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commitEdit();
            }
            if (event.key === "Escape") {
              event.preventDefault();
              setEditing(false);
            }
          }}
          onBlur={commitEdit}
          className="min-w-0 flex-1 resize-none overflow-hidden bg-transparent p-0 text-[13px] font-normal leading-[16px] tracking-[-0.13px] text-[#212833] outline-none"
        />
      ) : (
        <p
          onClick={startEdit}
          className="min-w-0 flex-1 cursor-text text-[13px] font-normal leading-[16px] tracking-[-0.13px] transition-colors duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
          style={{ color: task.done ? "#BABBBD" : tokens.black }}
        >
          {task.text}
        </p>
      )}
      {/* Слот копирования 16px зарезервирован всегда, иконка — на ховере строки */}
      <button
        type="button"
        aria-label="Скопировать задачу"
        onClick={copyTask}
        onMouseEnter={showTip("Скопировать")}
        onMouseLeave={hideTip}
        className={`relative h-[16px] w-[16px] shrink-0 text-[#C7C8CA] transition-[opacity,color] duration-[120ms] ease-out hover:text-[#818AA3] motion-reduce:transition-none ${focusRingClass} ${
          copied ? "opacity-100" : "opacity-0 focus-visible:opacity-100 group-hover/row:opacity-100"
        }`}
      >
        {/* Морф копия → check-circle из шапки (как у «Скопировать ссылку») */}
        <span
          aria-hidden="true"
          className="absolute inset-0 bg-current transition-[opacity,transform] duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
          style={{ ...tiMask("fig-copy.svg"), opacity: copied ? 0 : 1, transform: copied ? "scale(0.6)" : "scale(1)" }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={asset("check-circle.svg")}
          alt=""
          className="absolute inset-0 h-[16px] w-[16px] transition-[opacity,transform] duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
          style={{ opacity: copied ? 1 : 0, transform: copied ? "scale(1)" : "scale(0.6)" }}
        />
      </button>
      {task.time && (
        <button
          type="button"
          onClick={onTimeClick}
          className={`mt-px flex h-[16px] shrink-0 items-center rounded-[2px] text-[12px] font-normal tracking-[-0.24px] text-[#818AA3] hover:text-[#585E6C] hover:underline hover:underline-offset-1 ${pressableClass} ${focusRingClass}`}
        >
          {task.time}
        </button>
      )}
      <div ref={assigneeAreaRef} className="relative flex h-[16px] shrink-0 items-center">
        <button
          type="button"
          aria-label="Назначить исполнителя"
          aria-expanded={assigneeMenuOpen}
          onClick={() => {
            const rect = assigneeAreaRef.current?.getBoundingClientRect();
            if (rect) setAssigneeMenuDir(window.innerHeight - rect.bottom < 170 ? "up" : "down");
            setAssigneeMenuOpen((value) => !value);
          }}
          className={`flex rounded-full ${focusRingClass}`}
        >
          {assignee ? (
            <TaskAvatar assignee={assignee} />
          ) : (
            <span className={`flex text-[#C7C8CA] hover:text-[#818AA3] ${pressableClass}`}>
              <AssigneePlaceholder />
            </span>
          )}
        </button>
        <AnimatePresence>
          {assigneeMenuOpen && (
            <AssigneeMenu
              value={task.assigneeId}
              direction={assigneeMenuDir}
              onSelect={(id) => {
                onAssign(id);
                setAssigneeMenuOpen(false);
              }}
            />
          )}
        </AnimatePresence>
      </div>
      {/* Удаление — за правым краем строки, на ховере */}
      <button
        type="button"
        aria-label="Удалить задачу"
        onClick={() => {
          hideTip();
          onDelete();
        }}
        onMouseEnter={showTip("Удалить задачу")}
        onMouseLeave={hideTip}
        className={`absolute right-[-20px] top-[8px] flex h-[16px] w-[16px] items-center justify-center opacity-0 transition-opacity duration-[120ms] ease-out focus-visible:opacity-100 group-hover/row:opacity-100 motion-reduce:transition-none ${focusRingClass}`}
      >
        <span
          aria-hidden="true"
          className={`h-[16px] w-[16px] shrink-0 bg-[#C7C8CA] hover:bg-[#818AA3] ${pressableClass}`}
          style={tiMask("fig-x.svg")}
        />
      </button>
    </div>
  );
}

// Строка активной задачи: Reorder.Item + ручка перетаскивания через dragControls.
// ВАЖНО: не передавать style/whileDrag — style перебивает внутренний y-motionvalue
// Reorder.Item и драг перестает работать; подсветка — CSS-классами
function ActiveTaskItem({
  task,
  layoutKey,
  canDrag,
  enter,
  transition,
  children,
}: {
  task: Task;
  layoutKey: string;
  canDrag: boolean;
  enter: boolean;
  transition: Transition;
  children: (dragControls?: DragControls) => React.ReactNode;
}) {
  const controls = useDragControls();
  const [dragging, setDragging] = useState(false);
  return (
    <Reorder.Item
      value={task}
      as="div"
      layoutId={layoutKey}
      transition={transition}
      dragListener={false}
      dragControls={controls}
      onDragStart={() => {
        setDragging(true);
        // Захватили — «сжатая ладонь» на всем экране, пока тянем
        document.body.style.cursor = "grabbing";
      }}
      onDragEnd={() => {
        setDragging(false);
        document.body.style.cursor = "";
      }}
      className={`relative rounded-[4px] ${dragging ? "z-[5]" : ""}`}
    >
      <div
        className={`rounded-[4px] transition-[background-color,box-shadow,transform] duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none ${
          dragging ? "cursor-grabbing scale-[1.01] bg-white shadow-[0px_4px_16px_0px_rgba(33,40,51,0.12)]" : ""
        } ${enter ? "task-fade-in-fast" : ""}`}
      >
        {children(canDrag ? controls : undefined)}
      </div>
    </Reorder.Item>
  );
}

// Бейдж-фильтр: имя в цвете спикера, серый счетчик; активный — на подложке
function TaskBadge({
  label,
  count,
  color,
  active,
  onClick,
}: {
  label: string;
  count: number;
  color?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`flex h-[24px] shrink-0 items-center justify-center gap-[4px] rounded-[3px] px-[8px] py-[4px] text-[12px] font-normal leading-[normal] tracking-[-0.24px] ${
        active ? "bg-[#F7F7F8]" : "hover:bg-[#F7F7F8]"
      } ${pressableClass} ${focusRingClass}`}
    >
      <span style={{ color: color ?? tokens.black }}>{label}</span>
      <span className="text-[#818AA3]">{count}</span>
    </button>
  );
}

// Инлайн-добавление задачи: ghost-строка → композер (Enter — добавить, Esc/клик вне — закрыть)
function TaskComposer({
  open,
  onOpen,
  onClose,
  onAdd,
  defaultAssigneeId,
}: {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  onAdd: (text: string, assigneeId: string | null) => void;
  defaultAssigneeId: string | null;
}) {
  // Композер ремаунтится по key при открытии/закрытии — стейт инициализируется
  // при монтировании, без синхронизации через эффекты
  const [text, setText] = useState("");
  const [assigneeId, setAssigneeId] = useState<string | null>(defaultAssigneeId);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuDir, setMenuDir] = useState<"down" | "up">("down");
  const inputRef = useRef<HTMLInputElement>(null);
  const menuAreaRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = assigneeById(assigneeId);

  // Клик вне композера: если что-то введено — создаем задачу (коммит, как у
  // инлайн-редактирования), затем закрываем. Esc — отмена без создания
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (rootRef.current?.contains(target)) return;
      const trimmed = text.trim();
      if (trimmed) onAdd(trimmed, assigneeId);
      onClose();
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open, onClose, onAdd, text, assigneeId]);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (menuAreaRef.current?.contains(target)) return;
      setMenuOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [menuOpen]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className={`group/add flex w-full items-start gap-[8px] rounded-[4px] p-[8px] text-left hover:bg-[#FAFAFA] ${pressableClass} ${focusRingClass}`}
      >
        <span aria-hidden="true" className="h-[16px] w-[16px] shrink-0 bg-[#818AA3]" style={tiMask("fig-plus.svg")} />
        <span className="text-[13px] font-normal leading-[16px] tracking-[-0.13px] text-[#818AA3]">Добавить задачу</span>
      </button>
    );
  }

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onAdd(trimmed, assigneeId);
    setText("");
    inputRef.current?.focus();
    // Новая строка встает над композером и толкает его вниз — держим его
    // в поле зрения при серийном вводе
    setTimeout(() => rootRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }), 60);
  };

  return (
    <div
      ref={rootRef}
      className="relative flex w-full items-start gap-[8px] rounded-[4px] bg-[#FAFAFA] p-[8px]"
    >
      <span className="h-[16px] w-[16px] shrink-0 rounded-[2px] border border-solid border-[#C7C8CA]" />
      <input
        ref={inputRef}
        autoFocus
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") submit();
          if (event.key === "Escape") onClose();
        }}
        placeholder="Новая задача"
        className="min-w-0 flex-1 bg-transparent text-[13px] font-normal leading-[16px] tracking-[-0.13px] text-[#212833] outline-none placeholder:text-[#C7C8CA]"
      />
      <div ref={menuAreaRef} className="relative flex h-[16px] shrink-0 items-center">
        <button
          type="button"
          aria-label="Выбрать исполнителя"
          aria-expanded={menuOpen}
          onClick={() => {
            const rect = menuAreaRef.current?.getBoundingClientRect();
            if (rect) setMenuDir(window.innerHeight - rect.bottom < 170 ? "up" : "down");
            setMenuOpen((value) => !value);
          }}
          className={`flex h-[16px] w-[16px] shrink-0 items-center justify-center rounded-full ${pressableClass} ${focusRingClass}`}
        >
          {selected ? (
            <TaskAvatar assignee={selected} />
          ) : (
            <span className="flex">
              <AssigneePlaceholder />
            </span>
          )}
        </button>
        <AnimatePresence>
          {menuOpen && (
            <AssigneeMenu
              value={assigneeId}
              direction={menuDir}
              onSelect={(id) => {
                setAssigneeId(id);
                setMenuOpen(false);
                inputRef.current?.focus();
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Кнопка «скопировать все задачи» справа в ряду табов (фреймы 44994:12025).
// Текст берет из ref — список живет в TasksContent, кнопка в ряду табов
function TasksCopyAllButton({
  textRef,
  onCopied,
}: {
  textRef: React.MutableRefObject<string>;
  onCopied: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Тултип с задержкой 350ms — как у иконок в строках
  const [tip, setTip] = useState<HeaderTip | null>(null);
  const [tipVisible, setTipVisible] = useState(false);
  const tipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
      if (tipTimer.current) clearTimeout(tipTimer.current);
    };
  }, []);

  const showOwnTip = (event: React.MouseEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (tipTimer.current) clearTimeout(tipTimer.current);
    tipTimer.current = setTimeout(() => {
      tipTimer.current = null;
      setTip({ text: "Скопировать все задачи", left: rect.left + rect.width / 2, top: rect.top - 8, placement: "top" });
      setTipVisible(true);
    }, 350);
  };
  const hideOwnTip = () => {
    if (tipTimer.current) {
      clearTimeout(tipTimer.current);
      tipTimer.current = null;
    }
    setTipVisible(false);
  };

  const handleCopy = () => {
    hideOwnTip();
    navigator.clipboard?.writeText(textRef.current).catch(() => {});
    onCopied();
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setCopied(false);
      timer.current = null;
    }, 1200);
  };

  return (
    <button
      type="button"
      aria-label="Скопировать все задачи"
      onClick={handleCopy}
      onMouseEnter={showOwnTip}
      onMouseLeave={hideOwnTip}
      className={`group/copyall relative ml-auto h-[16px] w-[16px] shrink-0 self-center ${focusRingClass}`}
    >
      <span
        aria-hidden="true"
        className={`absolute inset-0 bg-[#DDDEDF] transition-[opacity,transform,background-color] duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover/copyall:bg-[#818AA3] motion-reduce:transition-none`}
        style={{ ...tiMask("fig-copyall.svg"), opacity: copied ? 0 : 1, transform: copied ? "scale(0.6)" : "scale(1)" }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={asset("check-circle.svg")}
        alt=""
        className="absolute inset-0 h-[16px] w-[16px] transition-[opacity,transform] duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
        style={{ opacity: copied ? 1 : 0, transform: copied ? "scale(1)" : "scale(0.6)" }}
      />
      <HeaderTooltip tip={tip} visible={tipVisible} />
    </button>
  );
}

function TasksContent({
  onShowTranscript,
  onCopied,
  onDeleted,
  registerCopyText,
}: {
  onShowTranscript: () => void;
  onCopied: () => void;
  onDeleted: (undo: () => void) => void;
  registerCopyText: (text: string) => void;
}) {
  const reduceMotion = useReducedMotion();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [filter, setFilter] = useState<string>("all");
  const [composerOpen, setComposerOpen] = useState(false);
  const newTaskCounter = useRef(0);
  // Восстановленная через «Отменить» задача въезжает так же, как новая
  const [restoredId, setRestoredId] = useState<string | null>(null);
  // Единый тултип на весь список (один портал вместо инстанса на строку):
  // задержка 350ms против случайных срабатываний, «теплое» окно 300ms — сосед
  // показывается мгновенно, как в тулбарах
  const [tip, setTip] = useState<HeaderTip | null>(null);
  const [tipVisible, setTipVisible] = useState(false);
  const tipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tipShown = useRef(false);
  const tipWarmUntil = useRef(0);

  const showTip = (text: string) => (event: React.MouseEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const place = () => {
      tipTimer.current = null;
      tipShown.current = true;
      setTip({ text, left: rect.left + rect.width / 2, top: rect.top - 8, placement: "top" });
      setTipVisible(true);
    };
    if (tipTimer.current) clearTimeout(tipTimer.current);
    if (nowMs() < tipWarmUntil.current) {
      place();
      return;
    }
    tipTimer.current = setTimeout(place, 350);
  };
  const hideTip = () => {
    if (tipTimer.current) {
      clearTimeout(tipTimer.current);
      tipTimer.current = null;
    }
    if (tipShown.current) tipWarmUntil.current = nowMs() + 300;
    tipShown.current = false;
    setTipVisible(false);
  };

  useEffect(() => {
    return () => {
      if (tipTimer.current) clearTimeout(tipTimer.current);
    };
  }, []);

  const toggleTask = (id: string) =>
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, done: !task.done } : task)));

  const addTask = (text: string, assigneeId: string | null) => {
    newTaskCounter.current += 1;
    setTasks((prev) => [...prev, { id: `new-${newTaskCounter.current}`, text, assigneeId, done: false }]);
  };

  const editTask = (id: string, text: string) =>
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, text } : task)));

  const assignTask = (id: string, assigneeId: string | null) =>
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, assigneeId } : task)));

  // Удаление с возможностью отмены: тост наверху страницы, восстановление
  // возвращает задачу на прежний индекс (если ее не вернули раньше)
  const deleteTask = (id: string) => {
    const index = tasks.findIndex((task) => task.id === id);
    if (index === -1) return;
    const removed = tasks[index];
    setTasks((prev) => prev.filter((task) => task.id !== id));
    onDeleted(() => {
      setRestoredId(removed.id);
      setTimeout(() => setRestoredId((current) => (current === removed.id ? null : current)), 800);
      setTasks((current) => {
        if (current.some((task) => task.id === removed.id)) return current;
        const at = Math.min(index, current.length);
        return [...current.slice(0, at), removed, ...current.slice(at)];
      });
    });
  };

  const countFor = (id: string) => tasks.filter((task) => task.assigneeId === id).length;
  const unassignedCount = tasks.filter((task) => task.assigneeId === null).length;
  // Если последняя задача без исполнителя исчезла (назначили/удалили) при активном
  // фильтре «Без исполнителя» — молча возвращаемся к «Всего», бейдж-то скрылся
  const effectiveFilter = filter === "none" && unassignedCount === 0 ? "all" : filter;

  const visibleTasks =
    effectiveFilter === "all"
      ? tasks
      : effectiveFilter === "none"
        ? tasks.filter((task) => task.assigneeId === null)
        : tasks.filter((task) => task.assigneeId === effectiveFilter);
  const activeTasks = visibleTasks.filter((task) => !task.done);
  const doneTasks = visibleTasks.filter((task) => task.done);

  // Актуальный markdown-чеклист для кнопки «скопировать все» в ряду табов
  useEffect(() => {
    const lines = [...tasks.filter((task) => !task.done), ...tasks.filter((task) => task.done)].map((task) => {
      const meta = [assigneeById(task.assigneeId)?.full, task.time].filter(Boolean).join(", ");
      return `- [${task.done ? "x" : " "}] ${task.text}${meta ? ` (${meta})` : ""}`;
    });
    registerCopyText(lines.join("\n"));
  }, [tasks, registerCopyText]);

  const rowLayoutTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.24, ease: [0.23, 1, 0.32, 1] as const };

  // Reorder отдает новый порядок активных задач; выполненные — следом.
  // Страховка: при фильтре drag выключен и порядок не трогаем
  const handleReorder = (nextActive: Task[]) => {
    if (effectiveFilter !== "all") return;
    setTasks((prev) => [...nextActive, ...prev.filter((task) => task.done)]);
  };

  const renderRow = (task: Task) => (
    <motion.div key={task.id} layoutId={`task-${effectiveFilter}-${task.id}`} layout transition={rowLayoutTransition}>
      {/* Вход новой задачи — CSS-анимацией: framer в этой версии
          замораживает mount-анимации внутри LayoutGroup */}
      <div className={task.id.startsWith("new-") || task.id === restoredId ? "task-fade-in-fast" : undefined}>
        <TaskRow
          task={task}
          onToggle={() => toggleTask(task.id)}
          onTimeClick={onShowTranscript}
          onEdit={(text) => editTask(task.id, text)}
          onDelete={() => deleteTask(task.id)}
          onCopied={onCopied}
          onAssign={(assigneeId) => assignTask(task.id, assigneeId)}
          showTip={showTip}
          hideTip={hideTip}
        />
      </div>
    </motion.div>
  );

  return (
    <div className="flex w-full flex-col gap-[12px]">
      {/* Бейджи-фильтры по исполнителям */}
      <div className="flex w-full items-center gap-[4px]">
        <TaskBadge label="Всего" count={tasks.length} active={effectiveFilter === "all"} onClick={() => setFilter("all")} />
        {unassignedCount > 0 && (
          <TaskBadge
            label="Без исполнителя"
            count={unassignedCount}
            color="#818AA3"
            active={effectiveFilter === "none"}
            onClick={() => setFilter(filter === "none" ? "all" : "none")}
          />
        )}
        {taskAssignees.map((item) => (
          <TaskBadge
            key={item.id}
            label={item.full}
            count={countFor(item.id)}
            color={item.color}
            active={effectiveFilter === item.id}
            onClick={() => setFilter(filter === item.id ? "all" : item.id)}
          />
        ))}
      </div>

      <LayoutGroup>
        {/* key={filter}: смена фильтра ремаунтит список целиком — мгновенно,
            без layout-анимаций со старых позиций (иначе строки дергаются) */}
        <div key={effectiveFilter} className="-mx-[8px] flex flex-col">
          <Reorder.Group axis="y" as="div" values={activeTasks} onReorder={handleReorder} className="flex flex-col">
            {activeTasks.map((task) => (
              <ActiveTaskItem
                key={task.id}
                task={task}
                layoutKey={`task-${effectiveFilter}-${task.id}`}
                canDrag={effectiveFilter === "all"}
                enter={task.id.startsWith("new-") || task.id === restoredId}
                transition={rowLayoutTransition}
              >
                {(dragControls) => (
                  <TaskRow
                    task={task}
                    onToggle={() => toggleTask(task.id)}
                    onTimeClick={onShowTranscript}
                    onEdit={(text) => editTask(task.id, text)}
                    onDelete={() => deleteTask(task.id)}
                    onCopied={onCopied}
                    onAssign={(assigneeId) => assignTask(task.id, assigneeId)}
                    showTip={showTip}
                    hideTip={hideTip}
                    dragControls={dragControls}
                  />
                )}
              </ActiveTaskItem>
            ))}
          </Reorder.Group>
          <TaskComposer
            key={composerOpen ? "composer-open" : "composer-ghost"}
            open={composerOpen}
            onOpen={() => setComposerOpen(true)}
            onClose={() => setComposerOpen(false)}
            onAdd={addTask}
            defaultAssigneeId={effectiveFilter === "all" || effectiveFilter === "none" ? null : effectiveFilter}
          />
          {/* Выполненные — внизу, под строкой добавления (как в макете) */}
          {doneTasks.map(renderRow)}
        </div>
      </LayoutGroup>
      <HeaderTooltip tip={tip} visible={tipVisible} />
    </div>
  );
}

function TranscriptContent() {
  const [chapter1Open, setChapter1Open] = useState(false);
  const [chapter2Open, setChapter2Open] = useState(true);

  return (
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
        {chapter2Replicas.map((replica, index) => (
          <ReplicaBlock key={index} replica={replica} />
        ))}
      </ChapterAccordion>
    </div>
  );
}

// Заглушка на время применения отчета (иконка текущего отчета в 48px).
// Контейнер тянется до низа экрана с отступом 16px, контент отцентрован по высоте
function GeneratingPlaceholder({ report }: { report: Report }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(undefined);

  useLayoutEffect(() => {
    const update = () => {
      const container = containerRef.current;
      if (!container) return;
      const top = container.getBoundingClientRect().top;
      setHeight(Math.max(240, window.innerHeight - top - 16));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex w-full flex-col items-center justify-center rounded-[4px] p-[16px]"
      style={{ backgroundColor: tokens.bgCard, height: height ?? 400 }}
    >
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
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function TaskImprovementsPage() {
  const reduceMotion = useReducedMotion();
  const [linkCopied, setLinkCopied] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Активная вкладка встречи: по умолчанию — задачи (фокус прототипа)
  const [activeTab, setActiveTab] = useState<MeetingTab>("tasks");

  // Отчеты: примененные, текущий, генерация (по-отчетно), дропдаун
  const [appliedIds, setAppliedIds] = useState<string[]>([articleReport.id]);
  const [currentId, setCurrentId] = useState(articleReport.id);
  const [generatingIds, setGeneratingIds] = useState<string[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const generateTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const tabsAreaRef = useRef<HTMLDivElement>(null);

  const applied = appliedIds.flatMap((id) => {
    const report = allReports.find((item) => item.id === id);
    return report ? [report] : [];
  });
  const current = allReports.find((report) => report.id === currentId) ?? articleReport;
  // Заглушка — только если генерируется именно текущий отчет: переключение на
  // уже готовый отчет во время чужой генерации показывает готовый контент
  const generating = generatingIds.includes(currentId);

  const startGenerating = (id: string) => {
    setGeneratingIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    const timers = generateTimers.current;
    const existing = timers.get(id);
    if (existing) clearTimeout(existing);
    timers.set(
      id,
      setTimeout(() => {
        setGeneratingIds((prev) => prev.filter((item) => item !== id));
        timers.delete(id);
      }, 3000),
    );
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
    startGenerating(report.id);
  };

  const handleReloadReport = () => {
    setDropdownOpen(false);
    startGenerating(currentId);
  };

  const handleSelectTab = (tab: MeetingTab) => {
    setActiveTab(tab);
    if (tab !== "report") setDropdownOpen(false);
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

  const tasksCopyTextRef = useRef("");
  const [undoVisible, setUndoVisible] = useState(false);
  const undoActionRef = useRef<(() => void) | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (message: string) => {
    setUndoVisible(false);
    setToastMessage(message);
    setToastVisible(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => {
      setToastVisible(false);
      toastTimer.current = null;
    }, 2000);
  };

  // Undo-тост живет дольше обычного (5с) и вытесняет его; новый показ
  // затирает предыдущее отложенное восстановление
  const showUndoToast = (undo: () => void) => {
    setToastVisible(false);
    undoActionRef.current = undo;
    setUndoVisible(true);
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => {
      setUndoVisible(false);
      undoActionRef.current = null;
      undoTimer.current = null;
    }, 5000);
  };

  const handleUndo = () => {
    undoActionRef.current?.();
    undoActionRef.current = null;
    setUndoVisible(false);
    if (undoTimer.current) {
      clearTimeout(undoTimer.current);
      undoTimer.current = null;
    }
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
      if (undoTimer.current) clearTimeout(undoTimer.current);
      generateTimers.current.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  const fadeProps = {
    initial: reduceMotion ? { opacity: 1 } : { opacity: 0, y: 4 },
    animate: { opacity: 1, y: 0 },
    transition: reduceMotion ? { duration: 0 } : { duration: 0.2, ease: [0.23, 1, 0.32, 1] as const },
  };

  return (
    <main className={`${inter.className} h-screen min-h-[720px] w-full overflow-hidden bg-white`} style={{ color: tokens.black }}>
      <div className="flex h-full w-full bg-white">
        <Sidebar />
        <section className="relative flex h-full min-w-0 flex-1 flex-col bg-white">
          <MeetingHeader linkCopied={linkCopied} onCopyLink={handleCopyLink} onAiCopy={handleAiCopy} />
          <div
            className="flex min-h-0 w-full flex-1 flex-col items-center overflow-y-auto"
            style={{ scrollbarGutter: "stable both-edges" }}
          >
            <div className="flex w-[670px] shrink-0 flex-col gap-[16px] pb-[80px] pt-[32px]">
              <div className="flex w-full flex-col gap-[24px]">
                <MeetingInfo />
                <div ref={tabsAreaRef} className="w-full">
                  <ReportTabs
                    current={current}
                    open={dropdownOpen}
                    onToggle={() => setDropdownOpen((value) => !value)}
                    activeTab={activeTab}
                    onSelectTab={handleSelectTab}
                    applied={applied}
                    currentId={currentId}
                    onSelect={handleSelectReport}
                    onReload={handleReloadReport}
                    onClose={() => setDropdownOpen(false)}
                    trailing={
                      activeTab === "tasks" ? (
                        <TasksCopyAllButton textRef={tasksCopyTextRef} onCopied={() => showToast("Задачи скопированы")} />
                      ) : undefined
                    }
                  />
                </div>
              </div>
              <motion.div
                key={
                  activeTab === "tasks"
                    ? "tasks"
                    : activeTab === "transcript"
                      ? "transcript"
                      : generating
                        ? "generating"
                        : `content-${current.id}`
                }
                {...fadeProps}
                className="w-full"
              >
                {activeTab === "tasks" ? (
                  <TasksContent
                    onShowTranscript={() => handleSelectTab("transcript")}
                    onCopied={() => showToast("Задача скопирована")}
                    onDeleted={showUndoToast}
                    registerCopyText={(text) => {
                      tasksCopyTextRef.current = text;
                    }}
                  />
                ) : activeTab === "transcript" ? (
                  <TranscriptContent />
                ) : generating ? (
                  <GeneratingPlaceholder report={current} />
                ) : (
                  <ReportContent report={current} />
                )}
              </motion.div>
            </div>
          </div>
          <CopiedToast visible={toastVisible} message={toastMessage} />
          <UndoToast visible={undoVisible} message="Задача удалена" onUndo={handleUndo} />
        </section>
      </div>
    </main>
  );
}
