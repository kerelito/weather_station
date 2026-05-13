#include "api_client.h"

#include <ArduinoJson.h>
#include <HTTPClient.h>
#include <WiFi.h>

#include "config.h"

namespace ApiClient {
bool sendMeasurement(const SensorReadings& readings, int rssi, float batteryVoltage, const String& timestamp) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Skipping HTTP POST because Wi-Fi is offline.");
    return false;
  }

  StaticJsonDocument<512> doc;
  doc["sensorId"] = AppConfig::SENSOR_ID;
  doc["sensorName"] = AppConfig::SENSOR_NAME;
  doc["sensorType"] = AppConfig::SENSOR_TYPE;
  doc["temperature"] = readings.temperature;
  doc["humidity"] = readings.humidity;
  doc["pressure"] = readings.pressure;
  doc["rssi"] = rssi;
  doc["batteryVoltage"] = batteryVoltage;
  doc["status"] = readings.status;
  doc["firmwareVersion"] = AppConfig::FIRMWARE_VERSION;

  if (timestamp.length() > 0) {
    doc["timestamp"] = timestamp;
  }

  String payload;
  serializeJson(doc, payload);

  for (int attempt = 1; attempt <= 3; ++attempt) {
    HTTPClient client;
    client.begin(AppConfig::BACKEND_URL);
    client.setConnectTimeout(5000);
    client.addHeader("Content-Type", "application/json");
    client.addHeader("x-api-key", AppConfig::API_KEY);

    Serial.printf("HTTP POST attempt %d -> %s\n", attempt, AppConfig::BACKEND_URL);
    const int code = client.POST(payload);

    if (code > 0) {
      Serial.printf("HTTP response code: %d\n", code);
      client.end();
      return code >= 200 && code < 300;
    }

    Serial.printf("HTTP POST failed: %s\n", client.errorToString(code).c_str());
    client.end();
    delay(1200);
  }

  return false;
}
}  // namespace ApiClient
