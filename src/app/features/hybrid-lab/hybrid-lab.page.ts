import { DatePipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { Subscription } from 'rxjs';
import { BRIDGE_NS, BRIDGE_VERSION, WebToHostMessage } from '../../core/hybrid/bridge-protocol';
import { InAppBrowserService } from '../../core/hybrid/in-app-browser.service';
import { WebModuleLauncher } from '../../core/hybrid/web-module-launcher.service';
import { SecureWebviewComponent } from '../../shared/components/secure-webview/secure-webview.component';

interface LogEntry {
  at: Date;
  channel: 'iframe' | 'native' | 'browser' | 'security';
  text: string;
}

/**
 * Interview showcase: each card demonstrates one way to run web content in a
 * hybrid app, with a live log of bridge traffic.
 */
@Component({
  selector: 'fa-hybrid-lab',
  imports: [
    DatePipe, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonContent, IonButton, IonIcon,
    IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, SecureWebviewComponent,
  ],
  templateUrl: './hybrid-lab.page.html',
  styleUrl: './hybrid-lab.page.scss',
})
export class HybridLabPage {
  private readonly launcher = inject(WebModuleLauncher);
  private readonly browser = inject(InAppBrowserService);
  private readonly router = inject(Router);
  private readonly frame = viewChild(SecureWebviewComponent);
  private nativeSub?: Subscription;

  protected readonly log = signal<LogEntry[]>([]);
  protected readonly nativeOpen = signal(false);
  protected readonly context = computed(() => this.launcher.hostContext({ demo: true }));
  protected readonly blockedUrl = 'http://evil.example/phish.html';

  protected readonly env = {
    platform: this.launcher.platform,
    native: this.launcher.isNative,
    engine: engineName(navigator.userAgent),
  };

  private pingSentAt = 0;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.nativeSub?.unsubscribe());
  }

  // ---- 1. iframe + postMessage ----
  protected onIframeMessage(msg: WebToHostMessage): void {
    if (msg.type === 'web.pong') {
      this.add('iframe', `← web.pong — round trip ${(performance.now() - this.pingSentAt).toFixed(1)} ms`);
      return;
    }
    this.add('iframe', `← ${msg.type} ${JSON.stringify(msg.payload)}`);
    if (msg.type === 'web.navigate') {
      this.add('iframe', `navigating to allowlisted route ${msg.payload.route}`);
      void this.router.navigateByUrl(msg.payload.route);
    }
  }

  protected ping(): void {
    this.pingSentAt = performance.now();
    this.frame()?.send({ type: 'host.ping', payload: { at: Date.now() } });
    this.add('iframe', '→ host.ping');
  }

  // ---- 2. custom native WebView plugin ----
  protected openNative(): void {
    this.nativeSub?.unsubscribe();
    this.nativeOpen.set(true);
    this.add('native', `→ NativeWebView.open() on ${this.env.platform}${this.env.native ? '' : ' (web fallback: popup)'}`);
    this.nativeSub = this.launcher.openNative('web/offers.html', { demo: true }, 'Offers').subscribe({
      next: (msg) => {
        this.add('native', `← ${msg.type} ${JSON.stringify(msg.payload)}`);
        if (msg.type === 'web.navigate') {
          this.nativeSub?.unsubscribe();
          void this.router.navigateByUrl(msg.payload.route);
        }
      },
      error: (e: unknown) => {
        this.nativeOpen.set(false);
        this.add('native', `✕ ${e instanceof Error ? e.message : String(e)}`);
      },
      complete: () => {
        this.nativeOpen.set(false);
        this.add('native', 'WebView closed');
      },
    });
  }

  protected closeNative(): void {
    this.nativeSub?.unsubscribe();
    this.nativeOpen.set(false);
    this.add('native', '→ NativeWebView.close()');
  }

  // ---- 3. system browser ----
  protected async openBrowser(url: string): Promise<void> {
    const ok = await this.browser.open(url);
    this.add('browser', ok ? `opened ${url}` : `✕ blocked by allowlist: ${url}`);
  }

  // ---- 4. security checks ----
  protected forgeMessage(): void {
    // Posted by the app window itself, not the iframe → the component must drop it.
    window.postMessage(
      { ns: BRIDGE_NS, v: BRIDGE_VERSION, id: 'forged', type: 'payment.result', payload: { status: 'paid', reference: 'FAKE' } },
      window.location.origin,
    );
    this.add('security', 'forged payment.result posted from wrong source → dropped (see console)');
  }

  protected clearLog(): void {
    this.log.set([]);
  }

  private add(channel: LogEntry['channel'], text: string): void {
    this.log.update((l) => [{ at: new Date(), channel, text }, ...l].slice(0, 40));
  }
}

function engineName(ua: string): string {
  if (/; wv\)/.test(ua)) return 'Android System WebView (Chromium)';
  if (/iPhone|iPad/.test(ua) && !/Safari/.test(ua)) return 'WKWebView (WebKit)';
  if (/Edg\//.test(ua)) return 'Edge (Chromium)';
  if (/Chrome\//.test(ua)) return 'Chrome (Blink)';
  if (/Safari\//.test(ua)) return 'Safari (WebKit)';
  if (/Firefox\//.test(ua)) return 'Firefox (Gecko)';
  return 'Unknown';
}
