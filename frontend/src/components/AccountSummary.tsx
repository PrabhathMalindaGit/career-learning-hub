interface AccountSummaryProps {
  displayName?: string | null;
  email?: string | null;
}

export function AccountSummary({
  displayName,
  email,
}: AccountSummaryProps) {
  const normalizedDisplayName = displayName?.trim() || "Account";
  const normalizedEmail = email?.trim();

  return (
    <div
      className="session-summary__text account-summary"
      role="group"
      aria-label="Signed in account"
    >
      <span>{normalizedDisplayName}</span>
      {normalizedEmail ? (
        <small title={normalizedEmail}>{normalizedEmail}</small>
      ) : null}
    </div>
  );
}
