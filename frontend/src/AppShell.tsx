import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  NavLink,
  Outlet,
  useLocation,
} from "react-router-dom";
import { useAuth } from "./features/auth/AuthProvider";

const navigationItems = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Resumes", to: "/resumes" },
  { label: "Interviews", to: "/interviews" },
  { label: "Learning", to: "/learning" },
  { label: "Settings", to: "/settings" },
];

function navigationClass({ isActive }: { isActive: boolean }) {
  return isActive ? "nav-link nav-link--active" : "nav-link";
}

export function AppShell() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileToggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.key]);

  useEffect(() => {
    if (!mobileOpen) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (
        event.defaultPrevented ||
        (event.target instanceof Element &&
          event.target.closest("dialog[open]"))
      ) {
        return;
      }
      setMobileOpen(false);
      mobileToggleRef.current?.focus();
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [mobileOpen]);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <header className="app-header">
        <div className="app-header__inner">
          <NavLink className="app-brand" to="/dashboard">
            <span className="app-brand__mark" aria-hidden="true">
              CL
            </span>
            <span>Career &amp; Learning Hub</span>
          </NavLink>

          <nav aria-label="Primary navigation" className="desktop-nav">
            {navigationItems.map((item) => (
              <NavLink
                className={navigationClass}
                key={item.to}
                to={item.to}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="session-summary">
            <div className="session-summary__text">
              <span>{user?.profile.displayName}</span>
              <small>{user?.email}</small>
            </div>
            <button
              className="header-logout"
              type="button"
              onClick={() => {
                void logout().catch(() => undefined);
              }}
            >
              Log out
            </button>
          </div>

          <button
            ref={mobileToggleRef}
            className="mobile-nav-toggle"
            type="button"
            aria-label="Toggle navigation"
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMobileOpen((open) => !open)}
          >
            <span aria-hidden="true">{mobileOpen ? "Close" : "Menu"}</span>
          </button>
        </div>

        <nav
          id="mobile-navigation"
          aria-label="Mobile navigation"
          className="mobile-nav"
          hidden={!mobileOpen}
        >
          {navigationItems.map((item) => (
            <NavLink
              className={navigationClass}
              key={item.to}
              to={item.to}
            >
              {item.label}
            </NavLink>
          ))}
          <button
            className="mobile-logout"
            type="button"
            onClick={() => {
              setMobileOpen(false);
              void logout().catch(() => undefined);
            }}
          >
            Log out
          </button>
        </nav>
      </header>

      <main className="app-main" id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
}
