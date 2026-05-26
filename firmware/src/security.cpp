#include "security.h"
#include "mbedtls/md.h"

namespace Security {

void hashPassword(const String& password, uint8_t digest[SHA256_LEN]) {
    mbedtls_md_context_t ctx;
    mbedtls_md_init(&ctx);
    mbedtls_md_setup(&ctx, mbedtls_md_info_from_type(MBEDTLS_MD_SHA256), 0);
    mbedtls_md_starts(&ctx);
    mbedtls_md_update(&ctx, (const uint8_t*)password.c_str(), password.length());
    mbedtls_md_finish(&ctx, digest);
    mbedtls_md_free(&ctx);
}

bool verifyPassword(const String& input, const uint8_t storedHash[SHA256_LEN]) {
    uint8_t inputHash[SHA256_LEN];
    hashPassword(input, inputHash);
    return memcmp(inputHash, storedHash, SHA256_LEN) == 0;
}

String bytesToHex(const uint8_t* bytes, size_t len) {
    String result;
    result.reserve(len * 2);
    for (size_t i = 0; i < len; i++) {
        if (bytes[i] < 0x10) result += '0';
        result += String(bytes[i], HEX);
    }
    return result;
}

} // namespace Security
