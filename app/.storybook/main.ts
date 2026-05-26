import type { StorybookConfig } from '@storybook/react-webpack5';
import path from 'path';

// 他の RN エコシステム: TypeScript を使用 → TS ルールで処理
const RN_TS_PACKAGES = [
  'react-native-screens',
  'react-native-safe-area-context',
  '@react-navigation',
];

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx|js|jsx)'],

  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-actions',
  ],

  framework: {
    name: '@storybook/react-webpack5',
    options: {},
  },

  webpackFinal: async (webpackConfig) => {
    // react-native → react-native-web に差し替え (ブラウザで動作させるため)
    webpackConfig.resolve ??= {};
    webpackConfig.resolve.alias = {
      ...webpackConfig.resolve.alias,
      'react-native$': 'react-native-web',
      'react-native-ble-plx': path.resolve(__dirname, './__mocks__/react-native-ble-plx.ts'),
      // react-native-safe-area-context などのスペックファイルがインポートするが
      // Web では不要なため no-op スタブに差し替える
      'react-native/Libraries/Utilities/codegenNativeComponent': path.resolve(
        __dirname,
        './__mocks__/codegenNativeComponent.js',
      ),
    };

    webpackConfig.module ??= { rules: [] };

    const babelEnvReact = [
      ['@babel/preset-env', { targets: { browsers: ['last 2 versions'] } }],
      ['@babel/preset-react', { runtime: 'automatic' }],
    ] as const;

    // ① react-native 内部実装ファイル (Flow 型) → null-loader でスキップ
    //    react-native-web がブラウザ向け実装を提供するため不要
    (webpackConfig.module.rules as any[]).unshift({
      test: /\.(js|jsx|ts|tsx)$/,
      include: [
        /node_modules\/react-native\/Libraries/,
        /node_modules\/react-native\/src/,
      ],
      loader: 'null-loader',
    });

    // ② プロジェクトソース (TypeScript / JSX)
    (webpackConfig.module.rules as any[]).push({
      test: /\.(ts|tsx|js|jsx)$/,
      exclude: /node_modules/,
      use: {
        loader: 'babel-loader',
        options: {
          cacheDirectory: true,
          presets: [...babelEnvReact, '@babel/preset-typescript'],
          plugins: ['babel-plugin-react-native-web'],
        },
      },
    });

    // ③ 他の RN エコシステム (TypeScript)
    (webpackConfig.module.rules as any[]).push({
      test: /\.(ts|tsx|js|jsx|mjs)$/,
      include: RN_TS_PACKAGES.map(p => new RegExp(`node_modules/${p}`)),
      use: {
        loader: 'babel-loader',
        options: {
          presets: [
            ...babelEnvReact,
            ['@babel/preset-typescript', { allExtensions: true, isTSX: true }],
          ],
          plugins: ['babel-plugin-react-native-web'],
        },
      },
    });

    return webpackConfig;
  },

  docs: { autodocs: 'tag' },
};

export default config;
