#pragma once
#include <Arduino.h>
#include "config.h"

namespace Security {
    void hashPassword(const String& password, uint8_t digest[SHA256_LEN]);
    bool verifyPassword(const String& input, const uint8_t storedHash[SHA256_LEN]);
    String bytesToHex(const uint8_t* bytes, size_t len);
}
