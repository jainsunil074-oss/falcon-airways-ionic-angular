import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

/**
 * Thin typed wrapper over Capacitor Preferences.
 * Native: SharedPreferences (Android) / UserDefaults (iOS). Web: localStorage.
 * Never store secrets here — tokens belong in Keychain/Keystore via a secure-storage plugin.
 */
@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly prefix = 'fa.';

  async get<T>(key: string, fallback: T): Promise<T> {
    const { value } = await Preferences.get({ key: this.prefix + key });
    if (value === null) {
      return fallback;
    }
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }

  set<T>(key: string, value: T): Promise<void> {
    return Preferences.set({ key: this.prefix + key, value: JSON.stringify(value) });
  }

  remove(key: string): Promise<void> {
    return Preferences.remove({ key: this.prefix + key });
  }
}
