"use client";

import { useEffect, useRef, type PointerEvent, type ReactNode } from "react";
import { INVITEE_DISCOUNT } from "./data";
import { rfAsset } from "./tokens";

const fig = (name: string) => rfAsset(`figma/${name}`);

// Подарочная карта из макета в двух размерах: в герое (200×120) и в модалке приглашенного (356×196).
// Фон — экспорт из Figma без текста, логотип и тексты живые.
//
// По ховеру карта «тридешится»: наклоняется вслед за курсором (до ±12°) и чуть увеличивается.
// Движение считается в requestAnimationFrame и пишется прямо в style.transform — без React-стейта
// и без CSS-transition, которые на каждом mousemove перезапускались и дробили анимацию.
// Текущее значение догоняет целевое пружиной (lerp), поэтому и вход, и возврат мягкие.
// Глубокая тень лежит отдельным слоем и меняет только opacity (box-shadow анимировать дорого).
// На тачах и при prefers-reduced-motion наклона нет.
// Появление: «раздача» снизу с 3D-поворотом и блюром (.rf-card-in в globals.css), тексты догоняют
// со сдвигом, затем один проход блика. Вход живет на внешней обертке и не мешает ховеру.

const MAX_TILT = 12;
const HOVER_SCALE = 1.04;
/** Доля пути к цели за кадр: ~0.14 дает мягкую пружину без заметного запаздывания */
const FOLLOW = 0.14;

function Tilt({ children, radius, shadow, hoverShadow }: { children: ReactNode; radius: number; shadow: string; hoverShadow: string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  const target = useRef({ rx: 0, ry: 0, s: 1 });
  const current = useRef({ rx: 0, ry: 0, s: 1 });
  const raf = useRef<number | null>(null);
  const enabled = useRef(false);

  useEffect(() => {
    enabled.current = window.matchMedia("(hover: hover) and (pointer: fine)").matches && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    return () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current);
    };
  }, []);

  const tick = () => {
    const c = current.current;
    const t = target.current;
    c.rx += (t.rx - c.rx) * FOLLOW;
    c.ry += (t.ry - c.ry) * FOLLOW;
    c.s += (t.s - c.s) * FOLLOW;
    const el = cardRef.current;
    if (el) el.style.transform = `rotateX(${c.rx.toFixed(2)}deg) rotateY(${c.ry.toFixed(2)}deg) scale(${c.s.toFixed(4)})`;
    const settled = Math.abs(t.rx - c.rx) < 0.02 && Math.abs(t.ry - c.ry) < 0.02 && Math.abs(t.s - c.s) < 0.0005;
    if (settled) {
      Object.assign(c, t);
      if (el) el.style.transform = `rotateX(${t.rx}deg) rotateY(${t.ry}deg) scale(${t.s})`;
      raf.current = null;
      return;
    }
    raf.current = requestAnimationFrame(tick);
  };

  const kick = () => {
    if (raf.current === null) raf.current = requestAnimationFrame(tick);
  };

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!enabled.current) return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) - 0.5;
    const py = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)) - 0.5;
    // Край под курсором приподнимается к зрителю, противоположный уходит вглубь
    target.current = { rx: py * MAX_TILT * 2, ry: -px * MAX_TILT * 2, s: HOVER_SCALE };
    if (shadowRef.current) shadowRef.current.style.opacity = "1";
    kick();
  };

  const onLeave = () => {
    target.current = { rx: 0, ry: 0, s: 1 };
    if (shadowRef.current) shadowRef.current.style.opacity = "0";
    kick();
  };

  return (
    <div className="relative" style={{ perspective: 700 }} onPointerMove={onMove} onPointerLeave={onLeave}>
      <div ref={cardRef} className="relative" style={{ transformStyle: "preserve-3d", willChange: "transform", borderRadius: radius, boxShadow: shadow }}>
        {/* Глубокая тень ховера — отдельный слой под картой, анимируется только opacity */}
        <div
          ref={shadowRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-[240ms] ease-out motion-reduce:transition-none"
          style={{ borderRadius: radius, boxShadow: hoverShadow }}
        />
        {children}
      </div>
    </div>
  );
}

/** Один проход блика по карте после приземления */
function Shine({ delay }: { delay?: number }) {
  return <div aria-hidden="true" className="rf-card-shine pointer-events-none absolute inset-y-0 left-0 w-[60%]" style={delay ? { animationDelay: `${delay}ms` } : undefined} />;
}

export function GiftCard({ size }: { size: "hero" | "modal" }) {
  if (size === "hero") {
    return (
      <div className="rf-card-in">
        <Tilt radius={5.98} shadow="0 11.644px 23.287px -11.644px rgba(33,40,51,0.5)" hoverShadow="0 12px 28px -12px rgba(33,40,51,0.3)">
          <div
            className="relative flex h-[120px] w-[200px] shrink-0 select-none flex-col items-start justify-between overflow-clip rounded-[5.98px] p-[14.555px] text-white"
            style={{ backgroundImage: `url(${fig("card-hero.png")})`, backgroundSize: "100% 100%" }}
            aria-hidden="true"
          >
            <Shine />
            <div className="rf-card-text-in relative flex w-full justify-end" style={{ animationDelay: "260ms" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={fig("logo-50.svg")} alt="" width={50.625} height={12} className="block h-[12px] w-[50.625px]" />
            </div>
            <div className="relative flex w-full flex-col">
              <span className="rf-card-text-in text-[28px] font-medium leading-[normal]" style={{ animationDelay: "320ms" }}>
                {INVITEE_DISCOUNT}%
              </span>
              <span className="rf-card-text-in whitespace-nowrap text-[8px] font-normal leading-[normal] tracking-[-0.08px]" style={{ color: "rgba(255,255,255,0.64)", animationDelay: "380ms" }}>
                скидка на подписку
              </span>
            </div>
          </div>
        </Tilt>
      </div>
    );
  }
  return (
    <div className="rf-card-in" style={{ animationDelay: "80ms" }}>
      <Tilt radius={9.687} shadow="0 18.861px 37.722px -18.861px rgba(33,40,51,0.5)" hoverShadow="0 18px 44px -18px rgba(33,40,51,0.3)">
        <div
          className="relative flex h-[196px] w-[356px] shrink-0 select-none flex-col items-start justify-between overflow-clip rounded-[9.687px] p-[24px] text-white"
          style={{ backgroundImage: `url(${fig("card-modal.png")})`, backgroundSize: "100% 100%" }}
          aria-hidden="true"
        >
          <Shine delay={600} />
          <div className="rf-card-text-in relative flex h-[18.861px] w-full justify-end" style={{ animationDelay: "340ms" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={fig("logo-80.svg")} alt="" width={80} height={18.963} className="block h-[18.963px] w-[80px]" />
          </div>
          <div className="relative flex w-full flex-col">
            <span className="rf-card-text-in text-[48px] font-medium leading-[normal]" style={{ animationDelay: "400ms" }}>
              {INVITEE_DISCOUNT}%
            </span>
            <span className="rf-card-text-in whitespace-nowrap text-[13px] font-normal leading-[normal] tracking-[-0.13px]" style={{ color: "rgba(255,255,255,0.64)", animationDelay: "460ms" }}>
              скидка на подписку
            </span>
          </div>
        </div>
      </Tilt>
    </div>
  );
}
