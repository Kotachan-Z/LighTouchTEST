#include "storage_manager.h"
#include <Preferences.h>

// NVS namespace: "lt" (lighttouch, 15文字制限のため略)
static Preferences prefs;

static void uidKey(char* buf, size_t sz, const char* prefix, int idx) {
    snprintf(buf, sz, "%s%d", prefix, idx);
}

namespace StorageManager {

void begin() {
    prefs.begin("lt", false);
}

bool isFirstBoot() {
    return !prefs.getBool("rdy", false);
}

void markSetupComplete() {
    prefs.putBool("rdy", true);
}

void savePasswordHash(const uint8_t hash[SHA256_LEN]) {
    prefs.putBytes("pwh", hash, SHA256_LEN);
}

bool loadPasswordHash(uint8_t hash[SHA256_LEN]) {
    return prefs.getBytes("pwh", hash, SHA256_LEN) == SHA256_LEN;
}

// ─── 秘密の質問 ───────────────────────────────────────────────────────────────
bool saveSecretQuestion(const char* question) {
    return prefs.putString("sq", question) > 0;
}

bool saveSecretAnswerHash(const uint8_t hash[SHA256_LEN]) {
    return prefs.putBytes("sah", hash, SHA256_LEN) == SHA256_LEN;
}

bool loadSecretQuestion(char* buf, size_t bufLen) {
    String q = prefs.getString("sq", "");
    if (q.isEmpty()) return false;
    strncpy(buf, q.c_str(), bufLen - 1);
    buf[bufLen - 1] = '\0';
    return true;
}

bool loadSecretAnswerHash(uint8_t hash[SHA256_LEN]) {
    return prefs.getBytes("sah", hash, SHA256_LEN) == SHA256_LEN;
}

bool hasSecretQuestion() {
    return prefs.isKey("sq") && prefs.getString("sq", "").length() > 0;
}

bool saveNfcKey(const uint8_t* uid, uint8_t uidLen, const char* label) {
    int count = prefs.getInt("kc", 0);
    if (count >= MAX_NFC_KEYS) return false;

    // 重複チェック
    for (int i = 0; i < count; i++) {
        char kb[8], bb[8];
        uidKey(kb, sizeof(kb), "kl", i);
        uidKey(bb, sizeof(bb), "kb", i);
        if (prefs.getUChar(kb, 0) != uidLen) continue;
        uint8_t buf[NFC_UID_MAX_LEN];
        prefs.getBytes(bb, buf, NFC_UID_MAX_LEN);
        if (memcmp(buf, uid, uidLen) == 0) return false;
    }

    char kb[8], bb[8], lb[8];
    uidKey(kb, sizeof(kb), "kl", count);
    uidKey(bb, sizeof(bb), "kb", count);
    uidKey(lb, sizeof(lb), "kn", count);

    prefs.putUChar(kb, uidLen);
    prefs.putBytes(bb, uid, uidLen);
    if (label && *label) prefs.putString(lb, label);
    prefs.putInt("kc", count + 1);
    return true;
}

bool deleteNfcKey(const uint8_t* uid, uint8_t uidLen) {
    int count = prefs.getInt("kc", 0);
    int found = -1;

    for (int i = 0; i < count; i++) {
        char kb[8], bb[8];
        uidKey(kb, sizeof(kb), "kl", i);
        uidKey(bb, sizeof(bb), "kb", i);
        if (prefs.getUChar(kb, 0) != uidLen) continue;
        uint8_t buf[NFC_UID_MAX_LEN];
        prefs.getBytes(bb, buf, NFC_UID_MAX_LEN);
        if (memcmp(buf, uid, uidLen) == 0) { found = i; break; }
    }

    if (found == -1) return false;

    // 後続エントリを詰める
    for (int i = found; i < count - 1; i++) {
        char skb[8], sbb[8], slb[8], dkb[8], dbb[8], dlb[8];
        uidKey(skb, sizeof(skb), "kl", i+1);
        uidKey(sbb, sizeof(sbb), "kb", i+1);
        uidKey(slb, sizeof(slb), "kn", i+1);
        uidKey(dkb, sizeof(dkb), "kl", i);
        uidKey(dbb, sizeof(dbb), "kb", i);
        uidKey(dlb, sizeof(dlb), "kn", i);

        prefs.putUChar(dkb, prefs.getUChar(skb, 0));
        uint8_t buf[NFC_UID_MAX_LEN];
        prefs.getBytes(sbb, buf, NFC_UID_MAX_LEN);
        prefs.putBytes(dbb, buf, NFC_UID_MAX_LEN);
        prefs.putString(dlb, prefs.getString(slb, ""));
    }

    char kb[8], bb[8], lb[8];
    uidKey(kb, sizeof(kb), "kl", count-1);
    uidKey(bb, sizeof(bb), "kb", count-1);
    uidKey(lb, sizeof(lb), "kn", count-1);
    prefs.remove(kb);
    prefs.remove(bb);
    prefs.remove(lb);
    prefs.putInt("kc", count - 1);
    return true;
}

bool isKeyRegistered(const uint8_t* uid, uint8_t uidLen) {
    int count = prefs.getInt("kc", 0);
    for (int i = 0; i < count; i++) {
        char kb[8], bb[8];
        uidKey(kb, sizeof(kb), "kl", i);
        uidKey(bb, sizeof(bb), "kb", i);
        if (prefs.getUChar(kb, 0) != uidLen) continue;
        uint8_t buf[NFC_UID_MAX_LEN];
        prefs.getBytes(bb, buf, NFC_UID_MAX_LEN);
        if (memcmp(buf, uid, uidLen) == 0) return true;
    }
    return false;
}

int loadAllKeys(NfcKey* keys, int maxCount) {
    int count = prefs.getInt("kc", 0);
    int loaded = min(count, maxCount);
    for (int i = 0; i < loaded; i++) {
        char kb[8], bb[8], lb[8];
        uidKey(kb, sizeof(kb), "kl", i);
        uidKey(bb, sizeof(bb), "kb", i);
        uidKey(lb, sizeof(lb), "kn", i);
        keys[i].uidLen = prefs.getUChar(kb, 0);
        prefs.getBytes(bb, keys[i].uid, NFC_UID_MAX_LEN);
        String lbl = prefs.getString(lb, "");
        strncpy(keys[i].label, lbl.c_str(), sizeof(keys[i].label) - 1);
        keys[i].label[sizeof(keys[i].label) - 1] = '\0';
    }
    return loaded;
}

} // namespace StorageManager
