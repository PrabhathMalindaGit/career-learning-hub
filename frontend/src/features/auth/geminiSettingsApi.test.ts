import { afterEach, describe, expect, it, vi } from "vitest";
import * as apiClient from "../../api/apiClient";
import {
  activateGeminiSource,
  deletePersonalGeminiKey,
  disconnectGemini,
  fetchGeminiSettings,
  saveAndTestPersonalGeminiKey,
  testGeminiConnection,
} from "./geminiSettingsApi";

vi.mock("../../api/apiClient", async () => {
  const actual = await vi.importActual<typeof apiClient>(
    "../../api/apiClient",
  );
  return {
    ...actual,
    requestWithMetadata: vi.fn(),
    requestWithStatusMetadata: vi.fn(),
  };
});

const providers = {
  geminiModel: "gemini-3.6-flash",
  administratorManagedAvailable: true,
  providers: [{
    id: "gemini-direct",
    available: true,
    configured: true,
    credential: {
      id: "507f1f77bcf86cd799439011",
      maskedSuffix: "••••6789",
      secretVersion: 3,
      revision: 4,
      connectionStatus: "valid",
      lastValidatedAt: "2026-08-06T08:00:00.000Z",
    },
  }],
};

afterEach(() => {
  vi.clearAllMocks();
});

describe("Gemini Settings API", () => {
  it("combines only the Gemini provider and routing responses", async () => {
    vi.mocked(apiClient.requestWithMetadata)
      .mockResolvedValueOnce({ data: providers, requestId: "request-provider-0001" })
      .mockResolvedValueOnce({
        data: {
          activeProvider: "gemini-direct",
          credentialSource: "user-managed",
          preferenceRevision: 6,
        },
      });

    await expect(fetchGeminiSettings()).resolves.toEqual({
      mode: "personal",
      model: "gemini-3.6-flash",
      administratorManagedAvailable: true,
      preferenceRevision: 6,
      requestId: "request-provider-0001",
      credential: {
        id: "507f1f77bcf86cd799439011",
        maskedSuffix: "••••6789",
        secretVersion: 3,
        revision: 4,
        connectionStatus: "valid",
        lastValidatedAt: "2026-08-06T08:00:00.000Z",
      },
    });
    expect(apiClient.requestWithMetadata).toHaveBeenNthCalledWith(
      1,
      "/ai/providers",
      { authentication: "required", signal: undefined },
    );
    expect(apiClient.requestWithMetadata).toHaveBeenNthCalledWith(
      2,
      "/ai/routing",
      { authentication: "required", signal: undefined },
    );
    expect(JSON.stringify(vi.mocked(apiClient.requestWithMetadata).mock.calls))
      .not.toMatch(/openrouter/i);
  });

  it("keeps a candidate key only in the authenticated PUT body", async () => {
    const candidate = "AIzaApiModuleCandidate-123456789";
    vi.mocked(apiClient.requestWithStatusMetadata).mockResolvedValue({
      status: 201,
      data: {},
    });

    await saveAndTestPersonalGeminiKey(candidate, 4);

    const [path, options] = vi.mocked(
      apiClient.requestWithStatusMetadata,
    ).mock.calls[0] ?? [];
    expect(path).toBe("/ai/providers/gemini-direct/credential");
    expect(path).not.toContain(candidate);
    expect(options).toMatchObject({
      method: "PUT",
      authentication: "required",
      body: { apiKey: candidate },
      headers: {
        "If-Match": '"4"',
        "Idempotency-Key": expect.any(String),
      },
    });
  });

  it("uses explicit sources for test, activation, and disconnection", async () => {
    vi.mocked(apiClient.requestWithStatusMetadata).mockResolvedValue({
      status: 200,
      data: {},
    });
    await testGeminiConnection({
      mode: "application-managed",
      model: "gemini-3.6-flash",
      administratorManagedAvailable: true,
      preferenceRevision: 2,
    });
    await activateGeminiSource("administrator-managed", 2);
    await disconnectGemini(3);

    expect(apiClient.requestWithStatusMetadata).toHaveBeenNthCalledWith(
      1,
      "/ai/providers/gemini-direct/test",
      expect.objectContaining({
        body: { credentialSource: "administrator-managed" },
      }),
    );
    expect(apiClient.requestWithStatusMetadata).toHaveBeenNthCalledWith(
      2,
      "/ai/providers/gemini-direct/activate",
      expect.objectContaining({
        body: { credentialSource: "administrator-managed" },
      }),
    );
    expect(apiClient.requestWithStatusMetadata).toHaveBeenNthCalledWith(
      3,
      "/ai/providers/disabled/activate",
      expect.objectContaining({ body: {} }),
    );
  });

  it("deletes a personal key without a request body", async () => {
    vi.mocked(apiClient.requestWithStatusMetadata).mockResolvedValue({
      status: 204,
      data: undefined,
    });

    await deletePersonalGeminiKey(7);

    expect(apiClient.requestWithStatusMetadata).toHaveBeenCalledWith(
      "/ai/providers/gemini-direct/credential",
      {
        method: "DELETE",
        authentication: "required",
        headers: {
          "If-Match": '"7"',
          "Idempotency-Key": expect.any(String),
        },
      },
    );
  });
});
