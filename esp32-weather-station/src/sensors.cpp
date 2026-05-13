#include "sensors.h"

#include <Adafruit_AHTX0.h>
#include <Adafruit_BMP280.h>
#include <Wire.h>

#include "config.h"

namespace WeatherSensors {
namespace {
Adafruit_AHTX0 aht20;
Adafruit_BMP280 bmp280;
bool ahtReady = false;
bool bmpReady = false;
}

bool begin() {
  Wire.begin(AppConfig::I2C_SDA_PIN, AppConfig::I2C_SCL_PIN);

  ahtReady = aht20.begin();
  bmpReady = bmp280.begin(0x76) || bmp280.begin(0x77);

  if (bmpReady) {
    bmp280.setSampling(
        Adafruit_BMP280::MODE_NORMAL,
        Adafruit_BMP280::SAMPLING_X2,
        Adafruit_BMP280::SAMPLING_X16,
        Adafruit_BMP280::FILTER_X16,
        Adafruit_BMP280::STANDBY_MS_500);
  }

  Serial.printf("AHT20 status: %s\n", ahtReady ? "OK" : "ERROR");
  Serial.printf("BMP280 status: %s\n", bmpReady ? "OK" : "ERROR");

  return ahtReady || bmpReady;
}

SensorReadings read() {
  SensorReadings readings{
      .temperature = NAN,
      .humidity = NAN,
      .pressure = NAN,
      .aht20Ok = false,
      .bmp280Ok = false,
      .status = "error",
  };

  if (ahtReady) {
    sensors_event_t humidityEvent;
    sensors_event_t temperatureEvent;
    aht20.getEvent(&humidityEvent, &temperatureEvent);

    readings.temperature = temperatureEvent.temperature;
    readings.humidity = humidityEvent.relative_humidity;
    readings.aht20Ok = true;
  }

  if (bmpReady) {
    const float pressurePa = bmp280.readPressure();
    readings.pressure = pressurePa / 100.0f;
    readings.bmp280Ok = pressurePa > 0;

    if (!readings.aht20Ok) {
      readings.temperature = bmp280.readTemperature();
    }
  }

  if (readings.aht20Ok && readings.bmp280Ok) {
    readings.status = "ok";
  } else if (readings.aht20Ok || readings.bmp280Ok) {
    readings.status = "warning";
  }

  return readings;
}
}  // namespace WeatherSensors
