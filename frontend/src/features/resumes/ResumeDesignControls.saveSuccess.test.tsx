import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ResumeDesignControls } from "./ResumeDesignControls";
import type { ResumeDesign } from "./types";

const design: ResumeDesign = {
  templateId: "ats-classic",
  colorPaletteId: "slate",
  pageSize: "A4",
  fontFamily: "Inter",
  showProfilePhoto: false,
};

function controls(
  saving: boolean,
  status?: React.ComponentProps<typeof ResumeDesignControls>["status"],
) {
  return (
    <ResumeDesignControls
      design={design}
      saving={saving}
      status={status}
      onPreviewChange={vi.fn()}
      onSave={vi.fn()}
    />
  );
}

describe("ResumeDesignControls save completion", () => {
  it("keeps customization open while saving and closes it after confirmed success", async () => {
    const { rerender } = render(controls(false));
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Customize" }));
    expect(screen.getByRole("button", { name: "Close customization" })).not.toBeNull();
    expect(screen.getAllByRole("radio").length).toBeGreaterThan(0);

    rerender(controls(true));
    expect(screen.getByRole("button", { name: "Close customization" })).not.toBeNull();
    expect(screen.getByText("Saving appearance…")).not.toBeNull();

    rerender(
      controls(false, { tone: "success", message: "Resume design saved." }),
    );

    expect(screen.getByRole("button", { name: "Customize" })).not.toBeNull();
    expect(screen.queryAllByRole("radio")).toHaveLength(0);
    expect(screen.getByText("Resume design saved.")).not.toBeNull();
  });

  it("keeps customization open after a failed save so the user can retry", async () => {
    const { rerender } = render(controls(false));
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Customize" }));
    rerender(controls(true));
    rerender(
      controls(false, {
        tone: "error",
        message: "The resume design could not be saved.",
        requestId: "design-request-0001",
      }),
    );

    expect(screen.getByRole("button", { name: "Close customization" })).not.toBeNull();
    expect(screen.getAllByRole("radio").length).toBeGreaterThan(0);
    expect(screen.getByRole("alert").textContent).toContain(
      "The resume design could not be saved.",
    );
    expect(screen.getByText("Request ID: design-request-0001")).not.toBeNull();
  });
});
