import { useAuth } from "./AuthProvider";

export function SettingsPage() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <section className="workspace-section" aria-labelledby="settings-heading">
      <p className="eyebrow">Account and session</p>
      <h1 id="settings-heading">Session settings</h1>
      <p className="section-intro">
        Review the public account details associated with this browser
        session.
      </p>

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
          <dd className="status-value">{user.accountStatus}</dd>
        </div>
      </dl>

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
  );
}
