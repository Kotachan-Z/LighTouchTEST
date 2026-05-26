#include "light_controller.h"

static uint8_t _pin;
static bool _isOn = false;

namespace LightController {

void begin(uint8_t pin) {
    _pin = pin;
    pinMode(_pin, OUTPUT);
    digitalWrite(_pin, LOW);
    _isOn = false;
}

void on()     { digitalWrite(_pin, HIGH); _isOn = true; }
void off()    { digitalWrite(_pin, LOW);  _isOn = false; }
void toggle() { _isOn ? off() : on(); }
bool isOn()   { return _isOn; }

} // namespace LightController
