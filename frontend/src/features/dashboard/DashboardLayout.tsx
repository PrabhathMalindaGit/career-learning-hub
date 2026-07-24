import type { ReactNode } from "react";

interface DashboardLayoutProps {
  title: string;
  subtitle: string;
  generatedAt?: string;
  controls: ReactNode;
  children: ReactNode;
}

export function DashboardLayout({
  title,
  subtitle,
  generatedAt,
  controls,
  children,
}: DashboardLayoutProps) {
  return (
    <section
      className="dashboard-layout"
      aria-labelledby="main-dashboard-title"
    >
      <header className="dashboard-heading">
        <div className="dashboard-heading__copy">
          <p className="eyebrow">Workspace overview</p>
          <h1 id="main-dashboard-title">{title}</h1>
          <p>{subtitle}</p>
          {generatedAt ? (
            <small>
              Updated {new Date(generatedAt).toLocaleString()}
            </small>
          ) : null}
        </div>

        <div className="dashboard-controls">{controls}</div>
      </header>

      {children}
    </section>
  );
}
