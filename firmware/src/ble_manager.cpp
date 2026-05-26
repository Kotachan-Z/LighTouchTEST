#include "ble_manager.h"
#include "config.h"
#include <NimBLEDevice.h>

static NimBLEServer*         pServer     = nullptr;
static NimBLECharacteristic* pStatusChar = nullptr;
static NimBLECharacteristic* pCmdChar    = nullptr;

static BleManager::CmdCallback  cmdCallback;
static BleManager::ConnCallback connCallback;

// ─── Server callbacks ────────────────────────────────────────────────────────
class ServerCB : public NimBLEServerCallbacks {
    void onConnect(NimBLEServer*) override {
        Serial.println("[BLE] Client connected");
        if (connCallback) connCallback(true);
    }
    void onDisconnect(NimBLEServer* s) override {
        Serial.println("[BLE] Client disconnected");
        if (connCallback) connCallback(false);
        // 再アドバタイズはステートマシンが制御するため、ここでは行わない
    }
};

// ─── Command characteristic callbacks ───────────────────────────────────────
class CmdCharCB : public NimBLECharacteristicCallbacks {
    void onWrite(NimBLECharacteristic* c) override {
        NimBLEAttValue val = c->getValue();
        if (cmdCallback && val.length() > 0) {
            // NOTE: この関数は BLE タスクコンテキストで呼ばれる。
            //       プロダクション実装では FreeRTOS キューを使うこと。
            cmdCallback(val.data(), val.length());
        }
    }
};

namespace BleManager {

void begin(const char* deviceName) {
    NimBLEDevice::init(deviceName);
    NimBLEDevice::setPower(ESP_PWR_LVL_P9);

    pServer = NimBLEDevice::createServer();
    pServer->setCallbacks(new ServerCB());

    NimBLEService* svc = pServer->createService(SERVICE_UUID);

    pStatusChar = svc->createCharacteristic(STATUS_CHAR_UUID, NIMBLE_PROPERTY::NOTIFY);
    pCmdChar    = svc->createCharacteristic(CMD_CHAR_UUID,
                      NIMBLE_PROPERTY::WRITE | NIMBLE_PROPERTY::WRITE_NR);
    pCmdChar->setCallbacks(new CmdCharCB());

    svc->start();
    Serial.println("[BLE] GATT server started");
}

void startAdvertising() {
    NimBLEAdvertising* adv = NimBLEDevice::getAdvertising();
    adv->addServiceUUID(SERVICE_UUID);
    adv->setMinInterval(160);  // 100ms
    adv->setMaxInterval(320);  // 200ms
    adv->start();
    Serial.println("[BLE] Advertising started");
}

void stopAdvertising() {
    NimBLEDevice::getAdvertising()->stop();
    Serial.println("[BLE] Advertising stopped");
}

void disconnectAll() {
    if (!pServer) return;
    for (int i = 0; i < pServer->getConnectedCount(); i++) {
        pServer->disconnect(pServer->getPeerInfo(i).getConnHandle());
    }
}

bool isConnected() {
    return pServer && pServer->getConnectedCount() > 0;
}

void sendStatus(const uint8_t* data, size_t len) {
    if (pStatusChar && isConnected()) {
        pStatusChar->setValue(data, len);
        pStatusChar->notify();
    }
}

void sendStatusByte(uint8_t byte) {
    sendStatus(&byte, 1);
}

void setCommandCallback(CmdCallback cb)  { cmdCallback  = cb; }
void setConnectionCallback(ConnCallback cb) { connCallback = cb; }

} // namespace BleManager
