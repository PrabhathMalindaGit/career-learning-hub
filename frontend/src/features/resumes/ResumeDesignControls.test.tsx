import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
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
  overrides: Partial<React.ComponentProps<typeof ResumeDesignControls>> = {},
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

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ResumeDesignControls", () => {
  it("summarizes the current appearance and reveals every bounded design choice", async () => {
    renderControls();
    const user = userEvent.setup();

    expect(screen.getByRole("group", { name: "Resume appearance" })).not.toBeNull();
    expect(screen.getByText("ATS Classic • Inter • Slate • A4")).not.toBeNull();
    const customize = screen.getByRole("button", { name: "Customize" });
    expect(customize.getAttribute("aria-expanded")).toBe("false");
    expect(customize.getAttribute("aria-controls")).toBe(
      "resume-design-customization",
    );
    expect(screen.queryAllByRole("radio")).toHaveLength(0);
    expect(document.querySelectorAll("[data-template-preview]")).toHaveLength(0);

    await user.click(customize);

    expect(customize.getAttribute("aria-expanded")).toBe("true");
    const templateChoices = document.querySelectorAll(
      'input[name="resume-template"]',
    );
    expect(templateChoices).toHaveLength(3);
    expect(
      Array.from(templateChoices, (choice) => choice.getAttribute("value")),
    ).toEqual(["ats-classic", "modern-professional", "compact-technical"]);
    expect(
      (screen.getByRole("radio", { name: /ATS Classic/i }) as HTMLInputElement)
        .checked,
    ).toBe(true);
    expect(
      (screen.getByRole("radio", {
        name: /Modern Professional/i,
      }) as HTMLInputElement).checked,
    ).toBe(false);
    expect(
      (screen.getByRole("radio", {
        name: /Compact Technical/i,
      }) as HTMLInputElement).checked,
    ).toBe(false);
    expect(
      screen.getByText(
        "Traditional single-column layout optimized for clear scanning and conservative applications.",
      ),
    ).not.toBeNull();
    expect(
      screen.getByText(
        "Polished two-column presentation with a strong header and structured professional sidebar.",
      ),
    ).not.toBeNull();
    expect(
      screen.getByText(
        "Dense technical layout prioritizing skills, tools, projects, and efficient use of page space.",
      ),
    ).not.toBeNull();
    expect(document.querySelectorAll("[data-template-preview]")).toHaveLength(3);
    expect(document.querySelectorAll("[data-font-preview]")).toHaveLength(3);
    expect(document.querySelectorAll("[data-palette-preview]")).toHaveLength(3);
    expect(screen.queryAllByText("Selected")).toHaveLength(0);
    expect(
      (screen.getByRole("radio", { name: /Inter/i }) as HTMLInputElement).checked,
    ).toBe(true);
    expect(
      (screen.getByRole("radio", { name: /Slate/i }) as HTMLInputElement).checked,
    ).toBe(true);
    expect(
      Array.from(
        document.querySelectorAll('input[name="resume-font"]'),
        (choice) => choice.getAttribute("value"),
      ),
    ).toEqual(["Inter", "Arial", "Georgia"]);
    expect(
      Array.from(
        document.querySelectorAll('input[name="resume-palette"]'),
        (choice) => choice.getAttribute("value"),
      ),
    ).toEqual(["slate", "forest", "navy"]);
    expect(screen.getAllByText("Shape the work. Show the impact.")).toHaveLength(3);
    expect(document.body.textContent).not.toMatch(
      /line spacing|custom font|custom color|ats score|ats certified|guaranteed ats/i,
    );
    expect(document.body.textContent).not.toMatch(
      /ai resume analyser|resume builder|unknown-template|unknown-palette/i,
    );
  });

  it("falls back safely for unknown saved values without patching on render", async () => {
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

    expect(
      screen.getByText(/saved design choices are no longer available/i),
    ).not.toBeNull();
    expect(
      screen.getByText(/preview uses ats classic, slate, and inter/i),
    ).not.toBeNull();
    expect(document.body.textContent).not.toContain("unknown-template");
    expect(document.body.textContent).not.toContain("unknown-palette");
    expect(document.body.textContent).not.toContain("unknown-font");
    expect(onSave).not.toHaveBeenCalled();
    expect(onPreviewChange).not.toHaveBeenCalled();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Customize" }));
    expect(
      screen
        .getAllByRole("radio")
        .every((choice) => !(choice as HTMLInputElement).checked),
    ).toBe(true);
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
    await user.click(screen.getByRole("button", { name: "Customize" }));

    await user.click(screen.getByRole("radio", { name: /Modern Professional/i }));
    await user.click(screen.getByRole("radio", { name: /Georgia/i }));
    await user.click(screen.getByRole("radio", { name: /Navy/i }));

    expect(onPreviewChange).toHaveBeenLastCalledWith({
      templateId: "modern-professional",
      fontFamily: "Georgia",
      colorPaletteId: "navy",
    });
    expect(
      screen.getByText("Modern Professional • Georgia • Navy • A4"),
    ).not.toBeNull();
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
    await user.click(screen.getByRole("button", { name: "Customize" }));

    await user.click(screen.getByRole("radio", { name: /Compact Technical/i }));
    await user.click(screen.getByRole("radio", { name: /Arial/i }));
    await user.click(screen.getByRole("button", { name: "Reset changes" }));

    expect(onPreviewChange).toHaveBeenLastCalledWith({
      templateId: "ats-classic",
      fontFamily: "Inter",
      colorPaletteId: "slate",
    });
    expect(
      (screen.getByRole("radio", { name: /ATS Classic/i }) as HTMLInputElement)
        .checked,
    ).toBe(true);
    expect(
      (screen.getByRole("button", {
        name: "Save design",
      }) as HTMLButtonElement).disabled,
    ).toBe(true);
    expect(props.onSave).not.toHaveBeenCalled();
  });

  it("shows saving, success, and safe request-ID failure states", async () => {
    const { rerender } = render(
      <ResumeDesignControls
        design={approvedDesign}
        saving={false}
        onPreviewChange={vi.fn()}
        onSave={vi.fn()}
      />,
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Customize" }));

    rerender(
      <ResumeDesignControls
        design={approvedDesign}
        saving
        status={{ tone: "success", message: "Resume design saved." }}
        onPreviewChange={vi.fn()}
        onSave={vi.fn()}
      />,
    );

    expect(screen.getByText("Saving resume design…")).not.toBeNull();
    expect(
      screen
        .getAllByRole("radio")
        .every((control) => (control as HTMLInputElement).disabled),
    ).toBe(true);

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

  it("states the current-design behavior for historical saved content", async () => {
    renderControls();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Customize" }));
    expect(
      screen.getByText(/historical saved content uses this current design/i),
    ).not.toBeNull();
    expect(screen.getByText(/not saved with each version/i)).not.toBeNull();
  });

  it("uses native radio keyboard behavior to keep one template selected", async () => {
    vi.stubGlobal("CSS", { escape: (value: string) => value });
    const onPreviewChange = vi.fn();
    renderControls({ onPreviewChange });
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Customize" }));
    const atsClassic = screen.getByRole("radio", { name: /ATS Classic/i });

    atsClassic.focus();
    await user.keyboard("{ArrowRight}");

    expect(
      (screen.getByRole("radio", {
        name: /Modern Professional/i,
      }) as HTMLInputElement).checked,
    ).toBe(true);
    expect((atsClassic as HTMLInputElement).checked).toBe(false);
    expect(onPreviewChange).toHaveBeenLastCalledWith({
      templateId: "modern-professional",
      fontFamily: "Inter",
      colorPaletteId: "slate",
    });
  });
});
