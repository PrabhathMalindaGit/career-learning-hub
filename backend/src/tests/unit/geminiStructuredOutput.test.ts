import { Types } from "mongoose";
import { z } from "zod";
import { afterEach, describe, expect, it, vi } from "vitest";
import { generateStructuredOutput } from "../../modules/ai/aiGateway.service.js";
import { AiQuotaCounterModel } from "../../modules/ai/aiQuota.model.js";
import { UsageEventModel } from "../../modules/ai/usageEvent.model.js";
import { toProviderJsonSchema } from "../../modules/ai/providerJsonSchema.js";
import { GeminiProviderAdapter } from "../../modules/ai/providers/gemini.provider.js";
import { AiProviderError } from "../../modules/ai/providers/provider.types.js";
import {
  aiAnalysisResultSchema,
  parsedResumeSchema,
} from "../../modules/resume-analysis/resumeAnalysis.schemas.js";
import { parseResumeText } from "../../modules/resume-analysis/resumeParsing.service.js";
import {
  attemptFeedbackResultSchema,
  generatedQuestionSetSchema,
  questionExplanationResultSchema,
} from "../../modules/interviews/interview.schemas.js";
import {
  documentChatResultSchema,
  documentSummaryResultSchema,
  flashcardGenerationResultSchema,
  quizGenerationResultSchema,
} from "../../modules/learning/learning.schemas.js";
import { AppError } from "../../shared/appError.js";

function geminiResponse(
  value: unknown,
  init: { status?: number; statusText?: string } = {},
): Response {
  return new Response(JSON.stringify(value), {
    status: init.status ?? 200,
    statusText: init.statusText,
    headers: { "Content-Type": "application/json" },
  });
}

function providerRequest(
  overrides: Partial<Parameters<GeminiProviderAdapter["generateStructured"]>[0]> = {},
) {
  return {
    systemPrompt: "Return a structured result.",
    userPrompt: "Use synthetic input only.",
    model: "gemini-3.6-flash",
    responseJsonSchema: {
      type: "object",
      properties: { answer: { type: "string" } },
      required: ["answer"],
      additionalProperties: false,
    },
    signal: new AbortController().signal,
    ...overrides,
  };
}

describe("Gemini structured output", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("converts every supported feature schema into a provider JSON Schema", () => {
    for (const schema of [
      aiAnalysisResultSchema,
      parsedResumeSchema,
      generatedQuestionSetSchema,
      questionExplanationResultSchema,
      attemptFeedbackResultSchema,
      documentSummaryResultSchema,
      documentChatResultSchema,
      flashcardGenerationResultSchema,
      quizGenerationResultSchema,
    ]) {
      const converted = toProviderJsonSchema(schema);
      expect(converted).toMatchObject({
        type: "object",
        properties: expect.any(Object),
        additionalProperties: false,
      });
      expect(converted).not.toHaveProperty("$schema");
      expect(converted).not.toHaveProperty("$ref");
      expect(JSON.stringify(converted)).not.toMatch(
        /"(?:default|format|minLength|maxLength|minimum|maximum|minItems|maxItems)":/,
      );
    }

    expect(toProviderJsonSchema(aiAnalysisResultSchema).required).toEqual([
      "scoreBreakdown",
    ]);
    expect(
      toProviderJsonSchema(
        z.object({ status: z.literal("ok") }).strict(),
      ),
    ).toMatchObject({
      properties: {
        status: { type: "string", enum: ["ok"] },
      },
      required: ["status"],
    });
  });

  it("sends the exact response schema to Gemini and omits Gemini 3 sampling parameters", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      geminiResponse({
        candidates: [{ content: { parts: [{ text: '{"answer":"ok"}' }] } }],
        usageMetadata: { promptTokenCount: 5, candidatesTokenCount: 2 },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await new GeminiProviderAdapter().generateStructured(providerRequest());

    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    const body = JSON.parse(String(init.body)) as {
      generationConfig: Record<string, unknown>;
    };
    expect(url.searchParams.has("key")).toBe(true);
    expect(init.headers).toEqual({ "Content-Type": "application/json" });
    expect(body.generationConfig).toEqual({
      responseMimeType: "application/json",
      responseJsonSchema: providerRequest().responseJsonSchema,
    });
  });

  it("parses and returns a schema-valid response through the gateway", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        geminiResponse({
          candidates: [{ content: { parts: [{ text: '{"answer":"valid"}' }] } }],
          usageMetadata: { promptTokenCount: 3, candidatesTokenCount: 2 },
        }),
      ),
    );
    const schema = z.object({ answer: z.string().min(1) }).strict();

    await expect(
      generateStructuredOutput({
        userId: new Types.ObjectId().toString(),
        feature: "test.structured.success",
        systemPrompt: "Return JSON.",
        userPrompt: "Synthetic input.",
        schema,
      }),
    ).resolves.toEqual({ answer: "valid" });
  });

  it.each([
    ["malformed JSON", "not-json", "AI_INVALID_JSON"],
    ["schema-invalid JSON", '{"answer":42}', "AI_SCHEMA_VALIDATION_FAILED"],
  ])("rejects %s and reconciles the failed token reservation", async (_label, text, code) => {
    const userId = new Types.ObjectId().toString();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        geminiResponse({
          candidates: [{ content: { parts: [{ text }] } }],
          usageMetadata: { promptTokenCount: 4, candidatesTokenCount: 2 },
        }),
      ),
    );

    await expect(
      generateStructuredOutput({
        userId,
        feature: "test.structured.failure",
        systemPrompt: "Return JSON.",
        userPrompt: "Synthetic input.",
        schema: z.object({ answer: z.string() }).strict(),
      }),
    ).rejects.toMatchObject({ code, retryable: false });

    const quota = await AiQuotaCounterModel.findOne({ userId }).lean();
    const usage = await UsageEventModel.findOne({ userId }).lean();
    expect(quota).toMatchObject({ requestCount: 1, tokenCount: 6 });
    expect(usage).toMatchObject({ status: "failure", errorCode: code });
  });

  it("releases a failed provider token estimate while retaining the request attempt", async () => {
    const userId = new Types.ObjectId().toString();
    const fetchMock = vi.fn().mockResolvedValue(
      geminiResponse(
        { error: { status: "NOT_FOUND", message: "Synthetic detail." } },
        { status: 404 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      generateStructuredOutput({
        userId,
        feature: "test.provider.failure",
        systemPrompt: "Return JSON.",
        userPrompt: "Synthetic input.",
        schema: z.object({ answer: z.string() }).strict(),
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND", retryable: false });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const quota = await AiQuotaCounterModel.findOne({ userId }).lean();
    const usage = await UsageEventModel.findOne({ userId }).lean();
    expect(quota).toMatchObject({ requestCount: 1, tokenCount: 0 });
    expect(usage).toMatchObject({
      status: "failure",
      errorCode: "NOT_FOUND",
      inputTokens: 0,
      outputTokens: 0,
    });
  });

  it.each([
    [400, "INVALID_ARGUMENT", "NON_RETRYABLE_REQUEST"],
    [401, "UNAUTHENTICATED", "NON_RETRYABLE_AUTHENTICATION"],
    [403, "PERMISSION_DENIED", "NON_RETRYABLE_AUTHENTICATION"],
    [404, "NOT_FOUND", "NON_RETRYABLE_CONFIGURATION"],
    [409, "ABORTED", "NON_RETRYABLE_REQUEST"],
  ] as const)("classifies deterministic HTTP %i %s failures as non-retryable", async (status, code, classification) => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        geminiResponse({ error: { status: code, message: "synthetic provider detail" } }, { status }),
      ),
    );

    await expect(
      new GeminiProviderAdapter().generateStructured(providerRequest()),
    ).rejects.toMatchObject({
      code,
      classification,
      retryable: false,
      statusCode: status,
    });
  });

  it.each([
    [408, "RETRYABLE_PROVIDER_TIMEOUT"],
    [429, "RETRYABLE_RATE_LIMIT"],
    [500, "RETRYABLE_PROVIDER_UNAVAILABLE"],
    [502, "RETRYABLE_PROVIDER_UNAVAILABLE"],
    [503, "RETRYABLE_PROVIDER_UNAVAILABLE"],
    [504, "RETRYABLE_PROVIDER_TIMEOUT"],
  ] as const)("classifies transient HTTP %i failures as retryable", async (status, classification) => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        geminiResponse({ error: { status: "UNAVAILABLE" } }, { status }),
      ),
    );

    await expect(
      new GeminiProviderAdapter().generateStructured(providerRequest()),
    ).rejects.toMatchObject({ classification, retryable: true, statusCode: status });
  });

  it("uses HTTP status when a transient error body is malformed", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("temporarily unavailable", { status: 503 }),
      ),
    );

    await expect(
      new GeminiProviderAdapter().generateStructured(providerRequest()),
    ).rejects.toMatchObject({
      classification: "RETRYABLE_PROVIDER_UNAVAILABLE",
      retryable: true,
      statusCode: 503,
    });
  });

  it("classifies parent cancellation as terminal", async () => {
    const controller = new AbortController();
    controller.abort();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("aborted")));

    await expect(
      new GeminiProviderAdapter().generateStructured(
        providerRequest({ signal: controller.signal }),
      ),
    ).rejects.toMatchObject({
      code: "AI_REQUEST_CANCELLED",
      classification: "CANCELLED",
      retryable: false,
    });
  });

  it("returns one retryable failure after exactly one provider attempt", async () => {
    const userId = new Types.ObjectId().toString();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        geminiResponse({ error: { status: "RESOURCE_EXHAUSTED" } }, { status: 429 }),
      )
      .mockResolvedValueOnce(
        geminiResponse({
          candidates: [{ content: { parts: [{ text: '{"answer":"after retry"}' }] } }],
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      generateStructuredOutput({
        userId,
        feature: "test.transient.retry",
        systemPrompt: "Return JSON.",
        userPrompt: "Synthetic input.",
        schema: z.object({ answer: z.string() }).strict(),
      }),
    ).rejects.toMatchObject({ retryable: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await expect(UsageEventModel.findOne({ userId }).lean()).resolves.toMatchObject({
      metadata: { providerAttempt: 1 },
    });
  });

  it("reports safe provider progress without exposing response fragments", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        geminiResponse({
          candidates: [{ content: { parts: [{ text: '{"answer":"valid"}' }] } }],
        }),
      ),
    );
    const phases: string[] = [];

    await generateStructuredOutput({
      userId: new Types.ObjectId().toString(),
      feature: "test.progress",
      systemPrompt: "Return JSON.",
      userPrompt: "Synthetic input.",
      schema: z.object({ answer: z.string() }).strict(),
      reportPhase: async (phase) => {
        phases.push(phase);
      },
    });

    expect(phases).toEqual([
      "contacting_provider",
      "waiting_for_first_response",
      "receiving_response",
      "validating",
    ]);
  });

  it("does not expose provider details that may contain credentials", async () => {
    const syntheticSecret = "synthetic-gemini-test-key";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        geminiResponse(
          {
            error: {
              status: "INVALID_ARGUMENT",
              message: `Authorization: Bearer token; key=${syntheticSecret}`,
            },
          },
          { status: 400 },
        ),
      ),
    );

    const error = await new GeminiProviderAdapter()
      .generateStructured(providerRequest())
      .catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(AiProviderError);
    expect((error as Error).message).not.toContain(syntheticSecret);
    expect((error as Error).message).not.toContain("Authorization");
  });

  it("keeps post-response semantic validation authoritative", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        geminiResponse({
          candidates: [{
            content: {
              parts: [{
                text: JSON.stringify({
                  questions: [{
                    questionIndex: 0,
                    prompt: "Synthetic question?",
                    choices: ["duplicate", "DUPLICATE"],
                    correctChoiceIndex: 0,
                    explanation: "Synthetic explanation.",
                    sourceChunkIndexes: [],
                  }],
                }),
              }],
            },
          }],
        }),
      ),
    );

    await expect(
      generateStructuredOutput({
        userId: new Types.ObjectId().toString(),
        feature: "test.semantic.validation",
        systemPrompt: "Return JSON.",
        userPrompt: "Synthetic input.",
        schema: quizGenerationResultSchema,
      }),
    ).rejects.toMatchObject({ code: "AI_SCHEMA_VALIDATION_FAILED" });
  });

  it("normalizes absent Gemini Resume scalar fields without weakening the canonical contract", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        geminiResponse({
          candidates: [{
            content: {
              parts: [{
                text: JSON.stringify({
                  basics: {
                    fullName: "Synthetic Candidate",
                    email: null,
                    phone: null,
                    location: null,
                    headline: null,
                    summary: null,
                    links: [],
                  },
                  experience: [],
                  education: [],
                  skills: [],
                  projects: [],
                  certifications: [{
                    name: "Synthetic Credential",
                    issuer: null,
                    issuedDate: null,
                    credentialUrl: "",
                  }],
                  languages: [],
                  interests: [],
                }),
              }],
            },
          }],
        }),
      ),
    );

    const parsed = await parseResumeText({
      userId: new Types.ObjectId().toString(),
      text: "Synthetic Resume text long enough to represent a safe private PDF fixture.",
    });

    expect(parsed.basics).toEqual({
      fullName: "Synthetic Candidate",
      links: [],
    });
    expect(parsed.certifications[0]).toMatchObject({
      name: "Synthetic Credential",
    });
    expect(parsed.certifications[0]?.credentialUrl).toBeUndefined();
  });

  it("reports safe field paths when Gemini Resume output fails semantic validation", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        geminiResponse({
          candidates: [{
            content: {
              parts: [{
                text: JSON.stringify({
                  basics: {
                    fullName: "Synthetic Candidate",
                    links: [{ label: "Portfolio", url: "not a URL" }],
                  },
                  experience: [],
                  education: [],
                  skills: [],
                  projects: [],
                  certifications: [],
                  languages: [],
                  interests: [],
                }),
              }],
            },
          }],
        }),
      ),
    );

    await expect(
      parseResumeText({
        userId: new Types.ObjectId().toString(),
        text: "Synthetic Resume text long enough to represent a safe private PDF fixture.",
      }),
    ).rejects.toMatchObject({
      code: "AI_SCHEMA_VALIDATION_FAILED",
      message: expect.stringContaining("basics.links.0.url"),
      retryable: false,
    });
  });
});
