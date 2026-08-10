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
} from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../../api/apiClient";
import * as resumeApi from "./resumeApi";
import { ResumeListPage } from "./ResumeListPage";

vi.mock("./resumeApi", () => ({
  createResume: vi.fn(),
  fetchJob: vi.fn(),
  importResumePdf: vi.fn(),
  listResumes: vi.fn(),
}));

const resumeId = "507f1f77bcf86cd799439011";
const versionId = "507f1f77bcf86cd799439012";
const timestamp = "2026-07-24T10:00:00.000Z";

function resumeRecord() {
  return {
    id: resumeId,
    title: "Synthetic Platform Resume",
    status: "draft" as const,
    currentVersionId: versionId,
    latestVersionNumber: 1,
    design: {
      templateId: "ats-classic",
      colorPaletteId: "slate",
      pageSize: "A4" as const,
      fontFamily: "Inter",
      showProfilePhoto: false,
    },
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function workspace() {
  return {
    resume: resumeRecord(),
    version: {
      id: versionId,
      resumeId,
      versionNumber: 1,
      source: "manual" as const,
      content: {
        basics: { fullName: "", links: [] },
        experience: [],
        education: [],
        skills: [],
        projects: [],
        certifications: [],
        languages: [],
        interests: [],
      },
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  };
}

function renderPage(initialEntry = "/resumes") {
  const router = createMemoryRouter(
    [
      { path: "/resumes", element: <ResumeListPage /> },
      {
        path: "/resumes/:resumeId",
        element: <h1>Opened resume</h1>,
      },
    ],
    { initialEntries: [initialEntry] },
  );
  render(<RouterProvider router={router} />);
  return router;
}

describe("ResumeListPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(resumeApi.listResumes).mockResolvedValue({
      resumes: [],
      pagination: { page: 1, limit: 20, total: 0, pages: 0 },
    });
  });

  it("consumes only the recognized create intent and opens the chooser", async () => {
    const router = renderPage("/resumes?source=dashboard&action=create&view=compact");

    const dialog = await screen.findByRole("dialog", { name: "Create Resume" });
    expect(within(dialog).getByRole("button", { name: "Guided setup" })).toBe(
      document.activeElement,
    );
    expect(router.state.location.search).toBe("?source=dashboard&view=compact");
    expect(resumeApi.createResume).not.toHaveBeenCalled();
    expect(resumeApi.importResumePdf).not.toHaveBeenCalled();
  });

  it("ignores unknown intents without changing the URL", async () => {
    const router = renderPage("/resumes?action=unknown");

    await screen.findByRole("heading", { name: "Resume Studio" });
    expect(router.state.location.search).toBe("?action=unknown");
    expect(screen.queryByRole("dialog", { name: "Create Resume" })).toBeNull();
  });

  it("preserves the page heading and opens one chooser from heading or empty state", async () => {
    renderPage();
    const user = userEvent.setup();

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Resume Studio",
      }),
    ).not.toBeNull();
    expect(
      screen.getByText(
        "Create, import, and open your private resume records. Only validated server data is shown.",
      ),
    ).not.toBeNull();
    const headingCreate = screen.getByRole("button", {
      name: "Create Resume",
    });
    await user.click(headingCreate);
    expect(screen.getAllByRole("dialog", { name: "Create Resume" })).toHaveLength(1);
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(document.activeElement).toBe(headingCreate);

    const emptyCreate = await screen.findByRole("button", {
      name: "Create your first resume",
    });
    await user.click(emptyCreate);
    expect(screen.getAllByRole("dialog", { name: "Create Resume" })).toHaveLength(1);
  });

  it("shows factual loading and empty states", async () => {
    let resolveList:
      | ((value: Awaited<ReturnType<typeof resumeApi.listResumes>>) => void)
      | undefined;
    vi.mocked(resumeApi.listResumes).mockReturnValue(
      new Promise((resolve) => {
        resolveList = resolve;
      }),
    );

    renderPage();
    expect(screen.getByRole("status").textContent).toMatch(/loading/i);
    expect(document.querySelectorAll(".resume-skeleton-card")).toHaveLength(3);
    expect(document.body.textContent).not.toMatch(
      /score|recruiter|application views|progress/i,
    );

    resolveList?.({
      resumes: [],
      pagination: { page: 1, limit: 20, total: 0, pages: 0 },
    });
    expect(
      await screen.findByText(
        "No resumes yet. Create a blank resume or import a private PDF.",
      ),
    ).not.toBeNull();
    expect(screen.queryByRole("navigation", { name: "Resume pages" })).toBeNull();
    expect(document.querySelector(".resume-entry-actions")).toBeNull();
  });

  it("renders a bounded card hierarchy with an unobstructed schematic", async () => {
    vi.mocked(resumeApi.listResumes).mockResolvedValue({
      resumes: [resumeRecord()],
      pagination: { page: 1, limit: 20, total: 1, pages: 1 },
    });
    const router = renderPage();

    await screen.findByText("Synthetic Platform Resume");
    expect(screen.getByText("ATS Classic")).not.toBeNull();
    expect(screen.getByText("Slate palette")).not.toBeNull();
    expect(screen.getByText("Version 1")).not.toBeNull();
    expect(screen.getByText("Draft")).not.toBeNull();
    const schematic = document.querySelector(
      '[data-resume-card-preview="ats-classic"]',
    );
    const preview = schematic?.closest(".resume-record-card-preview");
    expect(schematic).not.toBeNull();
    expect(preview?.getAttribute("aria-hidden")).toBe("true");
    expect(preview?.children).toHaveLength(1);
    expect(screen.queryByText("Synthetic Candidate")).toBeNull();
    expect(document.body.textContent).not.toContain(resumeId);
    expect(document.body.textContent).not.toContain(versionId);
    expect(document.body.textContent).not.toMatch(
      /ats score|recruiter|application views|job outcomes|analysis count/i,
    );
    expect(document.body.textContent).not.toMatch(
      /ai resume analyser|resume builder/i,
    );
    expect(screen.queryByRole("navigation", { name: "Resume pages" })).toBeNull();
    expect(resumeApi.listResumes).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByRole("link", {
      name: "Open Resume: Synthetic Platform Resume",
    }));
    await waitFor(() => {
      expect(router.state.location.pathname).toBe(`/resumes/${resumeId}`);
    });
  });

  it("keeps one, two, and several cards start-aligned in the same grid", async () => {
    vi.mocked(resumeApi.listResumes).mockResolvedValue({
      resumes: [
        resumeRecord(),
        { ...resumeRecord(), id: "507f1f77bcf86cd799439021", title: "Second Resume" },
        { ...resumeRecord(), id: "507f1f77bcf86cd799439031", title: "Third Resume" },
        { ...resumeRecord(), id: "507f1f77bcf86cd799439041", title: "Fourth Resume" },
      ],
      pagination: { page: 1, limit: 20, total: 4, pages: 1 },
    });
    renderPage();

    await screen.findByText("Fourth Resume");
    const grid = document.querySelector(".resume-record-grid");
    expect(grid).not.toBeNull();
    expect(grid?.children).toHaveLength(4);
    expect(document.querySelector(".resume-entry-actions")).toBeNull();
  });

  it("shows a safe structured error and retries the current page", async () => {
    vi.mocked(resumeApi.listResumes)
      .mockRejectedValueOnce(
        new ApiError(
          503,
          "RESUMES_UNAVAILABLE",
          "Resumes are temporarily unavailable.",
          "list-request-id-0001",
        ),
      )
      .mockResolvedValueOnce({
        resumes: [],
        pagination: { page: 1, limit: 20, total: 0, pages: 0 },
      });
    renderPage();

    expect(
      await screen.findByText("Resumes are temporarily unavailable."),
    ).not.toBeNull();
    expect(screen.getByText("Request ID: list-request-id-0001")).not
      .toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Retry list" }));
    expect(
      await screen.findByText(
        "No resumes yet. Create a blank resume or import a private PDF.",
      ),
    ).not.toBeNull();
  });

  it("uses a labelled pager with caller-owned boundaries and page loading", async () => {
    vi.mocked(resumeApi.listResumes).mockImplementation(
      async (query) => ({
        resumes: [resumeRecord()],
        pagination: {
          page: query?.page ?? 1,
          limit: 20,
          total: 21,
          pages: 2,
        },
      }),
    );
    renderPage();

    const pager = await screen.findByRole("navigation", {
      name: "Resume pages",
    });
    const previous = screen.getByRole("button", { name: "Previous" });
    const next = screen.getByRole("button", { name: "Next" });
    expect((previous as HTMLButtonElement).disabled).toBe(true);
    expect((next as HTMLButtonElement).disabled).toBe(false);
    expect(pager.textContent).toContain("Page 1");

    await userEvent.click(next);
    await waitFor(() => {
      expect(resumeApi.listResumes).toHaveBeenLastCalledWith(
        { page: 2, limit: 20 },
        expect.any(AbortSignal),
      );
    });
  });

  it("navigates only after a validated create response", async () => {
    vi.mocked(resumeApi.createResume).mockResolvedValue(workspace());
    const router = renderPage();
    const user = userEvent.setup();
    await screen.findByText(
      "No resumes yet. Create a blank resume or import a private PDF.",
    );
    await user.click(screen.getByRole("button", { name: "Create Resume" }));
    await user.click(screen.getByRole("button", { name: "Start blank" }));
    await user.type(screen.getByRole("textbox", { name: "Resume title" }), "Synthetic Resume");
    await user.click(
      screen.getByRole("button", { name: "Create blank resume" }),
    );

    await waitFor(() => {
      expect(router.state.location.pathname).toBe(`/resumes/${resumeId}`);
    });
  });

});
