import { Injectable, NgZone, inject, signal } from '@angular/core';
import { Network } from '@capacitor/network';

/** Exposes connectivity as a signal (native reachability on device, navigator.onLine on web). */
@Injectable({ providedIn: 'root' })
export class NetworkStatusService {
  private readonly zone = inject(NgZone);
  readonly online = signal(true);

  constructor() {
    void Network.getStatus().then((s) => this.online.set(s.connected));
    // Capacitor callbacks fire outside Angular's zone on native; re-enter it.
    void Network.addListener('networkStatusChange', (s) =>
      this.zone.run(() => this.online.set(s.connected)),
    );
  }
}
