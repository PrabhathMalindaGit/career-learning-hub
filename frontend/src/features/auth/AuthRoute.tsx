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
    <main className="route-state route-state--full" aria-busy="true">
      <p className="eyebrow">Career &amp; Learning Hub</p>
      <h1>Restoring your session</h1>
      <p>Please wait while your secure session is checked.</p>
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
