"use client";

import { useRef, useState } from "react";
import FolderMorphIcon from "./FolderMorphIcon";
import { isValidUpload } from "./upload-sim";

const tokens = {
  blue: "#0138c7",
  black: "#212833",
  grey50: "#dddedf",
  grey70: "#babbbd",
  grey10: "#fafafa",
  blueHover: "#f6f8fe",
};

export default function DropZone({
  onFiles,
  reducedMotion,
  modalDragOver = false,
}: {
  onFiles: (files: File[]) => void;
  reducedMotion: boolean;
  modalDragOver?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isHover, setIsHover] = useState(false);
  const dragCounterRef = useRef(0);

  // active = local DnD over the zone OR mouse hover OR modal-level dragover
  const isActive = isDragOver || isHover || modalDragOver;

  const accept = (files: FileList | File[]) => {
    const arr: File[] = Array.from(files).filter(isValidUpload);
    if (arr.length > 0) onFiles(arr);
  };

  const transition = reducedMotion
    ? "none"
    : "border-color 120ms ease, background-color 120ms ease";

  return (
    <div
      onDragEnter={(e) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounterRef.current += 1;
        if (e.dataTransfer.types.includes("Files")) setIsDragOver(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = "copy";
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounterRef.current -= 1;
        if (dragCounterRef.current <= 0) {
          dragCounterRef.current = 0;
          setIsDragOver(false);
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounterRef.current = 0;
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          accept(e.dataTransfer.files);
          e.dataTransfer.clearData();
        }
      }}
      onClick={() => inputRef.current?.click()}
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      className="flex h-[142px] w-full cursor-pointer flex-col items-center justify-center gap-[16px] rounded-[4px] border"
      style={{
        borderStyle: isActive ? "solid" : "dashed",
        borderColor: isActive ? tokens.blue : tokens.grey50,
        backgroundColor: isActive ? tokens.blueHover : tokens.grey10,
        transition,
      }}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="audio/*,video/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) accept(e.target.files);
          e.target.value = "";
        }}
      />
      <FolderMorphIcon open={isActive} reducedMotion={reducedMotion} />
      <div className="flex flex-col items-center gap-[8px]">
        <p
          className="text-[13px] leading-none"
          style={{ color: tokens.black, letterSpacing: "-0.13px" }}
        >
          <span style={{ color: tokens.blue, textDecoration: "underline" }}>
            Выберите файл
          </span>
          {" или перетащите его сюда"}
        </p>
        <p
          className="text-[12px] leading-none"
          style={{ color: tokens.grey70, letterSpacing: "-0.24px" }}
        >
          Любые аудио или видео меньше 3 ГБ
        </p>
      </div>
    </div>
  );
}
