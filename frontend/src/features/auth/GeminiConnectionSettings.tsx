import type { GeminiConnectionSettings } from "@career-learning-hub/shared-types";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { ApiError } from "../../api/apiClient";
import { Dialog } from "../../components/Dialog";
import {
  activateGeminiSource,
  deletePersonalGeminiKey,
  disconnectGemini,
  fetchGeminiSettings,
  saveAndTestPersonalGeminiKey,
  testGeminiConnection,
} from "./geminiSettingsApi";

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return `${error.message}${error.requestId ? ` Request ID: ${error.requestId}` : ""}`;
  }
  return "The Gemini connection could not be updated. Try again.";
}

function testedAt(value: string | undefined): string {
  if (!value) return "Not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not available"
    : new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}

// Features 6.1–6.9 — Gemini connection management.
// Presents application-managed/personal/disconnected modes, connection tests,
// personal-key replacement, disconnection, and explicit key deletion.
export function GeminiConnectionSettingsSection() {
  const [settings, setSettings] = useState<GeminiConnectionSettings>();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [editingKey, setEditingKey] = useState(false);
  const [candidateKey, setCandidateKey] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const deleteButtonRef = useRef<HTMLButtonElement>(null);
  const cancelDeleteButtonRef = useRef<HTMLButtonElement>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    const next = await fetchGeminiSettings(signal);
    setSettings(next);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    void load(controller.signal)
      .catch((loadError: unknown) => {
        if (!controller.signal.aborted) setError(errorMessage(loadError));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [load]);

  const mutate = async (
    operation: () => Promise<void>,
    successMessage: string,
  ) => {
    if (busy) return;
    setBusy(true);
    setError(undefined);
    setNotice(undefined);
    try {
      await operation();
      await load();
      setNotice(successMessage);
      setEditingKey(false);
    } catch (mutationError) {
      setError(errorMessage(mutationError));
    } finally {
      setCandidateKey("");
      setBusy(false);
    }
  };

  const submitCandidate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!settings || candidateKey.length < 8 || busy) return;
    const candidate = candidateKey;
    setCandidateKey("");
    void mutate(async () => {
      await saveAndTestPersonalGeminiKey(
        candidate,
        settings.credential?.revision,
      );
      if (settings.mode !== "personal") {
        await activateGeminiSource("user-managed", settings.preferenceRevision);
      }
    }, settings.mode === "personal"
      ? "Personal Gemini key replaced and tested."
      : "Personal Gemini key connected and tested.");
  };

  const cancelKeyEntry = () => {
    setCandidateKey("");
    setEditingKey(false);
    setError(undefined);
  };

  const statusTitle = settings?.mode === "disconnected"
    ? "Gemini is disconnected"
    : "Connected";
  const statusDescription = settings?.mode === "application-managed"
    ? "Managed by Career Learning Hub"
    : settings?.mode === "personal"
      ? "Personal key"
      : "AI features require a Gemini connection.";

  return (
    <section
      className="settings-panel settings-gemini-panel"
      aria-labelledby="gemini-connection-heading"
      aria-busy={busy || loading}
    >
      <header className="settings-panel__header settings-gemini-header">
        <div>
          <p className="settings-panel__eyebrow">AI connection</p>
          {/* =========================================================
              FIND: GEMINI CONNECTION
              STYLE: styles.css
              SELECTOR: .gemini-status
              BACKEND: aiProvider.service.ts -> FIND: GEMINI CONNECTION BACKEND
              ========================================================= */}
          {/* Feature 6.1 UI — Gemini connection status. */}
          <h2 id="gemini-connection-heading">Gemini connection</h2>
          <p>Control which Gemini credential Career Learning Hub uses for your AI jobs.</p>
        </div>
        {settings ? (
          <span className={`gemini-status gemini-status--${settings.mode}`}>
            {settings.mode === "disconnected" ? "Disconnected" : "Connected"}
          </span>
        ) : null}
      </header>

      {loading ? (
        <p className="gemini-state-copy" role="status">Loading Gemini connection…</p>
      ) : settings ? (
        <>
          <div className="gemini-connection-summary">
            <div>
              <span>Status</span>
              <strong>{statusTitle}</strong>
              <p>{statusDescription}</p>
            </div>
            <div>
              <span>Model</span>
              {/* =========================================================
                  FIND: GEMINI MODEL
                  STYLE: styles.css
                  SELECTOR: .gemini-model
                  BACKEND: geminiPolicy.ts -> FIND: GEMINI MODEL BACKEND
                  ========================================================= */}
              {/* Feature 6.2 UI — Fixed Gemini model. */}
              <strong className="gemini-model">{settings.model}</strong>
              <p>Fixed for secure, predictable AI workflows.</p>
            </div>
            {settings.mode === "personal" && settings.credential ? (
              <>
                <div>
                  <span>Saved key</span>
                  <strong>{settings.credential.maskedSuffix}</strong>
                  <p>The complete key is never returned to this browser.</p>
                </div>
                <div>
                  <span>Last tested</span>
                  <strong>{testedAt(settings.credential.lastValidatedAt)}</strong>
                </div>
              </>
            ) : null}
          </div>

          {error ? <p className="gemini-message gemini-message--error" role="alert">{error}</p> : null}
          {notice ? <p className="gemini-message gemini-message--success" role="status">{notice}</p> : null}

          {editingKey ? (
            <form className="gemini-key-form" onSubmit={submitCandidate}>
              <label htmlFor="personal-gemini-api-key">Personal Gemini API key</label>
              <p id="personal-gemini-key-help">
                The key is tested once before encrypted storage. It is cleared from this form when the request finishes.
              </p>
              <input
                id="personal-gemini-api-key"
                type="password"
                autoComplete="new-password"
                minLength={8}
                maxLength={512}
                spellCheck={false}
                aria-describedby="personal-gemini-key-help"
                value={candidateKey}
                disabled={busy}
                onChange={(event) => setCandidateKey(event.target.value)}
              />
              <div className="gemini-action-row">
                {/* =========================================================
                    FIND: SAVE GEMINI KEY
                    STYLE: styles.css -> .primary-button
                    BACKEND: aiProvider.service.ts -> FIND: PERSONAL GEMINI KEY BACKEND
                    ========================================================= */}
                <button className="primary-button" type="submit" disabled={busy || candidateKey.length < 8}>
                  {/* Feature 6.5 UI — Save and test personal key. */}
                  {busy ? "Testing…" : "Save and test"}
                </button>
                <button className="secondary-button" type="button" disabled={busy} onClick={cancelKeyEntry}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="gemini-action-row">
              {settings.mode !== "disconnected" ? (
                /* =========================================================
                   FIND: TEST GEMINI CONNECTION
                   STYLE: styles.css -> .secondary-button
                   BACKEND: aiProvider.service.ts -> FIND: TEST GEMINI CONNECTION BACKEND
                   ========================================================= */
                <button
                  className="secondary-button"
                  type="button"
                  disabled={busy}
                  onClick={() => void mutate(
                    () => testGeminiConnection(settings),
                    "Gemini connection tested successfully.",
                  )}
                >
                  {/* Feature 6.6 UI — Test Gemini connection. */}
                  Test connection
                </button>
              ) : null}
              {settings.mode === "disconnected" && settings.administratorManagedAvailable ? (
                /* =========================================================
                   FIND: APPLICATION GEMINI
                   STYLE: styles.css -> .primary-button
                   BACKEND: aiProvider.service.ts -> FIND: APPLICATION GEMINI BACKEND
                   ========================================================= */
                <button
                  className="primary-button"
                  type="button"
                  disabled={busy}
                  onClick={() => void mutate(
                    () => activateGeminiSource(
                      "administrator-managed",
                      settings.preferenceRevision,
                    ),
                    "Application-managed Gemini connected.",
                  )}
                >
                  {/* Feature 6.3 UI — Use application-managed Gemini. */}
                  Use application-managed Gemini
                </button>
              ) : null}
              {/* =========================================================
                  FIND: PERSONAL GEMINI KEY
                  FIND: REPLACE GEMINI KEY
                  STYLE: styles.css -> .secondary-button
                  BACKEND: aiProvider.service.ts -> FIND: PERSONAL GEMINI KEY BACKEND
                  ========================================================= */}
              <button
                className="secondary-button"
                type="button"
                disabled={busy}
                onClick={() => setEditingKey(true)}
              >
                {/* Feature 6.4 UI — Connect a personal Gemini key. */}
                {/* Feature 6.7 UI — Replace personal Gemini key. */}
                {settings.mode === "disconnected"
                  ? "Connect a personal key"
                  : settings.mode === "personal"
                    ? "Replace key"
                    : "Connect personal key"}
              </button>
              {settings.mode === "application-managed" ? (
                /* =========================================================
                   FIND: DISCONNECT GEMINI
                   STYLE: styles.css -> .secondary-button
                   BACKEND: aiProvider.service.ts -> FIND: APPLICATION GEMINI BACKEND
                   ========================================================= */
                <button
                  className="secondary-button"
                  type="button"
                  disabled={busy}
                  onClick={() => void mutate(
                    () => disconnectGemini(settings.preferenceRevision),
                    "Gemini disconnected.",
                  )}
                >
                  {/* Feature 6.8 UI — Disconnect Gemini source. */}
                  Disconnect
                </button>
              ) : null}
              {settings.mode === "personal" && settings.credential ? (
                /* =========================================================
                   FIND: DELETE GEMINI KEY
                   STYLE: styles.css -> .destructive-button
                   BACKEND: aiProvider.service.ts -> FIND: DELETE GEMINI KEY BACKEND
                   ========================================================= */
                <button
                  ref={deleteButtonRef}
                  className="destructive-button"
                  type="button"
                  disabled={busy}
                  onClick={() => setConfirmingDelete(true)}
                >
                  {/* Feature 6.9 UI — Delete personal Gemini key. */}
                  Delete key
                </button>
              ) : null}
            </div>
          )}
        </>
      ) : (
        <div>
          <p className="gemini-message gemini-message--error" role="alert">{error}</p>
          <button className="secondary-button" type="button" onClick={() => {
            setError(undefined);
            setLoading(true);
            void load().catch((loadError: unknown) => setError(errorMessage(loadError))).finally(() => setLoading(false));
          }}>Retry</button>
        </div>
      )}

      <Dialog
        open={confirmingDelete}
        className="settings-dialog"
        labelledBy="delete-gemini-key-title"
        describedBy="delete-gemini-key-description"
        initialFocusRef={cancelDeleteButtonRef}
        returnFocusRef={deleteButtonRef}
        onCancel={() => setConfirmingDelete(false)}
        canDismissOnBackdrop
      >
        <h2 id="delete-gemini-key-title">Delete personal Gemini key?</h2>
        <p id="delete-gemini-key-description">
          New AI jobs will remain disconnected. Already authorized work follows the existing execution lease.
        </p>
        <div className="settings-dialog__actions">
          <button ref={cancelDeleteButtonRef} type="button" onClick={() => setConfirmingDelete(false)}>
            Keep key
          </button>
          <button
            className="destructive-button"
            type="button"
            disabled={busy || !settings?.credential}
            onClick={() => {
              const revision = settings?.credential?.revision;
              if (revision === undefined) return;
              setConfirmingDelete(false);
              void mutate(
                () => deletePersonalGeminiKey(revision),
                "Personal Gemini key deleted.",
              );
            }}
          >
            Delete key
          </button>
        </div>
      </Dialog>
    </section>
  );
}
