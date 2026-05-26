#pragma once
#include <Arduino.h>
#include "config.h"

namespace NfcManager {
    // I2C + IRQ + RESET ピンを指定して初期化。PN532が見つからなければ false
    bool begin(uint8_t sdaPin, uint8_t sclPin, uint8_t irqPin, uint8_t resetPin);

    void enable();
    void disable();

    // タグ検出。検出時 true、uid/uidLen に結果を書き込む
    bool readTag(uint8_t uid[NFC_UID_MAX_LEN], uint8_t* uidLen, uint16_t timeoutMs = NFC_POLL_TIMEOUT_MS);
}
