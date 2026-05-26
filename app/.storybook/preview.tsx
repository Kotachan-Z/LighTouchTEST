import React from 'react';
import type { Preview } from '@storybook/react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Web / Storybook 環境では Native の safe area 計測が動かないため
// initialMetrics を渡して insets を即座に確定させる。
// これがないと SafeAreaProvider が children を描画しない。
const INITIAL_METRICS = {
  insets: { top: 0, right: 0, bottom: 0, left: 0 },
  frame: { x: 0, y: 0, width: 390, height: 844 },
};

const preview: Preview = {
  decorators: [
    (Story) => (
      <SafeAreaProvider initialMetrics={INITIAL_METRICS}>
        <Story />
      </SafeAreaProvider>
    ),
  ],
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/ } },
    layout: 'fullscreen',
    viewport: {
      defaultViewport: 'mobile1',  // スマホサイズで表示
    },
  },
};

export default preview;
