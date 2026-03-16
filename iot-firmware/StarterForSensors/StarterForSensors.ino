#include <WiFi.h>
#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BMP280.h>
// TODO: Upgrade to BME280 for ambient humidity support.
// The BME280 is a drop-in hardware replacement for BMP280.
// To upgrade: replace the include with <Adafruit_BME280.h>,
//             change `Adafruit_BMP280 bmp;` to `Adafruit_BME280 bmp;`,
//             and read humidity with: `bmp.readHumidity()` in loop().
//             Also add "ambient_humidity" to the JSON payload and install
//             the "Adafruit BME280 Library" via Arduino Library Manager.
#include <OneWire.h>
#include <DallasTemperature.h>
#include <PubSubClient.h>  // Install: "PubSubClient" by Nick O'Leary
#include <ArduinoJson.h>   // Install: "ArduinoJson" by Benoit Blanchon

// ==========================================
// --- USER SETTINGS ---
// ==========================================
const char* ssid     = "Bahase";       // WiFi name
const char* password = "Cotanak-031.,";   // WiFi password

// MQTT Broker - replace with your broker IP/host
const char* mqtt_server = "192.168.1.2";
const int   mqtt_port   = 1883;

// How often to publish (in microseconds): 5 minutes = 5 * 60 * 1,000,000
#define SLEEP_DURATION_US  (5ULL * 60ULL * 1000000ULL)

// --- PIN DEFINITIONS ---
#define PIN_DS18B20 4       // Soil Temperature (Yellow Wire)
#define PIN_MOISTURE 34     // Soil Humidity (Analog)
// SDA -> 21, SCL -> 22

// TODO: Battery pin (add when battery shield is connected)
// #define PIN_BATTERY 35
// float readBatteryPercent() {
//   int raw = analogRead(PIN_BATTERY);
//   float voltage = raw * (4.2 / 4095.0) * 2; // adjust multiplier for your voltage divider
//   return constrain(map(voltage * 100, 300, 420, 0, 100), 0, 100);
// }

// --- CALIBRATION (Soil Moisture) ---
const int AIR_VALUE   = 2850;
const int WATER_VALUE = 1200;

// ==========================================

// --- GLOBAL OBJECTS ---
Adafruit_BMP280 bmp;
OneWire oneWire(PIN_DS18B20);
DallasTemperature sensors(&oneWire);
WiFiClient espClient;
PubSubClient mqttClient(espClient);

// Device ID is derived from this ESP32's MAC address
String deviceId;

// --- Helper: Connect to WiFi ---
void connectWiFi() {
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  int timeout = 0;
  while (WiFi.status() != WL_CONNECTED && timeout < 20) {
    delay(500);
    Serial.print(".");
    timeout++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected! IP: " + WiFi.localIP().toString());
  } else {
    Serial.println("\nERROR: WiFi connection failed. Check credentials.");
  }
}

// --- Helper: Connect to MQTT Broker ---
void connectMQTT() {
  mqttClient.setServer(mqtt_server, mqtt_port);
  Serial.print("Connecting to MQTT broker");
  int tries = 0;
  while (!mqttClient.connected() && tries < 5) {
    if (mqttClient.connect(deviceId.c_str())) {
      Serial.println("\nMQTT connected!");
    } else {
      Serial.print(".");
      delay(1000);
      tries++;
    }
  }
  if (!mqttClient.connected()) {
    Serial.println("\nERROR: MQTT connection failed.");
  }
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n\n--- SOLARA SENSOR SYSTEM STARTING ---");

  // --- STEP 1: Derive Device ID from MAC Address ---
  // ESP.getEfuseMac() reads directly from the ESP32 hardware registers.
  // This works reliably even before WiFi is initialized.
  uint64_t chipId = ESP.getEfuseMac();
  char macStr[13];
  snprintf(macStr, sizeof(macStr), "%04X%08X",
           (uint16_t)(chipId >> 32),
           (uint32_t)chipId);
  deviceId = "ESP32-" + String(macStr);
  Serial.println("===============================================");
  Serial.println("  DEVICE ID (write on sticker): " + deviceId);
  Serial.println("===============================================");

  // --- STEP 2: Connect to WiFi ---
  connectWiFi();

  // --- STEP 3: Connect to MQTT ---
  if (WiFi.status() == WL_CONNECTED) {
    connectMQTT();
  }

  // --- STEP 4: Initialize BMP280 (Air Temp + Pressure) ---
  if (!bmp.begin(0x76) && !bmp.begin(0x77)) {
    Serial.println("ERROR: BMP280 not found! Check wiring (pins 21-22).");
  } else {
    Serial.println("BMP280 (Air Temp/Pressure) Ready.");
    bmp.setSampling(Adafruit_BMP280::MODE_NORMAL,
                    Adafruit_BMP280::SAMPLING_X2,
                    Adafruit_BMP280::SAMPLING_X16,
                    Adafruit_BMP280::FILTER_X16,
                    Adafruit_BMP280::STANDBY_MS_500);
  }

  // --- STEP 5: Initialize DS18B20 (Soil Temperature) ---
  sensors.begin();
  Serial.println("DS18B20 (Soil Temp) Ready.");
}

void loop() {
  Serial.println("\n---------------- SENSOR READINGS ----------------");

  // --- READ SENSORS ---

  // A. Air Data (BMP280)
  float airTemp = bmp.readTemperature();
  float pressure = bmp.readPressure(); // in Pascals

  // B. Soil Temperature (DS18B20)
  sensors.requestTemperatures();
  float soilTemp = sensors.getTempCByIndex(0);

  // C. Soil Moisture (Capacitive)
  int moistureRaw     = analogRead(PIN_MOISTURE);
  int moisturePercent = map(moistureRaw, AIR_VALUE, WATER_VALUE, 0, 100);
  moisturePercent = constrain(moisturePercent, 0, 100);

  // TODO: Battery reading (uncomment when battery hardware is installed)
  // float batteryPct = readBatteryPercent();

  // --- PRINT TO SERIAL ---
  Serial.printf("Air Temp     : %.2f C\n", airTemp);
  Serial.printf("Pressure     : %.2f Pa\n", pressure);
  Serial.printf("Soil Temp    : %.2f C\n", soilTemp);
  Serial.printf("Soil Humidity: %d%% (raw: %d)\n", moisturePercent, moistureRaw);

  if (moisturePercent < 20) {
    Serial.println("WARNING: Soil is very dry! Irrigation needed.");
  }

  // --- BUILD & PUBLISH MQTT PAYLOAD ---
  if (mqttClient.connected()) {
    // Build JSON: { "device_id": "ESP32-...", "ambient_temperature": 24.5,
    //              "soil_humidity": 45, "soil_temperature": 22.1,
    //              "barometric_pressure": 101325 }
    // TODO: Add "battery_pct": batteryPct  when battery hardware is installed
    StaticJsonDocument<256> doc;
    doc["device_id"]           = deviceId;
    doc["ambient_temperature"] = airTemp;
    doc["soil_humidity"]       = moisturePercent;
    doc["soil_temperature"]    = soilTemp;
    doc["barometric_pressure"] = pressure;

    char payload[256];
    serializeJson(doc, payload);

    String topic = "solara/telemetry/" + deviceId;
    mqttClient.publish(topic.c_str(), payload);
    Serial.println("Published to MQTT: " + String(payload));
  } else {
    Serial.println("WARNING: MQTT not connected - skipping publish.");
  }

  // --- DEEP SLEEP ---
  // Disconnect cleanly before sleeping so the broker detects the disconnect.
  mqttClient.disconnect();
  WiFi.disconnect(true);
  Serial.println("Going to deep sleep for 5 minutes...");
  delay(100); // Give serial time to flush
  esp_deep_sleep(SLEEP_DURATION_US);
  // After waking up, the ESP32 restarts from setup() - loop() won't be called again
}