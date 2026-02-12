# Solara Platform API Specifications

- **Version:** 2.7
- **Status:** Syntax Highlighting Fixed
- **Authentication:** All endpoints (except `Auth`) require `Authorization: Bearer <JWT_TOKEN>` header.
- **Base URL:** `https://api.solara-app.com` (Example)

---

## 0. Data Dictionary & Standard Units

To ensure consistency between the Backend, Frontend, and ML Engine, the backend always processes and returns data in the following units. The React frontend is responsible for any localized conversions (e.g., converting Celsius to Fahrenheit for display).

- **Temperature:** Celsius (°C)
- **Humidity:** Percentage (%)
- **Pressure:** Hectopascals (hPa)
- **Rainfall:** Millimeters (mm)
- **Area:** Hectares (ha)
- **Nutrients (NPK):** Milligrams per Kilogram (mg/kg) or Parts Per Million (ppm)

---

## 1. Authentication & Users

### 1.1 User Registration
**Endpoint:** `POST /api/v1/auth/register`

**Request Body:**
```json
{
  "email": "farmer@example.com",
  "password": "securepassword123",
  "fullName": "Ahmet Yılmaz",
  "role": "FARMER" 
}
```

**Success Response (201 Created):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": "user-uuid",
    "email": "farmer@example.com",
    "fullName": "Ahmet Yılmaz",
    "role": "User"
  }
}
```

### 1.2 User Login
**Endpoint:** `POST /api/v1/auth/login`

**Request Body:**
```json
{
  "email": "farmer@example.com",
  "password": "securepassword123"
}
```

**Success Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9..."
}
```

### 1.3 Get Current User Profile
**Endpoint:** `GET /api/v1/users/me`

**Success Response (200 OK):**
```json
{
  "id": "user-uuid",
  "email": "farmer@example.com",
  "fullName": "Ahmet Yılmaz",
  "role": "FARMER",
  "isVerified": true,
  "createdAt": "2026-01-01T10:00:00Z"
}
```

### 1.4 Change Password
**Endpoint:** `PATCH /api/v1/users/me/password`

**Request Body:**
```json
{
  "oldPassword": "securepassword123",
  "newPassword": "newsecurepassword456"
}
```

**Success Response (200 OK):**
```json
{
  "message": "Password updated successfully."
}
```

### 1.5 Delete Account
**Endpoint:** `DELETE /api/v1/users/me`

**Success Response (204 No Content):**
> No body returned.

### 1.6 Request Email Verification (Optional)
**Endpoint:** `POST /api/v1/auth/verify/request`

**Request Body:**
```json
{
  "email": "farmer@example.com"
}
```

**Success Response (200 OK):**
```json
{
  "message": "Verification code sent to farmer@example.com"
}
```

### 1.7 Confirm Email Verification (Optional)
**Endpoint:** `POST /api/v1/auth/verify/confirm`

**Request Body:**
```json
{
  "email": "farmer@example.com",
  "code": "123456"
}
```

**Success Response (200 OK):**
```json
{
  "message": "Email verified successfully.",
  "isVerified": true
}
```

---

## 2. Field Management & Soil Properties

### 2.1 Get All Fields (Paginated)
**Description:** Used to populate the dashboard cards.  
**Endpoint:** `GET /api/v1/fields?page=0&size=10`

**Success Response (200 OK):**
```json
{
  "content": [
    {
      "id": "field-uuid-1",
      "name": "North Tomato Sector",
      "areaHectares": 2.5,
      "soilType": "Loamy"
    },
    {
      "id": "field-uuid-2",
      "name": "South Corn Sector",
      "areaHectares": 5.0,
      "soilType": "Clay"
    }
  ],
  "totalPages": 1,
  "totalElements": 2,
  "last": true
}
```

### 2.2 Get Single Field
**Description:** Fetches detailed information for a specific field when the user clicks on a field card.  
**Endpoint:** `GET /api/v1/fields/{fieldId}`

**Success Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "North Tomato Sector",
  "location": "POLYGON((30.7133 36.8969, 30.7144 36.8969, 30.7144 36.8977, 30.7133 36.8977, 30.7133 36.8969))",
  "areaHectares": 2.5,
  "soilType": "Loamy",
  "createdAt": "2026-01-15T08:00:00Z"
}
```

### 2.3 Create a New Field
**Endpoint:** `POST /api/v1/fields`

**Request Body:**
```json
{
  "name": "North Tomato Sector",
  "location": "POLYGON((30.7133 36.8969, 30.7144 36.8969, 30.7144 36.8977, 30.7133 36.8977, 30.7133 36.8969))",
  "areaHectares": 2.5,
  "soilType": "Loamy"
}
```

**Success Response (201 Created):**
```json
{
  "id": "new-field-uuid",
  "name": "North Tomato Sector",
  "areaHectares": 2.5,
  "soilType": "Loamy",
  "createdAt": "2026-02-12T12:00:00Z"
}
```

### 2.4 Update Field Details
**Endpoint:** `PUT /api/v1/fields/{fieldId}`

**Request Body:**
```json
{
  "name": "Updated North Tomato Sector",
  "location": "POLYGON((30.7133 36.8969, 30.7144 36.8969, 30.7144 36.8977, 30.7133 36.8977, 30.7133 36.8969))",
  "areaHectares": 3.0,
  "soilType": "Sandy Loam"
}
```

**Success Response (200 OK):**
```json
{
  "id": "field-uuid",
  "name": "Updated North Tomato Sector",
  "areaHectares": 3.0,
  "soilType": "Sandy Loam",
  "updatedAt": "2026-02-12T12:05:00Z"
}
```

### 2.5 Delete Field
**Endpoint:** `DELETE /api/v1/fields/{fieldId}`

**Success Response (204 No Content):**
> No body returned.

### 2.6 Update Manual Soil Properties (NPK)
**Description:** Updates the `field_properties` table. Note: If the user does not provide this data, the React Frontend generates and sends default regional values.  
**Endpoint:** `PATCH /api/v1/fields/{fieldId}/properties`

**Request Body:**
```json
{
  "nitrogen": 45.2,
  "phosphorus": 22.1,
  "potassium": 31.5,
  "ph": 6.8
}
```

**Success Response (200 OK):**
```json
{
  "message": "Field properties updated successfully.",
  "fieldId": "field-uuid",
  "updatedAt": "2026-02-12T12:10:00Z"
}
```

---

## 3. Telemetry & Hardware Feeds (BME280 & DS18B20)

### 3.1 Get Latest Telemetry
**Description:** Fetches the single most recent sensor reading for live dashboard displays.  
**Endpoint:** `GET /api/v1/telemetry/{fieldId}/latest`

**Success Response (200 OK):**
```json
{
  "fieldId": "field-uuid",
  "ambientTemperature": 24.5,
  "ambientHumidity": 65.2,
  "barometricPressure": 1012.5,
  "soilTemperature": 18.2,
  "soilHumidity": 40.1,
  "timestamp": "2026-02-12T13:30:00Z"
}
```

### 3.2 Get Historical Telemetry (For Graphs)
**Description:** Retrieves time-series data for interactive graphs over a specific time range. Data is aggregated by the backend to prevent frontend lag.  
**Endpoint:** `GET /api/v1/telemetry/{fieldId}/history`

**Query Parameters:**
- `start` (ISO Date, e.g., `2026-01-01T00:00:00Z`)
- `end` (ISO Date)
- `interval` (Enum: `hourly`, `daily`)

**Success Response (200 OK):**
```json
[
  {
    "period": "2026-02-12T13:00:00Z",
    "avgAmbientTemp": 24.1,
    "avgSoilTemp": 18.0,
    "avgAmbientHumidity": 64.5
  },
  {
    "period": "2026-02-12T14:00:00Z",
    "avgAmbientTemp": 25.2,
    "avgSoilTemp": 18.5,
    "avgAmbientHumidity": 62.0
  }
]
```

---

## 4. Intelligence Layer (Machine Learning)

### 4.1 Request Range Analysis (Spring Boot API)
**Description:** Triggers the ML pipeline. Backend aggregates sensor data over the dates, fetches rainfall, adds NPK, and queries Flask.  
**Endpoint:** `POST /api/v1/analysis/range`

**Request Body:**
```json
{
  "fieldId": "550e8400-e29b-41d4-a716-446655440000",
  "startDate": "2026-01-01T00:00:00Z",
  "endDate": "2026-01-07T23:59:59Z"
}
```

**Success Response (200 OK):**
```json
{
  "analysisPeriod": "7 days",
  "inputsUsed": {
    "avgTemperature": 22.1,
    "avgHumidity": 60.5,
    "totalRainfall": 12.4,
    "nitrogen": 45.2,
    "phosphorus": 22.1,
    "potassium": 31.5,
    "ph": 6.8
  },
  "recommendations": [
    { "crop": "chickpea", "confidence": 0.9187 },
    { "crop": "grapes", "confidence": 0.0212 }
  ]
}
```

### 4.2 Get Past Recommendations (Paginated)
**Description:** Retrieves historical ML analyses for tracking field suitability over time.  
**Endpoint:** `GET /api/v1/fields/{fieldId}/recommendations?page=0&size=10`

**Success Response (200 OK):**
```json
{
  "content": [
    {
      "id": "rec-uuid-1",
      "analysisDate": "2026-02-10T14:00:00Z",
      "topCrop": "chickpea",
      "confidence": 0.91
    },
    {
      "id": "rec-uuid-2",
      "analysisDate": "2026-02-03T14:00:00Z",
      "topCrop": "rice",
      "confidence": 0.88
    }
  ],
  "totalPages": 1
}
```

### 4.3 Internal ML Engine API (FastAPI)
**Description:** Internal network call from Spring Boot to Python.  
**Endpoint:** `POST http://ml-engine:5000/api/v1/recommend`

**Request Body:**
```json
{
  "N": 20,
  "P": 60,
  "K": 200,
  "temperature": 28,
  "humidity": 75,
  "ph": 6.0,
  "rainfall": 100,
  "top_n": 5
}
```

**Success Response (200 OK):**
```json
{
  "recommendations": [
    { "label": "chickpea", "probability": 0.9187 },
    { "label": "grapes", "probability": 0.0212 },
    { "label": "pigeonpeas", "probability": 0.0068 },
    { "label": "jute", "probability": 0.0036 },
    { "label": "mango", "probability": 0.0028 }
  ]
}
```

---

## 5. Crop Guides & Encyclopedia

### 5.1 Get All Crop Guides (Paginated)
**Endpoint:** `GET /api/v1/crops?page=0&size=20`

**Success Response (200 OK):**
```json
{
  "content": [
    {
      "id": "crop-uuid-1",
      "name": "Chickpea",
      "scientificName": "Cicer arietinum",
      "imageUrl": "https://solara-bucket.s3.amazonaws.com/chickpea.jpg"
    },
    {
      "id": "crop-uuid-2",
      "name": "Rice",
      "scientificName": "Oryza sativa",
      "imageUrl": "https://solara-bucket.s3.amazonaws.com/rice.jpg"
    }
  ],
  "totalPages": 2,
  "totalElements": 22
}
```

### 5.2 Get Crop Guide Details
**Endpoint:** `GET /api/v1/crops/{cropId}`

**Success Response (200 OK):**
```json
{
  "id": "crop-uuid-1",
  "name": "Chickpea",
  "scientificName": "Cicer arietinum",
  "minTemp": 15.0,
  "maxTemp": 30.0,
  "daysToHarvest": 100,
  "description": "A drought-tolerant legume.",
  "plantingInstructions": "Sow seeds 1-2 inches deep.",
  "careInstructions": "Water moderately...",
  "imageUrl": "https://..."
}
```

---

## 6. Admin Operations
> **Note:** Requires JWT token with `role = "ADMIN"`

### 6.1 Create Crop Guide
**Endpoint:** `POST /api/v1/admin/crops`

**Request Body:**
```json
{
  "name": "Chickpea",
  "scientificName": "Cicer arietinum",
  "minTemp": 15.0,
  "maxTemp": 30.0,
  "daysToHarvest": 100,
  "description": "...",
  "plantingInstructions": "...",
  "careInstructions": "..."
}
```

**Success Response (201 Created):**
```json
{
  "id": "new-crop-uuid",
  "name": "Chickpea",
  "createdAt": "2026-02-12T15:00:00Z"
}
```

### 6.2 Update Crop Guide
**Endpoint:** `PUT /api/v1/admin/crops/{cropId}`  
**Request Body:** Same as Create, with updated fields.

**Success Response (200 OK):**
```json
{
  "id": "crop-uuid",
  "name": "Chickpea",
  "updatedAt": "2026-02-12T15:30:00Z"
}
```

### 6.3 Delete Crop Guide
**Endpoint:** `DELETE /api/v1/admin/crops/{cropId}`

**Success Response (204 No Content):**
> No body returned.

### 6.4 Get System Stats
**Endpoint:** `GET /api/v1/admin/stats`

**Success Response (200 OK):**
```json
{
  "totalUsers": 124,
  "activeFields": 45,
  "totalPredictions": 1502,
  "systemStatus": "OPERATIONAL"
}
```

### 6.5 Delete User Account
**Endpoint:** `DELETE /api/v1/admin/users/{userId}`

**Success Response (204 No Content):**
> No body returned.

---

## 7. Hardware Integration (MQTT)
This specifies how the ESP32 hardware should transmit data to the system. This data is received by an MQTT Broker, which Spring Boot listens to and saves into the `sensor_logs` database table.

- **MQTT Broker Topic Structure:** `solara/telemetry/{device_id}`
- **Publish Frequency:** Every 30 minutes (to preserve battery during deep sleep).

**Payload Format (JSON):**
```json
{
  "device_id": "ESP32-A1B2C3",
  "field_id": "550e8400-e29b-41d4-a716-446655440000",
  "ambient_temperature": 24.5, 
  "ambient_humidity": 60.2,    
  "barometric_pressure": 1013.2, 
  "soil_temperature": 18.4,    
  "soil_humidity": 45.0        
}
```
