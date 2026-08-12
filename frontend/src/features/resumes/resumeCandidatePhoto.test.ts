import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CandidatePhotoError,
  loadCanonicalCandidatePhoto,
  parseCandidatePhotoSource,
  preflightCandidatePhoto,
} from "./resumeCandidatePhoto";

let decodeFailure = false;
let naturalWidth = 800;
let naturalHeight = 1000;

class MockImage {
  src = "";
  naturalWidth = naturalWidth;
  naturalHeight = naturalHeight;

  async decode(): Promise<void> {
    this.naturalWidth = naturalWidth;
    this.naturalHeight = naturalHeight;
    if (decodeFailure) throw new Error("decode failed");
  }
}

const createObjectURL = vi.fn(() => "blob:test-photo");
const revokeObjectURL = vi.fn();

beforeEach(() => {
  decodeFailure = false;
  naturalWidth = 800;
  naturalHeight = 1000;
  createObjectURL.mockClear();
  revokeObjectURL.mockClear();
  vi.stubGlobal("Image", MockImage);
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: createObjectURL,
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    value: revokeObjectURL,
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("Candidate Photo browser helpers", () => {
  it.each(["image/jpeg", "image/png", "image/webp"])(
    "preflights a decodable %s File and revokes its temporary URL",
    async (type) => {
      const file = new File([new Uint8Array(32)], "candidate", { type });
      await expect(preflightCandidatePhoto(file, () => true)).resolves.toBeUndefined();
      expect(createObjectURL).toHaveBeenCalledWith(file);
      expect(revokeObjectURL).toHaveBeenCalledWith("blob:test-photo");
    },
  );

  it("rejects an undecodable local image and revokes its URL", async () => {
    decodeFailure = true;
    const file = new File([new Uint8Array(32)], "candidate.png", {
      type: "image/png",
    });

    await expect(preflightCandidatePhoto(file, () => true)).rejects.toMatchObject({
      code: "UNDECODABLE_IMAGE",
    });
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:test-photo");
  });

  it("rejects an obsolete decoded selection before upload handoff", async () => {
    const file = new File([new Uint8Array(32)], "candidate.webp", {
      type: "image/webp",
    });

    await expect(preflightCandidatePhoto(file, () => false)).rejects.toMatchObject({
      name: "AbortError",
    });
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:test-photo");
  });

  it("rejects client-side excessive dimensions", async () => {
    naturalWidth = 4097;
    const file = new File([new Uint8Array(32)], "candidate.jpg", {
      type: "image/jpeg",
    });

    await expect(preflightCandidatePhoto(file, () => true)).rejects.toBeInstanceOf(
      CandidatePhotoError,
    );
  });

  it("strictly parses the private source descriptor", () => {
    expect(
      parseCandidatePhotoSource({
        url: "https://example.test/private-photo",
        expiresAt: "2026-08-12T00:00:00.000Z",
      }),
    ).toEqual({
      url: "https://example.test/private-photo",
      expiresAt: "2026-08-12T00:00:00.000Z",
    });

    expect(() =>
      parseCandidatePhotoSource({
        url: "javascript:alert(1)",
        expiresAt: "2026-08-12T00:00:00.000Z",
      }),
    ).toThrow();
    expect(() =>
      parseCandidatePhotoSource({
        url: "https://example.test/private-photo",
        expiresAt: "2026-08-12T00:00:00.000Z",
        storageKey: "private/key",
      }),
    ).toThrow();
  });

  it("loads and decodes the canonical private source as a revocable Blob URL", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(new Blob([new Uint8Array(64)], { type: "image/png" }), {
        status: 200,
        headers: { "Content-Type": "image/png", "Content-Length": "64" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const url = await loadCanonicalCandidatePhoto({
      url: "https://example.test/private-photo",
      expiresAt: "2026-08-12T00:00:00.000Z",
    });

    expect(url).toBe("blob:test-photo");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.test/private-photo",
      expect.objectContaining({
        credentials: "omit",
        referrerPolicy: "no-referrer",
        cache: "no-store",
      }),
    );
    expect(revokeObjectURL).not.toHaveBeenCalled();
  });

  it("revokes a canonical Blob URL when source decoding fails", async () => {
    decodeFailure = true;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(new Blob([new Uint8Array(64)], { type: "image/png" }), {
          status: 200,
          headers: { "Content-Type": "image/png", "Content-Length": "64" },
        }),
      ),
    );

    await expect(
      loadCanonicalCandidatePhoto({
        url: "https://example.test/private-photo",
        expiresAt: "2026-08-12T00:00:00.000Z",
      }),
    ).rejects.toMatchObject({ code: "UNDECODABLE_IMAGE" });
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:test-photo");
  });
});
