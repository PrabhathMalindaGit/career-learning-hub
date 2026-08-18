import { useRef, useState } from "react";
import { Dialog } from "../../components/Dialog";

interface ResumeCandidatePhotoControlsProps {
  hasPhoto: boolean;
  visible: boolean;
  sourceUrl?: string;
  sourceLoading: boolean;
  busy: boolean;
  error?: string;
  requestId?: string;
  onSelectFile: (file: File) => void;
  onShow: () => void;
  onHide: () => void;
  onRemove: () => void;
  onRetrySource: () => void;
}

export function ResumeCandidatePhotoControls({
  hasPhoto,
  visible,
  sourceUrl,
  sourceLoading,
  busy,
  error,
  requestId,
  onSelectFile,
  onShow,
  onHide,
  onRemove,
  onRetrySource,
}: ResumeCandidatePhotoControlsProps) {
  const [removeOpen, setRemoveOpen] = useState(false);
  const cancelRemoveRef = useRef<HTMLButtonElement>(null);
  const fileActionLabel = hasPhoto ? "Replace photo" : "Choose photo";

  return (
    <section
      className="resume-panel resume-candidate-photo-panel"
      aria-labelledby="resume-candidate-photo-title"
    >
      <header className="resume-panel-header">
        <div>
          <p className="resume-kicker">Optional presentation</p>
          {/* Feature 3.7 UI — Candidate photo controls. */}
          <h2 id="resume-candidate-photo-title">Candidate photo</h2>
        </div>
        <span className="resume-status">
          {!hasPhoto ? "Not added" : visible ? "Shown" : "Hidden"}
        </span>
      </header>

      <p className="resume-muted-copy">
        Candidate photos are optional, and Resume conventions vary by country
        and employer. The original validated image is stored privately;
        embedded image metadata may remain.
      </p>

      <div className="resume-candidate-photo-layout">
        <div className="resume-candidate-photo-thumbnail" aria-live="polite">
          {sourceUrl ? (
            <img src={sourceUrl} alt="Candidate photo preview" />
          ) : sourceLoading ? (
            <span>Loading saved photo…</span>
          ) : hasPhoto ? (
            <span>Saved photo preview unavailable</span>
          ) : (
            <span>No candidate photo selected</span>
          )}
        </div>

        <div className="resume-candidate-photo-actions">
          <div className="resume-candidate-photo-file-picker">
            <label className="resume-candidate-photo-file-control">
              <input
                className="resume-candidate-photo-file-input"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                aria-label={fileActionLabel}
                disabled={busy}
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0];
                  event.currentTarget.value = "";
                  if (file) onSelectFile(file);
                }}
              />
              <span
                className="resume-candidate-photo-file-button"
                aria-hidden="true"
              >
                {fileActionLabel}
              </span>
            </label>
            <span className="resume-candidate-photo-file-status">
              {hasPhoto
                ? "Select a new image to replace the current photo."
                : "Select an image from your device."}
            </span>
          </div>

          {hasPhoto ? (
            <div className="resume-button-row">
              {visible ? (
                <button type="button" disabled={busy} onClick={onHide}>
                  Hide from Resume
                </button>
              ) : (
                <button type="button" disabled={busy} onClick={onShow}>
                  Show on Resume
                </button>
              )}
              <button
                type="button"
                className="destructive-button resume-danger-button"
                disabled={busy}
                onClick={() => setRemoveOpen(true)}
              >
                Remove photo
              </button>
            </div>
          ) : null}

          <p className="resume-inline-guidance">
            JPEG, PNG, or WebP · maximum 2 MiB · maximum 4096 × 4096 and 16 MP.
          </p>

          {busy ? (
            <p className="resume-inline-guidance" role="status">
              Saving candidate photo…
            </p>
          ) : null}

          {error ? (
            <div className="resume-candidate-photo-error" role="alert">
              <span>{error}</span>
              {requestId ? <small>Request ID: {requestId}</small> : null}
              {hasPhoto && !sourceLoading ? (
                <button type="button" disabled={busy} onClick={onRetrySource}>
                  Retry saved photo
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <Dialog
        open={removeOpen}
        className="resume-dialog"
        labelledBy="resume-candidate-photo-remove-title"
        describedBy="resume-candidate-photo-remove-description"
        initialFocusRef={cancelRemoveRef}
        onCancel={() => setRemoveOpen(false)}
      >
        <h2 id="resume-candidate-photo-remove-title">Remove candidate photo?</h2>
        <p id="resume-candidate-photo-remove-description">
          This removes the private photo from this Resume. Resume content and
          saved versions are not changed.
        </p>
        <div className="resume-dialog-actions">
          <button
            ref={cancelRemoveRef}
            type="button"
            onClick={() => setRemoveOpen(false)}
          >
            Keep photo
          </button>
          <button
            type="button"
            className="destructive-button resume-danger-button"
            disabled={busy}
            onClick={() => {
              setRemoveOpen(false);
              onRemove();
            }}
          >
            Remove photo
          </button>
        </div>
      </Dialog>
    </section>
  );
}
