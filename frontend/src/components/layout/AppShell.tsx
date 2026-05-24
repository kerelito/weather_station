import { Activity, BellRing, ChartColumn, Database, Home, Settings2 } from "lucide-react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useLiveFeed } from "../../hooks/useLiveFeed";
import { cx } from "../../lib/format";
import { useSettings } from "../../app/use-settings";
import { StatusBadge } from "../ui/StatusBadge";

const navigation = [
  { to: "/", label: "Dashboard", icon: Home },
  { to: "/charts", label: "Wykresy", icon: ChartColumn },
  { to: "/measurements", label: "Pomiary", icon: Database },
  { to: "/alerts", label: "Alerty", icon: BellRing },
  { to: "/settings", label: "Ustawienia", icon: Settings2 },
];

export function AppShell() {
  const { connected } = useLiveFeed();
  const { dataMode, setDataMode, theme, setTheme } = useSettings();
  const { pathname } = useLocation();

  const pageTitle =
    pathname === "/" ? "Dashboard"
      : pathname.startsWith("/charts") ? "Wykresy"
      : pathname.startsWith("/measurements") ? "Pomiary"
      : pathname.startsWith("/alerts") ? "Alerty"
      : pathname.startsWith("/settings") ? "Ustawienia"
      : pathname.startsWith("/api-docs") ? "API"
      : pathname.startsWith("/sensors") ? "Czujnik"
      : "Weather Station";

  return (
    <div className="min-h-screen">
      <div className="mx-auto grid min-h-screen max-w-[1500px] grid-cols-1 lg:grid-cols-[236px_minmax(0,1fr)]">
        <aside className="sticky top-0 hidden h-screen border-r border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-5 lg:flex lg:flex-col">
          <Link to="/" className="px-2 py-2">
            <h1 className="text-lg font-semibold tracking-normal">Weather Station</h1>
          </Link>

          <nav className="mt-6 flex flex-1 flex-col gap-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cx(
                      "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                      isActive
                        ? "bg-[color:var(--surface-subtle)] text-[var(--text)]"
                        : "text-[var(--muted)] hover:bg-[color:var(--surface-subtle)] hover:text-[var(--text)]",
                    )
                  }
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-subtle)] p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[var(--muted)]">Live</p>
              <StatusBadge online={connected} live />
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-10 mb-8 border-b border-[color:var(--border)] bg-[color:var(--bg)] px-4 py-4 lg:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold tracking-normal">{pageTitle}</h2>
                <p className="mt-1 text-sm text-[var(--muted)]">{dataMode === "demo" ? "Dane demo" : "Dane z czujników"}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex items-center gap-3 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm font-medium text-[var(--text)]">
                  <span className={cx("transition", dataMode === "demo" ? "text-[var(--muted)]" : "text-[var(--text)]")}>Real</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={dataMode === "demo"}
                    aria-label="Przełącz tryb demo"
                    onClick={() => setDataMode(dataMode === "demo" ? "real" : "demo")}
                    className={cx(
                      "relative h-6 w-11 rounded-full border border-[color:var(--border)] transition",
                      dataMode === "demo" ? "bg-[var(--accent)]" : "bg-[color:var(--surface-muted)]",
                    )}
                  >
                    <span
                      className={cx(
                        "absolute top-0.5 h-5 w-5 rounded-full bg-[color:var(--surface)] transition",
                        dataMode === "demo" ? "left-5" : "left-0.5",
                      )}
                    />
                  </button>
                  <span className={cx("transition", dataMode === "demo" ? "text-[var(--text)]" : "text-[var(--muted)]")}>Demo</span>
                </label>
                <StatusBadge online={connected} live />
                <button
                  type="button"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="inline-flex items-center gap-2 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm font-medium text-[var(--text)] transition hover:bg-[color:var(--surface-subtle)]"
                >
                  <Activity size={16} />
                  {theme === "dark" ? "Tryb jasny" : "Tryb ciemny"}
                </button>
              </div>
            </div>

            <nav className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:hidden">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      cx(
                        "inline-flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition",
                        isActive
                          ? "border-[color:var(--border-strong)] bg-[color:var(--surface-muted)] text-[var(--text)]"
                          : "border-[color:var(--border)] bg-[color:var(--surface)] text-[var(--muted)]",
                      )
                    }
                  >
                    <Icon size={16} />
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>
          </header>
          <main className="px-4 pb-10 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
