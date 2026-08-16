import { PageHeader } from "../../components/PageHeader";
import { AiUsageDiagnosticsSettingsSection } from "./AiUsageDiagnosticsSettings";
import { useAuth } from "./AuthProvider";
import { GeminiConnectionSettingsSection } from "./GeminiConnectionSettings";

// Features 6.10–6.11 — Settings composition.
// Combines Gemini controls, bounded AI-usage diagnostics, account information,
// and explicit current-session sign-out without exposing credential plaintext.
export function SettingsPage() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <section
      className="settings-page"
      aria-labelledby="settings-heading"
    >
      <PageHeader
        className="settings-heading"
        heading={
          <>
            <p className="eyebrow">Account, AI, and session</p>
            <h1 id="settings-heading">Settings</h1>
          </>
        }
        description={
          <p>
            Review your Gemini connection, AI usage, account, and current browser session.
          </p>
        }
      />

      <div className="settings-content-grid">
        <GeminiConnectionSettingsSection />
        <AiUsageDiagnosticsSettingsSection />

        <section
          className="settings-panel"
          aria-labelledby="account-information-heading"
        >
          <header className="settings-panel__header">
            <h2 id="account-information-heading">
              Account information
            </h2>
            <p>
              Public details currently associated with your account.
            </p>
          </header>

          <dl className="settings-list">
            <div>
              <dt>Display name</dt>
              <dd>{user.profile.displayName}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{user.email}</dd>
            </div>
            {user.profile.headline ? (
              <div>
                <dt>Headline</dt>
                <dd>{user.profile.headline}</dd>
              </div>
            ) : null}
            <div>
              <dt>Account status</dt>
              <dd className="status-value">
                {user.accountStatus}
              </dd>
            </div>
          </dl>
        </section>

        <section
          className="settings-panel settings-session-panel"
          aria-labelledby="current-session-heading"
        >
          <header className="settings-panel__header">
            <h2 id="current-session-heading">Current session</h2>
            <p>
              Sign out when you have finished using this browser.
            </p>
          </header>

          <div className="settings-actions">
            <button
              className="secondary-button"
              type="button"
              onClick={() => {
                void logout().catch(() => undefined);
              }}
            >
              Sign out of this session
            </button>
          </div>
        </section>
      </div>
    </section>
  );
}
