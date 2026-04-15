#define BATTERY_PIN 35

// --- VOLTAGE DIVIDER SETTINGS ---
// Replace these values with the exact resistor values you used (in Ohms)
const float R1 = 100000.0; // Example: 100k Ohm resistor
const float R2 = 100000.0; // Example: 100k Ohm resistor

// The ESP32 ADC is notoriously slightly non-linear. 
// If your readings are consistently off by a few percent, tweak this calibration factor.
const float CALIBRATION_FACTOR = 1.077; 

// --- BATTERY SETTINGS (Standard 3.7V LiPo) ---
const float BATT_MAX_VOLTAGE = 4.20; // 100%
const float BATT_MIN_VOLTAGE = 3.20; // 0%

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n--- VOLTAGE DIVIDER TEST STARTING ---");
  
  // Ensure the ADC is set to 12-bit resolution (0-4095)
  analogReadResolution(12); 
}

void loop() {
  // 1. Read the raw ADC value from pin 35
  int rawValue = analogRead(BATTERY_PIN);

  // 2. Calculate the voltage hitting the ESP32 pin (Reference voltage is ~3.3V)
  float pinVoltage = (rawValue / 4095.0) * 3.3;

  // 3. Reverse the voltage divider math to find the actual battery voltage
  float batteryVoltage = pinVoltage * ((R1 + R2) / R2) * CALIBRATION_FACTOR;

  // 4. Calculate the battery percentage
  float batteryPercentage = ((batteryVoltage - BATT_MIN_VOLTAGE) / (BATT_MAX_VOLTAGE - BATT_MIN_VOLTAGE)) * 100.0;

  // Constrain the percentage so it doesn't show 105% or -5%
  if (batteryPercentage > 100.0) batteryPercentage = 100.0;
  if (batteryPercentage < 0.0) batteryPercentage = 0.0;

  // 5. Print out the debugging information
  Serial.println("-------------------------------------");
  Serial.printf("Raw ADC Reading : %d\n", rawValue);
  Serial.printf("Voltage at Pin  : %.2f V\n", pinVoltage);
  Serial.printf("Battery Voltage : %.2f V\n", batteryVoltage);
  Serial.printf("Estimated Power : %.0f %%\n", batteryPercentage);

  delay(2000); // Wait 2 seconds before the next reading
}