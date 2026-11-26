/** Relative URLs resolve against <base href> (same as the browser does for iframe src). */
const appBase = (): string | undefined => globalThis.document?.baseURI ?? globalThis.location?.href;

/**
 * URL and origin rules for everything that loads web content inside the app.
 * Centralised so the iframe component, in-app browser and native WebView
 * all enforce the same policy.
 */

/** True when the URL is https (or same-origin) and its host is on the allowlist. */
export function isAllowedUrl(url: string, allowedHosts: readonly string[], base = appBase()): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url, base);
  } catch {
    return false;
  }
  const sameOrigin = !!base && parsed.origin === new URL(base).origin;
  if (sameOrigin) {
    return true;
  }
  if (parsed.protocol !== 'https:') {
    return false; // blocks http:, javascript:, data:, file:, intent: etc.
  }
  return allowedHosts.some((h) => parsed.hostname === h || parsed.hostname.endsWith(`.${h}`));
}

/** Origin a message must come from / be sent to for a given frame URL. */
export function originOf(url: string, base = appBase()): string {
  return new URL(url, base).origin;
}

/** 'self' in the trusted list means the app's own origin. */
export function isTrustedOrigin(origin: string, trusted: readonly string[], selfOrigin = globalThis.location?.origin): boolean {
  return trusted.some((t) => (t === 'self' ? origin === selfOrigin : origin === t));
}
