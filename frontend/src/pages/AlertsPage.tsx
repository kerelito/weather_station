import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, BellPlus } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { api } from "../api/client";
import { EmptyState } from "../components/ui/EmptyState";
import { GlassPanel } from "../components/ui/GlassPanel";
import { SectionHeader } from "../components/ui/SectionHeader";
import { useModeSensors } from "../hooks/useModeSensors";
import { filterAlertEventsByMode, filterAlertRulesByMode } from "../lib/data-mode";

const schema = z.object({
  sensorId: z.string().optional(),
  metric: z.enum(["temperature", "humidity", "pressure", "batteryVoltage", "rssi"]),
  operator: z.enum(["gt", "gte", "lt", "lte"]),
  threshold: z.coerce.number(),
});

type FormInput = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

export function AlertsPage() {
  const queryClient = useQueryClient();
  const { dataMode, sensors } = useModeSensors();
  const { register, handleSubmit, reset } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: {
      metric: "temperature",
      operator: "gt",
      threshold: 28,
    },
  });

  const rulesQuery = useQuery({
    queryKey: ["alerts", "rules"],
    queryFn: api.getAlertRules,
  });

  const eventsQuery = useQuery({
    queryKey: ["alerts", "events"],
    queryFn: () => api.getAlertEvents({ limit: 100 }),
  });

  const rules = useMemo(() => filterAlertRulesByMode(rulesQuery.data ?? [], dataMode), [dataMode, rulesQuery.data]);
  const events = useMemo(() => filterAlertEventsByMode(eventsQuery.data ?? [], dataMode), [dataMode, eventsQuery.data]);

  const createRuleMutation = useMutation({
    mutationFn: api.createAlertRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      toast.success("Reguła alertu została zapisana.");
      reset();
    },
  });

  const acknowledgeMutation = useMutation({
    mutationFn: api.acknowledgeAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });

  const onSubmit = handleSubmit((values) => {
    createRuleMutation.mutate({
      ...values,
      sensorId: values.sensorId || null,
      enabled: true,
    });
  });

  return (
    <div className="space-y-8">
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <GlassPanel className="p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-subtle)] p-3 text-[color:var(--accent)]">
              <BellPlus size={20} />
            </div>
            <div>
              <h3 className="text-xl font-semibold">Nowa reguła</h3>
              <p className="text-sm text-[var(--muted)]">Próg dla wybranej metryki.</p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <select {...register("sensorId")} className="w-full border px-4 py-3 text-sm">
              <option value="">Wszystkie czujniki</option>
              {sensors.map((sensor) => (
                <option key={sensor.id} value={sensor.id}>
                  {sensor.name}
                </option>
              ))}
            </select>
            <div className="grid gap-4 sm:grid-cols-3">
              <select {...register("metric")} className="border px-4 py-3 text-sm">
                <option value="temperature">Temperatura</option>
                <option value="humidity">Wilgotność</option>
                <option value="pressure">Ciśnienie</option>
                <option value="batteryVoltage">Napięcie</option>
                <option value="rssi">RSSI</option>
              </select>
              <select {...register("operator")} className="border px-4 py-3 text-sm">
                <option value="gt">&gt;</option>
                <option value="gte">&gt;=</option>
                <option value="lt">&lt;</option>
                <option value="lte">&lt;=</option>
              </select>
              <input {...register("threshold")} type="number" step="0.1" className="border px-4 py-3 text-sm" />
            </div>
            <button type="submit" className="rounded-lg border border-[color:var(--accent)] bg-[color:var(--accent)] px-4 py-3 text-sm font-medium text-[color:var(--bg)] transition hover:opacity-90">
              Zapisz regułę
            </button>
          </form>
        </GlassPanel>

        <GlassPanel className="p-6">
          <SectionHeader title="Historia alertów" />
          {events.length === 0 ? (
            <EmptyState title="Brak alertów" description="Po utworzeniu reguł i przekroczeniu progów zdarzenia pojawią się tutaj." icon={<AlertTriangle />} />
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <div key={event.id} className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-bold">{event.sensor?.name ?? event.sensorId}</p>
                      <p className="mt-1 text-sm text-[var(--muted)]">{event.message}</p>
                    </div>
                    <button
                      type="button"
                      disabled={event.acknowledged}
                      onClick={() => acknowledgeMutation.mutate(event.id)}
                      className="rounded-lg border border-[color:var(--border)] px-4 py-2 text-sm font-medium transition hover:bg-[color:var(--surface-subtle)] disabled:opacity-50"
                    >
                      {event.acknowledged ? "Odczytane" : "Oznacz jako odczytane"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassPanel>
      </div>

      <GlassPanel className="p-6">
        <SectionHeader title="Aktywne reguły" />
        <div className="grid gap-3">
          {rules.map((rule) => (
            <div key={rule.id} className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
              <p className="font-semibold">
                {rule.sensor?.name ?? "Wszystkie czujniki"}: {rule.metric} {rule.operator} {rule.threshold}
              </p>
              <p className="mt-1 text-sm text-[var(--muted)]">Zdarzenia wygenerowane: {rule._count?.alertEvents ?? 0}</p>
            </div>
          ))}
        </div>
      </GlassPanel>
    </div>
  );
}
