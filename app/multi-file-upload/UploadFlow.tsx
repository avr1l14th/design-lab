"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import DevPanel from "./DevPanel";
import MeetingsBackdrop from "./MeetingsBackdrop";
import UploadModal from "./UploadModal";
import { buildQueueItem, startUpload } from "./upload-sim";
import type { ProcessingMeeting, QueueItem } from "./types";

const PROCESSING_BADGE_MS = 8000;

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);
  return reduced;
}

function stripExt(name: string): string {
  const dot = name.lastIndexOf(".");
  if (dot <= 0) return name;
  return name.slice(0, dot);
}

export default function UploadFlow() {
  const reducedMotion = useReducedMotion();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [items, setItems] = useState<QueueItem[]>([]);
  const [errorOnNext, setErrorOnNext] = useState(false);
  const [processingMeetings, setProcessingMeetings] = useState<ProcessingMeeting[]>([]);

  // Per-id cancel callbacks for in-flight uploads
  const cancelsRef = useRef<Map<string, () => void>>(new Map());
  // Per-meeting timer to flip "обрабатывается" → done
  const procTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Cleanup on unmount
  useEffect(() => {
    const cancels = cancelsRef.current;
    const timers = procTimersRef.current;
    return () => {
      cancels.forEach((c) => c());
      cancels.clear();
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, []);

  const startSimFor = useCallback(
    (item: QueueItem, forceError: boolean) => {
      const cancel = startUpload(item, {
        forceError,
        onTick: (id, pct) => {
          setItems((prev) => prev.map((it) => (it.id === id ? { ...it, progressPct: pct } : it)));
        },
        onComplete: (id, status, errorText) => {
          setItems((prev) =>
            prev.map((it) =>
              it.id === id
                ? {
                    ...it,
                    status,
                    progressPct: status === "done" ? 100 : it.progressPct,
                    errorText: errorText,
                  }
                : it,
            ),
          );
          cancelsRef.current.delete(id);
        },
      });
      cancelsRef.current.set(item.id, cancel);
    },
    [],
  );

  const handleAddFiles = useCallback(
    (files: File[]) => {
      if (files.length === 0) return;
      const newItems = files.map((f) => buildQueueItem(f));
      setItems((prev) => [...prev, ...newItems]);
      // ошибка — только для первого добавленного, потом тогл сам сбрасывается
      let consumedError = false;
      newItems.forEach((it) => {
        const useError = errorOnNext && !consumedError;
        if (useError) consumedError = true;
        startSimFor(it, useError);
      });
      if (consumedError) setErrorOnNext(false);
    },
    [errorOnNext, startSimFor],
  );

  const handleRemoveItem = useCallback((id: string) => {
    const cancel = cancelsRef.current.get(id);
    if (cancel) {
      cancel();
      cancelsRef.current.delete(id);
    }
    setItems((prev) => prev.filter((it) => it.id !== id));
  }, []);

  const handleRetryItem = useCallback((id: string) => {
    setItems((prev) => {
      const item = prev.find((it) => it.id === id);
      if (item) {
        const reset: QueueItem = {
          ...item,
          status: "uploading",
          progressPct: 0,
          errorText: undefined,
        };
        // restart sim — never force error on retry
        startSimFor(reset, false);
      }
      return prev.map((it) =>
        it.id === id
          ? { ...it, status: "uploading" as const, progressPct: 0, errorText: undefined }
          : it,
      );
    });
  }, [startSimFor]);

  const handleCloseModal = useCallback(() => {
    // отменяем все in-flight, чистим очередь
    cancelsRef.current.forEach((c) => c());
    cancelsRef.current.clear();
    setItems([]);
    setIsModalOpen(false);
  }, []);

  const handleSubmit = useCallback(() => {
    const doneItems = items.filter((it) => it.status === "done");
    if (doneItems.length === 0) return;
    const now = Date.now();
    const newProcessing: ProcessingMeeting[] = doneItems.map((it) => ({
      id: it.id,
      title: stripExt(it.name),
      durationMin: it.durationMin,
      kind: it.kind,
      addedAt: now,
      isProcessing: true,
    }));
    setProcessingMeetings((prev) => [...newProcessing, ...prev]);

    // через 8с снимаем "обрабатывается"
    newProcessing.forEach((pm) => {
      const t = setTimeout(() => {
        setProcessingMeetings((prev) =>
          prev.map((p) => (p.id === pm.id ? { ...p, isProcessing: false } : p)),
        );
        procTimersRef.current.delete(pm.id);
      }, PROCESSING_BADGE_MS);
      procTimersRef.current.set(pm.id, t);
    });

    // закрытие модалки + чистка
    cancelsRef.current.clear();
    setItems([]);
    setIsModalOpen(false);
  }, [items]);

  const handleResetDemo = useCallback(() => {
    cancelsRef.current.forEach((c) => c());
    cancelsRef.current.clear();
    procTimersRef.current.forEach((t) => clearTimeout(t));
    procTimersRef.current.clear();
    setItems([]);
    setProcessingMeetings([]);
    setIsModalOpen(false);
    setErrorOnNext(false);
  }, []);

  const handleFinishProcessing = useCallback(() => {
    procTimersRef.current.forEach((t) => clearTimeout(t));
    procTimersRef.current.clear();
    setProcessingMeetings((prev) => prev.map((p) => ({ ...p, isProcessing: false })));
  }, []);

  return (
    <>
      <MeetingsBackdrop
        onAddMeetingClick={() => setIsModalOpen(true)}
        injectedTopMeetings={processingMeetings}
        reducedMotion={reducedMotion}
      />
      <UploadModal
        open={isModalOpen}
        items={items}
        onAddFiles={handleAddFiles}
        onRemoveItem={handleRemoveItem}
        onRetryItem={handleRetryItem}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        reducedMotion={reducedMotion}
      />
      <DevPanel
        errorOnNext={errorOnNext}
        setErrorOnNext={setErrorOnNext}
        onResetDemo={handleResetDemo}
        onFinishProcessing={handleFinishProcessing}
      />
    </>
  );
}
