import { useEffect, useRef, useState } from "react";
import { ApiError } from "../../api/apiClient";
import { fetchProgressSnapshot } from "../dashboard/dashboardApi";
import type { DashboardProgress } from "../dashboard/types";
import "./aiUsageDiagnostics.css";

type AiUsage = DashboardProgress["aiUsage"];

type DisplayError = {
  message: string;
  requestId?: string;
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 4,
  maximumFractionDigits: 6,
});

const featureLabels: Readonly<Record<string, string>> = {
  "resume.analysis": "Resume analysis",
  "resume.parse": "Resume PDF import",
  "resume.rewrite": "Resume suggestions",
  "resume.rewrites": "Resume suggestions",
  "interview.questions.generate": "Interview questions",
  "interview.feedback.generate": "Interview feedback",
  "interview.question.explain": "Interview guidance",
  "learning.document.chat": "Learning chat",
  "learning.flashcards.generate": "Flashcard creation",
  "learning.quiz.generate": "Quiz creation",
};

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function displayError(error: unknown): DisplayError {
  if (error instanceof ApiError) {
    return {
      message: error.message,
      ...(error.requestId ? { requestId: error.requestId } : {}),
    };
  }

  return {
    message: "AI usage could not be loaded.",
  };
}

function latencyLabel(value: number | null): string {
  if (value === null) return "Not recorded";
  if (value >= 1000) return `${(value / 1000).toFixed(1)} s`;
  return `${Math.round(value)} ms`;
}

function costCoverageLabel(usage: AiUsage): string {
  if (usage.estimatedCostEventCount === 0) {
    return "No cost estimate is available for these requests.";
  }

  if (
    usage.requestCount > 0 &&
    usage.estimatedCostEventCount === usage.requestCount
  ) {
    return "Estimated across all recorded requests. Not an invoice.";
  }

  return `Estimate covers ${usage.estimatedCostEventCount} of ${usage.requestCount} recorded requests. Not an invoice.`;
}

function featureLabel(feature: string): string {
  return featureLabels[feature] ?? "Other AI operation";
}

function UsageSummary({ usage }: { usage: AiUsage }) {
  if (usage.requestCount === 0) {
    return (
      <div className="ai-usage-diagnostics__empty">
        <strong>No AI usage recorded in the last 30 days</strong>
        <p>
          AI request and token totals will appear here after Gemini-assisted work is recorded.
        </p>
      </div>
    );
  }

  return (
    <>
      <dl className="ai-usage-diagnostics__summary">
        <div>
          <dt>Requests</dt>
          <dd>{usage.requestCount.toLocaleString()}</dd>
        </div>
        <div>
          <dt>Successful</dt>
          <dd>{usage.successCount.toLocaleString()}</dd>
        </div>
        <div>
          <dt>Failed</dt>
          <dd>{usage.failureCount.toLocaleString()}</dd>
        </div>
        <div>
          <dt>Input tokens</dt>
          <dd>{usage.inputTokens.toLocaleString()}</dd>
        </div>
        <div>
          <dt>Output tokens</dt>
          <dd>{usage.outputTokens.toLocaleString()}</dd>
        </div>
        <div>
          <dt>Total tokens</dt>
          <dd>{usage.totalTokens.toLocaleString()}</dd>
        </div>
        <div>
          <dt>Average response time</dt>
          <dd>{latencyLabel(usage.averageLatencyMs)}</dd>
        </div>
        <div>
          <dt>Estimated usage cost</dt>
          <dd>
            {usage.estimatedCostEventCount === 0
              ? "Not available"
              : currencyFormatter.format(usage.estimatedCostUsd)}
          </dd>
        </div>
      </dl>

      <p className="ai-usage-diagnostics__cost-note">
        {costCoverageLabel(usage)}
      </p>

      <details
        className="ai-usage-diagnostics__details"
        data-testid="ai-usage-technical-details"
      >
        <summary>Show technical details</summary>
        <div className="ai-usage-diagnostics__feature-list">
          {usage.byFeature.length === 0 ? (
            <p>No feature-level diagnostics recorded.</p>
          ) : (
            usage.byFeature.map((feature) => (
              <article
                className="ai-usage-diagnostics__feature"
                key={feature.feature}
              >
                <div className="ai-usage-diagnostics__feature-name">
                  <strong>{featureLabel(feature.feature)}</strong>
                  <code>{feature.feature}</code>
                </div>
                <dl>
                  <div>
                    <dt>Requests</dt>
                    <dd>{feature.requestCount.toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt>Input / output</dt>
                    <dd>
                      {feature.inputTokens.toLocaleString()} /{" "}
                      {feature.outputTokens.toLocaleString()}
                    </dd>
                  </div>
                  <div>
                    <dt>Estimated cost</dt>
                    <dd>{currencyFormatter.format(feature.estimatedCostUsd)}</dd>
                  </div>
                </dl>
              </article>
            ))
          )}
        </div>
      </details>
    </>
  );
}

// Feature 6.10 — AI usage diagnostics.
// Reads bounded aggregated usage metrics for Settings without exposing prompts,
// generated content, private document content, or credential values.
export function AiUsageDiagnosticsSettingsSection() {
  const [usage, setUsage] = useState<AiUsage>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<DisplayError>();
  const [retryVersion, setRetryVersion] = useState(0);
  const requestId = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    const currentRequestId = ++requestId.current;

    setUsage(undefined);
    setError(undefined);
    setLoading(true);

    void fetchProgressSnapshot(
      {
        windowDays: 30,
        trendLimit: 3,
        recentDocumentLimit: 1,
      },
      controller.signal,
    )
      .then((progress) => {
        if (currentRequestId === requestId.current) {
          setUsage(progress.aiUsage);
        }
      })
      .catch((caught: unknown) => {
        if (
          currentRequestId === requestId.current &&
          !isAbortError(caught)
        ) {
          setError(displayError(caught));
        }
      })
      .finally(() => {
        if (currentRequestId === requestId.current) {
          setLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [retryVersion]);

  return (
    <section
      className="settings-panel ai-usage-diagnostics"
      aria-labelledby="ai-usage-diagnostics-heading"
    >
      <header className="settings-panel__header">
        <h2 id="ai-usage-diagnostics-heading">AI usage & diagnostics</h2>
        <p>
          Review Gemini-assisted usage recorded for the last 30 days. Cost values are estimates only.
        </p>
      </header>

      {loading ? (
        <div className="ai-usage-diagnostics__status" role="status">
          Loading AI usage
        </div>
      ) : null}

      {error ? (
        <div className="ai-usage-diagnostics__error" role="alert">
          <strong>{error.message}</strong>
          {error.requestId ? (
            <span>Request ID: {error.requestId}</span>
          ) : null}
          <button
            className="secondary-button"
            type="button"
            onClick={() => setRetryVersion((value) => value + 1)}
          >
            Retry AI usage
          </button>
        </div>
      ) : null}

      {usage ? <UsageSummary usage={usage} /> : null}
    </section>
  );
}
