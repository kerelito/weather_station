#pragma once

struct SensorReadings {
  float temperature;
  float humidity;
  float pressure;
  bool aht20Ok;
  bool bmp280Ok;
  const char* status;
};

namespace WeatherSensors {
bool begin();
SensorReadings read();
}  // namespace WeatherSensors
