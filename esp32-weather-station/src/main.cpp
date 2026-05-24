#include <Arduino.h>
#include <ArduinoOTA.h>
#include <WiFi.h>
#include <time.h>

#include "api_client.h"
#include "config.h"
#include "sensors.h"
#include "wifi_manager.h"

namespace {
unsigned long lastMeasurementAt = 0;

float readBatteryVoltage() {
  if (!AppConfig::ENABLE_BATTERY_MONITORING) {
    return AppConfig::DEFAULT_BATTERY_VOLTAGE;
  }

  analogReadResolution(12);
  const int raw = analogRead(AppConfig::BATTERY_ADC_PIN);
  const float volts = (static_cast<float>(raw) / 4095.0f) * 3.3f * AppConfig::BATTERY_VOLTAGE_DIVIDER;
  return volts;
}

String currentTimestamp() {
  if (!AppConfig::ENABLE_NTP || !AppConfig::SEND_DEVICE_TIMESTAMP) {
    return "";
  }

  struct tm timeInfo;
  if (!getLocalTime(&timeInfo, 1000)) {
    return "";
  }

  char buffer[32];
  strftime(buffer, sizeof(buffer), "%Y-%m-%dT%H:%M:%SZ", &timeInfo);
  return String(buffer);
}

void setupOta() {
  if (!AppConfig::ENABLE_OTA) {
    return;
  }

  ArduinoOTA.setHostname(AppConfig::OTA_HOSTNAME);
  ArduinoOTA.setPassword(AppConfig::OTA_PASSWORD);
  ArduinoOTA.onStart([]() { Serial.println("OTA update started."); });
  ArduinoOTA.onEnd([]() { Serial.println("\nOTA update finished."); });
  ArduinoOTA.onError([](ota_error_t error) {
    Serial.printf("OTA error[%u]\n", error);
  });
  ArduinoOTA.begin();
}

void connectTime() {
  if (!AppConfig::ENABLE_NTP) {
    return;
  }

  configTime(
      AppConfig::GMT_OFFSET_SECONDS,
      AppConfig::DAYLIGHT_OFFSET_SECONDS,
      AppConfig::NTP_SERVER);
  Serial.println("NTP time sync initialized.");
}
}  // namespace

void setup() {
  Serial.begin(115200);
  delay(600);

  Serial.println("\nWeather station booting...");
  WifiManager::begin();
  connectTime();
  setupOta();
  WeatherSensors::begin();
}

void loop() {
  WifiManager::ensureConnected();

  if (AppConfig::ENABLE_OTA) {
    ArduinoOTA.handle();
  }

  const unsigned long now = millis();
  if (now - lastMeasurementAt < AppConfig::MEASUREMENT_INTERVAL_MS) {
    delay(50);
    return;
  }

  lastMeasurementAt = now;

  const SensorReadings readings = WeatherSensors::read();
  const int rssi = WifiManager::isConnected() ? WiFi.RSSI() : -127;
  const float batteryVoltage = readBatteryVoltage();
  const String timestamp = currentTimestamp();

  Serial.printf(
      "Measurement -> temp: %.2f C, humidity: %.2f %%, pressure: %.2f hPa, battery: %.2f V, status: %s\n",
      readings.temperature,
      readings.humidity,
      readings.pressure,
      batteryVoltage,
      readings.status);

  const bool success = ApiClient::sendMeasurement(readings, rssi, batteryVoltage, timestamp);
  Serial.printf("POST result: %s\n", success ? "success" : "failed");
}
