import { render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ResumePrintControls } from "./ResumePrintControls";

const resumeWorkspaceCss = readFileSync(
  resolve(process.cwd(), "src/features/resumes/resumeWorkspace.css"),
  "utf8",
);

function renderControls(
  overrides: Partial<
    React.ComponentProps<typeof ResumePrintControls>
  > = {},
) {
  const props: React.ComponentProps<typeof ResumePrintControls> = {
    sourceKind: "current",
    versionNumber: 4,
    pageSize: "A4",
    readiness: { eligible: true, message: "Ready to print / save as PDF" },
    suggestedFilename: "synthetic-resume-v4-a4.pdf",
    pageSizeSaving: false,
    printPreparing: false,
    onPageSizeChange: vi.fn(),
    onPrint: vi.fn(),
    ...overrides,
  };
  render(<ResumePrintControls {...props} />);
  return props;
}

describe("ResumePrintControls", () => {
  it("identifies the selected saved version and offers A4, Letter, and print", async () => {
    const props = renderControls();
    const user = userEvent.setup();

    expect(screen.getByText("Current saved version — Version 4")).not.toBeNull();
    expect(screen.getByText("Ready to print / save as PDF")).not.toBeNull();
    expect(screen.getByText("Page size: A4")).not.toBeNull();
    expect(screen.getByText(/Suggested filename:/).textContent).toContain(
      "synthetic-resume-v4-a4.pdf",
    );
    expect(
      screen.getByRole("button", {
        name: "Open print dialog for saved version 4",
      }),
    ).not.toBeNull();
    const pageSize = screen.getByRole("combobox", {
      name: "Paper size",
    });
    expect(pageSize.textContent).toContain("A4");
    expect(pageSize.textContent).toContain("Letter");
    expect(document.body.textContent).not.toMatch(
      /download pdf|metadata embedded|filename guaranteed/i,
    );

    await user.selectOptions(pageSize, "LETTER");
    expect(props.onPageSizeChange).toHaveBeenCalledWith("LETTER");
  });

  it("tells users to turn off browser headers and footers for a clean Resume PDF", () => {
    renderControls();

    expect(
      screen.getByText(
        "Choose “Save as PDF” in your browser. Turn off “Headers and footers” for a clean Resume PDF.",
      ),
    ).not.toBeNull();
    expect(
      screen.queryByText(
        /The browser and operating system control the final filename and PDF settings/i,
      ),
    ).toBeNull();
  });

  it("blocks dirty printing and directs the user to save or discard", () => {
    renderControls({
      readiness: {
        eligible: false,
        reasonId: "resume-export-blocker",
        message: "Save your changes before printing or saving as PDF.",
      },
    });

    expect(
      (
        screen.getByRole("button", {
          name: "Open print dialog for saved version 4",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    const blocker = screen.getByText(
      "Save your changes before printing or saving as PDF.",
    );
    expect(blocker.id).toBe("resume-export-blocker");
    expect(
      screen
        .getByRole("button", { name: "Open print dialog for saved version 4" })
        .getAttribute("aria-describedby"),
    ).toBe("resume-export-blocker");
  });

  it("identifies historical content and exposes safe page-size failure details", () => {
    renderControls({
      sourceKind: "historical",
      versionNumber: 2,
      error: {
        message: "The paper size could not be saved.",
        requestId: "page-size-request-0001",
      },
    });

    expect(screen.getByText("Historical Version 2")).not.toBeNull();
    expect(
      screen.getByText("The paper size could not be saved."),
    ).not.toBeNull();
    expect(
      screen.getByText("Request ID: page-size-request-0001"),
    ).not.toBeNull();
  });

  it("prevents page-size and print interaction while saving or preparing", () => {
    const { rerender } = render(
      <ResumePrintControls
        sourceKind="current"
        versionNumber={1}
        pageSize="A4"
        readiness={{ eligible: true, message: "Ready to print / save as PDF" }}
        suggestedFilename="resume-v1-a4.pdf"
        pageSizeSaving
        printPreparing={false}
        onPageSizeChange={vi.fn()}
        onPrint={vi.fn()}
      />,
    );

    expect(
      (
        screen.getByRole("combobox", {
          name: "Paper size",
        }) as HTMLSelectElement
      ).disabled,
    ).toBe(true);
    expect(
      (
        screen.getByRole("button", {
          name: "Open print dialog for saved version 1",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);

    rerender(
      <ResumePrintControls
        sourceKind="current"
        versionNumber={1}
        pageSize="A4"
        readiness={{ eligible: true, message: "Ready to print / save as PDF" }}
        suggestedFilename="resume-v1-a4.pdf"
        pageSizeSaving={false}
        printPreparing
        onPageSizeChange={vi.fn()}
        onPrint={vi.fn()}
      />,
    );
    expect(
      (
        screen.getByRole("button", {
          name: "Open print dialog for saved version 1",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  });

  it("blocks printing while a selected saved version is loading", () => {
    renderControls({
      sourceLoading: true,
      readiness: {
        eligible: false,
        reasonId: "resume-export-loading",
        message: "Loading the selected saved version before printing…",
      },
    });

    expect(
      (
        screen.getByRole("button", {
          name: "Open print dialog for saved version 4",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    expect(
      screen.getByText(/loading the selected saved version/i),
    ).not.toBeNull();
  });

  it("allows readiness details and controls to wrap without fixed-width overflow", () => {
    expect(resumeWorkspaceCss).toMatch(
      /\.resume-export-readiness\s*\{[^}]*overflow-wrap:\s*anywhere;/s,
    );
    expect(resumeWorkspaceCss).toMatch(
      /@media \(max-width:\s*720px\)[\s\S]*\.resume-print-control-row[\s\S]*flex-direction:\s*column;/s,
    );
  });
});
