#!/usr/bin/env python3
"""
Publish fake Solara IoT telemetry over MQTT for local testing (charts, alerts, etc.).

The backend subscribes to:   solara/telemetry/#
and expects payloads like the ESP32 (see TelemetrySubscriber.java).

Setup
-----
1) MQTT broker on the same host/port as backend `mqtt.broker.url` (default tcp://localhost:1883).
   Quick broker:
     docker run --rm -p 1883:1883 eclipse-mosquitto:2

2) Register a device (admin API) with serial number matching --device-id, e.g. SIM-001.
   Pair that device to your field (app or PUT /api/v1/fields/{id}/pair?deviceId=SIM-001).

3) Install dependency and run:
     pip install paho-mqtt
     python scripts/telemetry_emulator.py --device-id SIM-001 --interval 10

Examples
--------
  # Steady “healthy” readings
  python scripts/telemetry_emulator.py --device-id SIM-001

  # Dry soil (good for testing SOIL_HUMIDITY BELOW threshold alerts)
  python scripts/telemetry_emulator.py --device-id SIM-001 --soil-humidity 5

  # Explicit scenario presets
  python scripts/telemetry_emulator.py --device-id SIM-001 --scenario normal
  python scripts/telemetry_emulator.py --device-id SIM-001 --scenario dry_soil
"""

from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.parse
from typing import Any

try:
    import paho.mqtt.client as mqtt
except ImportError:
    print("Missing dependency: pip install paho-mqtt", file=sys.stderr)
    sys.exit(1)


def parse_broker(url: str) -> tuple[str, int]:
    if "://" not in url:
        url = "tcp://" + url
    parsed = urllib.parse.urlparse(url.replace("tcp://", "http://", 1))
    host = parsed.hostname or "localhost"
    port = parsed.port or 1883
    return host, port


def build_payload(
    device_id: str,
    scenario: str,
    overrides: dict[str, Any],
) -> dict[str, Any]:
    base: dict[str, Any] = {
        "device_id": device_id,
        "ambient_temperature": 22.0,
        "ambient_humidity": 55.0,
        "soil_temperature": 18.0,
        "soil_humidity": 42.0,
        "battery_voltage": 3.7,
        "battery_percentage": 88,
    }

    if scenario == "dry_soil":
        base["soil_humidity"] = 5.0
    elif scenario == "wet_soil":
        base["soil_humidity"] = 92.0
    elif scenario == "hot_ambient":
        base["ambient_temperature"] = 38.0
    elif scenario == "low_battery":
        base["battery_percentage"] = 8

    numeric_keys = (
        "ambient_temperature",
        "ambient_humidity",
        "soil_temperature",
        "soil_humidity",
        "battery_voltage",
        "battery_percentage",
    )
    for key in numeric_keys:
        if key in overrides and overrides[key] is not None:
            base[key] = overrides[key]

    return base


def main() -> None:
    parser = argparse.ArgumentParser(description="Solara MQTT telemetry emulator")
    parser.add_argument("--broker", default="tcp://localhost:1883", help="MQTT broker URL")
    parser.add_argument("--device-id", required=True, help="Must match registered ESP serial + field pairing")
    parser.add_argument("--interval", type=float, default=30.0, help="Seconds between publishes")
    parser.add_argument(
        "--scenario",
        choices=("normal", "dry_soil", "wet_soil", "hot_ambient", "low_battery"),
        default="normal",
        help="Preset sensor bundle (overridden by explicit --soil-humidity etc.)",
    )
    parser.add_argument("--ambient-temperature", type=float, default=None)
    parser.add_argument("--ambient-humidity", type=float, default=None)
    parser.add_argument("--soil-temperature", type=float, default=None)
    parser.add_argument("--soil-humidity", type=float, default=None)
    parser.add_argument("--battery-voltage", type=float, default=None)
    parser.add_argument("--battery-percentage", type=int, default=None)
    parser.add_argument("--once", action="store_true", help="Send a single message and exit")
    args = parser.parse_args()

    host, port = parse_broker(args.broker)
    topic = f"solara/telemetry/{args.device_id}"

    overrides = {
        "ambient_temperature": args.ambient_temperature,
        "ambient_humidity": args.ambient_humidity,
        "soil_temperature": args.soil_temperature,
        "soil_humidity": args.soil_humidity,
        "battery_voltage": args.battery_voltage,
        "battery_percentage": args.battery_percentage,
    }

    cid = f"solara-emulator-{args.device_id}"
    try:
        client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id=cid)
    except (AttributeError, TypeError):
        client = mqtt.Client(client_id=cid)
    client.connect(host, port, keepalive=60)
    client.loop_start()

    try:
        while True:
            payload = build_payload(args.device_id, args.scenario, overrides)
            body = json.dumps(payload, separators=(",", ":"))
            info = client.publish(topic, body, qos=1)
            info.wait_for_publish()
            print(f"Published to {topic}: {body}")
            if args.once:
                break
            time.sleep(args.interval)
    finally:
        client.loop_stop()
        client.disconnect()


if __name__ == "__main__":
    main()
