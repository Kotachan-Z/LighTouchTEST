#include "nfc_manager.h"
#include <Wire.h>
#include <Adafruit_PN532.h>

static Adafruit_PN532* nfc = nullptr;
static bool enabled = false;

namespace NfcManager {

bool begin(uint8_t sdaPin, uint8_t sclPin, uint8_t irqPin, uint8_t resetPin) {
    Wire.begin(sdaPin, sclPin);
    nfc = new Adafruit_PN532(irqPin, resetPin);
    nfc->begin();

    uint32_t ver = nfc->getFirmwareVersion();
    if (!ver) {
        Serial.println("[NFC] PN532 not found");
        delete nfc;
        nfc = nullptr;
        return false;
    }

    Serial.printf("[NFC] PN532 found. Chip: 0x%02X, FW: %d.%d\n",
        (ver >> 24) & 0xFF, (ver >> 16) & 0xFF, (ver >> 8) & 0xFF);

    nfc->SAMConfig();
    enabled = true;
    return true;
}

void enable()  { enabled = true; }
void disable() { enabled = false; }

bool readTag(uint8_t uid[NFC_UID_MAX_LEN], uint8_t* uidLen, uint16_t timeoutMs) {
    if (!nfc || !enabled) return false;
    uint8_t len = 0;
    bool found = nfc->readPassiveTargetID(PN532_MIFARE_ISO14443A, uid, &len, timeoutMs);
    if (found) *uidLen = len;
    return found;
}

} // namespace NfcManager
