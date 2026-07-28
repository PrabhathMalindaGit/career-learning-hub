import { useRef, useState } from "react";
import { Dialog } from "../../components/Dialog";
import type { ResumeAnalysis } from "./types";

interface AiRecommendationsProps {
  analysis?: ResumeAnalysis;
  selectedSuggestionIds: Set<string>;
  onToggleSuggestion(suggestionId: string): void;
  onConfirmApply(): void;
  busy?: boolean;
  stale?: boolean;
}

export function AiRecommendations({
  analysis,
  selectedSuggestionIds,
  onToggleSuggestion,
  onConfirmApply,
  busy = false,
  stale = false,
}: AiRecommendationsProps) {
  const [confirming, setConfirming] = useState(false);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const applyButtonRef = useRef<HTMLButtonElement>(null);

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
        <span className="resume-score">
          {analysis === undefined ? "—" : analysis.totalScore}
        </span>
      </header>

      <p className="resume-disclaimer">
        This is AI-assisted guidance, not an employer decision or a
        certified applicant-tracking-system result. Review every change
        for accuracy.
      </p>

      {stale ? (
        <p className="resume-notice resume-notice-warning">
          This assessment is stale.
        </p>
      ) : null}

      {analysis === undefined ? (
        <div className="resume-empty-state">
          Run an assessment for the current saved version to see
          evidence-bounded guidance.
        </div>
      ) : (
        <>
          <dl className="resume-score-grid">
            <div>
              <dt>Keyword match</dt>
              <dd>{analysis.scoreBreakdown.keywordMatch}/25</dd>
            </div>
            <div>
              <dt>Clarity</dt>
              <dd>{analysis.scoreBreakdown.clarity}/25</dd>
            </div>
            <div>
              <dt>Evidence</dt>
              <dd>{analysis.scoreBreakdown.evidence}/25</dd>
            </div>
            <div>
              <dt>Formatting</dt>
              <dd>{analysis.scoreBreakdown.formatting}/25</dd>
            </div>
          </dl>

          {analysis.strengths.length > 0 ? (
            <section className="resume-analysis-section">
              <h3>Strengths</h3>
              <ul>
                {analysis.strengths.map((strength) => (
                  <li key={`${strength.title}-${strength.detail}`}>
                    <strong>{strength.title}</strong>
                    <span>{strength.detail}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {analysis.issues.length > 0 ? (
            <section className="resume-analysis-section">
              <h3>Review points</h3>
              <ul>
                {analysis.issues.map((issue) => (
                  <li key={`${issue.code}-${issue.message}`}>
                    <span className={`resume-severity resume-severity-${issue.severity}`}>
                      {issue.severity}
                    </span>
                    <span>{issue.message}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {analysis.missingKeywords.length > 0 ? (
            <section className="resume-analysis-section">
              <h3>Potential missing keywords</h3>
              <div className="resume-chip-list">
                {analysis.missingKeywords.map((keyword) => (
                  <span key={keyword}>{keyword}</span>
                ))}
              </div>
            </section>
          ) : null}

          <section className="resume-analysis-section">
            <h3>Suggested rewrites</h3>
            {analysis.suggestions.length === 0 ? (
              <p>No rewrites were suggested for this version.</p>
            ) : (
              <div className="resume-suggestion-list">
                {analysis.suggestions.map((suggestion) => (
                  <label className="resume-suggestion" key={suggestion.id}>
                    <input
                      type="checkbox"
                      checked={selectedSuggestionIds.has(suggestion.id)}
                      disabled={busy || stale}
                      onChange={() => onToggleSuggestion(suggestion.id)}
                    />
                    <span>
                      <strong>{suggestion.rewrittenText}</strong>
                      <small>{suggestion.rationale}</small>
                      {suggestion.verificationRequired ? (
                        <em>
                          Verify facts and placeholders before accepting.
                        </em>
                      ) : null}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <button
        ref={applyButtonRef}
        type="button"
        className="resume-primary-button"
        disabled={
          busy ||
          stale ||
          analysis === undefined ||
          selectedSuggestionIds.size === 0
        }
        onClick={() => setConfirming(true)}
      >
        Apply selected suggestions
      </button>

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
