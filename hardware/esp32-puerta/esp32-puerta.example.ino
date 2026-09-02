/*
 * Artiefy — control de puerta con ESP32
 *
 * Expone el contrato que espera la app (src/server/esp32/esp32-client.ts):
 *
 *   POST /door    Cabecera: X-ESP32-KEY  |  Body: {"active": true|false}
 *                 -> 200 {"ok":true,"reason":"success"}
 *                 -> 401 si la clave no coincide
 *
 *   GET  /health  Sin clave (la app no la envía aquí)
 *                 -> 200 {"ok":true}
 *
 * La app corta a los 5 s, así que hay que responder rápido: nunca uses
 * delay() dentro de los manejadores.
 *
 * Requiere la librería ArduinoJson (Gestor de librerías del IDE).
 */

#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h>


// ─────────────────────────── CONFIGURACIÓN ───────────────────────────

const char* WIFI_SSID     = "TU_RED_WIFI";
const char* WIFI_PASSWORD = "TU_CONTRASENA_WIFI";

// Vacío a propósito: la app NO tiene ESP32_API_KEY en su .env, así que nunca
// envía la cabecera X-ESP32-KEY. Con la clave vacía el firmware no la exige.
// Si algún día la añades al .env, pon aquí el mismo valor.
const char* API_KEY = "";

// IP fija: la app apunta a una dirección concreta (ESP32_BASE_URL). Con DHCP
// el router podría darle otra al reiniciar y la puerta dejaría de responder.
IPAddress IP_FIJA(192, 168, 1, 14);
IPAddress GATEWAY(192, 168, 1, 254);    // comprobado en tu red
IPAddress MASCARA(255, 255, 255, 0);
IPAddress DNS1(8, 8, 8, 8);

const int  PIN_RELE     = 26;    // GPIO conectado al relé
const bool RELE_ACTIVO_EN_BAJO = true;  // la mayoría de módulos son así

// Cierre automático de seguridad: si algo falla y nunca llega el "false",
// la puerta no se queda abierta para siempre.
const unsigned long MS_CIERRE_AUTOMATICO = 5000;

// ─────────────────────────────────────────────────────────────────────

WebServer server(80);
unsigned long abiertaDesde = 0;
bool puertaAbierta = false;

void aplicarRele(bool activo) {
  digitalWrite(PIN_RELE, RELE_ACTIVO_EN_BAJO ? !activo : activo);
  puertaAbierta = activo;
  abiertaDesde = activo ? millis() : 0;
  Serial.printf("[PUERTA] %s\n", activo ? "ABIERTA" : "cerrada");
}

void responderJson(int codigo, const String& cuerpo) {
  server.send(codigo, "application/json", cuerpo);
}

void manejarHealth() {
  responderJson(200, "{\"ok\":true,\"reason\":\"success\"}");
}

void manejarDoor() {
  // 1) Clave. La app la manda en X-ESP32-KEY solo si la tiene configurada.
  if (strlen(API_KEY) > 0) {
    if (server.header("X-ESP32-KEY") != String(API_KEY)) {
      Serial.println("[AUTH] clave incorrecta o ausente");
      responderJson(401, "{\"ok\":false,\"reason\":\"unauthorized\"}");
      return;
    }
  }

  // 2) Body
  JsonDocument doc;
  DeserializationError err = deserializeJson(doc, server.arg("plain"));
  if (err) {
    responderJson(400, "{\"ok\":false,\"reason\":\"json_invalido\"}");
    return;
  }

  if (!doc["active"].is<bool>()) {
    responderJson(400, "{\"ok\":false,\"reason\":\"falta_active\"}");
    return;
  }

  // 3) Acción y respuesta inmediata
  aplicarRele(doc["active"].as<bool>());
  responderJson(200, "{\"ok\":true,\"reason\":\"success\"}");
}

void setup() {
  Serial.begin(115200);

  pinMode(PIN_RELE, OUTPUT);
  aplicarRele(false);  // arrancar siempre con la puerta cerrada

  WiFi.mode(WIFI_STA);
  if (!WiFi.config(IP_FIJA, GATEWAY, MASCARA, DNS1)) {
    Serial.println("[WIFI] no se pudo fijar la IP");
  }
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  Serial.print("[WIFI] conectando");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.printf("\n[WIFI] conectado. IP: %s\n", WiFi.localIP().toString().c_str());

  // Sin esto, server.header("X-ESP32-KEY") devuelve siempre vacío.
  const char* cabeceras[] = {"X-ESP32-KEY"};
  server.collectHeaders(cabeceras, 1);

  server.on("/health", HTTP_GET, manejarHealth);
  server.on("/door", HTTP_POST, manejarDoor);
  server.onNotFound([]() {
    responderJson(404, "{\"ok\":false,\"reason\":\"no_encontrado\"}");
  });

  server.begin();
  Serial.println("[HTTP] servidor listo en el puerto 80");
}

void loop() {
  server.handleClient();

  if (puertaAbierta && millis() - abiertaDesde > MS_CIERRE_AUTOMATICO) {
    Serial.println("[PUERTA] cierre automático por seguridad");
    aplicarRele(false);
  }
}
