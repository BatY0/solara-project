# Solara Project ☀️

> **Our senior design project for university.**
> > 🌐 **Live Website:** [solaraapp.com.tr](https://solaraapp.com.tr)

Solara is a comprehensive system featuring an IoT hardware component, machine learning analytics, a web frontend, a mobile application, and an interactive chatbot. This repository contains the complete source code, deployment configurations, and presentation materials for our senior design project.

## 📁 Project Structure

The repository is organized into a microservices-style architecture, with each component isolated in its respective directory:

- **`backend/`**: Core API and business logic.
- **`frontend/`**: Web-based user interface.
- **`mobile/`**: Mobile application (Java/Android native).
- **`iot-firmware/`**: C++ firmware for the physical IoT devices/sensors.
- **`ml-engine/`**: Machine learning models and data processing (Python & Jupyter Notebooks).
- **`chatbot/`**: Interactive chatbot service.
- **`scripts/`**: Utility and automation scripts.
- **`.github/workflows/`**: CI/CD pipelines for automated testing and deployment.

## 🛠️ Technologies & Stack

Based on our ecosystem, Solara utilizes the following technologies:
- **Languages:** TypeScript, Java, Python, C++
- **Web & API:** Node.js/TypeScript (Frontend/Backend)
- **Mobile:** Java
- **Machine Learning:** Python, Jupyter Notebooks
- **IoT:** C++
- **Infrastructure & Deployment:** Docker, Docker Compose, Caddy (Reverse Proxy)

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed on your machine:
- [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/)
- Node.js & npm (for local frontend/backend development)
- Python 3.x (for ML engine and chatbot)
- Java SDK / Android Studio (for mobile app development)

### Running Locally with Docker

The easiest way to spin up the web and API stack is by using Docker Compose.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/BatY0/solara-project.git
   cd solara-project
   ```

2. **Configure Environment Variables:**
   Copy the example environment file and fill in the necessary keys (e.g., API keys, database URLs):
   ```bash
   cp .env.example .env
   ```

3. **Start the services:**
   ```bash
   docker-compose up --build
   ```
   *This will start the backend, frontend, chatbot, ML-engine, and the Caddy reverse proxy as defined.*

4. **Access the application:**
   - **Frontend:** `http://localhost` (or the port routed by Caddy)
   - **Backend API:** `http://localhost/api` (Depending on your Caddyfile routing)

## 📱 Mobile Application

To run the mobile app locally:
1. Open the `mobile/` directory in Android Studio.
2. Sync Gradle files.
3. Build and run the application on an Android Emulator or connected physical device.

## 🔌 IoT Firmware

The `iot-firmware/` directory contains the C++ code required for the hardware component.
- Flash this code onto your ESP32 using your preferred IDE (like PlatformIO or Arduino IDE).

## 🧠 ML Engine & Chatbot

To work on the machine learning models or the chatbot separately from Docker:
1. Navigate to the `ml-engine/` or `chatbot/` directory.
2. Create a virtual environment and install the required Python dependencies:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   pip install -r requirements.txt
   ```
3. Run the Jupyter notebooks to train models or start the chatbot service locally.

## 👥 Team & Contributors

- [@BatY0](https://github.com/BatY0) - *Frontend*
- [@Cherub26](https://github.com/Cherub26) - *Mobile*
- [@InvictusStella](https://github.com/InvictusStella) - *Backend*

---
*Developed as a University Senior Design Project for Akdeniz University.*
