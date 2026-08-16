import type {
  AuthenticationResponse,
  PublicUser,
} from "@career-learning-hub/shared-types";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppShell } from "../../AppShell";
import { AuthProvider } from "./AuthProvider";
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
  id: "phase19e-logout-user",
  email: "logout@example.test",
  profile: { displayName: "Logout Test User" },
  roles: ["user"],
  accountStatus: "active",
  createdAt: "2026-08-16T00:00:00.000Z",
  updatedAt: "2026-08-16T00:00:00.000Z",
};

const authenticatedSession: AuthenticationResponse = {
  user: publicUser,
  accessToken: "phase19e-logout-token",
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

function renderShell() {
  const router = createMemoryRouter(
    [
      {
        element: <AuthRoute mode="public-only" />,
        children: [{ path: "/login", element: <LoginPage /> }],
      },
      {
        element: <AuthRoute mode="protected" />,
        children: [
          {
            element: <AppShell />,
            children: [
              {
                path: "/shell",
                element: <h1>Authenticated shell content</h1>,
              },
            ],
          },
        ],
      },
    ],
    { initialEntries: ["/shell"] },
  );

  render(
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>,
  );

  return router;
}

describe("Phase 19E logout interaction contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows one duplicate-safe desktop logout busy state", async () => {
    const pendingLogout = deferred<void>();
    vi.mocked(authApi.refreshSession).mockResolvedValue(authenticatedSession);
    vi.mocked(authApi.logout).mockReturnValue(pendingLogout.promise);
    const router = renderShell();
    const user = userEvent.setup();

    await screen.findByRole("heading", { name: "Authenticated shell content" });
    const logout = screen.getByRole("button", { name: "Log out" });
    await user.click(logout);

    const busyLogout = screen.getByRole("button", { name: "Logging out…" });
    expect(busyLogout).toBeDisabled();
    expect(authApi.logout).toHaveBeenCalledTimes(1);
    await user.click(busyLogout);
    expect(authApi.logout).toHaveBeenCalledTimes(1);

    pendingLogout.resolve(undefined);
    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/login");
    });
    expect(
      screen.queryByText("Your session expired. Sign in again to continue."),
    ).toBeNull();
  });

  it("still reaches ordinary Login when the server logout request fails", async () => {
    vi.mocked(authApi.refreshSession).mockResolvedValue(authenticatedSession);
    vi.mocked(authApi.logout).mockRejectedValue(
      new Error("Synthetic logout network failure"),
    );
    const router = renderShell();
    const user = userEvent.setup();

    await screen.findByRole("heading", { name: "Authenticated shell content" });
    await user.click(screen.getByRole("button", { name: "Log out" }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/login");
    });
    expect(
      screen.queryByText("Your session expired. Sign in again to continue."),
    ).toBeNull();
  });

  it("shares the logout busy state with the mobile navigation action", async () => {
    const pendingLogout = deferred<void>();
    vi.mocked(authApi.refreshSession).mockResolvedValue(authenticatedSession);
    vi.mocked(authApi.logout).mockReturnValue(pendingLogout.promise);
    const router = renderShell();
    const user = userEvent.setup();

    await screen.findByRole("heading", { name: "Authenticated shell content" });
    await user.click(
      screen.getByRole("button", { name: "Toggle navigation" }),
    );
    const drawer = screen.getByRole("dialog", { name: "Navigation" });
    const mobileLogout = within(drawer).getByRole("button", {
      name: "Log out",
    });
    await user.click(mobileLogout);

    expect(screen.queryByRole("dialog", { name: "Navigation" })).toBeNull();
    const desktopBusy = screen.getByRole("button", { name: "Logging out…" });
    expect(desktopBusy).toBeDisabled();
    expect(authApi.logout).toHaveBeenCalledTimes(1);

    pendingLogout.resolve(undefined);
    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/login");
    });
  });
});
