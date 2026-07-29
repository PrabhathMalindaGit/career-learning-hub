import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createResumePrintTitle,
  openResumePrint,
} from "./resumePrint";

describe("resume print utility", () => {
  afterEach(() => {
    window.dispatchEvent(new Event("afterprint"));
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("normalizes a bounded title and includes version and page size", () => {
    expect(
      createResumePrintTitle({
        resumeTitle: "  Senior / Platform Engineer...PDF  ",
        versionNumber: 4,
        pageSize: "A4",
      }),
    ).toBe("senior-platform-engineer-v4-a4");
    expect(
      createResumePrintTitle({
        resumeTitle: "///",
        versionNumber: 2,
        pageSize: "LETTER",
      }),
    ).toBe("resume-v2-letter");
    expect(
      createResumePrintTitle({
        resumeTitle: "A".repeat(400),
        versionNumber: 12,
        pageSize: "LETTER",
      }).length,
    ).toBeLessThanOrEqual(96);
  });

  it("temporarily changes the title, prints once, and restores afterprint", async () => {
    const originalTitle = "Career Learning Hub";
    document.title = originalTitle;
    const print = vi
      .spyOn(window, "print")
      .mockImplementation(() => undefined);
    vi.spyOn(window, "requestAnimationFrame").mockImplementation(
      (callback) => {
        callback(0);
        return 1;
      },
    );
    const states: boolean[] = [];

    await expect(
      openResumePrint({
        title: "synthetic-resume-v1-a4",
        onPrintStateChange: (active) => states.push(active),
      }),
    ).resolves.toBe(true);

    expect(print).toHaveBeenCalledTimes(1);
    expect(document.title).toBe("synthetic-resume-v1-a4");
    expect(states).toEqual([true]);

    window.dispatchEvent(new Event("afterprint"));

    expect(document.title).toBe(originalTitle);
    expect(states).toEqual([true, false]);
  });

  it("uses bounded fallback cleanup and blocks a duplicate print", async () => {
    vi.useFakeTimers();
    document.title = "Original";
    const print = vi
      .spyOn(window, "print")
      .mockImplementation(() => undefined);
    vi.spyOn(window, "requestAnimationFrame").mockImplementation(
      (callback) => {
        callback(0);
        return 1;
      },
    );

    await expect(
      openResumePrint({
        title: "first-v1-a4",
        onPrintStateChange: vi.fn(),
      }),
    ).resolves.toBe(true);
    await expect(
      openResumePrint({
        title: "second-v1-a4",
        onPrintStateChange: vi.fn(),
      }),
    ).resolves.toBe(false);
    expect(print).toHaveBeenCalledTimes(1);

    vi.runAllTimers();

    expect(document.title).toBe("Original");
    await expect(
      openResumePrint({
        title: "second-v1-a4",
        onPrintStateChange: vi.fn(),
      }),
    ).resolves.toBe(true);
    expect(print).toHaveBeenCalledTimes(2);
  });
});
