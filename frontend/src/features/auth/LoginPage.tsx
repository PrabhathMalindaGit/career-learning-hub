import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { ApiError } from "../../api/apiClient";
import {
  authenticationReasonFromState,
  intendedLocationFromState,
} from "./AuthRoute";
import { BrandLockup } from "../../components/BrandLockup";
import { TechnicalDetails } from "../../components/TechnicalDetails";
import { AuthenticationShell } from "./AuthenticationShell";
import { useAuth } from "./AuthProvider";
import "./authPhase19e.css";

type LoginErrors = {
  email?: string;
  password?: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateLogin(
  email: string,
  password: string,
): LoginErrors {
  const errors: LoginErrors = {};

  if (!emailPattern.test(email.trim()) || email.trim().length > 320) {
    errors.email = "Enter a valid email address.";
  }
  if (!password || password.length > 128) {
    errors.password = "Enter your password.";
  }

  return errors;
}

export function LoginPage() {
  const { login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const emailId = useId();
  const passwordId = useId();
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const apiErrorRef = useRef<HTMLDivElement>(null);
  const validationFocusRequestedRef = useRef(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [apiError, setApiError] = useState<{
    message: string;
    requestId?: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!validationFocusRequestedRef.current) return;
    validationFocusRequestedRef.current = false;

    const errorFields = Object.keys(errors) as (keyof LoginErrors)[];
    if (errorFields.length > 1) {
      errorSummaryRef.current?.focus();
    } else if (errorFields[0] === "email") {
      emailRef.current?.focus();
    } else if (errorFields[0] === "password") {
      passwordRef.current?.focus();
    }
  }, [errors]);

  useEffect(() => {
    if (apiError) {
      apiErrorRef.current?.focus();
    }
  }, [apiError]);

  function handleEmailChange(nextEmail: string) {
    setEmail(nextEmail);
    setApiError(null);
    setErrors((current) => {
      if (!current.email) return current;
      const nextError = validateLogin(nextEmail, password).email;
      if (nextError) return { ...current, email: nextError };
      const next = { ...current };
      delete next.email;
      return next;
    });
  }

  function handlePasswordChange(nextPassword: string) {
    setPassword(nextPassword);
    setApiError(null);
    setErrors((current) => {
      if (!current.password) return current;
      const nextError = validateLogin(email, nextPassword).password;
      if (nextError) return { ...current, password: nextError };
      const next = { ...current };
      delete next.password;
      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    const nextErrors = validateLogin(email, password);
    validationFocusRequestedRef.current = Object.keys(nextErrors).length > 0;
    setErrors(nextErrors);
    setApiError(null);
    if (Object.keys(nextErrors).length > 0) return;

    setBusy(true);
    try {
      await login({
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
          message: "Sign in could not be completed. Please try again.",
        });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthenticationShell
      labelledBy="login-heading"
      mode="login"
    >
      <Link className="product-link" to="/">
        <BrandLockup />
      </Link>
      <p className="eyebrow">Secure workspace</p>
      <h1 id="login-heading">Welcome back</h1>
      <p className="auth-intro">
        Sign in to continue to your career and learning workspace.
      </p>

      {authenticationReasonFromState(location.state) === "session-expired" ? (
        <div className="authentication-session-notice" role="status">
          Your session expired. Sign in again to continue.
        </div>
      ) : null}

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {Object.keys(errors).length > 1 ? (
          <div
            className="validation-summary"
            role="alert"
            tabIndex={-1}
            ref={errorSummaryRef}
          >
            <strong>Review the highlighted fields.</strong>
            <ul>
              {errors.email ? (
                <li>
                  <a href={`#${emailId}`}>Email address</a>
                </li>
              ) : null}
              {errors.password ? (
                <li>
                  <a href={`#${passwordId}`}>Password</a>
                </li>
              ) : null}
            </ul>
          </div>
        ) : null}

        <div className="form-field">
          <label className="required-label" htmlFor={emailId}>
            Email address
          </label>
          <input
            ref={emailRef}
            id={emailId}
            name="email"
            type="email"
            autoComplete="email"
            spellCheck={false}
            required
            maxLength={320}
            value={email}
            onChange={(event) => handleEmailChange(event.target.value)}
            aria-invalid={errors.email ? "true" : undefined}
            aria-describedby={errors.email ? `${emailId}-error` : undefined}
            disabled={busy}
          />
          {errors.email ? (
            <p className="field-error" id={`${emailId}-error`}>
              {errors.email}
            </p>
          ) : null}
        </div>

        <div className="form-field">
          <label className="required-label" htmlFor={passwordId}>
            Password
          </label>
          <div className="password-input-wrap">
            <input
              ref={passwordRef}
              id={passwordId}
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              maxLength={128}
              value={password}
              onChange={(event) => handlePasswordChange(event.target.value)}
              aria-invalid={errors.password ? "true" : undefined}
              aria-describedby={
                errors.password ? `${passwordId}-error` : undefined
              }
              disabled={busy}
            />
            <button
              className="password-visibility-toggle"
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              disabled={busy}
              onClick={() => setShowPassword((visible) => !visible)}
            >
              <svg
                className="password-visibility-icon"
                viewBox="0 0 24 24"
                aria-hidden="true"
                focusable="false"
              >
                {showPassword ? (
                  <>
                    <path d="M3 3l18 18" />
                    <path d="M10.6 6.2A10.5 10.5 0 0 1 12 6c6 0 9.5 6 9.5 6a15.6 15.6 0 0 1-2.7 3.5" />
                    <path d="M6.2 6.2C3.7 8.1 2.5 12 2.5 12s3.5 6 9.5 6a10 10 0 0 0 4.1-.9" />
                    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
                  </>
                ) : (
                  <>
                    <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
                    <circle cx="12" cy="12" r="3" />
                  </>
                )}
              </svg>
            </button>
          </div>
          {errors.password ? (
            <p className="field-error" id={`${passwordId}-error`}>
              {errors.password}
            </p>
          ) : null}
        </div>

        {apiError ? (
          <div
            className="form-error"
            role="alert"
            tabIndex={-1}
            ref={apiErrorRef}
          >
            <p>{apiError.message}</p>
            <TechnicalDetails
              requestId={apiError.requestId}
              className="authentication-technical-details"
            />
          </div>
        ) : null}

        <button
          className="primary-button"
          type="submit"
          disabled={busy}
          aria-busy={busy}
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="auth-switch">
        New to the hub? <Link to="/register">Create an account</Link>
      </p>
    </AuthenticationShell>
  );
}