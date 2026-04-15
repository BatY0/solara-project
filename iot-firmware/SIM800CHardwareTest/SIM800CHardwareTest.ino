// --- SIM800C HARDWARE TEST SKETCH ---

#define SIM_RX_PIN 26 // ESP32 RX -> SIM800C TXD
#define SIM_TX_PIN 27 // ESP32 TX -> SIM800C RXD
#define SIM_PWR_PIN 5 // ESP32 Pin 5 -> SIM800C link pin

HardwareSerial SerialSIM(1);

void toggleModemPower() {
  Serial.println("\n[ESP32] Toggling SIM800C Power...");
  pinMode(SIM_PWR_PIN, OUTPUT);
  
  // Pulling Pin 5 to LOW connects the 'link' pin to GND, simulating a button press
  digitalWrite(SIM_PWR_PIN, LOW);  
  delay(1500);                     // Hold the "button" for 1.5 seconds
  digitalWrite(SIM_PWR_PIN, HIGH); // Release the "button"
  
  Serial.println("[ESP32] Power toggle complete. Waiting 3 seconds...");
  delay(3000); 
}

void setup() {
  // Start serial communication with the PC
  Serial.begin(115200);
  
  // Start serial communication with the SIM800C
  // Default baud rate for SIM800C is usually 9600
  SerialSIM.begin(9600, SERIAL_8N1, SIM_RX_PIN, SIM_TX_PIN);
  
  delay(1000);
  Serial.println("\n\n--- SIM800C BRIDGE STARTED ---");
  Serial.println("1. Type 'T' and hit Enter to toggle the modem power.");
  Serial.println("2. Type 'AT' and hit Enter to test communication.");
  Serial.println("--------------------------------\n");
  
  // Initialize the power pin to HIGH so it doesn't accidentally trigger
  pinMode(SIM_PWR_PIN, OUTPUT);
  digitalWrite(SIM_PWR_PIN, HIGH);
}

void loop() {
  // 1. Read commands from your PC and send them to the Modem
  if (Serial.available()) {
    String command = Serial.readStringUntil('\n');
    command.trim(); // Remove extra spaces
    
    if (command.length() > 0) {
      if (command.equalsIgnoreCase("T")) {
        toggleModemPower();
      } else {
        Serial.println("[You] " + command);
        SerialSIM.println(command); // Send the command to the modem
      }
    }
  }

  // 2. Read responses from the Modem and print them to your PC
  if (SerialSIM.available()) {
    String response = SerialSIM.readStringUntil('\n');
    response.trim();
    if (response.length() > 0) {
      Serial.println("[Modem] " + response);
    }
  }
}
