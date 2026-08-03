import { randomUUID } from "node:crypto";
import type { ClientSession } from "mongoose";
import { withMongoTransaction } from "../../shared/mongoTransaction.js";
import {
  isOpenRouterModelEligibleForAction,
  isValidOpenRouterModelId,
  openRouterActions,
  parseOpenRouterCatalogue,
  rankOpenRouterModelsForAction,
  type NormalizedOpenRouterModel,
  type OpenRouterAction,
} from "./openRouterCatalogue.js";
import {
  OpenRouterCatalogueStateModel,
  OpenRouterModelCatalogueModel,
} from "./openRouterCatalogue.model.js";

export const OPENROUTER_MODELS_ENDPOINT =
  "https://openrouter.ai/api/v1/models";
const refreshLeaseMilliseconds = 60_000;
const maxCatalogueResponseBytes = 5_000_000;
const staleAfterMilliseconds = 24 * 60 * 60 * 1_000;
const sixHoursMilliseconds = 6 * 60 * 60 * 1_000;

export function nextOpenRouterRefreshDelay(
  random: () => number = Math.random,
): number {
  const bounded = Math.min(1, Math.max(0, random()));
  return Math.round(sixHoursMilliseconds * (0.9 + bounded * 0.2));
}

type FetchLike = (
  input: string | URL | globalThis.Request,
  init?: RequestInit,
) => Promise<Response>;

function safeFailureCode(error: unknown): string {
  if (error instanceof Error && error.name === "AbortError") {
    return "catalogue_timeout";
  }
  if (error instanceof Error && /http/i.test(error.message)) {
    return "catalogue_http_error";
  }
  if (error instanceof SyntaxError) return "catalogue_invalid_json";
  if (error && typeof error === "object" && "issues" in error) {
    return "catalogue_validation_failed";
  }
  return "catalogue_refresh_failed";
}

async function readBoundedCatalogue(response: Response): Promise<unknown> {
  const length = Number(response.headers.get("content-length"));
  if (Number.isFinite(length) && length > maxCatalogueResponseBytes) {
    throw new Error("catalogue response too large");
  }
  if (!response.body) throw new Error("catalogue response empty");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > maxCatalogueResponseBytes) {
      await reader.cancel().catch(() => undefined);
      throw new Error("catalogue response too large");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder().decode(bytes));
}

function isFreeStructuredText(model: NormalizedOpenRouterModel): boolean {
  return Boolean(
    model.freeEligibility.eligible &&
    model.inputModalities.includes("text") &&
    model.outputModalities.includes("text") &&
    model.supportedParameters.includes("max_tokens") &&
    model.supportedParameters.includes("response_format") &&
    model.supportedParameters.includes("structured_outputs"),
  );
}

async function persistCatalogue(input: {
  parsed: NormalizedOpenRouterModel[];
  version: number;
  observedAt: Date;
  ownerId: string;
  etag?: string;
}) {
  return withMongoTransaction(async (session) => {
    const modelIds = input.parsed.map((entry) => entry.modelId);
    for (const entry of input.parsed) {
      await OpenRouterModelCatalogueModel.updateOne(
        { modelId: entry.modelId },
        {
          $set: {
            canonicalSlug: entry.canonicalSlug,
            displayName: entry.displayName,
            createdTimestamp: entry.createdTimestamp,
            contextLength: entry.contextLength,
            maximumOutputTokens: entry.maximumOutputTokens,
            inputModalities: entry.inputModalities,
            outputModalities: entry.outputModalities,
            supportedParameters: entry.supportedParameters,
            pricingStrings: entry.pricingStrings,
            pricingDecimals: entry.pricingDecimals,
            pricingOverrides: entry.pricingOverrides,
            freeStructuredTextEligible: isFreeStructuredText(entry),
            freeEligibilityReason: entry.freeEligibility.reason,
            catalogueVersion: input.version,
            pricingObservedAt: input.observedAt,
            lastSeenAt: input.observedAt,
          },
          $setOnInsert: {
            modelId: entry.modelId,
            firstSeenAt: input.observedAt,
          },
          $unset: { missingSince: 1 },
        },
        { upsert: true, session },
      );
    }
    await OpenRouterModelCatalogueModel.updateMany(
      {
        modelId: { $nin: modelIds },
        missingSince: { $exists: false },
      },
      { $set: { missingSince: input.observedAt } },
      { session },
    );
    await OpenRouterCatalogueStateModel.updateOne(
      { _id: "openrouter", refreshLeaseOwner: input.ownerId },
      {
        $set: {
          currentVersion: input.version,
          lastSuccessAt: input.observedAt,
          pricingObservedAt: input.observedAt,
          itemCount: input.parsed.length,
          freshness: "fresh",
          ...(input.etag ? { etag: input.etag } : {}),
        },
        $unset: {
          lastFailure: 1,
          refreshLeaseOwner: 1,
          refreshLeaseExpiresAt: 1,
        },
      },
      { session },
    );
    return true;
  });
}

export async function refreshOpenRouterCatalogue(input: {
  ownerId?: string;
  now?: Date;
  timeoutMs?: number;
  fetchImpl?: FetchLike;
}) {
  const now = input.now ?? new Date();
  const ownerId = input.ownerId ?? `catalogue-${randomUUID()}`;
  const fetchImpl = input.fetchImpl ?? fetch;
  await OpenRouterCatalogueStateModel.updateOne(
    { _id: "openrouter" },
    {
      $setOnInsert: {
        currentVersion: 0,
        itemCount: 0,
        freshness: "unavailable",
      },
    },
    { upsert: true },
  );
  const lease = await OpenRouterCatalogueStateModel.findOneAndUpdate(
    {
      _id: "openrouter",
      $or: [
        { refreshLeaseExpiresAt: { $exists: false } },
        { refreshLeaseExpiresAt: { $lte: now } },
      ],
    },
    {
      $set: {
        lastAttemptAt: now,
        refreshLeaseOwner: ownerId,
        refreshLeaseExpiresAt: new Date(now.getTime() + refreshLeaseMilliseconds),
      },
    },
    { new: true },
  );
  if (!lease) {
    const state = await OpenRouterCatalogueStateModel.findById("openrouter").lean();
    return {
      status: "lease-held" as const,
      catalogueVersion: state?.currentVersion ?? 0,
      itemCount: state?.itemCount ?? 0,
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    Math.min(Math.max(input.timeoutMs ?? 10_000, 1_000), 30_000),
  );
  timeout.unref();
  try {
    const response = await fetchImpl(OPENROUTER_MODELS_ENDPOINT, {
      method: "GET",
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`catalogue HTTP ${response.status}`);
    const payload = await readBoundedCatalogue(response);
    const version = lease.currentVersion + 1;
    const parsed = parseOpenRouterCatalogue(payload, {
      catalogueVersion: version,
      observedAt: now,
    });
    await persistCatalogue({
      parsed,
      version,
      observedAt: now,
      ownerId,
      ...(response.headers.get("etag")
        ? { etag: response.headers.get("etag")!.slice(0, 240) }
        : {}),
    });
    return {
      status: "refreshed" as const,
      catalogueVersion: version,
      itemCount: parsed.length,
    };
  } catch (error) {
    const failure = safeFailureCode(error);
    await OpenRouterCatalogueStateModel.updateOne(
      { _id: "openrouter", refreshLeaseOwner: ownerId },
      {
        $set: {
          freshness: lease.currentVersion > 0 ? "stale" : "unavailable",
          lastFailure: failure,
        },
        $unset: {
          refreshLeaseOwner: 1,
          refreshLeaseExpiresAt: 1,
        },
      },
    );
    return {
      status: "failed" as const,
      catalogueVersion: lease.currentVersion,
      itemCount: lease.itemCount,
      failure,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function getOpenRouterCatalogueStatus(now = new Date()) {
  const state = await OpenRouterCatalogueStateModel.findById("openrouter").lean();
  if (!state || state.currentVersion === 0 || !state.lastSuccessAt) {
    return {
      available: false,
      freshness: "unavailable" as const,
      catalogueVersion: 0,
      itemCount: 0,
    };
  }
  const freshness =
    now.getTime() - state.lastSuccessAt.getTime() <= staleAfterMilliseconds
      ? "fresh" as const
      : "stale" as const;
  return {
    available: true,
    freshness,
    catalogueVersion: state.currentVersion,
    itemCount: state.itemCount,
    lastSuccessAt: state.lastSuccessAt,
    pricingObservedAt: state.pricingObservedAt,
  };
}

export async function hardDisableOpenRouterModel(input: {
  modelId: string;
  reason: string;
  now?: Date;
}) {
  if (
    !isValidOpenRouterModelId(input.modelId) ||
    !/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/.test(input.reason) ||
    input.reason.length > 120
  ) {
    throw new Error("Invalid OpenRouter hard-disable request.");
  }
  await OpenRouterModelCatalogueModel.updateOne(
    { modelId: input.modelId },
    {
      $set: {
        disabledAt: input.now ?? new Date(),
        disableReason: input.reason,
        freeStructuredTextEligible: false,
      },
    },
  );
}

function storedModelToNormalized(value: Record<string, unknown>): NormalizedOpenRouterModel {
  return {
    modelId: String(value.modelId),
    ...(typeof value.canonicalSlug === "string"
      ? { canonicalSlug: value.canonicalSlug }
      : {}),
    displayName: String(value.displayName),
    ...(typeof value.createdTimestamp === "number"
      ? { createdTimestamp: value.createdTimestamp }
      : {}),
    contextLength: Number(value.contextLength),
    ...(typeof value.maximumOutputTokens === "number"
      ? { maximumOutputTokens: value.maximumOutputTokens }
      : {}),
    inputModalities: value.inputModalities as string[],
    outputModalities: value.outputModalities as string[],
    supportedParameters: value.supportedParameters as string[],
    pricingStrings: value.pricingStrings as NormalizedOpenRouterModel["pricingStrings"],
    pricingDecimals: value.pricingDecimals as NormalizedOpenRouterModel["pricingDecimals"],
    pricingOverrides: (value.pricingOverrides ?? []) as
      NormalizedOpenRouterModel["pricingOverrides"],
    freeEligibility: {
      eligible: Boolean(value.freeStructuredTextEligible),
      ...(typeof value.freeEligibilityReason === "string"
        ? { reason: value.freeEligibilityReason }
        : {}),
      pricingObservedAt: value.pricingObservedAt as Date,
    },
    catalogueVersion: Number(value.catalogueVersion),
    pricingObservedAt: value.pricingObservedAt as Date,
    ...(value.missingSince ? { missingSince: value.missingSince as Date } : {}),
    ...(value.disabledAt ? { disabledAt: value.disabledAt as Date } : {}),
  };
}

export async function isOpenRouterPlanSecure(input: {
  action: OpenRouterAction;
  modelIds: readonly string[];
  now: Date;
}): Promise<boolean> {
  const stored = await OpenRouterModelCatalogueModel.find({
    modelId: { $in: input.modelIds },
  }).lean();
  if (stored.length !== input.modelIds.length) return false;
  const byId = new Map(stored.map((entry) => [entry.modelId, entry]));
  return input.modelIds.every((modelId) => {
    const value = byId.get(modelId);
    return Boolean(value && isOpenRouterModelEligibleForAction({
      action: input.action,
      model: storedModelToNormalized(
        value as unknown as Record<string, unknown>,
      ),
      now: input.now,
    }));
  });
}

export async function getOpenRouterActionPlan(input: {
  action: OpenRouterAction;
  now?: Date;
  maximumCandidates?: number;
  session?: ClientSession;
}) {
  const stateQuery = OpenRouterCatalogueStateModel.findById("openrouter");
  const modelsQuery = OpenRouterModelCatalogueModel.find({
    freeStructuredTextEligible: true,
    missingSince: { $exists: false },
    disabledAt: { $exists: false },
  });
  if (input.session) {
    stateQuery.session(input.session);
    modelsQuery.session(input.session);
  }
  const [state, stored] = await Promise.all([
    stateQuery.lean(),
    modelsQuery.lean(),
  ]);
  if (!state || state.currentVersion === 0 || !state.pricingObservedAt) {
    throw new Error("OpenRouter catalogue is unavailable.");
  }
  const ranked = rankOpenRouterModelsForAction({
    action: input.action,
    models: stored.map((entry) =>
      storedModelToNormalized(entry as unknown as Record<string, unknown>)),
    now: input.now ?? new Date(),
    ...(input.maximumCandidates
      ? { maximumCandidates: input.maximumCandidates }
      : {}),
  });
  return {
    ...ranked,
    catalogueVersion: state.currentVersion,
    pricingObservedAt: state.pricingObservedAt,
    paidFallbackAllowed: false as const,
  };
}

export async function compileOpenRouterActionProfiles(now = new Date()) {
  return Promise.all(
    openRouterActions.map(async (action) => {
      const plan = await getOpenRouterActionPlan({ action, now });
      return {
        action,
        freeModelIds: plan.modelIds,
        catalogueVersion: plan.catalogueVersion,
        pricingObservedAt: plan.pricingObservedAt,
        rankingPolicyVersion: plan.rankingPolicyVersion,
        timeoutProfile: plan.profile.timeoutProfile,
        maximumInputTokens: plan.profile.maximumInputTokens,
        maximumOutputTokens: plan.profile.maximumOutputTokens,
        validatorIdentity: plan.profile.validatorIdentity,
        validatorVersion: plan.profile.validatorVersion,
        executionDeadlineSeconds: plan.profile.executionDeadlineSeconds,
        allowValidationRegeneration: false as const,
        paidFallbackAllowed: false as const,
      };
    }),
  );
}

export async function listSafeOpenRouterModels(input: {
  action: OpenRouterAction;
  now?: Date;
  maximumCandidates?: number;
}) {
  const [status, plan] = await Promise.all([
    getOpenRouterCatalogueStatus(input.now),
    getOpenRouterActionPlan(input),
  ]);
  const stored = await OpenRouterModelCatalogueModel.find({
    modelId: { $in: plan.modelIds },
  }).lean();
  const byId = new Map(stored.map((entry) => [entry.modelId, entry]));
  return {
    provider: "openrouter" as const,
    action: input.action,
    freshness: status.freshness,
    catalogueVersion: plan.catalogueVersion,
    rankingPolicyVersion: plan.rankingPolicyVersion,
    models: plan.modelIds.map((modelId) => {
      const entry = byId.get(modelId)!;
      return {
        id: entry.modelId,
        name: entry.displayName,
        contextLength: entry.contextLength,
        maximumOutputTokens: entry.maximumOutputTokens,
        inputModalities: entry.inputModalities,
        outputModalities: entry.outputModalities,
        supportedParameters: entry.supportedParameters,
      };
    }),
  };
}
