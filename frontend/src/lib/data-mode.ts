import type { AlertEvent, AlertRule, Measurement, Sensor } from "../types/domain";

export type DataMode = "real" | "demo";

const SIMULATOR_SENSOR_PREFIX = "sim-";

export function isDemoSensorId(sensorId: string) {
  return sensorId.startsWith(SIMULATOR_SENSOR_PREFIX);
}

export function matchesSensorIdToMode(sensorId: string, mode: DataMode) {
  return mode === "demo" ? isDemoSensorId(sensorId) : !isDemoSensorId(sensorId);
}

export function filterSensorsByMode(sensors: Sensor[], mode: DataMode) {
  return sensors.filter((sensor) => matchesSensorIdToMode(sensor.id, mode));
}

export function filterMeasurementsByMode(measurements: Measurement[], mode: DataMode) {
  return measurements.filter((measurement) => matchesSensorIdToMode(measurement.sensorId, mode));
}

export function filterAlertEventsByMode(events: AlertEvent[], mode: DataMode) {
  return events.filter((event) => matchesSensorIdToMode(event.sensorId, mode));
}

export function filterAlertRulesByMode(rules: AlertRule[], mode: DataMode) {
  return rules.filter((rule) => {
    if (!rule.sensorId) {
      return true;
    }

    return matchesSensorIdToMode(rule.sensorId, mode);
  });
}
