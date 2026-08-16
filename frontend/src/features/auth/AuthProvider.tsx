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
  ApiError,
  configureApiClientAuth,
  refreshAuthentication,
} from "../../api/apiClient";
import {
  login as loginRequest,
  logout as logoutRequest,
  refreshSession as refreshSessionRequest,
  register as registerRequest,
} from "./authApi";
import { removeResumeRecoveriesForUser } from "../resumes/resumeRecovery";
import { invalidateResumeRecoveryWritersForUser } from "../resumes/resumeRecoveryWriter";

export type AuthenticationStatus =
  | "bootstrapping"
  | "anonymous"
  | "authenticated";

export type AuthenticationAnonymousReason = "session-expired" | null;

type AuthenticationState = {
  status: AuthenticationStatus;
  user: PublicUser | null;
  anonymousReason: AuthenticationAnonymousReason;
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
    anonymousReason: null,
  });
  const accessTokenRef = useRef<string | null>(null);
  const knownUserIdRef = useRef<string | null>(null);
  const pendingAnonymousReasonRef =
    useRef<AuthenticationAnonymousReason>(null);

  const cleanupOutgoingUserRecovery = useCallback((userId: string) => {
    invalidateResumeRecoveryWritersForUser(userId);
    try {
      removeResumeRecoveriesForUser(sessionStorage, userId);
    } catch {
      // Authentication must continue when browser-local cleanup is unavailable.
    }
  }, []);

  const applyAuthentication = useCallback(
    (response: AuthenticationResponse) => {
      const outgoingUserId = knownUserIdRef.current;
      if (outgoingUserId && outgoingUserId !== response.user.id) {
        cleanupOutgoingUserRecovery(outgoingUserId);
      }
      pendingAnonymousReasonRef.current = null;
      knownUserIdRef.current = response.user.id;
      accessTokenRef.current = response.accessToken;
      setState({
        status: "authenticated",
        user: response.user,
        anonymousReason: null,
      });
    },
    [cleanupOutgoingUserRecovery],
  );

  const clearAuthentication = useCallback(() => {
    const anonymousReason = pendingAnonymousReasonRef.current;
    pendingAnonymousReasonRef.current = null;

    const outgoingUserId = knownUserIdRef.current;
    if (outgoingUserId) {
      cleanupOutgoingUserRecovery(outgoingUserId);
      knownUserIdRef.current = null;
    }

    accessTokenRef.current = null;
    setState({
      status: "anonymous",
      user: null,
      anonymousReason,
    });
  }, [cleanupOutgoingUserRecovery]);

  const refreshSession = useCallback(async () => {
    try {
      const response = await refreshSessionRequest();
      applyAuthentication(response);
    } catch (error) {
      if (
        knownUserIdRef.current !== null &&
        error instanceof ApiError &&
        error.status === 401
      ) {
        pendingAnonymousReasonRef.current = "session-expired";
      } else {
        pendingAnonymousReasonRef.current = null;
      }
      throw error;
    }
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
    pendingAnonymousReasonRef.current = null;
    const outgoingUserId = knownUserIdRef.current;
    if (outgoingUserId) {
      cleanupOutgoingUserRecovery(outgoingUserId);
      knownUserIdRef.current = null;
    }
    try {
      await logoutRequest();
    } finally {
      clearAuthentication();
    }
  }, [cleanupOutgoingUserRecovery, clearAuthentication]);

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
