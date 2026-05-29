#include <Wire.h>
#include "MAX30105.h"
#include "heartRate.h"

MAX30105 sensor;

long lastBeat = 0;
float bpm;

void setup() {
  Serial.begin(115200);

  sensor.begin(Wire, I2C_SPEED_STANDARD);
  sensor.setup();
}

void loop() {

  long irValue = sensor.getIR();

  if (checkForBeat(irValue)) {

    long delta = millis() - lastBeat;
    lastBeat = millis();

    bpm = 60 / (delta / 1000.0);

    if (bpm > 40 && bpm < 180) {
      Serial.println(bpm);
    }
  }
}