import type { ReactNode } from "react";
import { BrandLockup } from "../../components/BrandLockup";
import "./auth.css";

type AuthenticationShellMode = "login" | "register" | "bootstrap";

type AuthenticationShellProps = {
  children: ReactNode;
  labelledBy: string;
  mode: AuthenticationShellMode;
};

type FeatureKind = "resume" | "interview" | "learning" | "dashboard";

const featurePreviews: ReadonlyArray<{
  kind: FeatureKind;
  title: string;
  description: string;
}> = [
  {
    kind: "resume",
    title: "Resume Studio",
    description: "Build and refine Resumes",
  },
  {
    kind: "interview",
    title: "Interview Coach",
    description: "Practice Interview sessions",
  },
  {
    kind: "learning",
    title: "Learning Workspace",
    description: "Learn from private documents",
  },
  {
    kind: "dashboard",
    title: "One Dashboard",
    description: "Review progress in one Dashboard",
  },
];

function FeatureIcon({ kind }: { kind: FeatureKind }) {
  if (kind === "resume") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M7 3.75h7.6L18.25 7.4V20.25H7z" />
        <path d="M14.5 3.75V7.5h3.75M9.75 11h5.5M9.75 14.25h5.5M9.75 17.5h3.5" />
      </svg>
    );
  }

  if (kind === "interview") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M12 14.25a4 4 0 0 0 4-4v-2.5a4 4 0 1 0-8 0v2.5a4 4 0 0 0 4 4Z" />
        <path d="M5.75 10.75a6.25 6.25 0 0 0 12.5 0M12 17v3.25M8.75 20.25h6.5" />
      </svg>
    );
  }

  if (kind === "learning") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M4.75 5.25c3.25-.35 5.65.35 7.25 2.1v12.4c-1.6-1.75-4-2.45-7.25-2.1zM19.25 5.25c-3.25-.35-5.65.35-7.25 2.1v12.4c1.6-1.75 4-2.45 7.25-2.1z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4.5 4.5h6.25v6.25H4.5zM13.25 4.5h6.25v4.25h-6.25zM4.5 13.25h6.25v6.25H4.5zM13.25 11.25h6.25v8.25h-6.25z" />
    </svg>
  );
}

function AuthenticationArtwork() {
  return (
    <div
      className="authentication-artwork"
      data-authentication-artwork
      aria-hidden="true"
    >
      <img
        src="/brand/career-learning-hub-authentication-pathway.png"
        alt=""
        width="2400"
        height="800"
      />
    </div>
  );
}

function AuthenticationBrandPanel() {
  return (
    <aside
      className="authentication-brand-panel"
      aria-label="Career Learning Hub platform overview"
    >
      <div className="authentication-brand-panel__glow" aria-hidden="true" />
      <div className="authentication-brand-panel__content">
        <div className="authentication-brand-panel__lockup">
          <BrandLockup />
        </div>
        <div className="authentication-brand-panel__copy">
          <p className="authentication-brand-panel__eyebrow">
            One unified platform
          </p>
          <h2>
            Build momentum from{" "}
            <em>learning to opportunity.</em>
          </h2>
          <p>
            Bring your career preparation into one focused, private
            workspace.
          </p>
        </div>

        <AuthenticationArtwork />

        <ul
          className="authentication-feature-list"
          aria-label="Platform capabilities"
        >
          {featurePreviews.map((feature) => (
            <li key={feature.kind} className="authentication-feature-card">
              <span className="authentication-feature-card__icon">
                <FeatureIcon kind={feature.kind} />
              </span>
              <span>
                <strong>{feature.title}</strong>
                <small>{feature.description}</small>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

export function AuthenticationShell({
  children,
  labelledBy,
  mode,
}: AuthenticationShellProps) {
  return (
    <main className={`authentication-shell authentication-shell--${mode}`}>
      <div className="authentication-shell__frame">
        <section
          className="authentication-form-panel"
          aria-labelledby={labelledBy}
        >
          <div className="authentication-form-card">{children}</div>
        </section>
        <AuthenticationBrandPanel />
      </div>
    </main>
  );
}
