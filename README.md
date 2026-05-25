# Weather Station Control Center

Kompletny projekt do wizualizacji danych pogodowych i danych z czujników IoT. Repo zawiera:

- nowoczesny frontend `React + TypeScript + Vite + Tailwind + Framer Motion + Recharts`,
- backend `Node.js + Express + TypeScript + Prisma + PostgreSQL + Socket.IO`,
- skrypt symulatora wielu czujników,
- niezależny firmware ESP32 pod `PlatformIO` dla `AHT20 + BMP280`,
- konfigurację pod lokalne uruchomienie i wdrożenie na Railway.

## Funkcje aplikacji

- akwizycja danych przez `POST /api/measurements`,
- zapis historii do PostgreSQL,
- dashboard bieżących warunków,
- wykresy temperatury, wilgotności i ciśnienia,
- filtrowanie po czasie i sensorze,
- szczegóły pojedynczego czujnika,
- lista pomiarów z paginacją i eksportem CSV,
- alerty progowe i historia zdarzeń,
- live updates przez Socket.IO,
- oznaczanie sensorów online/offline,
- wykrywanie prostych anomalii,
- dark mode, light mode i PWA,
- gotowość do hostowania na Railway.

## Stack technologiczny

- Frontend: React, TypeScript, Vite, Tailwind CSS, Framer Motion, Recharts, React Query, Socket.IO Client
- Backend: Node.js, Express, TypeScript, Prisma ORM, Socket.IO, Zod
- Baza danych: PostgreSQL
- IoT: ESP32, PlatformIO, Arduino framework, AHT20, BMP280
- Deployment: Docker + Railway

## Struktura katalogów

```text
backend/
frontend/
simulator/
esp32-weather-station/
docs/
Dockerfile
.env.example
README.md
```

## Pełna analiza projektu

Rozszerzone opracowanie techniczno-funkcjonalne systemu znajduje się w pliku:

- [docs/system-analysis.md](docs/system-analysis.md)

## Backend API

### Najważniejsze endpointy

- `POST /api/measurements`
- `GET /api/measurements/latest`
- `GET /api/measurements?sensorId=&from=&to=&interval=&limit=&page=`
- `GET /api/sensors`
- `GET /api/sensors/:id`
- `PATCH /api/sensors/:id`
- `GET /api/stats`
- `GET /api/alerts/rules`
- `POST /api/alerts/rules`
- `PATCH /api/alerts/rules/:id`
- `GET /api/alerts/events`
- `PATCH /api/alerts/events/:id/acknowledge`
- `GET /api/health`

### Przykładowy payload z ESP32

```json
{
  "sensorId": "esp32-weather-01",
  "sensorName": "Stacja pogodowa ESP32",
  "sensorType": "weather-station",
  "temperature": 23.4,
  "humidity": 48.2,
  "pressure": 1013.7,
  "rssi": -57,
  "batteryVoltage": 3.9,
  "status": "ok",
  "firmwareVersion": "1.0.0"
}
```

### WebSocket / Socket.IO

Backend emituje:

- `measurement:new`
- `sensor:status`
- `alert:event`

Frontend nasłuchuje tych zdarzeń i odświeża widoki bez przeładowania strony.

## Model bazy danych

Projekt wykorzystuje tabele:

- `Sensor`
- `Measurement`
- `AlertRule`
- `AlertEvent`

Relacje, indeksy historyczne i migracja startowa znajdują się w:

- `backend/prisma/schema.prisma`
- `backend/prisma/migrations/0001_init/migration.sql`

## Uruchomienie lokalne

### 1. Wymagania

- Node.js 20+ lub 22+
- PostgreSQL 14+
- npm

### 2. Konfiguracja środowiska

Skopiuj wartości z `.env.example`.

Najwygodniej:

1. uzupełnij `backend/.env`,
2. opcjonalnie utwórz `frontend/.env` z `VITE_API_URL` i `VITE_WS_URL`,
3. opcjonalnie ustaw zmienne dla symulatora.

Frontend w trybie developerskim ma już proxy Vite do `http://localhost:4000`, więc `frontend/.env` nie jest wymagany.

### 3. Instalacja zależności

```bash
cd backend && npm install
cd ../frontend && npm install
cd ../simulator && npm install
```

### 4. Migracje i seed

Utwórz bazę `weather_station`, a następnie:

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

Seed tworzy przykładowe sensory, reguły alertów i historię pomiarów z 7 dni.

### 5. Start backendu

```bash
cd backend
npm run dev
```

Backend domyślnie startuje na `http://localhost:4000`.

### 6. Start frontendu

```bash
cd frontend
npm run dev
```

Frontend domyślnie startuje na `http://localhost:5173`.

### 7. Start symulatora

```bash
cd simulator
npm run dev
```

Przy pierwszym uruchomieniu symulator automatycznie dośle historię z ostatnich 3 miesięcy:

- z profilem sezonowym i dobowym dopasowanym do warunków w Polsce,
- z gęstszymi danymi dla ostatnich 48 godzin,
- a po zakończeniu backfillu przejdzie w dalszą symulację live.

Możesz też przekazać argumenty CLI:

```bash
npm run dev -- --sensorCount=5 --intervalMs=3000 --backendUrl=http://localhost:4000/api/measurements --apiKey=dev-weather-key
```

Opcjonalne parametry:

- `--timezone=Europe/Warsaw`
- `--historyMonths=3`
- `--historyBatchSize=12`
- `--skipHistory=true`

## Frontend

### Widoki

- landing page,
- dashboard główny,
- wykresy historyczne,
- widok pojedynczego sensora,
- tabela pomiarów,
- panel alertów,
- ustawienia,
- skrócona dokumentacja API.

### UX i wygląd

- gradientowe tło i glassmorphism,
- karty metryk z animacjami,
- wykresy z aktualizacją live,
- dark mode i light mode,
- toast notifications,
- responsywność,
- PWA manifest.

## Alerty

Alerty działają w backendzie:

1. przy wejściu nowego pomiaru sprawdzane są aktywne reguły,
2. jeśli warunek zostanie spełniony, tworzony jest `AlertEvent`,
3. frontend natychmiast dostaje event przez Socket.IO.

Aktualnie obsługiwane są metryki:

- `temperature`
- `humidity`
- `pressure`
- `batteryVoltage`
- `rssi`

## Eksport CSV

Widok tabelaryczny pozwala eksportować aktualnie pobraną stronę pomiarów do pliku CSV bezpośrednio z frontendu.

## HTTP vs MQTT

W tym projekcie podstawowy przepływ to:

- ESP32 lub symulator wysyła dane przez HTTP POST,
- backend zapisuje je do PostgreSQL,
- frontend dostaje aktualizacje przez WebSocket.

Opis, kiedy warto przejść na MQTT, znajduje się w [docs/mqtt-alternative.md](docs/mqtt-alternative.md).

## ESP32 + PlatformIO

Firmware znajduje się w `esp32-weather-station/`.

### Konfiguracja PlatformIO

1. Zainstaluj rozszerzenie PlatformIO w VS Code.
2. Otwórz folder `esp32-weather-station`.
3. Edytuj `src/config.h`.
4. Zbuduj projekt komendą `PlatformIO: Build`.
5. Wgraj firmware komendą `PlatformIO: Upload`.
6. Otwórz logi przez `PlatformIO: Serial Monitor`.

### Obsługiwane funkcje firmware

- połączenie z Wi-Fi,
- reconnect po utracie połączenia,
- odczyt z AHT20,
- odczyt z BMP280,
- wysyłka JSON do backendu,
- logowanie przez Serial,
- OTA przez ArduinoOTA,
- opcjonalna synchronizacja czasu NTP,
- opcjonalny pomiar napięcia baterii przez ADC.

### Schemat połączeń

- `ESP32 3.3V -> AHT20 VCC`
- `ESP32 GND -> AHT20 GND`
- `ESP32 GPIO21 -> AHT20 SDA`
- `ESP32 GPIO22 -> AHT20 SCL`
- `ESP32 3.3V -> BMP280 VCC`
- `ESP32 GND -> BMP280 GND`
- `ESP32 GPIO21 -> BMP280 SDA`
- `ESP32 GPIO22 -> BMP280 SCL`

## Railway deployment

Repo zawiera `Dockerfile`, który:

1. buduje frontend,
2. buduje backend,
3. kopiuje statyczny frontend do obrazu końcowego,
4. uruchamia `prisma migrate deploy`,
5. startuje serwer Express.

### Kroki wdrożenia

1. Utwórz nowy projekt na Railway.
2. Dodaj usługę PostgreSQL.
3. Dodaj usługę z tego repozytorium.
4. Ustaw zmienne:
   - `DATABASE_URL`
   - `API_KEY`
   - `FRONTEND_URL`
   - `BACKEND_URL`
   - `PORT`
   - `NODE_ENV`
5. Railway wykryje `Dockerfile` w katalogu głównym i użyje go podczas buildu.
6. Po deployu ustaw publiczny domain dla usługi.
7. Dla frontendu hostowanego w tym samym kontenerze ustaw:
   - `FRONTEND_URL` na adres domeny Railway,
   - `BACKEND_URL` na ten sam adres.

### Uwaga dla monorepo

Jeśli w Railway ustawisz Root Directory, pamiętaj, że plik konfiguracyjny Railway nie podąża za root directory. W tym repo nie jest to potrzebne, bo `Dockerfile` jest w katalogu głównym.

## Możliwe dalsze usprawnienia

- pełne porównanie wielu sensorów na jednym wykresie z oddzielnymi seriami,
- dedykowany broker MQTT i worker ingestujący wiadomości,
- role użytkowników i logowanie,
- alerty e-mail / Slack / webhook,
- bardziej zaawansowana detekcja anomalii,
- mapa sensorów z warstwą geolokalizacji,
- testy e2e i CI/CD.

## Krótka instrukcja końcowa

### Jak uruchomić lokalnie

1. uruchom PostgreSQL,
2. w `backend/.env` ustaw `DATABASE_URL` i `API_KEY`,
3. wykonaj migracje i seed,
4. uruchom backend,
5. uruchom frontend.

### Jak uruchomić symulator

```bash
cd simulator
npm run dev -- --apiKey=dev-weather-key
```

### Jak skonfigurować ESP32 w PlatformIO

1. otwórz `esp32-weather-station` w VS Code,
2. wpisz dane Wi-Fi i URL backendu do `src/config.h`,
3. zbuduj i wgraj firmware,
4. obserwuj logi w Serial Monitor.

### Jak wdrożyć na Railway

1. połącz repo z Railway,
2. dodaj PostgreSQL,
3. ustaw zmienne środowiskowe,
4. uruchom deploy z `Dockerfile`.
