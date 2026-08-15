import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type ResumeApiModule = typeof import("./resumeApi");

async function loadApi(): Promise<ResumeApiModule> {
  vi.resetModules();
  vi.stubEnv("VITE_API_URL", "https://api.example.test/api/v1");
  return import("./resumeApi");
}

describe("resume deletion API", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("sends one authenticated DELETE request and accepts 204 with no response body", async () => {
    const { deleteResume } = await loadApi();
    const controller = new AbortController();
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 204 }));

    await expect(
      deleteResume("507f1f77bcf86cd799439011", controller.signal),
    ).resolves.toBeUndefined();

    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, options] = vi.mocked(fetch).mock.calls[0] ?? [];
    expect(String(url)).toBe(
      "https://api.example.test/api/v1/resumes/507f1f77bcf86cd799439011",
    );
    expect(options?.method).toBe("DELETE");
    expect(options?.signal).toBe(controller.signal);
  });
});
