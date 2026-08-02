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
  intendedLocationFromState,
} from "./AuthRoute";
import { BrandLockup } from "../../components/BrandLockup";
import { AuthenticationShell } from "./AuthenticationShell";
import { useAuth } from "./AuthProvider";

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

  if (!emailPattern.test(email.trim())) {
    errors.email = "Enter a valid email address.";
  }
  if (!password) {
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
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<LoginErrors>({});
  const [apiError, setApiError] = useState<{
    message: string;
    requestId?: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const errorFields = Object.keys(errors) as (keyof LoginErrors)[];
    if (errorFields.length > 1) {
      errorSummaryRef.current?.focus();
    } else if (errorFields[0] === "email") {
      emailRef.current?.focus();
    } else if (errorFields[0] === "password") {
      passwordRef.current?.focus();
    }
  }, [errors]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    const nextErrors = validateLogin(email, password);
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
            <label className="required-label" htmlFor={passwordId}>
              Password
            </label>
            <input
              ref={passwordRef}
              id={passwordId}
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={errors.password ? "true" : undefined}
              aria-describedby={
                errors.password ? `${passwordId}-error` : undefined
              }
              disabled={busy}
            />
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
