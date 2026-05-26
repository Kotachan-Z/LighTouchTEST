import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import ForgotPasswordScreen from './ForgotPasswordScreen';
import { useLightStore } from '../store/useLightStore';
import { mockNavigation, mockRoute } from '../mocks/navigation';

const defaultProps = {
  navigation: mockNavigation,
  route: mockRoute('ForgotPassword'),
};

const meta: Meta<typeof ForgotPasswordScreen> = {
  title: 'Screens/ForgotPasswordScreen',
  component: ForgotPasswordScreen,
  args: defaultProps,
};
export default meta;
type Story = StoryObj<typeof ForgotPasswordScreen>;

// ─── 取得中 (ローディング) ─────────────────────────────────────────────────────
export const Loading: Story = {
  name: '① 質問取得中',
  beforeEach: () => {
    useLightStore.setState({ secretQuestion: null, lastEvent: null });
  },
};

// ─── 未設定 ───────────────────────────────────────────────────────────────────
export const NoQuestion: Story = {
  name: '② 秘密の質問が未設定',
  beforeEach: () => {
    // 空文字列 = 設定なし扱い
    useLightStore.setState({ secretQuestion: '', lastEvent: null });
  },
};

// ─── 質問あり・入力前 ─────────────────────────────────────────────────────────
export const WithQuestion: Story = {
  name: '③ 質問あり（入力前）',
  beforeEach: () => {
    useLightStore.setState({
      secretQuestion: '初めて飼ったペットの名前は？',
      lastEvent: null,
    });
  },
};

// ─── 回答ミス ─────────────────────────────────────────────────────────────────
export const WrongAnswer: Story = {
  name: '④ 回答が違う',
  beforeEach: () => {
    useLightStore.setState({
      secretQuestion: '初めて飼ったペットの名前は？',
      lastEvent: 'reset_fail',
    });
  },
};

// ─── リセット成功 ─────────────────────────────────────────────────────────────
export const ResetSuccess: Story = {
  name: '⑤ リセット成功',
  beforeEach: () => {
    useLightStore.setState({
      secretQuestion: '初めて飼ったペットの名前は？',
      lastEvent: 'reset_ok',
    });
  },
};
