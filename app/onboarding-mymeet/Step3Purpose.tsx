import React from "react";
import { OptionGrid } from "./Step1Source";
import { STEP3_ICONS } from "./assets";

export const STEP3_OPTIONS = [
  { id: "transcript", label: "Транскрипт", icon: STEP3_ICONS.transcript, labelWidth: 113 },
  { id: "analytics", label: "Аналитика встреч", icon: STEP3_ICONS.analytics, labelWidth: 118 },
  { id: "tasks", label: "Задачи и договоренности", icon: STEP3_ICONS.tasks, labelNoWrap: true },
  { id: "knowledge", label: "База знаний проектов", icon: STEP3_ICONS.knowledge, labelWidth: 190 },
  { id: "recording", label: "Запись онлайн-встреч", icon: STEP3_ICONS.recording, labelNoWrap: true },
  { id: "other", label: "Другое", icon: STEP3_ICONS.other, iconSize: 20, labelWidth: 109 },
] as const;

export type Step3Id = typeof STEP3_OPTIONS[number]["id"];

/* Multi-select, same as step 2. */
export default function Step3Purpose({
  value,
  onToggle,
}: {
  value: Step3Id[];
  onToggle: (id: Step3Id) => void;
}) {
  return (
    <OptionGrid
      options={STEP3_OPTIONS}
      isSelected={(id) => value.includes(id as Step3Id)}
      onPick={(id) => onToggle(id as Step3Id)}
    />
  );
}
