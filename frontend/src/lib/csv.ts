import type { Measurement } from "../types/domain";

export function exportMeasurementsCsv(rows: Measurement[]) {
  const header = [
    "sensorId",
    "sensorName",
    "temperature",
    "humidity",
    "pressure",
    "rssi",
    "batteryVoltage",
    "status",
    "createdAt",
  ];

  const data = rows.map((row) =>
    [
      row.sensorId,
      row.sensorName,
      row.temperature,
      row.humidity,
      row.pressure,
      row.rssi ?? "",
      row.batteryVoltage ?? "",
      row.status,
      row.createdAt,
    ].join(","),
  );

  const blob = new Blob([[header.join(","), ...data].join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `measurements-${Date.now()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
