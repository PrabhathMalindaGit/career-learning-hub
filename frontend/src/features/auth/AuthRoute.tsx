import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";
import { BrandLockup } from "../../components/BrandLockup";
import { AuthenticationShell } from "./AuthenticationShell";
import {
  useAuth,
  type AuthenticationAnonymousReason,
} from "./AuthProvider";

export type AuthRouteMode = "protected" | "public-only";

export function safeInternalRedirect(value: unknown): string {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\")
  ) {
    return "/dashboard";
  }

  try {
    const parsed = new URL(value, "https://router.invalid");
    if (parsed.origin !== "https://router.invalid") {
      return "/dashboard";
    }
  } catch {
    return "/dashboard";
  }

  return value;
}

export function intendedLocationFromState(state: unknown): string {
  if (
    typeof state === "object" &&
    state !== null &&
    "from" in state
  ) {
    return safeInternalRedirect(state.from);
  }

  return "/dashboard";
}

export function authenticationReasonFromState(
  state: unknown,
): AuthenticationAnonymousReason {
  return (
    typeof state === "object" &&
    state !== null &&
    "authReason" in state &&
    state.authReason === "session-expired"
  )
    ? "session-expired"
    : null;
}

export function RouteLoadingState() {
  return (
    <AuthenticationShell
      labelledBy="auth-bootstrap-heading"
      mode="bootstrap"
    >
      <div
        className="authentication-bootstrap"
        role="status"
        aria-labelledby="auth-bootstrap-heading"
        aria-busy="true"
      >
        <div className="authentication-bootstrap__lockup">
          <BrandLockup />
        </div>
        <p className="eyebrow">Career Learning Hub</p>
        <h1 id="auth-bootstrap-heading">Restoring your session</h1>
        <p className="auth-intro">
          Please wait while your secure session is checked.
        </p>
        <p className="authentication-bootstrap__status-line">
          Checking secure session
        </p>
      </div>
    </AuthenticationShell>
  );
}

export function AuthRoute({ mode }: { mode: AuthRouteMode }) {
  const { status, anonymousReason } = useAuth();
  const location = useLocation();

  if (status === "bootstrapping") {
    return <RouteLoadingState />;
  }

  if (mode === "protected" && status === "anonymous") {
    const intendedPath = safeInternalRedirect(
      `${location.pathname}${location.search}${location.hash}`,
    );
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: intendedPath,
          ...(anonymousReason === "session-expired"
            ? { authReason: "session-expired" }
            : {}),
        }}
      />
    );
  }

  if (mode === "public-only" && status === "authenticated") {
    return (
      <Navigate
        to={intendedLocationFromState(location.state)}
        replace
      />
    );
  }

  return <Outlet />;
}
