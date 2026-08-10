import { useId, useRef, useState } from "react";

const MAX_PDF_SIZE = 15 * 1024 * 1024;

export interface ResumePdfUploadProps {
  file: File | null;
  error?: string;
  busy?: boolean;
  onChange(file: File | null): void;
}

export function validateResumePdfFiles(
  files: readonly File[],
): { file: File } | { error: string } {
  if (files.length === 0) {
    return { error: "Choose one PDF no larger than 15 MB." };
  }
  if (files.length !== 1) {
    return { error: "Choose one PDF only." };
  }
  const file = files[0];
  const isPdf =
    file.type.toLowerCase() === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) return { error: "Choose a PDF file." };
  if (file.size <= 0) return { error: "Choose a non-empty PDF." };
  if (file.size > MAX_PDF_SIZE) {
    return { error: "Choose a PDF no larger than 15 MB." };
  }
  return { file };
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ResumePdfUpload({
  file,
  error,
  busy = false,
  onChange,
}: ResumePdfUploadProps) {
  const inputId = useId();
  const helpId = useId();
  const errorId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragDepth, setDragDepth] = useState(0);
  const [selectionError, setSelectionError] = useState<string | undefined>();
  const visibleError = error ?? selectionError;
  const describedBy = visibleError ? `${helpId} ${errorId}` : helpId;

  function applyFiles(files: readonly File[]) {
    const result = validateResumePdfFiles(files);
    if ("error" in result) {
      setSelectionError(result.error);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setSelectionError(undefined);
    onChange(result.file);
  }

  function remove() {
    setSelectionError(undefined);
    if (inputRef.current) inputRef.current.value = "";
    onChange(null);
  }

  return (
    <div
      className="resume-upload-dropzone"
      role="group"
      aria-label="Resume PDF upload"
      aria-describedby={describedBy}
      data-drag-active={dragDepth > 0 ? "true" : "false"}
      onDragEnter={(event) => {
        event.preventDefault();
        if (!busy) setDragDepth((depth) => depth + 1);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        if (!busy) event.dataTransfer.dropEffect = "copy";
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        setDragDepth((depth) => Math.max(0, depth - 1));
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragDepth(0);
        if (!busy) applyFiles(Array.from(event.dataTransfer.files));
      }}
    >
      <input
        ref={inputRef}
        id={inputId}
        className="resume-file-input"
        type="file"
        accept="application/pdf,.pdf"
        aria-label="Resume PDF"
        aria-invalid={Boolean(visibleError)}
        aria-describedby={describedBy}
        disabled={busy}
        onChange={(event) => applyFiles(Array.from(event.target.files ?? []))}
      />

      {file ? (
        <div className="resume-selected-file">
          <span className="resume-selected-file-icon" aria-hidden="true">
            PDF
          </span>
          <span className="resume-selected-file-copy">
            <strong>{file.name}</strong>
            <small>{formatBytes(file.size)}</small>
          </span>
          <span className="resume-selected-file-actions">
            <button
              type="button"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              Replace PDF
            </button>
            <button type="button" disabled={busy} onClick={remove}>
              Remove PDF
            </button>
          </span>
        </div>
      ) : (
        <button
          type="button"
          className="resume-dropzone-trigger"
          aria-label="Choose PDF"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          <strong>{dragDepth > 0 ? "Drop the PDF here" : "Choose PDF"}</strong>
          <span>or drag and drop one PDF here</span>
        </button>
      )}

      <p id={helpId}>
        <strong>PDF only · maximum 15 MB</strong>
        <span>
          Client checks are guidance; private server validation is authoritative.
        </span>
      </p>
      {visibleError ? (
        <p id={errorId} className="field-error" role="alert">
          {visibleError}
        </p>
      ) : null}
    </div>
  );
}
