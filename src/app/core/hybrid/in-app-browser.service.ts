import { Injectable } from '@angular/core';
import { Browser } from '@capacitor/browser';
import { environment } from '../../../environments/environment';
import { isAllowedUrl } from './url-policy';

/**
 * Opens external content (fare rules, partner sites, T&Cs) in the system browser sheet:
 * SFSafariViewController on iOS, Chrome Custom Tabs on Android, a new tab on web.
 * Use this — not an embedded WebView — when the app doesn't need to talk to the page:
 * the user keeps their browser session and the page can't reach the app's JS.
 */
@Injectable({ providedIn: 'root' })
export class InAppBrowserService {
  async open(url: string, toolbarColor = '#1f2a44'): Promise<boolean> {
    if (!isAllowedUrl(url, [...environment.allowedWebHosts, 'wikipedia.org'])) {
      console.warn('[InAppBrowser] blocked', url);
      return false;
    }
    await Browser.open({ url, toolbarColor, presentationStyle: 'popover' });
    return true;
  }
}
