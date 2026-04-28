import React from "react";
import IconCard from "./IconCard";
import { STEP1_ICONS } from "./assets";
import { useIsMobile } from "./useIsMobile";

/* 6 options in a 3×2 grid, multi-select (matches screens 2-3). */
export const STEP1_OPTIONS = [
  { id: "recommendation", label: "По рекомендации", icon: STEP1_ICONS.rec, labelWidth: 113 },
  { id: "search", label: "Нашёл в поиске", icon: STEP1_ICONS.search, labelWidth: 118 },
  { id: "ai", label: "Ответ нейросети", icon: STEP1_ICONS.ai, labelWidth: 122 },
  { id: "social", label: "Соцсети и другие сайты", icon: STEP1_ICONS.social, labelWidth: 190 },
  { id: "dunno", label: "Не помню", icon: STEP1_ICONS.dunno, labelWidth: 109 },
  { id: "other", label: "Другое", icon: STEP1_ICONS.other, iconSize: 20, labelWidth: 109 },
] as const;

export type Step1Id = typeof STEP1_OPTIONS[number]["id"];

export default function Step1Source({
  value,
  onToggle,
}: {
  value: Step1Id[];
  onToggle: (id: Step1Id) => void;
}) {
  return (
    <OptionGrid
      options={STEP1_OPTIONS}
      isSelected={(id) => value.includes(id as Step1Id)}
      onPick={(id) => onToggle(id as Step1Id)}
    />
  );
}

interface OptionGridProps<T extends { id: string; label: string; icon: string; iconSize?: number; labelWidth?: number }> {
  options: readonly T[];
  isSelected: (id: string) => boolean;
  onPick: (id: string) => void;
}

export function OptionGrid<T extends { id: string; label: string; icon: string; iconSize?: number; labelWidth?: number; labelNoWrap?: boolean }>({
  options,
  isSelected,
  onPick,
}: OptionGridProps<T>) {
  const isMobile = useIsMobile();
  /* Desktop: 3 columns × 2 rows (Figma). Mobile: 2 columns × 3 rows. */
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, auto)",
        gap: 12,
        width: isMobile ? "100%" : "auto",
      }}
    >
      {options.map((opt) => (
        <IconCard
          key={opt.id}
          icon={opt.icon}
          iconSize={opt.iconSize}
          label={opt.label}
          labelWidth={isMobile ? undefined : opt.labelWidth}
          labelNoWrap={isMobile ? false : opt.labelNoWrap}
          selected={isSelected(opt.id)}
          onClick={() => onPick(opt.id)}
        />
      ))}
    </div>
  );
}
