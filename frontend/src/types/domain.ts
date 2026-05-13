export type Measurement = {
  id: string;
  sensorId: string;
  sensorName: string;
  sensorType: string;
  temperature: number;
  humidity: number;
  pressure: number;
  rssi: number | null;
  batteryVoltage: number | null;
  status: string;
  firmwareVersion?: string | null;
  createdAt: string;
};

export type Sensor = {
  id: string;
  name: string;
  type: string;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  description?: string | null;
  firmwareVersion?: string | null;
  createdAt: string;
  updatedAt: string;
  lastSeenAt?: string | null;
  isOnline: boolean;
  latestMeasurement?: Measurement | null;
  recentMeasurements?: Measurement[];
  alertRules?: AlertRule[];
  alertEvents?: AlertEvent[];
  stats?: Record<string, MetricStats>;
  _count?: {
    measurements: number;
    alertEvents: number;
  };
};

export type MetricStats = {
  min: number | null;
  max: number | null;
  avg: number | null;
  latest: number | null;
  standardDeviation?: number | null;
  trend?: {
    direction: "up" | "down" | "flat";
    delta: number;
    percentage: number;
  };
};

export type MeasurementResponse = {
  data: Measurement[];
  meta: {
    total: number;
    page: number;
    limit: number;
    interval: string;
    count: number;
  };
};

export type AlertRule = {
  id: string;
  sensorId?: string | null;
  metric: "temperature" | "humidity" | "pressure" | "batteryVoltage" | "rssi";
  operator: "gt" | "gte" | "lt" | "lte" | "eq" | "neq";
  threshold: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  sensor?: Sensor | null;
  _count?: {
    alertEvents: number;
  };
};

export type AlertEvent = {
  id: string;
  sensorId: string;
  ruleId?: string | null;
  message: string;
  metric: AlertRule["metric"];
  value: number;
  createdAt: string;
  acknowledged: boolean;
  sensor?: Sensor;
  rule?: AlertRule | null;
};

export type StatsResponse = {
  range: {
    from: string;
    to: string;
  };
  measurements: number;
  sensors: {
    total: number;
    online: number;
    offline: number;
  };
  metrics: Record<string, MetricStats>;
  anomalies: Array<{
    sensorId: string;
    metric: string;
    value: number | null;
    message: string;
  }>;
};

export type HealthResponse = {
  status: string;
  timestamp: string;
  uptime: number;
};
