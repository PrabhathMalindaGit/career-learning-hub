import { useState } from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  createMemoryRouter,
  RouterProvider,
} from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../../api/apiClient";
import { DocumentConversations } from "./DocumentConversations";
import * as learningApi from "./learningApi";
import type {
  LearningConversation,
  LearningDocument,
} from "./types";

vi.mock("./learningApi", () => ({
  createLearningConversation: vi.fn(),
  listLearningConversations: vi.fn(),
}));

const documentId = "507f1f77bcf86cd799439011";
const conversationId = "507f1f77bcf86cd799439012";
const createdAt = "2026-07-26T01:00:00.000Z";

const document: LearningDocument = {
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
};

function conversation(
  overrides: Partial<LearningConversation> = {},
): LearningConversation {
  return {
    id: conversationId,
    documentId,
    title: "Architecture questions",
    messageCount: 2,
    lastMessageAt: createdAt,
    createdAt,
    updatedAt: createdAt,
    ...overrides,
  };
}

function renderConversations(accountId = "account-a") {
  const router = createMemoryRouter(
    [
      {
        path: "/learning/documents/:documentId",
        element: (
          <DocumentConversations
            accountId={accountId}
            document={document}
          />
        ),
      },
      {
        path: "/learning/documents/:documentId/conversations/:conversationId",
        element: <h1>Conversation route</h1>,
      },
    ],
    {
      initialEntries: [`/learning/documents/${documentId}`],
    },
  );
  render(<RouterProvider router={router} />);
  return router;
}

beforeEach(() => {
  vi.mocked(learningApi.listLearningConversations).mockResolvedValue({
    conversations: [],
    pagination: { page: 1, limit: 10, total: 0, pages: 0 },
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("Document conversations", () => {
  it("shows loading and then the truthful empty state", async () => {
    let resolve:
      | ((value: Awaited<ReturnType<
          typeof learningApi.listLearningConversations
        >>) => void)
      | undefined;
    vi.mocked(learningApi.listLearningConversations).mockReturnValue(
      new Promise((next) => {
        resolve = next;
      }),
    );
    renderConversations();

    expect(screen.getByText("Loading conversations…")).not.toBeNull();

    resolve?.({
      conversations: [],
      pagination: { page: 1, limit: 10, total: 0, pages: 0 },
    });
    expect(
      await screen.findByText("No conversations yet."),
    ).not.toBeNull();
  });

  it("shows a recoverable list error and safe request ID", async () => {
    vi.mocked(learningApi.listLearningConversations).mockRejectedValue(
      new ApiError(
        503,
        "SERVICE_UNAVAILABLE",
        "Conversations are temporarily unavailable.",
        "request-chat-list-0001",
      ),
    );
    renderConversations();

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Conversations are temporarily unavailable.",
    );
    expect(screen.getByText(/request-chat-list-0001/)).not.toBeNull();

    await userEvent.click(
      screen.getByRole("button", { name: "Try conversations again" }),
    );
    expect(learningApi.listLearningConversations).toHaveBeenCalledTimes(2);
  });

  it("opens canonical conversations and paginates with keyboard-operable buttons", async () => {
    vi.mocked(learningApi.listLearningConversations)
      .mockResolvedValueOnce({
        conversations: [conversation()],
        pagination: { page: 1, limit: 10, total: 11, pages: 2 },
      })
      .mockResolvedValueOnce({
        conversations: [
          conversation({
            id: "507f1f77bcf86cd799439099",
            title: "Later questions",
          }),
        ],
        pagination: { page: 2, limit: 10, total: 11, pages: 2 },
      });
    renderConversations();

    const link = await screen.findByRole("link", {
      name: /Architecture questions/,
    });
    expect(link.getAttribute("href")).toBe(
      `/learning/documents/${documentId}/conversations/${conversationId}`,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Next conversation page" }),
    );
    expect(
      await screen.findByText("Later questions"),
    ).not.toBeNull();
    expect(learningApi.listLearningConversations).toHaveBeenLastCalledWith(
      documentId,
      { page: 2, limit: 10 },
      expect.any(AbortSignal),
    );

  });

  it("validates a bounded title and preserves it after failure", async () => {
    vi.mocked(learningApi.createLearningConversation).mockRejectedValue(
      new ApiError(
        409,
        "CONVERSATION_CREATE_FAILED",
        "Conversation could not be created.",
        "request-chat-create-0001",
      ),
    );
    renderConversations();
    await screen.findByText("No conversations yet.");
    const input = screen.getByRole("textbox", {
      name: "Conversation title",
    });

    await userEvent.click(
      screen.getByRole("button", { name: "Create conversation" }),
    );
    expect(screen.getByRole("alert").textContent).toContain(
      "Enter a conversation title.",
    );

    await userEvent.type(input, "A recoverable title");
    await userEvent.click(
      screen.getByRole("button", { name: "Create conversation" }),
    );
    expect((await screen.findByRole("alert")).textContent).toContain(
      "Conversation could not be created.",
    );
    expect((input as HTMLInputElement).value).toBe(
      "A recoverable title",
    );
    expect(screen.getByText(/request-chat-create-0001/)).not.toBeNull();
  });

  it("prevents duplicate creation and navigates only after canonical success", async () => {
    let resolve:
      | ((value: Awaited<ReturnType<
          typeof learningApi.createLearningConversation
        >>) => void)
      | undefined;
    vi.mocked(learningApi.createLearningConversation).mockReturnValue(
      new Promise((next) => {
        resolve = next;
      }),
    );
    const router = renderConversations();
    await screen.findByText("No conversations yet.");

    await userEvent.type(
      screen.getByRole("textbox", { name: "Conversation title" }),
      "Canonical title",
    );
    const create = screen.getByRole("button", {
      name: "Create conversation",
    });
    await userEvent.click(create);
    await userEvent.click(create);

    expect(learningApi.createLearningConversation).toHaveBeenCalledTimes(1);
    expect(router.state.location.pathname).toBe(
      `/learning/documents/${documentId}`,
    );

    await act(async () => {
      resolve?.({ conversation: conversation({ title: "Canonical title" }) });
    });
    await waitFor(() => {
      expect(router.state.location.pathname).toBe(
        `/learning/documents/${documentId}/conversations/${conversationId}`,
      );
    });
  });

  it("clears a private title draft when account identity changes", async () => {
    const router = createMemoryRouter(
      [
        {
          path: "/learning/documents/:documentId",
          element: <ConversationAccountHarness />,
        },
      ],
      { initialEntries: [`/learning/documents/${documentId}`] },
    );
    render(<RouterProvider router={router} />);
    await screen.findByText("No conversations yet.");
    await userEvent.type(
      screen.getByRole("textbox", { name: "Conversation title" }),
      "Private draft",
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Switch synthetic account" }),
    );

    expect(
      (
        screen.getByRole("textbox", {
          name: "Conversation title",
        }) as HTMLInputElement
      ).value,
    ).toBe("");
  });
});

function ConversationAccountHarness() {
  const [accountId, setAccountId] = useState("account-a");
  return (
    <>
      <button
        type="button"
        onClick={() => setAccountId("account-b")}
      >
        Switch synthetic account
      </button>
      <DocumentConversations
        accountId={accountId}
        document={document}
      />
    </>
  );
}
