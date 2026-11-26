import { WebPlugin } from '@capacitor/core';
import { isAllowedUrl, originOf } from '../url-policy';
import type { NativeWebViewOpenOptions, NativeWebViewPlugin } from './definitions';

/**
 * Browser fallback for the NativeWebView plugin so the same feature code runs
 * in `ng serve`: the module opens in a popup window and talks over postMessage.
 */
export class NativeWebViewWeb extends WebPlugin implements NativeWebViewPlugin {
  private popup: Window | null = null;
  private targetOrigin = '';
  private watcher?: ReturnType<typeof setInterval>;

  private readonly onMessage = (event: MessageEvent): void => {
    if (!this.popup || event.source !== this.popup || event.origin !== this.targetOrigin) {
      return;
    }
    this.notifyListeners('message', {
      message: typeof event.data === 'string' ? event.data : JSON.stringify(event.data),
    });
  };

  async open(options: NativeWebViewOpenOptions): Promise<void> {
    if (!isAllowedUrl(options.url, options.allowedHosts)) {
      this.notifyListeners('navigationBlocked', { url: options.url });
      throw this.unavailable('URL not allowed');
    }
    this.targetOrigin = originOf(options.url);
    this.popup = window.open(options.url, 'falcon-native-webview', 'width=420,height=760');
    if (!this.popup) {
      throw this.unavailable('Popup blocked by the browser');
    }
    window.addEventListener('message', this.onMessage);
    // Poll for the user closing the popup, mirroring the native 'closed' event.
    this.watcher = setInterval(() => {
      if (this.popup?.closed) {
        void this.close();
      }
    }, 500);
  }

  async postMessage(options: { message: string }): Promise<void> {
    this.popup?.postMessage(options.message, this.targetOrigin);
  }

  async close(): Promise<void> {
    clearInterval(this.watcher);
    window.removeEventListener('message', this.onMessage);
    if (this.popup && !this.popup.closed) {
      this.popup.close();
    }
    if (this.popup) {
      this.popup = null;
      this.notifyListeners('closed', {});
    }
  }
}
