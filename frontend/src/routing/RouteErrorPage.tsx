import { Link, isRouteErrorResponse, useRouteError } from "react-router-dom";
import { ApiError } from "../api/apiClient";

export function RouteErrorPage({
  notFound = false,
}: {
  notFound?: boolean;
}) {
  const routeError = useRouteError();
  const isNotFound =
    notFound ||
    (isRouteErrorResponse(routeError) && routeError.status === 404);
  const requestId =
    routeError instanceof ApiError ? routeError.requestId : undefined;

  return (
    <main className="route-state route-state--full">
      <p className="eyebrow">
        {isNotFound ? "Navigation" : "Something went wrong"}
      </p>
      <h1>
        {isNotFound ? "Page not found" : "This page could not be shown"}
      </h1>
      <p>
        {isNotFound
          ? "The requested page is not available."
          : "A safe recovery is available. Try returning to the workspace."}
      </p>
      {requestId ? (
        <p className="request-id">Request ID: {requestId}</p>
      ) : null}
      <Link className="primary-link" to="/">
        Return to the workspace
      </Link>
    </main>
  );
}
