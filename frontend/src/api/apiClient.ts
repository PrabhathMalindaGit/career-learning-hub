import type {
  ApiFailure,
  ApiResponse,
} from "@career-learning-hub/shared-types";

const DEVELOPMENT_API_BASE_URL = "http://localhost:8000/api/v1";

function isLocalOrLoopbackHostname(hostname: string): boolean {
  const normalized = hostname
    .toLowerCase()
    .replace(/^\[|\]$/g, "")
    .replace(/\.$/, "");

  return (
    normalized === "localhost" ||
    normalized.endsWith(".localhost") ||
    normalized === "::1" ||
    /^::ffff:7f[0-9a-f]{2}:/.test(normalized) ||
    /^127(?:\.\d{1,3}){3}$/.test(normalized)
  );
}

function configurationError(): Error {
  return new Error(
    "VITE_API_URL must be an explicit non-local HTTPS URL in production.",
  );
}

export function resolveApiBaseUrl(
  configuredValue: string | undefined,
  production: boolean,
): string {
  const value = configuredValue?.trim();
  if (!value && production) {
    throw configurationError();
  }

  const candidate = value || DEVELOPMENT_API_BASE_URL;
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw configurationError();
  }

  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    (
      production &&
      (
        url.protocol !== "https:" ||
        isLocalOrLoopbackHostname(url.hostname)
      )
    )
  ) {
    throw configurationError();
  }

  return url.toString().replace(/\/+$/, "");
}

const API_BASE_URL = resolveApiBaseUrl(
  import.meta.env?.VITE_API_URL,
  import.meta.env?.PROD ?? false,
);

const REFRESH_EXCLUDED_PATHS = new Set([
  "/auth/login",
  "/auth/register",
  "/auth/refresh",
  "/auth/logout",
]);
const CANONICAL_REQUEST_ID_PATTERN = /^[A-Za-z0-9._-]{16,128}$/;

type ApiMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type AuthenticationMode = "optional" | "required" | "none";

export type ApiRequestOptions = {
  method?: ApiMethod;
  body?: unknown;
  headers?: Readonly<Record<string, string>>;
  signal?: AbortSignal;
  authentication?: AuthenticationMode;
  retryUnauthorized?: boolean;
  accessToken?: string;
};

export type ApiResponseWithMetadata<T> = {
  data: T;
  requestId?: string;
};

export type ApiResponseWithStatusMetadata<T> =
  ApiResponseWithMetadata<T> & {
    status: number;
  };

export type ApiClientAuthAdapter = {
  getAccessToken(): string | null;
  refreshSession(): Promise<void>;
  clearAuthentication(): void | Promise<void>;
};

const anonymousAuthAdapter: ApiClientAuthAdapter = {
  getAccessToken: () => null,
  refreshSession: () => Promise.reject(
    new Error("Authentication refresh is unavailable."),
  ),
  clearAuthentication: () => undefined,
};

let authAdapter = anonymousAuthAdapter;
let refreshPromise: Promise<void> | null = null;

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly requestId?: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isApiFailure(value: unknown): value is ApiFailure {
  if (!isRecord(value) || value.success !== false) return false;
  if (!isRecord(value.error)) return false;

  return (
    typeof value.error.code === "string" &&
    typeof value.error.message === "string"
  );
}

function isApiSuccess<T>(value: unknown): value is ApiResponse<T> & {
  success: true;
} {
  return (
    isRecord(value) &&
    value.success === true &&
    Object.hasOwn(value, "data")
  );
}

function joinApiPath(path: string): string {
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

function requestPath(path: string): string {
  const queryIndex = path.indexOf("?");
  return queryIndex === -1 ? path : path.slice(0, queryIndex);
}

function responseWithMetadata<T>(
  response: Response,
  data: T,
): ApiResponseWithStatusMetadata<T> {
  const requestId = response.headers.get("X-Request-Id");

  return {
    data,
    status: response.status,
    ...(requestId && CANONICAL_REQUEST_ID_PATTERN.test(requestId)
      ? { requestId }
      : {}),
  };
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function structuredError(
  response: Response,
  body: unknown,
): ApiError {
  const headerRequestId =
    response.headers.get("X-Request-Id") ?? undefined;

  if (isApiFailure(body)) {
    const bodyRequestId =
      typeof body.error.requestId === "string"
        ? body.error.requestId
        : undefined;

    return new ApiError(
      response.status,
      body.error.code,
      body.error.message,
      bodyRequestId ?? headerRequestId,
      body.error.details,
    );
  }

  return new ApiError(
    response.status,
    `HTTP_${response.status}`,
    `Request failed with HTTP ${response.status}.`,
    headerRequestId,
  );
}

function createRequestInit(
  options: ApiRequestOptions,
): RequestInit {
  const headers = new Headers(options.headers);
  headers.delete("Authorization");

  const authentication = options.authentication ?? "optional";
  const accessToken =
    authentication === "none"
      ? null
      : options.accessToken ?? authAdapter.getAccessToken();

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  let body: BodyInit | undefined;
  if (options.body instanceof FormData) {
    body = options.body;
    headers.delete("Content-Type");
  } else if (options.body !== undefined) {
    body = JSON.stringify(options.body);
    headers.set("Content-Type", "application/json");
  }

  return {
    method: options.method ?? "GET",
    credentials: "include",
    headers,
    body,
    signal: options.signal,
  };
}

export function configureApiClientAuth(
  adapter: ApiClientAuthAdapter,
): () => void {
  const previousAdapter = authAdapter;
  authAdapter = adapter;

  return () => {
    if (authAdapter === adapter) {
      authAdapter = previousAdapter;
    }
  };
}

export function refreshAuthentication(): Promise<void> {
  if (!refreshPromise) {
    const activeAdapter = authAdapter;

    refreshPromise = activeAdapter
      .refreshSession()
      .catch(async (error: unknown) => {
        try {
          await activeAdapter.clearAuthentication();
        } catch {
          // Local authentication clearing must not mask the refresh error.
        }
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

async function executeRequest<T>(
  path: string,
  options: ApiRequestOptions,
  retried: boolean,
): Promise<ApiResponseWithStatusMetadata<T>> {
  const response = await fetch(
    joinApiPath(path),
    createRequestInit(options),
  );

  const authentication = options.authentication ?? "optional";
  const canRefresh =
    response.status === 401 &&
    !retried &&
    authentication !== "none" &&
    options.retryUnauthorized !== false &&
    !REFRESH_EXCLUDED_PATHS.has(requestPath(path));

  if (canRefresh) {
    await refreshAuthentication();
    return executeRequest<T>(path, options, true);
  }

  if (response.status === 204) {
    return responseWithMetadata(response, undefined as T);
  }

  const body = await readJson(response);

  if (!response.ok) {
    throw structuredError(response, body);
  }

  if (!isApiSuccess<T>(body)) {
    throw new ApiError(
      response.status,
      "INVALID_API_RESPONSE",
      "The server returned an invalid response.",
      response.headers.get("X-Request-Id") ?? undefined,
    );
  }

  return responseWithMetadata(response, body.data);
}

export function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  return executeRequest<T>(path, options, false).then(
    ({ data }) => data,
  );
}

export function requestWithMetadata<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<ApiResponseWithMetadata<T>> {
  return executeRequest<T>(path, options, false).then(
    ({ data, requestId }) => ({
      data,
      ...(requestId === undefined ? {} : { requestId }),
    }),
  );
}

export function requestWithStatusMetadata<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<ApiResponseWithStatusMetadata<T>> {
  return executeRequest<T>(path, options, false);
}
