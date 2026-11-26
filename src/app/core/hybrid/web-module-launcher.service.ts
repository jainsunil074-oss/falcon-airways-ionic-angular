import { Injectable, NgZone, inject } from '@angular/core';
import { Capacitor, PluginListenerHandle } from '@capacitor/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SettingsService } from '../settings/settings.service';
import { HostContext, WebToHostMessage, envelope, parseWebMessage } from './bridge-protocol';
import { NativeWebView } from './native-webview';

/**
 * Opens a hosted web module in a separate native WebView (custom plugin) and
 * exposes its validated messages as an Observable. Unsubscribing closes the WebView.
 */
@Injectable({ providedIn: 'root' })
export class WebModuleLauncher {
  private readonly zone = inject(NgZone);
  private readonly settings = inject(SettingsService);

  readonly isNative = Capacitor.isNativePlatform();
  readonly platform = Capacitor.getPlatform();

  hostContext(data: HostContext['data'] = {}): HostContext {
    const locale = this.settings.language();
    return {
      locale,
      dir: locale === 'ar' ? 'rtl' : 'ltr',
      theme: this.settings.darkMode() ? 'dark' : 'light',
      data,
    };
  }

  openNative(path: string, data: HostContext['data'] = {}, title?: string): Observable<WebToHostMessage> {
    // Native WebViews need an absolute URL. Resolve against <base href> so the app also
    // works when hosted under a sub-path (e.g. GitHub Pages /falcon-airways-ionic-angular/).
    const url = new URL(path, document.baseURI).toString();
    return new Observable<WebToHostMessage>((subscriber) => {
      const handles: Promise<PluginListenerHandle>[] = [];
      const run = (fn: () => void) => this.zone.run(fn);

      handles.push(
        NativeWebView.addListener('message', ({ message }) =>
          run(() => {
            const msg = parseWebMessage(message);
            if (!msg) {
              console.warn('[Bridge] dropped invalid message', message);
              return;
            }
            if (msg.type === 'web.ready') {
              void NativeWebView.postMessage({
                message: JSON.stringify(envelope({ type: 'host.init', payload: this.hostContext(data) })),
              });
            }
            subscriber.next(msg);
          }),
        ),
        NativeWebView.addListener('closed', () => run(() => subscriber.complete())),
        NativeWebView.addListener('navigationBlocked', ({ url: blocked }) =>
          run(() => console.warn('[Bridge] navigation blocked', blocked)),
        ),
      );

      NativeWebView.open({ url, title, allowedHosts: environment.allowedWebHosts }).catch((e) =>
        run(() => subscriber.error(e)),
      );

      return () => {
        void NativeWebView.close();
        handles.forEach((h) => void h.then((x) => x.remove()));
      };
    });
  }
}
