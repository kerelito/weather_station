# MQTT jako alternatywa

## Kiedy HTTP wystarczy

HTTP POST jest dobrym wyborem, gdy:

- masz kilka lub kilkanaście urządzeń,
- chcesz prosty backend REST bez dodatkowego brokera,
- urządzenia wysyłają pomiary interwałowo, np. co 10-60 sekund,
- zależy Ci na łatwym debugowaniu żądań.

W tym projekcie HTTP jest wystarczające do lokalnych wdrożeń, demo i małych sieci czujników.

## Kiedy wybrać MQTT

MQTT staje się lepsze, gdy:

- masz dużo urządzeń,
- chcesz mniejsze narzuty transmisji,
- urządzenia pracują w niestabilnej sieci,
- potrzebujesz QoS, retained messages i hierarchii topiców,
- chcesz rozdzielić ingestion danych od dalszego przetwarzania.

Przykładowy topic:

`weather-station/esp32-weather-01/measurements`

## Dlaczego WebSocket dla frontendu

Frontend nie musi odpytywać API co sekundę. Socket.IO / WebSocket:

- obniża liczbę requestów,
- daje natychmiastowe odświeżenie kart i wykresów,
- dobrze pasuje do dashboardu operatorskiego.

## Jak dodać MQTT później

1. Dodaj broker, np. Mosquitto lub EMQX.
2. Utwórz proces subskrybujący topic z pomiarami.
3. W tym procesie waliduj payload i zapisuj go do tej samej bazy PostgreSQL.
4. Emituj dane do frontendu przez ten sam Socket.IO.
