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
import * as apiClient from "../../api/apiClient";
import { SettingsPage } from "./SettingsPage";

vi.mock("./AuthProvider", () => ({
  useAuth: vi.fn(),
}));

vi.mock("./AiUsageDiagnosticsSettings", () => ({
  AiUsageDiagnosticsSettingsSection: () => (
    <section aria-label="AI usage & diagnostics" />
  ),
}));

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

const disconnectedProviders = {
  activeProvider: "disabled",
  preferenceRevision: 0,
  foundationEnabled: true,
  geminiModel: "gemini-3.6-flash",
  administratorManagedAvailable: true,
  providers: [{
    id: "gemini-direct",
    available: true,
    configured: false,
  }],
};

const disconnectedRouting = {
  foundationEnabled: true,
  activeProvider: "disabled",
  credentialSource: "none",
  preferenceRevision: 0,
  routingProfile: null,
};

function mockSettingsRead(
  providers: unknown = disconnectedProviders,
  routing: unknown = disconnectedRouting,
) {
  vi.mocked(apiClient.requestWithMetadata)
    .mockResolvedValueOnce({ data: providers })
    .mockResolvedValueOnce({ data: routing });
}

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
    mockSettingsRead();
  });

  it("renders the approved page, AI diagnostics, and account-information hierarchy", () => {
    render(<SettingsPage />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Settings",
      }),
    ).not.toBeNull();
    expect(
      screen.getByRole("region", {
        name: "AI usage & diagnostics",
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

  it("renders the bounded disconnected Gemini connection state", async () => {
    render(<SettingsPage />);

    const gemini = await screen.findByRole("region", {
      name: "Gemini connection",
    });
    expect(within(gemini).getByText("Gemini is disconnected")).not.toBeNull();
    expect(within(gemini).getByText("gemini-3.6-flash")).not.toBeNull();
    expect(within(gemini).getByRole("button", {
      name: "Use application-managed Gemini",
    })).not.toBeNull();
    expect(within(gemini).getByRole("button", {
      name: "Connect a personal key",
    })).not.toBeNull();
    expect(within(gemini).queryByRole("combobox")).toBeNull();
  });

  it("clears a rejected candidate key and never places it in a URL or browser storage", async () => {
    const candidate = "AIzaSettingsRejectedCandidate-123456789";
    const localSetItem = vi.fn();
    const sessionSetItem = vi.fn();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: { getItem: vi.fn(() => null), setItem: localSetItem },
    });
    Object.defineProperty(window, "sessionStorage", {
      configurable: true,
      value: { getItem: vi.fn(() => null), setItem: sessionSetItem },
    });
    vi.mocked(apiClient.requestWithStatusMetadata).mockRejectedValue(
      new apiClient.ApiError(
        409,
        "invalid_credentials",
        "The provider credential is invalid.",
        "request-settings-invalid-0001",
      ),
    );
    render(<SettingsPage />);
    const gemini = await screen.findByRole("region", {
      name: "Gemini connection",
    });
    await userEvent.click(within(gemini).getByRole("button", {
      name: "Connect a personal key",
    }));
    const input = within(gemini).getByLabelText("Personal Gemini API key");
    expect(input).toHaveProperty("type", "password");
    await userEvent.type(input, candidate);
    await userEvent.click(within(gemini).getByRole("button", {
      name: "Save and test",
    }));

    expect((await within(gemini).findByRole("alert")).textContent).toContain(
      "The provider credential is invalid.",
    );
    expect((input as HTMLInputElement).value).toBe("");
    const [path, options] = vi.mocked(
      apiClient.requestWithStatusMetadata,
    ).mock.calls[0] ?? [];
    expect(path).toBe("/ai/providers/gemini-direct/credential");
    expect(path).not.toContain(candidate);
    expect(options?.body).toEqual({ apiKey: candidate });
    expect(localSetItem).not.toHaveBeenCalled();
    expect(sessionSetItem).not.toHaveBeenCalled();
  });

  it("renders application-managed controls without credential metadata", async () => {
    vi.mocked(apiClient.requestWithMetadata).mockReset();
    mockSettingsRead(
      { ...disconnectedProviders, activeProvider: "gemini-direct", preferenceRevision: 2 },
      {
        ...disconnectedRouting,
        activeProvider: "gemini-direct",
        credentialSource: "administrator-managed",
        administratorCredentialPolicyVersion: 3,
        preferenceRevision: 2,
      },
    );
    render(<SettingsPage />);

    const gemini = await screen.findByRole("region", {
      name: "Gemini connection",
    });
    expect(within(gemini).getAllByText("Connected")).toHaveLength(2);
    expect(within(gemini).getByText("Managed by Career Learning Hub")).not.toBeNull();
    expect(within(gemini).getByRole("button", { name: "Test connection" })).not.toBeNull();
    expect(within(gemini).getByRole("button", { name: "Connect personal key" })).not.toBeNull();
    expect(within(gemini).getByRole("button", { name: "Disconnect" })).not.toBeNull();
    expect(within(gemini).queryByText(/masked/i)).toBeNull();
  });

  it("uses the existing confirmation dialog before deleting a personal key", async () => {
    vi.mocked(apiClient.requestWithMetadata).mockReset();
    mockSettingsRead(
      {
        ...disconnectedProviders,
        activeProvider: "gemini-direct",
        preferenceRevision: 1,
        providers: [{
          id: "gemini-direct",
          available: true,
          configured: true,
          credential: {
            id: "507f1f77bcf86cd799439011",
            provider: "gemini-direct",
            label: "Gemini Direct",
            maskedSuffix: "••••6789",
            secretVersion: 1,
            state: "valid",
            connectionStatus: "valid",
            lastValidatedAt: "2026-08-06T08:00:00.000Z",
            revision: 1,
            createdAt: "2026-08-06T08:00:00.000Z",
            updatedAt: "2026-08-06T08:00:00.000Z",
          },
        }],
      },
      {
        ...disconnectedRouting,
        activeProvider: "gemini-direct",
        credentialSource: "user-managed",
        activeCredentialSecretVersion: 1,
        preferenceRevision: 1,
      },
    );
    render(<SettingsPage />);
    const gemini = await screen.findByRole("region", {
      name: "Gemini connection",
    });
    expect(within(gemini).getByText("••••6789")).not.toBeNull();
    await userEvent.click(within(gemini).getByRole("button", {
      name: "Delete key",
    }));

    expect(screen.getByRole("dialog", {
      name: "Delete personal Gemini key?",
    })).not.toBeNull();
  });
});
