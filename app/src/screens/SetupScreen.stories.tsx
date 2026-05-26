import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import SetupScreen from './SetupScreen';
import { useLightStore } from '../store/useLightStore';
import { mockNavigation, mockRoute } from '../mocks/navigation';

const defaultProps = {
  navigation: mockNavigation,
  route: mockRoute('Setup'),
};

const meta: Meta<typeof SetupScreen> = {
  title: 'Screens/SetupScreen',
  component: SetupScreen,
  args: defaultProps,
};
export default meta;
type Story = StoryObj<typeof SetupScreen>;

// ─── Step 1: パスワード入力 ───────────────────────────────────────────────────
export const Step1Password: Story = {
  name: '① Step1 パスワード設定',
  beforeEach: () => {
    useLightStore.setState({ deviceStatus: 'unknown', lastEvent: null });
  },
};

// ─── Step 1: 送信中 ───────────────────────────────────────────────────────────
export const Step1Submitting: Story = {
  name: '② Step1 送信中 (Submitを押すと確認)',
  beforeEach: () => {
    useLightStore.setState({ deviceStatus: 'unknown', lastEvent: null });
  },
};

// ─── Step 2: 秘密の質問 ───────────────────────────────────────────────────────
// cmd_ok イベントで Step2 に進む (beforeEach で lastEvent を設定)
export const Step2Secret: Story = {
  name: '③ Step2 秘密の質問設定',
  beforeEach: () => {
    // cmd_ok を流して step=2 に進ませる
    useLightStore.setState({ deviceStatus: 'unknown', lastEvent: 'cmd_ok' });
  },
};

// ─── エラー状態 ───────────────────────────────────────────────────────────────
export const WithError: Story = {
  name: '④ エラー発生',
  beforeEach: () => {
    useLightStore.setState({ lastEvent: 'error', deviceStatus: 'unknown' });
  },
};
