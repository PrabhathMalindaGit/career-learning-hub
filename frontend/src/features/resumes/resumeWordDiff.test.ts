import { describe, expect, it } from "vitest";
import { diffResumeText } from "./resumeWordDiff";

describe("diffResumeText", () => {
  it("keeps unchanged text readable and permits empty inputs", () => {
    expect(diffResumeText("Built a service.", "Built a service.")).toEqual({
      original: [{ type: "unchanged", text: "Built a service." }],
      suggested: [{ type: "unchanged", text: "Built a service." }],
    });
    expect(diffResumeText("", "")).toEqual({
      original: [],
      suggested: [],
    });
  });

  it("marks additions, removals, replacements, and contiguous changes", () => {
    expect(
      diffResumeText(
        "Built services for teams.",
        "Built reliable services for global teams.",
      ),
    ).toEqual({
      original: [
        { type: "unchanged", text: "Built services for teams." },
      ],
      suggested: [
        { type: "unchanged", text: "Built" },
        { type: "added", text: " reliable" },
        { type: "unchanged", text: " services for" },
        { type: "added", text: " global" },
        { type: "unchanged", text: " teams." },
      ],
    });

    const replacement = diffResumeText(
      "Reduced latency and errors.",
      "Cut response time and failures.",
    );
    expect(replacement.original).toContainEqual({
      type: "removed",
      text: "Reduced latency",
    });
    expect(replacement.suggested).toContainEqual({
      type: "added",
      text: "Cut response time",
    });

    expect(diffResumeText("Kept obsolete wording", "Kept wording").original)
      .toContainEqual({ type: "removed", text: " obsolete" });
  });

  it("aligns repeated words deterministically", () => {
    const first = diffResumeText("test test shipped", "test shipped test");
    const second = diffResumeText("test test shipped", "test shipped test");

    expect(second).toEqual(first);
    expect(first.original.some((segment) => segment.type === "removed")).toBe(
      true,
    );
    expect(first.suggested.some((segment) => segment.type === "added")).toBe(
      true,
    );
  });

  it("normalizes whitespace without creating change noise", () => {
    expect(
      diffResumeText("Built   a\nservice.", "Built a service."),
    ).toEqual({
      original: [{ type: "unchanged", text: "Built a service." }],
      suggested: [{ type: "unchanged", text: "Built a service." }],
    });
  });

  it("handles punctuation adjacency, punctuation-only changes, and apostrophes", () => {
    expect(
      diffResumeText(
        "Improved APIs, reliability, and users' trust.",
        "Improved APIs: reliability and users' trust!",
      ),
    ).toEqual({
      original: [
        { type: "unchanged", text: "Improved APIs" },
        { type: "removed", text: "," },
        { type: "unchanged", text: " reliability" },
        { type: "removed", text: "," },
        { type: "unchanged", text: " and users' trust" },
        { type: "removed", text: "." },
      ],
      suggested: [
        { type: "unchanged", text: "Improved APIs" },
        { type: "added", text: ":" },
        { type: "unchanged", text: " reliability and users' trust" },
        { type: "added", text: "!" },
      ],
    });
  });

  it("supports Unicode words", () => {
    const result = diffResumeText(
      "Led café operations in 東京.",
      "Led global café operations in 東京.",
    );

    expect(result.suggested).toContainEqual({
      type: "added",
      text: " global",
    });
    expect(result.suggested.map((segment) => segment.text).join("")).toBe(
      "Led global café operations in 東京.",
    );
  });

  it("handles contract-bounded 2,000-character inputs without mutation", () => {
    const original = `${"alpha ".repeat(332)}beta!`.slice(0, 2_000);
    const suggested = `${"alpha ".repeat(331)}gamma beta!`.slice(0, 2_000);
    const originalCopy = original;
    const suggestedCopy = suggested;

    const first = diffResumeText(original, suggested);
    const second = diffResumeText(original, suggested);

    expect(first).toEqual(second);
    expect(original).toBe(originalCopy);
    expect(suggested).toBe(suggestedCopy);
    expect(first.original.length).toBeGreaterThan(0);
    expect(first.suggested.length).toBeGreaterThan(0);
  });
});
