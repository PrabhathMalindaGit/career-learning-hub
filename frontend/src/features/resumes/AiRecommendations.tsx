import type { ResumeSuggestion } from "./types";

interface AiRecommendationsProps {
  readinessScore?: number;
  suggestions: ResumeSuggestion[];
  selectedSuggestionIds: Set<string>;
  onToggleSuggestion(suggestionId: string): void;
  onApplySelected(): void;
  busy?: boolean;
}

export function AiRecommendations({
  readinessScore,
  suggestions,
  selectedSuggestionIds,
  onToggleSuggestion,
  onApplySelected,
  busy = false,
}: AiRecommendationsProps) {
  return (
    <aside
      className="resume-panel resume-ai-panel"
      aria-labelledby="resume-ai-title"
    >
      <header className="resume-panel-header">
        <div>
          <p className="resume-kicker">Analysis</p>
          <h2 id="resume-ai-title">AI recommendations</h2>
        </div>
        <span className="resume-score">
          {readinessScore === undefined ? "—" : readinessScore}
        </span>
      </header>

      <p className="resume-disclaimer">
        This is an AI-estimated readiness score, not a result from an
        employer's applicant-tracking system.
      </p>

      <div className="resume-suggestion-list">
        {suggestions.length === 0 ? (
          <div className="resume-empty-state">
            Run an analysis to generate evidence-bounded suggestions.
          </div>
        ) : (
          suggestions.map((suggestion) => (
            <label className="resume-suggestion" key={suggestion.id}>
              <input
                type="checkbox"
                checked={selectedSuggestionIds.has(suggestion.id)}
                onChange={() => onToggleSuggestion(suggestion.id)}
              />
              <span>
                <strong>{suggestion.rewrittenText}</strong>
                <small>{suggestion.rationale}</small>
                {suggestion.verificationRequired && (
                  <em>Verify facts and placeholders before accepting.</em>
                )}
              </span>
            </label>
          ))
        )}
      </div>

      <button
        type="button"
        className="resume-primary-button"
        disabled={busy || selectedSuggestionIds.size === 0}
        onClick={onApplySelected}
      >
        Apply selected as new version
      </button>
    </aside>
  );
}
