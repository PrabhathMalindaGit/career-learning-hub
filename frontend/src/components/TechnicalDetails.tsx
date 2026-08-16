import "./TechnicalDetails.css";

interface TechnicalDetailsProps {
  requestId?: string;
  className?: string;
}

export function TechnicalDetails({
  requestId,
  className,
}: TechnicalDetailsProps) {
  if (!requestId) return null;

  return (
    <details
      className={["technical-details", className].filter(Boolean).join(" ")}
    >
      <summary>Technical details</summary>
      <p className="request-id">Request ID: {requestId}</p>
    </details>
  );
}
