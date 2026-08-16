import type { ReactNode } from "react";
import { TechnicalDetails } from "./TechnicalDetails";

export type StateSurfaceMode = "static" | "status" | "alert";

interface StateSurfaceProps {
  mode: StateSurfaceMode;
  heading?: ReactNode;
  body?: ReactNode;
  actions?: ReactNode;
  requestId?: string;
  className?: string;
}

export function StateSurface({
  mode,
  heading,
  body,
  actions,
  requestId,
  className,
}: StateSurfaceProps) {
  const role = mode === "static" ? undefined : mode;

  return (
    <div
      className={["state-surface", className].filter(Boolean).join(" ")}
      role={role}
    >
      {heading}
      {body}
      <TechnicalDetails requestId={requestId} />
      {actions}
    </div>
  );
}
