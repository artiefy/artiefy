#include <WiFi.h>
#include <WebServer.h>
#include <WebSocketsServer.h>
#include <ArduinoJson.h>

// ================= WIFI (REAL) =================
// CAMBIA ESTO POR TU WIFI REAL:
const char* ssid = "NOMBRE WIFI";
const char* password = "CLAVE WIFI";

// ================= SERVERS ======================
WebServer server(80);
WebSocketsServer webSocket(81);

// ================= PUERTA =======================
#define DOOR_PIN 22
const unsigned long DOOR_OPEN_MS = 5000;

bool doorIsOpen = false;
unsigned long doorCloseAt = 0;

// ================= USUARIOS PERMITIDOS ==========
const char* allowedUsers[] = { "juanjo", "ana", "carlos" };
const int allowedCount = 3;

bool isAllowedUser(String u) {
  u.toLowerCase();
  for (int i = 0; i < allowedCount; i++) {
    if (u == String(allowedUsers[i])) return true;
  }
  return false;
}

// ================= HTML DE PRUEBA ===============
const char* webPage = R"rawliteral(
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Control Puerta ESP32</title>
  <style>
    body{font-family:Arial;background:#f4f4f4;padding:24px}
    .card{background:#fff;max-width:420px;margin:auto;padding:18px;border-radius:12px;box-shadow:0 8px 20px rgba(0,0,0,.08)}
    input,select,button{width:100%;padding:10px;margin-top:10px;font-size:15px}
    button{background:#0b74ff;color:#fff;border:0;border-radius:8px;cursor:pointer}
    #resp{margin-top:12px;font-weight:700}
    small{color:#666;display:block;margin-top:6px}
    .hint{background:#f7f7f7;border-radius:8px;padding:10px;margin-top:10px;font-size:13px}
  </style>
</head>
<body>
  <div class="card">
    <h3>Control de Puerta (Prueba)</h3>
    <small>WebSocket al puerto 81</small>

    <label>Usuario</label>
    <input id="usuario" list="usuarios" placeholder="juanjo / ana / carlos" />
    <datalist id="usuarios">
      <option value="juanjo"></option>
      <option value="ana"></option>
      <option value="carlos"></option>
    </datalist>

    <label>Estado</label>
    <select id="estado">
      <option value="activo">activo</option>
      <option value="inactivo">inactivo</option>
    </select>

    <button onclick="enviar()">Enviar</button>
    <div id="resp"></div>

    <div class="hint">
      <b>Usuarios de prueba:</b> juanjo, ana, carlos<br/>
      <b>Formato enviado:</b> JSON {"usuario":"...","estado":"..."}
    </div>
  </div>

  <script>
    const gateway = `ws://${window.location.hostname}:81/`;
    let ws;

    function initWS(){
      ws = new WebSocket(gateway);
      ws.onopen = () => document.getElementById("resp").innerText = "WS conectado";
      ws.onmessage = (e) => document.getElementById("resp").innerText = e.data;
      ws.onclose = () => {
        document.getElementById("resp").innerText = "WS desconectado. Reintentando...";
        setTimeout(initWS, 1000);
      };
    }

    window.addEventListener("load", initWS);

    function enviar(){
      const usuario = document.getElementById("usuario").value.trim();
      const estado = document.getElementById("estado").value.trim();

      const payload = JSON.stringify({ usuario, estado });
      ws.send(payload);
    }
  </script>
</body>
</html>
)rawliteral";

// ============== PUERTA (NO BLOQUEANTE) ==========
void scheduleDoorOpen() {
  digitalWrite(DOOR_PIN, HIGH);
  doorIsOpen = true;
  doorCloseAt = millis() + DOOR_OPEN_MS;
  Serial.println("PUERTA: ABIERTA (5s)");
}

void updateDoor() {
  if (doorIsOpen && (long)(millis() - doorCloseAt) >= 0) {
    digitalWrite(DOOR_PIN, LOW);
    doorIsOpen = false;
    Serial.println("PUERTA: CERRADA");
  }
}

// ============== HTTP ============================
void handleRoot() {
  server.send(200, "text/html", webPage);
}

// ============== PARSEO MENSAJE ==================
bool parseMessage(const String& msg, String& usuario, String& estado) {
  usuario = "";
  estado = "";

  String m = msg;
  m.trim();
  if (m.length() == 0) return false;

  // JSON
  if (m.startsWith("{")) {
    DynamicJsonDocument doc(256);
    auto err = deserializeJson(doc, m);
    if (err) return false;

    usuario = String((const char*)(doc["usuario"] | ""));
    estado  = String((const char*)(doc["estado"] | doc["activo"] | ""));
    usuario.trim();
    estado.trim();
    return usuario.length() && estado.length();
  }

  // Simple usuario|estado
  int sep = m.indexOf('|');
  if (sep != -1) {
    usuario = m.substring(0, sep);
    estado  = m.substring(sep + 1);
    usuario.trim();
    estado.trim();
    return usuario.length() && estado.length();
  }

  return false;
}

// ============== WEBSOCKET EVENT =================
void webSocketEvent(uint8_t client, WStype_t type, uint8_t * payload, size_t length) {
  if (type != WStype_TEXT) return;

  String msg = String((char*)payload);
  Serial.println("WS recibido: " + msg);

  String usuario, estado;
  if (!parseMessage(msg, usuario, estado)) {
    webSocket.sendTXT(client, "ERROR|FORMATO_INVALIDO");
    return;
  }

  String usuarioNorm = usuario;
  usuarioNorm.toLowerCase();

  if (!isAllowedUser(usuarioNorm)) {
    webSocket.sendTXT(client, "DENEGADO|" + usuario + "|USUARIO_NO_REGISTRADO");
    return;
  }

  String estadoNorm = estado;
  estadoNorm.toLowerCase();

  if (estadoNorm == "activo" || estadoNorm == "true" || estadoNorm == "1") {
    scheduleDoorOpen();
    webSocket.sendTXT(client, "OK|" + usuario + "|PUERTA_ABRIENDO");
  } else {
    webSocket.sendTXT(client, "DENEGADO|" + usuario + "|INACTIVO");
  }
}

// ============== SETUP ===========================
void setup() {
  Serial.begin(115200);

  pinMode(DOOR_PIN, OUTPUT);
  digitalWrite(DOOR_PIN, LOW);

  WiFi.begin(ssid, password);
  Serial.print("Conectando WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(300);
    Serial.print(".");
  }

  Serial.println("\nWiFi OK");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());

  server.on("/", handleRoot);
  server.begin();

  webSocket.begin();
  webSocket.onEvent(webSocketEvent);

  Serial.println("HTTP puerto 80");
  Serial.println("WS puerto 81");
}

// ============== LOOP ============================
void loop() {
  server.handleClient();
  webSocket.loop();
  updateDoor();
}
