import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { api } from "../api/client";
import { useSettings } from "../app/use-settings";
import { EmptyState } from "../components/ui/EmptyState";
import { GlassPanel } from "../components/ui/GlassPanel";
import { SectionHeader } from "../components/ui/SectionHeader";
import { useModeSensors } from "../hooks/useModeSensors";

export function SettingsPage() {
  const queryClient = useQueryClient();
  const settings = useSettings();
  const { sensors } = useModeSensors();

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
                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                    settings.theme === value
                      ? "border-[color:var(--accent)] bg-[color:var(--accent)] text-[color:var(--bg)]"
                      : "border-[color:var(--border)] bg-[color:var(--surface)] text-[var(--muted)] hover:bg-[color:var(--surface-subtle)] hover:text-[var(--text)]"
                  }`}
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
              className="mt-3 w-full border px-4 py-3 text-sm"
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
              className="mt-3 w-full border px-4 py-3 text-sm"
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
              className="mt-3 w-full border px-4 py-3 text-sm"
            >
              <option value="hPa">hPa</option>
              <option value="inHg">inHg</option>
            </select>
          </div>
        </GlassPanel>

        <GlassPanel className="p-6">
          <SectionHeader title="Czujniki" />
          {sensors.length === 0 ? (
            <EmptyState
              title="Brak czujników w tym trybie"
              description="Gdy pojawią się urządzenia dla wybranego źródła danych, będzie można nimi zarządzać tutaj."
              icon={<Save size={18} />}
            />
          ) : (
            <div className="space-y-4">
              {sensors.map((sensor) => (
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
                  className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] p-4"
                >
                  <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto]">
                    <input
                      name="name"
                      defaultValue={sensor.name}
                      className="border px-4 py-3 text-sm"
                    />
                    <input
                      name="location"
                      defaultValue={sensor.location ?? ""}
                      className="border px-4 py-3 text-sm"
                    />
                    <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-lg border border-[color:var(--accent)] bg-[color:var(--accent)] px-4 py-3 text-sm font-medium text-[color:var(--bg)] transition hover:opacity-90">
                      <Save size={16} />
                      Zapisz
                    </button>
                  </div>
                </form>
              ))}
            </div>
          )}
        </GlassPanel>
      </div>
    </div>
  );
}
