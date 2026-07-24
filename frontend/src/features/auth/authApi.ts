import type {
  AuthenticationResponse,
  CurrentUserResponse,
  LoginRequest,
  PublicUser,
  RegistrationRequest,
  UserRole,
} from "@career-learning-hub/shared-types";
import {
  ApiError,
  apiRequest,
} from "../../api/apiClient";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isOptionalString(value: unknown): boolean {
  return value === undefined || typeof value === "string";
}

function isUserRole(value: unknown): value is UserRole {
  return value === "user" || value === "admin";
}

function isPublicUser(value: unknown): value is PublicUser {
  if (!isRecord(value) || !isRecord(value.profile)) return false;

  const profile = value.profile;
  const validProfile =
    typeof profile.displayName === "string" &&
    isOptionalString(profile.headline) &&
    isOptionalString(profile.timezone) &&
    isOptionalString(profile.locale);

  return (
    typeof value.id === "string" &&
    value.id.length > 0 &&
    typeof value.email === "string" &&
    value.email.length > 0 &&
    validProfile &&
    Array.isArray(value.roles) &&
    value.roles.every(isUserRole) &&
    (value.accountStatus === "active" ||
      value.accountStatus === "suspended" ||
      value.accountStatus === "deleted") &&
    isOptionalString(value.emailVerifiedAt) &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string"
  );
}

function invalidAuthResponse(): ApiError {
  return new ApiError(
    502,
    "INVALID_API_RESPONSE",
    "The server returned an invalid authentication response.",
  );
}

function validateAuthenticationResponse(
  value: unknown,
): AuthenticationResponse {
  if (
    !isRecord(value) ||
    !isPublicUser(value.user) ||
    typeof value.accessToken !== "string" ||
    value.accessToken.trim().length === 0
  ) {
    throw invalidAuthResponse();
  }

  return {
    user: value.user,
    accessToken: value.accessToken,
  };
}

function validateCurrentUserResponse(
  value: unknown,
): CurrentUserResponse {
  if (!isRecord(value) || !isPublicUser(value.user)) {
    throw new ApiError(
      502,
      "INVALID_API_RESPONSE",
      "The server returned an invalid user response.",
    );
  }

  return { user: value.user };
}

export async function register(
  input: RegistrationRequest,
): Promise<AuthenticationResponse> {
  const data = await apiRequest<unknown>("/auth/register", {
    method: "POST",
    body: input,
    authentication: "none",
    retryUnauthorized: false,
  });

  return validateAuthenticationResponse(data);
}

export async function login(
  input: LoginRequest,
): Promise<AuthenticationResponse> {
  const data = await apiRequest<unknown>("/auth/login", {
    method: "POST",
    body: input,
    authentication: "none",
    retryUnauthorized: false,
  });

  return validateAuthenticationResponse(data);
}

export async function refreshSession(): Promise<AuthenticationResponse> {
  const data = await apiRequest<unknown>("/auth/refresh", {
    method: "POST",
    authentication: "none",
    retryUnauthorized: false,
  });

  return validateAuthenticationResponse(data);
}

export function logout(): Promise<void> {
  return apiRequest<void>("/auth/logout", {
    method: "POST",
    authentication: "none",
    retryUnauthorized: false,
  });
}

export async function getCurrentUser(): Promise<PublicUser> {
  const data = await apiRequest<unknown>("/users/me", {
    authentication: "required",
  });

  return validateCurrentUserResponse(data).user;
}
