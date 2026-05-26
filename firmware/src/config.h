#pragma once

// ─── BLE UUIDs ──────────────────────────────────────────────────────────────
#define SERVICE_UUID        "4FAFC201-1FB5-459E-8FCC-C5C9C331914B"
#define CMD_CHAR_UUID       "BEB5483E-36E1-4688-B7F5-EA07361B26A8"
#define STATUS_CHAR_UUID    "1C95D5E3-D8F4-4B6B-8E0C-2E89B6F9F1A8"

// ─── BLE Commands (app → device) ────────────────────────────────────────────
#define CMD_GET_STATUS      0x00  // デバイス状態照会
#define CMD_AUTH            0x01  // 認証 [0x01][password_utf8]
// 0x02: (reserved - formerly CMD_TOGGLE_LIGHT, ライトはNFC専用)
#define CMD_START_KEY_REG   0x03  // 鍵登録モード開始
#define CMD_DELETE_KEY      0x04  // 鍵削除 [0x04][uid_bytes]
#define CMD_LIST_KEYS       0x05  // 鍵一覧取得
#define CMD_END_SETTINGS    0x06  // 設定モード終了
#define CMD_SET_PASSWORD    0x07  // パスワード設定 [0x07][password_utf8]
#define CMD_SET_SECRET      0x08  // 秘密の質問設定 [0x08][q_len][question][a_len][answer]
#define CMD_GET_QUESTION    0x09  // 秘密の質問取得 (認証不要)
#define CMD_RESET_PW        0x0A  // パスワードリセット [0x0A][a_len][answer][pw_len][new_pw]

// ─── BLE Responses (device → app) ───────────────────────────────────────────
#define RESP_OK             0x00
#define RESP_ERROR          0x01
#define RESP_AUTH_REQUIRED  0x02
#define RESP_AUTH_SUCCESS   0x03
#define RESP_AUTH_FAILED    0x04
#define RESP_KEY_REGISTERED 0x05
#define RESP_KEY_DELETED    0x06
#define RESP_KEY_LIST       0x07  // [0x07][count][uid_len][uid_bytes][lbl_len][lbl]...
#define RESP_LIGHT_ON       0x08
#define RESP_LIGHT_OFF      0x09
#define RESP_QUESTION       0x0A  // [0x0A][q_len][question] q_len=0なら未設定
#define RESP_RESET_OK       0x0B  // パスワードリセット成功
#define RESP_RESET_FAIL     0x0C  // 秘密の質問の回答が不正解
#define RESP_STATUS         0x10  // [0x10][state][light] state:0=初回設定,1=通常 light:0=OFF,1=ON

// ─── Device State Values ────────────────────────────────────────────────────
#define DEVICE_STATE_SETUP  0x00
#define DEVICE_STATE_NORMAL 0x01

// ─── Storage ─────────────────────────────────────────────────────────────────
#define SECRET_QUESTION_MAX_LEN 64

// ─── GPIO Pins (ESP32-C3-DevKitM-1) ─────────────────────────────────────────
#define LIGHT_PIN           6   // MOSFETゲート → ライト制御
#define BUTTON_PIN          7   // 設定モード移行ボタン（GND側プルダウン）
#define NFC_SDA_PIN         8   // I2C SDA
#define NFC_SCL_PIN         9   // I2C SCL
#define NFC_IRQ_PIN         4   // PN532 IRQ
#define NFC_RESET_PIN       5   // PN532 RESET

// ─── Storage (NFC keys) ──────────────────────────────────────────────────────
#define MAX_NFC_KEYS        20
#define NFC_UID_MAX_LEN     7
#define SHA256_LEN          32

// ─── Timing ──────────────────────────────────────────────────────────────────
#define SETTINGS_TIMEOUT_MS 60000UL   // 設定モード自動終了: 60秒
#define BUTTON_DEBOUNCE_MS  50UL
#define NFC_POLL_TIMEOUT_MS 50        // NFCポーリング間隔

// ─── BLE ─────────────────────────────────────────────────────────────────────
#define DEVICE_NAME         "LighTouch"
#define BLE_CONN_NOTIFY_DELAY_MS 500  // 接続後ステータス通知までの待機
