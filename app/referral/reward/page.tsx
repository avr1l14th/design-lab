"use client";

import { useState } from "react";
import { MILESTONES, paysLabel } from "../_shared/data";
import { DevPanel } from "../_shared/DevPanel";
import { MeetingsPage } from "../_shared/MeetingsPage";
import { RewardModal } from "../_shared/RewardModal";
import { tokens } from "../_shared/tokens";

// Модалки наград приглашающему (Figma 48586:370…525) поверх списка встреч.
// Какая награда показана — переключается в панели прототипа.

export default function RewardModalsPage() {
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(true);
  const milestone = MILESTONES[index];
  return (
    <MeetingsPage overlay={open ? <RewardModal milestone={milestone} onClose={() => setOpen(false)} /> : null}>
      <DevPanel>
        <div className="flex flex-col gap-[2px]">
          {MILESTONES.map((m, i) => {
            const on = i === index && open;
            return (
              <button
                key={m.count}
                type="button"
                onClick={() => {
                  setIndex(i);
                  setOpen(true);
                }}
                className="flex items-center justify-between gap-[8px] rounded-[3px] px-[6px] py-[4px] text-left text-[12px] leading-[normal] tracking-[-0.12px] hover:bg-[#F7F7F8]"
                style={{ color: on ? tokens.black : tokens.grey, backgroundColor: on ? tokens.bgSubtle : undefined }}
              >
                <span className="truncate">{m.title}</span>
                <span className="shrink-0" style={{ color: tokens.greyDisabled }}>
                  {paysLabel(m.count)}
                </span>
              </button>
            );
          })}
        </div>
      </DevPanel>
    </MeetingsPage>
  );
}
