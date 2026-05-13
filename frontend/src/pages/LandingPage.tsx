import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight, DatabaseZap, Gauge, ShieldCheck, Waves } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { GlassPanel } from "../components/ui/GlassPanel";

export function LandingPage() {
  const healthQuery = useQuery({
    queryKey: ["health"],
    queryFn: api.getHealth,
  });

  return (
    <div className="min-h-screen px-4 py-4 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-[1400px] flex-col gap-6 rounded-[36px] border border-white/8 bg-[linear-gradient(180deg,rgba(8,17,31,0.88),rgba(6,12,20,0.96))] p-6 shadow-[0_40px_120px_rgba(4,10,24,0.4)] backdrop-blur sm:p-8">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--accent-secondary)]">Weather Station</p>
            <h1 className="mt-3 text-4xl font-black sm:text-5xl">Profesjonalny dashboard dla czujników pogodowych i IoT</h1>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-100">
            <ShieldCheck size={16} />
            API status: {healthQuery.data?.status ?? "checking"}
          </div>
        </header>

        <section className="grid flex-1 gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="glass-panel mesh-border relative overflow-hidden rounded-[34px] p-8"
          >
            <div className="absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top_left,rgba(88,213,179,0.24),transparent_42%),radial-gradient(circle_at_top_right,rgba(123,199,255,0.24),transparent_36%)]" />
            <div className="relative max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent-secondary)]">Live intelligence</p>
              <h2 className="mt-4 text-5xl font-black leading-tight">Od odczytu AHT20 i BMP280 do pięknej wizualizacji live.</h2>
              <p className="mt-5 max-w-2xl text-lg text-[var(--muted)]">
                Jedna aplikacja do odbierania danych z ESP32, symulacji czujników, analizy historii, alertów progowych
                i wdrożenia na Railway.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-extrabold text-slate-950 transition hover:scale-[1.02]"
                >
                  Otwórz dashboard
                  <ArrowRight size={16} />
                </Link>
                <Link
                  to="/api-docs"
                  className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-6 py-3 text-sm font-semibold text-[var(--text)] transition hover:bg-white/10"
                >
                  Dokumentacja API
                </Link>
              </div>
            </div>
          </motion.div>

          <div className="grid gap-6">
            {[
              {
                icon: <Gauge size={22} />,
                title: "Profesjonalny frontend",
                description: "Karty metryk, wykresy historyczne, tryb jasny/ciemny, live updates i PWA.",
              },
              {
                icon: <DatabaseZap size={22} />,
                title: "Backend + PostgreSQL",
                description: "Express, Prisma, Socket.IO, alerty, statystyki, offline detection i seed demo.",
              },
              {
                icon: <Waves size={22} />,
                title: "ESP32 + Simulator",
                description: "Gotowy firmware PlatformIO i skrypt imitujący wiele urządzeń z płynnymi zmianami pomiarów.",
              },
            ].map((item) => (
              <GlassPanel key={item.title} className="p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                  {item.icon}
                </div>
                <h3 className="mt-4 text-xl font-bold">{item.title}</h3>
                <p className="mt-2 text-sm text-[var(--muted)]">{item.description}</p>
              </GlassPanel>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
