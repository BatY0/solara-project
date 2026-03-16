#include <WiFi.h>
#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BMP280.h> // BMP280 Kütüphanesi
#include <OneWire.h>
#include <DallasTemperature.h>

// ==========================================
// --- KULLANICI AYARLARI ---
// ==========================================
const char* ssid = "Bahase";          // Wifi Adını Buraya Yaz
const char* password = "Cotanak-031.,";    // Wifi Şifresini Buraya Yaz

// --- PIN TANIMLARI ---
#define PIN_DS18B20 4       // Toprak Sıcaklık (Sarı Kablo)
#define PIN_MOISTURE 34     // Toprak Nem (Analog)
// SDA -> 21 (Mavi/Yesil)
// SCL -> 22 (Sarı/Turuncu)

// --- KALIBRASYON (Toprak Nemi İçin) ---
// Sensör havadayken (Kuru) okunan değer:
const int AIR_VALUE = 2850; // Senin az önce gönderdiğin değerlere göre ayarladım
// Sensör sudayken (Islak) okunan değer (Tahmini):
const int WATER_VALUE = 1200; 

// ==========================================

// --- NESNELER ---
Adafruit_BMP280 bmp; // I2C
OneWire oneWire(PIN_DS18B20);
DallasTemperature sensors(&oneWire);

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n\n--- SENSOR IZLEME SISTEMI BASLATILIYOR ---");

  // 1. WIFI BAGLANTISI (Sadece baglanti testi icin)
  WiFi.begin(ssid, password);
  Serial.print("WiFi Baglaniyor");
  int timeout = 0;
  while (WiFi.status() != WL_CONNECTED && timeout < 20) {
    delay(500);
    Serial.print(".");
    timeout++;
  }
  
  if(WiFi.status() == WL_CONNECTED){
    Serial.println("\nWiFi Baglandi! IP Adresi: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nUYARI: WiFi Baglanamadi (Sifre yanlis olabilir).");
    Serial.println("Sensörler WiFi olmadan da calismaya devam edecek...");
  }

  // 2. BMP280 (Hava) BASLATMA
  // Önce 0x76 dene, olmazsa 0x77 dene
  if (!bmp.begin(0x76) && !bmp.begin(0x77)) {
    Serial.println("HATA: BMP280 Sensoru bulunamadi! Kablolari (21-22) kontrol et.");
  } else {
    Serial.println("BMP280 (Hava) Sensoru Hazir.");
    // Daha hassas ölçüm için ayarlar
    bmp.setSampling(Adafruit_BMP280::MODE_NORMAL,
                    Adafruit_BMP280::SAMPLING_X2,
                    Adafruit_BMP280::SAMPLING_X16,
                    Adafruit_BMP280::FILTER_X16,
                    Adafruit_BMP280::STANDBY_MS_500);
  }

  // 3. DS18B20 (Toprak Isı) BASLATMA
  sensors.begin();
  Serial.println("DS18B20 (Toprak Isi) Sensoru Hazir.");
}

void loop() {
  Serial.println("\n---------------- ANLIK VERILER ----------------");

  // --- OKUMA ISLEMLERI ---
  
  // A. Hava Verileri (BMP280)
  float airTemp = bmp.readTemperature();
  float pressure = bmp.readPressure(); // Pascal cinsinden
  float altitude = bmp.readAltitude(1013.25); // Tahmini Rakım

  // B. Toprak Sicakligi (DS18B20)
  sensors.requestTemperatures(); 
  float soilTemp = sensors.getTempCByIndex(0);

  // C. Toprak Nemi (Kapasitif)
  int moistureRaw = analogRead(PIN_MOISTURE);
  // Yuzdeye Cevirme (Haritalama)
  // map(okunan, kuru, islak, %0, %100)
  int moisturePercent = map(moistureRaw, AIR_VALUE, WATER_VALUE, 0, 100);
  
  // %0 ve %100 sınırlarını asmasın
  if(moisturePercent < 0) moisturePercent = 0;
  if(moisturePercent > 100) moisturePercent = 100;

  // --- EKRANA YAZDIRMA ---
  
  // 1. HAVA DURUMU
  Serial.print("Hava Sicaklik : "); 
  Serial.print(airTemp); 
  Serial.println(" °C");
  
  Serial.print("Basinc        : "); 
  Serial.print(pressure); 
  Serial.println(" Pa");
  
  // 2. TOPRAK DURUMU
  Serial.print("Toprak Isi    : "); 
  Serial.print(soilTemp); 
  Serial.println(" °C");

  Serial.print("Toprak Nem    : %"); 
  Serial.print(moisturePercent); 
  Serial.print(" (Ham Deger: "); 
  Serial.print(moistureRaw); 
  Serial.println(")");

  // Sensörler arası uyarı (Örnek)
  if(moisturePercent < 20) {
    Serial.println("⚠️  UYARI: Toprak cok kuru! Sulama gerekiyor.");
  }

  delay(3000); // 3 Saniyede bir güncelle
}