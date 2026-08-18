import { z } from "zod";
import { registerJobHandler } from "../../jobs/job.registry.js";
import {
  analyzeResume,
  prepareResumePdfImport,
} from "./resumeAnalysis.service.js";

let registered = false;

// Features 3.9–3.10 — Resume assessment job boundary.
// Runs assessment work against the authorized saved Resume version and returns
// validated job results that the workspace can review before applying changes.
export function registerResumeAnalysisJobHandlers(): void {
  if (registered) return;
  registered = true;

  // =========================================================
  // FIND: IMPORT RESUME PDF BACKEND
  // DOES: Parses an owned private PDF into a staged Resume import review.
  // UI: ResumeCreateDialog.tsx -> FIND: IMPORT RESUME PDF
  // =========================================================
  registerJobHandler(
    // Feature 3.2.3 BACKEND — Resume PDF import job.
    "resume.import-pdf",
    z.object({
      userId: z.string().regex(/^[a-f\d]{24}$/i),
      assetId: z.string().regex(/^[a-f\d]{24}$/i),
      title: z.string().min(1).max(120),
    }),
    async (payload, context) => {
      await context.reportProgress(10);
      const result = await prepareResumePdfImport({
        ...payload,
        jobId: context.jobId,
        execution: context,
      });
      await context.reportProgress(100);
      return result;
    },
  );

  // Feature 3.9 — Durable Resume AI assessment job.
  // Feature 3.10 — Validated result is reviewed before user-controlled suggestion application.
  // =========================================================
  // FIND: RUN AI ASSESSMENT BACKEND
  // DOES: Runs the validated AI assessment for an owned saved Resume version.
  // UI: ResumeWorkspace.tsx -> FIND: RUN AI ASSESSMENT
  // =========================================================
  registerJobHandler(
    // Feature 3.9 BACKEND — Resume AI assessment job.
    "resume.analyze",
    z.object({
      userId: z.string().regex(/^[a-f\d]{24}$/i),
      resumeId: z.string().regex(/^[a-f\d]{24}$/i),
      versionId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
      targetRole: z.string().min(2).max(200),
      company: z.string().max(200).optional(),
      jobDescription: z.string().max(30_000).optional(),
    }),
    async (payload, context) => {
      await context.reportProgress(10);
      const analysis = await analyzeResume({
        ...payload,
        jobId: context.jobId,
        execution: context,
      });
      await context.reportProgress(100);

      return {
        analysisId: analysis._id.toString(),
        resumeId: analysis.resumeId.toString(),
        resumeVersionId: analysis.resumeVersionId.toString(),
        totalScore: analysis.totalScore,
      };
    },
  );
}
