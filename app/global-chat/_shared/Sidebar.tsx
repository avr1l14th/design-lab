"use client";

import { useState, type ReactNode } from "react";
import { Ic } from "./icons";
import { ctaAsset, focusRingClass, pressableClass, sbAsset, tokens } from "./tokens";

// Сайдбар — переиспользован из task-improvements (sidebar-menu-update + CTA из
// b2c-upgrade-cta). По макету чата пункт «Чат» — первый в навигации.

export type NavKey = "meetings" | "chat" | "reports" | "integrations" | "settings";

type Item = { key?: NavKey; label: string; icon: string; custom?: boolean };

const primaryItems: Item[] = [
  { key: "chat", label: "Чат", icon: "fig-chat", custom: true },
  { key: "meetings", label: "Встречи", icon: "meetings.svg" },
  { key: "reports", label: "AI Отчеты", icon: "ai-reports.svg" },
  { key: "integrations", label: "Интеграции", icon: "integrations.svg" },
  { key: "settings", label: "Настройки", icon: "settings-figma.svg" },
];

const resourceItems: Item[] = [
  { label: "База знаний", icon: "knowledge.svg" },
  { label: "Поддержка", icon: "support.svg" },
  { label: "Бесплатные минуты", icon: "gift.svg" },
  { label: "Телеграм-бот", icon: "tg.svg" },
];

function SbIcon({ name, size = 16 }: { name: string; size?: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={sbAsset(name)} alt="" width={size} height={size} className="shrink-0" />;
}

function MenuIcon({ name, active }: { name: string; active?: boolean }) {
  const src = sbAsset(name);
  return (
    <span
      aria-hidden="true"
      className={`h-[16px] w-[16px] shrink-0 ${active ? "bg-[#212833]" : "bg-[#818AA3] group-hover:bg-[#585E6C]"} ${pressableClass}`}
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

export function SidebarMenuItem({
  item,
  active,
  onClick,
  trailing,
}: {
  item: Item;
  active?: boolean;
  onClick?: () => void;
  trailing?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full items-center justify-between rounded-[3px] p-[6px] text-left hover:bg-[#F7F7F8] ${active ? "bg-[#F7F7F8]" : ""} ${pressableClass} ${focusRingClass}`}
    >
      <span className="flex items-center gap-[6px]">
        <span className="flex h-[16px] w-[16px] shrink-0 items-center justify-center">
          {item.custom ? (
            <span className={`flex text-[#818AA3] group-hover:text-[#585E6C] ${pressableClass}`}>
              <Ic name="fig-chat" />
            </span>
          ) : (
            <MenuIcon name={item.icon} active={active} />
          )}
        </span>
        <span className="text-[13px] font-normal leading-[16px] tracking-[-0.13px]" style={{ color: tokens.black }}>
          {item.label}
        </span>
      </span>
      {trailing}
    </button>
  );
}

export function SectionChevron({ expanded }: { expanded: boolean }) {
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

export function SidebarGroupTitle({ title, expanded, onToggle }: { title: string; expanded: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      aria-expanded={expanded}
      onClick={onToggle}
      className={`group flex w-full items-center rounded-[3px] p-[6px] text-left hover:bg-[#F7F7F8] ${pressableClass} ${focusRingClass}`}
    >
      <span className="flex items-center gap-px">
        <span className="text-[12px] font-medium leading-[normal] tracking-[-0.24px]" style={{ color: tokens.grey }}>
          {title}
        </span>
        <SectionChevron expanded={expanded} />
      </span>
    </button>
  );
}

function MenuGroup({ title, items, active }: { title?: string; items: Item[]; active?: NavKey }) {
  const [expanded, setExpanded] = useState(true);
  return (
    <div className="flex w-full flex-col gap-px">
      {title && <SidebarGroupTitle title={title} expanded={expanded} onToggle={() => setExpanded((v) => !v)} />}
      {(!title || expanded) && items.map((item) => <SidebarMenuItem key={item.label} item={item} active={item.key !== undefined && item.key === active} />)}
    </div>
  );
}

function ArrowUpCircle({ size, animated = false }: { size: number; animated?: boolean }) {
  return (
    <div className="relative shrink-0 overflow-hidden rounded-full" style={{ width: size, height: size, backgroundColor: tokens.blue }}>
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
        <span className="whitespace-nowrap text-[13px] font-medium leading-none" style={{ color: tokens.blue, letterSpacing: "-0.13px" }}>
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

/**
 * Основной сайдбар приложения.
 * `chatSlot` — то, что рендерится сразу под пунктом «Чат» (вариант с диалогами в сайдбаре).
 */
export function Sidebar({ active = "chat", chatSlot }: { active?: NavKey; chatSlot?: ReactNode }) {
  return (
    <aside className="flex h-full w-[280px] shrink-0 flex-col justify-between border-r bg-white" style={{ borderColor: tokens.border }}>
      <div className="flex min-h-0 w-full flex-1 flex-col">
        <div className="flex h-[54px] w-full shrink-0 items-center border-b bg-white pl-[10px] pr-[16px]" style={{ borderColor: tokens.border }}>
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
                <SbIcon name="chevron-down.svg" />
              </span>
            </span>
          </button>
        </div>

        <div className="flex min-h-0 w-full flex-1 flex-col gap-[12px] overflow-y-auto p-[16px]">
          <button
            type="button"
            className={`flex h-[36px] w-full shrink-0 items-center justify-between rounded-[4px] px-[12px] py-[10px] hover:bg-[#0032B1] ${pressableClass}`}
            style={{ backgroundColor: tokens.blue }}
          >
            <span className="text-[13px] font-medium leading-[normal] tracking-[-0.13px] text-white">Добавить встречу</span>
            <SbIcon name="add.svg" />
          </button>

          <div className="flex w-full flex-col gap-px">
            {primaryItems.map((item) => (
              <div key={item.label} className="flex flex-col gap-px">
                <SidebarMenuItem item={item} active={item.key !== undefined && item.key === active} />
                {item.key === "chat" && chatSlot}
              </div>
            ))}
          </div>
          <MenuGroup title="Ресурсы" items={resourceItems} />
        </div>
      </div>

      <div className="flex w-full shrink-0 flex-col">
        <UpgradePlanCTA />
        <div className="flex w-full flex-col items-center justify-center gap-[8px] border-t px-[16px] py-[12px]" style={{ borderColor: tokens.border }}>
          <div className="flex w-full items-end justify-between whitespace-nowrap">
            <span className="text-[13px] font-medium tracking-[-0.13px]" style={{ color: tokens.black }}>
              Free
            </span>
            <span className="text-[12px] font-medium tracking-[-0.24px]" style={{ color: tokens.black }}>
              Доступно 100 из 180
            </span>
          </div>
          <div className="relative h-[6px] w-full overflow-hidden rounded-full" style={{ backgroundColor: tokens.blueSea }}>
            <div className="h-full w-[55.6%]" style={{ backgroundColor: tokens.blue }} />
          </div>
        </div>
      </div>
    </aside>
  );
}
