import type {
  GeminiConnectionSettings,
  GeminiCredentialSummary,
} from "@career-learning-hub/shared-types";
import {
  ApiError,
  requestWithMetadata,
  requestWithStatusMetadata,
} from "../../api/apiClient";

const GEMINI_PROVIDER = "gemini-direct";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function invalidResponse(requestId?: string): never {
  throw new ApiError(
    502,
    "INVALID_GEMINI_SETTINGS_RESPONSE",
    "The Gemini connection settings could not be read.",
    requestId,
  );
}

function parseCredential(value: unknown): GeminiCredentialSummary | undefined {
  if (value === undefined) return undefined;
  if (!isRecord(value)) return invalidResponse();
  if (
    typeof value.id !== "string" ||
    typeof value.maskedSuffix !== "string" ||
    typeof value.secretVersion !== "number" ||
    typeof value.revision !== "number" ||
    !["valid", "invalid", "untested", "unavailable"].includes(
      String(value.connectionStatus),
    ) ||
    (value.lastValidatedAt !== undefined &&
      typeof value.lastValidatedAt !== "string")
  ) {
    return invalidResponse();
  }
  return {
    id: value.id,
    maskedSuffix: value.maskedSuffix,
    secretVersion: value.secretVersion,
    revision: value.revision,
    connectionStatus: value.connectionStatus as GeminiCredentialSummary["connectionStatus"],
    ...(typeof value.lastValidatedAt === "string"
      ? { lastValidatedAt: value.lastValidatedAt }
      : {}),
  };
}

export async function fetchGeminiSettings(
  signal?: AbortSignal,
): Promise<GeminiConnectionSettings> {
  const [providerResponse, routingResponse] = await Promise.all([
    requestWithMetadata<unknown>("/ai/providers", {
      authentication: "required",
      signal,
    }),
    requestWithMetadata<unknown>("/ai/routing", {
      authentication: "required",
      signal,
    }),
  ]);
  const requestId = providerResponse.requestId ?? routingResponse.requestId;
  if (!isRecord(providerResponse.data) || !isRecord(routingResponse.data)) {
    return invalidResponse(requestId);
  }
  const providers = providerResponse.data.providers;
  if (
    !Array.isArray(providers) ||
    providerResponse.data.geminiModel !== "gemini-3.6-flash" ||
    typeof providerResponse.data.administratorManagedAvailable !== "boolean" ||
    typeof routingResponse.data.preferenceRevision !== "number"
  ) {
    return invalidResponse(requestId);
  }
  const gemini = providers.find(
    (provider) => isRecord(provider) && provider.id === GEMINI_PROVIDER,
  );
  if (!isRecord(gemini)) return invalidResponse(requestId);
  const credential = parseCredential(gemini.credential);
  const activeProvider = routingResponse.data.activeProvider;
  const credentialSource = routingResponse.data.credentialSource;
  const mode =
    activeProvider === GEMINI_PROVIDER &&
    credentialSource === "administrator-managed"
      ? "application-managed"
      : activeProvider === GEMINI_PROVIDER &&
          credentialSource === "user-managed"
        ? "personal"
        : "disconnected";

  if (mode === "personal" && !credential) {
    return invalidResponse(requestId);
  }
  return {
    mode,
    model: "gemini-3.6-flash",
    administratorManagedAvailable:
      providerResponse.data.administratorManagedAvailable,
    preferenceRevision: routingResponse.data.preferenceRevision,
    ...(credential ? { credential } : {}),
    ...(requestId ? { requestId } : {}),
  };
}

function mutationHeaders(revision?: number): Record<string, string> {
  return {
    "Idempotency-Key": crypto.randomUUID(),
    ...(revision === undefined ? {} : { "If-Match": `"${revision}"` }),
  };
}

export async function saveAndTestPersonalGeminiKey(
  apiKey: string,
  credentialRevision?: number,
): Promise<void> {
  await requestWithStatusMetadata(
    `/ai/providers/${GEMINI_PROVIDER}/credential`,
    {
      method: "PUT",
      authentication: "required",
      headers: mutationHeaders(credentialRevision),
      body: { apiKey },
    },
  );
}

export async function activateGeminiSource(
  credentialSource: "user-managed" | "administrator-managed",
  preferenceRevision: number,
): Promise<void> {
  await requestWithStatusMetadata(
    `/ai/providers/${GEMINI_PROVIDER}/activate`,
    {
      method: "PATCH",
      authentication: "required",
      headers: mutationHeaders(preferenceRevision),
      body: { credentialSource },
    },
  );
}

export async function disconnectGemini(
  preferenceRevision: number,
): Promise<void> {
  await requestWithStatusMetadata("/ai/providers/disabled/activate", {
    method: "PATCH",
    authentication: "required",
    headers: mutationHeaders(preferenceRevision),
    body: {},
  });
}

export async function testGeminiConnection(
  settings: GeminiConnectionSettings,
): Promise<void> {
  const body = settings.mode === "application-managed"
    ? { credentialSource: "administrator-managed" as const }
    : {
        credentialSource: "user-managed" as const,
        credentialVersion: settings.credential?.secretVersion,
      };
  await requestWithStatusMetadata(
    `/ai/providers/${GEMINI_PROVIDER}/test`,
    {
      method: "POST",
      authentication: "required",
      headers: mutationHeaders(),
      body,
    },
  );
}

export async function deletePersonalGeminiKey(
  credentialRevision: number,
): Promise<void> {
  await requestWithStatusMetadata(
    `/ai/providers/${GEMINI_PROVIDER}/credential`,
    {
      method: "DELETE",
      authentication: "required",
      headers: mutationHeaders(credentialRevision),
    },
  );
}
