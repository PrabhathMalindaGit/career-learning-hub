import {
  ApiError,
  requestWithMetadata,
  type ApiRequestOptions,
} from "../../api/apiClient";
import {
  parseAcceptedInterviewJob,
  parseAttemptDetail,
  parseAttemptList,
  parseCreatedSession,
  parseCreatedQuestion,
  parseExplanationResponse,
  parseFeedbackResponse,
  parseInterviewJob,
  parseQuestionDetail,
  parseQuestionList,
  parseRecordedAttempt,
  parseSessionDetail,
  parseSessionList,
} from "./interviewContracts";
import type {
  CreateInterviewSessionInput,
  EffectiveInterviewQuestionType,
  InterviewAttemptStatus,
  InterviewDifficulty,
  InterviewJob,
  InterviewJobType,
  InterviewQuestionType,
  InterviewSessionStatus,
  ManualInterviewQuestionInput,
  TypedInterviewAnswer,
} from "./types";

function boundedInteger(
  value: number | undefined,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  if (value === undefined || !Number.isFinite(value)) return fallback;
  return Math.min(maximum, Math.max(minimum, Math.trunc(value)));
}

function canonicalList(values: readonly string[]): string[] {
  return values
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 50);
}

function canonicalOptions(values: readonly string[]): string[] {
  return values
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function paginationQuery(input: {
  page?: number;
  limit?: number;
}): URLSearchParams {
  return new URLSearchParams({
    page: String(
      boundedInteger(input.page, 1, 1, Number.MAX_SAFE_INTEGER),
    ),
    limit: String(boundedInteger(input.limit, 20, 1, 100)),
  });
}

function routeId(value: string): string {
  return encodeURIComponent(value);
}

async function requestParsed<T>(
  path: string,
  options: ApiRequestOptions,
  parse: (value: unknown) => T,
): Promise<T> {
  const response = await requestWithMetadata<unknown>(path, options);
  try {
    return parse(response.data);
  } catch (error) {
    if (
      !(error instanceof ApiError) ||
      error.status !== 502 ||
      error.code !== "INVALID_INTERVIEW_RESPONSE"
    ) {
      throw error;
    }
    throw new ApiError(
      502,
      "INVALID_INTERVIEW_RESPONSE",
      "The server returned an invalid interview response.",
      response.requestId,
    );
  }
}

type LegacyManualInterviewQuestionInput = Omit<
  ManualInterviewQuestionInput,
  "questionType" | "multipleChoice" | "starterCode"
> & {
  questionType?: never;
  multipleChoice?: never;
  starterCode?: never;
};

type GenerateInterviewQuestionsInput = {
  requestId: string;
  count: number;
  categories: string[];
  questionTypes: InterviewQuestionType[];
  typeCounts?: Partial<Record<InterviewQuestionType, number>>;
};

type LegacyGenerateInterviewQuestionsInput = {
  requestId: string;
  count: number;
  categories: string[];
  questionTypes?: never;
  typeCounts?: never;
};

type InterviewAttemptSubmission =
  | { answerText: string }
  | { answer: TypedInterviewAnswer };

function canonicalTypedAnswer(
  answer: TypedInterviewAnswer,
): TypedInterviewAnswer {
  if (answer.type === "multiple-choice") {
    return {
      type: answer.type,
      selectedOptionId: answer.selectedOptionId.trim(),
    };
  }
  return {
    type: answer.type,
    text: answer.text.trim(),
  } as TypedInterviewAnswer;
}

function expectedTypeForSubmission(
  submission: InterviewAttemptSubmission,
): EffectiveInterviewQuestionType {
  return "answerText" in submission
    ? "legacy-open-response"
    : submission.answer.type;
}

// Feature 4.1 — Interview session collection list/filter/pagination API boundary.
export async function listInterviewSessions(
  input: {
    page?: number;
    limit?: number;
    status?: InterviewSessionStatus;
  } = {},
  signal?: AbortSignal,
) {
  const query = paginationQuery(input);
  if (input.status) query.set("status", input.status);
  return requestParsed(
    `/interview-sessions?${query}`,
    { authentication: "required", signal },
    parseSessionList,
  );
}

// Feature 4.3 — Persist Career area / role / experience / practice context for a new session.
export async function createInterviewSession(
  input: CreateInterviewSessionInput,
  signal?: AbortSignal,
) {
  const jobDescription = input.jobDescription?.trim();
  return requestParsed(
    "/interview-sessions",
    {
      method: "POST",
      authentication: "required",
      signal,
      body: {
        title: input.title.trim(),
        targetRole: input.targetRole.trim(),
        experienceLevel: input.experienceLevel.trim(),
        focusTopics: canonicalList(input.focusTopics),
        skillGaps: canonicalList(input.skillGaps),
        ...(jobDescription ? { jobDescription } : {}),
        mode: input.mode,
        manualQuestions: [],
      },
    },
    parseCreatedSession,
  );
}

export async function fetchInterviewSession(
  sessionId: string,
  signal?: AbortSignal,
) {
  return requestParsed(
    `/interview-sessions/${routeId(sessionId)}`,
    { authentication: "required", signal },
    (data) => parseSessionDetail(data, sessionId),
  );
}

// Feature 4.13 — Session lifecycle status update used by complete/archive/restore flows.
export async function updateInterviewSessionStatus(
  sessionId: string,
  status: InterviewSessionStatus,
  signal?: AbortSignal,
) {
  return requestParsed(
    `/interview-sessions/${routeId(sessionId)}/status`,
    {
      method: "PATCH",
      body: { status },
      authentication: "required",
      signal,
    },
    (data) => parseSessionDetail(data, sessionId),
  );
}

// Feature 4.7 — Question Index filtering/pinning list boundary.
export async function listInterviewQuestions(
  sessionId: string,
  input: {
    page?: number;
    limit?: number;
    pinned?: boolean;
    difficulty?: InterviewDifficulty;
    category?: string;
  } = {},
  signal?: AbortSignal,
) {
  const query = paginationQuery(input);
  if (input.pinned !== undefined) {
    query.set("pinned", String(input.pinned));
  }
  if (input.difficulty) query.set("difficulty", input.difficulty);
  if (input.category?.trim()) {
    query.set("category", input.category.trim());
  }
  return requestParsed(
    `/interview-sessions/${routeId(sessionId)}/questions?${query}`,
    { authentication: "required", signal },
    (data) => parseQuestionList(data, sessionId),
  );
}

// Feature 4.5 — Add manually: persist one user-authored Interview question.
export async function addManualQuestion(
  sessionId: string,
  input:
    | ManualInterviewQuestionInput
    | LegacyManualInterviewQuestionInput,
  signal?: AbortSignal,
) {
  const modelAnswer = input.modelAnswer?.trim();
  const questionType = input.questionType;
  const typedInput =
    questionType === undefined
      ? undefined
      : (input as ManualInterviewQuestionInput);
  const starterCode =
    typedInput?.questionType === "coding"
      ? typedInput.starterCode?.trim()
      : undefined;
  const multipleChoice =
    typedInput?.questionType === "multiple-choice" &&
    typedInput.multipleChoice
      ? {
          options: canonicalOptions(
            typedInput.multipleChoice.options,
          ),
          correctOptionIndex:
            typedInput.multipleChoice.correctOptionIndex,
        }
      : undefined;

  return requestParsed(
    `/interview-sessions/${routeId(sessionId)}/questions`,
    {
      method: "POST",
      authentication: "required",
      signal,
      body: {
        ...(questionType === undefined ? {} : { questionType }),
        category: input.category.trim(),
        difficulty: input.difficulty,
        question: input.question.trim(),
        ...(multipleChoice === undefined
          ? {
              ...(starterCode ? { starterCode } : {}),
              ...(modelAnswer ? { modelAnswer } : {}),
            }
          : { multipleChoice }),
      },
    },
    (data) => parseCreatedQuestion(data, sessionId),
  );
}

// Feature 4.4 — Start durable AI question generation for the session.
export async function generateInterviewQuestions(
  sessionId: string,
  input:
    | GenerateInterviewQuestionsInput
    | LegacyGenerateInterviewQuestionsInput,
  signal?: AbortSignal,
) {
  const selectedTypes = input.questionTypes?.slice(0, 6);
  const typeCounts =
    selectedTypes && input.typeCounts
      ? selectedTypes.reduce<
          Partial<Record<InterviewQuestionType, number>>
        >((result, type) => {
          const count = input.typeCounts?.[type];
          if (count !== undefined) result[type] = count;
          return result;
        }, {})
      : undefined;

  return requestParsed(
    `/interview-sessions/${routeId(sessionId)}/questions/generate`,
    {
      method: "POST",
      authentication: "required",
      signal,
      body: {
        requestId: input.requestId,
        count: boundedInteger(input.count, 10, 1, 20),
        categories: canonicalList(input.categories),
        ...(selectedTypes === undefined
          ? {}
          : { questionTypes: selectedTypes }),
        ...(typeCounts === undefined ? {} : { typeCounts }),
      },
    },
    (data) =>
      parseAcceptedInterviewJob(
        data,
        "interview.questions.generate",
      ),
  );
}

export async function fetchInterviewQuestion(
  sessionId: string,
  questionId: string,
  signal?: AbortSignal,
) {
  return requestParsed(
    `/interview-sessions/${routeId(sessionId)}/questions/${routeId(
      questionId,
    )}`,
    { authentication: "required", signal },
    (data) => parseQuestionDetail(data, sessionId, questionId),
  );
}

// Feature 4.7 — Pin/unpin the selected Interview question.
export async function setQuestionPinned(
  sessionId: string,
  questionId: string,
  isPinned: boolean,
  signal?: AbortSignal,
) {
  return requestParsed(
    `/interview-sessions/${routeId(sessionId)}/questions/${routeId(
      questionId,
    )}/pin`,
    {
      method: "PATCH",
      body: { isPinned },
      authentication: "required",
      signal,
    },
    (data) => parseQuestionDetail(data, sessionId, questionId),
  );
}

// Feature 4.8 — Save private notes for the selected Interview question.
export async function saveQuestionNotes(
  sessionId: string,
  questionId: string,
  notes: string,
  signal?: AbortSignal,
) {
  return requestParsed(
    `/interview-sessions/${routeId(sessionId)}/questions/${routeId(
      questionId,
    )}/notes`,
    {
      method: "PATCH",
      body: { notes: notes.trim() },
      authentication: "required",
      signal,
    },
    (data) => parseQuestionDetail(data, sessionId, questionId),
  );
}

// Feature 4.11 — Request durable AI explanation for the selected question.
export async function requestQuestionExplanation(
  sessionId: string,
  questionId: string,
  signal?: AbortSignal,
) {
  return requestParsed(
    `/interview-sessions/${routeId(sessionId)}/questions/${routeId(
      questionId,
    )}/explanation`,
    {
      method: "POST",
      authentication: "required",
      signal,
    },
    (data) => parseExplanationResponse(data, sessionId, questionId),
  );
}

// Feature 4.9 — Save one independent Interview practice attempt.
export async function recordInterviewAttempt(
  sessionId: string,
  questionId: string,
  submission: InterviewAttemptSubmission | string,
  signal?: AbortSignal,
) {
  const normalizedSubmission: InterviewAttemptSubmission =
    typeof submission === "string"
      ? { answerText: submission.trim() }
      : "answerText" in submission
        ? { answerText: submission.answerText.trim() }
        : { answer: canonicalTypedAnswer(submission.answer) };

  return requestParsed(
    `/interview-sessions/${routeId(sessionId)}/questions/${routeId(
      questionId,
    )}/attempts`,
    {
      method: "POST",
      body: normalizedSubmission,
      authentication: "required",
      signal,
    },
    (data) =>
      parseRecordedAttempt(
        data,
        sessionId,
        questionId,
        expectedTypeForSubmission(normalizedSubmission),
      ),
  );
}

// Feature 4.10 — Saved-attempt history list/filter/pagination boundary.
export async function listAttemptHistory(
  sessionId: string,
  input: {
    page?: number;
    limit?: number;
    questionId?: string;
    status?: InterviewAttemptStatus;
  } = {},
  signal?: AbortSignal,
) {
  const query = paginationQuery(input);
  if (input.questionId) query.set("questionId", input.questionId);
  if (input.status) query.set("status", input.status);
  return requestParsed(
    `/interview-sessions/${routeId(sessionId)}/attempts?${query}`,
    { authentication: "required", signal },
    (data) => parseAttemptList(data, sessionId, input.questionId),
  );
}

// Feature 4.10 — Fetch one saved attempt for review.
export async function fetchInterviewAttempt(
  sessionId: string,
  attemptId: string,
  signal?: AbortSignal,
  expectedQuestionId?: string,
  expectedQuestionType?: EffectiveInterviewQuestionType,
) {
  return requestParsed(
    `/interview-sessions/${routeId(sessionId)}/attempts/${routeId(
      attemptId,
    )}`,
    { authentication: "required", signal },
    (data) =>
      parseAttemptDetail(
        data,
        sessionId,
        attemptId,
        expectedQuestionId,
        expectedQuestionType,
      ),
  );
}

// Feature 4.12 — Request durable model-generated practice feedback for an eligible saved attempt.
export async function requestAttemptFeedback(
  sessionId: string,
  attemptId: string,
  signal?: AbortSignal,
  expectedQuestionId?: string,
  expectedQuestionType?: EffectiveInterviewQuestionType,
) {
  return requestParsed(
    `/interview-sessions/${routeId(sessionId)}/attempts/${routeId(
      attemptId,
    )}/feedback`,
    {
      method: "POST",
      authentication: "required",
      signal,
    },
    (data) =>
      parseFeedbackResponse(
        data,
        sessionId,
        attemptId,
        expectedQuestionId,
        expectedQuestionType,
      ),
  );
}

export async function fetchInterviewJob(
  jobId: string,
  signal?: AbortSignal,
  expectation?: {
    expectedType: InterviewJobType;
    expectedResultId?: string;
  },
): Promise<InterviewJob> {
  return requestParsed(
    `/jobs/${routeId(jobId)}`,
    {
      authentication: "required",
      signal,
    },
    (data) => {
      const job = parseInterviewJob(data);
      const resultId =
        job.result?.kind === "explanation"
          ? job.result.questionId
          : job.result?.kind === "feedback"
            ? job.result.attemptId
            : undefined;
      if (
        expectation &&
        (job.id !== jobId ||
          job.type !== expectation.expectedType ||
          (job.status === "completed" &&
            expectation.expectedResultId !== undefined &&
            resultId !== expectation.expectedResultId))
      ) {
        throw new ApiError(
          502,
          "INVALID_INTERVIEW_RESPONSE",
          "The server returned an invalid interview response.",
        );
      }
      return job;
    },
  );
}

export * from "./interviewContracts";
export * from "./interviewPolling";
