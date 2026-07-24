import { useEffect, useMemo, useState } from "react";
import { ActivityFeed } from "./ActivityFeed";
import { DashboardLayout } from "./DashboardLayout";
import { fetchDashboardOverview } from "./dashboardApi";
import { ProgressWidgets } from "./ProgressWidgets";
import type { DashboardOverview } from "./types";
import "./dashboard.css";

interface MainDashboardProps {
  accessToken?: string;
  initialData?: DashboardOverview;
}

function ScoreTrend({
  title,
  points,
}: {
  title: string;
  points: Array<{
    id: string;
    score: number;
    occurredAt: string;
    label: string;
  }>;
}) {
  return (
    <section className="dashboard-panel">
      <header className="dashboard-panel-header">
        <div>
          <p className="dashboard-kicker">Actual results</p>
          <h3>{title}</h3>
        </div>
        <span className="dashboard-chip">{points.length}</span>
      </header>

      {points.length === 0 ? (
        <div className="dashboard-empty-state">
          No scored records are available.
        </div>
      ) : (
        <div className="dashboard-trend-list">
          {points.map((point) => (
            <article className="dashboard-trend-row" key={point.id}>
              <div>
                <strong>{point.label}</strong>
                <small>
                  {new Date(point.occurredAt).toLocaleDateString()}
                </small>
              </div>
              <div
                className="dashboard-score-track"
                aria-label={`${point.score} percent`}
              >
                <span
                  style={{
                    width: `${Math.max(
                      0,
                      Math.min(100, point.score),
                    )}%`,
                  }}
                />
              </div>
              <b>{Math.round(point.score)}%</b>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export function MainDashboard({
  accessToken,
  initialData,
}: MainDashboardProps) {
  const [windowDays, setWindowDays] = useState(30);
  const [data, setData] =
    useState<DashboardOverview | undefined>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!accessToken) return;

    let cancelled = false;
    setLoading(true);
    setError(undefined);

    void fetchDashboardOverview(accessToken, {
      windowDays,
      trendLimit: 12,
      activityLimit: 15,
      recentDocumentLimit: 6,
    })
      .then((nextData) => {
        if (!cancelled) setData(nextData);
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Dashboard data could not be loaded.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken, windowDays]);

  const interviewTrend = useMemo(
    () =>
      data?.interviews.trend.map((point) => ({
        id: point.attemptId,
        score: point.score,
        occurredAt: point.completedAt,
        label: "Interview feedback",
      })) ?? [],
    [data],
  );

  const quizTrend = useMemo(
    () =>
      data?.learning.quizPerformance.trend.map((point) => ({
        id: point.attemptId,
        score: point.scorePercent,
        occurredAt: point.completedAt,
        label: `${point.correctCount}/${point.questionCount} correct`,
      })) ?? [],
    [data],
  );

  return (
    <DashboardLayout
      title="Unified dashboard"
      subtitle="Resume, interview, learning, quiz, AI usage, and activity metrics derived only from records owned by the authenticated user."
      generatedAt={data?.generatedAt}
      controls={
        <label className="dashboard-window-control">
          Window
          <select
            value={windowDays}
            onChange={(event) =>
              setWindowDays(Number(event.target.value))
            }
          >
            <option value={7}>7 days</option>
            <option value={30}>30 days</option>
            <option value={90}>90 days</option>
            <option value={365}>365 days</option>
          </select>
        </label>
      }
    >
      {loading && (
        <div className="dashboard-status-message">
          Loading recorded progress…
        </div>
      )}

      {error && (
        <div
          className="dashboard-status-message dashboard-status-error"
          role="alert"
        >
          {error}
        </div>
      )}

      {!data && !loading && !error && (
        <div className="dashboard-status-message">
          Connect the authenticated access token to load the current
          user's recorded dashboard data.
        </div>
      )}

      {data && (
        <>
          <ProgressWidgets data={data} />

          <div className="dashboard-content-grid">
            <ScoreTrend
              title="Interview score trend"
              points={interviewTrend}
            />

            <ScoreTrend
              title="Quiz score trend"
              points={quizTrend}
            />

            <section
              className="dashboard-panel"
              aria-labelledby="recent-documents-title"
            >
              <header className="dashboard-panel-header">
                <div>
                  <p className="dashboard-kicker">Learning</p>
                  <h3 id="recent-documents-title">
                    Recent documents
                  </h3>
                </div>
                <span className="dashboard-chip">
                  {data.learning.documentCounts.total}
                </span>
              </header>

              <div className="dashboard-document-list">
                {data.learning.recentDocuments.length === 0 ? (
                  <div className="dashboard-empty-state">
                    No learning documents have been recorded.
                  </div>
                ) : (
                  data.learning.recentDocuments.map((document) => (
                    <article
                      className="dashboard-document-item"
                      key={document.documentId}
                    >
                      <div>
                        <strong>{document.title}</strong>
                        <small>
                          {document.pageCount} pages ·{" "}
                          {document.chunkCount} chunks
                        </small>
                      </div>
                      <span
                        className={`dashboard-document-status dashboard-document-${document.status}`}
                      >
                        {document.status}
                      </span>
                    </article>
                  ))
                )}
              </div>
            </section>

            <section
              className="dashboard-panel"
              aria-labelledby="ai-usage-title"
            >
              <header className="dashboard-panel-header">
                <div>
                  <p className="dashboard-kicker">Infrastructure</p>
                  <h3 id="ai-usage-title">AI usage</h3>
                </div>
                <span className="dashboard-chip">
                  {data.aiUsage.totalTokens.toLocaleString()} tokens
                </span>
              </header>

              <dl className="dashboard-usage-grid">
                <div>
                  <dt>Requests</dt>
                  <dd>{data.aiUsage.requestCount}</dd>
                </div>
                <div>
                  <dt>Average latency</dt>
                  <dd>
                    {data.aiUsage.averageLatencyMs === null
                      ? "No data"
                      : `${Math.round(
                          data.aiUsage.averageLatencyMs,
                        )} ms`}
                  </dd>
                </div>
                <div>
                  <dt>Estimated cost</dt>
                  <dd>
                    ${data.aiUsage.estimatedCostUsd.toFixed(4)}
                  </dd>
                </div>
                <div>
                  <dt>Costed events</dt>
                  <dd>{data.aiUsage.estimatedCostEventCount}</dd>
                </div>
              </dl>

              <div className="dashboard-feature-list">
                {data.aiUsage.byFeature.map((feature) => (
                  <article key={feature.feature}>
                    <span>{feature.feature}</span>
                    <strong>{feature.requestCount}</strong>
                  </article>
                ))}
              </div>
            </section>

            <ActivityFeed events={data.recentActivity} />
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
