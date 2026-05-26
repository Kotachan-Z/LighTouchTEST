/**
 * ストーリー用のナビゲーションモック。
 * 各画面は navigation prop を受け取るので、これを渡す。
 */
export const mockNavigation = {
  navigate:   (screen: string, params?: unknown) => console.log('[Nav] navigate ->', screen, params),
  replace:    (screen: string, params?: unknown) => console.log('[Nav] replace  ->', screen, params),
  goBack:     ()                                 => console.log('[Nav] goBack'),
  dispatch:   ()                                 => {},
  reset:      ()                                 => {},
  setOptions: ()                                 => {},
  addListener:    (_event: string, _cb: () => void) => ({ remove: () => {} }),
  removeListener: () => {},
  isFocused:  () => true,
  canGoBack:  () => false,
} as any;  // eslint-disable-line @typescript-eslint/no-explicit-any

export const mockRoute = <T extends string>(name: T, params: object = {}) =>
  ({ key: name, name, params }) as any;
