"use client";

import { useId } from "react";
import type { Mode } from "./data";

/**
 * Аватары режимов — варианты для выбора. Все SVG в viewBox 32×32, тело в currentColor (цвет режима),
 * глаза белые или графитовые (#212833). Размер задается через size, как у иконок.
 */

const INK = "#212833";

type AvatarProps = { mode: Mode; size?: number; className?: string };

function Svg({ size = 32, className = "", children }: { size?: number; className?: string; children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={`block shrink-0 ${className}`} aria-hidden="true">
      {children}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// A. Блобы — мягкие тела разной формы, белые щели-глаза (как у Grok Bot)
// ─────────────────────────────────────────────────────────────────────────────

const BLOB_BODY: Record<Mode, React.ReactNode> = {
  // облако: три бугра
  auto: <path d="M10.5 25C6.5 25 4.5 21 6.5 18.2 4.5 14.5 8 10.5 12 11.5 13.5 7.5 19.5 7 21.5 11 26 10.5 28.5 16 25.5 18.5 27 22 24 26 20.5 24.5 18 27 13 27 10.5 25Z" fill="currentColor" />,
  // галька: наклоненный овал
  ask: <path d="M17.5 5.5C24 5.5 27.5 11.5 26.5 17.5 25.5 24 19.5 27.5 13.5 26 7 24.5 3.5 17.5 6.5 11.5 8.5 7.5 12.5 5.5 17.5 5.5Z" fill="currentColor" />,
  // шестиугольник со скругленными углами (обводка тем же цветом)
  analytics: <path d="M16 5L26 10.8V21.2L16 27L6 21.2V10.8L16 5Z" fill="currentColor" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />,
  // скругленный квадрат
  kb: <rect x="5" y="5" width="22" height="22" rx="8" fill="currentColor" />,
};

function BlobEyes({ mode }: { mode: Mode }) {
  // авто и база — спокойные щели, спросить — одна бровь приподнята (глаз выше), аналитика — прищур
  if (mode === "analytics") {
    return (
      <>
        <rect x="11.5" y="14.5" width="3" height="4" rx="1.5" fill="#fff" />
        <rect x="17.5" y="14.5" width="3" height="4" rx="1.5" fill="#fff" />
      </>
    );
  }
  if (mode === "ask") {
    return (
      <>
        <rect x="12" y="13" width="3" height="6.5" rx="1.5" fill="#fff" />
        <rect x="18" y="11.5" width="3" height="6.5" rx="1.5" fill="#fff" transform="rotate(8 19.5 14.75)" />
      </>
    );
  }
  return (
    <>
      <rect x="12" y="13" width="3" height="6.5" rx="1.5" fill="#fff" />
      <rect x="17" y="13" width="3" height="6.5" rx="1.5" fill="#fff" />
    </>
  );
}

export function AvatarBlob({ mode, size, className }: AvatarProps) {
  return (
    <Svg size={size} className={className}>
      {BLOB_BODY[mode]}
      <BlobEyes mode={mode} />
    </Svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// L. Из логотипа — круг с рукописной «m». Геометрия 800×800 как в исходнике: горбы «m» на (245,300) и (575,185),
// просвет между ножками около (375,610) — туда ложатся глаза и рот
// ─────────────────────────────────────────────────────────────────────────────

/** Контур логотипа: круг с вырезанной «m» (из Logo.svg) */
const LOGO_HOLE = "M400 0C620.914 0 800 179.086 800 400C800 620.914 620.914 800 400 800C256.15 800 130.053 724.055 59.5703 610.083C68.8437 585.373 79.2495 560.328 90.7959 534.961C109.771 492.831 131.524 453.577 156.079 417.212C181.194 380.401 208.283 349.808 237.305 325.415C240.094 333.84 242.048 343.82 243.164 355.347C244.838 366.431 245.678 378.403 245.679 391.26C245.679 419.198 243.429 449.582 238.965 482.397C235.058 515.217 224.936 558.105 217.871 575.049C210.809 591.986 209.103 595.633 204.639 608.936C200.175 621.791 193.777 634.97 193.774 642.065C193.774 652.706 197.388 660.694 204.639 666.016C211.893 670.893 219.434 673.339 227.246 673.34C236.175 673.34 245.668 670.461 255.713 664.697C265.759 658.932 274.138 648.718 280.835 634.082C319.902 537.401 363.157 452.689 410.596 379.956C458.593 306.78 510.77 248.899 567.139 206.323C569.371 213.862 570.78 221.848 571.338 230.273C572.454 238.7 572.998 247.356 572.998 256.226C572.998 282.39 569.66 311.215 562.964 342.7C556.267 373.744 547.319 405.899 536.157 439.16C525.553 472.423 514.11 505.031 501.831 536.963C490.113 568.888 478.689 598.823 467.529 626.758C462.506 640.506 459.985 652.495 459.985 662.695C459.986 680.432 463.324 692.855 470.02 699.951C477.273 707.045 485.93 710.593 495.972 710.596C505.46 710.596 513.566 707.934 520.264 702.612C526.959 697.291 533.364 688.415 539.502 676.001C548.989 655.602 560.164 631.212 572.998 602.832C586.391 574.007 599.222 542.064 611.499 507.031C624.335 471.995 634.963 434.735 643.335 395.264C651.707 355.792 655.884 315.2 655.884 273.511C655.883 229.607 648.345 197.451 633.276 177.051C618.209 156.211 598.677 145.803 574.683 145.801C553.474 145.801 530.859 153.545 506.86 169.067C482.862 184.59 458.862 205.665 434.863 232.275C410.866 258.885 387.976 289.049 366.211 322.754C345.006 356.012 326.315 390.38 310.132 425.854V405.908C310.132 373.976 308.451 348.465 305.103 329.395C302.312 309.887 297.861 295.47 291.724 286.157C285.585 276.401 278.317 269.975 269.946 266.87C261.575 263.766 252.084 262.207 241.479 262.207C225.295 262.208 207.152 269.76 187.061 284.839C166.972 299.917 146.327 319.871 125.122 344.702C104.474 369.093 84.3762 396.143 64.8438 425.854C46.8096 453.673 30.3172 481.717 15.3076 509.937C5.34424 475.006 0 438.128 0 400C0 179.086 179.086 0 400 0Z";

function LogoSvg({ size = 32, className = "", children }: { size?: number; className?: string; children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 800 800" fill="none" xmlns="http://www.w3.org/2000/svg" className={`block shrink-0 ${className}`} aria-hidden="true">
      {children}
    </svg>
  );
}

/** Лицо на «m»: глаза на горбах, рот в просвете между ножками. color — цвет деталей */
function LogoFace({ mode, color, glasses = color }: { mode: Mode; color: string; glasses?: string | null }) {
  const sw = 34;
  if (mode === "ask") {
    return (
      <>
        <circle cx="245" cy="300" r="34" fill={color} />
        <circle cx="575" cy="185" r="44" fill={color} />
        <path d="M520 95c40-28 90-28 130 0" stroke={color} strokeWidth={sw} strokeLinecap="round" />
        <circle cx="378" cy="615" r="36" fill={color} />
      </>
    );
  }
  if (mode === "analytics") {
    return (
      <>
        {glasses && (
          <>
            <rect x="165" y="245" width="160" height="110" rx="34" stroke={glasses} strokeWidth={sw} />
            <rect x="495" y="130" width="160" height="110" rx="34" stroke={glasses} strokeWidth={sw} />
            <path d="M325 290l170-64" stroke={glasses} strokeWidth={sw} strokeLinecap="round" />
          </>
        )}
        <rect x="215" y="285" width="60" height="30" rx="15" fill={color} />
        <rect x="545" y="170" width="60" height="30" rx="15" fill={color} />
        <path d="M320 612h116" stroke={color} strokeWidth={sw} strokeLinecap="round" />
      </>
    );
  }
  if (mode === "kb") {
    return (
      <>
        {glasses && (
          <>
            <circle cx="245" cy="300" r="74" stroke={glasses} strokeWidth={sw} />
            <circle cx="575" cy="185" r="74" stroke={glasses} strokeWidth={sw} />
            <path d="M318 275l184-64" stroke={glasses} strokeWidth={sw} strokeLinecap="round" />
          </>
        )}
        <circle cx="245" cy="300" r="26" fill={color} />
        <circle cx="575" cy="185" r="26" fill={color} />
        <path d="M318 600c40 40 80 40 120 0" stroke={color} strokeWidth={sw} strokeLinecap="round" />
      </>
    );
  }
  return (
    <>
      <circle cx="245" cy="300" r="34" fill={color} />
      <circle cx="575" cy="185" r="34" fill={color} />
      <path d="M312 598c44 46 88 46 132 0" stroke={color} strokeWidth={sw} strokeLinecap="round" />
    </>
  );
}

/** L1. Логотип в цвете режима, белая «m», лицо графитом */
export function AvatarLogoFace({ mode, size, className }: AvatarProps) {
  return (
    <LogoSvg size={size} className={className}>
      <circle cx="400" cy="400" r="400" fill="#fff" />
      <path d={LOGO_HOLE} fill="currentColor" />
      <LogoFace mode={mode} color={INK} />
    </LogoSvg>
  );
}

/** L2. Только «m» в цвете режима, без круга, лицо графитом — как закорючки с рефов */
export function AvatarLogoM({ mode, size, className }: AvatarProps) {
  // Маска: круг чуть меньше внешнего контура (396 вместо 400), иначе по краю оставался волосяной шов от антиалиасинга
  const id = useId();
  return (
    <LogoSvg size={size} className={className}>
      <mask id={id} maskUnits="userSpaceOnUse" x="0" y="0" width="800" height="800">
        <circle cx="400" cy="400" r="396" fill="#fff" />
        <path d={LOGO_HOLE} fill="#000" />
      </mask>
      <rect width="800" height="800" fill="currentColor" mask={`url(#${id})`} />
      <LogoFace mode={mode} color={INK} />
    </LogoSvg>
  );
}

/** L3. Логотип в цвете режима, детали лица тем же цветом на белой «m» — без графита, монохром */
export function AvatarLogoTint({ mode, size, className }: AvatarProps) {
  return (
    <LogoSvg size={size} className={className}>
      <circle cx="400" cy="400" r="400" fill="#fff" />
      <path d={LOGO_HOLE} fill="currentColor" />
      <LogoFace mode={mode} color="currentColor" glasses={null} />
    </LogoSvg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// A2. Блобы mymeet — те же мягкие тела, но лицо свое: круглые глаза и улыбка формой «m» из лого.
// Отличие от Grok Bot: там только две вертикальные щели, здесь глаза-точки и фирменный рот
// ─────────────────────────────────────────────────────────────────────────────

const PILLOW_BODY: Record<Mode, React.ReactNode> = {
  // подушка: широкий скругленный прямоугольник с легким наклоном
  auto: <rect x="4" y="7" width="24" height="19" rx="9.5" fill="currentColor" transform="rotate(-6 16 16.5)" />,
  ask: BLOB_BODY.ask,
  analytics: BLOB_BODY.analytics,
  kb: BLOB_BODY.kb,
};

/** Улыбка формой «m» (перевернутой): две мягкие волны */
function MSmile({ cx = 16, cy = 20.5, w = 7, color = "#fff", weight = 1.8 }: { cx?: number; cy?: number; w?: number; color?: string; weight?: number }) {
  const h = w / 2;
  return <path d={`M${cx - h} ${cy}q${h / 2} ${h * 0.7} ${h} 0q${h / 2} ${h * 0.7} ${h} 0`} stroke={color} strokeWidth={weight} strokeLinecap="round" fill="none" />;
}

function PillowFace({ mode }: { mode: Mode }) {
  if (mode === "ask") {
    return (
      <>
        <circle cx="12" cy="15" r="2" fill="#fff" />
        <circle cx="20.5" cy="14" r="2.6" fill="#fff" />
        <MSmile cx={16.5} cy={20.5} w={6} />
      </>
    );
  }
  if (mode === "analytics") {
    return (
      <>
        <rect x="9.5" y="14" width="4.5" height="2.2" rx="1.1" fill="#fff" />
        <rect x="18" y="14" width="4.5" height="2.2" rx="1.1" fill="#fff" />
        <MSmile cx={16} cy={20} w={6} />
      </>
    );
  }
  if (mode === "kb") {
    return (
      <>
        <circle cx="12" cy="15" r="2.4" stroke="#fff" strokeWidth="1.5" />
        <circle cx="20" cy="15" r="2.4" stroke="#fff" strokeWidth="1.5" />
        <path d="M14.4 15h3.2" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
        <MSmile cx={16} cy={21} w={6} />
      </>
    );
  }
  return (
    <>
      <circle cx="12" cy="15" r="2" fill="#fff" />
      <circle cx="20" cy="15" r="2" fill="#fff" />
      <MSmile cx={16} cy={20.5} w={7} />
    </>
  );
}

export function AvatarPillow({ mode, size, className }: AvatarProps) {
  return (
    <Svg size={size} className={className}>
      {PILLOW_BODY[mode]}
      <PillowFace mode={mode} />
    </Svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// A3. Блобы с завитком — сверху маленькая петля из лого, как хохолок. Глаза белые точки, рта нет:
// характер задают тело и завиток, а не выражение
// ─────────────────────────────────────────────────────────────────────────────

const CURL_BODY: Record<Mode, React.ReactNode> = {
  auto: <rect x="4" y="10" width="24" height="18" rx="9" fill="currentColor" />,
  ask: <path d="M17.5 8C24 8 27.5 13.5 26.5 19 25.5 25 19.5 28.5 13.5 27 7 25.5 3.5 19 6.5 13.5 8.5 10 12.5 8 17.5 8Z" fill="currentColor" />,
  analytics: <path d="M16 8L26 13.6V24.4L16 30 6 24.4V13.6L16 8Z" fill="currentColor" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />,
  kb: <rect x="5" y="8" width="22" height="20" rx="7" fill="currentColor" />,
};

export function AvatarCurl({ mode, size, className }: AvatarProps) {
  // завиток: короткий стебель из верхней кромки тела и открытая петля на нем, у каждого режима свой наклон
  const curl: Record<Mode, { stem: string; cx: number; cy: number }> = {
    auto: { stem: "M16.5 10.6Q17.4 7.6 19.3 6.4", cx: 21.3, cy: 5.6 },
    ask: { stem: "M15 8.8Q15.4 5.6 17.4 4.6", cx: 19.5, cy: 4.2 },
    analytics: { stem: "M16.4 9.2Q17.4 6.2 19.4 5.2", cx: 21.4, cy: 4.5 },
    kb: { stem: "M16.5 8.6Q17.4 5.6 19.3 4.6", cx: 21.3, cy: 4 },
  };
  const c = curl[mode];
  const eyes: Record<Mode, React.ReactNode> = {
    auto: (
      <>
        <circle cx="12" cy="19" r="2" fill="#fff" />
        <circle cx="20" cy="19" r="2" fill="#fff" />
      </>
    ),
    ask: (
      <>
        <circle cx="12" cy="18" r="2" fill="#fff" />
        <circle cx="20.5" cy="17" r="2.6" fill="#fff" />
      </>
    ),
    analytics: (
      <>
        <rect x="9.5" y="18" width="4.5" height="2.2" rx="1.1" fill="#fff" />
        <rect x="18" y="18" width="4.5" height="2.2" rx="1.1" fill="#fff" />
      </>
    ),
    kb: (
      <>
        <circle cx="12" cy="18" r="2.4" stroke="#fff" strokeWidth="1.5" />
        <circle cx="20" cy="18" r="2.4" stroke="#fff" strokeWidth="1.5" />
        <path d="M14.4 18h3.2" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
      </>
    ),
  };
  return (
    <Svg size={size} className={className}>
      <path d={c.stem} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <circle cx={c.cx} cy={c.cy} r="2.3" stroke="currentColor" strokeWidth="2.2" fill="none" />
      {CURL_BODY[mode]}
      {eyes[mode]}
    </Svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// B. Закорючки — одна линия в духе «m» из логотипа, точки-глаза и улыбка графитом
// ─────────────────────────────────────────────────────────────────────────────

const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 3, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export function AvatarSquiggle({ mode, size, className }: AvatarProps) {
  return (
    <Svg size={size} className={className}>
      {mode === "auto" && (
        <>
          {/* петли рукописной «m», как в лого (пролат-циклоида), лицо под ними */}
          <path d="M8.0 9.3 L7.7 8.3 L7.2 7.5 L6.6 7.1 L5.9 7.0 L5.3 7.3 L4.8 7.8 L4.3 8.7 L4.1 9.8 L4.0 11.1 L4.2 12.5 L4.6 14.0 L5.3 15.4 L6.2 16.6 L7.2 17.6 L8.5 18.4 L9.8 18.9 L11.2 19.0 L12.6 18.8 L13.9 18.2 L15.1 17.4 L16.2 16.3 L17.0 15.0 L17.6 13.6 L18.0 12.2 L18.1 10.8 L18.0 9.5 L17.7 8.5 L17.2 7.7 L16.6 7.2 L16.0 7.0 L15.4 7.2 L14.8 7.7 L14.3 8.5 L14.0 9.5 L13.9 10.8 L14.0 12.2 L14.4 13.6 L15.0 15.0 L15.8 16.3 L16.9 17.4 L18.1 18.2 L19.4 18.8 L20.8 19.0 L22.2 18.9 L23.5 18.4 L24.8 17.6 L25.8 16.6 L26.7 15.4 L27.4 14.0 L27.8 12.5 L28.0 11.1 L27.9 9.8 L27.7 8.7 L27.2 7.8 L26.7 7.3 L26.1 7.0 L25.4 7.1 L24.8 7.5 L24.3 8.3 L24.0 9.3" {...stroke} strokeWidth="2.8" />
          <circle cx="13.5" cy="25.5" r="1.6" fill={INK} />
          <circle cx="18.5" cy="25.5" r="1.6" fill={INK} />
          <path d="M14.6 28.6c.8.7 2 .7 2.8 0" stroke={INK} strokeWidth="1.5" strokeLinecap="round" fill="none" />
        </>
      )}
      {mode === "ask" && (
        <>
          {/* одна петля-завиток, как знак вопроса */}
          <path d="M9 12C10 7 19 5 22 9.5 25 14 20 17.5 17 19.5 15.5 20.5 16 22 16 22.5" {...stroke} />
          <circle cx="16" cy="28" r="1.8" fill="currentColor" />
          <circle cx="12" cy="13" r="1.6" fill={INK} />
          <circle cx="17.5" cy="11.5" r="1.6" fill={INK} />
        </>
      )}
      {mode === "analytics" && (
        <>
          {/* растущие арки — «m», которая идет вверх, как график */}
          <path d="M5 26V20c0-4 6-4 6 0v6M11 26V15c0-5 7-5 7 0v11M18 26V10c0-6 9-6 9 0v16" {...stroke} />
          <circle cx="21" cy="15" r="1.6" fill={INK} />
          <circle cx="25" cy="15" r="1.6" fill={INK} />
        </>
      )}
      {mode === "kb" && (
        <>
          {/* «m» на строчке, как в раскрытой книге */}
          <path d="M6 21v-5c0-4 5.5-4 5.5 0v5M11.5 21v-5c0-4 5.5-4 5.5 0v5M17 21v-5c0-4 5.5-4 5.5 0v5" {...stroke} />
          <path d="M4 26h24" {...stroke} />
          <circle cx="12.2" cy="12.2" r="1.5" fill={INK} />
          <circle cx="16.8" cy="12.2" r="1.5" fill={INK} />
        </>
      )}
    </Svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// C. Плитки с характером — форма и выражение глаз задают режим
// ─────────────────────────────────────────────────────────────────────────────

const sparkle = (cx: number, cy: number, r: number) =>
  `M${cx} ${cy - r} C${cx + r * 0.14} ${cy - r * 0.35} ${cx + r * 0.35} ${cy - r * 0.14} ${cx + r} ${cy} C${cx + r * 0.35} ${cy + r * 0.14} ${cx + r * 0.14} ${cy + r * 0.35} ${cx} ${cy + r} C${cx - r * 0.14} ${cy + r * 0.35} ${cx - r * 0.35} ${cy + r * 0.14} ${cx - r} ${cy} C${cx - r * 0.35} ${cy - r * 0.14} ${cx - r * 0.14} ${cy - r * 0.35} ${cx} ${cy - r}Z`;

export function AvatarTile({ mode, size, className }: AvatarProps) {
  return (
    <Svg size={size} className={className}>
      {mode === "auto" && (
        <>
          <rect x="4" y="4" width="24" height="24" rx="9" fill="currentColor" />
          <path d={sparkle(11.5, 14.5, 3.4)} fill="#fff" />
          <path d={sparkle(20.5, 14.5, 3.4)} fill="#fff" />
          <path d="M13 21.5c1.6 1.6 4.4 1.6 6 0" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
        </>
      )}
      {mode === "ask" && (
        <>
          <circle cx="16" cy="16" r="12" fill="currentColor" />
          <circle cx="11.5" cy="15" r="2.7" fill="#fff" />
          <circle cx="20.5" cy="14" r="2.7" fill="#fff" />
          <circle cx="12" cy="14.3" r="1.2" fill={INK} />
          <circle cx="21" cy="13.3" r="1.2" fill={INK} />
          {/* поднятая бровь */}
          <path d="M18 9.5c1.4-1 3.4-1 4.8.2" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="16" cy="21.5" r="1.6" fill="#fff" />
        </>
      )}
      {mode === "analytics" && (
        <>
          <path d="M16 3.5L27 9.8V22.2L16 28.5L5 22.2V9.8L16 3.5Z" fill="currentColor" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
          {/* очки-прямоугольники и сосредоточенный взгляд */}
          <rect x="7.5" y="11.5" width="7.5" height="6" rx="2" stroke="#fff" strokeWidth="1.6" />
          <rect x="17" y="11.5" width="7.5" height="6" rx="2" stroke="#fff" strokeWidth="1.6" />
          <path d="M15 14.5h2" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
          <rect x="9.8" y="13.6" width="3" height="1.8" rx="0.9" fill="#fff" />
          <rect x="19.3" y="13.6" width="3" height="1.8" rx="0.9" fill="#fff" />
          <path d="M13.5 22h5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
        </>
      )}
      {mode === "kb" && (
        <>
          <rect x="4" y="5" width="24" height="22" rx="6" fill="currentColor" />
          {/* круглые очки */}
          <circle cx="11.5" cy="14.5" r="3.6" stroke="#fff" strokeWidth="1.6" />
          <circle cx="20.5" cy="14.5" r="3.6" stroke="#fff" strokeWidth="1.6" />
          <path d="M15.1 14.5h1.8" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="11.5" cy="14.5" r="1.3" fill="#fff" />
          <circle cx="20.5" cy="14.5" r="1.3" fill="#fff" />
          <path d="M13.5 21.5c1.4 1.3 3.6 1.3 5 0" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
        </>
      )}
    </Svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// D. Шарики — объемные сферы с мягким бликом, лица графитом
// ─────────────────────────────────────────────────────────────────────────────

export function AvatarSphere({ mode, size, className }: AvatarProps) {
  const id = `sph-${mode}`;
  return (
    <Svg size={size} className={className}>
      <defs>
        <radialGradient id={id} cx="0.35" cy="0.3" r="0.75">
          <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="0.55" stopColor="#fff" stopOpacity="0.08" />
          <stop offset="1" stopColor="#000" stopOpacity="0.14" />
        </radialGradient>
      </defs>
      <circle cx="16" cy="16" r="13" fill="currentColor" />
      <circle cx="16" cy="16" r="13" fill={`url(#${id})`} />
      {mode === "auto" && (
        <>
          {/* довольные глаза-дуги */}
          <path d="M9.5 16c1-1.8 3-1.8 4 0M18.5 16c1-1.8 3-1.8 4 0" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M13 20.5c1.8 1.6 4.2 1.6 6 0" stroke={INK} strokeWidth="1.6" strokeLinecap="round" />
        </>
      )}
      {mode === "ask" && (
        <>
          <circle cx="11.5" cy="15" r="1.7" fill={INK} />
          <circle cx="20.5" cy="14" r="1.7" fill={INK} />
          <path d="M18.3 10.2c1.3-.9 3-.9 4.2.2" stroke={INK} strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="16" cy="21" r="1.7" fill={INK} />
        </>
      )}
      {mode === "analytics" && (
        <>
          {/* прямоугольные очки — язык «аналитики» во всех наборах */}
          <rect x="7.5" y="12" width="7.5" height="6" rx="2" stroke={INK} strokeWidth="1.5" />
          <rect x="17" y="12" width="7.5" height="6" rx="2" stroke={INK} strokeWidth="1.5" />
          <path d="M15 15h2" stroke={INK} strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="11.25" cy="15" r="1.2" fill={INK} />
          <circle cx="20.75" cy="15" r="1.2" fill={INK} />
          <path d="M13.5 21.5c1.5 1.2 3.5 1.2 5 0" stroke={INK} strokeWidth="1.6" strokeLinecap="round" />
        </>
      )}
      {mode === "kb" && (
        <>
          <circle cx="11.5" cy="15" r="3.2" stroke={INK} strokeWidth="1.5" />
          <circle cx="20.5" cy="15" r="3.2" stroke={INK} strokeWidth="1.5" />
          <path d="M14.7 15h2.6" stroke={INK} strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="11.5" cy="15" r="1.2" fill={INK} />
          <circle cx="20.5" cy="15" r="1.2" fill={INK} />
          <path d="M13.5 21c1.5 1.2 3.5 1.2 5 0" stroke={INK} strokeWidth="1.6" strokeLinecap="round" />
        </>
      )}
    </Svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// E. Дудлы — только линия цветом режима, дрожащий круг лица и деталь режима
// ─────────────────────────────────────────────────────────────────────────────

const doodle = { fill: "none", stroke: "currentColor", strokeWidth: 2.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export function AvatarDoodle({ mode, size, className }: AvatarProps) {
  return (
    <Svg size={size} className={className}>
      {/* слегка неровный круг */}
      <path d="M16.5 5C22.5 4.5 27.5 9.5 27 15.5 26.5 22 22 27.5 15.5 27 9.5 26.5 4.5 21.5 5 15.5 5.5 9.5 10.5 5.5 16.5 5Z" {...doodle} />
      {mode === "auto" && (
        <>
          <circle cx="12.5" cy="14.5" r="1.6" fill="currentColor" />
          <circle cx="19.5" cy="14.5" r="1.6" fill="currentColor" />
          <path d="M12.5 20c2 2 5 2 7 0" {...doodle} strokeWidth="2" />
          <path d="M27 2.5v3.6M25.2 4.3h3.6" {...doodle} strokeWidth="1.8" />
        </>
      )}
      {mode === "ask" && (
        <>
          <circle cx="12.5" cy="14" r="1.6" fill="currentColor" />
          <circle cx="19.5" cy="13" r="1.6" fill="currentColor" />
          <circle cx="16" cy="20.5" r="1.7" {...doodle} strokeWidth="1.8" />
          <path d="M17.5 9.5c1.2-1 2.8-1 4 .2" {...doodle} strokeWidth="1.8" />
        </>
      )}
      {mode === "analytics" && (
        <>
          <rect x="8" y="12" width="7" height="5.5" rx="1.8" {...doodle} strokeWidth="1.8" />
          <rect x="17" y="12" width="7" height="5.5" rx="1.8" {...doodle} strokeWidth="1.8" />
          <path d="M15 14.7h2" {...doodle} strokeWidth="1.8" />
          <circle cx="11.5" cy="14.7" r="1.1" fill="currentColor" />
          <circle cx="20.5" cy="14.7" r="1.1" fill="currentColor" />
          <path d="M13 21.5c1.8 1.4 4.2 1.4 6 0" {...doodle} strokeWidth="2" />
        </>
      )}
      {mode === "kb" && (
        <>
          <circle cx="12" cy="14.5" r="3" {...doodle} strokeWidth="1.8" />
          <circle cx="20" cy="14.5" r="3" {...doodle} strokeWidth="1.8" />
          <path d="M15 14.5h2" {...doodle} strokeWidth="1.8" />
          <circle cx="12" cy="14.5" r="1.1" fill="currentColor" />
          <circle cx="20" cy="14.5" r="1.1" fill="currentColor" />
          <path d="M13 21c1.8 1.5 4.2 1.5 6 0" {...doodle} strokeWidth="2" />
        </>
      )}
    </Svg>
  );
}

export const AVATAR_SETS = [
  { id: "logo-face", name: "Логотип с лицом", hint: "Круг в цвете режима, белая «m», глаза на горбах и рот между ножками графитом.", Avatar: AvatarLogoFace },
  { id: "logo-m", name: "Одна «m»", hint: "Буква из логотипа без круга, в цвете режима, лицо графитом. Как закорючки с рефов, но точно по лого.", Avatar: AvatarLogoM },
  { id: "logo-tint", name: "Логотип монохром", hint: "Круг в цвете режима, только глаза тем же цветом на белой «m». Без графита, самый сдержанный.", Avatar: AvatarLogoTint },
  { id: "pillow", name: "Блобы mymeet", hint: "Те же мягкие тела, но лицо свое: круглые глаза и улыбка формой «m» из лого. Не щели, как у Grok.", Avatar: AvatarPillow },
  { id: "curl", name: "Блобы с завитком", hint: "Сверху хохолок-петля из лого, глаза-точки без рта. Характер в теле и завитке.", Avatar: AvatarCurl },
  { id: "blob", name: "Блобы (исходные)", hint: "Мягкие тела разной формы, белые щели-глаза. Ближе всего к Grok Bot, оставил для сравнения.", Avatar: AvatarBlob },
  { id: "squiggle", name: "Закорючки", hint: "Одна линия в духе «m» из логотипа mymeet, точки-глаза графитом.", Avatar: AvatarSquiggle },
  { id: "tile", name: "Плитки с характером", hint: "Форма плюс выражение: искры, бровь, очки. Как набор эмоций из рефа.", Avatar: AvatarTile },
  { id: "sphere", name: "Шарики", hint: "Объем с бликом, лица графитом. Спокойнее и «дороже» остальных.", Avatar: AvatarSphere },
  { id: "doodle", name: "Дудлы", hint: "Только линия цветом режима. Самые легкие, хорошо живут рядом с текстом.", Avatar: AvatarDoodle },
] as const;
