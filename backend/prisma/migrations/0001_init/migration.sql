-- CreateEnum
CREATE TYPE "AlertMetric" AS ENUM ('temperature', 'humidity', 'pressure', 'batteryVoltage', 'rssi');

-- CreateEnum
CREATE TYPE "AlertOperator" AS ENUM ('gt', 'gte', 'lt', 'lte', 'eq', 'neq');

-- CreateTable
CREATE TABLE "Sensor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "location" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "description" TEXT,
    "deviceTokenHash" TEXT,
    "firmwareVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastSeenAt" TIMESTAMP(3),
    "isOnline" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Sensor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Measurement" (
    "id" TEXT NOT NULL,
    "sensorId" TEXT NOT NULL,
    "sensorName" TEXT NOT NULL,
    "sensorType" TEXT NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL,
    "humidity" DOUBLE PRECISION NOT NULL,
    "pressure" DOUBLE PRECISION NOT NULL,
    "rssi" INTEGER,
    "batteryVoltage" DOUBLE PRECISION,
    "status" TEXT NOT NULL,
    "firmwareVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Measurement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertRule" (
    "id" TEXT NOT NULL,
    "sensorId" TEXT,
    "metric" "AlertMetric" NOT NULL,
    "operator" "AlertOperator" NOT NULL,
    "threshold" DOUBLE PRECISION NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlertRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertEvent" (
    "id" TEXT NOT NULL,
    "sensorId" TEXT NOT NULL,
    "ruleId" TEXT,
    "message" TEXT NOT NULL,
    "metric" "AlertMetric" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "AlertEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Sensor_isOnline_lastSeenAt_idx" ON "Sensor"("isOnline", "lastSeenAt" DESC);

-- CreateIndex
CREATE INDEX "Measurement_sensorId_createdAt_idx" ON "Measurement"("sensorId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Measurement_createdAt_idx" ON "Measurement"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "AlertRule_sensorId_enabled_idx" ON "AlertRule"("sensorId", "enabled");

-- CreateIndex
CREATE INDEX "AlertEvent_sensorId_createdAt_idx" ON "AlertEvent"("sensorId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AlertEvent_acknowledged_createdAt_idx" ON "AlertEvent"("acknowledged", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "Measurement" ADD CONSTRAINT "Measurement_sensorId_fkey" FOREIGN KEY ("sensorId") REFERENCES "Sensor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertRule" ADD CONSTRAINT "AlertRule_sensorId_fkey" FOREIGN KEY ("sensorId") REFERENCES "Sensor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertEvent" ADD CONSTRAINT "AlertEvent_sensorId_fkey" FOREIGN KEY ("sensorId") REFERENCES "Sensor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertEvent" ADD CONSTRAINT "AlertEvent_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "AlertRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

