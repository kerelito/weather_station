import { Activity, BellRing, ChartColumn, Database, Home, Settings2 } from "lucide-react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useLiveFeed } from "../../hooks/useLiveFeed";
import { cx } from "../../lib/format";
import { useSettings } from "../../app/settings-context";
import { StatusBadge } from "../ui/StatusBadge";

const navigation = [
  { to: "/dashboard", label: "Dashboard", icon: Home },
  { to: "/charts", label: "Wykresy", icon: ChartColumn },
  { to: "/measurements", label: "Pomiary", icon: Database },
  { to: "/alerts", label: "Alerty", icon: BellRing },
  { to: "/settings", label: "Ustawienia", icon: Settings2 },
];

export function AppShell() {
  const { connected } = useLiveFeed();
  const { theme, setTheme } = useSettings();

  return (
    <div className="min-h-screen">
      <div className="mx-auto grid min-h-screen max-w-[1600px] grid-cols-1 gap-6 px-4 py-4 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-6">
        <aside className="glass-panel mesh-border sticky top-4 hidden h-[calc(100vh-2rem)] rounded-[32px] p-5 lg:flex lg:flex-col">
          <Link to="/" className="rounded-[26px] border border-white/10 bg-white/5 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent-secondary)]">Weather Station</p>
            <h1 className="mt-3 text-2xl font-black">Control Center</h1>
            <p className="mt-2 text-sm text-[var(--muted)]">Nowoczesny pulpit do monitoringu pogody, urządzeń i alertów.</p>
          </Link>

          <nav className="mt-6 flex flex-1 flex-col gap-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cx(
                      "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition",
                      isActive
                        ? "bg-white/10 text-[var(--text)]"
                        : "text-[var(--muted)] hover:bg-white/6 hover:text-[var(--text)]",
                    )
                  }
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="rounded-[26px] border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[var(--muted)]">Kanał live</p>
              <StatusBadge online={connected} live />
            </div>
            <p className="mt-3 text-sm text-[var(--muted)]">Socket.IO utrzymuje dashboard zsynchronizowany z backendem bez odświeżania strony.</p>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="glass-panel mesh-border mb-6 flex flex-col gap-4 rounded-[28px] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent-secondary)]">Live Operations</p>
              <h2 className="mt-2 text-2xl font-black">Monitoring środowiska w czasie rzeczywistym</h2>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge online={connected} live />
              <button
                type="button"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-[var(--text)] transition hover:bg-white/10"
              >
                <Activity size={16} />
                {theme === "dark" ? "Tryb jasny" : "Tryb ciemny"}
              </button>
            </div>
          </header>
          <main className="pb-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
