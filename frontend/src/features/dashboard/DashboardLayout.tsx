import type { ReactNode } from "react";

interface DashboardLayoutProps {
  title: string;
  subtitle: string;
  generatedAt?: string;
  controls?: ReactNode;
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
        <div>
          <p className="eyebrow">Phase 7</p>
          <h2 id="main-dashboard-title">{title}</h2>
          <p>{subtitle}</p>
          {generatedAt && (
            <small>
              Updated {new Date(generatedAt).toLocaleString()}
            </small>
          )}
        </div>

        {controls && (
          <div className="dashboard-controls">{controls}</div>
        )}
      </header>

      {children}
    </section>
  );
}
