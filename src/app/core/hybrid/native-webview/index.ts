import { registerPlugin } from '@capacitor/core';
import type { NativeWebViewPlugin } from './definitions';

import type { NativeWebViewWeb } from './web';

/**
 * Memoised on purpose: Capacitor calls the web loader once per method call until
 * the first load resolves, so addListener() + open() fired together would each get
 * their own instance (listeners on one, popup on another) without this cache.
 */
let webImpl: Promise<NativeWebViewWeb> | undefined;

/**
 * On iOS/Android Capacitor routes calls to the native class registered as
 * "NativeWebView"; in the browser it lazy-loads the web implementation.
 */
export const NativeWebView = registerPlugin<NativeWebViewPlugin>('NativeWebView', {
  web: () => (webImpl ??= import('./web').then((m) => new m.NativeWebViewWeb())),
});

export * from './definitions';
