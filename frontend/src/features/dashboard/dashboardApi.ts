import type {
  DashboardOverview,
  DashboardQuery,
} from "./types";
import { apiRequest } from "../../api/apiClient";

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

export function fetchDashboardOverview(
  accessToken: string,
  query: DashboardQuery = {},
): Promise<DashboardOverview> {
  return apiRequest<DashboardOverview>(
    `/dashboard${queryString(query)}`,
    {
      authentication: "required",
      accessToken,
    },
  );
}

export function fetchProgressSnapshot(
  accessToken: string,
  query: DashboardQuery = {},
): Promise<Omit<DashboardOverview, "recentActivity">> {
  return apiRequest<Omit<DashboardOverview, "recentActivity">>(
    `/dashboard/progress${queryString(query)}`,
    {
      authentication: "required",
      accessToken,
    },
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

  return apiRequest<unknown>(
    `/dashboard/activity?${params.toString()}`,
    {
      authentication: "required",
      accessToken,
    },
  );
}
