import { JobRecordModel } from "../../jobs/job.model.js";
import { AppError } from "../../shared/appError.js";
import { withMongoTransaction } from "../../shared/mongoTransaction.js";
import { recordActivitySafely } from "../activity/activity.service.js";
import { InterviewAttemptModel } from "./interviewAttempt.model.js";
import { InterviewQuestionModel } from "./interviewQuestion.model.js";
import { requireOwnedSession } from "./interview.service.js";
import { InterviewSessionModel } from "./interviewSession.model.js";

const interviewJobTypes = [
  "interview.questions.generate",
  "interview.question.explain",
  "interview.attempt.feedback",
] as const;

function interviewJobFilter(userId: string, sessionId: string) {
  return {
    userId,
    type: { $in: interviewJobTypes },
    "payload.sessionId": sessionId,
  };
}

export async function deleteInterviewSession(input: {
  userId: string;
  sessionId: string;
}): Promise<void> {
  await withMongoTransaction(async (mongoSession) => {
    const session = await requireOwnedSession(
      input.userId,
      input.sessionId,
      mongoSession,
    );

    const activeJob = await JobRecordModel.exists({
      ...interviewJobFilter(input.userId, input.sessionId),
      status: { $in: ["queued", "processing"] },
    }).session(mongoSession);

    if (activeJob) {
      throw new AppError(
        409,
        "INTERVIEW_DELETE_BLOCKED_BY_ACTIVE_JOB",
        "Finish or cancel the current Interview AI work before permanently deleting this session.",
      );
    }

    await InterviewAttemptModel.deleteMany({
      userId: input.userId,
      sessionId: session._id,
    }).session(mongoSession);

    await InterviewQuestionModel.deleteMany({
      userId: input.userId,
      sessionId: session._id,
    }).session(mongoSession);

    await JobRecordModel.deleteMany({
      ...interviewJobFilter(input.userId, input.sessionId),
      status: { $in: ["completed", "failed", "cancelled"] },
    }).session(mongoSession);

    await InterviewSessionModel.deleteOne({
      _id: session._id,
      userId: input.userId,
    }).session(mongoSession);

    return session._id.toString();
  });

  await recordActivitySafely({
    userId: input.userId,
    type: "interview.session.deleted",
    resourceType: "interview-session",
    resourceId: input.sessionId,
  });
}
