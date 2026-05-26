module.exports = (api) => {
  const isMetro = api.caller((caller) => caller && caller.name === 'metro');

  if (isMetro) {
    return {
      presets: ['module:@react-native/babel-preset'],
    };
  }

  // webpack / Storybook
  return {
    presets: [
      ['@babel/preset-env', { targets: { browsers: ['last 2 versions'] } }],
      ['@babel/preset-react', { runtime: 'automatic' }],
      '@babel/preset-typescript',
    ],
    plugins: ['babel-plugin-react-native-web'],
  };
};
