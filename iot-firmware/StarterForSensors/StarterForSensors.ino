#include <WiFi.h>
#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BME280.h> 
#include <OneWire.h>
#include <DallasTemperature.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// ==========================================
// --- USER SETTINGS ---
// ==========================================
const char* ssid     = "Bahase";
const char* password = "Cotanak-031.,";
const char* mqtt_server = "192.168.1.2";
const int   mqtt_port   = 1883;

#define SLEEP_DURATION_US  (5ULL * 60ULL * 1000000ULL)

// --- PIN DEFINITIONS ---
#define PIN_DS18B20 4
#define PIN_MOISTURE 34
#define BATTERY_PIN 35 // Added battery pin

// --- CALIBRATION ---
const int AIR_VALUE   = 2850;
const int WATER_VALUE = 1200;

// --- BATTERY SETTINGS ---
const float R1 = 100000.0; 
const float R2 = 100000.0; 
const float CALIBRATION_FACTOR = 1.077; // Your calibrated value
const float BATT_MAX_VOLTAGE = 4.20; 
const float BATT_MIN_VOLTAGE = 3.20; 

// --- GLOBAL OBJECTS ---
Adafruit_BME280 bme;
OneWire oneWire(PIN_DS18B20);
DallasTemperature sensors(&oneWire);
WiFiClient espClient;
PubSubClient mqttClient(espClient);

String deviceId;

void connectWiFi() {
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  int timeout = 0;
  while (WiFi.status() != WL_CONNECTED && timeout < 20) {
    delay(500);
    Serial.print(".");
    timeout++;
  }
}

void connectMQTT() {
  mqttClient.setServer(mqtt_server, mqtt_port);
  int tries = 0;
  while (!mqttClient.connected() && tries < 5) {
    if (mqttClient.connect(deviceId.c_str())) {
      Serial.println("\nMQTT connected!");
    } else {
      delay(1000);
      tries++;
    }
  }
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n\n--- SOLARA SENSOR SYSTEM STARTING ---");

  // Ensure ADC is set for the battery pin
  analogReadResolution(12);

  uint64_t chipId = ESP.getEfuseMac();
  char macStr[13];
  snprintf(macStr, sizeof(macStr), "%04X%08X", (uint16_t)(chipId >> 32), (uint32_t)chipId);
  deviceId = "ESP32-" + String(macStr);

  connectWiFi();
  if (WiFi.status() == WL_CONNECTED) {
    connectMQTT();
  }

  // Initialize BME280 for Temp/Humidity
  if (!bme.begin(0x76) && !bme.begin(0x77)) {
    Serial.println("ERROR: BME280 not found!");
  }

  sensors.begin();
}

void loop() {
  Serial.println("\n---------------- SENSOR READINGS ----------------");

  // A. Air Data (BME280)
  float airTemp = bme.readTemperature();
  float airHumid = bme.readHumidity();

  // B. Soil Temperature (DS18B20)
  sensors.requestTemperatures();
  float soilTemp = sensors.getTempCByIndex(0);

  // C. Soil Moisture
  int moistureRaw = analogRead(PIN_MOISTURE);
  int moisturePercent = map(moistureRaw, AIR_VALUE, WATER_VALUE, 0, 100);
  moisturePercent = constrain(moisturePercent, 0, 100);

  // D. Battery Voltage & Percentage
  int rawBatt = analogRead(BATTERY_PIN);
  float pinVoltage = (rawBatt / 4095.0) * 3.3;
  float batteryVoltage = pinVoltage * ((R1 + R2) / R2) * CALIBRATION_FACTOR;
  
  float batteryPercent = ((batteryVoltage - BATT_MIN_VOLTAGE) / (BATT_MAX_VOLTAGE - BATT_MIN_VOLTAGE)) * 100.0;
  batteryPercent = constrain(batteryPercent, 0.0, 100.0);

  // --- PRINT TO SERIAL ---
  Serial.printf("Air Temp     : %.2f C\n", airTemp);
  Serial.printf("Air Humidity : %.2f %%\n", airHumid);
  Serial.printf("Soil Temp    : %.2f C\n", soilTemp);
  Serial.printf("Soil Moisture: %d%% (raw: %d)\n", moisturePercent, moistureRaw);
  Serial.printf("Battery      : %.2f V (%.0f%%)\n", batteryVoltage, batteryPercent);

  // --- BUILD & PUBLISH MQTT PAYLOAD ---
  if (mqttClient.connected()) {
    StaticJsonDocument<256> doc; // Increased slightly to fit the new battery data
    doc["device_id"]           = deviceId;
    doc["ambient_temperature"] = airTemp;
    doc["ambient_humidity"]    = airHumid;
    doc["soil_humidity"]       = moisturePercent;
    doc["soil_temperature"]    = soilTemp;
    
    // Add battery to MQTT JSON payload
    doc["battery_voltage"]     = batteryVoltage;
    doc["battery_percentage"]  = (int)batteryPercent; 

    char payload[256];
    serializeJson(doc, payload);

    String topic = "solara/telemetry/" + deviceId;
    mqttClient.publish(topic.c_str(), payload);
    Serial.println("Published to MQTT: " + String(payload));
  }

  // --- DEEP SLEEP ---
  mqttClient.disconnect();
  WiFi.disconnect(true);
  Serial.println("Going to deep sleep...");
  delay(100);
  esp_deep_sleep(SLEEP_DURATION_US);
}