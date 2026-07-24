import { z } from "zod";
import { registerJobHandler } from "../../jobs/job.registry.js";
import {
  analyzeResume,
  importResumePdf,
} from "./resumeAnalysis.service.js";

let registered = false;

export function registerResumeAnalysisJobHandlers(): void {
  if (registered) return;
  registered = true;

  registerJobHandler(
    "resume.import-pdf",
    z.object({
      userId: z.string().regex(/^[a-f\d]{24}$/i),
      assetId: z.string().regex(/^[a-f\d]{24}$/i),
      title: z.string().min(1).max(120),
    }),
    async (payload, context) => {
      await context.reportProgress(10);
      const result = await importResumePdf({
        ...payload,
        jobId: context.jobId,
      });
      await context.reportProgress(100);
      return result;
    },
  );

  registerJobHandler(
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
