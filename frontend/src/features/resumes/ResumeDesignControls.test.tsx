import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ResumeDesignControls } from "./ResumeDesignControls";
import type { ResumeDesign } from "./types";

const approvedDesign: ResumeDesign = {
  templateId: "ats-classic",
  colorPaletteId: "slate",
  pageSize: "A4",
  fontFamily: "Inter",
  showProfilePhoto: false,
};

function renderControls(
  overrides: Partial<
    React.ComponentProps<typeof ResumeDesignControls>
  > = {},
) {
  const props: React.ComponentProps<typeof ResumeDesignControls> = {
    design: approvedDesign,
    saving: false,
    onPreviewChange: vi.fn(),
    onSave: vi.fn(),
    ...overrides,
  };
  const result = render(<ResumeDesignControls {...props} />);
  return { ...result, props };
}

describe("ResumeDesignControls", () => {
  it("renders native labelled bounded controls with the canonical saved selections", () => {
    renderControls();

    expect(screen.getByRole("group", { name: "Resume design" })).not.toBeNull();
    expect(
      (screen.getByRole("combobox", { name: "Template" }) as HTMLSelectElement)
        .value,
    ).toBe("ats-classic");
    expect(
      (screen.getByRole("combobox", { name: "Font" }) as HTMLSelectElement)
        .value,
    ).toBe("Inter");
    expect(
      (screen.getByRole("combobox", { name: "Palette" }) as HTMLSelectElement)
        .value,
    ).toBe("slate");
    expect(screen.getByRole("option", { name: "Modern Professional" })).not.toBeNull();
    expect(screen.getByRole("option", { name: "Compact Technical" })).not.toBeNull();
    expect(screen.getByRole("option", { name: "Arial / sans-serif" })).not.toBeNull();
    expect(screen.getByRole("option", { name: "Georgia / serif" })).not.toBeNull();
    expect(screen.getByRole("option", { name: "Forest" })).not.toBeNull();
    expect(screen.getByRole("option", { name: "Navy" })).not.toBeNull();
    expect(document.body.textContent).not.toMatch(
      /line spacing|custom font|custom color|ats score|ats certified|guaranteed ats/i,
    );
  });

  it("falls back safely for unknown saved values without patching on render", () => {
    const onSave = vi.fn();
    const onPreviewChange = vi.fn();
    renderControls({
      design: {
        ...approvedDesign,
        templateId: "unknown-template",
        colorPaletteId: "unknown-palette",
        fontFamily: "unknown-font",
      },
      onSave,
      onPreviewChange,
    });

    expect(screen.getByText(/saved design choices are no longer available/i)).not.toBeNull();
    expect(screen.getByText(/preview uses ats classic, slate, and inter/i)).not.toBeNull();
    expect(document.body.textContent).not.toContain("unknown-template");
    expect(document.body.textContent).not.toContain("unknown-palette");
    expect(document.body.textContent).not.toContain("unknown-font");
    expect(onSave).not.toHaveBeenCalled();
    expect(onPreviewChange).not.toHaveBeenCalled();
    expect(
      (screen.getByRole("button", {
        name: "Save design",
      }) as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it("previews bounded choices and saves only after explicit approved replacements", async () => {
    const onSave = vi.fn();
    const onPreviewChange = vi.fn();
    renderControls({
      design: {
        ...approvedDesign,
        templateId: "unknown-template",
        colorPaletteId: "unknown-palette",
        fontFamily: "unknown-font",
      },
      onSave,
      onPreviewChange,
    });
    const user = userEvent.setup();

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Template" }),
      "modern-professional",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Font" }),
      "Georgia",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Palette" }),
      "navy",
    );

    expect(onPreviewChange).toHaveBeenLastCalledWith({
      templateId: "modern-professional",
      fontFamily: "Georgia",
      colorPaletteId: "navy",
    });
    expect(screen.getByText("Design changes not saved")).not.toBeNull();
    await user.click(screen.getByRole("button", { name: "Save design" }));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith({
      templateId: "modern-professional",
      fontFamily: "Georgia",
      colorPaletteId: "navy",
    });
  });

  it("resets an unsaved preview to the canonical saved design", async () => {
    const onPreviewChange = vi.fn();
    const { props } = renderControls({ onPreviewChange });
    const user = userEvent.setup();

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Template" }),
      "compact-technical",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Font" }),
      "Arial",
    );
    await user.click(screen.getByRole("button", { name: "Reset changes" }));

    expect(onPreviewChange).toHaveBeenLastCalledWith({
      templateId: "ats-classic",
      fontFamily: "Inter",
      colorPaletteId: "slate",
    });
    expect(
      (screen.getByRole("combobox", { name: "Template" }) as HTMLSelectElement)
        .value,
    ).toBe("ats-classic");
    expect(
      (screen.getByRole("button", {
        name: "Save design",
      }) as HTMLButtonElement).disabled,
    ).toBe(true);
    expect(props.onSave).not.toHaveBeenCalled();
  });

  it("shows saving, success, and safe request-ID failure states", () => {
    const { rerender } = render(
      <ResumeDesignControls
        design={approvedDesign}
        saving
        status={{ tone: "success", message: "Resume design saved." }}
        onPreviewChange={vi.fn()}
        onSave={vi.fn()}
      />,
    );

    expect(screen.getByText("Saving resume design…")).not.toBeNull();
    expect(screen.getAllByRole("combobox").every((control) =>
      (control as HTMLSelectElement).disabled
    )).toBe(true);

    rerender(
      <ResumeDesignControls
        design={approvedDesign}
        saving={false}
        status={{
          tone: "error",
          message: "The resume design could not be saved.",
          requestId: "design-request-0001",
        }}
        onPreviewChange={vi.fn()}
        onSave={vi.fn()}
      />,
    );
    expect(screen.getByRole("alert").textContent).toContain(
      "The resume design could not be saved.",
    );
    expect(screen.getByText("Request ID: design-request-0001")).not.toBeNull();
    expect(screen.queryByText("Resume design saved.")).toBeNull();
  });

  it("states the current-design behavior for historical saved content", () => {
    renderControls();
    expect(
      screen.getByText(/historical saved content uses this current design/i),
    ).not.toBeNull();
    expect(screen.getByText(/not saved with each version/i)).not.toBeNull();
  });
});
