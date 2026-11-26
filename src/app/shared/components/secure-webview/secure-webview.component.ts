import {
  Component,
  DestroyRef,
  ElementRef,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { environment } from '../../../../environments/environment';
import {
  HostContext,
  HostToWebMessage,
  WebToHostMessage,
  envelope,
  parseWebMessage,
} from '../../../core/hybrid/bridge-protocol';
import { isAllowedUrl, isTrustedOrigin, originOf } from '../../../core/hybrid/url-policy';

/**
 * Embeds a hosted web module in a sandboxed <iframe> and runs the postMessage bridge.
 *
 * Security layers:
 *  1. URL allowlist before Angular is told the resource URL is safe.
 *  2. Static sandbox attribute (Angular refuses to let it be bound dynamically) blocks
 *     top-level navigation and popups. allow-same-origin lets the module keep its own
 *     storage on its own origin; in production modules live on a *different* origin,
 *     so this gives them no access to the app.
 *  3. Incoming messages must come from this frame's window AND a trusted origin,
 *     and must pass schema validation.
 *  4. Outgoing messages use an explicit targetOrigin, never '*'.
 */
@Component({
  selector: 'fa-secure-webview',
  template: `
    @if (safeUrl(); as url) {
      <iframe
        #frame
        [src]="url"
        [title]="title()"
        [style.height.px]="height()"
        sandbox="allow-scripts allow-forms allow-same-origin"
        referrerpolicy="strict-origin"
        loading="lazy"
      ></iframe>
    } @else {
      <p class="blocked">Blocked: this URL is not on the allowlist.</p>
    }
  `,
  styles: `
    :host { display: block; }
    iframe { width: 100%; border: 0; display: block; border-radius: var(--fa-radius); background: transparent; transition: height 0.2s ease; }
    .blocked { padding: 16px; color: var(--ion-color-danger); }
  `,
})
export class SecureWebviewComponent {
  readonly src = input.required<string>();
  readonly title = input('Embedded web module');
  readonly context = input.required<HostContext>();
  readonly initialHeight = input(480);

  readonly message = output<WebToHostMessage>();

  private readonly sanitizer = inject(DomSanitizer);
  private readonly frame = viewChild<ElementRef<HTMLIFrameElement>>('frame');
  private readonly reportedHeight = signal<number | null>(null);

  protected readonly height = computed(() => this.reportedHeight() ?? this.initialHeight());

  protected readonly safeUrl = computed<SafeResourceUrl | null>(() => {
    const src = this.src();
    return isAllowedUrl(src, environment.allowedWebHosts)
      ? this.sanitizer.bypassSecurityTrustResourceUrl(src) // safe: checked against allowlist above
      : null;
  });

  private readonly listener = (event: MessageEvent): void => {
    const win = this.frame()?.nativeElement.contentWindow;
    if (!win || event.source !== win) return;
    if (!isTrustedOrigin(event.origin, environment.trustedWebOrigins)) return;
    const msg = parseWebMessage(event.data);
    if (!msg) {
      console.warn('[Bridge] dropped invalid message from', event.origin);
      return;
    }
    if (msg.type === 'web.ready') {
      this.send({ type: 'host.init', payload: this.context() });
    }
    if (msg.type === 'web.resize') {
      this.reportedHeight.set(Math.min(msg.payload.height + 4, 2000));
    }
    this.message.emit(msg);
  };

  constructor() {
    window.addEventListener('message', this.listener);
    inject(DestroyRef).onDestroy(() => window.removeEventListener('message', this.listener));
  }

  /** Send a typed message to the embedded page. */
  send(message: HostToWebMessage): void {
    const win = this.frame()?.nativeElement.contentWindow;
    win?.postMessage(envelope(message), originOf(this.src()));
  }
}
