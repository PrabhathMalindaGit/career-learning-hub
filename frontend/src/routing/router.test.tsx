import type {
  AuthenticationResponse,
  PublicUser,
} from "@career-learning-hub/shared-types";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  createMemoryRouter,
  RouterProvider,
  type InitialEntry,
} from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../api/apiClient";
import {
  AuthProvider,
} from "../features/auth/AuthProvider";
import * as authApi from "../features/auth/authApi";
import { appRoutes } from "./router";

vi.mock("../features/auth/authApi", () => ({
  getCurrentUser: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  refreshSession: vi.fn(),
  register: vi.fn(),
}));

vi.mock("../features/dashboard/dashboardApi", () => ({
  fetchDashboardActivity: vi.fn(
    () => new Promise(() => undefined),
  ),
  fetchProgressSnapshot: vi.fn(
    () => new Promise(() => undefined),
  ),
}));

vi.mock("../features/resumes/resumeApi", () => ({
  applyResumeSuggestions: vi.fn(),
  createResume: vi.fn(),
  fetchJob: vi.fn(),
  fetchResume: vi.fn().mockResolvedValue({
    resume: {
      id: "507f1f77bcf86cd799439011",
      title: "Connected resume workspace",
      status: "draft",
      currentVersionId: "507f1f77bcf86cd799439012",
      latestVersionNumber: 1,
      design: {
        templateId: "ats-classic",
        colorPaletteId: "slate",
        pageSize: "A4",
        showProfilePhoto: false,
      },
      createdAt: "2026-07-24T00:00:00.000Z",
      updatedAt: "2026-07-24T00:00:00.000Z",
    },
    version: {
      id: "507f1f77bcf86cd799439012",
      resumeId: "507f1f77bcf86cd799439011",
      versionNumber: 1,
      source: "manual",
      content: {
        basics: { fullName: "Router Candidate", links: [] },
        experience: [],
        education: [],
        skills: [],
        projects: [],
        certifications: [],
        languages: [],
        interests: [],
      },
      createdAt: "2026-07-24T00:00:00.000Z",
      updatedAt: "2026-07-24T00:00:00.000Z",
    },
  }),
  fetchResumeAnalysis: vi.fn(),
  fetchResumeVersion: vi.fn(),
  importResumePdf: vi.fn(),
  listResumes: vi.fn().mockResolvedValue({
    resumes: [],
    pagination: { page: 1, limit: 20, total: 0, pages: 0 },
  }),
  listResumeVersions: vi.fn().mockResolvedValue({
    versions: [],
    pagination: { page: 1, limit: 100, total: 0, pages: 0 },
  }),
  queueResumeAnalysis: vi.fn(),
  saveResumeVersion: vi.fn(),
}));

vi.mock("../features/interviews/interviewApi", () => ({
  addManualQuestion: vi.fn(),
  createInterviewSession: vi.fn(),
  fetchInterviewAttempt: vi.fn(),
  fetchInterviewJob: vi.fn(),
  fetchInterviewQuestion: vi.fn(),
  fetchInterviewSession: vi.fn().mockResolvedValue({
    id: "session-test-id",
    title: "Connected interview session",
    targetRole: "Backend Engineer",
    experienceLevel: "Mid-level",
    focusTopics: [],
    skillGaps: [],
    mode: "written-practice",
    status: "active",
    questionCount: 0,
    createdAt: "2026-07-25T00:00:00.000Z",
    updatedAt: "2026-07-25T00:00:00.000Z",
  }),
  generateInterviewQuestions: vi.fn(),
  listAttemptHistory: vi.fn().mockResolvedValue({
    attempts: [],
    pagination: { page: 1, limit: 20, total: 0, pages: 0 },
  }),
  listInterviewQuestions: vi.fn().mockResolvedValue({
    questions: [],
    pagination: { page: 1, limit: 20, total: 0, pages: 0 },
  }),
  listInterviewSessions: vi.fn().mockResolvedValue({
    sessions: [],
    pagination: { page: 1, limit: 20, total: 0, pages: 0 },
  }),
  recordInterviewAttempt: vi.fn(),
  requestAttemptFeedback: vi.fn(),
  requestQuestionExplanation: vi.fn(),
  saveQuestionNotes: vi.fn(),
  setQuestionPinned: vi.fn(),
  updateInterviewSessionStatus: vi.fn(),
}));

vi.mock("../features/learning/learningApi", () => ({
  createFlashcardSet: vi.fn(),
  createQuizGeneration: vi.fn(),
  createLearningConversation: vi.fn(),
  fetchFlashcardSet: vi.fn().mockResolvedValue({
    set: {
      id: "507f1f77bcf86cd799439012",
      documentId: "507f1f77bcf86cd799439011",
      title: "Connected flashcard set",
      status: "ready",
      cardCount: 1,
      createdAt: "2026-07-26T00:00:00.000Z",
      updatedAt: "2026-07-26T00:00:00.000Z",
    },
  }),
  fetchLearningChatJob: vi.fn(),
  fetchLearningDocument: vi.fn().mockResolvedValue({
    document: {
      id: "507f1f77bcf86cd799439011",
      title: "Connected learning document",
      originalFilename: "connected-learning-document.pdf",
      mimeType: "application/pdf",
      status: "ready",
      pageCount: 1,
      chunkCount: 1,
      summary: "Stored connected summary.",
      summaryKeyPoints: [],
      processedAt: "2026-07-26T00:00:00.000Z",
      createdAt: "2026-07-26T00:00:00.000Z",
      updatedAt: "2026-07-26T00:00:00.000Z",
    },
  }),
  fetchLearningDocumentSource: vi.fn(),
  fetchLearningFlashcardJob: vi.fn(),
  fetchLearningJob: vi.fn(),
  fetchLearningQuizJob: vi.fn(),
  fetchQuizForTaking: vi.fn().mockResolvedValue({
    id: "507f1f77bcf86cd799439014",
    documentId: "507f1f77bcf86cd799439011",
    title: "Connected quiz",
    status: "ready",
    questionCount: 1,
    createdAt: "2026-07-26T00:00:00.000Z",
    updatedAt: "2026-07-26T00:00:00.000Z",
    questions: [
      {
        questionIndex: 0,
        prompt: "Connected safe question",
        choices: ["First choice", "Second choice"],
        sourcePages: [1],
      },
    ],
  }),
  fetchQuizAttemptReview: vi.fn().mockResolvedValue({
    attempt: {
      id: "507f1f77bcf86cd799439015",
      documentId: "507f1f77bcf86cd799439011",
      quizId: "507f1f77bcf86cd799439014",
      correctCount: 1,
      questionCount: 1,
      scorePercent: 100,
      completedAt: "2026-07-26T00:01:00.000Z",
      createdAt: "2026-07-26T00:01:00.000Z",
    },
    review: [
      {
        questionIndex: 0,
        prompt: "Connected safe question",
        choices: ["First choice", "Second choice"],
        selectedChoiceIndex: 0,
        correctChoiceIndex: 0,
        correct: true,
        explanation: "Connected authorized explanation",
        sourcePages: [1],
      },
    ],
  }),
  listDocumentChunks: vi.fn(),
  listFlashcardSets: vi.fn().mockResolvedValue({
    sets: [],
    pagination: { page: 1, limit: 10, total: 0, pages: 0 },
  }),
  listLearningFlashcards: vi.fn().mockResolvedValue({
    cards: [
      {
        id: "507f1f77bcf86cd799439013",
        cardIndex: 0,
        front: "Connected canonical question",
        back: "Connected canonical answer",
        sourcePages: [1],
        createdAt: "2026-07-26T00:00:00.000Z",
      },
    ],
    pagination: { page: 1, limit: 100, total: 1, pages: 1 },
  }),
  listLearningConversations: vi.fn().mockResolvedValue({
    conversations: [],
    pagination: { page: 1, limit: 10, total: 0, pages: 0 },
  }),
  listLearningDocuments: vi.fn().mockResolvedValue({
    documents: [],
    pagination: { page: 1, limit: 10, total: 0, pages: 0 },
  }),
  listLearningMessages: vi.fn().mockResolvedValue({
    messages: [],
    pagination: { page: 1, limit: 20, total: 0, pages: 0 },
  }),
  listQuizAttempts: vi.fn().mockResolvedValue({
    attempts: [],
    pagination: { page: 1, limit: 10, total: 0, pages: 0 },
  }),
  listQuizzes: vi.fn().mockResolvedValue({
    quizzes: [],
    pagination: { page: 1, limit: 10, total: 0, pages: 0 },
  }),
  submitQuizAttempt: vi.fn(),
  sendLearningMessage: vi.fn(),
  uploadLearningDocument: vi.fn(),
}));

const publicUser: PublicUser = {
  id: "router-user-test",
  email: "router@example.test",
  profile: {
    displayName: "Router Test User",
    headline: "Synthetic profile",
  },
  roles: ["user"],
  accountStatus: "active",
  createdAt: "2026-07-24T00:00:00.000Z",
  updatedAt: "2026-07-24T00:00:00.000Z",
};

const authenticatedSession: AuthenticationResponse = {
  user: publicUser,
  accessToken: "router-memory-token",
};

function noSessionError() {
  return new ApiError(
    401,
    "REFRESH_TOKEN_REQUIRED",
    "A refresh token is required.",
    "router-bootstrap-id-0001",
  );
}

function renderRoute(initialEntry: InitialEntry) {
  const router = createMemoryRouter(appRoutes, {
    initialEntries: [initialEntry],
  });

  render(
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>,
  );

  return router;
}

async function fillLoginForm(user = userEvent.setup()) {
  await user.type(
    screen.getByRole("textbox", { name: "Email address" }),
    "router@example.test",
  );
  await user.type(
    screen.getByLabelText("Password"),
    "SyntheticPassword1",
  );
  return user;
}

describe("application routing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it.each([
    ["public-only", "/login", "Welcome back"],
    ["protected", "/dashboard", "Unified dashboard"],
  ])(
    "keeps the %s bootstrap in a stable accessible route frame",
    async (_mode, path, destinationHeading) => {
      let rejectRefresh: (reason?: unknown) => void = () => undefined;
      vi.mocked(authApi.refreshSession).mockReturnValue(
        new Promise<AuthenticationResponse>((_resolve, reject) => {
          rejectRefresh = reject;
        }),
      );

      renderRoute(path);

      try {
        const main = screen.getByRole("main");
        expect(main.classList.contains("auth-bootstrap-layout")).toBe(true);
        expect(
          within(main).getByRole("status", {
            name: "Restoring your session",
          }),
        ).not.toBeNull();
        expect(
          screen.queryByRole("heading", { name: destinationHeading }),
        ).toBeNull();
        expect(
          screen.queryByRole("navigation", {
            name: "Primary navigation",
          }),
        ).toBeNull();
      } finally {
        rejectRefresh(noSessionError());
        await new Promise((resolve) => window.setTimeout(resolve, 0));
      }
    },
  );

  it("does not flash the login form before an authenticated public-only redirect", async () => {
    let resolveRefresh: (
      value: AuthenticationResponse,
    ) => void = () => undefined;
    vi.mocked(authApi.refreshSession).mockReturnValue(
      new Promise<AuthenticationResponse>((resolve) => {
        resolveRefresh = resolve;
      }),
    );
    const router = renderRoute("/login");

    expect(
      screen.queryByRole("heading", { name: "Welcome back" }),
    ).toBeNull();

    resolveRefresh(authenticatedSession);

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/dashboard");
    });
  });

  it("lets anonymous users reach login", async () => {
    vi.mocked(authApi.refreshSession).mockRejectedValue(noSessionError());

    renderRoute("/login");

    expect(
      await screen.findByRole("heading", { name: "Welcome back" }),
    ).not.toBeNull();
  });

  it("lets anonymous users reach registration", async () => {
    vi.mocked(authApi.refreshSession).mockRejectedValue(noSessionError());

    renderRoute("/register");

    expect(
      await screen.findByRole("heading", {
        name: "Create your account",
      }),
    ).not.toBeNull();
  });

  it.each([
    "/dashboard",
    "/resumes",
    "/resumes/resume-test-id",
    "/interviews",
    "/interviews/session-test-id",
    "/learning",
    "/learning/documents/507f1f77bcf86cd799439011",
    "/learning/documents/507f1f77bcf86cd799439011/conversations/507f1f77bcf86cd799439012",
    "/learning/documents/507f1f77bcf86cd799439011/flashcards/507f1f77bcf86cd799439012",
    "/learning/documents/507f1f77bcf86cd799439011/quizzes/507f1f77bcf86cd799439014",
    "/learning/documents/507f1f77bcf86cd799439011/quizzes/507f1f77bcf86cd799439014/attempts/507f1f77bcf86cd799439015",
    "/settings",
  ])("redirects anonymous users from protected path %s", async (path) => {
    vi.mocked(authApi.refreshSession).mockRejectedValue(noSessionError());

    const router = renderRoute(path);

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/login");
    });
    expect(
      screen.queryByRole("navigation", {
        name: "Primary navigation",
      }),
    ).toBeNull();
  });

  it.each(["/login", "/register"])(
    "redirects authenticated users away from %s",
    async (path) => {
      vi.mocked(authApi.refreshSession).mockResolvedValue(
        authenticatedSession,
      );

      const router = renderRoute(path);

      await waitFor(() => {
        expect(router.state.location.pathname).toBe("/dashboard");
      });
    },
  );

  it.each([
    ["/dashboard", "Unified dashboard"],
    ["/resumes", "Resume Studio"],
    ["/resumes/resume-test-id", "Connected resume workspace"],
    ["/interviews", "Interview Coach"],
    [
      "/interviews/session-test-id",
      "Connected interview session",
    ],
    ["/learning", "Learning"],
    [
      "/learning/documents/507f1f77bcf86cd799439011",
      "Connected learning document",
    ],
    [
      "/learning/documents/507f1f77bcf86cd799439011/conversations/507f1f77bcf86cd799439012",
      "Ask the document",
    ],
    [
      "/learning/documents/507f1f77bcf86cd799439011/flashcards/507f1f77bcf86cd799439012",
      "Connected flashcard set",
    ],
    [
      "/learning/documents/507f1f77bcf86cd799439011/quizzes/507f1f77bcf86cd799439014",
      "Connected quiz",
    ],
    [
      "/learning/documents/507f1f77bcf86cd799439011/quizzes/507f1f77bcf86cd799439014/attempts/507f1f77bcf86cd799439015",
      "Connected quiz",
    ],
    ["/settings", "Session settings"],
  ])("matches protected target path %s", async (path, heading) => {
    vi.mocked(authApi.refreshSession).mockResolvedValue(
      authenticatedSession,
    );

    renderRoute(path);

    expect(
      await screen.findByRole("heading", { name: heading }),
    ).not.toBeNull();
  });

  it("renders the connected dashboard instead of its deferred message", async () => {
    vi.mocked(authApi.refreshSession).mockResolvedValue(
      authenticatedSession,
    );

    renderRoute("/dashboard");

    expect(
      await screen.findByRole("heading", {
        name: "Unified dashboard",
      }),
    ).not.toBeNull();
    expect(
      screen.queryByText(
        "Your unified progress view will appear here when its data connection is active.",
      ),
    ).toBeNull();
  });

  it("renders connected Resume Studio routes instead of deferred messages", async () => {
    vi.mocked(authApi.refreshSession).mockResolvedValue(
      authenticatedSession,
    );

    renderRoute("/resumes");

    expect(
      await screen.findByRole("heading", { name: "Resume Studio" }),
    ).not.toBeNull();
    expect(
      screen.queryByText(
        "Your resume collection will appear here when Resume Studio is connected.",
      ),
    ).toBeNull();
  });

  it("renders a safe not-found page for an unknown path", async () => {
    vi.mocked(authApi.refreshSession).mockRejectedValue(noSessionError());

    renderRoute("/not-a-real-route");

    expect(
      await screen.findByRole("heading", { name: "Page not found" }),
    ).not.toBeNull();
    expect(screen.queryByText("/not-a-real-route")).toBeNull();
  });

  it("renders the protected shell only for authenticated users", async () => {
    vi.mocked(authApi.refreshSession).mockResolvedValue(
      authenticatedSession,
    );

    renderRoute("/dashboard");

    expect(
      await screen.findByRole("navigation", {
        name: "Primary navigation",
      }),
    ).not.toBeNull();
    expect(
      screen.getByText("Router Test User"),
    ).not.toBeNull();
  });

  it("keeps historical example dashboards off deferred routes", async () => {
    vi.mocked(authApi.refreshSession).mockResolvedValue(
      authenticatedSession,
    );

    renderRoute("/interviews");

    expect(
      await screen.findByText(
        "No interview sessions match this view. Create a private session to begin.",
      ),
    ).not.toBeNull();
    expect(
      screen.queryByText(
        "No interview records are shown until this area is connected.",
      ),
    ).toBeNull();
    expect(screen.queryByText("Example question")).toBeNull();
    expect(screen.queryByText("Resume Workspace")).toBeNull();
  });

  it("restores a safe intended internal location after login", async () => {
    vi.mocked(authApi.refreshSession).mockRejectedValue(noSessionError());
    vi.mocked(authApi.login).mockResolvedValue(authenticatedSession);
    const router = renderRoute("/settings");
    await screen.findByRole("heading", { name: "Welcome back" });
    const user = await fillLoginForm();

    await user.click(
      screen.getByRole("button", { name: "Sign in" }),
    );

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/settings");
    });
  });

  it.each([
    "https://attacker.example/collect",
    "//attacker.example/collect",
    "javascript:alert(1)",
    "\\\\attacker.example\\collect",
  ])("rejects unsafe intended redirect %s", async (from) => {
    vi.mocked(authApi.refreshSession).mockRejectedValue(noSessionError());
    vi.mocked(authApi.login).mockResolvedValue(authenticatedSession);
    const router = renderRoute({
      pathname: "/login",
      state: { from },
    });
    await screen.findByRole("heading", { name: "Welcome back" });
    const user = await fillLoginForm();

    await user.click(
      screen.getByRole("button", { name: "Sign in" }),
    );

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/dashboard");
    });
  });

  it("redirects the root deterministically by authentication state", async () => {
    vi.mocked(authApi.refreshSession).mockRejectedValue(noSessionError());
    const anonymousRouter = renderRoute("/");
    await waitFor(() => {
      expect(anonymousRouter.state.location.pathname).toBe("/login");
    });
  });
});

describe("authentication forms and shell interaction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("exposes discoverable labels and associated login validation", async () => {
    vi.mocked(authApi.refreshSession).mockRejectedValue(noSessionError());
    renderRoute("/login");
    await screen.findByRole("heading", { name: "Welcome back" });
    const user = userEvent.setup();

    await user.click(
      screen.getByRole("button", { name: "Sign in" }),
    );

    const email = screen.getByRole("textbox", {
      name: "Email address",
    });
    const password = screen.getByLabelText("Password");
    const emailError = screen.getByText(
      "Enter a valid email address.",
    );
    const passwordError = screen.getByText(
      "Enter your password.",
    );
    const summary = screen.getByRole("alert");
    expect((email as HTMLInputElement).required).toBe(true);
    expect((password as HTMLInputElement).required).toBe(true);
    expect(email.getAttribute("aria-describedby")).toContain(
      emailError.id,
    );
    expect(password.getAttribute("aria-describedby")).toContain(
      passwordError.id,
    );
    expect(document.activeElement).toBe(summary);
    expect(authApi.login).not.toHaveBeenCalled();
  });

  it("connects registration errors and focuses the multi-field summary", async () => {
    vi.mocked(authApi.refreshSession).mockRejectedValue(noSessionError());
    renderRoute("/register");
    await screen.findByRole("heading", {
      name: "Create your account",
    });
    const user = userEvent.setup();

    await user.click(
      screen.getByRole("button", { name: "Create account" }),
    );

    const displayName = screen.getByRole("textbox", {
      name: "Display name",
    });
    const email = screen.getByRole("textbox", {
      name: "Email address",
    });
    const password = screen.getByLabelText("Password");
    const displayNameError = screen.getByText(
      "Enter a display name between 2 and 100 characters.",
    );
    const emailError = screen.getByText("Enter a valid email address.");
    const passwordError = screen.getByText(
      "Password does not meet the requirements above.",
    );
    const summary = screen.getByRole("alert");

    expect((displayName as HTMLInputElement).required).toBe(true);
    expect((email as HTMLInputElement).required).toBe(true);
    expect((password as HTMLInputElement).required).toBe(true);
    expect(displayName.getAttribute("aria-describedby")).toContain(
      displayNameError.id,
    );
    expect(email.getAttribute("aria-describedby")).toContain(emailError.id);
    expect(password.getAttribute("aria-describedby")).toContain(
      passwordError.id,
    );
    expect(document.activeElement).toBe(summary);
    expect(authApi.register).not.toHaveBeenCalled();
  });

  it("shows backend-aligned registration password requirements", async () => {
    vi.mocked(authApi.refreshSession).mockRejectedValue(noSessionError());
    renderRoute("/register");
    await screen.findByRole("heading", {
      name: "Create your account",
    });
    const user = userEvent.setup();
    await user.type(
      screen.getByRole("textbox", { name: "Display name" }),
      "Test User",
    );
    await user.type(
      screen.getByRole("textbox", { name: "Email address" }),
      "test@example.test",
    );
    await user.type(screen.getByLabelText("Password"), "short");

    await user.click(
      screen.getByRole("button", { name: "Create account" }),
    );

    expect(
      screen.getByText(
        "Use 12–128 characters with uppercase, lowercase, and a number.",
      ),
    ).not.toBeNull();
    expect(authApi.register).not.toHaveBeenCalled();
  });

  it("renders the neutral registration failure without account disclosure", async () => {
    vi.mocked(authApi.refreshSession).mockRejectedValue(noSessionError());
    vi.mocked(authApi.register).mockRejectedValue(
      new ApiError(
        400,
        "REGISTRATION_FAILED",
        "Registration could not be completed. Check the details or sign in if you already have an account.",
        "registration-request-id-0001",
      ),
    );
    renderRoute("/register");
    await screen.findByRole("heading", {
      name: "Create your account",
    });
    const user = userEvent.setup();
    await user.type(
      screen.getByRole("textbox", { name: "Display name" }),
      "Registration User",
    );
    await user.type(
      screen.getByRole("textbox", { name: "Email address" }),
      "existing@example.test",
    );
    await user.type(
      screen.getByLabelText("Password"),
      "SyntheticPassword1",
    );

    await user.click(
      screen.getByRole("button", { name: "Create account" }),
    );

    expect(
      await screen.findByText(
        "Registration could not be completed. Check the details or sign in if you already have an account.",
      ),
    ).not.toBeNull();
    expect(
      screen.getByText("Request ID: registration-request-id-0001"),
    ).not.toBeNull();
    expect(document.activeElement).toBe(screen.getByRole("alert"));
    expect(document.body.textContent).not.toContain(
      "EMAIL_ALREADY_REGISTERED",
    );
    expect(document.body.textContent).not.toContain(
      "An account with that email already exists.",
    );
    expect(document.body.textContent).not.toContain(
      "Email already registered.",
    );
    expect(document.body.textContent).not.toContain(
      "SyntheticPassword1",
    );
  });

  it("disables duplicate login submissions while a request is busy", async () => {
    vi.mocked(authApi.refreshSession).mockRejectedValue(noSessionError());
    vi.mocked(authApi.login).mockReturnValue(
      new Promise<AuthenticationResponse>(() => undefined),
    );
    renderRoute("/login");
    await screen.findByRole("heading", { name: "Welcome back" });
    const user = await fillLoginForm();
    const submit = screen.getByRole("button", { name: "Sign in" });

    await user.click(submit);

    expect((submit as HTMLButtonElement).disabled).toBe(true);
    expect(authApi.login).toHaveBeenCalledTimes(1);
  });

  it("renders a safe API message and request ID without echoing the password", async () => {
    vi.mocked(authApi.refreshSession).mockRejectedValue(noSessionError());
    vi.mocked(authApi.login).mockRejectedValue(
      new ApiError(
        401,
        "INVALID_CREDENTIALS",
        "Email or password is incorrect.",
        "login-request-id-0001",
      ),
    );
    const storageWrite = vi.spyOn(Storage.prototype, "setItem");
    renderRoute("/login");
    await screen.findByRole("heading", { name: "Welcome back" });
    const user = await fillLoginForm();

    await user.click(
      screen.getByRole("button", { name: "Sign in" }),
    );

    expect(
      await screen.findByText("Email or password is incorrect."),
    ).not.toBeNull();
    expect(screen.getByText("Request ID: login-request-id-0001")).not
      .toBeNull();
    expect(document.body.textContent).not.toContain(
      "SyntheticPassword1",
    );
    expect(storageWrite).not.toHaveBeenCalled();
  });

  it("opens and closes mobile navigation with Escape and restores focus", async () => {
    vi.mocked(authApi.refreshSession).mockResolvedValue(
      authenticatedSession,
    );
    renderRoute("/dashboard");
    const toggle = await screen.findByRole("button", {
      name: "Toggle navigation",
    });
    const user = userEvent.setup();

    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    await user.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    const drawer = screen.getByRole("dialog", {
      name: "Navigation",
    });
    expect(drawer).not.toBeNull();
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Close navigation" }),
    );
    const mobileNav = screen.getByRole("navigation", {
      name: "Mobile navigation",
    });
    const dashboardLink = within(mobileNav).getByRole("link", {
      name: "Dashboard",
    });
    const resumeLink = within(mobileNav).getByRole("link", {
      name: "Resumes",
    });
    expect(dashboardLink.getAttribute("href")).toBe("/dashboard");
    expect(
      dashboardLink.classList.contains("nav-link--active"),
    ).toBe(true);
    await user.tab();
    expect(document.activeElement).not.toBe(document.body);
    await user.keyboard("{Escape}");

    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(toggle);

    await user.click(toggle);
    const reopenedDrawer = screen.getByRole("dialog", {
      name: "Navigation",
    });
    fireEvent.mouseDown(reopenedDrawer, { clientX: -1, clientY: 0 });
    screen.getByRole("main").focus();
    await waitFor(() => {
      expect(toggle.getAttribute("aria-expanded")).toBe("false");
      expect(document.activeElement).toBe(toggle);
    });
  });

  it("renders one desktop navigation source with exact create routes", async () => {
    vi.mocked(authApi.refreshSession).mockResolvedValue(
      authenticatedSession,
    );
    renderRoute("/dashboard");

    const navigation = await screen.findByRole("navigation", {
      name: "Primary navigation",
    });
    expect(
      within(navigation)
        .getByRole("link", { name: "Dashboard" })
        .getAttribute("href"),
    ).toBe("/dashboard");
    await userEvent.click(
      screen.getByText("Create", { selector: "summary" }),
    );
    expect(
      screen.getByRole("link", { name: "Resume" }).getAttribute("href"),
    ).toBe("/resumes?action=create");
    expect(
      screen
        .getByRole("link", { name: "Interview session" })
        .getAttribute("href"),
    ).toBe("/interviews?action=create");
    expect(
      screen
        .getByRole("link", { name: "Learning document" })
        .getAttribute("href"),
    ).toBe("/learning?action=upload");
  });

  it("moves focus from a drawer Create link into the destination workflow", async () => {
    vi.mocked(authApi.refreshSession).mockResolvedValue(
      authenticatedSession,
    );
    const router = renderRoute("/dashboard");
    const user = userEvent.setup();
    await user.click(
      await screen.findByRole("button", {
        name: "Toggle navigation",
      }),
    );
    const drawer = screen.getByRole("dialog", { name: "Navigation" });
    await user.click(
      within(drawer).getByText("Create", { selector: "summary" }),
    );
    await user.click(
      within(drawer).getByRole("link", {
        name: /^Resume$/,
      }),
    );

    const title = await screen.findByRole("textbox", {
      name: "New resume title",
    });
    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/resumes");
      expect(router.state.location.search).toBe("");
      expect(document.activeElement).toBe(title);
    });
  });

  it("keeps the exact mobile route invoker available while navigation is blocked", async () => {
    vi.mocked(authApi.refreshSession).mockResolvedValue(
      authenticatedSession,
    );
    const router = renderRoute(
      "/resumes/507f1f77bcf86cd799439011",
    );
    const user = userEvent.setup();
    const fullName = await screen.findByRole("textbox", {
      name: "Full name",
    });
    await user.type(fullName, " changed");

    const toggle = screen.getByRole("button", {
      name: "Toggle navigation",
    });
    await user.click(toggle);
    const mobileNav = screen.getByRole("navigation", {
      name: "Mobile navigation",
    });
    const dashboardLink = within(mobileNav).getByRole("link", {
      name: "Dashboard",
    });
    await user.click(dashboardLink);

    expect(
      await screen.findByRole("dialog", {
        name: "Unsaved changes",
      }),
    ).not.toBeNull();
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(dashboardLink.isConnected).toBe(true);

    await user.keyboard("{Escape}");
    expect(router.state.location.pathname).toBe(
      "/resumes/507f1f77bcf86cd799439011",
    );
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(document.activeElement).toBe(dashboardLink);

    await user.click(
      screen.getByRole("button", {
        name: "Discard draft changes",
      }),
    );
    await user.click(dashboardLink);
    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/dashboard");
    });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
  });

  it("closes mobile navigation after navigation", async () => {
    vi.mocked(authApi.refreshSession).mockResolvedValue(
      authenticatedSession,
    );
    renderRoute("/dashboard");
    const toggle = await screen.findByRole("button", {
      name: "Toggle navigation",
    });
    const user = userEvent.setup();
    await user.click(toggle);
    const mobileNav = screen.getByRole("navigation", {
      name: "Mobile navigation",
    });

    await user.click(
      within(mobileNav).getByRole("link", { name: "Settings" }),
    );

    await waitFor(() => {
      expect(toggle.getAttribute("aria-expanded")).toBe("false");
    });
    expect(
      await screen.findByRole("heading", {
        name: "Session settings",
      }),
    ).not.toBeNull();
  });
});
