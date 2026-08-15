import { useEffect, useId, useState } from "react";
import { loadCanonicalCandidatePhoto } from "./resumeCandidatePhoto";
import { fetchResumeImportPhotoCandidateSource } from "./resumeApi";
import type { ResumeImportPhotoCandidate } from "./types";

type CandidatePreview = {
  status: "loading" | "ready" | "unavailable";
  objectUrl?: string;
};

interface ResumeImportPhotoChoicesProps {
  candidates: ResumeImportPhotoCandidate[];
  selectedAssetId: string | undefined;
  disabled: boolean;
  onChange(assetId: string | undefined): void;
}

export function ResumeImportPhotoChoices({
  candidates,
  selectedAssetId,
  disabled,
  onChange,
}: ResumeImportPhotoChoicesProps) {
  const name = useId();
  const [previews, setPreviews] = useState<Record<string, CandidatePreview>>({});

  useEffect(() => {
    const controller = new AbortController();
    const loadedUrls: string[] = [];
    setPreviews(
      Object.fromEntries(
        candidates.map((candidate) => [candidate.assetId, { status: "loading" }]),
      ),
    );

    void Promise.all(
      candidates.map(async (candidate) => {
        try {
          const source = await fetchResumeImportPhotoCandidateSource(
            candidate.assetId,
            controller.signal,
          );
          const objectUrl = await loadCanonicalCandidatePhoto(
            source,
            controller.signal,
          );
          if (controller.signal.aborted) {
            URL.revokeObjectURL(objectUrl);
            return;
          }
          loadedUrls.push(objectUrl);
          setPreviews((current) => ({
            ...current,
            [candidate.assetId]: { status: "ready", objectUrl },
          }));
        } catch {
          if (controller.signal.aborted) return;
          setPreviews((current) => ({
            ...current,
            [candidate.assetId]: { status: "unavailable" },
          }));
        }
      }),
    );

    return () => {
      controller.abort();
      loadedUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [candidates]);

  if (candidates.length === 0) return null;

  return (
    <fieldset className="resume-import-photo-choices" disabled={disabled}>
      <legend>Possible candidate photo from PDF</legend>
      <p className="resume-import-photo-guidance">
        These images were extracted from the PDF. Select one only if it is the
        candidate photo you want to use. You can also add or replace a photo
        later in Resume Studio.
      </p>

      <label className="resume-import-photo-option resume-import-photo-option--none">
        <input
          type="radio"
          name={name}
          checked={selectedAssetId === undefined}
          disabled={disabled}
          onChange={() => onChange(undefined)}
        />
        <span>Do not import a photo</span>
      </label>

      <div className="resume-import-photo-grid">
        {candidates.map((candidate, index) => {
          const preview = previews[candidate.assetId];
          return (
            <label
              className={`resume-import-photo-option resume-import-photo-card${
                selectedAssetId === candidate.assetId
                  ? " resume-import-photo-card--selected"
                  : ""
              }`}
              key={candidate.assetId}
            >
              <input
                type="radio"
                name={name}
                aria-label={`Use extracted photo ${index + 1}`}
                checked={selectedAssetId === candidate.assetId}
                disabled={disabled}
                onChange={() => onChange(candidate.assetId)}
              />
              <span className="resume-import-photo-preview">
                {preview?.status === "ready" && preview.objectUrl ? (
                  <img
                    src={preview.objectUrl}
                    alt={`Extracted PDF image ${index + 1}`}
                  />
                ) : preview?.status === "unavailable" ? (
                  <span>Preview unavailable</span>
                ) : (
                  <span>Loading preview…</span>
                )}
              </span>
              <span className="resume-import-photo-label">
                Use extracted photo {index + 1}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
