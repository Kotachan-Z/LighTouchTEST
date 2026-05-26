import type { NativeStackScreenProps } from '@react-navigation/native-stack';

// ─── Navigation ───────────────────────────────────────────────────────────────
export type RootStackParamList = {
  Connect:        undefined;
  Setup:          undefined;
  Home:           undefined;
  KeyManagement:  { fromSetup?: boolean };
  ForgotPassword: undefined;
};

export type ScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

// ─── BLE / Store ─────────────────────────────────────────────────────────────
export type BleConnectionState =
  | 'off'           // Bluetoothが無効
  | 'disconnected'
  | 'scanning'
  | 'connecting'
  | 'connected';

export type DeviceStatus =
  | 'unknown'       // 未取得
  | 'needs_setup'   // State A: 初回セットアップ必要
  | 'ready';        // State D: 通常操作可能

export interface DiscoveredDevice {
  id: string;       // react-native-ble-plx の deviceId
  name: string;
}

export interface NfcKeyInfo {
  uid: Uint8Array;
  uidHex: string;   // 表示用
  label: string;
}
