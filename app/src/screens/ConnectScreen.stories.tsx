import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import ConnectScreen from './ConnectScreen';
import { useLightStore } from '../store/useLightStore';
import { mockNavigation, mockRoute } from '../mocks/navigation';

const defaultProps = {
  navigation: mockNavigation,
  route: mockRoute('Connect'),
};

const meta: Meta<typeof ConnectScreen> = {
  title: 'Screens/ConnectScreen',
  component: ConnectScreen,
  args: defaultProps,
};
export default meta;
type Story = StoryObj<typeof ConnectScreen>;

// ─── 初期状態: 未スキャン ────────────────────────────────────────────────────
export const Idle: Story = {
  name: '① 未接続',
  beforeEach: () => {
    useLightStore.setState({
      bleConnState: 'disconnected',
      discoveredDevices: [],
      deviceStatus: 'unknown',
    });
  },
};

// ─── スキャン中 ───────────────────────────────────────────────────────────────
export const Scanning: Story = {
  name: '② スキャン中',
  beforeEach: () => {
    useLightStore.setState({
      bleConnState: 'scanning',
      discoveredDevices: [],
    });
  },
};

// ─── デバイス発見 ─────────────────────────────────────────────────────────────
export const DevicesFound: Story = {
  name: '③ デバイス発見',
  beforeEach: () => {
    useLightStore.setState({
      bleConnState: 'scanning',
      discoveredDevices: [
        { id: 'AA:BB:CC:DD:EE:FF', name: 'LighTouch' },
        { id: '11:22:33:44:55:66', name: 'LighTouch-2' },
      ],
    });
  },
};

// ─── 接続中 ───────────────────────────────────────────────────────────────────
export const Connecting: Story = {
  name: '④ 接続中',
  beforeEach: () => {
    useLightStore.setState({
      bleConnState: 'connecting',
      discoveredDevices: [{ id: 'AA:BB:CC:DD:EE:FF', name: 'LighTouch' }],
    });
  },
};

// ─── Bluetoothオフ ────────────────────────────────────────────────────────────
export const BluetoothOff: Story = {
  name: '⑤ Bluetoothオフ',
  beforeEach: () => {
    useLightStore.setState({ bleConnState: 'off' });
  },
};
