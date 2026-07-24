import { z } from "zod";
import { cleanupExpiredTemporaryAssets } from "../modules/assets/asset.service.js";
import { recordActivitySafely } from "../modules/activity/activity.service.js";
import { registerJobHandler } from "./job.registry.js";
import { registerLearningJobHandlers } from "../modules/learning/learning.jobs.js";
import { registerInterviewJobHandlers } from "../modules/interviews/interview.jobs.js";
import { registerResumeAnalysisJobHandlers } from "../modules/resume-analysis/resumeAnalysis.jobs.js";

let registered = false;

export function registerInfrastructureJobHandlers(): void {
  if (registered) return;
  registered = true;

  registerLearningJobHandlers();

  registerInterviewJobHandlers();

  registerResumeAnalysisJobHandlers();

  registerJobHandler(
    "assets.cleanup",
    z.object({
      batchSize: z.number().int().min(1).max(1_000).default(100),
    }),
    async ({ batchSize }, context) => {
      await context.reportProgress(10);
      const result = await cleanupExpiredTemporaryAssets(batchSize);
      await context.reportProgress(100);

      await recordActivitySafely({
        type: "assets.cleanup.completed",
        origin: "worker",
        resourceType: "job",
        resourceId: context.jobId,
        metadata: result,
      });

      return result;
    },
  );

  registerJobHandler(
    "infrastructure.echo",
    z.object({
      message: z.string().min(1).max(500),
    }),
    async ({ message }, context) => {
      await context.reportProgress(50);

      await recordActivitySafely({
        userId: context.userId,
        type: "infrastructure.echo.completed",
        origin: "worker",
        resourceType: "job",
        resourceId: context.jobId,
      });

      return {
        message,
        processedAt: new Date().toISOString(),
        attempt: context.attempt,
      };
    },
  );
}
