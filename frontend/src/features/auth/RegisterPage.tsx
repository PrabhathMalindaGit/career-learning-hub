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
import { BrandLockup } from "../../components/BrandLockup";
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
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const apiErrorRef = useRef<HTMLDivElement>(null);
  const displayNameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<RegistrationErrors>({});
  const [apiError, setApiError] = useState<{
    message: string;
    requestId?: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const errorFields = Object.keys(
      errors,
    ) as (keyof RegistrationErrors)[];
    if (errorFields.length > 1) {
      errorSummaryRef.current?.focus();
    } else if (errorFields[0] === "displayName") {
      displayNameRef.current?.focus();
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
          <BrandLockup />
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
          {Object.keys(errors).length > 1 ? (
            <div
              className="validation-summary"
              role="alert"
              tabIndex={-1}
              ref={errorSummaryRef}
            >
              <strong>Review the highlighted fields.</strong>
              <ul>
                {errors.displayName ? (
                  <li>
                    <a href={`#${displayNameId}`}>Display name</a>
                  </li>
                ) : null}
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
            <label className="required-label" htmlFor={displayNameId}>
              Display name
            </label>
            <input
              ref={displayNameRef}
              id={displayNameId}
              name="displayName"
              type="text"
              autoComplete="name"
              required
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
              autoComplete="new-password"
              required
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
            <div
              className="form-error"
              role="alert"
              tabIndex={-1}
              ref={apiErrorRef}
            >
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
