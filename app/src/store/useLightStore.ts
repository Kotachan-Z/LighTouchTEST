import { create } from 'zustand';
import { bleService } from '../ble/BleService';
import { BleProtocol } from '../ble/BleProtocol';
import type { BleConnectionState, DeviceStatus, DiscoveredDevice, NfcKeyInfo } from '../types';

interface LightStore {
  // ─── 状態 ─────────────────────────────────────────────────────────────────
  bleConnState: BleConnectionState;
  deviceStatus: DeviceStatus;
  discoveredDevices: DiscoveredDevice[];
  isAuthenticated: boolean;
  isLightOn: boolean;
  registeredKeys: NfcKeyInfo[];
  secretQuestion: string | null;   // デバイスから取得した秘密の質問テキスト

  // 単発イベント (toast など一時的なUI通知用)
  lastEvent: string | null;
  clearEvent: () => void;

  // ─── アクション ───────────────────────────────────────────────────────────
  initBle: () => Promise<void>;
  startScan: () => void;
  stopScan: () => void;
  connect: (device: DiscoveredDevice) => Promise<void>;
  disconnect: () => Promise<void>;

  setPassword: (password: string) => void;
  authenticate: (password: string) => void;
  // ライトはNFC制御のみ。アプリからの toggleLight は削除。
  startKeyRegistration: () => void;
  deleteKey: (uid: Uint8Array) => void;
  listKeys: () => void;
  endSettings: () => void;

  /** 秘密の質問と回答を設定（初回セットアップ Step2 & 変更） */
  setSecret: (question: string, answer: string) => void;
  /** デバイスから秘密の質問テキストを取得 */
  getQuestion: () => void;
  /** 秘密の質問の回答でパスワードをリセット */
  resetPassword: (answer: string, newPassword: string) => void;
}

export const useLightStore = create<LightStore>((set, get) => {

  // ─── BLEサービスのコールバックを設定 ─────────────────────────────────────
  bleService.onConnState = (connected) => {
    if (!connected) {
      set({
        bleConnState: 'disconnected',
        deviceStatus: 'unknown',
        isAuthenticated: false,
        discoveredDevices: [],
      });
    }
  };

  bleService.onStatus = (data) => {
    if (data.length === 0) return;

    switch (data[0]) {
      case BleProtocol.RESP_STATUS:
        set({
          deviceStatus: data[1] === BleProtocol.DEVICE_STATE_SETUP
            ? 'needs_setup'
            : 'ready',
          // byte[2]: 現在のライト状態 (0=OFF, 1=ON)
          isLightOn: data.length > 2 ? data[2] === 0x01 : false,
        });
        break;

      case BleProtocol.RESP_QUESTION:
        set({ secretQuestion: BleProtocol.parseQuestion(data) });
        break;

      case BleProtocol.RESP_RESET_OK:
        set({ lastEvent: 'reset_ok' });
        break;

      case BleProtocol.RESP_RESET_FAIL:
        set({ lastEvent: 'reset_fail' });
        break;

      case BleProtocol.RESP_OK:
        // パスワード設定 (Step1) または 秘密の質問設定 (Step2) の完了通知
        set({ lastEvent: 'cmd_ok' });
        break;

      case BleProtocol.RESP_AUTH_SUCCESS:
        set({ isAuthenticated: true, lastEvent: 'auth_success' });
        break;

      case BleProtocol.RESP_AUTH_FAILED:
        set({ lastEvent: 'auth_failed' });
        break;

      case BleProtocol.RESP_KEY_REGISTERED:
        set({ lastEvent: 'key_registered' });
        get().listKeys();
        break;

      case BleProtocol.RESP_KEY_DELETED:
        set({ lastEvent: 'key_deleted' });
        get().listKeys();
        break;

      case BleProtocol.RESP_LIGHT_ON:
        set({ isLightOn: true });
        break;

      case BleProtocol.RESP_LIGHT_OFF:
        set({ isLightOn: false });
        break;

      case BleProtocol.RESP_KEY_LIST: {
        const parsed = BleProtocol.parseKeyList(data);
        const keys: NfcKeyInfo[] = parsed.map(k => ({
          uid: k.uid,
          uidHex: Array.from(k.uid).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(''),
          label: k.label,
        }));
        set({ registeredKeys: keys });
        break;
      }

      case BleProtocol.RESP_ERROR:
        set({ lastEvent: 'error' });
        break;
    }
  };

  // ─── Store実装 ────────────────────────────────────────────────────────────
  return {
    bleConnState: 'disconnected',
    deviceStatus: 'unknown',
    discoveredDevices: [],
    isAuthenticated: false,
    isLightOn: false,
    registeredKeys: [],
    secretQuestion: null,
    lastEvent: null,

    clearEvent: () => set({ lastEvent: null }),

    initBle: async () => {
      const granted = await bleService.requestPermissions();
      if (!granted) { set({ bleConnState: 'off' }); return; }
      const on = await bleService.isBluetoothOn();
      if (!on) set({ bleConnState: 'off' });
    },

    startScan: () => {
      const seen = new Set<string>();
      set({ bleConnState: 'scanning', discoveredDevices: [] });
      bleService.startScan((device) => {
        if (seen.has(device.id)) return;
        seen.add(device.id);
        set(s => ({
          discoveredDevices: [
            ...s.discoveredDevices,
            { id: device.id, name: device.name ?? 'LighTouch' },
          ],
        }));
      });
    },

    stopScan: () => {
      bleService.stopScan();
      if (get().bleConnState === 'scanning') {
        set({ bleConnState: 'disconnected' });
      }
    },

    connect: async (device) => {
      get().stopScan();
      set({ bleConnState: 'connecting' });
      try {
        await bleService.connect(device.id);
        set({ bleConnState: 'connected' });
      } catch (e) {
        console.warn('[Store] connect error', e);
        set({ bleConnState: 'disconnected' });
      }
    },

    disconnect: async () => {
      await bleService.disconnect();
      set({
        bleConnState: 'disconnected',
        deviceStatus: 'unknown',
        isAuthenticated: false,
      });
    },

    setPassword:          (pw)  => bleService.send(BleProtocol.setPassword(pw)),
    authenticate:         (pw)  => bleService.send(BleProtocol.auth(pw)),
    startKeyRegistration: ()    => bleService.send(BleProtocol.startKeyReg()),
    deleteKey:            (uid) => bleService.send(BleProtocol.deleteKey(uid)),
    listKeys:             ()    => bleService.send(BleProtocol.listKeys()),
    endSettings:          ()    => {
      bleService.send(BleProtocol.endSettings());
      set({ isAuthenticated: false });
    },
    setSecret:   (q, a)     => bleService.send(BleProtocol.setSecret(q, a)),
    getQuestion: ()          => bleService.send(BleProtocol.getQuestion()),
    resetPassword: (a, pw)  => bleService.send(BleProtocol.resetPassword(a, pw)),
  };
});
