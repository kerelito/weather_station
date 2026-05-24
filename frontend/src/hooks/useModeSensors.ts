import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import { useSettings } from "../app/use-settings";
import { filterSensorsByMode } from "../lib/data-mode";

export function useModeSensors() {
  const { dataMode } = useSettings();
  const sensorsQuery = useQuery({
    queryKey: ["sensors"],
    queryFn: api.getSensors,
  });

  const sensors = useMemo(() => filterSensorsByMode(sensorsQuery.data ?? [], dataMode), [dataMode, sensorsQuery.data]);
  const sensorIds = useMemo(() => sensors.map((sensor) => sensor.id), [sensors]);

  return {
    ...sensorsQuery,
    dataMode,
    sensors,
    sensorIds,
    sensorIdFilter: sensorIds.join(","),
  };
}
