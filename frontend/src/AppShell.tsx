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
import { AccountSummary } from "./components/AccountSummary";
import { BrandLockup } from "./components/BrandLockup";
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
    /* =========================================================
       FIND: NAVIGATION
       STYLE: styles.css
       SELECTOR: .nav-link
       ========================================================= */
    <nav aria-label={label} className="primary-navigation">
      {/* Feature 1.4 UI — Sidebar/mobile navigation links. */}
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
    /* =========================================================
       FIND: CREATE MENU
       STYLE: styles.css
       SELECTOR: .create-menu summary
       ========================================================= */
    <details className="create-menu">
      {/* Feature 1.5 UI — Global Create menu. */}
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

// Features 1.3–1.6 — Authenticated application shell.
// Centralizes desktop/mobile navigation, global creation shortcuts, account
// context, and single-flight logout while protected feature routes render below.
// Feature 1.3 — Authenticated application shell: the whole post-login sidebar/header + main content layout.
// Feature 1.4 — Navigation: Dashboard, Resumes, Interviews, Learning, Settings; desktop sidebar/mobile drawer.
// Feature 1.5 — Global Create menu: sidebar below logo; Resume / Interview session / Learning document.
// Feature 1.6 — Logout: sidebar bottom below account summary; repeated in mobile drawer.
// Feature 7.9 — Shared accessible shell behavior: skip link, keyboard focus return, responsive mobile navigation.
export function AppShell() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false);
  const logoutPendingRef = useRef(false);
  const mobileToggleRef = useRef<HTMLButtonElement>(null);
  const mobileCloseRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.key]);

  function dismissMobileNavigation() {
    setMobileOpen(false);
    window.setTimeout(() => mobileToggleRef.current?.focus(), 0);
  }

  function handleLogout() {
    if (logoutPendingRef.current) return;

    logoutPendingRef.current = true;
    setLogoutBusy(true);
    void logout()
      .catch(() => undefined)
      .finally(() => {
        logoutPendingRef.current = false;
        setLogoutBusy(false);
      });
  }

  return (
    /* =========================================================
       FIND: APPLICATION SHELL
       STYLE: styles.css -> .app-shell, .app-sidebar, .app-main
       ========================================================= */
    <div className="app-shell">
      {/* Feature 1.3 UI — Authenticated application shell. */}
      {/* Feature 7.9 UI — Skip link and responsive shell accessibility. */}
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      <aside className="app-sidebar">
        <NavLink className="app-brand" to="/dashboard">
          <BrandLockup />
        </NavLink>
        <CreateMenu />
        <PrimaryNavigation label="Primary navigation" />
        <div className="sidebar-session">
          <AccountSummary
            displayName={user?.profile.displayName}
            email={user?.email}
          />
          {/* =========================================================
              FIND: LOG OUT
              STYLE: styles.css
              SELECTOR: .sidebar-logout
              ========================================================= */}
          <button
            className="sidebar-logout"
            type="button"
            disabled={logoutBusy}
            onClick={handleLogout}
          >
            {/* Feature 1.6 UI — Log out button. */}
            {logoutBusy ? "Logging out…" : "Log out"}
          </button>
        </div>
      </aside>

      <header className="app-header">
        <NavLink className="app-brand" to="/dashboard">
          <BrandLockup />
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
          <AccountSummary
            displayName={user?.profile.displayName}
            email={user?.email}
          />
          <button
            className="sidebar-logout"
            type="button"
            disabled={logoutBusy}
            onClick={() => {
              setMobileOpen(false);
              handleLogout();
            }}
          >
            {logoutBusy ? "Logging out…" : "Log out"}
          </button>
        </div>
      </Dialog>

      <main className="app-main" id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
}
