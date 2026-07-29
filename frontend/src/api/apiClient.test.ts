import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type ApiClientModule = typeof import("./apiClient");

function jsonResponse(
  body: unknown,
  status = 200,
  headers?: HeadersInit,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });
}

function emptyResponse(status = 204): Response {
  return new Response(null, { status });
}

async function loadClient(
  apiUrl = "https://api.example.test/api/v1/",
): Promise<ApiClientModule> {
  vi.resetModules();
  vi.stubEnv("VITE_API_URL", apiUrl);
  return import("./apiClient");
}

async function loadClientForEnvironment(input: {
  apiUrl?: string;
  production: boolean;
}): Promise<ApiClientModule> {
  vi.resetModules();
  vi.unstubAllEnvs();
  vi.stubEnv("PROD", input.production);
  vi.stubEnv("DEV", !input.production);
  if (input.apiUrl !== undefined) {
    vi.stubEnv("VITE_API_URL", input.apiUrl);
  }
  return import("./apiClient");
}

describe("apiClient", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("rejects a missing production API base URL without exposing a value", async () => {
    await expect(
      loadClientForEnvironment({ production: true }),
    ).rejects.toThrow("VITE_API_URL");
  });

  it.each([
    "http://api.example.test/api/v1",
    "https://localhost:8000/api/v1",
    "https://api.localhost:8000/api/v1",
    "https://127.0.0.1:8000/api/v1",
    "https://127.8.9.10:8000/api/v1",
    "https://[::1]:8000/api/v1",
    "https://[::ffff:127.0.0.1]:8000/api/v1",
    "not-a-url",
    "https://user:password@api.example.test/api/v1",
    "https://api.example.test/api/v1?unsafe=true",
    "https://api.example.test/api/v1#unsafe",
  ])("rejects unsafe production VITE_API_URL %s", async (apiUrl) => {
    await expect(
      loadClientForEnvironment({ apiUrl, production: true }),
    ).rejects.toThrow("VITE_API_URL");
  });

  it("accepts and normalizes an explicit HTTPS production API base URL", async () => {
    const { apiRequest } = await loadClientForEnvironment({
      apiUrl: "https://api.example.test/api/v1///",
      production: true,
    });
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ success: true, data: { ok: true } }),
    );

    await apiRequest("/health");

    expect(vi.mocked(fetch).mock.calls[0]?.[0]).toBe(
      "https://api.example.test/api/v1/health",
    );
  });

  it("preserves the localhost API fallback outside production", async () => {
    const { apiRequest } = await loadClientForEnvironment({
      production: false,
    });
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ success: true, data: { ok: true } }),
    );

    await apiRequest("/health");

    expect(vi.mocked(fetch).mock.calls[0]?.[0]).toBe(
      "http://localhost:8000/api/v1/health",
    );
  });

  it("applies the configured base URL and includes credentials", async () => {
    const { apiRequest } = await loadClient();
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ success: true, data: { ok: true } }),
    );

    await apiRequest("/health");

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(vi.mocked(fetch).mock.calls[0]?.[0]).toBe(
      "https://api.example.test/api/v1/health",
    );
    expect(vi.mocked(fetch).mock.calls[0]?.[1]?.credentials).toBe(
      "include",
    );
  });

  it("applies JSON headers and serializes JSON bodies", async () => {
    const { apiRequest } = await loadClient();
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ success: true, data: { saved: true } }),
    );

    await apiRequest("/records", {
      method: "POST",
      body: { title: "Test record" },
    });

    const init = vi.mocked(fetch).mock.calls[0]?.[1];
    const headers = new Headers(init?.headers);
    expect(headers.get("Content-Type")).toBe("application/json");
    expect(init?.body).toBe(JSON.stringify({ title: "Test record" }));
  });

  it("does not apply a JSON content type when no body is present", async () => {
    const { apiRequest } = await loadClient();
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ success: true, data: { ok: true } }),
    );

    await apiRequest("/records");

    const headers = new Headers(
      vi.mocked(fetch).mock.calls[0]?.[1]?.headers,
    );
    expect(headers.has("Content-Type")).toBe(false);
  });

  it("preserves FormData without forcing a JSON content type", async () => {
    const { apiRequest } = await loadClient();
    const form = new FormData();
    form.set("title", "Synthetic file");
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ success: true, data: { uploaded: true } }),
    );

    await apiRequest("/uploads", {
      method: "POST",
      body: form,
    });

    const init = vi.mocked(fetch).mock.calls[0]?.[1];
    const headers = new Headers(init?.headers);
    expect(headers.has("Content-Type")).toBe(false);
    expect(init?.body).toBe(form);
  });

  it("uses the latest in-memory access token", async () => {
    const { apiRequest, configureApiClientAuth } = await loadClient();
    let accessToken = "first-memory-token";
    configureApiClientAuth({
      getAccessToken: () => accessToken,
      refreshSession: vi.fn(),
      clearAuthentication: vi.fn(),
    });
    vi.mocked(fetch).mockImplementation(async () =>
      jsonResponse({ success: true, data: { ok: true } }),
    );

    await apiRequest("/first");
    accessToken = "latest-memory-token";
    await apiRequest("/second");

    const firstHeaders = new Headers(
      vi.mocked(fetch).mock.calls[0]?.[1]?.headers,
    );
    const secondHeaders = new Headers(
      vi.mocked(fetch).mock.calls[1]?.[1]?.headers,
    );
    expect(firstHeaders.get("Authorization")).toBe(
      "Bearer first-memory-token",
    );
    expect(secondHeaders.get("Authorization")).toBe(
      "Bearer latest-memory-token",
    );
  });

  it("constructs a compatibility Authorization header centrally", async () => {
    const { apiRequest } = await loadClient();
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ success: true, data: { ok: true } }),
    );

    await apiRequest("/legacy-compatible", {
      accessToken: "compatibility-token",
    });

    const headers = new Headers(
      vi.mocked(fetch).mock.calls[0]?.[1]?.headers,
    );
    expect(headers.get("Authorization")).toBe(
      "Bearer compatibility-token",
    );
  });

  it("unwraps a structured success envelope", async () => {
    const { apiRequest } = await loadClient();
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({
        success: true,
        data: { id: "record-1", title: "Synthetic" },
      }),
    );

    const result = await apiRequest<{ id: string; title: string }>(
      "/records/record-1",
    );

    expect(result).toEqual({
      id: "record-1",
      title: "Synthetic",
    });
  });

  it("keeps existing callers limited to the unwrapped data", async () => {
    const { apiRequest } = await loadClient();
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(
        { success: true, data: { id: "record-1" } },
        200,
        {
          "X-Request-Id": "canonical-request-id-0001",
          "X-Internal-Transport": "must-not-leak",
        },
      ),
    );

    const result = await apiRequest<{ id: string }>("/records/record-1");

    expect(result).toEqual({ id: "record-1" });
  });

  it("returns only data and a canonical request ID when metadata is requested", async () => {
    const { requestWithMetadata } = await loadClient();
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(
        { success: true, data: { id: "record-1" } },
        200,
        {
          "X-Request-Id": "canonical-request-id-0001",
          "X-Internal-Transport": "must-not-leak",
        },
      ),
    );

    const result = await requestWithMetadata<{ id: string }>(
      "/records/record-1",
    );

    expect(result).toEqual({
      data: { id: "record-1" },
      requestId: "canonical-request-id-0001",
    });
    expect(Object.keys(result).sort()).toEqual(["data", "requestId"]);
    expect(result).not.toHaveProperty("response");
    expect(result).not.toHaveProperty("headers");
    expect(result).not.toHaveProperty("X-Internal-Transport");
  });

  it("returns status only through the explicit status-aware metadata helper", async () => {
    const { requestWithStatusMetadata } = await loadClient();
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(
        { success: true, data: { accepted: true } },
        202,
        { "X-Request-Id": "request-upload-status-0001" },
      ),
    );

    await expect(
      requestWithStatusMetadata<{ accepted: boolean }>("/uploads", {
        method: "POST",
      }),
    ).resolves.toEqual({
      data: { accepted: true },
      requestId: "request-upload-status-0001",
      status: 202,
    });
  });

  it.each([
    ["missing", undefined],
    ["malformed", "invalid request id"],
  ])("omits a %s request ID from requested metadata", async (
    _description,
    requestId,
  ) => {
    const { requestWithMetadata } = await loadClient();
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(
        { success: true, data: { ok: true } },
        200,
        requestId ? { "X-Request-Id": requestId } : undefined,
      ),
    );

    await expect(
      requestWithMetadata<{ ok: boolean }>("/records"),
    ).resolves.toEqual({
      data: { ok: true },
    });
  });

  it("preserves current structured errors and their request IDs for metadata callers", async () => {
    const { ApiError, requestWithMetadata } = await loadClient();
    const details = { fieldErrors: { title: ["Title is required"] } };
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Request validation failed.",
            requestId: "request-body-id-0002",
            details,
          },
        },
        400,
        { "X-Request-Id": "request-header-id-0002" },
      ),
    );

    const error = await requestWithMetadata("/records").catch(
      (reason: unknown) => reason,
    );

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 400,
      code: "VALIDATION_ERROR",
      message: "Request validation failed.",
      requestId: "request-body-id-0002",
      details,
    });
  });

  it("preserves refresh and one-retry behavior for metadata callers", async () => {
    const {
      configureApiClientAuth,
      requestWithMetadata,
    } = await loadClient();
    let accessToken = "expired-token";
    const refreshSession = vi.fn(async () => {
      accessToken = "refreshed-token";
    });
    configureApiClientAuth({
      getAccessToken: () => accessToken,
      refreshSession,
      clearAuthentication: vi.fn(),
    });
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        jsonResponse(
          {
            success: false,
            error: {
              code: "AUTHENTICATION_REQUIRED",
              message: "Authentication is required.",
              requestId: "request-auth-id-0005",
            },
          },
          401,
        ),
      )
      .mockResolvedValueOnce(
        jsonResponse(
          { success: true, data: { ok: true } },
          200,
          { "X-Request-Id": "request-retry-id-0001" },
        ),
      );

    await expect(
      requestWithMetadata<{ ok: boolean }>("/protected"),
    ).resolves.toEqual({
      data: { ok: true },
      requestId: "request-retry-id-0001",
    });
    expect(refreshSession).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledTimes(2);
    const retryHeaders = new Headers(
      vi.mocked(fetch).mock.calls[1]?.[1]?.headers,
    );
    expect(retryHeaders.get("Authorization")).toBe(
      "Bearer refreshed-token",
    );
  });

  it("forwards an AbortSignal for metadata callers", async () => {
    const { requestWithMetadata } = await loadClient();
    const controller = new AbortController();
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ success: true, data: { ok: true } }),
    );

    await requestWithMetadata("/records", {
      signal: controller.signal,
    });

    expect(vi.mocked(fetch).mock.calls[0]?.[1]?.signal).toBe(
      controller.signal,
    );
  });

  it("returns 204 data and canonical metadata without exposing transport state", async () => {
    const { requestWithMetadata } = await loadClient();
    vi.mocked(fetch).mockResolvedValue(
      new Response(null, {
        status: 204,
        headers: {
          "X-Request-Id": "request-empty-id-0001",
          "X-Internal-Transport": "must-not-leak",
        },
      }),
    );

    const result = await requestWithMetadata<void>("/session", {
      method: "DELETE",
    });

    expect(result).toEqual({
      data: undefined,
      requestId: "request-empty-id-0001",
    });
    expect(Object.keys(result).sort()).toEqual(["data", "requestId"]);
  });

  it("returns undefined for a 204 response", async () => {
    const { apiRequest } = await loadClient();
    vi.mocked(fetch).mockResolvedValue(emptyResponse());

    const result = await apiRequest<void>("/session", {
      method: "DELETE",
    });

    expect(result).toBeUndefined();
  });

  it("preserves structured failure status, code, message, request ID, and details", async () => {
    const { ApiError, apiRequest } = await loadClient();
    const details = { fieldErrors: { email: ["Invalid email"] } };
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Request validation failed.",
            requestId: "request-body-id-0001",
            details,
          },
        },
        400,
      ),
    );

    const error = await apiRequest("/records").catch(
      (reason: unknown) => reason,
    );

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 400,
      code: "VALIDATION_ERROR",
      message: "Request validation failed.",
      requestId: "request-body-id-0001",
      details,
    });
  });

  it("falls back to the response request-ID header", async () => {
    const { apiRequest } = await loadClient();
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "The record was not found.",
          },
        },
        404,
        { "X-Request-Id": "request-header-id-0001" },
      ),
    );

    await expect(apiRequest("/missing")).rejects.toMatchObject({
      requestId: "request-header-id-0001",
    });
  });

  it("forwards an AbortSignal", async () => {
    const { apiRequest } = await loadClient();
    const controller = new AbortController();
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ success: true, data: { ok: true } }),
    );

    await apiRequest("/records", { signal: controller.signal });

    expect(vi.mocked(fetch).mock.calls[0]?.[1]?.signal).toBe(
      controller.signal,
    );
  });

  it("keeps an abort rejection distinguishable", async () => {
    const { apiRequest } = await loadClient();
    const abortError = new DOMException(
      "The operation was aborted.",
      "AbortError",
    );
    vi.mocked(fetch).mockRejectedValue(abortError);

    const error = await apiRequest("/records").catch(
      (reason: unknown) => reason,
    );

    expect(error).toBe(abortError);
    expect((error as DOMException).name).toBe("AbortError");
  });

  it("refreshes once and retries the original request once after a 401", async () => {
    const {
      apiRequest,
      configureApiClientAuth,
    } = await loadClient();
    let accessToken = "expired-token";
    const refreshSession = vi.fn(async () => {
      accessToken = "refreshed-token";
    });
    configureApiClientAuth({
      getAccessToken: () => accessToken,
      refreshSession,
      clearAuthentication: vi.fn(),
    });
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        jsonResponse(
          {
            success: false,
            error: {
              code: "AUTHENTICATION_REQUIRED",
              message: "Authentication is required.",
              requestId: "request-auth-id-0001",
            },
          },
          401,
        ),
      )
      .mockResolvedValueOnce(
        jsonResponse({ success: true, data: { ok: true } }),
      );

    const result = await apiRequest<{ ok: boolean }>("/protected");

    expect(result).toEqual({ ok: true });
    expect(refreshSession).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledTimes(2);
    const retryHeaders = new Headers(
      vi.mocked(fetch).mock.calls[1]?.[1]?.headers,
    );
    expect(retryHeaders.get("Authorization")).toBe(
      "Bearer refreshed-token",
    );
  });

  it("does not retry after a second 401", async () => {
    const { apiRequest, configureApiClientAuth } = await loadClient();
    const refreshSession = vi.fn().mockResolvedValue(undefined);
    configureApiClientAuth({
      getAccessToken: () => "memory-token",
      refreshSession,
      clearAuthentication: vi.fn(),
    });
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(
        {
          success: false,
          error: {
            code: "AUTHENTICATION_REQUIRED",
            message: "Authentication is required.",
            requestId: "request-auth-id-0002",
          },
        },
        401,
      ),
    );

    await expect(apiRequest("/protected")).rejects.toMatchObject({
      status: 401,
    });

    expect(refreshSession).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it.each([
    "/auth/login",
    "/auth/register",
    "/auth/refresh",
    "/auth/logout",
  ])("does not recursively refresh %s", async (path) => {
    const { apiRequest, configureApiClientAuth } = await loadClient();
    const refreshSession = vi.fn();
    configureApiClientAuth({
      getAccessToken: () => null,
      refreshSession,
      clearAuthentication: vi.fn(),
    });
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(
        {
          success: false,
          error: {
            code: "AUTHENTICATION_REQUIRED",
            message: "Authentication is required.",
            requestId: "request-auth-id-0003",
          },
        },
        401,
      ),
    );

    await expect(apiRequest(path)).rejects.toMatchObject({
      status: 401,
    });

    expect(refreshSession).not.toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("does not refresh a forbidden response", async () => {
    const { apiRequest, configureApiClientAuth } = await loadClient();
    const refreshSession = vi.fn();
    configureApiClientAuth({
      getAccessToken: () => "memory-token",
      refreshSession,
      clearAuthentication: vi.fn(),
    });
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(
        {
          success: false,
          error: {
            code: "ACCOUNT_UNAVAILABLE",
            message: "This account is not available.",
            requestId: "request-auth-id-0004",
          },
        },
        403,
      ),
    );

    await expect(apiRequest("/protected")).rejects.toMatchObject({
      status: 403,
    });
    expect(refreshSession).not.toHaveBeenCalled();
  });

  it("shares one refresh promise across concurrent 401 responses", async () => {
    const { apiRequest, configureApiClientAuth } = await loadClient();
    let releaseRefresh: (() => void) | undefined;
    const refreshGate = new Promise<void>((resolve) => {
      releaseRefresh = resolve;
    });
    const refreshSession = vi.fn(() => refreshGate);
    configureApiClientAuth({
      getAccessToken: () => "memory-token",
      refreshSession,
      clearAuthentication: vi.fn(),
    });
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        jsonResponse(
          {
            success: false,
            error: {
              code: "AUTHENTICATION_REQUIRED",
              message: "Authentication is required.",
              requestId: "request-concurrent-id-0001",
            },
          },
          401,
        ),
      )
      .mockResolvedValueOnce(
        jsonResponse(
          {
            success: false,
            error: {
              code: "AUTHENTICATION_REQUIRED",
              message: "Authentication is required.",
              requestId: "request-concurrent-id-0002",
            },
          },
          401,
        ),
      )
      .mockResolvedValueOnce(
        jsonResponse({ success: true, data: { id: "first" } }),
      )
      .mockResolvedValueOnce(
        jsonResponse({ success: true, data: { id: "second" } }),
      );

    const first = apiRequest<{ id: string }>("/protected/first");
    const second = apiRequest<{ id: string }>("/protected/second");
    await vi.waitFor(() => {
      expect(refreshSession).toHaveBeenCalledTimes(1);
    });
    releaseRefresh?.();

    await expect(Promise.all([first, second])).resolves.toEqual([
      { id: "first" },
      { id: "second" },
    ]);
    expect(fetch).toHaveBeenCalledTimes(4);
  });

  it("clears authentication once and safely rejects waiting requests when refresh fails", async () => {
    const { apiRequest, configureApiClientAuth } = await loadClient();
    const refreshError = new Error("Refresh unavailable");
    const refreshSession = vi.fn().mockRejectedValue(refreshError);
    const clearAuthentication = vi.fn();
    configureApiClientAuth({
      getAccessToken: () => "expired-token",
      refreshSession,
      clearAuthentication,
    });
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(
        {
          success: false,
          error: {
            code: "AUTHENTICATION_REQUIRED",
            message: "Authentication is required.",
            requestId: "request-refresh-failed-0001",
          },
        },
        401,
      ),
    );

    const results = await Promise.allSettled([
      apiRequest("/protected/first"),
      apiRequest("/protected/second"),
    ]);

    expect(refreshSession).toHaveBeenCalledTimes(1);
    expect(clearAuthentication).toHaveBeenCalledTimes(1);
    expect(results.map((result) => result.status)).toEqual([
      "rejected",
      "rejected",
    ]);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("does not write tokens to browser storage", async () => {
    const { apiRequest, configureApiClientAuth } = await loadClient();
    const localStorageWrite = vi.spyOn(
      Storage.prototype,
      "setItem",
    );
    configureApiClientAuth({
      getAccessToken: () => "memory-only-token",
      refreshSession: vi.fn(),
      clearAuthentication: vi.fn(),
    });
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ success: true, data: { ok: true } }),
    );

    await apiRequest("/protected");

    expect(localStorageWrite).not.toHaveBeenCalled();
  });
});

describe("authApi trust boundary", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const publicUser = {
    id: "user-test-1",
    email: "person@example.test",
    profile: {
      displayName: "Test Person",
      headline: "Synthetic profile",
    },
    roles: ["user"],
    accountStatus: "active",
    createdAt: "2026-07-24T00:00:00.000Z",
    updatedAt: "2026-07-24T00:00:00.000Z",
  };

  it("calls the verified login endpoint and validates its response", async () => {
    vi.resetModules();
    vi.stubEnv("VITE_API_URL", "https://api.example.test/api/v1");
    const { login } = await import("../features/auth/authApi");
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({
        success: true,
        data: {
          user: publicUser,
          accessToken: "access-token",
        },
      }),
    );

    const result = await login({
      email: "person@example.test",
      password: "SyntheticPassword1",
    });

    expect(result.user).toEqual(publicUser);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(vi.mocked(fetch).mock.calls[0]?.[0]).toBe(
      "https://api.example.test/api/v1/auth/login",
    );
    expect(vi.mocked(fetch).mock.calls[0]?.[1]?.method).toBe("POST");
  });

  it("rejects an empty access token", async () => {
    vi.resetModules();
    vi.stubEnv("VITE_API_URL", "https://api.example.test/api/v1");
    const { login } = await import("../features/auth/authApi");
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({
        success: true,
        data: {
          user: publicUser,
          accessToken: " ",
        },
      }),
    );

    await expect(
      login({
        email: "person@example.test",
        password: "SyntheticPassword1",
      }),
    ).rejects.toMatchObject({
      code: "INVALID_API_RESPONSE",
    });
  });

  it("rejects a malformed public user", async () => {
    vi.resetModules();
    vi.stubEnv("VITE_API_URL", "https://api.example.test/api/v1");
    const { refreshSession } = await import(
      "../features/auth/authApi"
    );
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({
        success: true,
        data: {
          user: {
            ...publicUser,
            roles: ["unsupported-role"],
          },
          accessToken: "access-token",
        },
      }),
    );

    await expect(refreshSession()).rejects.toMatchObject({
      code: "INVALID_API_RESPONSE",
    });
  });

  it("validates the current-user response", async () => {
    vi.resetModules();
    vi.stubEnv("VITE_API_URL", "https://api.example.test/api/v1");
    const { getCurrentUser } = await import(
      "../features/auth/authApi"
    );
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({
        success: true,
        data: { user: publicUser },
      }),
    );

    await expect(getCurrentUser()).resolves.toEqual(publicUser);
  });

  it("handles the verified 204 logout response", async () => {
    vi.resetModules();
    vi.stubEnv("VITE_API_URL", "https://api.example.test/api/v1");
    const { logout } = await import("../features/auth/authApi");
    vi.mocked(fetch).mockResolvedValue(emptyResponse());

    await expect(logout()).resolves.toBeUndefined();
    expect(vi.mocked(fetch).mock.calls[0]?.[0]).toBe(
      "https://api.example.test/api/v1/auth/logout",
    );
  });
});
