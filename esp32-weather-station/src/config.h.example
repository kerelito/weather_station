#pragma once

#include <Arduino.h>

namespace AppConfig {
constexpr char WIFI_SSID[] = "YOUR_WIFI_SSID";
constexpr char WIFI_PASSWORD[] = "YOUR_WIFI_PASSWORD";
constexpr char BACKEND_URL[] = "http://192.168.1.10:4000/api/measurements";
constexpr char API_KEY[] = "CHANGE_ME";
constexpr char SENSOR_ID[] = "esp32-weather-01";
constexpr char SENSOR_NAME[] = "Stacja pogodowa ESP32";
constexpr char SENSOR_TYPE[] = "weather-station";
constexpr char FIRMWARE_VERSION[] = "1.0.0";

constexpr uint32_t MEASUREMENT_INTERVAL_MS = 30000;
constexpr uint8_t I2C_SDA_PIN = 21;
constexpr uint8_t I2C_SCL_PIN = 22;
constexpr uint8_t BATTERY_ADC_PIN = 34;
constexpr bool ENABLE_BATTERY_MONITORING = false;
constexpr float BATTERY_VOLTAGE_DIVIDER = 2.0f;
constexpr float DEFAULT_BATTERY_VOLTAGE = 3.95f;

constexpr bool ENABLE_OTA = true;
constexpr char OTA_HOSTNAME[] = "esp32-weather-station";
constexpr char OTA_PASSWORD[] = "CHANGE_ME_OTA";

constexpr bool ENABLE_NTP = true;
constexpr char NTP_SERVER[] = "pool.ntp.org";
constexpr long GMT_OFFSET_SECONDS = 0;
constexpr int DAYLIGHT_OFFSET_SECONDS = 0;
}  // namespace AppConfig
