import { useRef, useState } from "react";
import { Dialog } from "../../components/Dialog";
import { ResumeSuggestionComparison } from "./ResumeSuggestionComparison";
import type { ResumeAnalysis } from "./types";

interface AiRecommendationsProps {
  analysis?: ResumeAnalysis;
  selectedSuggestionIds: Set<string>;
  onToggleSuggestion(suggestionId: string): void;
  onConfirmApply(): void;
  busy?: boolean;
  loading?: boolean;
  stale?: boolean;
}

const SCORE_CATEGORIES = [
  {
    key: "keywordMatch",
    label: "Keyword match",
    tone: "keyword",
  },
  { key: "clarity", label: "Clarity", tone: "clarity" },
  { key: "evidence", label: "Evidence", tone: "evidence" },
  { key: "formatting", label: "Formatting", tone: "formatting" },
] as const;

const SEVERITY_LABELS: Record<
  ResumeAnalysis["issues"][number]["severity"],
  string
> = {
  low: "Low severity",
  medium: "Medium severity",
  high: "High severity",
};

function AssessmentGauge({ score }: { score: number }) {
  const accessibleLabel = `Resume assessment score: ${score} out of 100`;

  return (
    <figure className="resume-assessment-gauge">
      <div className="resume-assessment-gauge-visual">
        <svg
          viewBox="0 0 300 172"
          role="img"
          aria-label={accessibleLabel}
          preserveAspectRatio="xMidYMid meet"
        >
          <path
            className="resume-assessment-gauge-track"
            d="M 20 155 A 130 130 0 0 1 280 155"
            pathLength="100"
          />
          <path
            className="resume-assessment-gauge-value"
            data-assessment-score-arc
            d="M 20 155 A 130 130 0 0 1 280 155"
            pathLength="100"
            strokeDasharray={`${score} 100`}
          />
        </svg>
        <div className="resume-assessment-gauge-reading" aria-hidden="true">
          <span>Resume assessment</span>
          <strong>{score}</strong>
          <small>out of 100</small>
        </div>
      </div>
      <figcaption>
        A bounded assessment of the current saved version.
      </figcaption>
    </figure>
  );
}

function AssessmentState({
  loading,
}: {
  loading: boolean;
}) {
  return (
    <div
      className={`resume-assessment-state${
        loading ? " resume-assessment-state--loading" : ""
      }`}
      role={loading ? "status" : undefined}
      aria-label={loading ? "Assessment running" : undefined}
    >
      <span className="resume-assessment-state-mark" aria-hidden="true">
        {loading ? "···" : "○"}
      </span>
      <div>
        <h3>{loading ? "Assessment running" : "No assessment yet"}</h3>
        <p>
          {loading
            ? "Checking the current saved version. Scores will appear only after the assessment completes."
            : "Run an assessment for the current saved version to see evidence-bounded guidance."}
        </p>
      </div>
    </div>
  );
}

export function AiRecommendations({
  analysis,
  selectedSuggestionIds,
  onToggleSuggestion,
  onConfirmApply,
  busy = false,
  loading = false,
  stale = false,
}: AiRecommendationsProps) {
  const [confirming, setConfirming] = useState(false);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const applyButtonRef = useRef<HTMLButtonElement>(null);
  const resultState = loading
    ? "Assessment running"
    : stale
      ? "Stale assessment"
      : analysis === undefined
        ? "Awaiting assessment"
        : "Completed result";

  return (
    <aside
      className="resume-panel resume-ai-panel"
      aria-labelledby="resume-ai-title"
    >
      <header className="resume-panel-header">
        <div>
          <p className="resume-kicker">Saved-version guidance</p>
          <h2 id="resume-ai-title">AI-assisted assessment</h2>
        </div>
        <span
          className={`resume-assessment-status${
            stale ? " resume-assessment-status--stale" : ""
          }`}
        >
          {resultState}
        </span>
      </header>

      <p className="resume-disclaimer">
        This is AI-assisted guidance for the current saved version, not
        an employer decision or a certified result. Review every change
        for accuracy.
      </p>

      {stale ? (
        <div
          className="resume-assessment-stale resume-notice resume-notice-warning"
          role="status"
        >
          <strong>This assessment is stale.</strong>
          <span>
            A newer saved version exists. Run a new assessment before
            selecting suggestions.
          </span>
        </div>
      ) : null}

      {loading ? (
        <AssessmentState loading />
      ) : analysis === undefined ? (
        <AssessmentState loading={loading} />
      ) : (
        <>
          <section
            className="resume-assessment-overview"
            aria-labelledby="resume-assessment-overview-title"
          >
            <AssessmentGauge score={analysis.totalScore} />
            <div className="resume-assessment-overview-copy">
              <p className="resume-kicker">Current saved version</p>
              <h3 id="resume-assessment-overview-title">
                Guidance for {analysis.target.role}
              </h3>
              <p>
                The score and review points below come from this
                completed assessment only. They do not predict hiring
                outcomes.
              </p>
              <div className="resume-assessment-facts">
                <span>AI-assisted guidance</span>
                <span>Saved-version result</span>
              </div>
            </div>
          </section>

          <section
            className="resume-analysis-section resume-score-breakdown"
            aria-labelledby="resume-score-breakdown-title"
          >
            <header className="resume-analysis-section-header">
              <div>
                <p className="resume-kicker">Four scored categories</p>
                <h3 id="resume-score-breakdown-title">Score breakdown</h3>
              </div>
              <span>Each category is scored out of 25</span>
            </header>
            <dl className="resume-score-grid">
              {SCORE_CATEGORIES.map((category) => {
                const score = analysis.scoreBreakdown[category.key];
                return (
                  <div
                    key={category.key}
                    className={`resume-score-card resume-score-card--${category.tone}`}
                  >
                    <div className="resume-score-card-heading">
                      <dt>{category.label}</dt>
                      <dd>
                        <strong>{score}</strong>
                        <span>/25</span>
                      </dd>
                    </div>
                    <div
                      className="resume-score-progress"
                      role="progressbar"
                      aria-label={category.label}
                      aria-valuemin={0}
                      aria-valuemax={25}
                      aria-valuenow={score}
                    >
                      <span style={{ width: `${(score / 25) * 100}%` }} />
                    </div>
                    <small>Current category score</small>
                  </div>
                );
              })}
            </dl>
          </section>

          <div className="resume-analysis-details">
            <div className="resume-analysis-insights">
              <section className="resume-analysis-section resume-strengths-panel">
                <header className="resume-analysis-section-header">
                  <div>
                    <p className="resume-kicker">Positive signals</p>
                    <h3>Strengths</h3>
                  </div>
                  <span>{analysis.strengths.length}</span>
                </header>
                {analysis.strengths.length > 0 ? (
                  <ol className="resume-strength-list">
                    {analysis.strengths.map((strength, index) => (
                      <li key={`${strength.title}-${strength.detail}`}>
                        <span
                          className="resume-strength-number"
                          aria-hidden="true"
                        >
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <div>
                          <strong>{strength.title}</strong>
                          <span>{strength.detail}</span>
                        </div>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="resume-analysis-empty">
                    No strengths were returned.
                  </p>
                )}
              </section>

              <section className="resume-analysis-section resume-issues-panel">
                <header className="resume-analysis-section-header">
                  <div>
                    <p className="resume-kicker">Needs review</p>
                    <h3>Review points</h3>
                  </div>
                  <span>{analysis.issues.length}</span>
                </header>
                {analysis.issues.length > 0 ? (
                  <ul className="resume-issue-list">
                    {analysis.issues.map((issue) => (
                      <li key={`${issue.code}-${issue.message}`}>
                        <span
                          className={`resume-severity resume-severity-${issue.severity}`}
                        >
                          {SEVERITY_LABELS[issue.severity]}
                        </span>
                        <p>{issue.message}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="resume-analysis-empty">
                    No review points were returned.
                  </p>
                )}
              </section>
            </div>

            <section className="resume-analysis-section resume-keywords-panel">
              <header className="resume-analysis-section-header">
                <div>
                  <p className="resume-kicker">Terms to consider</p>
                  <h3>Potential missing keywords</h3>
                </div>
                <span>{analysis.missingKeywords.length}</span>
              </header>
              <p className="resume-analysis-supporting-copy">
                Review these terms against your actual experience. They
                are not instructions to insert words automatically.
              </p>
              {analysis.missingKeywords.length > 0 ? (
                <ul className="resume-chip-list">
                  {analysis.missingKeywords.map((keyword) => (
                    <li className="resume-keyword-chip" key={keyword}>
                      <span aria-hidden="true">+</span>
                      {keyword}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="resume-analysis-empty">
                  No missing terms were returned.
                </p>
              )}
            </section>
          </div>

          <section className="resume-analysis-section resume-suggestions-panel">
            <header className="resume-analysis-section-header">
              <div>
                <p className="resume-kicker">Review before applying</p>
                <h3>Suggested rewrites</h3>
              </div>
              <span>
                {selectedSuggestionIds.size} selected of{" "}
                {analysis.suggestions.length}
              </span>
            </header>
            {analysis.suggestions.length === 0 ? (
              <p className="resume-analysis-empty">
                No rewrites were suggested for this version.
              </p>
            ) : (
              <div className="resume-suggestion-list">
                {analysis.suggestions.map((suggestion, index) => (
                  <ResumeSuggestionComparison
                    key={suggestion.id}
                    suggestion={suggestion}
                    position={index + 1}
                    selected={selectedSuggestionIds.has(suggestion.id)}
                    disabled={busy || stale}
                    onToggle={() => onToggleSuggestion(suggestion.id)}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <div className="resume-assessment-actions">
        <div>
          <strong>Changes stay explicit</strong>
          <span>
            Applying selected suggestions creates a new immutable
            version.
          </span>
        </div>
        <button
          ref={applyButtonRef}
          type="button"
          className="resume-primary-button"
          disabled={
            busy ||
            loading ||
            stale ||
            analysis === undefined ||
            selectedSuggestionIds.size === 0
          }
          onClick={() => setConfirming(true)}
        >
          {/* Feature 3.10 UI — Apply selected AI suggestions. */}
          Apply selected suggestions
        </button>
      </div>

      <Dialog
        open={confirming}
        className="resume-dialog"
        labelledBy="resume-apply-dialog-title"
        describedBy="resume-apply-dialog-description"
        initialFocusRef={cancelButtonRef}
        returnFocusRef={applyButtonRef}
        onCancel={() => setConfirming(false)}
        canDismissOnBackdrop
      >
        <h2 id="resume-apply-dialog-title">
          Apply selected suggestions
        </h2>
        <p id="resume-apply-dialog-description">
          This creates a new immutable resume version. Review the
          resulting content for accuracy; this assessment will become
          stale.
        </p>
        <div className="resume-dialog-actions">
          <button
            type="button"
            ref={cancelButtonRef}
            onClick={() => setConfirming(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="resume-primary-button"
            disabled={busy}
            onClick={() => {
              setConfirming(false);
              onConfirmApply();
            }}
          >
            Create new version
          </button>
        </div>
      </Dialog>
    </aside>
  );
}
