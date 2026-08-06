import { randomUUID } from "node:crypto";
import { Types } from "mongoose";
import { describe, expect, it } from "vitest";
import {
  assertJobExecutionActive,
  beginJobPersistence,
  cancelOwnedJobExecution,
  claimNextJob,
  completeJob,
  failOrRetryJob,
  heartbeatJob,
  type JobExecutionIdentity,
  updateJobPhase,
} from "../../jobs/job.queue.js";
import {
  abortAllActiveJobExecutions,
  registerActiveJobExecution,
  unregisterActiveJobExecution,
} from "../../jobs/job.execution.js";
import { JobRecordModel } from "../../jobs/job.model.js";
import { AppError } from "../../shared/appError.js";

async function queuedJob(userId = new Types.ObjectId()) {
  return JobRecordModel.create({
    userId,
    type: "resume.analyze",
    payload: { userId: userId.toString() },
    maxAttempts: 3,
  });
}

function identity(job: {
  _id: Types.ObjectId;
  executionId?: string;
  attempts: number;
}): JobExecutionIdentity {
  if (!job.executionId) throw new Error("Expected a claimed execution ID.");
  return {
    jobId: job._id.toString(),
    executionId: job.executionId,
    attempt: job.attempts,
  };
}

describe("durable job execution fences", () => {
  it("assigns a fresh execution ID and keeps progress phases monotonic", async () => {
    const created = await queuedJob();
    const first = await claimNextJob();
    expect(first).toMatchObject({
      _id: created._id,
      status: "processing",
      attempts: 1,
      phase: "preparing",
    });
    expect(first?.executionId).toMatch(/^[0-9a-f-]{36}$/i);

    const execution = identity(first!);
    await updateJobPhase(execution, "receiving_response");
    await updateJobPhase(execution, "contacting_provider");

    await expect(JobRecordModel.findById(created._id).lean()).resolves.toMatchObject({
      phase: "receiving_response",
    });

    await JobRecordModel.updateOne(
      { _id: created._id },
      { $set: { lockExpiresAt: new Date(0) } },
    );
    const second = await claimNextJob();
    expect(second?.executionId).not.toBe(first?.executionId);
    expect(second?.attempts).toBe(2);
  });

  it("makes cancellation terminal when it wins before persisting", async () => {
    const created = await queuedJob();
    const claimed = (await claimNextJob())!;
    const execution = identity(claimed);

    const cancelled = await cancelOwnedJobExecution(
      created.userId!.toString(),
      created._id.toString(),
    );

    expect(cancelled.status).toBe("cancelled");
    await expect(beginJobPersistence(execution)).rejects.toMatchObject({
      code: "JOB_EXECUTION_FENCE_LOST",
      retryable: false,
    });
    await expect(completeJob(execution, { saved: true })).rejects.toMatchObject({
      code: "JOB_EXECUTION_FENCE_LOST",
    });
    const stored = await JobRecordModel.findById(created._id).lean();
    expect(stored).toMatchObject({
      status: "cancelled",
      phase: "cancelled",
    });
    expect(stored).not.toHaveProperty("result");
  });

  it("rejects cancellation when persisting wins and allows the atomic save to finish", async () => {
    const created = await queuedJob();
    const claimed = (await claimNextJob())!;
    const execution = identity(claimed);

    await beginJobPersistence(execution);
    await expect(
      cancelOwnedJobExecution(
        created.userId!.toString(),
        created._id.toString(),
      ),
    ).rejects.toMatchObject({ code: "JOB_NOT_CANCELLABLE", statusCode: 409 });
    await completeJob(execution, { saved: true });

    await expect(JobRecordModel.findById(created._id).lean()).resolves.toMatchObject({
      status: "completed",
      phase: "completed",
      result: { saved: true },
    });
  });

  it("prevents an expired execution from completing after a newer claim", async () => {
    const created = await queuedJob();
    const first = (await claimNextJob())!;
    const oldExecution = identity(first);
    await JobRecordModel.updateOne(
      { _id: created._id },
      { $set: { lockExpiresAt: new Date(0) } },
    );
    const second = (await claimNextJob())!;

    await expect(completeJob(oldExecution, { stale: true })).rejects.toMatchObject({
      code: "JOB_EXECUTION_FENCE_LOST",
    });
    await beginJobPersistence(identity(second));
    await completeJob(identity(second), { current: true });
    await expect(JobRecordModel.findById(created._id).lean()).resolves.toMatchObject({
      status: "completed",
      result: { current: true },
    });
  });

  it("actively aborts the in-flight signal when heartbeat detects a lost fence", async () => {
    const created = await queuedJob();
    const claimed = (await claimNextJob())!;
    const execution = identity(claimed);
    const controller = new AbortController();
    registerActiveJobExecution(execution, controller);
    await JobRecordModel.updateOne(
      { _id: created._id },
      {
        $set: {
          status: "cancelled",
          phase: "cancelled",
          cancelledAt: new Date(),
          cancellationReason: "user_requested",
        },
        $unset: {
          lockedAt: 1,
          lockExpiresAt: 1,
          lockedBy: 1,
        },
      },
    );

    await expect(heartbeatJob(execution)).rejects.toMatchObject({
      code: "JOB_EXECUTION_FENCE_LOST",
    });

    expect(controller.signal.aborted).toBe(true);
    expect(controller.signal.reason).toBe("lease_lost");
    unregisterActiveJobExecution(execution);
  });

  it("actively aborts all in-flight executions when the worker stops", () => {
    const first = {
      jobId: new Types.ObjectId().toString(),
      executionId: randomUUID(),
      attempt: 1,
    };
    const second = {
      jobId: new Types.ObjectId().toString(),
      executionId: randomUUID(),
      attempt: 1,
    };
    const firstController = new AbortController();
    const secondController = new AbortController();
    registerActiveJobExecution(first, firstController);
    registerActiveJobExecution(second, secondController);

    abortAllActiveJobExecutions("worker_stopping");

    expect(firstController.signal.reason).toBe("worker_stopping");
    expect(secondController.signal.reason).toBe("worker_stopping");
    unregisterActiveJobExecution(first);
    unregisterActiveJobExecution(second);
  });

  it("keeps total provider attempts equal to total worker attempts", async () => {
    const created = await queuedJob();
    let providerAttempts = 0;
    const claimedWorkerAttempts: number[] = [];

    for (let expectedAttempt = 1; expectedAttempt <= 3; expectedAttempt += 1) {
      const claimed = (await claimNextJob())!;
      claimedWorkerAttempts.push(claimed.attempts);
      providerAttempts += 1;
      await assertJobExecutionActive(identity(claimed));

      if (expectedAttempt < 3) {
        await failOrRetryJob(
          claimed,
          new AppError(
            503,
            "AI_PROVIDER_UNAVAILABLE",
            "The AI provider is temporarily unavailable.",
            undefined,
            true,
            "RETRYABLE_PROVIDER_UNAVAILABLE",
          ),
        );
        await JobRecordModel.updateOne(
          { _id: created._id },
          { $set: { runAt: new Date(0) } },
        );
      } else {
        await beginJobPersistence(identity(claimed));
        await completeJob(identity(claimed), { saved: true });
      }
    }

    expect(providerAttempts).toBe(3);
    expect(claimedWorkerAttempts).toEqual([1, 2, 3]);
    expect(providerAttempts).toBe(claimedWorkerAttempts.length);
  });
});
