import type {
  AuthenticationResponse,
  LoginRequest,
  PublicUser,
  RegistrationRequest,
} from "@career-learning-hub/shared-types";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  configureApiClientAuth,
  refreshAuthentication,
} from "../../api/apiClient";
import {
  login as loginRequest,
  logout as logoutRequest,
  refreshSession as refreshSessionRequest,
  register as registerRequest,
} from "./authApi";

export type AuthenticationStatus =
  | "bootstrapping"
  | "anonymous"
  | "authenticated";

type AuthenticationState = {
  status: AuthenticationStatus;
  user: PublicUser | null;
};

export type AuthContextValue = AuthenticationState & {
  login(input: LoginRequest): Promise<void>;
  register(input: RegistrationRequest): Promise<void>;
  logout(): Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [state, setState] = useState<AuthenticationState>({
    status: "bootstrapping",
    user: null,
  });
  const accessTokenRef = useRef<string | null>(null);

  const applyAuthentication = useCallback(
    (response: AuthenticationResponse) => {
      accessTokenRef.current = response.accessToken;
      setState({
        status: "authenticated",
        user: response.user,
      });
    },
    [],
  );

  const clearAuthentication = useCallback(() => {
    accessTokenRef.current = null;
    setState({
      status: "anonymous",
      user: null,
    });
  }, []);

  const refreshSession = useCallback(async () => {
    const response = await refreshSessionRequest();
    applyAuthentication(response);
  }, [applyAuthentication]);

  useEffect(() => {
    const restoreClient = configureApiClientAuth({
      getAccessToken: () => accessTokenRef.current,
      refreshSession,
      clearAuthentication,
    });

    void refreshAuthentication().catch(() => {
      // The coordinated refresh path has already cleared local auth state.
    });

    return restoreClient;
  }, [clearAuthentication, refreshSession]);

  const login = useCallback(
    async (input: LoginRequest) => {
      const response = await loginRequest(input);
      applyAuthentication(response);
    },
    [applyAuthentication],
  );

  const register = useCallback(
    async (input: RegistrationRequest) => {
      const response = await registerRequest(input);
      applyAuthentication(response);
    },
    [applyAuthentication],
  );

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      clearAuthentication();
    }
  }, [clearAuthentication]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      login,
      register,
      logout,
    }),
    [login, logout, register, state],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return value;
}
