#include "state_machine.h"
#include "config.h"
#include "ble_manager.h"
#include "nfc_manager.h"
#include "storage_manager.h"
#include "light_controller.h"
#include "security.h"

// ─── スレッド間共有フラグ (volatile: BLEタスクから書き込まれる) ──────────────
static volatile bool     g_newConn     = false;
static volatile bool     g_disconn     = false;
static volatile bool     g_cmdReady    = false;
static volatile uint8_t  g_cmdBuf[256];
static volatile size_t   g_cmdLen      = 0;

// ─── モジュール内状態 ─────────────────────────────────────────────────────────
static State    currentState   = State::INITIAL_SETUP;
static bool     authenticated  = false;
static uint32_t settingsStart  = 0;

// ─── ヘルパー ─────────────────────────────────────────────────────────────────
static void sendDeviceStatus() {
    // [RESP_STATUS][device_state][light_on]
    uint8_t resp[3] = {
        RESP_STATUS,
        (currentState == State::INITIAL_SETUP) ? DEVICE_STATE_SETUP : DEVICE_STATE_NORMAL,
        LightController::isOn() ? 0x01 : 0x00,
    };
    BleManager::sendStatus(resp, sizeof(resp));
}

// ─── BLEコマンド処理 (メインループから呼ぶ) ───────────────────────────────────
static void processCommand(const uint8_t* data, size_t len) {
    if (len == 0) return;
    uint8_t cmd = data[0];

    // ── 状態に関わらず常に応答するコマンド ────────────────────────────────────
    if (cmd == CMD_GET_STATUS) { sendDeviceStatus(); return; }

    if (cmd == CMD_GET_QUESTION) {
        // 秘密の質問を返す (認証不要・未設定ならq_len=0)
        char q[SECRET_QUESTION_MAX_LEN + 1] = {};
        bool hasQ = StorageManager::loadSecretQuestion(q, sizeof(q));
        uint8_t qLen = hasQ ? (uint8_t)strlen(q) : 0;
        uint8_t resp[2 + SECRET_QUESTION_MAX_LEN];
        resp[0] = RESP_QUESTION;
        resp[1] = qLen;
        if (qLen) memcpy(resp + 2, q, qLen);
        BleManager::sendStatus(resp, 2 + qLen);
        return;
    }

    if (cmd == CMD_RESET_PW && currentState == State::SETTINGS_MODE && !authenticated) {
        // パスワードリセット: [0x0A][a_len][answer][pw_len][new_pw]
        if (len < 4) { BleManager::sendStatusByte(RESP_ERROR); return; }
        size_t idx = 1;
        uint8_t aLen = data[idx++];
        if (idx + aLen + 1 > len) { BleManager::sendStatusByte(RESP_ERROR); return; }
        String answer((const char*)(data + idx), aLen); idx += aLen;
        uint8_t pwLen = data[idx++];
        if (idx + pwLen > len) { BleManager::sendStatusByte(RESP_ERROR); return; }
        String newPw((const char*)(data + idx), pwLen);

        uint8_t storedAns[SHA256_LEN];
        if (!StorageManager::loadSecretAnswerHash(storedAns) ||
            !Security::verifyPassword(answer, storedAns)) {
            BleManager::sendStatusByte(RESP_RESET_FAIL);
            Serial.println("[SM] Password reset: wrong answer");
            return;
        }
        uint8_t newHash[SHA256_LEN];
        Security::hashPassword(newPw, newHash);
        StorageManager::savePasswordHash(newHash);
        BleManager::sendStatusByte(RESP_RESET_OK);
        Serial.println("[SM] Password reset OK");
        return;
    }

    // ── 初回セットアップ ───────────────────────────────────────────────────────
    if (currentState == State::INITIAL_SETUP) {
        if (cmd == CMD_SET_PASSWORD && len > 1) {
            // Step 1: パスワード保存 → まだ setup_complete にしない
            String pw((const char*)(data + 1), len - 1);
            uint8_t hash[SHA256_LEN];
            Security::hashPassword(pw, hash);
            StorageManager::savePasswordHash(hash);
            BleManager::sendStatusByte(RESP_OK);
            Serial.println("[SM] Setup step1: password saved");
        } else if (cmd == CMD_SET_SECRET && len >= 3) {
            // Step 2: 秘密の質問 → セットアップ完了
            size_t idx = 1;
            uint8_t qLen = data[idx++];
            if (idx + qLen + 1 > len) { BleManager::sendStatusByte(RESP_ERROR); return; }
            char q[SECRET_QUESTION_MAX_LEN + 1] = {};
            memcpy(q, data + idx, min((size_t)qLen, (size_t)SECRET_QUESTION_MAX_LEN));
            idx += qLen;
            uint8_t aLen = data[idx++];
            if (idx + aLen > len) { BleManager::sendStatusByte(RESP_ERROR); return; }
            String answer((const char*)(data + idx), aLen);

            StorageManager::saveSecretQuestion(q);
            uint8_t ansHash[SHA256_LEN];
            Security::hashPassword(answer, ansHash);
            StorageManager::saveSecretAnswerHash(ansHash);
            StorageManager::markSetupComplete();
            BleManager::sendStatusByte(RESP_OK);
            Serial.println("[SM] Setup step2: secret saved. -> KEY_REGISTRATION");
            StateMachine::transitionTo(State::KEY_REGISTRATION);
        }
        return;
    }

    // ── 設定モード ────────────────────────────────────────────────────────────
    if (currentState == State::SETTINGS_MODE) {
        if (cmd == CMD_AUTH && len > 1) {
            String pw((const char*)(data + 1), len - 1);
            uint8_t stored[SHA256_LEN];
            if (StorageManager::loadPasswordHash(stored) &&
                Security::verifyPassword(pw, stored)) {
                authenticated = true;
                BleManager::sendStatusByte(RESP_AUTH_SUCCESS);
                Serial.println("[SM] Auth success");
            } else {
                BleManager::sendStatusByte(RESP_AUTH_FAILED);
                Serial.println("[SM] Auth failed");
            }
            return;
        }

        if (!authenticated) {
            BleManager::sendStatusByte(RESP_AUTH_REQUIRED);
            return;
        }

        switch (cmd) {
            case CMD_START_KEY_REG:
                StateMachine::transitionTo(State::KEY_REGISTRATION);
                break;

            case CMD_DELETE_KEY:
                if (len > 1) {
                    bool ok = StorageManager::deleteNfcKey(data + 1, len - 1);
                    BleManager::sendStatusByte(ok ? RESP_KEY_DELETED : RESP_ERROR);
                }
                break;

            case CMD_LIST_KEYS: {
                NfcKey keys[MAX_NFC_KEYS];
                int count = StorageManager::loadAllKeys(keys, MAX_NFC_KEYS);
                uint8_t resp[2 + MAX_NFC_KEYS * (1 + NFC_UID_MAX_LEN + 1 + 15)];
                int idx = 0;
                resp[idx++] = RESP_KEY_LIST;
                resp[idx++] = (uint8_t)count;
                for (int i = 0; i < count; i++) {
                    resp[idx++] = keys[i].uidLen;
                    memcpy(resp + idx, keys[i].uid, keys[i].uidLen);
                    idx += keys[i].uidLen;
                    uint8_t lblLen = (uint8_t)strlen(keys[i].label);
                    resp[idx++] = lblLen;
                    memcpy(resp + idx, keys[i].label, lblLen);
                    idx += lblLen;
                }
                BleManager::sendStatus(resp, idx);
                break;
            }

            case CMD_SET_SECRET: {
                // 認証済みで秘密の質問を変更
                if (len < 3) { BleManager::sendStatusByte(RESP_ERROR); break; }
                size_t idx = 1;
                uint8_t qLen = data[idx++];
                if (idx + qLen + 1 > len) { BleManager::sendStatusByte(RESP_ERROR); break; }
                char q[SECRET_QUESTION_MAX_LEN + 1] = {};
                memcpy(q, data + idx, min((size_t)qLen, (size_t)SECRET_QUESTION_MAX_LEN));
                idx += qLen;
                uint8_t aLen = data[idx++];
                if (idx + aLen > len) { BleManager::sendStatusByte(RESP_ERROR); break; }
                String answer((const char*)(data + idx), aLen);
                StorageManager::saveSecretQuestion(q);
                uint8_t ansHash[SHA256_LEN];
                Security::hashPassword(answer, ansHash);
                StorageManager::saveSecretAnswerHash(ansHash);
                BleManager::sendStatusByte(RESP_OK);
                Serial.println("[SM] Secret question updated");
                break;
            }

            case CMD_END_SETTINGS:
                StateMachine::transitionTo(State::NORMAL_STANDBY);
                break;
        }
    }
}

// ─── StateMachine 実装 ───────────────────────────────────────────────────────
namespace StateMachine {

void begin() {
    StorageManager::begin();
    LightController::begin(LIGHT_PIN);

    if (!NfcManager::begin(NFC_SDA_PIN, NFC_SCL_PIN, NFC_IRQ_PIN, NFC_RESET_PIN)) {
        Serial.println("[SM] WARNING: NFC init failed");
    }

    pinMode(BUTTON_PIN, INPUT_PULLUP);

    // BLEは起動時に一度だけ初期化
    BleManager::begin(DEVICE_NAME);

    BleManager::setCommandCallback([](const uint8_t* data, size_t len) {
        // BLEタスクコンテキスト: バッファにコピーしてフラグを立てる
        if (len > sizeof(g_cmdBuf)) len = sizeof(g_cmdBuf);
        memcpy((void*)g_cmdBuf, data, len);
        g_cmdLen   = len;
        g_cmdReady = true;
    });

    BleManager::setConnectionCallback([](bool connected) {
        if (connected) g_newConn  = true;
        else           g_disconn  = true;
    });

    if (StorageManager::isFirstBoot()) {
        transitionTo(State::INITIAL_SETUP);
    } else {
        transitionTo(State::NORMAL_STANDBY);
    }
}

void transitionTo(State next) {
    Serial.printf("[SM] %d -> %d\n", (int)currentState, (int)next);

    // Exit処理
    switch (currentState) {
        case State::INITIAL_SETUP:
        case State::SETTINGS_MODE:
            // BLEアドバタイズ停止は入先で判断
            break;
        default: break;
    }

    currentState  = next;
    authenticated = false;

    // Enter処理
    switch (next) {
        case State::INITIAL_SETUP:
            NfcManager::disable();
            BleManager::startAdvertising();
            break;

        case State::NORMAL_STANDBY:
            BleManager::stopAdvertising();
            BleManager::disconnectAll();
            NfcManager::enable();
            break;

        case State::KEY_REGISTRATION:
            // BLE状態は維持 (接続中なら接続継続)
            NfcManager::enable();
            break;

        case State::SETTINGS_MODE:
            NfcManager::disable();
            BleManager::startAdvertising();
            settingsStart = millis();
            break;
    }
}

void update() {
    // ── BLE接続イベント処理 ────────────────────────────────────────────────
    if (g_newConn) {
        g_newConn = false;
        // 接続直後: 通知チャンネルが確立するまで少し待つ
        delay(BLE_CONN_NOTIFY_DELAY_MS);
        sendDeviceStatus();
    }
    if (g_disconn) {
        g_disconn = false;
        // 設定モード中に切断 → 待機に戻る
        if (currentState == State::SETTINGS_MODE) {
            transitionTo(State::NORMAL_STANDBY);
        }
    }

    // ── BLEコマンド処理 ────────────────────────────────────────────────────
    if (g_cmdReady) {
        g_cmdReady = false;
        // ローカルバッファにコピー (割り込み安全)
        size_t len = g_cmdLen;
        uint8_t buf[256];
        memcpy(buf, (const void*)g_cmdBuf, len);
        processCommand(buf, len);
    }

    // ── 状態別処理 ─────────────────────────────────────────────────────────
    switch (currentState) {

        case State::INITIAL_SETUP:
            // BLEコマンド待機のみ (上記で処理済み)
            break;

        case State::NORMAL_STANDBY: {
            // ボタン押下 → 設定モードへ
            static bool lastBtn = HIGH;
            static uint32_t lastBtnTime = 0;
            bool btn = digitalRead(BUTTON_PIN) == LOW;
            if (btn && !lastBtn && (millis() - lastBtnTime > BUTTON_DEBOUNCE_MS)) {
                lastBtnTime = millis();
                Serial.println("[SM] Button pressed -> SETTINGS_MODE");
                transitionTo(State::SETTINGS_MODE);
            }
            lastBtn = btn;

            // NFCタグ認証 → ライトON/OFF
            uint8_t uid[NFC_UID_MAX_LEN];
            uint8_t uidLen = 0;
            if (NfcManager::readTag(uid, &uidLen)) {
                if (StorageManager::isKeyRegistered(uid, uidLen)) {
                    LightController::toggle();
                    Serial.printf("[SM] NFC auth OK. Light=%s\n",
                        LightController::isOn() ? "ON" : "OFF");
                } else {
                    Serial.println("[SM] NFC auth FAILED (unknown UID)");
                }
            }
            break;
        }

        case State::KEY_REGISTRATION: {
            uint8_t uid[NFC_UID_MAX_LEN];
            uint8_t uidLen = 0;
            if (NfcManager::readTag(uid, &uidLen, 200)) {
                if (StorageManager::saveNfcKey(uid, uidLen)) {
                    Serial.printf("[SM] Key registered: %s\n",
                        Security::bytesToHex(uid, uidLen).c_str());
                    BleManager::sendStatusByte(RESP_KEY_REGISTERED);
                } else {
                    Serial.println("[SM] Key already registered or storage full");
                    BleManager::sendStatusByte(RESP_ERROR);
                }
                transitionTo(State::NORMAL_STANDBY);
            }
            break;
        }

        case State::SETTINGS_MODE: {
            // タイムアウト (BLE未接続時のみ)
            if (!BleManager::isConnected() &&
                (millis() - settingsStart > SETTINGS_TIMEOUT_MS)) {
                Serial.println("[SM] Settings timeout -> NORMAL_STANDBY");
                transitionTo(State::NORMAL_STANDBY);
            }
            break;
        }
    }
}

State getState() { return currentState; }

} // namespace StateMachine
