import type {
  AuthenticationResponse,
  PublicUser,
} from "@career-learning-hub/shared-types";
import { act, render, screen, waitFor } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiRequest } from "../../api/apiClient";
import {
  createResumeRecoveryKey,
  createResumeRecoveryUserPrefix,
} from "../resumes/resumeRecovery";
import * as recoveryWriter from "../resumes/resumeRecoveryWriter";
import {
  AuthProvider,
  useAuth,
} from "./AuthProvider";
import * as authApi from "./authApi";

vi.mock("./authApi", () => ({
  getCurrentUser: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  refreshSession: vi.fn(),
  register: vi.fn(),
}));

const publicUser: PublicUser = {
  id: "user-provider-test",
  email: "provider@example.test",
  profile: {
    displayName: "Provider Test",
    headline: "Synthetic profile",
  },
  roles: ["user"],
  accountStatus: "active",
  createdAt: "2026-07-24T00:00:00.000Z",
  updatedAt: "2026-07-24T00:00:00.000Z",
};

const restoredSession: AuthenticationResponse = {
  user: publicUser,
  accessToken: "restored-memory-token",
};

function deferred<T>() {
  let resolve: ((value: T) => void) | undefined;
  let reject: ((reason?: unknown) => void) | undefined;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return {
    promise,
    resolve(value: T) {
      resolve?.(value);
    },
    reject(reason?: unknown) {
      reject?.(reason);
    },
  };
}

function AuthProbe() {
  const auth = useAuth();

  return (
    <div>
      <p data-testid="status">{auth.status}</p>
      <p data-testid="user">
        {auth.user?.profile.displayName ?? "No user"}
      </p>
      <button
        type="button"
        onClick={() => {
          void auth
            .login({
              email: "provider@example.test",
              password: "SyntheticPassword1",
            })
            .catch(() => undefined);
        }}
      >
        Log in
      </button>
      <button
        type="button"
        onClick={() => {
          void auth
            .register({
              email: "registered@example.test",
              password: "SyntheticPassword1",
              displayName: "Registered Test",
            })
            .catch(() => undefined);
        }}
      >
        Register
      </button>
      <button
        type="button"
        onClick={() => {
          void auth.logout().catch(() => undefined);
        }}
      >
        Log out
      </button>
      <button
        type="button"
        onClick={() => {
          void apiRequest("/protected").catch(() => undefined);
        }}
      >
        Protected request
      </button>
    </div>
  );
}

function renderProvider(strict = false) {
  const content = (
    <AuthProvider>
      <AuthProbe />
    </AuthProvider>
  );

  return render(
    strict ? <StrictMode>{content}</StrictMode> : content,
  );
}

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    const storageKeys = Array.from(
      { length: sessionStorage.length },
      (_, index) => sessionStorage.key(index),
    ).filter((key): key is string => key !== null);
    storageKeys.forEach((key) => sessionStorage.removeItem(key));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts in the bootstrapping state", async () => {
    const refresh = deferred<AuthenticationResponse>();
    vi.mocked(authApi.refreshSession).mockReturnValue(refresh.promise);

    renderProvider();

    expect(screen.getByTestId("status").textContent).toBe(
      "bootstrapping",
    );

    await act(async () => {
      refresh.resolve(restoredSession);
      await refresh.promise;
    });
  });

  it("restores an authenticated session after refresh", async () => {
    vi.mocked(authApi.refreshSession).mockResolvedValue(restoredSession);

    renderProvider();

    await waitFor(() => {
      expect(screen.getByTestId("status").textContent).toBe(
        "authenticated",
      );
    });
    expect(screen.getByTestId("user").textContent).toBe(
      "Provider Test",
    );
  });

  it("treats a missing refresh session as anonymous", async () => {
    vi.mocked(authApi.refreshSession).mockRejectedValue(
      new ApiError(
        401,
        "REFRESH_TOKEN_REQUIRED",
        "A refresh token is required.",
      ),
    );

    renderProvider();

    await waitFor(() => {
      expect(screen.getByTestId("status").textContent).toBe(
        "anonymous",
      );
    });
  });

  it("treats an invalid or expired refresh session as anonymous", async () => {
    vi.mocked(authApi.refreshSession).mockRejectedValue(
      new ApiError(
        401,
        "INVALID_SESSION",
        "The session is invalid or expired.",
      ),
    );

    renderProvider();

    await waitFor(() => {
      expect(screen.getByTestId("status").textContent).toBe(
        "anonymous",
      );
    });
  });

  it("fails safely when refresh returns malformed data", async () => {
    vi.mocked(authApi.refreshSession).mockRejectedValue(
      new ApiError(
        502,
        "INVALID_API_RESPONSE",
        "The server returned an invalid authentication response.",
      ),
    );

    renderProvider();

    await waitFor(() => {
      expect(screen.getByTestId("status").textContent).toBe(
        "anonymous",
      );
    });
    expect(screen.getByTestId("user").textContent).toBe("No user");
  });

  it("updates the user and in-memory token after login", async () => {
    vi.mocked(authApi.refreshSession).mockRejectedValue(
      new ApiError(401, "INVALID_SESSION", "No session."),
    );
    vi.mocked(authApi.login).mockResolvedValue({
      user: publicUser,
      accessToken: "login-memory-token",
    });

    renderProvider();
    await waitFor(() => {
      expect(screen.getByTestId("status").textContent).toBe(
        "anonymous",
      );
    });

    screen.getByRole("button", { name: "Log in" }).click();

    await waitFor(() => {
      expect(screen.getByTestId("status").textContent).toBe(
        "authenticated",
      );
    });
    expect(authApi.login).toHaveBeenCalledWith({
      email: "provider@example.test",
      password: "SyntheticPassword1",
    });
  });

  it("updates the user and in-memory token after registration", async () => {
    vi.mocked(authApi.refreshSession).mockRejectedValue(
      new ApiError(401, "INVALID_SESSION", "No session."),
    );
    vi.mocked(authApi.register).mockResolvedValue({
      user: {
        ...publicUser,
        email: "registered@example.test",
        profile: {
          displayName: "Registered Test",
        },
      },
      accessToken: "registration-memory-token",
    });

    renderProvider();
    await waitFor(() => {
      expect(screen.getByTestId("status").textContent).toBe(
        "anonymous",
      );
    });

    screen.getByRole("button", { name: "Register" }).click();

    await waitFor(() => {
      expect(screen.getByTestId("status").textContent).toBe(
        "authenticated",
      );
    });
    expect(authApi.register).toHaveBeenCalledWith({
      email: "registered@example.test",
      password: "SyntheticPassword1",
      displayName: "Registered Test",
    });
  });

  it("calls logout and clears local authentication state", async () => {
    vi.mocked(authApi.refreshSession).mockResolvedValue(restoredSession);
    vi.mocked(authApi.logout).mockResolvedValue(undefined);
    renderProvider();
    await waitFor(() => {
      expect(screen.getByTestId("status").textContent).toBe(
        "authenticated",
      );
    });

    screen.getByRole("button", { name: "Log out" }).click();

    await waitFor(() => {
      expect(screen.getByTestId("status").textContent).toBe(
        "anonymous",
      );
    });
    expect(authApi.logout).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("user").textContent).toBe("No user");
  });

  it("cleans every outgoing-user Resume recovery before explicit logout", async () => {
    const logout = deferred<void>();
    vi.mocked(authApi.refreshSession).mockResolvedValue(restoredSession);
    vi.mocked(authApi.logout).mockReturnValue(logout.promise);
    const invalidate = vi.spyOn(
      recoveryWriter,
      "invalidateResumeRecoveryWritersForUser",
    );
    renderProvider();
    await waitFor(() => {
      expect(screen.getByTestId("status").textContent).toBe(
        "authenticated",
      );
    });
    const firstKey = createResumeRecoveryKey(
      publicUser.id,
      "507f1f77bcf86cd799439011",
    );
    const secondKey = createResumeRecoveryKey(
      publicUser.id,
      "507f1f77bcf86cd799439012",
    );
    const otherKey = createResumeRecoveryKey(
      "another-user",
      "507f1f77bcf86cd799439011",
    );
    sessionStorage.setItem(firstKey, "first");
    sessionStorage.setItem(secondKey, "second");
    sessionStorage.setItem(otherKey, "other");
    sessionStorage.setItem("unrelated", "preserved");

    screen.getByRole("button", { name: "Log out" }).click();

    expect(invalidate).toHaveBeenCalledWith(publicUser.id);
    expect(sessionStorage.getItem(firstKey)).toBeNull();
    expect(sessionStorage.getItem(secondKey)).toBeNull();
    expect(sessionStorage.getItem(otherKey)).toBe("other");
    expect(sessionStorage.getItem("unrelated")).toBe("preserved");
    await act(async () => {
      logout.resolve(undefined);
      await logout.promise;
    });
    await waitFor(() => {
      expect(screen.getByTestId("status").textContent).toBe("anonymous");
    });
  });

  it("prevents an outgoing-user writer from recreating recovery while logout is pending", async () => {
    const logout = deferred<void>();
    vi.mocked(authApi.refreshSession).mockResolvedValue(restoredSession);
    vi.mocked(authApi.logout).mockReturnValue(logout.promise);
    renderProvider();
    await waitFor(() => {
      expect(screen.getByTestId("status").textContent).toBe(
        "authenticated",
      );
    });

    vi.useFakeTimers();
    const activeResumeId = "507f1f77bcf86cd799439011";
    const outgoingKey = createResumeRecoveryKey(publicUser.id, activeResumeId);
    const otherUserKey = createResumeRecoveryKey(
      "another-user",
      activeResumeId,
    );
    const writer = recoveryWriter.createResumeRecoveryWriter({
      storage: sessionStorage,
      userId: publicUser.id,
      resumeId: activeResumeId,
      onWriteResult: vi.fn(),
    });
    sessionStorage.setItem(outgoingKey, "existing outgoing recovery");
    sessionStorage.setItem(otherUserKey, "other-user recovery");
    sessionStorage.setItem("unrelated", "preserved");

    screen.getByRole("button", { name: "Log out" }).click();
    expect(sessionStorage.getItem(outgoingKey)).toBeNull();

    writer.schedule({
      fingerprint: "late outgoing draft",
      payload: {
        schemaVersion: 1,
        userId: publicUser.id,
        resumeId: activeResumeId,
        baselineVersionId: "507f1f77bcf86cd799439012",
        baselineVersionNumber: 1,
        content: {
          basics: { fullName: "Late Outgoing Candidate", links: [] },
          experience: [],
          education: [],
          skills: [],
          projects: [],
          certifications: [],
          languages: [],
          interests: [],
        },
      },
    });
    act(() => vi.advanceTimersByTime(500));

    expect(sessionStorage.getItem(outgoingKey)).toBeNull();
    expect(sessionStorage.getItem(otherUserKey)).toBe("other-user recovery");
    expect(sessionStorage.getItem("unrelated")).toBe("preserved");
    expect(screen.getByTestId("status").textContent).toBe("authenticated");

    await act(async () => {
      logout.resolve(undefined);
      await logout.promise;
    });
    expect(screen.getByTestId("status").textContent).toBe("anonymous");
    writer.dispose();
  });

  it("continues logout when outgoing recovery removal fails", async () => {
    vi.mocked(authApi.refreshSession).mockResolvedValue(restoredSession);
    vi.mocked(authApi.logout).mockResolvedValue(undefined);
    renderProvider();
    await waitFor(() => {
      expect(screen.getByTestId("status").textContent).toBe(
        "authenticated",
      );
    });
    const prefix = createResumeRecoveryUserPrefix(publicUser.id);
    sessionStorage.setItem(`${prefix}507f1f77bcf86cd799439011`, "recovery");
    const nativeRemove = Storage.prototype.removeItem;
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(function (
      this: Storage,
      key: string,
    ) {
      if (key.startsWith(prefix)) {
        throw new DOMException("Denied", "SecurityError");
      }
      nativeRemove.call(this, key);
    });

    screen.getByRole("button", { name: "Log out" }).click();

    await waitFor(() => {
      expect(screen.getByTestId("status").textContent).toBe("anonymous");
    });
    expect(authApi.logout).toHaveBeenCalledTimes(1);
  });

  it("cleans User A before applying a genuine User B authentication", async () => {
    const userB: PublicUser = {
      ...publicUser,
      id: "user-provider-b",
      email: "provider-b@example.test",
      profile: { ...publicUser.profile, displayName: "Provider B" },
    };
    vi.mocked(authApi.refreshSession).mockResolvedValue(restoredSession);
    vi.mocked(authApi.login).mockResolvedValue({
      user: userB,
      accessToken: "user-b-token",
    });
    const invalidate = vi.spyOn(
      recoveryWriter,
      "invalidateResumeRecoveryWritersForUser",
    );
    renderProvider();
    await waitFor(() => {
      expect(screen.getByTestId("status").textContent).toBe(
        "authenticated",
      );
    });
    const outgoingKey = createResumeRecoveryKey(
      publicUser.id,
      "507f1f77bcf86cd799439011",
    );
    const incomingKey = createResumeRecoveryKey(
      userB.id,
      "507f1f77bcf86cd799439011",
    );
    sessionStorage.setItem(outgoingKey, "outgoing");
    sessionStorage.setItem(incomingKey, "incoming");

    screen.getByRole("button", { name: "Log in" }).click();

    await waitFor(() => {
      expect(screen.getByTestId("user").textContent).toBe("Provider B");
    });
    expect(invalidate).toHaveBeenCalledWith(publicUser.id);
    expect(sessionStorage.getItem(outgoingKey)).toBeNull();
    expect(sessionStorage.getItem(incomingKey)).toBe("incoming");
  });

  it("does not clean recovery for the same authenticated user", async () => {
    vi.mocked(authApi.refreshSession).mockResolvedValue(restoredSession);
    vi.mocked(authApi.login).mockResolvedValue({
      user: publicUser,
      accessToken: "same-user-token",
    });
    const invalidate = vi.spyOn(
      recoveryWriter,
      "invalidateResumeRecoveryWritersForUser",
    );
    renderProvider(true);
    await waitFor(() => {
      expect(screen.getByTestId("status").textContent).toBe(
        "authenticated",
      );
    });
    const key = createResumeRecoveryKey(
      publicUser.id,
      "507f1f77bcf86cd799439011",
    );
    sessionStorage.setItem(key, "retained");

    screen.getByRole("button", { name: "Log in" }).click();

    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalledTimes(1);
    });
    expect(invalidate).not.toHaveBeenCalled();
    expect(sessionStorage.getItem(key)).toBe("retained");
  });

  it("clears local authentication state when logout fails", async () => {
    vi.mocked(authApi.refreshSession).mockResolvedValue(restoredSession);
    vi.mocked(authApi.logout).mockRejectedValue(
      new Error("Synthetic network failure"),
    );
    renderProvider();
    await waitFor(() => {
      expect(screen.getByTestId("status").textContent).toBe(
        "authenticated",
      );
    });

    screen.getByRole("button", { name: "Log out" }).click();

    await waitFor(() => {
      expect(screen.getByTestId("status").textContent).toBe(
        "anonymous",
      );
    });
  });

  it("clears authenticated state when a coordinated refresh fails", async () => {
    vi.mocked(authApi.refreshSession)
      .mockResolvedValueOnce(restoredSession)
      .mockRejectedValueOnce(
        new ApiError(401, "INVALID_SESSION", "No session."),
      );
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            success: false,
            error: {
              code: "AUTHENTICATION_REQUIRED",
              message: "Authentication is required.",
              requestId: "provider-request-id-0001",
            },
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          },
        ),
      ),
    );
    renderProvider();
    await waitFor(() => {
      expect(screen.getByTestId("status").textContent).toBe(
        "authenticated",
      );
    });

    screen
      .getByRole("button", { name: "Protected request" })
      .click();

    await waitFor(() => {
      expect(screen.getByTestId("status").textContent).toBe(
        "anonymous",
      );
    });
  });

  it("keeps authentication tokens out of Web Storage and IndexedDB", async () => {
    const storageWrite = vi.spyOn(Storage.prototype, "setItem");
    const indexedDbOpen = vi.fn();
    vi.stubGlobal("indexedDB", { open: indexedDbOpen });
    vi.mocked(authApi.refreshSession).mockResolvedValue(restoredSession);

    renderProvider();

    await waitFor(() => {
      expect(screen.getByTestId("status").textContent).toBe(
        "authenticated",
      );
    });
    expect(storageWrite).not.toHaveBeenCalled();
    expect(indexedDbOpen).not.toHaveBeenCalled();
  });

  it("deduplicates the bootstrap refresh under StrictMode", async () => {
    const refresh = deferred<AuthenticationResponse>();
    vi.mocked(authApi.refreshSession).mockReturnValue(refresh.promise);

    renderProvider(true);

    await waitFor(() => {
      expect(authApi.refreshSession).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      refresh.resolve(restoredSession);
      await refresh.promise;
    });

    await waitFor(() => {
      expect(screen.getByTestId("status").textContent).toBe(
        "authenticated",
      );
    });
  });

  it("exposes the latest token to shared-client callbacks", async () => {
    vi.mocked(authApi.refreshSession).mockResolvedValue(restoredSession);
    vi.mocked(authApi.login).mockResolvedValue({
      user: publicUser,
      accessToken: "latest-login-token",
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async () =>
        new Response(
          JSON.stringify({
            success: true,
            data: { ok: true },
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      ),
    );
    renderProvider();
    await waitFor(() => {
      expect(screen.getByTestId("status").textContent).toBe(
        "authenticated",
      );
    });

    screen.getByRole("button", { name: "Log in" }).click();
    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalledTimes(1);
    });
    screen
      .getByRole("button", { name: "Protected request" })
      .click();

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });
    const headers = new Headers(
      vi.mocked(fetch).mock.calls[0]?.[1]?.headers,
    );
    expect(headers.get("Authorization")).toBe(
      "Bearer latest-login-token",
    );
  });
});
