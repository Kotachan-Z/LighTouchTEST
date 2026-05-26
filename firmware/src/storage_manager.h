#pragma once
#include <Arduino.h>
#include "config.h"

struct NfcKey {
    uint8_t uid[NFC_UID_MAX_LEN];
    uint8_t uidLen;
    char    label[16];
};

namespace StorageManager {
    void begin();
    bool isFirstBoot();
    void markSetupComplete();

    // パスワード
    void savePasswordHash(const uint8_t hash[SHA256_LEN]);
    bool loadPasswordHash(uint8_t hash[SHA256_LEN]);

    // 秘密の質問 / 回答ハッシュ
    bool saveSecretQuestion(const char* question);
    bool saveSecretAnswerHash(const uint8_t hash[SHA256_LEN]);
    bool loadSecretQuestion(char* buf, size_t bufLen);
    bool loadSecretAnswerHash(uint8_t hash[SHA256_LEN]);
    bool hasSecretQuestion();

    // NFC 鍵 — 戻り値: true=成功, false=重複またはMAX超過
    bool saveNfcKey(const uint8_t* uid, uint8_t uidLen, const char* label = "");
    bool deleteNfcKey(const uint8_t* uid, uint8_t uidLen);
    bool isKeyRegistered(const uint8_t* uid, uint8_t uidLen);
    int  loadAllKeys(NfcKey* keys, int maxCount);
}
