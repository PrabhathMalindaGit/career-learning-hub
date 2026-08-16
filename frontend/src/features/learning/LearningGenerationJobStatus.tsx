import type { ReactNode } from "react";
import { StateSurface } from "../../components/StateSurface";

export type LearningGenerationPresentationState =
  | "queued"
  | "processing"
  | "paused"
  | "failed"
  | "unavailable"
  | "cancelled"
  | "completed";

interface LearningGenerationJobStatusProps {
  status: LearningGenerationPresentationState;
  message: ReactNode;
  actions?: ReactNode;
  requestId?: string;
}

export function LearningGenerationJobStatus({
  status,
  message,
  actions,
  requestId,
}: LearningGenerationJobStatusProps) {
  const failed = status === "failed" || status === "unavailable";
  const mode = failed
    ? "alert"
    : status === "paused"
      ? "static"
      : "status";

  return (
    <StateSurface
      mode={mode}
      className={[
        "learning-response-status",
        failed ? "learning-state--error" : undefined,
      ]
        .filter(Boolean)
        .join(" ")}
      body={message}
      actions={actions}
      requestId={failed ? requestId : undefined}
    />
  );
}
