export function InterviewSessionSkeleton() {
  return (
    <div
      className="interview-session-skeleton"
      aria-hidden="true"
    >
      <span className="interview-session-skeleton__mark" />
      <span className="interview-session-skeleton__copy">
        <span />
        <span />
        <span />
      </span>
      <span className="interview-session-skeleton__ledger" />
    </div>
  );
}

export function InterviewSessionSkeletonList() {
  return (
    <div
      className="interview-session-skeleton-list"
      role="status"
      aria-label="Loading interview sessions"
    >
      <span className="sr-only">Loading interview sessions…</span>
      {Array.from({ length: 3 }, (_, index) => (
        <InterviewSessionSkeleton key={index} />
      ))}
    </div>
  );
}
