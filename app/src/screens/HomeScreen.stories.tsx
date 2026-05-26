import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import HomeScreen from './HomeScreen';
import { useLightStore } from '../store/useLightStore';
import { mockNavigation, mockRoute } from '../mocks/navigation';

const defaultProps = {
  navigation: mockNavigation,
  route: mockRoute('Home'),
};

const meta: Meta<typeof HomeScreen> = {
  title: 'Screens/HomeScreen',
  component: HomeScreen,
  args: defaultProps,
};
export default meta;
type Story = StoryObj<typeof HomeScreen>;

// ─── 認証前 ───────────────────────────────────────────────────────────────────
export const Unauthenticated: Story = {
  name: '① 認証前',
  beforeEach: () => {
    useLightStore.setState({
      bleConnState: 'connected',
      isAuthenticated: false,
      isLightOn: false,
      lastEvent: null,
    });
  },
};

// ─── 認証失敗 ─────────────────────────────────────────────────────────────────
export const AuthFailed: Story = {
  name: '② 認証失敗',
  beforeEach: () => {
    useLightStore.setState({
      bleConnState: 'connected',
      isAuthenticated: false,
      lastEvent: 'auth_failed',
    });
  },
};

// ─── 認証済み / ライトOFF ─────────────────────────────────────────────────────
export const AuthenticatedLightOff: Story = {
  name: '③ 認証済み (ライトOFF・NFC未タッチ)',
  beforeEach: () => {
    useLightStore.setState({
      bleConnState: 'connected',
      isAuthenticated: true,
      isLightOn: false,
      lastEvent: null,
    });
  },
};

// ─── 認証済み / ライトON ──────────────────────────────────────────────────────
export const AuthenticatedLightOn: Story = {
  name: '④ 認証済み (ライトON・NFC タッチ後)',
  beforeEach: () => {
    useLightStore.setState({
      bleConnState: 'connected',
      isAuthenticated: true,
      isLightOn: true,
      lastEvent: null,
    });
  },
};
