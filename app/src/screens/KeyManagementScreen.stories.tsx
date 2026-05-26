import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import KeyManagementScreen from './KeyManagementScreen';
import { useLightStore } from '../store/useLightStore';
import { mockNavigation, mockRoute } from '../mocks/navigation';

const dummyKeys = [
  { uid: new Uint8Array([0x04, 0xA1, 0x3B, 0x7C]), uidHex: '04A13B7C', label: 'メインキー' },
  { uid: new Uint8Array([0xDE, 0xAD, 0xBE, 0xEF]), uidHex: 'DEADBEEF', label: 'スペアキー' },
  { uid: new Uint8Array([0x11, 0x22, 0x33, 0x44]), uidHex: '11223344', label: '' },
];

const meta: Meta<typeof KeyManagementScreen> = {
  title: 'Screens/KeyManagementScreen',
  component: KeyManagementScreen,
};
export default meta;
type Story = StoryObj<typeof KeyManagementScreen>;

// ─── 鍵なし (初回セットアップ直後) ──────────────────────────────────────────
export const EmptyFromSetup: Story = {
  name: '① 鍵なし (初回セットアップ)',
  args: {
    navigation: mockNavigation,
    route: mockRoute('KeyManagement', { fromSetup: true }),
  },
  beforeEach: () => {
    useLightStore.setState({ registeredKeys: [], lastEvent: null });
  },
};

// ─── 鍵なし (設定モードから) ─────────────────────────────────────────────────
export const Empty: Story = {
  name: '② 鍵なし (設定モード)',
  args: {
    navigation: mockNavigation,
    route: mockRoute('KeyManagement', {}),
  },
  beforeEach: () => {
    useLightStore.setState({ registeredKeys: [], lastEvent: null });
  },
};

// ─── 鍵あり ───────────────────────────────────────────────────────────────────
export const WithKeys: Story = {
  name: '③ 鍵あり',
  args: {
    navigation: mockNavigation,
    route: mockRoute('KeyManagement', {}),
  },
  beforeEach: () => {
    useLightStore.setState({ registeredKeys: dummyKeys, lastEvent: null });
  },
};

// ─── NFC待機中 ───────────────────────────────────────────────────────────────
// 「NFCタグを追加」ボタンを押した後の状態 (内部stateなのでボタンクリックで確認)
export const WaitingForNfc: Story = {
  name: '④ NFC待機中 (「NFCタグを追加」を押す)',
  args: {
    navigation: mockNavigation,
    route: mockRoute('KeyManagement', {}),
  },
  beforeEach: () => {
    useLightStore.setState({ registeredKeys: dummyKeys, lastEvent: null });
  },
};

// ─── 鍵登録成功 ──────────────────────────────────────────────────────────────
export const KeyRegistered: Story = {
  name: '⑤ 登録成功直後',
  args: {
    navigation: mockNavigation,
    route: mockRoute('KeyManagement', {}),
  },
  beforeEach: () => {
    useLightStore.setState({ registeredKeys: dummyKeys, lastEvent: 'key_registered' });
  },
};
