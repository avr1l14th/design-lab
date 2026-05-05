export type QueueItemStatus = "uploading" | "done" | "error";

export type FileKind = "audio" | "video";

export type QueueItem = {
  id: string;
  file: File;
  name: string;
  sizeBytes: number;
  durationMin: number;
  kind: FileKind;
  status: QueueItemStatus;
  progressPct: number;
  errorText?: string;
};

export type ProcessingMeeting = {
  id: string;
  title: string;
  durationMin: number;
  kind: FileKind;
  addedAt: number;
  isProcessing: boolean;
};
