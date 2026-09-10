"use client";

import { Inter } from "next/font/google";
import { AVATAR_SETS } from "../_shared/avatars";
import { MODES, type Mode } from "../_shared/data";
import { Ic } from "../_shared/icons";
import { tokens } from "../_shared/tokens";

const inter = Inter({ subsets: ["latin", "cyrillic"], weight: ["400", "500", "600"] });

/** Стенд аватаров режимов: пять направлений, каждое в четырех цветах и в контексте UI */
export default function AvatarsPage() {
  return (
    <main className={`${inter.className} min-h-screen w-full bg-white px-[40px] py-[40px]`} style={{ color: tokens.black }}>
      <div className="mx-auto flex w-[960px] max-w-full flex-col gap-[64px]">
        <header className="flex flex-col gap-[8px]">
          <h1 className="text-[24px] font-medium leading-[normal] tracking-[-0.48px]">Аватары режимов</h1>
          <p className="text-[13px] leading-[20px] tracking-[-0.13px]" style={{ color: tokens.grey }}>
            Пять направлений. В каждом четыре персонажа в цветах режимов и превью в реальных местах: заголовок стартовой (20px), пикер (16px), строка меню
            режимов (плашка 36px).
          </p>
        </header>

        {AVATAR_SETS.map((set, i) => (
          <section key={set.id} className="flex flex-col gap-[24px]">
            <div className="flex flex-col gap-[4px]">
              <h2 className="text-[16px] font-medium leading-[normal] tracking-[-0.16px]">
                {String.fromCharCode(65 + i)}. {set.name}
              </h2>
              <p className="text-[13px] leading-[20px] tracking-[-0.13px]" style={{ color: tokens.grey }}>
                {set.hint}
              </p>
            </div>

            {/* крупно */}
            <div className="grid grid-cols-4 gap-[16px]">
              {MODES.map((m) => (
                <div key={m.id} className="flex flex-col items-center gap-[12px] rounded-[4px] py-[24px]" style={{ backgroundColor: tokens.bgSubtle }}>
                  <span style={{ color: m.color }}>
                    <set.Avatar mode={m.id} size={96} />
                  </span>
                  <span className="text-[12px] leading-[normal] tracking-[-0.24px]" style={{ color: tokens.grey }}>
                    {m.label}
                  </span>
                </div>
              ))}
            </div>

            {/* в контексте */}
            <div className="grid grid-cols-[1fr_auto] gap-[24px] rounded-[4px] border p-[24px]" style={{ borderColor: tokens.border }}>
              <div className="flex flex-col gap-[24px]">
                {/* заголовок стартовой */}
                <div className="flex items-center gap-[8px]">
                  <span style={{ color: tokens.blue }}>
                    <set.Avatar mode="auto" size={20} />
                  </span>
                  <span className="text-[24px] font-medium leading-[normal] tracking-[-0.48px]">
                    <span style={{ color: tokens.blue }}>Салют!</span> Чем могу помочь?
                  </span>
                </div>
                {/* пикер режима — все четыре */}
                <div className="flex flex-wrap items-center gap-[8px]">
                  {MODES.map((m) => (
                    <span
                      key={m.id}
                      className="flex h-[32px] items-center gap-[6px] rounded-[4px] border bg-white px-[8px]"
                      style={{ borderColor: tokens.border }}
                    >
                      <span style={{ color: m.color }}>
                        <set.Avatar mode={m.id} size={16} />
                      </span>
                      <span className="text-[12px] leading-[normal] tracking-[-0.24px]">{m.label}</span>
                      <span style={{ color: tokens.grey }}>
                        <Ic name="chevron-down" />
                      </span>
                    </span>
                  ))}
                </div>
              </div>
              {/* строки меню режимов */}
              <div className="flex w-[290px] flex-col rounded-[4px] bg-white p-[4px]" style={{ boxShadow: "0 0 4px rgba(0,0,0,.16)" }}>
                {MODES.map((m) => (
                  <div key={m.id} className="flex items-center gap-[12px] rounded-[4px] p-[8px]">
                    <span className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-[4px]" style={{ backgroundColor: tokens.bgSubtle, color: m.color }}>
                      <set.Avatar mode={m.id as Mode} size={22} />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
                      <span className="text-[13px] font-medium leading-[normal] tracking-[-0.13px]">{m.label}</span>
                      <span className="text-[12px] leading-[normal] tracking-[-0.24px]" style={{ color: tokens.grey }}>
                        {m.description}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
