#include "wifi_manager.h"

#include <WiFi.h>

#include "config.h"

namespace WifiManager {
namespace {
unsigned long lastReconnectAttempt = 0;
}

void begin() {
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.begin(AppConfig::WIFI_SSID, AppConfig::WIFI_PASSWORD);

  Serial.printf("Connecting to Wi-Fi: %s\n", AppConfig::WIFI_SSID);

  unsigned long started = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - started < 20000) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("Wi-Fi connected. IP: %s\n", WiFi.localIP().toString().c_str());
  } else {
    Serial.println("Initial Wi-Fi connection timed out. Reconnect loop will continue.");
  }
}

void ensureConnected() {
  if (WiFi.status() == WL_CONNECTED) {
    return;
  }

  if (millis() - lastReconnectAttempt < 5000) {
    return;
  }

  lastReconnectAttempt = millis();
  Serial.println("Wi-Fi disconnected, trying to reconnect...");
  WiFi.disconnect();
  WiFi.begin(AppConfig::WIFI_SSID, AppConfig::WIFI_PASSWORD);
}

bool isConnected() {
  return WiFi.status() == WL_CONNECTED;
}
}  // namespace WifiManager
