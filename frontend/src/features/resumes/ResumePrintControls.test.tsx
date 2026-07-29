import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ResumePrintControls } from "./ResumePrintControls";

function renderControls(
  overrides: Partial<
    React.ComponentProps<typeof ResumePrintControls>
  > = {},
) {
  const props: React.ComponentProps<typeof ResumePrintControls> = {
    sourceKind: "current",
    versionNumber: 4,
    pageSize: "A4",
    dirty: false,
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

    expect(screen.getByText("Current saved version 4")).not.toBeNull();
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

  it("blocks dirty printing and directs the user to save or discard", () => {
    renderControls({ dirty: true });

    expect(
      (
        screen.getByRole("button", {
          name: "Open print dialog for saved version 4",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    expect(screen.getByText(/save new version or discard/i)).not.toBeNull();
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

    expect(screen.getByText("Historical saved version 2")).not.toBeNull();
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
        dirty={false}
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
        dirty={false}
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
    renderControls({ sourceLoading: true });

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
});
