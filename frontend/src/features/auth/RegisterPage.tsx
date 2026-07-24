import { useId, useState, type FormEvent } from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { ApiError } from "../../api/apiClient";
import {
  intendedLocationFromState,
} from "./AuthRoute";
import { useAuth } from "./AuthProvider";

type RegistrationErrors = {
  displayName?: string;
  email?: string;
  password?: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{12,128}$/;

function validateRegistration(
  displayName: string,
  email: string,
  password: string,
): RegistrationErrors {
  const errors: RegistrationErrors = {};
  const normalizedName = displayName.trim();

  if (
    normalizedName.length < 2 ||
    normalizedName.length > 100
  ) {
    errors.displayName = "Enter a display name between 2 and 100 characters.";
  }
  if (!emailPattern.test(email.trim()) || email.trim().length > 320) {
    errors.email = "Enter a valid email address.";
  }
  if (!passwordPattern.test(password)) {
    errors.password = "Password does not meet the requirements above.";
  }

  return errors;
}

export function RegisterPage() {
  const { register } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const displayNameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<RegistrationErrors>({});
  const [apiError, setApiError] = useState<{
    message: string;
    requestId?: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    const nextErrors = validateRegistration(
      displayName,
      email,
      password,
    );
    setErrors(nextErrors);
    setApiError(null);
    if (Object.keys(nextErrors).length > 0) return;

    setBusy(true);
    try {
      await register({
        displayName: displayName.trim(),
        email: email.trim(),
        password,
      });
      navigate(intendedLocationFromState(location.state), {
        replace: true,
      });
    } catch (error) {
      if (error instanceof ApiError) {
        setApiError({
          message: error.message,
          requestId: error.requestId,
        });
      } else {
        setApiError({
          message:
            "Account creation could not be completed. Please try again.",
        });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-layout">
      <section className="auth-card" aria-labelledby="register-heading">
        <Link className="product-link" to="/">
          Career &amp; Learning Hub
        </Link>
        <p className="eyebrow">Create your workspace</p>
        <h1 id="register-heading">Create your account</h1>
        <p className="auth-intro">
          Set up one secure account for your career and learning tools.
        </p>

        <form
          className="auth-form"
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="form-field">
            <label htmlFor={displayNameId}>Display name</label>
            <input
              id={displayNameId}
              type="text"
              autoComplete="name"
              maxLength={100}
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              aria-invalid={errors.displayName ? "true" : undefined}
              aria-describedby={
                errors.displayName
                  ? `${displayNameId}-error`
                  : undefined
              }
              disabled={busy}
            />
            {errors.displayName ? (
              <p
                className="field-error"
                id={`${displayNameId}-error`}
              >
                {errors.displayName}
              </p>
            ) : null}
          </div>

          <div className="form-field">
            <label htmlFor={emailId}>Email address</label>
            <input
              id={emailId}
              type="email"
              autoComplete="email"
              maxLength={320}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={errors.email ? "true" : undefined}
              aria-describedby={
                errors.email ? `${emailId}-error` : undefined
              }
              disabled={busy}
            />
            {errors.email ? (
              <p
                className="field-error"
                id={`${emailId}-error`}
              >
                {errors.email}
              </p>
            ) : null}
          </div>

          <div className="form-field">
            <label htmlFor={passwordId}>Password</label>
            <input
              id={passwordId}
              type="password"
              autoComplete="new-password"
              maxLength={128}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={errors.password ? "true" : undefined}
              aria-describedby={`${passwordId}-requirements${
                errors.password ? ` ${passwordId}-error` : ""
              }`}
              disabled={busy}
            />
            <p
              className="field-help"
              id={`${passwordId}-requirements`}
            >
              Use 12–128 characters with uppercase, lowercase, and a
              number.
            </p>
            {errors.password ? (
              <p
                className="field-error"
                id={`${passwordId}-error`}
              >
                {errors.password}
              </p>
            ) : null}
          </div>

          {apiError ? (
            <div className="form-error" role="alert">
              <p>{apiError.message}</p>
              {apiError.requestId ? (
                <p className="request-id">
                  Request ID: {apiError.requestId}
                </p>
              ) : null}
            </div>
          ) : null}

          <button className="primary-button" type="submit" disabled={busy}>
            {busy ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </section>
    </main>
  );
}
