import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { api } from "../api/client";
import { useSettings } from "../app/settings-context";
import { GlassPanel } from "../components/ui/GlassPanel";
import { SectionHeader } from "../components/ui/SectionHeader";

export function SettingsPage() {
  const queryClient = useQueryClient();
  const settings = useSettings();

  const sensorsQuery = useQuery({
    queryKey: ["sensors"],
    queryFn: api.getSensors,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name, location }: { id: string; name: string; location?: string | null }) =>
      api.updateSensor(id, { name, location }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sensors"] });
      toast.success("Dane czujnika zostały zaktualizowane.");
    },
  });

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Preferences"
        title="Ustawienia interfejsu i zarządzanie czujnikami"
        description="Konfiguruj motyw, interwał odświeżania, jednostki i podstawowe metadane urządzeń."
      />

      <div className="grid gap-6 xl:grid-cols-[0.7fr_1.3fr]">
        <GlassPanel className="space-y-5 p-6">
          <div>
            <p className="text-sm font-semibold text-[var(--muted)]">Motyw</p>
            <div className="mt-3 flex gap-3">
              {(["dark", "light"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => settings.setTheme(value)}
                  className={`rounded-full px-4 py-2 text-sm font-bold ${settings.theme === value ? "bg-[var(--accent)] text-slate-950" : "border border-white/10 bg-white/5"}`}
                >
                  {value === "dark" ? "Ciemny" : "Jasny"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-[var(--muted)]">Odświeżanie</p>
            <select
              value={settings.refreshInterval}
              onChange={(event) => settings.setRefreshInterval(Number(event.target.value))}
              className="mt-3 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
            >
              <option value={10000}>10 sekund</option>
              <option value={30000}>30 sekund</option>
              <option value={60000}>60 sekund</option>
            </select>
          </div>

          <div>
            <p className="text-sm font-semibold text-[var(--muted)]">Jednostka temperatury</p>
            <select
              value={settings.temperatureUnit}
              onChange={(event) => settings.setTemperatureUnit(event.target.value as "C" | "F")}
              className="mt-3 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
            >
              <option value="C">Celsiusz</option>
              <option value="F">Fahrenheit</option>
            </select>
          </div>

          <div>
            <p className="text-sm font-semibold text-[var(--muted)]">Jednostka ciśnienia</p>
            <select
              value={settings.pressureUnit}
              onChange={(event) => settings.setPressureUnit(event.target.value as "hPa" | "inHg")}
              className="mt-3 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
            >
              <option value="hPa">hPa</option>
              <option value="inHg">inHg</option>
            </select>
          </div>
        </GlassPanel>

        <GlassPanel className="p-6">
          <SectionHeader title="Nazwy i lokalizacje sensorów" description="Szybka administracja czujnikami bezpośrednio z panelu." />
          <div className="space-y-4">
            {(sensorsQuery.data ?? []).map((sensor) => (
              <form
                key={sensor.id}
                onSubmit={(event) => {
                  event.preventDefault();
                  const data = new FormData(event.currentTarget);
                  updateMutation.mutate({
                    id: sensor.id,
                    name: String(data.get("name") ?? sensor.name),
                    location: String(data.get("location") ?? sensor.location ?? ""),
                  });
                }}
                className="rounded-3xl border border-white/10 bg-white/5 p-4"
              >
                <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto]">
                  <input
                    name="name"
                    defaultValue={sensor.name}
                    className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm"
                  />
                  <input
                    name="location"
                    defaultValue={sensor.location ?? ""}
                    className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm"
                  />
                  <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-extrabold text-slate-950">
                    <Save size={16} />
                    Zapisz
                  </button>
                </div>
              </form>
            ))}
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
