/**
 * react-native-ble-plx のブラウザ用モック。
 * Storybook (web) 環境ではネイティブBLEが使えないため、
 * 全メソッドをno-opまたはPromise解決するダミーに差し替える。
 */

export enum State {
  Unknown      = 'Unknown',
  Resetting    = 'Resetting',
  Unsupported  = 'Unsupported',
  Unauthorized = 'Unauthorized',
  PoweredOff   = 'PoweredOff',
  PoweredOn    = 'PoweredOn',
}

const noopSubscription = { remove: () => {} };

const mockDevice = {
  id: 'mock-device-id',
  name: 'LighTouch (Mock)',
  discoverAllServicesAndCharacteristics: () => Promise.resolve(mockDevice),
  onDisconnected: (_cb: () => void) => noopSubscription,
  monitorCharacteristicForService: () => noopSubscription,
  writeCharacteristicWithResponseForService: () => Promise.resolve(null),
  cancelConnection: () => Promise.resolve(mockDevice),
};

export class BleManager {
  state    = () => Promise.resolve(State.PoweredOn);
  startDeviceScan(_uuids: string[] | null, _opts: unknown, _cb: (err: null, device: typeof mockDevice) => void) {
    // Storybook上ではスキャン結果を返さない (各ストーリーでStoreを直接操作する)
  }
  stopDeviceScan = () => {};
  connectToDevice = (_id: string) => Promise.resolve(mockDevice);
}

// 型エクスポート (実際には使われないが import エラーを防ぐ)
export type Device       = typeof mockDevice;
export type Subscription = typeof noopSubscription;
