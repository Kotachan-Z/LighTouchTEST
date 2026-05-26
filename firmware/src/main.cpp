#include <Arduino.h>
#include "state_machine.h"

void setup() {
    Serial.begin(115200);
    delay(500);
    Serial.println("[LighTouch] Starting...");
    StateMachine::begin();
    Serial.println("[LighTouch] Ready");
}

void loop() {
    StateMachine::update();
    delay(10);
}
