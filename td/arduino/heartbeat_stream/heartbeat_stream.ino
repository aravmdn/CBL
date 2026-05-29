// heartbeat_stream.ino  -  CBL live heartbeat for TouchDesigner
// ---------------------------------------------------------------
// Merges the two teammate sketches into one stream-friendly firmware:
//   * finger detection            (from averagedheartratecbl.ino)
//   * rolling-average smoothing    (from averagedheartratecbl.ino)
//   * continuous, clean output     (from sketch_liveheartarduino.ino)
//
// Outputs ONE bare number per detected beat, e.g. "72.4\n", at 115200 baud (8-N-1).
// No label text, no 10-second window, no blocking wait loop -> TouchDesigner's
// pulse_serial DAT reads it directly and drives the `heartbeat` LFO frequency.
// When no finger is present it stays silent, so TD holds the last measured BPM.
//
// Hardware: MAX30102 / MAX30105 pulse oximeter on I2C (Wire).
// Library:  SparkFun MAX3010x  (MAX30105.h + heartRate.h)
// Staging:  one hand rests a fingertip on the sensor; the other hand is free for
//           the camera.

#include <Wire.h>
#include "MAX30105.h"
#include "heartRate.h"

MAX30105 sensor;

const byte  RATE_SIZE      = 8;       // rolling average window (beats)
const long  FINGER_IR      = 50000;   // IR above this = finger present
const float BPM_MIN        = 40.0;    // plausible-human gate (matches TD parser)
const float BPM_MAX        = 180.0;

float rates[RATE_SIZE];
byte  rateSpot   = 0;
byte  rateCount  = 0;                  // how many valid beats collected so far
long  lastBeat   = 0;
bool  hadFinger  = false;

void setup() {
  Serial.begin(115200);

  if (!sensor.begin(Wire, I2C_SPEED_STANDARD)) {
    // Non-numeric line -> TD ignores it; visible on the Serial Monitor for debug.
    Serial.println("SENSOR NOT FOUND - check wiring");
    while (1);
  }

  sensor.setup();                      // default config
  sensor.setPulseAmplitudeRed(0x0A);   // gentle red LED
  sensor.setPulseAmplitudeGreen(0);    // MAX30102 has no green LED
}

void loop() {
  long irValue = sensor.getIR();

  // --- no finger: reset the average so the next reading starts clean ---
  if (irValue < FINGER_IR) {
    if (hadFinger) {
      rateSpot = 0;
      rateCount = 0;
      hadFinger = false;
    }
    return;                            // stay silent -> TD holds last BPM
  }
  hadFinger = true;

  // --- beat detected: compute instantaneous BPM, smooth, stream ---
  if (checkForBeat(irValue)) {
    long  delta = millis() - lastBeat;
    lastBeat = millis();

    float bpm = 60.0 / (delta / 1000.0);

    if (bpm >= BPM_MIN && bpm <= BPM_MAX) {
      rates[rateSpot] = bpm;
      rateSpot = (rateSpot + 1) % RATE_SIZE;
      if (rateCount < RATE_SIZE) rateCount++;

      float avg = 0;
      for (byte i = 0; i < rateCount; i++) avg += rates[i];
      avg /= rateCount;

      Serial.println(avg, 1);          // one decimal, bare number for TD
    }
  }
}
