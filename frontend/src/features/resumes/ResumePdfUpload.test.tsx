import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import {
  ResumePdfUpload,
  validateResumePdfFiles,
} from "./ResumePdfUpload";

const MAX_PDF_SIZE = 15 * 1024 * 1024;

function pdf(name = "synthetic.pdf", type = "application/pdf") {
  return new File(["%PDF-synthetic"], name, { type });
}

function Harness({ busy = false, error }: { busy?: boolean; error?: string }) {
  const [file, setFile] = useState<File | null>(null);
  return (
    <ResumePdfUpload
      file={file}
      busy={busy}
      error={error}
      onChange={setFile}
    />
  );
}

describe("ResumePdfUpload", () => {
  it("accepts exactly one non-empty bounded PDF using MIME or extension fallback", () => {
    const mimePdf = pdf();
    const extensionPdf = pdf("fallback.PDF", "");
    expect(validateResumePdfFiles([mimePdf])).toEqual({ file: mimePdf });
    expect(validateResumePdfFiles([extensionPdf])).toEqual({ file: extensionPdf });
    expect(validateResumePdfFiles([])).toEqual({
      error: "Choose one PDF no larger than 15 MB.",
    });
    expect(validateResumePdfFiles([mimePdf, extensionPdf])).toEqual({
      error: "Choose one PDF only.",
    });
    expect(validateResumePdfFiles([new File(["text"], "notes.txt", { type: "text/plain" })])).toEqual({
      error: "Choose a PDF file.",
    });
    expect(validateResumePdfFiles([new File([], "empty.pdf", { type: "application/pdf" })])).toEqual({
      error: "Choose a non-empty PDF.",
    });
    const oversized = pdf("oversized.pdf");
    Object.defineProperty(oversized, "size", { value: MAX_PDF_SIZE + 1 });
    expect(validateResumePdfFiles([oversized])).toEqual({
      error: "Choose a PDF no larger than 15 MB.",
    });
  });

  it("uses one native input for keyboard selection, replace, and remove", async () => {
    render(<Harness />);
    const user = userEvent.setup();
    const input = screen.getByLabelText("Resume PDF") as HTMLInputElement;
    expect(document.querySelectorAll('input[type="file"]')).toHaveLength(1);
    expect(input.getAttribute("accept")).toBe("application/pdf,.pdf");
    const click = vi.spyOn(input, "click");

    const choose = screen.getByRole("button", { name: "Choose PDF" });
    choose.focus();
    await user.keyboard("{Enter}");
    expect(click).toHaveBeenCalledTimes(1);

    await user.upload(input, pdf());
    expect(screen.getByText("synthetic.pdf")).not.toBeNull();
    expect(screen.getByText("14 B")).not.toBeNull();
    await user.click(screen.getByRole("button", { name: "Replace PDF" }));
    expect(click).toHaveBeenCalledTimes(2);
    await user.click(screen.getByRole("button", { name: "Remove PDF" }));
    expect(input.value).toBe("");
    expect(screen.getByRole("button", { name: "Choose PDF" })).not.toBeNull();
  });

  it("supports truthful drag-and-drop and rejects invalid selections", async () => {
    const onChange = vi.fn();
    render(<ResumePdfUpload file={null} onChange={onChange} />);
    const dropzone = screen.getByRole("group", { name: "Resume PDF upload" });
    const valid = pdf("dropped.pdf");

    fireEvent.dragEnter(dropzone, {
      dataTransfer: { files: [valid], types: ["Files"] },
    });
    expect(dropzone.getAttribute("data-drag-active")).toBe("true");
    fireEvent.drop(dropzone, {
      dataTransfer: { files: [valid], types: ["Files"] },
    });
    expect(onChange).toHaveBeenCalledWith(valid);
    expect(dropzone.getAttribute("data-drag-active")).toBe("false");

    onChange.mockClear();
    fireEvent.drop(dropzone, {
      dataTransfer: { files: [valid, pdf("second.pdf")], types: ["Files"] },
    });
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toBe("Choose one PDF only.");

    fireEvent.change(screen.getByLabelText("Resume PDF"), {
      target: { files: [new File(["text"], "notes.txt", { type: "text/plain" })] },
    });
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toBe("Choose a PDF file.");
  });

  it("associates caller errors and disables every selection control while busy", () => {
    render(<Harness busy error="The server rejected this PDF." />);
    const input = screen.getByLabelText("Resume PDF") as HTMLInputElement;
    const trigger = screen.getByRole("button", { name: "Choose PDF" }) as HTMLButtonElement;
    const error = screen.getByRole("alert");
    expect(input.getAttribute("aria-describedby")).toContain(error.id);
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.disabled).toBe(true);
    expect(trigger.disabled).toBe(true);
    expect(screen.getByText(/server validation is authoritative/i)).not.toBeNull();
  });
});
