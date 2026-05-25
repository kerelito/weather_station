# Analiza techniczno-funkcjonalna systemu Weather Station Control Center

## 1. Opis projektu

### 1.1. Cel aplikacji

Weather Station Control Center jest kompletnym systemem telemetrycznym klasy IoT dashboard, którego zadaniem jest gromadzenie, przetwarzanie, analizowanie i prezentowanie danych środowiskowych pochodzących z czujników temperatury, wilgotności oraz ciśnienia. Projekt łączy w sobie kilka warstw systemowych: firmware urządzeń pomiarowych opartych o ESP32, backend odpowiedzialny za przyjmowanie i utrwalanie pomiarów, bazę danych PostgreSQL oraz nowoczesny frontend webowy służący do bieżącego monitorowania i analizy danych historycznych.

Głównym celem aplikacji nie jest wyłącznie wyświetlanie surowych odczytów, ale zbudowanie czytelnego, ergonomicznego środowiska do interpretacji trendów czasowych. System pozwala więc nie tylko odpowiedzieć na pytanie „jaka jest temperatura teraz”, ale również „jak zmieniała się temperatura w ciągu dnia”, „jak wyglądał profil tygodniowy”, „czy wartości odbiegają od typowego przebiegu” oraz „czy urządzenie działa poprawnie i pozostaje online”.

### 1.2. Problem, który rozwiązuje system

Projekt rozwiązuje kilka typowych problemów występujących w małych i średnich wdrożeniach telemetrycznych:

- rozproszenie danych pomiarowych pomiędzy urządzenia, pliki i lokalne logi,
- brak jednego panelu do obserwacji stanu środowiska i urządzeń,
- trudność w analizie danych historycznych, gdy odczytów jest dużo i mają wysoką częstotliwość,
- konieczność szybkiego odróżnienia aktualnego stanu od anomalii i od długoterminowego trendu,
- problem z czytelną prezentacją wielu serii czasowych na urządzeniach mobilnych,
- konieczność połączenia świata embedded/IoT z ergonomią nowoczesnej aplikacji webowej.

W praktyce system stanowi połączenie „mini stacji pogodowej”, panelu operatorskiego i dashboardu telemetrycznego.

### 1.3. Grupa docelowa

Projekt może być używany przez kilka grup odbiorców:

- użytkowników domowych budujących własne stacje pogodowe lub monitoring klimatu w domu,
- hobbystów IoT pracujących z ESP32, czujnikami AHT20 i BMP280 oraz infrastrukturą self-hosted lub cloud,
- małe laboratoria, warsztaty, szklarnie, pracownie techniczne i pomieszczenia wymagające monitorowania warunków środowiskowych,
- osoby przygotowujące projekt inżynierski, dyplomowy lub demonstracyjny, gdzie ważne jest pokazanie pełnego przepływu od sensora do dashboardu,
- zespoły produktowe i developerskie chcące mieć gotowy wzorzec architektoniczny dla systemu telemetrycznego o umiarkowanej skali.

### 1.4. Zastosowania systemu

System może być wykorzystany do:

- monitorowania warunków na zewnątrz budynku,
- monitorowania klimatu wewnętrznego w biurze, warsztacie lub serwerowni,
- obserwacji warunków w szklarni lub pomieszczeniach gospodarczych,
- testowania i demonstracji architektury IoT end-to-end,
- prototypowania produktu telemetrycznego przed skalowaniem do większej liczby urządzeń i bardziej zaawansowanego protokołu transportowego.

### 1.5. Charakter projektu

Projekt ma charakter pełnego systemu referencyjnego. Nie jest jedynie makietą interfejsu ani prostym przykładem pojedynczego endpointu. Repozytorium zawiera:

- firmware ESP32 przygotowany pod PlatformIO,
- symulator generujący realistyczne dane historyczne i live,
- backend REST + Socket.IO,
- model danych w Prisma i migracje dla PostgreSQL,
- frontend typu SPA w React,
- konfigurację produkcyjną pod wdrożenie na Railway z bazą PostgreSQL,
- dodatkową dokumentację architektoniczną dotyczącą alternatywy MQTT.

Oznacza to, że system obejmuje cały łańcuch wartości: urządzenie, transmisję, zapis, przetwarzanie, wizualizację i warstwę operacyjną.

### 1.6. Dlaczego minimalistyczny dashboard jest istotny

Minimalizm w systemach telemetrycznych nie jest wyłącznie decyzją estetyczną. W takim projekcie pełni funkcję techniczną i poznawczą:

- redukuje obciążenie poznawcze użytkownika,
- pozwala szybciej wychwycić zmianę stanu,
- poprawia czytelność metryk liczbowych,
- ułatwia korzystanie z aplikacji na małych ekranach,
- zmniejsza ryzyko „przeładowania dashboardu”, czyli sytuacji, w której użytkownik widzi dużo danych, ale mało informacji.

W tym projekcie minimalizm jest realizowany poprzez spokojną siatkę layoutu, ograniczoną liczbę akcentów kolorystycznych, wyraźną hierarchię informacji, brak nadmiaru dekoracji i podział widoków na odrębne cele analityczne.

## 2. Architektura systemu

### 2.1. Architektura ogólna

System ma architekturę wielowarstwową:

1. warstwa urządzeń i źródeł danych,
2. warstwa ingestu danych,
3. warstwa trwałego przechowywania,
4. warstwa logiki domenowej i analitycznej,
5. warstwa prezentacyjna,
6. warstwa wdrożeniowo-operacyjna.

W aktualnej implementacji przepływ wygląda następująco:

- ESP32 lub symulator wysyła pomiar przez HTTP `POST /api/measurements`,
- backend waliduje payload przez Zod,
- backend tworzy lub aktualizuje encję sensora oraz zapisuje pomiar do PostgreSQL przez Prisma,
- backend uruchamia logikę alertową i emituje zdarzenia Socket.IO,
- frontend korzysta z REST do pobierania danych historycznych i ze Socket.IO do odświeżeń live,
- interfejs użytkownika prezentuje aktualne metryki, statystyki i historię.

### 2.2. Frontend

Frontend został zbudowany jako aplikacja SPA w oparciu o React 19, TypeScript i Vite. Odpowiada za:

- routing widoków,
- pobieranie danych z backendu,
- przechowywanie ustawień użytkownika po stronie klienta,
- prezentację danych historycznych i bieżących,
- obsługę aktualizacji live przez Socket.IO,
- eksport danych i podstawowe operacje użytkownika na czujnikach.

### 2.3. Backend

Backend bazuje na Node.js, Express 5 i TypeScript. Jego odpowiedzialności obejmują:

- przyjmowanie i walidację pomiarów,
- zapis danych do PostgreSQL,
- agregację i przygotowanie odpowiedzi dla wykresów,
- wyliczanie statystyk i trendów,
- zarządzanie listą sensorów,
- logikę alertów progowych,
- wykrywanie statusu online/offline,
- publikowanie zdarzeń w czasie rzeczywistym przez Socket.IO,
- serwowanie zbudowanego frontendu w środowisku produkcyjnym.

### 2.4. Źródła danych

System obsługuje dwa typy źródeł danych:

- fizyczne urządzenia ESP32 z czujnikami AHT20 i BMP280,
- symulator TypeScript generujący realistyczny strumień danych historycznych i live.

To rozróżnienie jest dodatkowo odzwierciedlone w frontendzie przez tryb `real/demo`, oparty o prefiks identyfikatora sensora. Sensory demo mają identyfikatory rozpoczynające się od `sim-`, a sensory fizyczne używają nazw typu `esp32-weather-01`.

### 2.5. Przepływ danych

Przepływ danych można opisać w sześciu krokach:

1. Sensor wykonuje odczyt.
2. Odczyt jest serializowany do JSON.
3. JSON jest wysyłany do backendu przez HTTP z nagłówkiem `x-api-key`.
4. Backend zapisuje dane do PostgreSQL i aktualizuje stan sensora.
5. Backend emituje `measurement:new`, `sensor:status` oraz opcjonalnie `alert:event`.
6. Frontend odświeża odpowiednie query cache i renderuje nowy stan.

### 2.6. Komunikacja klient-serwer

W systemie zastosowano dwa komplementarne kanały komunikacyjne:

- REST API do pobierania danych, filtrowania, zarządzania czujnikami i alertami,
- Socket.IO do powiadomień live.

Takie rozdzielenie jest zasadne architektonicznie:

- REST dobrze obsługuje operacje idempotentne, filtrowanie i pobieranie historii,
- Socket.IO minimalizuje opóźnienie przy aktualizacji UI i eliminuje agresywny polling.

### 2.7. Przechowywanie danych

Dane są zapisywane w PostgreSQL. Trwałe przechowywanie obejmuje:

- metadane sensorów,
- historię pomiarów,
- reguły alertowe,
- zdarzenia alertowe.

W projekcie zastosowano indeksy po `createdAt`, `sensorId` oraz statusie online/acknowledged. Jest to szczególnie ważne przy:

- pobieraniu najnowszych pomiarów,
- filtrowaniu historii dla konkretnego sensora,
- wyświetlaniu alertów i wykresów czasowych,
- wykrywaniu urządzeń, które przestały raportować.

### 2.8. Agregacja danych i przetwarzanie historii

Backend realizuje agregację w funkcji `aggregateMeasurements`. Dla interwałów `5m`, `15m`, `1h`, `6h`, `1d` tworzony jest bucket czasowy, w którym liczone są średnie wartości temperatury, wilgotności i ciśnienia oraz średnie dla opcjonalnych metryk, takich jak RSSI czy napięcie baterii.

Agregacja jest kluczowa z punktu widzenia systemu telemetrycznego, ponieważ:

- zmniejsza wolumen danych przesyłanych do frontendu,
- poprawia czytelność wykresów,
- pozwala budować widoki overview bez utraty informacji trendowej,
- ogranicza koszt renderowania dużych serii danych.

## 3. Architektura frontendowa

### 3.1. Struktura aplikacji frontendowej

Frontend ma klasyczny podział na:

- `pages` odpowiadające za widoki routowalne,
- `components` dla elementów wielokrotnego użycia,
- `hooks` dla logiki współdzielonej,
- `lib` dla funkcji pomocniczych i agregacji po stronie klienta,
- `api` dla klienta HTTP,
- `app` dla ustawień globalnych i kontekstu.

To rozdzielenie sprzyja czytelności kodu i upraszcza dalszy rozwój.

### 3.2. Routing

Routing oparto o `react-router-dom`. Główne trasy to:

- `/` dashboard,
- `/charts` widoki analityczne dzień/tydzień/miesiąc,
- `/measurements` tabela pomiarów,
- `/alerts` panel alertów,
- `/settings` ustawienia i zarządzanie sensorami,
- `/api-docs` skrócona dokumentacja API,
- `/sensors/:id` widok szczegółowy pojedynczego sensora.

Wszystkie główne trasy renderowane są wewnątrz `AppShell`, który zapewnia wspólny layout, nagłówek, przełącznik trybu danych i status połączenia live.

### 3.3. Zarządzanie stanem

Projekt stosuje mieszany model zarządzania stanem:

- stan serwerowy utrzymywany jest przez React Query,
- stan ustawień użytkownika jest przechowywany w `SettingsContext`,
- stan lokalny komponentów obsługiwany jest przez `useState`.

To podejście jest dobrze dopasowane do skali projektu:

- React Query upraszcza cache, retry, odświeżanie i invalidację,
- Context wystarcza dla motywu, jednostek i trybu demo/real,
- nie ma potrzeby wprowadzania cięższego store globalnego.

### 3.4. Obsługa zakresów czasu

Frontend implementuje trzy główne tryby analizy czasowej:

- `day`,
- `week`,
- `month`.

Dla każdego trybu wyliczany jest przedział `from/to` funkcją `getPeriodRange`, a następnie dobierany jest odpowiedni interwał zapytania:

- `day`: `15m` dla danych realnych, `5m` dla demo,
- `week`: `1h`,
- `month`: `6h`.

To pokazuje, że frontend nie jest jedynie pasywnym konsumentem danych, ale aktywnie steruje poziomem szczegółowości.

### 3.5. Logika przełączania widoków i drill-down

Widok `ChartsPage` zawiera ważną logikę nawigacyjną:

- użytkownik może przechodzić pomiędzy miesiącem, tygodniem i dniem,
- kliknięcie dnia w tygodniu lub miesiącu otwiera widok dzienny,
- aplikacja zapamiętuje kontekst powrotu przez `returnContext`,
- możliwe jest więc przejście z overview do detail bez utraty orientacji.

Jest to bardzo wartościowy wzorzec UX dla aplikacji telemetrycznych, ponieważ rozwiązuje napięcie między szerokim oglądem danych a potrzebą analizy szczegółu.

### 3.6. Responsywność

Układ został zaprojektowany responsywnie:

- na desktopie widoczny jest lewy panel nawigacyjny,
- na mobile nawigacja przechodzi do poziomego paska w nagłówku,
- karty i tabele układają się w jedną kolumnę lub siatkę zależnie od szerokości ekranu,
- wykresy osadzane są w `ResponsiveContainer`.

Projekt nie jest prostą translacją desktopu na mobile. Widać świadome uproszczenie interfejsu dla mniejszych viewportów.

### 3.7. Dark mode

Dark mode i light mode są obsługiwane przez własny zestaw CSS custom properties przełączanych atrybutem `data-theme`. To rozwiązanie:

- jest lekkie,
- nie wymaga zewnętrznego systemu themingu,
- pozwala zachować spójność kolorów wykresów, kart i kontrolek.

### 3.8. Loading states i error states

Frontend zawiera jawne stany:

- ładowania danych,
- pustych danych,
- błędów pobierania,
- braku sensorów dla aktualnego trybu danych,
- braku danych dla wybranego dnia.

To ważny aspekt dojrzałości produktu. W aplikacjach telemetrycznych system przez część czasu naturalnie operuje na danych niepełnych, chwilowo niedostępnych lub opóźnionych, więc obsługa „stanów pośrednich” jest częścią logiki biznesowej, nie jedynie detalem UI.

## 4. System prezentacji danych

### 4.1. Założenie ogólne

System prezentacji danych jest zbudowany wokół założenia, że różne horyzonty czasowe wymagają różnych poziomów szczegółowości i innych komponentów wizualnych. To jedna z najważniejszych decyzji architektonicznych w projekcie.

### 4.2. Dlaczego wykresy dzienne działają inaczej niż tygodniowe i miesięczne

Widok dzienny służy analizie intraday. Użytkownik chce zobaczyć przebieg zmian w ciągu godzin, wykryć pik temperatury, spadek wilgotności albo nietypową sekwencję w wybranej części dnia. Z tego powodu:

- liczba punktów może być większa,
- wykres liniowy jest centralnym elementem interfejsu,
- tooltip ma bogatszą zawartość,
- użytkownik może przełączać aktywną metrykę.

Widoki tygodniowy i miesięczny mają inny cel. Mają dawać orientację, nie mikroskopijny detal. Gdyby użyć tam surowych danych minutowych, pojawiłyby się problemy:

- tysiące punktów w jednej osi czasu,
- trudność w rozróżnieniu pojedynczych dni,
- nadmiar etykiet,
- spadek płynności renderowania,
- bardzo słaba czytelność na mobile.

Dlatego tygodniowy i miesięczny poziom prezentacji są kartami-dniami, a nie dużymi gęstymi wykresami ciągłymi.

### 4.3. Problem przeładowania danych

Dashboard telemetryczny może bardzo łatwo stać się zbiorem zbyt wielu wykresów i surowych liczb. Projekt ogranicza ten problem kilkoma mechanizmami:

- dashboard główny pokazuje tylko najważniejsze wskaźniki i listę urządzeń,
- widok wykresów jest oddzielny od widoku tabelarycznego,
- overview i detail są rozdzielone na osobne tryby,
- duże zbiory danych są agregowane przed prezentacją,
- wybór metryki w day view upraszcza percepcję.

### 4.4. Problem czytelności wykresów

Czytelność wykresów zależy od:

- liczby punktów,
- skali pionowej,
- jakości tooltipów,
- liczby jednocześnie widocznych serii,
- kontrastu i spójności kolorów.

Projekt rozwiązuje to poprzez:

- ograniczenie liczby aktywnych metryk naraz w widoku dziennym,
- używanie osobnych akcentów kolorystycznych dla temperatury, wilgotności i ciśnienia,
- rezygnację z punktów na każdej próbce i pozostawienie jedynie `activeDot`,
- subtelne linie siatki,
- tooltipy o wyraźnej strukturze,
- dobieranie interwału backendowego do zakresu czasu.

### 4.5. Agregacja danych jako element UX

Agregacja nie jest tu wyłącznie optymalizacją backendową. Jest elementem interfejsu. Dzięki niej użytkownik widzi:

- rzeczywisty trend,
- średni profil czasowy,
- mniej szumu przypadkowego,
- porównywalne dni i okresy.

Szczególnie istotne jest to dla ciśnienia i wilgotności, gdzie pojedyncze odczyty mogą być mniej informacyjne niż przebieg uśredniony.

### 4.6. Drill-down architecture

Architektura drill-down działa według wzorca:

- miesiąc jako widok makro,
- tydzień jako widok średniej skali,
- dzień jako widok szczegółowy.

Użytkownik może:

- zobaczyć charakter całego miesiąca,
- wykryć interesujący dzień,
- wejść do danego dnia,
- przeanalizować przebieg godzinowy.

To rozwiązanie dobrze odpowiada naturze danych środowiskowych, które są sekwencyjne i kontekstowe.

### 4.7. Overview vs detail

W projekcie występują dwa różne tryby poznawcze:

- overview, czyli szybka orientacja w stanie systemu,
- detail, czyli analiza przyczyn i przebiegu zmian.

Overview jest realizowany przez:

- dashboard z kartami,
- listę sensorów,
- widoki tygodniowe i miesięczne.

Detail jest realizowany przez:

- day view,
- widok szczegółowy pojedynczego sensora,
- tabelę pomiarów,
- historię alertów.

### 4.8. Summary cards

Karty metryk w dashboardzie pokazują:

- średnie dla ostatnich 24 godzin,
- stan aktywnych sensorów,
- relację do poprzedniego okna czasowego,
- duże liczby o wysokiej czytelności.

To odpowiada wzorcowi „glanceable analytics”, czyli informacji możliwej do odczytania jednym spojrzeniem.

### 4.9. Wykresy liniowe

W projekcie wykresy liniowe są używane wtedy, gdy istotny jest przebieg ciągły:

- dzienny profil zmiany temperatury,
- historia wybranego sensora,
- odczyt trendów i momentów przełomu.

Liniowa reprezentacja jest właściwa dla szeregów czasowych o ciągłej naturze fizycznej.

### 4.10. Sparklines i mikrotrend

Projekt nie zawiera klasycznych miniaturek sparkline w każdej karcie, ale rolę mikrotrendu pełni:

- trend delta w `MetricCard`,
- wskazanie kierunku względem poprzedniego okna,
- liczbowy sygnał zmian bez rozbudowanej miniwizualizacji.

Jest to zgodne z minimalistycznym charakterem interfejsu.

### 4.11. Tooltipy i hover states

Tooltipy są ważnym elementem dokładności odczytu. W szczególności `DailySensorChart` pokazuje:

- godzinę punktu,
- temperaturę,
- wilgotność,
- ciśnienie.

To oznacza, że nawet przy aktywnej pojedynczej serii użytkownik zachowuje kontekst pozostałych metryk.

Hover states są subtelne:

- karty lekko unoszą się lub zmieniają tło,
- elementy interaktywne wzmacniają kontrast,
- hover nie przeszkadza, tylko sygnalizuje aktywność.

### 4.12. UX wykresów

UX wykresów został zaprojektowany pod szybkie odczytywanie danych, a nie pod prezentacyjną ornamentykę. Najważniejsze cechy:

- brak przeładowanych legend i dodatkowych warstw,
- czytelne ticki osi,
- stabilna siatka,
- spójna kolorystyka metryk,
- logiczny podział na widoki czasu,
- możliwość filtrowania po sensorach.

## 5. Widoki aplikacji

### 5.1. Dashboard główny

Dashboard pełni funkcję startowego pulpitu operacyjnego. Łączy:

- uśrednione aktualne warunki,
- karty trendów 24h,
- liczbę urządzeń online,
- listę sensorów z podstawowymi danymi,
- komunikaty o anomaliach.

Rozwiązuje problem szybkiej orientacji bez wchodzenia w szczegółowe analizy.

### 5.2. Day View

Funkcja widoku:

- szczegółowa analiza jednego dnia,
- identyfikacja przebiegów godzinowych,
- porównywanie metryk wewnątrz danego dnia.

Rodzaj danych:

- punkty czasowe zagregowane do `5m` lub `15m`,
- średnie dzienne,
- min/max dla trzech głównych metryk.

Sposób prezentacji:

- karty podsumowania dla temperatury, wilgotności i ciśnienia,
- duży wykres liniowy aktywnej metryki,
- przełącznik metryki,
- przycisk powrotu do tygodnia lub miesiąca.

Interakcje:

- przełączanie metryki,
- nawigacja po dniach,
- wejście do dnia z poziomu overview.

Problemy, które rozwiązuje:

- pokazuje rzeczywisty profil dobowy,
- pozwala znaleźć godziny skrajnych wartości,
- ułatwia interpretację pojedynczego dnia bez szumu danych z innych okresów.

### 5.3. Week View

Funkcja widoku:

- zrozumienie tygodniowego rytmu zmian,
- porównanie dni względem siebie,
- wybór dnia do dalszej analizy.

Rodzaj danych:

- dzienne podsumowania,
- kompletność danych,
- średnie i min/max.

Sposób prezentacji:

- siedem dużych kart dnia,
- każda karta zawiera temperaturę średnią, temperaturę min/max oraz skrócone metryki wilgotności i ciśnienia.

Interakcje:

- kliknięcie dnia przechodzi do day view,
- dni puste lub przyszłe są nieaktywne.

Problemy, które rozwiązuje:

- unika gęstego wykresu tygodniowego,
- daje porównywalne „kafelki dni”,
- poprawia czytelność na mniejszych ekranach.

### 5.4. Month View

Funkcja widoku:

- ocena rozkładu danych w skali miesiąca,
- identyfikacja dni skrajnych,
- znalezienie luk w danych.

Rodzaj danych:

- dzienne summary dla wszystkich dni miesiąca,
- status kompletności,
- podstawowy zestaw metryk.

Sposób prezentacji:

- siatka zbliżona do kalendarza,
- każdy dzień jako karta z temperaturą średnią i zakresem oraz skróconym opisem wilgotności i ciśnienia.

Interakcje:

- kliknięcie dnia otwiera detail dzienny,
- puste pola przed początkiem miesiąca zachowują strukturę tygodni kalendarzowych na desktopie.

Problemy, które rozwiązuje:

- daje przestrzenną, intuicyjną orientację w miesiącu,
- dobrze pokazuje nieciągłości danych,
- wspiera analizę sezonowości i regularności.

### 5.5. Widok szczegółowy sensora

Ten widok pozwala skupić się na pojedynczym urządzeniu. Pokazuje:

- status online/offline,
- lokalizację,
- RSSI i napięcie baterii,
- aktualne wartości głównych metryk,
- uproszczoną historię temperatury.

Jest szczególnie ważny przy diagnostyce urządzeń i monitorowaniu kondycji pojedynczego punktu pomiarowego.

### 5.6. Widok tabelaryczny pomiarów

Widok tabelaryczny służy do:

- audytu surowych pomiarów,
- szybkiego sortowania,
- eksportu CSV,
- weryfikacji jakości danych.

Rozwiązuje problem, którego nie załatwia sam wykres: użytkownik czasem potrzebuje zobaczyć dokładne rekordy.

### 5.7. Widok alertów

Panel alertów jest podzielony na:

- formularz reguł,
- historię zdarzeń,
- listę aktywnych reguł.

To miejsce pracy reaktywnej: użytkownik ustawia progi, a następnie śledzi ich naruszenia.

### 5.8. Widok ustawień

Widok ustawień obejmuje:

- motyw,
- interwał odświeżania,
- jednostki temperatury i ciśnienia,
- możliwość edycji nazw i lokalizacji sensorów.

Z punktu widzenia produktu jest to moduł personalizacji oraz podstawowego administrowania metadanymi urządzeń.

## 6. System agregacji danych

### 6.1. Zakres agregacji

System obsługuje kilka rodzajów agregacji:

- średnie w bucketach czasowych dla wykresów,
- min/max/avg/latest/standardDeviation dla statystyk,
- delta i trend względem poprzedniego okresu,
- agregację dzienną dla week/month view,
- agregację per sensor i cross-sensor dla overview.

### 6.2. Min/max/avg

W projekcie min/max/avg są używane w kilku miejscach:

- dashboard 24h,
- `SensorDetailPage`,
- day/week/month summary,
- analiza trendu i anomalii.

Zastosowanie tych statystyk jest uzasadnione charakterem danych środowiskowych. Same wartości chwilowe są mniej istotne niż ich rozkład w czasie.

### 6.3. Grupowanie po dniach

Frontendowa warstwa `sensor-aggregation.ts` buduje dzienne summary z listy pomiarów. Grupowanie po dniach służy do:

- budowy kart tygodniowych i miesięcznych,
- wyliczenia completeness,
- przygotowania day drill-down.

Każdy dzień posiada zestandaryzowaną strukturę, niezależnie od tego, czy zawiera pełne dane, częściowe dane, czy ich brak.

### 6.4. Agregacja tygodniowa i miesięczna

W projekcie nie istnieje osobna tabela z gotowymi agregatami tygodniowymi lub miesięcznymi. Zamiast tego:

- backend agreguje pomiary do poziomu godzinowego lub sześciogodzinnego,
- frontend składa z nich dzienne summary,
- tydzień i miesiąc są budowane przez kompozycję obiektów dziennych.

To rozwiązanie jest wystarczające dla obecnej skali projektu, ale przy większej liczbie urządzeń można rozważyć preagregację materializowaną.

### 6.5. Optymalizacja agregacji

Obecna optymalizacja polega na:

- agregacji po stronie backendu dla interwałów większych niż `raw`,
- ograniczaniu liczby punktów przez dobór interwału do widoku,
- paginacji wyników surowych,
- pobieraniu danych w porządku chronologicznym tam, gdzie wymaga tego analiza.

Warto zauważyć, że dla interwałów agregowanych backend pobiera cały zakres i dopiero potem wykonuje bucketowanie w pamięci. Dla obecnej skali jest to poprawne, ale przy dużych wolumenach warto przenieść część agregacji do SQL albo użyć materialized views.

### 6.6. Cache

Obecnie cache działa przede wszystkim po stronie frontendu przez React Query:

- `staleTime` ustawiono na 20 sekund,
- invalidacja zachodzi po zdarzeniach live,
- nie ma dodatkowej warstwy Redis ani server-side cache.

Jest to rozsądne dla systemu hostowanego na Railway przy małej i średniej liczbie urządzeń.

### 6.7. Obliczenia statystyczne

Backend oblicza:

- średnią,
- minimum,
- maksimum,
- wartość ostatnią,
- odchylenie standardowe,
- trend kierunkowy i procentowy.

Dodatkowo wykrywanie anomalii wykorzystuje regułę dwóch odchyleń standardowych od średniej dla temperatury i wilgotności. To prosta, ale praktyczna heurystyka.

## 7. Struktury danych

### 7.1. Model Sensor

Encja `Sensor` zawiera:

- identyfikator urządzenia,
- nazwę i typ,
- lokalizację opisową oraz opcjonalne współrzędne,
- opis,
- wersję firmware,
- znaczniki czasu utworzenia i aktualizacji,
- `lastSeenAt`,
- flagę `isOnline`.

Model ten łączy funkcję katalogu urządzeń i warstwy operacyjnej.

### 7.2. Model Measurement

Encja `Measurement` przechowuje:

- `sensorId`,
- `sensorName`,
- `sensorType`,
- `temperature`,
- `humidity`,
- `pressure`,
- opcjonalne `rssi`,
- opcjonalne `batteryVoltage`,
- `status`,
- `firmwareVersion`,
- `createdAt`.

Przechowywanie `sensorName` i `sensorType` redundatnie w pomiarze jest świadomą decyzją denormalizacyjną. Pozwala zachować historyczny kontekst próbki nawet wtedy, gdy metadane sensora zmienią się później.

### 7.3. Model AlertRule

Reguła alertowa przechowuje:

- metrykę,
- operator porównania,
- próg,
- stan aktywności,
- opcjonalne związanie z konkretnym sensorem.

Dzięki opcjonalnemu `sensorId` jedna reguła może dotyczyć wszystkich urządzeń danego typu logicznie, co upraszcza konfigurację.

### 7.4. Model AlertEvent

Zdarzenie alertowe zawiera:

- sensor, którego dotyczy,
- opcjonalne odwołanie do reguły,
- komunikat,
- metrykę,
- wartość wyzwalającą,
- czas utworzenia,
- flagę `acknowledged`.

To rozdzielenie reguł i zdarzeń jest poprawne domenowo, ponieważ umożliwia trwałą historię naruszeń nawet po późniejszej zmianie konfiguracji progów.

### 7.5. Format danych z sensorów

Przykładowy payload pomiarowy ma strukturę:

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
  "firmwareVersion": "1.0.0",
  "timestamp": "2026-05-25T09:30:00.000Z"
}
```

Walidacja backendowa dodatkowo dopuszcza:

- `location`,
- `latitude`,
- `longitude`,
- `description`.

### 7.6. Timestampy

System używa timestampów ISO 8601. Istnieją dwa tryby nadawania czasu:

- backend może nadać czas przyjęcia pomiaru,
- urządzenie może przesłać własny `timestamp`, jeśli ma aktywną synchronizację czasu.

W firmware domyślnie `SEND_DEVICE_TIMESTAMP = false`, co upraszcza wdrożenie i redukuje ryzyko błędów wynikających z braku synchronizacji zegara urządzenia.

### 7.7. Serie czasowe

Serie czasowe w systemie mają charakter wielometrykowy. Każdy pomiar obejmuje kilka wartości fizycznych oraz wskaźniki jakości połączenia i zasilania. Oznacza to, że jedna próbka jest jednocześnie:

- obserwacją środowiska,
- sygnałem stanu technicznego urządzenia,
- wejściem do logiki alertów i anomalii.

### 7.8. Obiekty agregacji

Backendowe obiekty agregacji zawierają:

- uśrednione wartości bucketu,
- czas bucketu,
- identyfikację sensora,
- zredukowane wartości dodatkowych metryk.

Frontendowe obiekty dzienne (`DailySensorSummary`) zawierają:

- `avg/min/max` dla temperatury, wilgotności i ciśnienia,
- listę punktów wykresu,
- liczność pomiarów,
- liczbę sensorów,
- kompletność danych.

### 7.9. DTO i odpowiedzi API

Najważniejsze odpowiedzi API to:

- lista sensorów z `latestMeasurement`,
- `MeasurementResponse` z polami `data` i `meta`,
- `StatsResponse` z zakresem, liczbą pomiarów, statystykami i anomaliami,
- listy reguł i zdarzeń alertowych,
- odpowiedź healthcheck.

Spójność DTO jest dobra i pozwala frontendowi pracować w sposób przewidywalny.

## 8. UX/UI

### 8.1. Filozofia minimalizmu

Minimalizm w tym systemie nie jest sterylny ani „pusty”. Jest funkcjonalny. Interfejs:

- ogranicza liczbę jednoczesnych priorytetów,
- używa kart jako samodzielnych bloków informacji,
- rozdziela konteksty pracy użytkownika na osobne widoki,
- stosuje spokojne powierzchnie i zgaszoną paletę.

### 8.2. Weather-app inspired UI

Inspiracja aplikacją pogodową jest widoczna szczególnie na dashboardzie:

- duża centralna temperatura,
- spokojna prezentacja „aktualnych warunków”,
- szybki odczyt bez konieczności analizy wykresów,
- nacisk na wrażenie lekkości i płynności.

Jednocześnie projekt nie rezygnuje z cech profesjonalnego dashboardu:

- posiada alerty,
- ma historyczne zakresy czasu,
- rozróżnia dane live i historyczne,
- pokazuje stan urządzeń, a nie tylko metryk.

### 8.3. Czytelność danych

Czytelność wspierają:

- duża typografia dla kluczowych liczb,
- rozłączność pomiędzy sekcjami informacji,
- ograniczona liczba kolorów sygnalnych,
- powtarzalny system etykiet i kart,
- mała liczba elementów dekoracyjnych.

### 8.4. Whitespace i hierarchy

System używa dużej ilości whitespace, aby:

- oddzielić poziomy informacji,
- umożliwić szybkie skanowanie wzrokiem,
- zmniejszyć poczucie „ścisku” na dashboardzie.

Hierarchia jest czytelna:

- największe liczby pokazują stan główny,
- nagłówki sekcji porządkują kontekst,
- opisy pomocnicze mają niższy kontrast,
- dane wtórne są odsuwane do drugiego planu.

### 8.5. Typography i spacing

Typografia jest neutralna i nowoczesna. W projekcie wykorzystano prosty, bezszeryfowy krój, a ciężar wizualny budowany jest przede wszystkim przez:

- rozmiar nagłówków,
- wagę fontu,
- rytm pionowych odstępów,
- kontrast koloru.

Spacing jest konsekwentny. Sekcje oddychają, a komponenty kartowe mają wyraźne paddingi, co podnosi ergonomię odbioru.

### 8.6. Accessibility

Z perspektywy dostępności w projekcie są już obecne:

- czytelne kontrasty trybu jasnego i ciemnego,
- etykiety i teksty pomocnicze,
- stan disabled dla elementów nieaktywnych,
- semantyczne przyciski i formularze,
- responsywność wykresów.

Do rozwoju warto rozważyć:

- pełniejsze wsparcie klawiaturowe dla wszystkich kart klikanych,
- bardziej rozbudowane `aria-label` dla wykresów,
- testy kontrastu dla wszystkich stanów kolorystycznych.

### 8.7. Mobile UX

Na mobile system działa poprzez:

- uproszczoną nawigację poziomą,
- pionowe układanie sekcji,
- zwężenie siatek do jednej lub dwóch kolumn,
- utrzymanie dużych stref dotykowych przy przełącznikach i przyciskach.

To ważne, bo aplikacje telemetryczne często są używane mobilnie „w biegu”, np. przy szybkim sprawdzaniu stanu urządzeń.

### 8.8. Desktop UX

Desktop wykorzystuje stały panel boczny i większą przestrzeń na:

- wielokolumnowe siatki kart,
- bardziej rozbudowane overview,
- wygodniejszą analizę tabel i kart kalendarzowych.

### 8.9. Dark mode

Dark mode ma znaczenie praktyczne:

- poprawia komfort pracy nocą,
- jest naturalny dla paneli operatorskich,
- zwiększa spójność estetyczną z nowoczesnym narzędziem telemetrycznym.

W projekcie ważne jest, że dark mode nie jest tylko odwróceniem kolorów, ale ma własny zestaw tonów tła, obramowań i akcentów.

### 8.10. Animacje i mikrointerakcje

Animacje są ograniczone, ale sensowne:

- wejście paneli przez `Framer Motion`,
- lekkie uniesienie kart przy hover,
- płynne przejścia layoutowe.

Takie mikrointerakcje podnoszą poczucie jakości interfejsu, nie odciągając uwagi od danych.

## 9. Wydajność aplikacji

### 9.1. Podejście ogólne

Projekt jest zaprojektowany tak, aby zachować dobrą wydajność bez nadmiernej złożoności infrastrukturalnej. Optymalizacja odbywa się głównie przez:

- agregację,
- rozsądne limity zapytań,
- cache po stronie klienta,
- zdarzeniowe odświeżanie zamiast ciągłego pollingu.

### 9.2. Lazy loading

W aktualnej implementacji routing nie wykorzystuje jeszcze `React.lazy`, więc pełny bundle może być większy niż minimalnie konieczne. Jest to obszar możliwej optymalizacji przy dalszym rozwoju.

### 9.3. Memoization

Frontend stosuje `useMemo` tam, gdzie ma to uzasadnienie:

- filtrowanie sensorów po trybie,
- wyliczanie kart i zbiorów pochodnych,
- budowanie podsumowań dziennych, tygodniowych i miesięcznych,
- wybór aktywnych sensorów.

To ogranicza zbędne przeliczenia przy częstych aktualizacjach danych.

### 9.4. Ograniczanie renderów

Ograniczanie renderów wynika z:

- separacji query cache,
- precyzyjnych `queryKey`,
- lokalnego scope’u stanu komponentów,
- odświeżania danych przez invalidację tylko określonych grup zapytań.

### 9.5. Wydajność wykresów

Wydajność wykresów wspierają:

- agregacja przed renderowaniem,
- brak punktów dla każdej próbki,
- pojedyncza aktywna seria w day view,
- użycie `ResponsiveContainer`.

### 9.6. Agregacja po stronie backendu

To jedna z kluczowych decyzji wydajnościowych projektu. Gdyby front otrzymywał pełne surowe dane dla wszystkich widoków, koszty byłyby wyższe:

- większy transfer,
- więcej pracy JavaScript po stronie klienta,
- cięższe renderowanie wykresów,
- wolniejsze działanie na mobile.

### 9.7. Caching

System nie używa obecnie dedykowanej warstwy cache po stronie serwera. Dla wdrożenia na Railway i małej liczby urządzeń jest to uzasadnione. W przyszłości można rozważyć:

- Redis,
- cache odpowiedzi dla statystyk,
- preagregację okresową.

### 9.8. Debounce i throttle

Projekt nie wymaga rozbudowanego debounce dla wejścia użytkownika, ponieważ zakres interakcji jest umiarkowany. Throttling logicznie występuje w samym modelu telemetrycznym:

- ESP32 wysyła pomiary co ustalony interwał,
- offline check działa raz na minutę,
- frontend odświeża query zgodnie z ustawionym interwałem.

### 9.9. Optymalizacja requestów

Optymalizacja requestów obejmuje:

- filtrowanie po `sensorId`,
- określanie `from/to`,
- wybór `interval`,
- limity i paginację dla surowych pomiarów,
- użycie websocketów do reakcji live.

## 10. Responsywność

### 10.1. Strategia

Projekt jest praktycznie „adaptive responsive”, a nie czysto mobile-first lub desktop-first. Struktura działa na obu klasach urządzeń, ale układ desktopowy wykorzystuje pełniej dostępną przestrzeń.

### 10.2. Grid system

Responsywność opiera się o:

- gridy Tailwindowe,
- przełączanie liczby kolumn według breakpointów,
- warunkowe ukrywanie i pokazywanie elementów layoutu.

### 10.3. Zachowanie kart

Karty:

- na mobile stają się pełnoszerokie lub dwukolumnowe,
- na desktopie układają się w większe siatki,
- zachowują spójny rytm pionowy niezależnie od rozdzielczości.

### 10.4. Zachowanie wykresów

Wykresy korzystają z kontenera responsywnego i minimalizują ryzyko overflow. Dodatkowo:

- miesięczny widok przechodzi z układu kalendarzowego desktopowego do siatki bardziej liniowej na mobile,
- tygodniowe karty pozostają czytelne dzięki modularnej strukturze.

### 10.5. Touch interactions

UI wykorzystuje klasyczne duże przyciski, toggle i selektory, które dobrze nadają się do interakcji dotykowej. Szczególnie ważne jest to w:

- przełączaniu zakresu czasu,
- nawigacji po dniach,
- wyborze sensorów i metryk.

### 10.6. Adaptive layout

Układ adaptuje się nie tylko wielkością, ale też strukturą nawigacji. To dojrzałe podejście, ponieważ mobilny użytkownik ma inne ograniczenia percepcyjne niż użytkownik desktopowy.

## 11. Bezpieczeństwo

### 11.1. Walidacja danych

Walidacja wejścia jest jedną z mocniejszych stron obecnej implementacji. Zod sprawdza:

- wymagane pola payloadu,
- zakresy wartości fizycznych,
- poprawność timestampów,
- dozwolone interwały zapytań,
- zakresy limitów i numerów stron,
- strukturę reguł alertowych i aktualizacji sensora.

To znacząco obniża ryzyko zapisu błędnych lub złośliwych danych.

### 11.2. Sanitizacja

Projekt korzysta głównie z walidacji typów i ograniczeń długości. Nie ma osobnej warstwy bogatej sanitizacji HTML, ponieważ system nie przechowuje treści użytkownika o charakterze rich text. W praktyce wystarcza:

- walidacja pól tekstowych,
- brak renderowania HTML z danych wejściowych,
- JSON-only API.

### 11.3. API key

Ingest danych do `POST /api/measurements` jest chroniony przez API key. To sensowne dla małych wdrożeń i urządzeń IoT, gdzie pełna autoryzacja użytkownikowa byłaby zbyt ciężka.

Jednocześnie trzeba zaznaczyć, że:

- jest to mechanizm współdzielonego sekretu,
- nie ma per-device credentials,
- brak rotacji i granularnych uprawnień w aktualnej wersji.

### 11.4. Rate limiting

W obecnym kodzie nie ma rate limiting na poziomie Express. W dokumentacji projektowej należy to opisać jako świadomy brak w MVP i rekomendację produkcyjną, szczególnie dla publicznego wdrożenia na Railway.

### 11.5. Bezpieczeństwo API

Pozytywne elementy:

- `helmet`,
- `cors`,
- walidacja Zod,
- spójna obsługa błędów,
- wydzielona warstwa middleware.

Obszary do rozwoju:

- rate limiting,
- audit log dla operacji administracyjnych,
- uwierzytelnienie użytkowników dla panelu frontowego,
- autoryzacja websocketów.

### 11.6. Ochrona danych

System nie przetwarza danych osobowych wysokiego ryzyka, ale nadal przechowuje metadane lokalizacji urządzeń. Dlatego warto uwzględnić:

- kontrolę dostępu do panelu,
- ograniczenie ekspozycji publicznego API,
- świadome zarządzanie współrzędnymi GPS.

### 11.7. Obsługa błędów

Warstwa błędów jest uporządkowana:

- `AppError` dla błędów domenowych,
- `ZodError` mapowany do `400`,
- `404` dla brakujących tras i zasobów,
- `500` dla błędów nieoczekiwanych.

To poprawia bezpieczeństwo operacyjne i czytelność debugowania.

## 12. Backend

### 12.1. Architektura API

Backend stosuje prosty, czytelny podział:

- `controllers` odpowiadają za warstwę HTTP,
- `services` zawierają logikę biznesową,
- `middleware` odpowiada za cross-cutting concerns,
- `utils` zawierają logikę wspólną,
- `lib` obsługuje Prisma i Socket.IO.

Taki podział sprzyja testowalności i utrzymaniu.

### 12.2. Endpointy

Najważniejsze endpointy to:

- `POST /api/measurements`,
- `GET /api/measurements/latest`,
- `GET /api/measurements`,
- `DELETE /api/measurements`,
- `GET /api/sensors`,
- `GET /api/sensors/:id`,
- `PATCH /api/sensors/:id`,
- `DELETE /api/sensors/:id`,
- `GET /api/stats`,
- `GET /api/alerts/rules`,
- `POST /api/alerts/rules`,
- `PATCH /api/alerts/rules/:id`,
- `GET /api/alerts/events`,
- `PATCH /api/alerts/events/:id/acknowledge`,
- `GET /api/health`.

### 12.3. Pobieranie danych

`GET /api/measurements` jest centralnym endpointem analitycznym. Obsługuje:

- filtrowanie po sensorze lub wielu sensorach,
- zakres czasu,
- wybór interwału,
- limit,
- paginację.

To API jest wystarczająco elastyczne, aby zasilać zarówno tabelę, jak i widoki wykresowe.

### 12.4. Przechowywanie danych

Backend używa Prisma jako warstwy ORM nad PostgreSQL. To przyspiesza rozwój projektu i zapewnia:

- typowanie modeli,
- migracje,
- wygodne zapytania relacyjne,
- spójność z TypeScriptem.

### 12.5. Agregacja

Agregacja dzieje się w serwisie pomiarów i statystyk. Backend:

- zapisuje raw measurements,
- na żądanie przygotowuje uśrednione bucket’y,
- oblicza summary i trendy,
- generuje anomaly hints dla dashboardu.

### 12.6. Harmonogram odczytów i status offline

Backend nie inicjuje pomiarów, ale nadzoruje ich rytm pośrednio. Co minutę uruchamiany jest proces sprawdzający sensory, które przestały raportować. Jeśli `lastSeenAt` jest starsze niż `SENSOR_OFFLINE_AFTER_MINUTES`, sensor zostaje oznaczony jako offline, a frontend dostaje event.

### 12.7. WebSockety lub polling

System stosuje hybrydę:

- polling przez React Query w określonych interwałach,
- event-driven invalidation przez Socket.IO.

To podejście daje dobrą równowagę między świeżością danych a prostotą implementacji.

### 12.8. Skalowalność backendu

Obecna architektura skaluje się dobrze dla małej i średniej liczby urządzeń. Ograniczeniami przy większej skali mogą stać się:

- pełne pobieranie danych do agregacji w pamięci,
- pojedynczy proces aplikacji,
- brak kolejki ingestu,
- brak osobnego brokera wiadomości,
- brak warstwy cache serwerowej.

Naturalne ścieżki rozwoju to:

- MQTT + osobny worker ingestu,
- SQL aggregation lub TimescaleDB,
- job queue,
- cache Redis,
- rozdzielenie frontendu i API na osobne usługi, jeśli skala ruchu wzrośnie.

## 13. Integracja z sensorami

### 13.1. Sposób odbioru danych

ESP32 wysyła dane jako JSON przez HTTP lub HTTPS do publicznego endpointu backendu. To ważne przy wdrożeniu na Railway, ponieważ urządzenie może komunikować się z usługą dostępną pod adresem publicznym bez konieczności utrzymywania własnej infrastruktury edge.

### 13.2. Częstotliwość pomiarów

Domyślny interwał pomiarowy firmware wynosi `30000 ms`, czyli 30 sekund. Jest to dobry kompromis pomiędzy:

- świeżością danych,
- zużyciem energii,
- obciążeniem sieci,
- objętością historii w bazie.

### 13.3. Synchronizacja czasu

Firmware obsługuje NTP, ale domyślnie nie przesyła własnego timestampu. Taki model jest praktyczny na etapie MVP:

- upraszcza integrację,
- eliminuje część problemów z błędnym czasem urządzenia,
- pozwala bazować na czasie serwera.

W środowiskach wymagających dokładnej rekonstrukcji kolejności zdarzeń można włączyć `SEND_DEVICE_TIMESTAMP`.

### 13.4. Błędne dane

Projekt zabezpiecza się przed błędnymi danymi na kilku poziomach:

- walidacja zakresów na backendzie,
- rozróżnienie statusu `ok/warning/error` w firmware,
- kontrola obecności sensorów AHT20 i BMP280,
- oznaczanie napięcia baterii jako opcjonalnego.

### 13.5. Brakujące dane

Braki danych są naturalne w systemach IoT. Projekt nie ukrywa tego faktu, tylko reprezentuje je jawnie:

- kompletność dnia może być `empty`, `partial` lub `complete`,
- sensor może być offline,
- wartości opcjonalne jak RSSI i bateria mogą być `null`,
- puste widoki mają dedykowane `EmptyState`.

### 13.6. Problemy sieciowe

Firmware ma prostą, praktyczną obsługę problemów sieciowych:

- `WiFi.setAutoReconnect(true)`,
- pętla `ensureConnected`,
- odstęp pomiędzy próbami reconnectu,
- pomijanie POST, gdy urządzenie jest offline.

### 13.7. Retry logic

Warstwa HTTP w firmware podejmuje do trzech prób wysyłki pomiaru. To ogranicza utratę pojedynczych próbek przy chwilowym problemie sieciowym lub przy chwilowej niedostępności backendu na Railway.

### 13.8. TLS i połączenie z Railway

Firmware wspiera:

- połączenia HTTP,
- połączenia HTTPS,
- tryb `ALLOW_INSECURE_TLS`,
- opcjonalny `TLS_ROOT_CA`.

W kontekście Railway jest to istotne, ponieważ publiczny backend najczęściej będzie wystawiony pod HTTPS. Projekt upraszcza pierwsze uruchomienie przez możliwość pracy z `setInsecure`, ale w środowisku docelowym zalecane jest pinowanie zaufanego CA.

## 14. Możliwe rozszerzenia projektu

Naturalne kierunki rozwoju systemu obejmują:

- alerty e-mail, Slack, Discord i webhook,
- powiadomienia push i mobilne,
- eksport danych do CSV/JSON/XLSX po stronie backendu,
- AI anomaly detection oparta o modele sezonowości,
- prognozy krótkoterminowe,
- multi-device support z grupami urządzeń,
- mapa sensorów z geolokalizacją,
- użytkownicy, role i logowanie,
- analiza jakości powietrza,
- dodatkowe czujniki, np. CO2, PM2.5, VOC, natężenie światła,
- integracje smart home,
- MQTT jako kanał ingestu,
- dashboard porównawczy wielu sensorów na jednej osi czasu,
- automatyczne raporty dzienne i tygodniowe,
- integracja z hurtownią danych lub data lake dla analityki historycznej.

Szczególnie wartościowe biznesowo byłyby trzy rozszerzenia:

- pełna autoryzacja i role,
- alerting wielokanałowy,
- preagregacja i analityka długookresowa.

## 15. Problemy projektowe i sposoby ich rozwiązania

### 15.1. Problem UX dashboardów telemetrycznych

Klasyczny problem polega na tym, że system chce pokazać wszystko naraz: stan bieżący, historię, alerty, wykresy, urządzenia, konfigurację. Prowadzi to do przeładowania interfejsu.

Projekt rozwiązuje to przez rozdzielenie zadań na widoki:

- dashboard do orientacji,
- charts do analizy,
- measurements do surowych danych,
- alerts do obsługi progów,
- settings do konfiguracji.

To podejście jest lepsze niż jeden „wszystkomający” dashboard, bo zmniejsza chaos poznawczy.

### 15.2. Problem przeładowania wykresów

Surowe dane minutowe w skali tygodnia lub miesiąca tworzą wykresy praktycznie nieczytelne. Projekt rozwiązuje to przez:

- agregację,
- podział na day/week/month,
- overview w postaci kart dnia,
- detail w postaci wykresu liniowego dopiero po wejściu w dzień.

### 15.3. Problem nadmiaru danych

W telemetryce dane narastają szybko. Projekt stosuje:

- paginację dla `raw`,
- zakresy czasu,
- interwały agregacji,
- osobny widok tabelaryczny zamiast obciążania dashboardu wszystkimi rekordami.

### 15.4. Problem czytelności

Czytelność jest rozwiązana przez:

- prostą strukturę typograficzną,
- spójną kolorystykę metryk,
- separację overview/detail,
- ograniczenie aktywnej liczby serii na wykresie.

### 15.5. Problem skalowania danych historycznych

Aktualna architektura skaluje się umiarkowanie dobrze, ale przy dużych wolumenach może wymagać zmian. Najlepsze kolejne kroki:

- agregacja w SQL,
- osobne tabele bucketów dziennych i godzinowych,
- retention policy,
- baza zoptymalizowana pod time-series.

### 15.6. Problem wydajności

Projekt minimalizuje problemy wydajnościowe przez:

- Socket.IO zamiast intensywnego pollingu,
- React Query cache,
- lekkie komponenty wykresów,
- ograniczenie szczegółowości zależnie od widoku.

### 15.7. Problem mobile UX

Dashboardy telemetryczne często źle działają na telefonie, ponieważ kopiują układ desktopowy. Tutaj rozwiązaniem jest:

- mobilny pasek nawigacyjny,
- uproszczenie siatki,
- kalendarzowy month view adaptowany do mniejszych ekranów,
- duże przyciski i kontrolki.

### 15.8. Problem architektury danych czasowych

Dane czasowe wymagają odpowiedzi na pytania:

- jaki jest poziom granularności,
- jak interpretować luki,
- czy agregować po stronie klienta czy serwera,
- jak porównywać okresy.

Projekt przyjmuje rozsądny kompromis:

- raw measurements są źródłem prawdy,
- backend agreguje według interwału,
- frontend składa z tego struktury dzienne,
- poprzedni okres jest liczony jako okno tej samej długości bezpośrednio poprzedzające bieżące.

To podejście jest lepsze od pełnego liczenia wszystkiego na frontendzie, bo zachowuje kontrolę nad transferem i spójnością.

## 16. Technologie

### 16.1. Frontend stack

Obecnie używane:

- React 19,
- TypeScript,
- Vite,
- Tailwind CSS 4,
- Recharts,
- Framer Motion,
- React Query,
- Socket.IO Client,
- Sonner,
- React Hook Form,
- Zod.

To zestaw nowoczesny, szybki w iteracji i dobrze dopasowany do dashboardu.

### 16.2. Backend stack

Obecnie używane:

- Node.js 22,
- Express 5,
- TypeScript,
- Prisma,
- Socket.IO,
- Zod,
- Morgan,
- Helmet,
- CORS.

### 16.3. Baza danych

Aktualna baza:

- PostgreSQL hostowany na Railway.

To sensowny wybór dla projektu tej klasy. PostgreSQL zapewnia:

- stabilność,
- indeksowanie,
- relacje,
- łatwy hosting managed,
- możliwość dalszego rozwoju w stronę rozszerzeń time-series.

### 16.4. Biblioteki wykresów

Projekt używa Recharts. To dobry kompromis między:

- szybkością wdrożenia,
- responsywnością,
- możliwościami tooltipów i osi,
- prostotą stylowania.

### 16.5. Zarządzanie stanem

Zastosowano:

- React Query dla danych z serwera,
- Context dla ustawień użytkownika.

To prostsze i bardziej adekwatne niż Redux czy Zustand dla tego konkretnego zakresu funkcjonalnego.

### 16.6. Hosting

Docelowy hosting zakładany przez projekt to Railway:

- backend i frontend mogą być wdrażane w jednym kontenerze,
- PostgreSQL działa jako usługa zarządzana,
- kontener uruchamia `prisma migrate deploy`,
- Express serwuje zbudowany frontend statyczny.

To bardzo praktyczny model dla projektu demo-produkcyjnego i małych wdrożeń.

### 16.7. Monitoring

W obecnej implementacji monitoring jest podstawowy:

- logi morgan,
- logi konsolowe backendu,
- healthcheck `/api/health`,
- logi firmware i symulatora.

Do wdrożenia produkcyjnego warto dodać:

- Sentry,
- metryki aplikacyjne,
- monitoring czasu odpowiedzi i błędów,
- alerting infrastrukturalny Railway.

### 16.8. CI/CD

Repo zawiera Dockerfile produkcyjny, ale nie ma jeszcze jawnie zdefiniowanego pipeline CI/CD. W naturalnym rozwoju projektu warto dodać:

- lint i build w GitHub Actions,
- testy backendu,
- automatyczny deploy na Railway po merge,
- walidację migracji Prisma.

## 17. Opis przepływu użytkownika

### 17.1. Wejście do aplikacji

Użytkownik otwiera dashboard i od razu widzi:

- aktualne warunki,
- podstawowe trendy 24h,
- stan online sensorów,
- listę urządzeń.

Już ten pierwszy ekran daje wysoką wartość informacyjną.

### 17.2. Wybór zakresu czasu

Jeśli użytkownik chce wejść w analizę historyczną, przechodzi do `Wykresy` i wybiera:

- dzień,
- tydzień,
- miesiąc.

Jest to prostsze niż arbitralny date picker i lepiej pasuje do naturalnego sposobu myślenia o pogodzie.

### 17.3. Analiza danych

W overview tygodniowym i miesięcznym użytkownik:

- porównuje dni,
- identyfikuje skrajności,
- zauważa braki danych,
- ocenia regularność.

### 17.4. Przechodzenie do dnia

Po kliknięciu dnia następuje drill-down do day view. Użytkownik może:

- zobaczyć min/max/avg,
- przełączać metrykę,
- analizować przebieg godzinowy,
- wrócić do poprzedniego poziomu.

### 17.5. Interpretacja trendów

Na dashboardzie i w statystykach użytkownik odczytuje:

- kierunek zmian względem poprzedniego okresu,
- średnie i odchylenia,
- potencjalne anomalie.

### 17.6. Porównywanie dni

Week i month view są zaprojektowane pod porównywanie dni obok siebie, a nie przez mentalne śledzenie bardzo długiego wykresu. To wzmacnia czytelność porównawczą.

### 17.7. Drill-down flow

Pełny flow analityczny wygląda następująco:

1. dashboard,
2. wybór widoku czasowego,
3. przegląd tygodnia lub miesiąca,
4. wybór dnia,
5. analiza szczegółowego przebiegu,
6. ewentualne przejście do widoku sensora lub tabeli.

To dobrze zaprojektowana ścieżka eksploracji danych.

## 18. Opis wizualny systemu

### 18.1. Wygląd kart

Karty są lekkie wizualnie:

- mają cienkie obramowanie,
- jednolite tło powierzchni,
- duże paddingi,
- brak agresywnych cieni,
- subtelne animacje wejścia.

To buduje wrażenie porządku i nowoczesności.

### 18.2. Wygląd wykresów

Wykresy:

- bazują na cienkich, eleganckich liniach,
- używają stonowanej siatki,
- unikają zatłoczonych legend,
- mają czytelne tooltipy i osie.

Kolory metryk są logiczne:

- temperatura ma ciepły akcent,
- wilgotność chłodniejszy niebieski,
- ciśnienie neutralny odcień pośredni.

### 18.3. Spacing

Spacing jest jednym z najważniejszych elementów jakości tego UI. Interfejs nie jest „napakowany” po brzegi, dzięki czemu:

- liczby lepiej oddychają,
- sekcje są intuicyjnie odseparowane,
- użytkownik łatwiej skanuje ekran.

### 18.4. Typografia

Typografia wspiera hierarchię:

- duże liczby dla stanu bieżącego,
- wyraźne nagłówki sekcji,
- spokojne podpisy i opisy pomocnicze,
- zróżnicowany ciężar wizualny bez nadmiaru stylów.

### 18.5. Hover states

Hover jest używany jako sygnał interaktywności:

- karty overview reagują delikatnym ruchem lub zmianą tła,
- przyciski wzmacniają kontrast,
- nie ma efektów, które odciągałyby uwagę od danych.

### 18.6. Animacje

Animacje są oszczędne i mają charakter jakościowy:

- wejście paneli,
- płynne przejścia układu,
- mikroreakcja przy hover.

Wizualny feeling systemu jest spokojny, uporządkowany i technicznie dojrzały.

### 18.7. Hierarchy i feeling aplikacji

Całość sprawia wrażenie nowoczesnego, lekkiego panelu operacyjnego. Interfejs nie próbuje być „showcase’em biblioteki wykresów”, tylko narzędziem do obserwacji danych. Dzięki temu aplikacja:

- wygląda profesjonalnie,
- wspiera interpretację,
- nadaje się do projektu dyplomowego, demonstracyjnego i praktycznego wdrożenia.

## 19. Warstwa wdrożeniowa: Railway + PostgreSQL

### 19.1. Model wdrożenia

W projekcie przewidziano wdrożenie na Railway z zarządzaną bazą PostgreSQL. Jest to ważne, ponieważ wpływa na architekturę końcową systemu:

- aplikacja frontendowa jest budowana statycznie,
- backend Express serwuje pliki `frontend/dist`,
- kontener uruchamia migracje Prisma przy starcie,
- baza danych działa jako osobna usługa Railway.

### 19.2. Dockerfile

Dockerfile realizuje dwustopniowy build:

- etap `builder` instaluje zależności, generuje Prisma Client, buduje backend i frontend,
- etap finalny kopiuje backend oraz gotowy frontend do obrazu runtime.

Przy starcie kontenera wykonywane jest:

```sh
npx prisma migrate deploy && node dist/index.js
```

To bardzo praktyczny wzorzec dla monorepo o umiarkowanej skali.

### 19.3. Konfiguracja środowiskowa

Kluczowe zmienne środowiskowe dla Railway:

- `DATABASE_URL`,
- `API_KEY`,
- `FRONTEND_URL`,
- `BACKEND_URL`,
- `PORT`,
- `NODE_ENV`,
- opcjonalnie `SENSOR_OFFLINE_AFTER_MINUTES`,
- opcjonalnie `DEFAULT_HISTORY_LIMIT`.

### 19.4. Znaczenie Railway dla architektury

Railway upraszcza:

- provisioning PostgreSQL,
- ekspozycję backendu pod publicznym HTTPS,
- deployment kontenera z monorepo,
- szybkie uruchomienie demonstracyjnego środowiska produkcyjnego.

Jednocześnie wprowadza kilka aspektów projektowych:

- backend jest publicznie dostępny, więc warto rozwijać zabezpieczenia,
- migracje przy starcie wymagają kontroli wersji schematu,
- połączenia ESP32 przez HTTPS muszą uwzględniać certyfikaty i ograniczenia embedded TLS,
- ewentualne sleep/restarty platformy mogą wpływać na bardzo częsty ruch telemetryczny w darmowych lub niższych planach.

### 19.5. Rekomendacje dla wdrożenia produkcyjnego

Przy wdrożeniu na Railway warto rozważyć:

- rate limiting na API ingestu,
- osobne API key dla grup urządzeń,
- monitoring czasu odpowiedzi i liczby błędów 4xx/5xx,
- backup i retencję danych PostgreSQL,
- bezpieczniejszą obsługę TLS po stronie ESP32,
- ewentualne wydzielenie workerów ingestu przy większej skali.

## 20. Wnioski końcowe

Weather Station Control Center jest dobrze ustrukturyzowanym projektem end-to-end, który łączy praktyczne elementy IoT, backendu danych czasowych oraz nowoczesnego dashboardu webowego. Najsilniejsze strony systemu to:

- pełny przepływ od fizycznego sensora do interfejsu użytkownika,
- poprawna separacja warstw aplikacji,
- rozsądna strategia agregacji i prezentacji danych historycznych,
- przemyślany drill-down dzień/tydzień/miesiąc,
- obsługa live update, alertów i statusów urządzeń,
- gotowość do wdrożenia na Railway z PostgreSQL.

Najważniejsze obszary rozwoju to:

- bezpieczeństwo i autoryzacja użytkowników,
- rate limiting i twardsze zabezpieczenie ingestu,
- skalowanie warstwy agregacji,
- rozwój testów i CI/CD,
- rozszerzenie systemu alertowania i analityki.

Jako baza pod dokumentację projektową, pracę inżynierską lub prezentację architektury system ten jest bardzo wartościowy, ponieważ pokazuje nie tylko frontend wizualny, ale pełny łańcuch akwizycji, zapisu, przetwarzania i interpretacji danych telemetrycznych.
