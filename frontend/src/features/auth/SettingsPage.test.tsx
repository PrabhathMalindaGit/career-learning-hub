import type { PublicUser } from "@career-learning-hub/shared-types";
import {
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { useAuth } from "./AuthProvider";
import { SettingsPage } from "./SettingsPage";

vi.mock("./AuthProvider", () => ({
  useAuth: vi.fn(),
}));

const user: PublicUser = {
  id: "settings-user",
  email: "settings@example.test",
  profile: {
    displayName: "Settings Test",
    headline: "Synthetic account",
  },
  roles: ["user"],
  accountStatus: "active",
  createdAt: "2026-07-30T00:00:00.000Z",
  updatedAt: "2026-07-30T00:00:00.000Z",
};

const login = vi.fn();
const register = vi.fn();
const logout = vi.fn();

describe("SettingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    logout.mockResolvedValue(undefined);
    vi.mocked(useAuth).mockReturnValue({
      status: "authenticated",
      user,
      login,
      register,
      logout,
    });
  });

  it("renders the approved page and account-information hierarchy", () => {
    render(<SettingsPage />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Settings",
      }),
    ).not.toBeNull();

    const accountInformation = screen.getByRole("region", {
      name: "Account information",
    });
    expect(
      within(accountInformation).getByText("Settings Test"),
    ).not.toBeNull();
    expect(
      within(accountInformation).getByText(
        "settings@example.test",
      ),
    ).not.toBeNull();
    expect(
      within(accountInformation).getByText(
        "Synthetic account",
      ),
    ).not.toBeNull();
    expect(
      within(accountInformation).getByText("active"),
    ).not.toBeNull();

    expect(
      screen.getByRole("region", {
        name: "Current session",
      }),
    ).not.toBeNull();
  });

  it("keeps sign-out as the only account action and invokes logout", async () => {
    render(<SettingsPage />);
    const session = screen.getByRole("region", {
      name: "Current session",
    });
    const signOut = within(session).getByRole("button", {
      name: "Sign out of this session",
    });

    expect(within(session).getAllByRole("button")).toHaveLength(1);
    await userEvent.click(signOut);

    await waitFor(() => {
      expect(logout).toHaveBeenCalledTimes(1);
    });
  });

  it("does not suggest unsupported editable account controls", () => {
    render(<SettingsPage />);

    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.queryByRole("checkbox")).toBeNull();
    expect(screen.queryByRole("switch")).toBeNull();
    expect(
      screen.queryByRole("button", {
        name: /password|profile|avatar|theme|notification|delete/i,
      }),
    ).toBeNull();
  });
});
