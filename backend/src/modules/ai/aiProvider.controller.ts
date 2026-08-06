import type { Request, Response } from "express";
import {
  activateProvider,
  deleteCredential,
  getRoutingSettings,
  listProviderSettings,
  saveCredential,
  testCredentialConnection,
  withAiIdempotency,
  type AiAuditContext,
} from "./aiProvider.service.js";
import {
  readAiIdempotencyKey,
  readAiRevision,
} from "./aiRequestGuards.js";
import type { AiExecutionState } from "./aiProvider.types.js";

type ProviderParams = { provider: AiExecutionState };

function auditContext(request: Request): AiAuditContext {
  return {
    requestId: request.requestId,
    sourceIp: request.ip,
    userAgent: request.get("user-agent"),
    actorRole: request.user?.roles.includes("admin") ? "admin" : "user",
  };
}

export async function listProvidersController(
  request: Request,
  response: Response,
): Promise<void> {
  const data = await listProviderSettings(request.auth!.userId);
  response.status(200).json({ success: true, data });
}

export async function getRoutingController(
  request: Request,
  response: Response,
): Promise<void> {
  const data = await getRoutingSettings(request.auth!.userId);
  response.status(200).json({ success: true, data });
}

export async function putCredentialController(
  request: Request<ProviderParams>,
  response: Response,
): Promise<void> {
  const result = await withAiIdempotency({
    userId: request.auth!.userId,
    operation: `credential.put:${request.params.provider}`,
    idempotencyKey: readAiIdempotencyKey(request),
    execute: async () => {
      const saved = await saveCredential({
        userId: request.auth!.userId,
        provider: request.params.provider,
        apiKey: request.body.apiKey,
        label: request.body.label,
        expectedRevision: readAiRevision(request),
        audit: auditContext(request),
      });
      return {
        statusCode: saved.created ? 201 : 200,
        value: { credential: saved.credential },
      };
    },
  });
  const credential = result.value?.credential;
  if (credential) response.setHeader("ETag", `"${credential.revision}"`);
  response.status(result.statusCode).json({
    success: true,
    data: result.value,
  });
}

export async function testCredentialController(
  request: Request<ProviderParams>,
  response: Response,
): Promise<void> {
  const result = await withAiIdempotency({
    userId: request.auth!.userId,
    operation: `credential.test:${request.params.provider}`,
    idempotencyKey: readAiIdempotencyKey(request),
    execute: async () => ({
      statusCode: 200,
      value: await testCredentialConnection({
        userId: request.auth!.userId,
        provider: request.params.provider,
        credentialSource: request.body.credentialSource,
        credentialVersion: request.body.credentialVersion,
        audit: auditContext(request),
      }),
    }),
  });
  const credential = result.value?.credential;
  if (credential) response.setHeader("ETag", `"${credential.revision}"`);
  response.status(result.statusCode).json({
    success: true,
    data: result.value,
  });
}

export async function activateProviderController(
  request: Request<ProviderParams>,
  response: Response,
): Promise<void> {
  const result = await withAiIdempotency({
    userId: request.auth!.userId,
    operation: `provider.activate:${request.params.provider}`,
    idempotencyKey: readAiIdempotencyKey(request),
    execute: async () => ({
      statusCode: 200,
      value: {
        routing: await activateProvider({
          userId: request.auth!.userId,
          provider: request.params.provider,
          credentialSource: request.body.credentialSource,
          routingProfileVersion: request.body.routingProfileVersion,
          expectedRevision: readAiRevision(request)!,
          audit: auditContext(request),
        }),
      },
    }),
  });
  const routing = result.value?.routing;
  if (routing) response.setHeader("ETag", `"${routing.revision}"`);
  response.status(result.statusCode).json({
    success: true,
    data: result.value,
  });
}

export async function deleteCredentialController(
  request: Request<ProviderParams>,
  response: Response,
): Promise<void> {
  const result = await withAiIdempotency({
    userId: request.auth!.userId,
    operation: `credential.delete:${request.params.provider}`,
    idempotencyKey: readAiIdempotencyKey(request),
    execute: async () => {
      const deleted = await deleteCredential({
        userId: request.auth!.userId,
        provider: request.params.provider,
        expectedRevision: readAiRevision(request)!,
        audit: auditContext(request),
      });
      return {
        statusCode: deleted.pending ? 202 : 204,
        value: deleted.pending
          ? { credential: { provider: request.params.provider, state: "deleting" } }
          : undefined,
      };
    },
  });
  if (result.statusCode === 204) {
    response.status(204).end();
    return;
  }
  response.status(result.statusCode).json({
    success: true,
    data: result.value,
  });
}
