export async function fetchResumeCandidatePhotoSource(
  ...args: Parameters<typeof import("./resumeApi")["fetchResumeCandidatePhotoSource"]>
) {
  const api = await import("./resumeApi");
  return api.fetchResumeCandidatePhotoSource(...args);
}

export async function uploadResumeCandidatePhoto(
  ...args: Parameters<typeof import("./resumeApi")["uploadResumeCandidatePhoto"]>
) {
  const api = await import("./resumeApi");
  return api.uploadResumeCandidatePhoto(...args);
}

export async function removeResumeCandidatePhoto(
  ...args: Parameters<typeof import("./resumeApi")["removeResumeCandidatePhoto"]>
) {
  const api = await import("./resumeApi");
  return api.removeResumeCandidatePhoto(...args);
}
