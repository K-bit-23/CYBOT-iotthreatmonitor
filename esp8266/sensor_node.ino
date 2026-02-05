/*
  ============================================================
  ESP8266 PIR Motion Sensor with MQTT
  IoT Threat Monitoring System - CYBOT
  ============================================================
  
  Hardware Required:
  - ESP8266 (NodeMCU/Wemos D1 Mini)
  - PIR Motion Sensor (HC-SR501)
  
  Connections:
  - PIR OUT -> D5 (GPIO14)
  - PIR VCC -> 5V
  - PIR GND -> GND
  
  MQTT Broker: HiveMQ (Free Public Broker)
*/

#include <ESP8266WiFi.h>
#include <PubSubClient.h>

// ============ WIFI DETAILS ============
const char* ssid = "kong";
const char* password = "passwor08";

// ============ MQTT DETAILS ============
const char* mqttServer = "broker.hivemq.com";
const int mqttPort = 1883;
const char* topic = "iot-cybot/pir/test";
const char* clientId = "ESP8266_PIR_CYBOT";

// ============ PIN CONFIG ============
#define PIR_PIN D5          // GPIO14
#define LED_PIN LED_BUILTIN

// ============ VARIABLES ============
WiFiClient espClient;
PubSubClient client(espClient);
int lastPirValue = -1;  // Track state changes

// =================================================

void setup() {
  Serial.begin(115200);
  Serial.println("\n\n========================================");
  Serial.println("  CYBOT PIR Motion Sensor Starting...");
  Serial.println("========================================\n");

  pinMode(PIR_PIN, INPUT);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, HIGH);   // LED OFF (active low)

  connectWiFi();

  client.setServer(mqttServer, mqttPort);
  
  // Wait for PIR sensor to stabilize
  Serial.println("[INFO] Waiting for PIR sensor to stabilize...");
  delay(5000);

  Serial.println("\n[READY] PIR MQTT System Ready!");
  Serial.println("========================================\n");
}

// =================================================

void loop() {
  // Ensure MQTT connection
  if (!client.connected()) {
    connectMQTT();
  }
  client.loop();

  // Read PIR sensor
  int pirValue = digitalRead(PIR_PIN);

  // Detect motion (based on your sensor: HIGH = no motion, LOW = motion)
  if (pirValue == HIGH) {
    Serial.println("[PIR] No Motion");
    digitalWrite(LED_PIN, HIGH);  // LED OFF
  } else {
    Serial.println("[PIR] ⚠️  MOTION DETECTED!");
    digitalWrite(LED_PIN, LOW);   // LED ON
  }

  // Create JSON payload
  String payload = "{";
  payload += "\"device_id\":\"pir_sensor_1\",";
  payload += "\"pir_motion\":" + String(pirValue) + ",";
  payload += "\"motion_detected\":" + String(pirValue == 0 ? "true" : "false") + ",";
  payload += "\"timestamp\":" + String(millis());
  payload += "}";

  // Publish to MQTT
  if (client.publish(topic, payload.c_str())) {
    Serial.print("[MQTT] Published: ");
    Serial.println(payload);
  } else {
    Serial.println("[MQTT] Publish failed!");
  }

  delay(2000);  // Send every 2 seconds
}

// =================================================

void connectWiFi() {
  Serial.print("[WIFI] Connecting to ");
  Serial.print(ssid);

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\n[WIFI] Connected!");
  Serial.print("[WIFI] IP Address: ");
  Serial.println(WiFi.localIP());
}

// =================================================

void connectMQTT() {
  while (!client.connected()) {
    Serial.print("[MQTT] Connecting to ");
    Serial.print(mqttServer);
    Serial.print("...");

    if (client.connect(clientId)) {
      Serial.println(" Connected!");
      Serial.print("[MQTT] Publishing to: ");
      Serial.println(topic);
    } else {
      Serial.print(" Failed (rc=");
      Serial.print(client.state());
      Serial.println("), retrying in 2s...");
      delay(2000);
    }
  }
}
