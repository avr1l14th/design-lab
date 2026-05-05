import type { FileKind, QueueItem } from "./types";

const MIN_MS = 2200;
const MAX_MS = 4800;
const TICK_MS = 16; // ≈60fps, sub-frame smoothness via float pct

export function detectKind(file: File): FileKind {
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("audio/")) return "audio";
  // best-effort fallback by extension
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (["mp4", "mov", "m4v", "webm", "avi", "mkv"].includes(ext)) return "video";
  return "audio";
}

export function isValidUpload(file: File): boolean {
  if (file.type.startsWith("audio/") || file.type.startsWith("video/")) return true;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return ["mp3", "wav", "m4a", "ogg", "flac", "aac", "mp4", "mov", "m4v", "webm", "avi", "mkv"].includes(ext);
}

export function mockDurationMin(file: File): number {
  // ≈ 1 минута на 1 МБ для аудио, 0.4 мин/МБ для видео; clamp 5..240
  const mb = file.size / (1024 * 1024);
  const kind = detectKind(file);
  const raw = kind === "video" ? mb * 0.4 : mb * 1.0;
  const noisy = Math.round(raw + (Math.random() * 10 - 5));
  return Math.max(5, Math.min(240, noisy || 25));
}

export function buildQueueItem(file: File): QueueItem {
  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `q-${Math.random().toString(36).slice(2)}-${Date.now()}`,
    file,
    name: file.name,
    sizeBytes: file.size,
    durationMin: mockDurationMin(file),
    kind: detectKind(file),
    status: "uploading",
    progressPct: 0,
  };
}

type SimOpts = {
  forceError: boolean;
  onTick: (id: string, pct: number) => void;
  onComplete: (id: string, status: "done" | "error", errorText?: string) => void;
};

export function startUpload(item: QueueItem, opts: SimOpts): () => void {
  const totalMs = MIN_MS + Math.random() * (MAX_MS - MIN_MS);
  // если форс-ошибка — фейлим в случайной точке 30..60%
  const failAtPct = opts.forceError ? 30 + Math.random() * 30 : -1;

  let cancelled = false;
  const startTs = performance.now();

  const interval = setInterval(() => {
    if (cancelled) return;
    const elapsed = performance.now() - startTs;
    const pct = Math.min(100, (elapsed / totalMs) * 100);

    if (failAtPct > 0 && pct >= failAtPct) {
      clearInterval(interval);
      opts.onTick(item.id, failAtPct);
      opts.onComplete(item.id, "error", "Не удалось загрузить файл");
      return;
    }

    opts.onTick(item.id, pct);
    if (pct >= 100) {
      clearInterval(interval);
      opts.onComplete(item.id, "done");
    }
  }, TICK_MS);

  return () => {
    cancelled = true;
    clearInterval(interval);
  };
}
