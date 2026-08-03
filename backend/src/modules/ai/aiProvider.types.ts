export const aiProviderIds = [
  "openrouter",
  "gemini-direct",
  "openai-direct",
  "anthropic-direct",
  "deepseek-direct",
] as const;

export const aiExecutionStates = [
  ...aiProviderIds,
  "disabled",
] as const;

export type AiProviderId = (typeof aiProviderIds)[number];
export type AiExecutionState = (typeof aiExecutionStates)[number];

export function isAi3CallableProvider(
  provider: AiExecutionState,
): provider is "gemini-direct" | "disabled" {
  return provider === "gemini-direct" || provider === "disabled";
}

export function isAi4CallableProvider(
  provider: AiExecutionState,
): provider is "openrouter" | "gemini-direct" | "disabled" {
  return (
    provider === "openrouter" ||
    provider === "gemini-direct" ||
    provider === "disabled"
  );
}
