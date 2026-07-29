import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
} from "react-router-dom";
import { Dialog } from "./components/Dialog";
import { useAuth } from "./features/auth/AuthProvider";

type NavigationIcon =
  | "dashboard"
  | "resume"
  | "interview"
  | "learning"
  | "settings";

const navigationItems: ReadonlyArray<{
  label: string;
  to: string;
  icon: NavigationIcon;
}> = [
  { label: "Dashboard", to: "/dashboard", icon: "dashboard" },
  { label: "Resumes", to: "/resumes", icon: "resume" },
  { label: "Interviews", to: "/interviews", icon: "interview" },
  { label: "Learning", to: "/learning", icon: "learning" },
  { label: "Settings", to: "/settings", icon: "settings" },
];

const createItems = [
  { label: "Resume", to: "/resumes?action=create" },
  {
    label: "Interview session",
    to: "/interviews?action=create",
  },
  {
    label: "Learning document",
    to: "/learning?action=upload",
  },
] as const;

function NavigationIcon({ name }: { name: NavigationIcon }) {
  const paths: Record<NavigationIcon, ReactNode> = {
    dashboard: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    resume: (
      <>
        <path d="M6 3h9l3 3v15H6z" />
        <path d="M9 11h6M9 15h6M9 7h3" />
      </>
    ),
    interview: (
      <>
        <path d="M4 5h16v11H9l-5 4z" />
        <path d="M8 9h8M8 12h5" />
      </>
    ),
    learning: (
      <>
        <path d="m3 7 9-4 9 4-9 4z" />
        <path d="M6 9v6c3 3 9 3 12 0V9" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" />
      </>
    ),
  };

  return (
    <svg
      className="nav-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      {paths[name]}
    </svg>
  );
}

function navigationClass({ isActive }: { isActive: boolean }) {
  return isActive ? "nav-link nav-link--active" : "nav-link";
}

function PrimaryNavigation({
  label,
}: {
  label: "Primary navigation" | "Mobile navigation";
}) {
  return (
    <nav aria-label={label} className="primary-navigation">
      {navigationItems.map((item) => (
        <NavLink
          className={navigationClass}
          key={item.to}
          to={item.to}
        >
          <NavigationIcon name={item.icon} />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

function CreateMenu() {
  return (
    <details className="create-menu">
      <summary>
        <span aria-hidden="true">＋</span>
        Create
      </summary>
      <div className="create-menu__items">
        {createItems.map((item) => (
          <Link key={item.to} to={item.to}>
            {item.label}
          </Link>
        ))}
      </div>
    </details>
  );
}

export function AppShell() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileToggleRef = useRef<HTMLButtonElement>(null);
  const mobileCloseRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.key]);

  function dismissMobileNavigation() {
    setMobileOpen(false);
    window.setTimeout(() => mobileToggleRef.current?.focus(), 0);
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      <aside className="app-sidebar">
        <NavLink className="app-brand" to="/dashboard">
          <span className="app-brand__mark" aria-hidden="true">
            CL
          </span>
          <span>Career &amp; Learning Hub</span>
        </NavLink>
        <CreateMenu />
        <PrimaryNavigation label="Primary navigation" />
        <div className="sidebar-session">
          <div className="session-summary__text">
            <span>{user?.profile.displayName}</span>
            <small>{user?.email}</small>
          </div>
          <button
            className="sidebar-logout"
            type="button"
            onClick={() => void logout().catch(() => undefined)}
          >
            Log out
          </button>
        </div>
      </aside>

      <header className="app-header">
        <NavLink className="app-brand" to="/dashboard">
          <span className="app-brand__mark" aria-hidden="true">
            CL
          </span>
          <span>Career &amp; Learning Hub</span>
        </NavLink>
        <button
          ref={mobileToggleRef}
          className="mobile-nav-toggle"
          type="button"
          aria-label="Toggle navigation"
          aria-expanded={mobileOpen}
          aria-controls="mobile-navigation"
          onClick={() => setMobileOpen(true)}
        >
          <span aria-hidden="true">Menu</span>
        </button>
      </header>

      <Dialog
        open={mobileOpen}
        labelledBy="mobile-navigation-title"
        initialFocusRef={mobileCloseRef}
        returnFocusRef={mobileToggleRef}
        onCancel={dismissMobileNavigation}
        canDismissOnBackdrop
        className="mobile-nav-drawer"
      >
        <div className="mobile-nav-drawer__header">
          <h2 id="mobile-navigation-title">Navigation</h2>
          <button
            ref={mobileCloseRef}
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
          >
            Close
          </button>
        </div>
        <CreateMenu />
        <div id="mobile-navigation">
          <PrimaryNavigation label="Mobile navigation" />
        </div>
        <div className="sidebar-session">
          <div className="session-summary__text">
            <span>{user?.profile.displayName}</span>
            <small>{user?.email}</small>
          </div>
          <button
            className="sidebar-logout"
            type="button"
            onClick={() => {
              setMobileOpen(false);
              void logout().catch(() => undefined);
            }}
          >
            Log out
          </button>
        </div>
      </Dialog>

      <main className="app-main" id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
}
