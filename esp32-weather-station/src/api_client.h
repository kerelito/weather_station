#pragma once

#include <Arduino.h>

#include "sensors.h"

namespace ApiClient {
bool sendMeasurement(const SensorReadings& readings, int rssi, float batteryVoltage, const String& timestamp);
}  // namespace ApiClient
