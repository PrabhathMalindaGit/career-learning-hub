export type ApiSuccess<T> = {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
};

export type ApiErrorCode = string;

export type ApiStructuredError = {
  code: ApiErrorCode;
  message: string;
  requestId: string;
  details?: unknown;
};

export type ApiFailure = {
  success: false;
  error: ApiStructuredError;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export type AccountStatus = "active" | "suspended" | "deleted";

export type UserRole = "user" | "admin";

export type UserProfile = {
  displayName: string;
  headline?: string;
  timezone?: string;
  locale?: string;
};

export type PublicUser = {
  id: string;
  email: string;
  profile: UserProfile;
  roles: UserRole[];
  accountStatus: AccountStatus;
  emailVerifiedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegistrationRequest = {
  email: string;
  password: string;
  displayName: string;
};

export type AuthenticationResponse = {
  user: PublicUser;
  accessToken: string;
};

export type CurrentUserResponse = {
  user: PublicUser;
};
