import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  createMemoryRouter,
  RouterProvider,
} from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../../api/apiClient";
import * as learningApi from "./learningApi";
import { LearningConversationWorkspace } from "./LearningConversationWorkspace";
import * as learningPolling from "./learningPolling";
import type {
  LearningChatJob,
  LearningDocument,
  LearningMessage,
} from "./types";

let accountId = "account-a";

vi.mock("../auth/AuthProvider", () => ({
  useAuth: () => ({
    status: "authenticated",
    user: {
      id: accountId,
      email: `${accountId}@example.test`,
      profile: { displayName: "Synthetic User" },
    },
  }),
}));

vi.mock("./learningApi", () => ({
  fetchLearningChatJob: vi.fn(),
  fetchLearningDocument: vi.fn(),
  listLearningMessages: vi.fn(),
  sendLearningMessage: vi.fn(),
}));

vi.mock("./learningPolling", async () => {
  const actual = await vi.importActual<typeof learningPolling>(
    "./learningPolling",
  );
  return {
    ...actual,
    pollLearningJob: vi.fn(),
  };
});

const documentId = "507f1f77bcf86cd799439011";
const conversationId = "507f1f77bcf86cd799439012";
const userMessageId = "507f1f77bcf86cd799439013";
const assistantMessageId = "507f1f77bcf86cd799439014";
const jobId = "507f1f77bcf86cd799439015";
const createdAt = "2026-07-26T01:00:00.000Z";

function learningDocument(
  overrides: Partial<LearningDocument> = {},
): LearningDocument {
  return {
    id: documentId,
    title: "Synthetic systems notes",
    originalFilename: "synthetic.pdf",
    mimeType: "application/pdf",
    status: "ready",
    pageCount: 4,
    chunkCount: 2,
    summaryKeyPoints: [],
    createdAt,
    updatedAt: createdAt,
    ...overrides,
  };
}

function message(
  overrides: Partial<LearningMessage> = {},
): LearningMessage {
  return {
    id: userMessageId,
    documentId,
    conversationId,
    role: "user",
    content: "What does **this** say?",
    sourcePages: [],
    createdAt,
    updatedAt: createdAt,
    ...overrides,
  };
}

function chatJob(
  status: LearningChatJob["status"],
  overrides: Partial<LearningChatJob> = {},
): LearningChatJob {
  return {
    id: jobId,
    type: "learning.chat.respond",
    status,
    progress: status === "completed" ? 100 : 10,
    attempts: 1,
    maxAttempts: 3,
    createdAt,
    updatedAt: createdAt,
    ...overrides,
  };
}

function renderConversation(
  initialPath =
    `/learning/documents/${documentId}/conversations/${conversationId}`,
) {
  const router = createMemoryRouter(
    [
      {
        path: "/learning/documents/:documentId/conversations/:conversationId",
        element: <LearningConversationWorkspace />,
      },
      {
        path: "/learning/documents/:documentId",
        element: <h1>Document workspace</h1>,
      },
    ],
    { initialEntries: [initialPath] },
  );
  render(<RouterProvider router={router} />);
  return router;
}

beforeEach(() => {
  accountId = "account-a";
  vi.stubGlobal("crypto", {
    randomUUID: vi
      .fn()
      .mockReturnValue("3159bf41-e3ac-409c-bad4-a77981000d52"),
  });
  vi.mocked(learningApi.fetchLearningDocument).mockResolvedValue({
    document: learningDocument(),
  });
  vi.mocked(learningApi.listLearningMessages).mockResolvedValue({
    messages: [],
    pagination: { page: 1, limit: 20, total: 0, pages: 0 },
  });
  vi.mocked(learningPolling.pollLearningJob).mockReturnValue(
    new Promise(() => undefined),
  );
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("Learning conversation workspace", () => {
  it("loads the exact route and shows an accessible empty history", async () => {
    renderConversation();

    expect(screen.getByText("Loading grounded conversation…")).not.toBeNull();
    expect(
      await screen.findByRole("heading", { name: "Ask the document" }),
    ).not.toBeNull();
    expect(screen.getByText("No messages yet.")).not.toBeNull();
    expect(learningApi.listLearningMessages).toHaveBeenCalledWith(
      documentId,
      conversationId,
      4,
      { page: 1, limit: 20 },
      expect.any(AbortSignal),
    );
    expect(
      screen.getByRole("textbox", { name: "Question" }),
    ).not.toBeNull();
  });

  it("renders canonical content as plain escaped text and only validated source controls", async () => {
    vi.mocked(learningApi.listLearningMessages).mockResolvedValue({
      messages: [
        message(),
        message({
          id: assistantMessageId,
          role: "assistant",
          content:
            "<script>must remain text</script> [Page 99](javascript:alert(1))",
          sourcePages: [2, 4],
          createdAt: "2026-07-26T01:00:01.000Z",
          updatedAt: "2026-07-26T01:00:01.000Z",
        }),
      ],
      pagination: { page: 1, limit: 20, total: 2, pages: 1 },
    });
    renderConversation();

    expect(
      await screen.findByText("<script>must remain text</script> [Page 99](javascript:alert(1))"),
    ).not.toBeNull();
    expect(document.querySelector("script")).toBeNull();
    expect(screen.queryByRole("link", { name: "Page 99" })).toBeNull();
    expect(screen.getByRole("button", { name: "Page 2" })).not.toBeNull();
    expect(screen.getByRole("button", { name: "Page 4" })).not.toBeNull();
  });

  it("paginates canonical history without retaining the old page", async () => {
    vi.mocked(learningApi.listLearningMessages)
      .mockResolvedValueOnce({
        messages: [message()],
        pagination: { page: 1, limit: 20, total: 21, pages: 2 },
      })
      .mockResolvedValueOnce({
        messages: [
          message({
            id: assistantMessageId,
            role: "assistant",
            content: "Later canonical answer",
            createdAt: "2026-07-26T01:00:01.000Z",
            updatedAt: "2026-07-26T01:00:01.000Z",
          }),
        ],
        pagination: { page: 2, limit: 20, total: 21, pages: 2 },
      });
    renderConversation();
    await screen.findByText("What does **this** say?");

    await userEvent.click(
      screen.getByRole("button", { name: "Next message page" }),
    );

    expect(await screen.findByText("Later canonical answer")).not.toBeNull();
    expect(screen.queryByText("What does **this** say?")).toBeNull();
  });

  it("validates questions and creates one UUID for one unresolved send intent", async () => {
    vi.mocked(learningApi.sendLearningMessage).mockRejectedValue(
      new TypeError("transport uncertain"),
    );
    renderConversation();
    await screen.findByText("No messages yet.");
    const question = screen.getByRole("textbox", { name: "Question" });

    await userEvent.click(
      screen.getByRole("button", { name: "Send question" }),
    );
    expect(screen.getByRole("alert").textContent).toContain(
      "Enter a question about this document.",
    );

    await userEvent.type(question, "A grounded question");
    await userEvent.click(
      screen.getByRole("button", { name: "Send question" }),
    );
    expect((await screen.findByRole("alert")).textContent).toContain(
      "The send outcome is uncertain",
    );
    expect((question as HTMLTextAreaElement).value).toBe(
      "A grounded question",
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Retry same question" }),
    );
    expect(learningApi.sendLearningMessage).toHaveBeenCalledTimes(2);
    expect(
      vi.mocked(learningApi.sendLearningMessage).mock.calls[0]?.[3],
    ).toBe(
      "3159bf41-e3ac-409c-bad4-a77981000d52",
    );
    expect(
      vi.mocked(learningApi.sendLearningMessage).mock.calls[1]?.[3],
    ).toBe(
      "3159bf41-e3ac-409c-bad4-a77981000d52",
    );
    expect(crypto.randomUUID).toHaveBeenCalledTimes(1);
  });

  it("adopts the accepted user message, blocks duplicates and never fabricates an assistant", async () => {
    let resolve:
      | ((value: Awaited<ReturnType<
          typeof learningApi.sendLearningMessage
        >>) => void)
      | undefined;
    vi.mocked(learningApi.sendLearningMessage).mockReturnValue(
      new Promise((next) => {
        resolve = next;
      }),
    );
    renderConversation();
    await screen.findByText("No messages yet.");
    const question = screen.getByRole("textbox", { name: "Question" });
    await userEvent.type(question, "One send only");
    const send = screen.getByRole("button", { name: "Send question" });
    await userEvent.click(send);
    await userEvent.click(send);
    expect(learningApi.sendLearningMessage).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolve?.({
        userMessage: message({ content: "One send only" }),
        job: {
          id: jobId,
          type: "learning.chat.respond",
          status: "queued",
        },
      });
    });

    expect((question as HTMLTextAreaElement).value).toBe("");
    expect(screen.getByText("One send only")).not.toBeNull();
    expect(screen.queryByText(/Assistant response/)).toBeNull();
    expect(screen.getByText(/Response queued/)).not.toBeNull();
  });

  it("refetches canonical history after completion and announces the stored assistant message", async () => {
    vi.mocked(learningApi.sendLearningMessage).mockResolvedValue({
      userMessage: message({ content: "Canonical completion" }),
      job: {
        id: jobId,
        type: "learning.chat.respond",
        status: "queued",
      },
    });
    vi.mocked(learningPolling.pollLearningJob).mockResolvedValue({
      reason: "terminal",
      job: chatJob("completed", {
        result: { messageId: assistantMessageId, sourcePages: [2] },
      }),
    });
    vi.mocked(learningApi.listLearningMessages)
      .mockResolvedValueOnce({
        messages: [],
        pagination: { page: 1, limit: 20, total: 0, pages: 0 },
      })
      .mockResolvedValueOnce({
        messages: [
          message({ content: "Canonical completion" }),
          message({
            id: assistantMessageId,
            role: "assistant",
            content: "Stored assistant response",
            sourcePages: [2],
            createdAt: "2026-07-26T01:00:01.000Z",
            updatedAt: "2026-07-26T01:00:01.000Z",
          }),
        ],
        pagination: { page: 1, limit: 20, total: 2, pages: 1 },
      });
    renderConversation();
    await screen.findByText("No messages yet.");
    await userEvent.type(
      screen.getByRole("textbox", { name: "Question" }),
      "Canonical completion",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Send question" }),
    );

    expect(
      await screen.findByText("Stored assistant response"),
    ).not.toBeNull();
    expect(screen.getByRole("status").textContent).toContain(
      "New grounded response available.",
    );
    expect(learningApi.listLearningMessages).toHaveBeenCalledTimes(2);
  });

  it("aborts the completion refetch when the conversation route changes", async () => {
    const secondConversationId = "507f1f77bcf86cd799439099";
    let completionSignal: AbortSignal | undefined;
    vi.mocked(learningApi.sendLearningMessage).mockResolvedValue({
      userMessage: message({ content: "Completion cancellation" }),
      job: {
        id: jobId,
        type: "learning.chat.respond",
        status: "queued",
      },
    });
    vi.mocked(learningPolling.pollLearningJob).mockResolvedValue({
      reason: "terminal",
      job: chatJob("completed", {
        result: { messageId: assistantMessageId, sourcePages: [2] },
      }),
    });
    vi.mocked(learningApi.listLearningMessages)
      .mockResolvedValueOnce({
        messages: [],
        pagination: { page: 1, limit: 20, total: 0, pages: 0 },
      })
      .mockImplementationOnce(
        (_documentId, _conversationId, _pageCount, _query, signal) => {
          completionSignal = signal;
          return new Promise(() => undefined);
        },
      )
      .mockResolvedValueOnce({
        messages: [],
        pagination: { page: 1, limit: 20, total: 0, pages: 0 },
      });
    const router = renderConversation();
    await screen.findByText("No messages yet.");
    await userEvent.type(
      screen.getByRole("textbox", { name: "Question" }),
      "Completion cancellation",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Send question" }),
    );
    await waitFor(() => expect(completionSignal).toBeDefined());

    await act(async () => {
      await router.navigate(
        `/learning/documents/${documentId}/conversations/${secondConversationId}`,
      );
    });

    expect(completionSignal?.aborted).toBe(true);
  });

  it.each([
    ["failed", "Grounded response failed"],
    ["cancelled", "Grounded response was cancelled"],
  ] as const)("shows a truthful %s terminal state without resending", async (status, text) => {
    vi.mocked(learningApi.sendLearningMessage).mockResolvedValue({
      userMessage: message({ content: "Terminal state" }),
      job: {
        id: jobId,
        type: "learning.chat.respond",
        status: "queued",
      },
    });
    vi.mocked(learningPolling.pollLearningJob).mockResolvedValue({
      reason: "terminal",
      job: chatJob(status, {
        ...(status === "failed"
          ? {
              error: {
                code: "AI_PROVIDER_UNAVAILABLE",
                message: "Grounded response generation is unavailable.",
              },
            }
          : {}),
      }),
    });
    renderConversation();
    await screen.findByText("No messages yet.");
    await userEvent.type(
      screen.getByRole("textbox", { name: "Question" }),
      "Terminal state",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Send question" }),
    );

    expect(await screen.findByText(new RegExp(text, "i"))).not.toBeNull();
    expect(learningApi.sendLearningMessage).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Stored assistant response")).toBeNull();
  });

  it("pauses locally and resumes polling the same owned job", async () => {
    vi.mocked(learningApi.sendLearningMessage).mockResolvedValue({
      userMessage: message({ content: "Pause polling" }),
      job: {
        id: jobId,
        type: "learning.chat.respond",
        status: "queued",
      },
    });
    vi.mocked(learningPolling.pollLearningJob)
      .mockResolvedValueOnce({
        reason: "paused",
        cause: "timeout",
        job: chatJob("processing"),
      })
      .mockReturnValueOnce(new Promise(() => undefined));
    renderConversation();
    await screen.findByText("No messages yet.");
    await userEvent.type(
      screen.getByRole("textbox", { name: "Question" }),
      "Pause polling",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Send question" }),
    );

    await userEvent.click(
      await screen.findByRole("button", { name: "Resume response checks" }),
    );
    expect(learningPolling.pollLearningJob).toHaveBeenCalledTimes(2);
    expect(
      vi.mocked(learningPolling.pollLearningJob).mock.calls[1]?.[0].jobId,
    ).toBe(jobId);
    expect(learningApi.sendLearningMessage).toHaveBeenCalledTimes(1);
  });

  it("ignores stale conversation responses and clears private state on route change", async () => {
    let resolveFirst:
      | ((value: Awaited<ReturnType<
          typeof learningApi.listLearningMessages
        >>) => void)
      | undefined;
    const secondConversationId = "507f1f77bcf86cd799439099";
    vi.mocked(learningApi.listLearningMessages)
      .mockReturnValueOnce(
        new Promise((next) => {
          resolveFirst = next;
        }),
      )
      .mockResolvedValueOnce({
        messages: [],
        pagination: { page: 1, limit: 20, total: 0, pages: 0 },
      });
    const router = renderConversation();
    await act(async () => {
      await router.navigate(
        `/learning/documents/${documentId}/conversations/${secondConversationId}`,
      );
    });
    expect(await screen.findByText("No messages yet.")).not.toBeNull();

    resolveFirst?.({
      messages: [message({ content: "Stale private message" })],
      pagination: { page: 1, limit: 20, total: 1, pages: 1 },
    });
    expect(screen.queryByText("Stale private message")).toBeNull();
  });

  it("adopts a safe not-found state when the conversation does not belong to the route document", async () => {
    vi.mocked(learningApi.listLearningMessages).mockRejectedValue(
      new ApiError(
        404,
        "LEARNING_CONVERSATION_NOT_FOUND",
        "Learning conversation not found.",
        "request-cross-document-0001",
      ),
    );
    renderConversation();

    expect(
      await screen.findByRole("heading", {
        name: "Conversation not found",
      }),
    ).not.toBeNull();
    expect(screen.queryByRole("textbox", { name: "Question" })).toBeNull();
    expect(screen.getByText(/request-cross-document-0001/)).not.toBeNull();
  });

  it("shows safe not-found and non-ready states and never writes chat state to browser storage", async () => {
    const local = vi.spyOn(Storage.prototype, "setItem");
    vi.mocked(learningApi.fetchLearningDocument).mockRejectedValue(
      new ApiError(
        404,
        "LEARNING_DOCUMENT_NOT_FOUND",
        "Learning document not found.",
        "request-missing-chat-0001",
      ),
    );
    renderConversation();
    expect(
      await screen.findByRole("heading", { name: "Conversation not found" }),
    ).not.toBeNull();
    expect(screen.getByText(/request-missing-chat-0001/)).not.toBeNull();
    expect(local).not.toHaveBeenCalled();
  });
});
