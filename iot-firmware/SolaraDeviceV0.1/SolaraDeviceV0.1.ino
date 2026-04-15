#define TINY_GSM_MODEM_SIM800 

#include <WiFi.h>
#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BME280.h> 
#include <OneWire.h>
#include <DallasTemperature.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <TinyGsmClient.h> 

// ==========================================
// --- 1. CONFIGURATION & CREDENTIALS ---
// ==========================================
const char* ssid         = "Bahase";
const char* password     = "Cotanak-031.,";
const char* mqtt_server  = "192.168.1.8"; 
const int   mqtt_port    = 1883;
const char  apn[]        = "internet"; 

#define SLEEP_DURATION_US  (5ULL * 60ULL * 1000000ULL) // 5 Minutes

// --- PIN DEFINITIONS (MATCHING YOUR HARDWARE TEST) ---
#define SIM_RX_PIN  26 // ESP32 RX -> SIM800C TXD
#define SIM_TX_PIN  27 // ESP32 TX -> SIM800C RXD
#define SIM_PWR_PIN 5  // ESP32 Pin 5 -> SIM800C link pin
#define PIN_DS18B20 4
#define PIN_MOISTURE 34
#define PIN_BATTERY 35

// Calibration
const int AIR_VALUE   = 2850;
const int WATER_VALUE = 1200;

// ==========================================
// --- 2. GLOBAL OBJECTS ---
// ==========================================
Adafruit_BME280 bme;
OneWire oneWire(PIN_DS18B20);
DallasTemperature sensors(&oneWire);
WiFiClient espClient;
PubSubClient mqttClient(espClient);
HardwareSerial SerialSIM(1);
TinyGsm modem(SerialSIM);

// --- DATA STORAGE ---
String deviceId;
String errorLog[5]; 
int errorCount = 0;
float currentLat = 0.0, currentLon = 0.0, currentAcc = 0.0;
float finalBatteryVoltage = 0.0;
int finalBatteryPercentage = 0;

// ==========================================
// --- 3. CORE LOGIC FUNCTIONS ---
// ==========================================

void addError(String err) {
  if (errorCount < 5) {
    errorLog[errorCount] = err;
    errorCount++;
  }
  Serial.println("!!! ERROR LOGGED: " + err + " !!!");
}

// THE "T" LOGIC FROM YOUR SOURCE
void toggleModemPower() {
  Serial.println("\n[ESP32] Toggling SIM800C Power (Executing 'T' Logic)...");
  pinMode(SIM_PWR_PIN, OUTPUT);
  // Pulling Pin 5 to LOW connects the 'link' pin to GND, simulating a button press
  digitalWrite(SIM_PWR_PIN, LOW);  
  delay(1500); // Hold for 1.5 seconds
  // Release the "button"
  digitalWrite(SIM_PWR_PIN, HIGH);
  
  Serial.println("[ESP32] Power toggle complete. Waiting 3 seconds...");
  delay(3000); //
}

void takeQuietBatteryReading() {
  Serial.println("[SYSTEM] Taking Quiet Battery Measurement...");
  analogReadResolution(12);
  delay(200); 
  long sum = 0;
  for(int i=0; i<15; i++) {
    sum += analogRead(PIN_BATTERY);
    delay(10);
  }
  float avgRaw = sum / 15.0;
  float pinVoltage = (avgRaw / 4095.0) * 3.3;
  // Formula: PinVoltage * DividerFactor * CalibrationFactor
  finalBatteryVoltage = pinVoltage * 2.0 * 1.077; 
  finalBatteryPercentage = map(finalBatteryVoltage * 100, 320, 420, 0, 100);
  finalBatteryPercentage = constrain(finalBatteryPercentage, 0, 100);
  Serial.print(" > Result: ");
  Serial.print(finalBatteryVoltage);
  Serial.print("V (");
  Serial.print(finalBatteryPercentage);
  Serial.println("%)");
}

// ==========================================
// --- 4. SETUP (THE FULL CHECKLIST) ---
// ==========================================

void setup() {
  // Serial with PC
  Serial.begin(115200);
  // Serial with SIM800C at 9600
  SerialSIM.begin(9600, SERIAL_8N1, SIM_RX_PIN, SIM_TX_PIN); 
  delay(1000);
  Serial.println("\n\n=== SOLARA FULL SYSTEM STARTUP (UNABRIDGED) ===");

  // A. IDENTITY & INITIAL MEASURE
  uint64_t chipId = ESP.getEfuseMac();
  char macStr[13];
  snprintf(macStr, sizeof(macStr), "%04X%08X", (uint16_t)(chipId >> 32), (uint32_t)chipId);
  deviceId = "ESP32-" + String(macStr);
  Serial.println("[SYSTEM] Device ID: " + deviceId);
  takeQuietBatteryReading();

  // B. WIFI CONNECTION
  Serial.print("[WIFI] Connecting to " + String(ssid));
  WiFi.begin(ssid, password);
  int timeout = 0;
  while (WiFi.status() != WL_CONNECTED && timeout < 20) {
    delay(500);
    Serial.print(".");
    timeout++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println(" Connected! IP: " + WiFi.localIP().toString());
  } else {
    Serial.println(" FAILED.");
    addError("WIFI_FAIL");
  }

  // C. MODEM ACTIVATION SEQUENCE (T then AT)
  // Step 1: Hardware Toggle ("T" Command equivalent)
  toggleModemPower(); 

  // Step 2: Software Handshake ("AT" Command equivalent)
  Serial.println("[SIM800C] Sending AT via Library...");
  if (modem.restart()) { 
    Serial.println(" > Modem responded to AT. Initializing Software...");
    if (modem.waitForNetwork(15000L)) {
      Serial.println(" > Network Found! Fetching GPRS Location...");
      if (modem.gprsConnect(apn, "", "")) {
        modem.getGsmLocation(&currentLat, &currentLon, &currentAcc);
        Serial.println(" > Location Fixed.");
        modem.gprsDisconnect();
      }
    } else {
      addError("SIM_NET_FAIL");
    }
  } else {
    addError("SIM_BOOT_FAIL");
    Serial.println(" > Modem failed to respond to AT commands.");
  }
  
  // Power off to save battery before sleep
  modem.poweroff();
  Serial.println("[SIM800C] Modem powered down.");

  // D. MQTT INITIALIZATION
  if (WiFi.status() == WL_CONNECTED) {
    mqttClient.setServer(mqtt_server, mqtt_port);
    mqttClient.setBufferSize(512);
    Serial.print("[MQTT] Connecting to " + String(mqtt_server) + "...");
    if (mqttClient.connect(deviceId.c_str())) {
      Serial.println(" SUCCESS!");
    } else {
      Serial.println(" FAILED. State: " + String(mqttClient.state()));
    }
  }

  // E. SENSOR INITIALIZATION
  if (!bme.begin(0x76) && !bme.begin(0x77)) addError("BME280_FAIL");
  sensors.begin();
  Serial.println("[SYSTEM] Sensor initialization complete.");
}

// ==========================================
// --- 5. LOOP (DATA DISPATCH) ---
// ==========================================

void loop() {
  Serial.println("\n---------------- DATA COLLECTION CYCLE ----------------");

  // 1. READ ALL SENSORS
  float airTemp = bme.readTemperature();
  float airHumid = bme.readHumidity();
  
  sensors.requestTemperatures();
  float soilTemp = sensors.getTempCByIndex(0);
  
  int moistureRaw = analogRead(PIN_MOISTURE);
  int moisturePercent = map(moistureRaw, AIR_VALUE, WATER_VALUE, 0, 100);
  moisturePercent = constrain(moisturePercent, 0, 100);

  // 2. CONSTRUCT JSON PAYLOAD
  JsonDocument doc; 
  doc["device_id"]           = deviceId;
  doc["ambient_temperature"] = airTemp;
  doc["ambient_humidity"]    = airHumid;
  doc["soil_humidity"]       = moisturePercent;
  doc["soil_temperature"]    = soilTemp;
  doc["battery_voltage"]     = finalBatteryVoltage;
  doc["battery_percentage"]  = finalBatteryPercentage;

  JsonObject location = doc["location"].to<JsonObject>();
  location["latitude"]  = currentLat;
  location["longitude"] = currentLon;
  location["accuracy"]  = currentAcc;

  JsonArray errors = doc["errors"].to<JsonArray>();
  for (int i = 0; i < errorCount; i++) {
    errors.add(errorLog[i]);
  }
  if (errorCount == 0) errors.add("NONE");

  char payload[512];
  serializeJson(doc, payload);

  // 3. PUBLISH DATA
  if (mqttClient.connected()) {
    String topic = "solara/telemetry/" + deviceId;
    if (mqttClient.publish(topic.c_str(), payload)) {
      Serial.println("[MQTT] PUBLISH SUCCESS!");
      Serial.println("Payload: " + String(payload));
    } else {
      Serial.println("[MQTT] PUBLISH FAILED!");
    }
  } else {
    Serial.println("[MQTT] ERROR: Not connected to broker. Printing locally:");
    Serial.println(payload);
  }

  // 4. ENTER DEEP SLEEP
  Serial.println("\n=== TASKS COMPLETE. ENTERING DEEP SLEEP (5 MIN) ===");
  // Clear Wi-Fi before sleep to prevent radio hang
  WiFi.disconnect(true);
  delay(1000);
  esp_deep_sleep(SLEEP_DURATION_US);
}