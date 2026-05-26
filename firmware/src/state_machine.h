#pragma once
#include <Arduino.h>

enum class State : uint8_t {
    INITIAL_SETUP    = 0,  // 状態A: 初回セットアップ (BLE有効, NFC無効)
    NORMAL_STANDBY   = 1,  // 状態B: 通常待機       (BLE無効, NFC有効)
    KEY_REGISTRATION = 2,  // 状態C: 鍵登録         (NFC有効, BLE状態維持)
    SETTINGS_MODE    = 3,  // 状態D: 設定モード      (BLE有効, NFC無効)
};

namespace StateMachine {
    void begin();
    void update();          // メインループから毎回呼ぶ
    State getState();
    void transitionTo(State next);
}
