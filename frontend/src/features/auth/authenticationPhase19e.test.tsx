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
import { RegisterPage } from "./RegisterPage";
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
        children: [
          { path: "/login", element: <LoginPage /> },
          { path: "/register", element: <RegisterPage /> },
        ],
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

async function fillRegistrationForm() {
  const user = userEvent.setup();
  await user.type(
    screen.getByRole("textbox", { name: "Display name" }),
    "Phase 19E User",
  );
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

describe("Phase 19E authentication form contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("toggles Login password visibility without changing the value and preserves backend limits", async () => {
    vi.mocked(authApi.refreshSession).mockRejectedValue(noSessionError());
    renderAuthRoute("/login");
    await screen.findByRole("heading", { name: "Welcome back" });
    const user = userEvent.setup();
    const email = screen.getByRole("textbox", { name: "Email address" });
    const password = screen.getByLabelText("Password") as HTMLInputElement;

    expect((email as HTMLInputElement).maxLength).toBe(320);
    expect(password.maxLength).toBe(128);
    expect(password.type).toBe("password");
    await user.type(password, "SyntheticPassword1");

    const show = screen.getByRole("button", { name: "Show password" });
    expect(show.getAttribute("aria-pressed")).toBe("false");
    await user.click(show);

    expect(password.type).toBe("text");
    expect(password.value).toBe("SyntheticPassword1");
    const hide = screen.getByRole("button", { name: "Hide password" });
    expect(hide.getAttribute("aria-pressed")).toBe("true");
    await user.click(hide);
    expect(password.type).toBe("password");
    expect(password.value).toBe("SyntheticPassword1");
  });

  it("toggles Registration password visibility while preserving requirements and value", async () => {
    vi.mocked(authApi.refreshSession).mockRejectedValue(noSessionError());
    renderAuthRoute("/register");
    await screen.findByRole("heading", { name: "Create your account" });
    const user = userEvent.setup();
    const password = screen.getByLabelText("Password") as HTMLInputElement;

    expect(password.type).toBe("password");
    expect(password.maxLength).toBe(128);
    expect(password.autocomplete).toBe("new-password");
    expect(password.getAttribute("aria-describedby")).toContain("requirements");
    await user.type(password, "SyntheticPassword1");
    await user.click(screen.getByRole("button", { name: "Show password" }));

    expect(password.type).toBe("text");
    expect(password.value).toBe("SyntheticPassword1");
    expect(
      screen.getByText(
        "Use 12–128 characters with uppercase, lowercase, and a number.",
      ),
    ).not.toBeNull();
  });

  it("revalidates only existing Login field errors after submit", async () => {
    vi.mocked(authApi.refreshSession).mockRejectedValue(noSessionError());
    renderAuthRoute("/login");
    await screen.findByRole("heading", { name: "Welcome back" });
    const user = userEvent.setup();

    expect(screen.queryByText("Enter a valid email address.")).toBeNull();
    expect(screen.queryByText("Enter your password.")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(screen.getByText("Enter a valid email address.")).not.toBeNull();
    expect(screen.getByText("Enter your password.")).not.toBeNull();

    await user.type(
      screen.getByRole("textbox", { name: "Email address" }),
      "phase19e@example.test",
    );
    expect(screen.queryByText("Enter a valid email address.")).toBeNull();
    expect(screen.getByText("Enter your password.")).not.toBeNull();

    await user.type(screen.getByLabelText("Password"), "SyntheticPassword1");
    expect(screen.queryByText("Enter your password.")).toBeNull();
  });

  it("revalidates only existing Registration field errors after submit", async () => {
    vi.mocked(authApi.refreshSession).mockRejectedValue(noSessionError());
    renderAuthRoute("/register");
    await screen.findByRole("heading", { name: "Create your account" });
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Create account" }));
    expect(
      screen.getByText("Enter a display name between 2 and 100 characters."),
    ).not.toBeNull();
    expect(screen.getByText("Enter a valid email address.")).not.toBeNull();
    expect(
      screen.getByText("Password does not meet the requirements above."),
    ).not.toBeNull();

    await user.type(
      screen.getByRole("textbox", { name: "Display name" }),
      "Phase 19E User",
    );
    expect(
      screen.queryByText("Enter a display name between 2 and 100 characters."),
    ).toBeNull();
    expect(screen.getByText("Enter a valid email address.")).not.toBeNull();
    expect(
      screen.getByText("Password does not meet the requirements above."),
    ).not.toBeNull();
  });

  it("focuses Login API errors, keeps Request ID collapsed, and clears stale errors on edit", async () => {
    vi.mocked(authApi.refreshSession).mockRejectedValue(noSessionError());
    vi.mocked(authApi.login).mockRejectedValue(
      new ApiError(
        401,
        "INVALID_CREDENTIALS",
        "Email or password is incorrect.",
        "login-request-id-0001",
      ),
    );
    renderAuthRoute("/login");
    await screen.findByRole("heading", { name: "Welcome back" });
    const user = await fillLoginForm();
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    const alert = await screen.findByRole("alert");
    expect(document.activeElement).toBe(alert);
    const summary = screen.getByText("Technical details");
    const details = summary.closest("details") as HTMLDetailsElement;
    expect(details.open).toBe(false);
    expect(screen.getByText("Request ID: login-request-id-0001")).not.toBeNull();
    expect(document.body.textContent).not.toContain("SyntheticPassword1");

    await user.click(summary);
    expect(details.open).toBe(true);
    await user.type(
      screen.getByRole("textbox", { name: "Email address" }),
      "x",
    );
    expect(screen.queryByText("Email or password is incorrect.")).toBeNull();
    expect(screen.queryByText("Technical details")).toBeNull();
  });

  it("focuses Registration API errors and clears its stale error when form data changes", async () => {
    vi.mocked(authApi.refreshSession).mockRejectedValue(noSessionError());
    vi.mocked(authApi.register).mockRejectedValue(
      new ApiError(
        400,
        "REGISTRATION_FAILED",
        "Registration could not be completed. Check the details or sign in if you already have an account.",
        "register-request-id-0001",
      ),
    );
    renderAuthRoute("/register");
    await screen.findByRole("heading", { name: "Create your account" });
    const user = await fillRegistrationForm();
    await user.click(screen.getByRole("button", { name: "Create account" }));

    const alert = await screen.findByRole("alert");
    expect(document.activeElement).toBe(alert);
    const summary = screen.getByText("Technical details");
    const details = summary.closest("details") as HTMLDetailsElement;
    expect(details.open).toBe(false);
    expect(
      screen.getByText("Request ID: register-request-id-0001"),
    ).not.toBeNull();

    await user.type(
      screen.getByRole("textbox", { name: "Display name" }),
      " Updated",
    );
    expect(
      screen.queryByText(
        "Registration could not be completed. Check the details or sign in if you already have an account.",
      ),
    ).toBeNull();
  });

  it("disables password visibility controls while Login and Registration are busy", async () => {
    const pendingLogin = deferred<AuthenticationResponse>();
    vi.mocked(authApi.refreshSession).mockRejectedValue(noSessionError());
    vi.mocked(authApi.login).mockReturnValue(pendingLogin.promise);
    renderAuthRoute("/login");
    await screen.findByRole("heading", { name: "Welcome back" });
    const loginUser = await fillLoginForm();
    await loginUser.click(screen.getByRole("button", { name: "Sign in" }));

    expect(screen.getByRole("button", { name: "Show password" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Signing in…" })).toBeDisabled();
  });

  it("keeps deferred authentication features out of the refined forms", async () => {
    vi.mocked(authApi.refreshSession).mockRejectedValue(noSessionError());
    renderAuthRoute("/login");
    await screen.findByRole("heading", { name: "Welcome back" });

    expect(screen.queryByRole("link", { name: /forgot|reset password/i })).toBeNull();
    expect(screen.queryByRole("checkbox", { name: /remember/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /continue with google|oauth/i })).toBeNull();
    expect(screen.queryByText(/multi-factor|verification code|passkey/i)).toBeNull();
  });
});
