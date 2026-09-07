// Токены дизайн-системы mymeet.ai (см. design-system/DESIGN_SYSTEM.md)
export const tokens = {
  blue: "#0138C7",
  blueHover: "#0032B1",
  blueDisabled: "#809BE3",
  blueSea: "#E4ECFA",
  blueLightest: "#F6F8FE",
  bgInfo: "#F6F8FE",
  black: "#212833",
  grey: "#818AA3",
  greyHover: "#585E6C",
  greyDisabled: "#C7C8CA", // text/disabled, даты в списках
  placeholder: "#BABBBD", // grey-70 — плейсхолдер композера в макете
  bgPage: "#FFFFFF",
  bgSubtle: "#F7F7F8", // grey-20
  bgLight: "#FAFAFA", // surface/light — ховер строки меню
  grey30: "#F3F3F3", // плашка «+N» в стеке миниатюр
  border: "#EFEFEF", // grey-40
  borderStrong: "#DDDEDF", // grey-50 — рамка чекбокса
  backdrop: "rgba(33, 40, 51, 0.4)",
  red: "#CC3333",
  green: "#0D9655",
  purple: "#8A38F5",
  orange: "#FF9E2C",
  yellow: "#F2C300",
  teal: "#0DACAA",
} as const;

export const BASE = process.env.NODE_ENV === "production" ? "/design-lab" : "";
export const gcAsset = (name: string) => `${BASE}/global-chat/${name}`;
export const sbAsset = (name: string) => `${BASE}/sidebar-menu-update/${name}`;
export const ctaAsset = (name: string) => `${BASE}/b2c-upgrade-cta/${name}`;
export const sfAsset = (name: string) => `${BASE}/search-filters/${name}`;
export const aiAsset = (name: string) => `${BASE}/ai-export-sharing/${name}`;

/** shadow/default из DS — модалки */
export const shadow = "0 0 4px 0 rgba(0, 0, 0, 0.16)";
/** тень поповеров и дропдаунов в макете чата */
export const popoverShadow = "0 0 2px 0 rgba(0, 0, 0, 0.16)";
/** мягкая тень композера в макете */
export const composerShadow = "0 12px 16px 0 rgba(33, 40, 51, 0.04)";

// Свой focus-visible ринг вместо браузерного синего outline
export const focusRingClass = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E4ECFA]";

export const pressableClass =
  "transition-colors duration-[120ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none";

export const easeOut = [0.23, 1, 0.32, 1] as const;
