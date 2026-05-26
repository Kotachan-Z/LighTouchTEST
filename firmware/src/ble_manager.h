#pragma once
#include <Arduino.h>
#include <functional>

namespace BleManager {
    using CmdCallback  = std::function<void(const uint8_t* data, size_t len)>;
    using ConnCallback = std::function<void(bool connected)>;

    void begin(const char* deviceName);
    void startAdvertising();
    void stopAdvertising();
    void disconnectAll();
    bool isConnected();

    void sendStatus(const uint8_t* data, size_t len);
    void sendStatusByte(uint8_t byte);

    void setCommandCallback(CmdCallback cb);
    void setConnectionCallback(ConnCallback cb);
}
