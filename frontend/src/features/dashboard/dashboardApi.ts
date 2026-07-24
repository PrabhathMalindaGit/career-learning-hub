import type {
  DashboardOverview,
  DashboardQuery,
} from "./types";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1";

interface ApiEnvelope<T> {
  success: true;
  data: T;
}

function queryString(query: DashboardQuery): string {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined) {
      params.set(key, String(value));
    }
  });

  const encoded = params.toString();
  return encoded ? `?${encoded}` : "";
}

async function request<T>(
  path: string,
  accessToken: string,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(
      body?.error?.message ??
        `Dashboard request failed with HTTP ${response.status}.`,
    );
  }

  const body = (await response.json()) as ApiEnvelope<T>;
  return body.data;
}

export function fetchDashboardOverview(
  accessToken: string,
  query: DashboardQuery = {},
): Promise<DashboardOverview> {
  return request(
    `/dashboard${queryString(query)}`,
    accessToken,
  );
}

export function fetchProgressSnapshot(
  accessToken: string,
  query: DashboardQuery = {},
): Promise<Omit<DashboardOverview, "recentActivity">> {
  return request(
    `/dashboard/progress${queryString(query)}`,
    accessToken,
  );
}

export function fetchDashboardActivity(
  accessToken: string,
  options: {
    page?: number;
    limit?: number;
    type?: string;
    origin?: "api" | "worker" | "system";
    resourceType?: string;
  } = {},
) {
  const params = new URLSearchParams();

  Object.entries(options).forEach(([key, value]) => {
    if (value !== undefined) {
      params.set(key, String(value));
    }
  });

  return request(
    `/dashboard/activity?${params.toString()}`,
    accessToken,
  );
}
