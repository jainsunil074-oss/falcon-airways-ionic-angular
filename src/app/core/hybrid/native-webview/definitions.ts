import type { PluginListenerHandle } from '@capacitor/core';

export interface NativeWebViewOpenOptions {
  /** Absolute https URL of the hosted web module. */
  url: string;
  title?: string;
  /** Hosts the WebView may navigate to; everything else is blocked natively. */
  allowedHosts: string[];
}

export interface NativeWebViewMessageEvent {
  /** JSON envelope string sent by the page through the injected bridge. */
  message: string;
}

/**
 * Custom Capacitor plugin: opens a second, isolated native WebView
 * (WKWebView on iOS, android.webkit.WebView on Android) with a JS bridge.
 * Native sources: native/android/NativeWebViewPlugin.kt and native/ios/NativeWebViewPlugin.swift.
 */
export interface NativeWebViewPlugin {
  open(options: NativeWebViewOpenOptions): Promise<void>;
  /** Deliver a JSON envelope to the page (window.FalconBridge receives it). */
  postMessage(options: { message: string }): Promise<void>;
  close(): Promise<void>;

  addListener(event: 'message', listener: (e: NativeWebViewMessageEvent) => void): Promise<PluginListenerHandle>;
  addListener(event: 'closed', listener: () => void): Promise<PluginListenerHandle>;
  addListener(event: 'navigationBlocked', listener: (e: { url: string }) => void): Promise<PluginListenerHandle>;
  removeAllListeners(): Promise<void>;
}
