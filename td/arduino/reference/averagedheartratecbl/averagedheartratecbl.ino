#include <Wire.h>
#include "MAX30105.h"
#include "heartRate.h"

MAX30105 particleSensor;

const byte RATE_SIZE = 10;
byte rates[RATE_SIZE];
byte rateSpot = 0;

long lastBeat = 0;

float beatsPerMinute;
int beatAvg;

unsigned long startTime;
bool measuring = false;

void setup()
{
  Serial.begin(115200);
  Serial.println("Initializing...");

  // Initialize sensor
  if (!particleSensor.begin(Wire, I2C_SPEED_STANDARD))
  {
    Serial.println("MAX30102 not found. Check wiring.");
    while (1);
  }

  Serial.println("Place your finger on the sensor...");
  
  particleSensor.setup();
  particleSensor.setPulseAmplitudeRed(0x0A);
  particleSensor.setPulseAmplitudeGreen(0);

  delay(1000);
}

void loop()
{
  long irValue = particleSensor.getIR();

  // Detect finger
  if (irValue > 50000)
  {
    if (!measuring)
    {
      Serial.println("Finger detected!");
      Serial.println("Measuring for 10 seconds...");
      
      measuring = true;
      startTime = millis();
      rateSpot = 0;
    }

    // Detect heartbeat
    if (checkForBeat(irValue))
    {
      long delta = millis() - lastBeat;
      lastBeat = millis();

      beatsPerMinute = 60 / (delta / 1000.0);

      // Valid BPM range
      if (beatsPerMinute < 255 && beatsPerMinute > 20)
      {
        rates[rateSpot++] = (byte)beatsPerMinute;
        rateSpot %= RATE_SIZE;

        // Calculate average
        beatAvg = 0;
        for (byte x = 0; x < RATE_SIZE; x++)
          beatAvg += rates[x];

        beatAvg /= RATE_SIZE;

        Serial.print("Current BPM: ");
        Serial.println(beatsPerMinute);
      }
    }

    // After 10 seconds
    if (millis() - startTime >= 10000)
    {
      Serial.println("================================");
      Serial.print("AVERAGE BPM: ");
      Serial.println(beatAvg);
      Serial.println("Measurement complete.");
      Serial.println("Remove finger to restart.");
      Serial.println("================================");

      measuring = false;

      // Wait until finger removed
      while (particleSensor.getIR() > 50000)
      {
        delay(100);
      }

      Serial.println("Place finger again for new reading.");
    }
  }
  else
  {
    Serial.println("No finger detected.");
    delay(500);
  }
}