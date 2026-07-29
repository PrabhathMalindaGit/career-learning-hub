import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";
import { useAuth } from "./AuthProvider";

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

export function RouteLoadingState() {
  return (
    <main
      className="auth-layout auth-bootstrap-layout"
      aria-busy="true"
    >
      <section
        className="auth-card"
        role="status"
        aria-labelledby="auth-bootstrap-heading"
      >
        <p className="eyebrow">Career &amp; Learning Hub</p>
        <h1 id="auth-bootstrap-heading">Restoring your session</h1>
        <p className="auth-intro">
          Please wait while your secure session is checked.
        </p>
      </section>
    </main>
  );
}

export function AuthRoute({ mode }: { mode: AuthRouteMode }) {
  const { status } = useAuth();
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
        state={{ from: intendedPath }}
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
