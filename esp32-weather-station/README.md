# ESP32 Weather Station

Projekt jest przygotowany pod PlatformIO w Visual Studio Code i obsługuje:

- ESP32 + AHT20 + BMP280
- Wi-Fi reconnect
- HTTP POST JSON do backendu
- Serial Monitor
- OTA przez `ArduinoOTA`
- opcjonalny pomiar napięcia baterii przez ADC

## Szybki start

1. Zainstaluj rozszerzenie PlatformIO w VS Code.
2. Otwórz folder `esp32-weather-station`.
3. Edytuj `src/config.h`:
   - `WIFI_SSID`
   - `WIFI_PASSWORD`
   - `BACKEND_URL`
   - `API_KEY`
   - `SENSOR_ID`
4. Podłącz ESP32 przez USB.
5. Uruchom:
   - `PlatformIO: Build`
   - `PlatformIO: Upload`
   - `PlatformIO: Serial Monitor`

## Połączenia sprzętowe

- `ESP32 3.3V -> AHT20 VCC`
- `ESP32 GND -> AHT20 GND`
- `ESP32 GPIO21 -> AHT20 SDA`
- `ESP32 GPIO22 -> AHT20 SCL`
- `ESP32 3.3V -> BMP280 VCC`
- `ESP32 GND -> BMP280 GND`
- `ESP32 GPIO21 -> BMP280 SDA`
- `ESP32 GPIO22 -> BMP280 SCL`

## OTA

Firmware zawiera `ArduinoOTA`.

1. ESP32 musi być w tej samej sieci Wi-Fi co komputer.
2. Ustaw `OTA_HOSTNAME` i `OTA_PASSWORD` w `src/config.h`.
3. Po pierwszym wgraniu przez USB możesz korzystać z uploadu OTA z poziomu PlatformIO.

## Debugowanie

- Jeśli Wi-Fi nie łączy się, sprawdź `WIFI_SSID`, `WIFI_PASSWORD` i zasięg.
- Jeśli czujniki nie odpowiadają, sprawdź adres I2C i zasilanie 3.3V.
- Jeśli backend odrzuca żądania, sprawdź `API_KEY` i `BACKEND_URL`.
- Jeśli potrzebujesz napięcia z baterii, ustaw `ENABLE_BATTERY_MONITORING = true` oraz poprawny dzielnik napięcia.
