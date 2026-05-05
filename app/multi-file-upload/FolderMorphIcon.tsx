"use client";

import { useEffect, useRef } from "react";
import { interpolate } from "flubber";

// Closed folder — single compound path split into two subpaths:
//   1) bottom rectangle (the front body that flaps open)
//   2) top "tab" with notch (the back, stays put)
const CLOSED_BODY =
  "M19.5 21C20.2956 21 21.0587 20.6839 21.6213 20.1213C22.1839 19.5587 22.5 18.7956 22.5 18V13.5C22.5 12.7044 22.1839 11.9413 21.6213 11.3787C21.0587 10.8161 20.2956 10.5 19.5 10.5H4.5C3.70435 10.5 2.94129 10.8161 2.37868 11.3787C1.81607 11.9413 1.5 12.7044 1.5 13.5V18C1.5 18.7956 1.81607 19.5587 2.37868 20.1213C2.94129 20.6839 3.70435 21 4.5 21H19.5Z";
const CLOSED_TAB =
  "M1.5 10.146V6C1.5 5.20435 1.81607 4.44129 2.37868 3.87868C2.94129 3.31607 3.70435 3 4.5 3H9.879C10.4754 3.00026 11.0473 3.23729 11.469 3.659L13.591 5.78C13.731 5.921 13.922 6 14.121 6H19.5C20.2956 6 21.0587 6.31607 21.6213 6.87868C22.1839 7.44129 22.5 8.20435 22.5 9V10.146C21.6758 9.40664 20.6072 8.99842 19.5 9H4.5C3.39279 8.99842 2.32417 9.40664 1.5 10.146Z";

// Open folder — front body that flares slightly outward at the top edge (Figma node 31723:13453)
const OPEN_TRAY =
  "M19.5 21C20.2956 21 21.0587 20.6839 21.6213 20.1213C22.1839 19.5587 22.5 18.7956 22.5 18L23.5 13.5C23.5 12.7044 23.1538 11.9413 22.5376 11.3787C21.9214 10.8161 21.0857 10.5 20.2143 10.5H3.78571C2.91429 10.5 2.07855 10.8161 1.46236 11.3787C0.846173 11.9413 0.5 12.7044 0.5 13.5L1.5 18C1.5 18.7956 1.81607 19.5587 2.37868 20.1213C2.94129 20.6839 3.70435 21 4.5 21H19.5Z";

// Morph only the front flap; the tab on top stays static.
const morphBody = interpolate(CLOSED_BODY, OPEN_TRAY, { maxSegmentLength: 1.5 });

const COLOR_FROM = [0xdd, 0xde, 0xdf]; // closed grey
const COLOR_TO = [0x01, 0x38, 0xc7]; // open blue

function colorAt(t: number): string {
  const r = Math.round(COLOR_FROM[0] + (COLOR_TO[0] - COLOR_FROM[0]) * t);
  const g = Math.round(COLOR_FROM[1] + (COLOR_TO[1] - COLOR_FROM[1]) * t);
  const b = Math.round(COLOR_FROM[2] + (COLOR_TO[2] - COLOR_FROM[2]) * t);
  return `rgb(${r},${g},${b})`;
}

const DURATION_MS = 320;
const ease = (t: number) => 1 - Math.pow(1 - t, 3);

export default function FolderMorphIcon({
  open,
  reducedMotion,
}: {
  open: boolean;
  reducedMotion: boolean;
}) {
  const bodyRef = useRef<SVGPathElement>(null);
  const topRef = useRef<SVGPathElement>(null);
  const progressRef = useRef(open ? 1 : 0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const target = open ? 1 : 0;
    const from = progressRef.current;

    const apply = (value: number) => {
      const fill = colorAt(value);
      if (bodyRef.current) {
        // snap to exact source/target paths at extremes to avoid any flubber resampling artifacts
        const d =
          value <= 0.0001
            ? CLOSED_BODY
            : value >= 0.9999
            ? OPEN_TRAY
            : morphBody(value);
        bodyRef.current.setAttribute("d", d);
        bodyRef.current.setAttribute("fill", fill);
      }
      if (topRef.current) {
        topRef.current.setAttribute("fill", fill);
      }
    };

    if (reducedMotion) {
      progressRef.current = target;
      apply(target);
      return;
    }

    if (Math.abs(target - from) < 0.0005) return;
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);

    let startTime: number | null = null;

    const tick = (now: number) => {
      if (startTime == null) startTime = now;
      const linearT = Math.min(1, (now - startTime) / DURATION_MS);
      const eased = ease(linearT);
      const value = from + (target - from) * eased;
      progressRef.current = value;
      apply(value);
      if (linearT < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [open, reducedMotion]);

  const initialFill = colorAt(progressRef.current);
  const initialBodyD =
    progressRef.current <= 0.0001
      ? CLOSED_BODY
      : progressRef.current >= 0.9999
      ? OPEN_TRAY
      : morphBody(progressRef.current);

  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* front flap — morphs from closed body rect → open tray */}
      <path ref={bodyRef} d={initialBodyD} fill={initialFill} />
      {/* back tab — stays static, only fill color follows the morph */}
      <path ref={topRef} d={CLOSED_TAB} fill={initialFill} />
    </svg>
  );
}
