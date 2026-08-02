import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import type { ComponentProps } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ResumeVersionTimeline } from "./ResumeVersionTimeline";
import type {
  Pagination,
  ResumeVersionMetadata,
} from "./types";

const currentVersionId = "507f1f77bcf86cd799439012";
const historicalVersionId = "507f1f77bcf86cd799439013";
const oldestVersionId = "507f1f77bcf86cd799439014";
const timestamp = "2026-07-24T10:00:00.000Z";
const resumeWorkspaceCss = readFileSync(
  resolve(process.cwd(), "src/features/resumes/resumeWorkspace.css"),
  "utf8",
);

function version(
  overrides: Partial<ResumeVersionMetadata> = {},
): ResumeVersionMetadata {
  return {
    id: historicalVersionId,
    versionNumber: 2,
    source: "manual",
    createdAt: timestamp,
    ...overrides,
  };
}

const pagination: Pagination = {
  page: 1,
  limit: 20,
  total: 3,
  pages: 1,
};

function renderTimeline(
  overrides: Partial<
    ComponentProps<typeof ResumeVersionTimeline>
  > = {},
) {
  const props: ComponentProps<typeof ResumeVersionTimeline> = {
    versions: [
      version({
        id: currentVersionId,
        versionNumber: 3,
        source: "ai-rewrite",
        changeSummary: "Applied selected suggestions",
      }),
      version(),
      version({
        id: oldestVersionId,
        versionNumber: 1,
        source: "pdf-import",
        changeSummary: "Imported source document",
      }),
    ],
    currentVersionId,
    loading: false,
    pagination,
    page: 1,
    onView: vi.fn(),
    onRetry: vi.fn(),
    onPreviousPage: vi.fn(),
    onNextPage: vi.fn(),
    ...overrides,
  };
  return { ...render(<ResumeVersionTimeline {...props} />), props };
}

describe("ResumeVersionTimeline", () => {
  it("preserves API order and renders only real version metadata", () => {
    renderTimeline();

    const items = screen.getAllByRole("listitem");
    expect(items.map((item) => item.textContent)).toEqual([
      expect.stringContaining("Version 3"),
      expect.stringContaining("Version 2"),
      expect.stringContaining("Version 1"),
    ]);
    expect(items[0]?.textContent).toContain("Applied selected suggestions");
    expect(items[1]?.textContent).not.toContain("Saved version");
    expect(items[2]?.textContent).toContain("Imported source document");
    expect(document.body.textContent).not.toContain(currentVersionId);
    expect(document.body.textContent).not.toContain(historicalVersionId);
    expect(document.body.textContent).not.toContain(oldestVersionId);
  });

  it("identifies the current version with text and a distinct semantic class", () => {
    renderTimeline();

    const current = screen.getByText("Current version").closest("li");
    expect(current).not.toBeNull();
    expect(current?.classList.contains("resume-version-item--current")).toBe(
      true,
    );
    expect(
      screen.getByRole("button", {
        name: "View current saved version 3",
      }),
    ).not.toBeNull();
  });

  it("maps supported sources and safely hides unknown internal values", () => {
    renderTimeline({
      versions: [
        version({ source: "manual", versionNumber: 4 }),
        version({ source: "pdf-import", versionNumber: 3 }),
        version({ source: "ai-rewrite", versionNumber: 2 }),
        version({ source: "duplicate", versionNumber: 1 }),
        version({
          versionNumber: 0,
          source:
            "future-provider-internal" as ResumeVersionMetadata["source"],
        }),
      ],
      currentVersionId,
    });

    expect(screen.getByText("Manual edit")).not.toBeNull();
    expect(screen.getByText("PDF import")).not.toBeNull();
    expect(screen.getByText("AI suggestions")).not.toBeNull();
    expect(screen.getByText("Duplicated resume")).not.toBeNull();
    expect(screen.getByText("Other source")).not.toBeNull();
    expect(document.body.textContent).not.toContain(
      "future-provider-internal",
    );
  });

  it("shows a truthful structured loading state without fake metadata", () => {
    renderTimeline({ versions: [], loading: true });

    expect(
      screen.getByRole("status", { name: "Loading version history" }),
    ).not.toBeNull();
    expect(screen.queryByText(/Version \d+/)).toBeNull();
    expect(screen.queryByRole("time")).toBeNull();
    expect(screen.queryByText(/score|author|activity/i)).toBeNull();
  });

  it("shows a truthful empty state without implying deletion", () => {
    renderTimeline({ versions: [], pagination: undefined });

    expect(
      screen.getByRole("heading", { name: "No saved versions yet" }),
    ).not.toBeNull();
    expect(
      screen.getByText(
        "New saved versions will appear here as an immutable timeline.",
      ),
    ).not.toBeNull();
    expect(document.body.textContent).not.toMatch(/deleted|unavailable/i);
  });

  it("preserves request ID, retry, and server-owned pagination", async () => {
    const retry = vi.fn();
    const previous = vi.fn();
    const next = vi.fn();
    const user = userEvent.setup();
    const { rerender, props } = renderTimeline({
      versions: [],
      failure: {
        message: "We could not load version history.",
        requestId: "history-request-0001",
      },
      onRetry: retry,
    });

    expect(screen.getByRole("alert").textContent).toContain(
      "Request ID: history-request-0001",
    );
    await user.click(
      screen.getByRole("button", { name: "Retry history" }),
    );
    expect(retry).toHaveBeenCalledTimes(1);

    rerender(
      <ResumeVersionTimeline
        {...props}
        versions={[version()]}
        failure={undefined}
        pagination={{ page: 2, limit: 20, total: 45, pages: 3 }}
        page={2}
        onPreviousPage={previous}
        onNextPage={next}
      />,
    );
    expect(screen.getByText("Version page 2 of 3")).not.toBeNull();
    await user.click(
      screen.getByRole("button", { name: "Previous versions" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Next versions" }),
    );
    expect(previous).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("supports keyboard activation and truthful selected-version loading", async () => {
    const onView = vi.fn();
    const user = userEvent.setup();
    const { rerender, props } = renderTimeline({ onView });
    const view = screen.getByRole("button", {
      name: "View saved version 2",
    });

    view.focus();
    expect(document.activeElement).toBe(view);
    await user.keyboard("{Enter}");
    expect(onView).toHaveBeenCalledWith(
      expect.objectContaining({ id: historicalVersionId }),
    );

    rerender(
      <ResumeVersionTimeline
        {...props}
        loadingVersionId={historicalVersionId}
      />,
    );
    const loading = screen.getByRole("button", {
      name: "Loading saved version 2",
    });
    expect(loading.getAttribute("aria-busy")).toBe("true");
    expect((loading as HTMLButtonElement).disabled).toBe(true);
  });

  it("renders no fabricated score, trend, author, activity, or old branding", () => {
    renderTimeline();

    expect(
      screen.queryByRole("heading", { name: /score evolution/i }),
    ).toBeNull();
    expect(document.body.textContent).not.toMatch(
      /pts|score delta|recruiter|employer-verified|Resumind|purple/i,
    );
  });

  it("defines visible focus and reduced-motion coverage for timeline motion", () => {
    expect(resumeWorkspaceCss).toMatch(
      /\.resume-version-action:focus-visible/,
    );
    const reducedMotionRule = resumeWorkspaceCss.match(
      /@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*)\}\s*$/,
    )?.[1];
    expect(reducedMotionRule).toContain(".resume-version-item");
    expect(reducedMotionRule).toContain(".resume-version-skeleton");
  });
});
