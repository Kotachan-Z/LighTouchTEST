/** ファームウェアの config.h と値を一致させること */
export const BleProtocol = {
  // UUIDはreact-native-ble-plxが小文字で返すため小文字で定義
  SERVICE_UUID:     '4fafc201-1fb5-459e-8fcc-c5c9c331914b',
  CMD_CHAR_UUID:    'beb5483e-36e1-4688-b7f5-ea07361b26a8',
  STATUS_CHAR_UUID: '1c95d5e3-d8f4-4b6b-8e0c-2e89b6f9f1a8',

  // Commands
  CMD_GET_STATUS:    0x00,
  CMD_AUTH:          0x01,
  // 0x02: reserved (ライトはNFC専用のためアプリからは送らない)
  CMD_START_KEY_REG: 0x03,
  CMD_DELETE_KEY:    0x04,
  CMD_LIST_KEYS:     0x05,
  CMD_END_SETTINGS:  0x06,
  CMD_SET_PASSWORD:  0x07,
  CMD_SET_SECRET:    0x08,  // 秘密の質問設定
  CMD_GET_QUESTION:  0x09,  // 秘密の質問取得 (認証不要)
  CMD_RESET_PW:      0x0A,  // パスワードリセット

  // Responses
  RESP_OK:             0x00,
  RESP_ERROR:          0x01,
  RESP_AUTH_REQUIRED:  0x02,
  RESP_AUTH_SUCCESS:   0x03,
  RESP_AUTH_FAILED:    0x04,
  RESP_KEY_REGISTERED: 0x05,
  RESP_KEY_DELETED:    0x06,
  RESP_KEY_LIST:       0x07,
  RESP_LIGHT_ON:       0x08,
  RESP_LIGHT_OFF:      0x09,
  RESP_QUESTION:       0x0A,  // 秘密の質問テキスト
  RESP_RESET_OK:       0x0B,  // パスワードリセット成功
  RESP_RESET_FAIL:     0x0C,  // 秘密の質問の回答が不正解
  RESP_STATUS:         0x10,

  // RESP_STATUS の2バイト目
  DEVICE_STATE_SETUP:  0x00,
  DEVICE_STATE_NORMAL: 0x01,

  // ─── エンコード・デコード ────────────────────────────────────────────────────
  encode(bytes: Uint8Array): string {
    let binary = '';
    bytes.forEach(b => (binary += String.fromCharCode(b)));
    return btoa(binary);
  },

  decode(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  },

  strToBytes(str: string): Uint8Array {
    // ASCII/UTF-8 (パスワードは英数字前提)
    const bytes = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) bytes[i] = str.charCodeAt(i);
    return bytes;
  },

  // ─── コマンドビルダー (base64文字列を返す) ────────────────────────────────
  getStatus()    { return this.encode(new Uint8Array([this.CMD_GET_STATUS])); },
  startKeyReg()  { return this.encode(new Uint8Array([this.CMD_START_KEY_REG])); },
  listKeys()     { return this.encode(new Uint8Array([this.CMD_LIST_KEYS])); },
  endSettings()  { return this.encode(new Uint8Array([this.CMD_END_SETTINGS])); },
  getQuestion()  { return this.encode(new Uint8Array([this.CMD_GET_QUESTION])); },

  setPassword(password: string) {
    const pw = this.strToBytes(password);
    const data = new Uint8Array(1 + pw.length);
    data[0] = this.CMD_SET_PASSWORD;
    data.set(pw, 1);
    return this.encode(data);
  },

  auth(password: string) {
    const pw = this.strToBytes(password);
    const data = new Uint8Array(1 + pw.length);
    data[0] = this.CMD_AUTH;
    data.set(pw, 1);
    return this.encode(data);
  },

  deleteKey(uid: Uint8Array) {
    const data = new Uint8Array(1 + uid.length);
    data[0] = this.CMD_DELETE_KEY;
    data.set(uid, 1);
    return this.encode(data);
  },

  /** 秘密の質問と回答を設定 (初回セットアップ Step2 & 変更) */
  setSecret(question: string, answer: string) {
    const q = this.strToBytes(question);
    const a = this.strToBytes(answer);
    const data = new Uint8Array(1 + 1 + q.length + 1 + a.length);
    let idx = 0;
    data[idx++] = this.CMD_SET_SECRET;
    data[idx++] = q.length;
    data.set(q, idx); idx += q.length;
    data[idx++] = a.length;
    data.set(a, idx);
    return this.encode(data);
  },

  /** パスワードリセット: 秘密の質問の回答 + 新パスワード */
  resetPassword(answer: string, newPassword: string) {
    const a  = this.strToBytes(answer);
    const pw = this.strToBytes(newPassword);
    const data = new Uint8Array(1 + 1 + a.length + 1 + pw.length);
    let idx = 0;
    data[idx++] = this.CMD_RESET_PW;
    data[idx++] = a.length;
    data.set(a, idx); idx += a.length;
    data[idx++] = pw.length;
    data.set(pw, idx);
    return this.encode(data);
  },

  /** RESP_QUESTION レスポンスから質問テキストを取り出す */
  parseQuestion(data: Uint8Array): string {
    if (data.length < 2) return '';
    const qLen = data[1];
    if (qLen === 0 || data.length < 2 + qLen) return '';
    return String.fromCharCode(...data.slice(2, 2 + qLen));
  },

  // ─── キー一覧レスポンスのパース ───────────────────────────────────────────
  parseKeyList(data: Uint8Array) {
    if (data.length < 2) return [];
    const count = data[1];
    const keys: Array<{ uid: Uint8Array; label: string }> = [];
    let i = 2;
    for (let k = 0; k < count; k++) {
      if (i >= data.length) break;
      const uidLen = data[i++];
      if (i + uidLen > data.length) break;
      const uid = data.slice(i, i + uidLen); i += uidLen;
      const lblLen = i < data.length ? data[i++] : 0;
      const labelBytes = data.slice(i, i + lblLen); i += lblLen;
      const label = String.fromCharCode(...labelBytes);
      keys.push({ uid, label });
    }
    return keys;
  },
} as const;
