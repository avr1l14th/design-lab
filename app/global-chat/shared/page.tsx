"use client";

import { Inter } from "next/font/google";
import { AssistantBlock, UserBubble } from "../_shared/chat-ui";
import { DIALOGS, formatLongDate } from "../_shared/data";
import { Ic } from "../_shared/icons";
import { focusRingClass, pressableClass, tokens } from "../_shared/tokens";

const inter = Inter({ subsets: ["latin", "cyrillic"], weight: ["400", "500", "600"] });

// ─────────────────────────────────────────────────────────────────────────────
// Диалог по ссылке — режим «только просмотр» (открывается из поповера шеринга)
// ─────────────────────────────────────────────────────────────────────────────

export default function SharedDialogPage() {
  const dialog = DIALOGS[1];
  return (
    <main className={`${inter.className} flex h-screen min-h-[600px] w-full flex-col overflow-hidden bg-white`} style={{ color: tokens.black }}>
      <header className="flex h-[54px] shrink-0 items-center justify-between border-b px-[16px]" style={{ borderColor: tokens.border }}>
        <div className="flex items-center gap-[8px]">
          <div className="flex h-[24px] w-[24px] items-center justify-center rounded-full" style={{ backgroundColor: tokens.blue }}>
            <span className="text-[12px] font-medium text-white" style={{ letterSpacing: "-0.24px" }}>
              m
            </span>
          </div>
          <span className="text-[13px] font-medium leading-none tracking-[-0.13px]" style={{ color: tokens.grey }}>
            Чат
          </span>
          <span className="text-[13px] font-medium leading-none tracking-[-0.13px]" style={{ color: tokens.grey }}>
            /
          </span>
          <span className="truncate text-[13px] font-medium leading-none tracking-[-0.13px]" style={{ color: tokens.black }}>
            {dialog.title}
          </span>
        </div>
        <div className="flex items-center gap-[8px]">
          <span className="flex h-[32px] items-center gap-[6px] rounded-[4px] border px-[8px] text-[13px] leading-none tracking-[-0.13px]" style={{ borderColor: tokens.border, color: tokens.grey }}>
            <Ic name="lock-closed" size={14} />
            Только просмотр
          </span>
          <button
            type="button"
            className={`flex h-[32px] items-center rounded-[4px] px-[12px] text-[13px] font-medium leading-none tracking-[-0.13px] text-white hover:bg-[#0032B1] ${pressableClass} ${focusRingClass}`}
            style={{ backgroundColor: tokens.blue }}
          >
            Открыть mymeet.ai
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col items-center">
        <div className="flex min-h-0 w-[640px] max-w-full flex-1 flex-col justify-between pb-[16px]">
          <div className="gc-scroll min-h-0 flex-1 overflow-y-auto">
            <div className="flex w-full flex-col items-end gap-[40px] py-[40px]">
              {dialog.messages.map((m) => (m.role === "user" ? <UserBubble key={m.id} message={m} /> : <AssistantBlock key={m.id} message={m} generation={null} />))}
            </div>
          </div>
          <div className="flex items-center justify-between gap-[16px] rounded-[4px] border p-[12px]" style={{ borderColor: tokens.border }}>
            <div className="flex flex-col gap-[2px]">
              <span className="text-[13px] font-medium leading-[16px] tracking-[-0.13px]" style={{ color: tokens.black }}>
                Диалог доступен только для чтения
              </span>
              <span className="text-[12px] leading-[14px] tracking-[-0.24px]" style={{ color: tokens.grey }}>
                Поделился fedos@mymeet.ai · обновлен {formatLongDate(dialog.updatedAt)}. Чтобы задать свой вопрос, откройте Чат в mymeet.ai
              </span>
            </div>
            <button
              type="button"
              className={`flex h-[32px] shrink-0 items-center gap-[6px] rounded-[4px] px-[10px] text-[13px] font-medium leading-none tracking-[-0.13px] hover:bg-[#DDDEDF] ${pressableClass} ${focusRingClass}`}
              style={{ backgroundColor: "#EFEFEF", color: tokens.black }}
            >
              <Ic name="fig-chat" />
              Спросить в своем чате
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
