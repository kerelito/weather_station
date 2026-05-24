# ESP32 Weather Station

Projekt jest przygotowany pod PlatformIO w Visual Studio Code i obsługuje:

- ESP32 + AHT20 + BMP280
- Wi-Fi reconnect
- HTTP / HTTPS POST JSON do backendu
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
   - opcjonalnie `ALLOW_INSECURE_TLS` lub `TLS_ROOT_CA`
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

## Railway

Jeśli backend działa na Railway, ustaw w `src/config.h` publiczny adres usługi:

```cpp
constexpr char BACKEND_URL[] = "https://twoja-aplikacja.up.railway.app/api/measurements";
constexpr char API_KEY[] = "twoj-railway-api-key";
```

Domyślnie firmware ma:

```cpp
constexpr bool ALLOW_INSECURE_TLS = true;
constexpr bool SEND_DEVICE_TIMESTAMP = false;
```

To upraszcza pierwsze połączenie HTTPS z Railway. Jeśli chcesz bardziej rygorystycznej walidacji certyfikatu, ustaw:

- `ALLOW_INSECURE_TLS = false`
- wypełnij `TLS_ROOT_CA`
- jeśli backend ma przyjmować znacznik czasu z urządzenia, ustaw `SEND_DEVICE_TIMESTAMP = true`

## Debugowanie

- Jeśli Wi-Fi nie łączy się, sprawdź `WIFI_SSID`, `WIFI_PASSWORD` i zasięg.
- Jeśli czujniki nie odpowiadają, sprawdź adres I2C i zasilanie 3.3V.
- Jeśli backend odrzuca żądania, sprawdź `API_KEY` i `BACKEND_URL`.
- Jeśli backend zwraca `400` dla pola `timestamp`, zostaw `SEND_DEVICE_TIMESTAMP = false` i pozwól backendowi nadawać czas zapisu.
- Jeśli Railway działa, ale POST się nie udaje, upewnij się, że używasz `https://.../api/measurements`, a nie `http://`.
- Jeśli potrzebujesz napięcia z baterii, ustaw `ENABLE_BATTERY_MONITORING = true` oraz poprawny dzielnik napięcia.
