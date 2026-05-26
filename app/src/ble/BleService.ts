import { BleManager, Device, Subscription, State } from 'react-native-ble-plx';
import { PermissionsAndroid, Platform } from 'react-native';
import { BleProtocol } from './BleProtocol';

type StatusCallback = (data: Uint8Array) => void;
type ConnStateCallback = (connected: boolean) => void;

/**
 * react-native-ble-plx をラップするシングルトン。
 * ストアから呼ばれ、レスポンスはコールバックで返す。
 */
class BleService {
  private manager = new BleManager();
  private device: Device | null = null;
  private notifySub: Subscription | null = null;

  onStatus?: StatusCallback;
  onConnState?: ConnStateCallback;

  // ─── 権限リクエスト (Android) ────────────────────────────────────────────
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;

    if (Platform.Version >= 31) {
      const results = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      ]);
      return (
        results[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === 'granted' &&
        results[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === 'granted'
      );
    } else {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      return result === 'granted';
    }
  }

  // ─── Bluetooth 有効チェック ───────────────────────────────────────────────
  async isBluetoothOn(): Promise<boolean> {
    const state = await this.manager.state();
    return state === State.PoweredOn;
  }

  // ─── スキャン ─────────────────────────────────────────────────────────────
  startScan(onFound: (device: Device) => void) {
    this.manager.startDeviceScan(
      [BleProtocol.SERVICE_UUID],
      { allowDuplicates: false },
      (err, device) => {
        if (err) { console.warn('[BLE] scan error', err); return; }
        if (device?.name?.startsWith('LighTouch')) onFound(device);
      },
    );
  }

  stopScan() {
    this.manager.stopDeviceScan();
  }

  // ─── 接続 ─────────────────────────────────────────────────────────────────
  async connect(deviceId: string): Promise<void> {
    this.stopScan();
    const dev = await this.manager.connectToDevice(deviceId);
    await dev.discoverAllServicesAndCharacteristics();
    this.device = dev;

    // 切断監視
    dev.onDisconnected(() => {
      this.notifySub?.remove();
      this.notifySub = null;
      this.device = null;
      this.onConnState?.(false);
    });

    // Status通知購読
    this.notifySub = dev.monitorCharacteristicForService(
      BleProtocol.SERVICE_UUID,
      BleProtocol.STATUS_CHAR_UUID,
      (err, char) => {
        if (err || !char?.value) return;
        this.onStatus?.(BleProtocol.decode(char.value));
      },
    );

    this.onConnState?.(true);

    // 接続直後にデバイス状態を問い合わせ
    // 通知購読が確立するまで少し待つ
    await delay(600);
    await this.send(BleProtocol.getStatus());
  }

  // ─── 切断 ─────────────────────────────────────────────────────────────────
  async disconnect() {
    this.notifySub?.remove();
    this.notifySub = null;
    if (this.device) {
      await this.device.cancelConnection();
      this.device = null;
    }
  }

  // ─── コマンド送信 ─────────────────────────────────────────────────────────
  async send(base64Data: string): Promise<void> {
    if (!this.device) return;
    await this.device.writeCharacteristicWithResponseForService(
      BleProtocol.SERVICE_UUID,
      BleProtocol.CMD_CHAR_UUID,
      base64Data,
    );
  }

  isConnected() { return this.device !== null; }
}

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

export const bleService = new BleService();
