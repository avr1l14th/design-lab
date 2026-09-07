"use client";

import { gcAsset } from "./tokens";

// Иконки heroicons 20/solid, отрендеренные в 16×16 через CSS-маску:
// цвет = background-color (currentColor следует за цветом текста родителя)
export type IconName =
  | "chat-bubble-left-right"
  | "paper-clip"
  | "plus"
  | "arrow-up"
  | "sparkles"
  | "bolt"
  | "chart-bar"
  | "book-open"
  | "ellipsis-horizontal"
  | "pencil"
  | "trash"
  | "link"
  | "x-mark"
  | "check"
  | "document-text"
  | "chevron-down"
  | "chevron-right"
  | "chevron-up-down"
  | "magnifying-glass"
  | "stop"
  | "clipboard-document"
  | "arrow-path"
  | "hand-thumb-up"
  | "hand-thumb-down"
  | "lock-closed"
  | "eye"
  | "calendar-days"
  | "arrow-up-tray"
  | "arrow-uturn-left"
  | "users"
  | "clock"
  | "check-circle"
  | "arrow-up-on-square"
  | "document"
  | "photo"
  | "table-cells"
  | "folder"
  | "squares-2x2"
  | "bars-3-bottom-left"
  | "arrow-right"
  | "question-mark-circle"
  | "light-bulb"
  | "funnel"
  | "arrows-pointing-out"
  | "presentation-chart-line"
  | "archive-box-x-mark"
  | "pin"
  // Иконки из макета чата (Figma, секции «Чат» и «Диалог»)
  | "fig-link"
  | "fig-pin"
  | "fig-ellipsis"
  | "fig-filter"
  | "fig-search"
  | "fig-arrow-out"
  | "fig-globe"
  | "fig-globe16"
  | "fig-chat"
  | "fig-paperclip"
  | "fig-sparkles"
  | "fig-plus"
  | "fig-arrow-up"
  | "fig-check"
  | "fig-chart"
  | "fig-bolt"
  | "fig-meetings"
  | "fig-share"
  | "fig-copy"
  | "fig-thumb-up"
  | "fig-pencil"
  | "fig-trash";

export function Ic({
  name,
  size = 16,
  color,
  className = "",
}: {
  name: IconName;
  size?: number;
  color?: string;
  className?: string;
}) {
  const src = gcAsset(`${name}.svg`);
  return (
    <span
      aria-hidden="true"
      className={`block shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: color ?? "currentColor",
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
