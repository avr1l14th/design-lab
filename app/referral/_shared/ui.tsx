"use client";

import { rfAsset } from "./tokens";

export { Button, ToastHost, avatarColor, useOutsideClose, useToast } from "../../global-chat/_shared/ui";

export type RfIconName =
  | "gift"
  | "paper-airplane"
  | "receipt-percent"
  | "check"
  | "clipboard-document"
  | "trophy"
  | "ticket"
  | "user-plus"
  | "envelope"
  | "chevron-down"
  | "arrow-path"
  | "link"
  | "x-mark"
  | "sparkles"
  | "arrow-right"
  | "lock-closed";

/** Иконка heroicons 20/solid, отрисованная через маску — цвет берет из currentColor */
export function RfIc({ name, size = 16, className = "" }: { name: RfIconName; size?: number; className?: string }) {
  const src = rfAsset(`${name}.svg`);
  return (
    <span
      aria-hidden="true"
      className={`block shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: "currentColor",
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
