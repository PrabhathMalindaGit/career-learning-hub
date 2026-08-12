export async function fetchResumeCandidatePhotoSource(
  resumeId: string,
  signal?: AbortSignal,
) {
  const api = await import("./resumeApi");
  return api.fetchResumeCandidatePhotoSource(resumeId, signal);
}

export async function uploadResumeCandidatePhoto(
  resumeId: string,
  file: File,
  expectedCandidatePhotoAssetId: string | undefined,
  signal?: AbortSignal,
) {
  const api = await import("./resumeApi");
  return api.uploadResumeCandidatePhoto(
    resumeId,
    file,
    expectedCandidatePhotoAssetId,
    signal,
  );
}

export async function removeResumeCandidatePhoto(
  resumeId: string,
  expectedCandidatePhotoAssetId: string,
  signal?: AbortSignal,
) {
  const api = await import("./resumeApi");
  return api.removeResumeCandidatePhoto(
    resumeId,
    expectedCandidatePhotoAssetId,
    signal,
  );
}
