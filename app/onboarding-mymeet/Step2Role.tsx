import React from "react";
import { OptionGrid } from "./Step1Source";
import { STEP2_ICONS } from "./assets";

export const STEP2_OPTIONS = [
  { id: "product", label: "Продукт", icon: STEP2_ICONS.product, labelWidth: 113 },
  { id: "sales", label: "Продажи", icon: STEP2_ICONS.sales, labelWidth: 118 },
  { id: "research", label: "Исследования", icon: STEP2_ICONS.research, labelWidth: 122 },
  { id: "hr", label: "HR/Рекрутмент", icon: STEP2_ICONS.hr, labelWidth: 190 },
  { id: "marketing", label: "Маркетинг", icon: STEP2_ICONS.marketing, labelWidth: 109 },
  { id: "other", label: "Другое", icon: STEP2_ICONS.other, iconSize: 20, labelWidth: 109 },
] as const;

export type Step2Id = typeof STEP2_OPTIONS[number]["id"];

/* Figma screen shows multiple cards selected → multi-select. */
export default function Step2Role({
  value,
  onToggle,
}: {
  value: Step2Id[];
  onToggle: (id: Step2Id) => void;
}) {
  return (
    <OptionGrid
      options={STEP2_OPTIONS}
      isSelected={(id) => value.includes(id as Step2Id)}
      onPick={(id) => onToggle(id as Step2Id)}
    />
  );
}
