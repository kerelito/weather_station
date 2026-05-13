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
  const { register, handleSubmit, reset } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: {
      metric: "temperature",
      operator: "gt",
      threshold: 28,
    },
  });

  const sensorsQuery = useQuery({
    queryKey: ["sensors"],
    queryFn: api.getSensors,
  });

  const rulesQuery = useQuery({
    queryKey: ["alerts", "rules"],
    queryFn: api.getAlertRules,
  });

  const eventsQuery = useQuery({
    queryKey: ["alerts", "events"],
    queryFn: () => api.getAlertEvents({ limit: 20 }),
  });

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
      <SectionHeader
        eyebrow="Alerts"
        title="Progi alarmowe i historia zdarzeń"
        description="Twórz reguły dla wybranych metryk i śledź zdarzenia wygenerowane przez backend."
      />

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <GlassPanel className="p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <BellPlus size={20} />
            </div>
            <div>
              <h3 className="text-xl font-bold">Nowa reguła</h3>
              <p className="text-sm text-[var(--muted)]">Ustal próg dla temperatury, wilgotności, ciśnienia lub zasilania.</p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <select {...register("sensorId")} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
              <option value="">Wszystkie czujniki</option>
              {(sensorsQuery.data ?? []).map((sensor) => (
                <option key={sensor.id} value={sensor.id}>
                  {sensor.name}
                </option>
              ))}
            </select>
            <div className="grid gap-4 sm:grid-cols-3">
              <select {...register("metric")} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
                <option value="temperature">Temperatura</option>
                <option value="humidity">Wilgotność</option>
                <option value="pressure">Ciśnienie</option>
                <option value="batteryVoltage">Napięcie</option>
                <option value="rssi">RSSI</option>
              </select>
              <select {...register("operator")} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
                <option value="gt">&gt;</option>
                <option value="gte">&gt;=</option>
                <option value="lt">&lt;</option>
                <option value="lte">&lt;=</option>
              </select>
              <input {...register("threshold")} type="number" step="0.1" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm" />
            </div>
            <button type="submit" className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-extrabold text-slate-950">
              Zapisz regułę
            </button>
          </form>
        </GlassPanel>

        <GlassPanel className="p-6">
          <SectionHeader title="Historia alertów" description="Najnowsze zdarzenia z backendu i możliwość potwierdzenia." />
          {(eventsQuery.data ?? []).length === 0 ? (
            <EmptyState title="Brak alertów" description="Po utworzeniu reguł i przekroczeniu progów zdarzenia pojawią się tutaj." icon={<AlertTriangle />} />
          ) : (
            <div className="space-y-3">
              {eventsQuery.data?.map((event) => (
                <div key={event.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-bold">{event.sensor?.name ?? event.sensorId}</p>
                      <p className="mt-1 text-sm text-[var(--muted)]">{event.message}</p>
                    </div>
                    <button
                      type="button"
                      disabled={event.acknowledged}
                      onClick={() => acknowledgeMutation.mutate(event.id)}
                      className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold disabled:opacity-50"
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
        <SectionHeader title="Aktywne reguły" description="Lista progów alarmowych zapisanych w systemie." />
        <div className="grid gap-3">
          {(rulesQuery.data ?? []).map((rule) => (
            <div key={rule.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="font-bold">
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
