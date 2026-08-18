// Feature 6.2 — Fixed Gemini release-model policy shared by Settings and execution.
// Feature 6.2 BACKEND — Fixed Gemini release model.
// =========================================================
// FIND: GEMINI MODEL BACKEND
// DOES: Defines the single fixed Gemini release model used by Settings and jobs.
// UI: GeminiConnectionSettings.tsx -> FIND: GEMINI MODEL
// =========================================================
export const GEMINI_RELEASE_MODEL = "gemini-3.6-flash" as const;
