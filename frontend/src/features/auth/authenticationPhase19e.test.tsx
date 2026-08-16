import type {
  AuthenticationResponse,
  PublicUser,
} from "@career-learning-hub/shared-types";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  createMemoryRouter,
  RouterProvider,
  type InitialEntry,
} from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiRequest } from "../../api/apiClient";
import { AuthProvider, useAuth } from "./AuthProvider";
import { AuthRoute } from "./AuthRoute";
import { LoginPage } from "./LoginPage";
import * as authApi from "./authApi";

vi.mock("./authApi", () => ({
  getCurrentUser: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  refreshSession: vi.fn(),
  register: vi.fn(),
}));

const publicUser: PublicUser = {
  id: "phase19e-user",
  email: "phase19e@example.test",
  profile: {
    displayName: "Phase 19E User",
    headline: "Synthetic profile",
  },
  roles: ["user"],
  accountStatus: "active",
  createdAt: "2026-08-16T00:00:00.000Z",
  updatedAt: "2026-08-16T00:00:00.000Z",
};

const authenticatedSession: AuthenticationResponse = {
  user: publicUser,
  accessToken: "phase19e-memory-token",
};

function noSessionError() {
  return new ApiError(
    401,
    "REFRESH_TOKEN_REQUIRED",
    "A refresh token is required.",
  );
}

function ProtectedSettingsProbe() {
  const { logout } = useAuth();

  return (
    <main>
      <h1>Protected settings</h1>
      <button
        type="button"
        onClick={() => {
          void apiRequest("/protected").catch(() => undefined);
        }}
      >
        Trigger protected request
      </button>
      <button
        type="button"
        onClick={() => {
          void logout().catch(() => undefined);
        }}
      >
        Log out
      </button>
    </main>
  );
}

function AnonymousReasonProbe() {
  const auth = useAuth();
  return (
    <p data-testid="anonymous-reason">
      {auth.anonymousReason ?? "none"}
    </p>
  );
}

function renderProviderProbe() {
  return render(
    <AuthProvider>
      <AnonymousReasonProbe />
    </AuthProvider>,
  );
}

function renderAuthRoute(initialEntry: InitialEntry) {
  const router = createMemoryRouter(
    [
      {
        element: <AuthRoute mode="public-only" />,
        children: [{ path: "/login", element: <LoginPage /> }],
      },
      {
        element: <AuthRoute mode="protected" />,
        children: [
          { path: "/settings", element: <ProtectedSettingsProbe /> },
        ],
      },
      {
        path: "/dashboard",
        element: <h1>Dashboard target</h1>,
      },
    ],
    { initialEntries: [initialEntry] },
  );

  render(
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>,
  );

  return router;
}

async function fillLoginForm() {
  const user = userEvent.setup();
  await user.type(
    screen.getByRole("textbox", { name: "Email address" }),
    "phase19e@example.test",
  );
  await user.type(screen.getByLabelText("Password"), "SyntheticPassword1");
  return user;
}

describe("Phase 19E runtime session expiry contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("does not label ordinary anonymous bootstrap as session-expired", async () => {
    vi.mocked(authApi.refreshSession).mockRejectedValue(noSessionError());

    renderProviderProbe();

    await waitFor(() => {
      expect(screen.getByTestId("anonymous-reason").textContent).toBe("none");
    });
  });

  it("shows an expiry notice and restores the safe intended page after runtime session loss", async () => {
    vi.mocked(authApi.refreshSession)
      .mockResolvedValueOnce(authenticatedSession)
      .mockRejectedValueOnce(
        new ApiError(
          401,
          "INVALID_SESSION",
          "The session is invalid or expired.",
        ),
      );
    vi.mocked(authApi.login).mockResolvedValue(authenticatedSession);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            success: false,
            error: {
              code: "AUTHENTICATION_REQUIRED",
              message: "Authentication is required.",
              requestId: "phase19e-request-id-0001",
            },
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          },
        ),
      ),
    );
    const router = renderAuthRoute("/settings");
    const user = userEvent.setup();

    await screen.findByRole("heading", { name: "Protected settings" });
    await user.click(
      screen.getByRole("button", { name: "Trigger protected request" }),
    );

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/login");
    });
    expect(
      screen.getByText("Your session expired. Sign in again to continue."),
    ).not.toBeNull();

    const loginUser = await fillLoginForm();
    await loginUser.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/settings");
    });
  });

  it("does not show the session-expired notice for an ordinary anonymous login", async () => {
    vi.mocked(authApi.refreshSession).mockRejectedValue(noSessionError());

    renderAuthRoute("/login");

    await screen.findByRole("heading", { name: "Welcome back" });
    expect(
      screen.queryByText("Your session expired. Sign in again to continue."),
    ).toBeNull();
  });

  it("does not show the session-expired notice after explicit logout", async () => {
    vi.mocked(authApi.refreshSession).mockResolvedValue(authenticatedSession);
    vi.mocked(authApi.logout).mockResolvedValue(undefined);
    const router = renderAuthRoute("/settings");
    const user = userEvent.setup();

    await screen.findByRole("heading", { name: "Protected settings" });
    await user.click(screen.getByRole("button", { name: "Log out" }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/login");
    });
    expect(
      screen.queryByText("Your session expired. Sign in again to continue."),
    ).toBeNull();
  });

  it("keeps the existing safe-redirect boundary for expiry-labelled login state", async () => {
    vi.mocked(authApi.refreshSession).mockRejectedValue(noSessionError());
    vi.mocked(authApi.login).mockResolvedValue(authenticatedSession);
    const router = renderAuthRoute({
      pathname: "/login",
      state: {
        from: "https://attacker.example/collect",
        authReason: "session-expired",
      },
    });

    await screen.findByRole("heading", { name: "Welcome back" });
    const user = await fillLoginForm();
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/dashboard");
    });
  });
});
