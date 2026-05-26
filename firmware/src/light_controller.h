#pragma once
#include <Arduino.h>

namespace LightController {
    void begin(uint8_t pin);
    void on();
    void off();
    void toggle();
    bool isOn();
}
