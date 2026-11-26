/**
 * Versioned message contract between the Ionic app (host) and hosted web modules
 * (payment, check-in, offers) running in an <iframe>, Android WebView or iOS WKWebView.
 *
 * Every message is an envelope: { ns, v, id, type, payload }.
 * Messages from the web side are untrusted input and are validated before use.
 */
export const BRIDGE_NS = 'falcon-bridge';
export const BRIDGE_VERSION = 1;

export interface HostContext {
  locale: 'en' | 'ar';
  dir: 'ltr' | 'rtl';
  theme: 'light' | 'dark';
  data: Record<string, string | number | boolean>;
}

export type HostToWebMessage =
  | { type: 'host.init'; payload: HostContext }
  | { type: 'host.ping'; payload: { at: number } };

export type WebToHostMessage =
  | { type: 'web.ready'; payload: Record<string, never> }
  | { type: 'web.resize'; payload: { height: number } }
  | { type: 'web.close'; payload: Record<string, never> }
  | { type: 'web.log'; payload: { message: string } }
  | { type: 'web.pong'; payload: { at: number } }
  | { type: 'web.navigate'; payload: { route: string } }
  | { type: 'payment.result'; payload: { status: 'paid' | 'failed'; reference: string } }
  | { type: 'checkin.completed'; payload: { seat: string } };

export type WebToHostType = WebToHostMessage['type'];

export interface BridgeEnvelope<M extends { type: string; payload: unknown }> {
  ns: typeof BRIDGE_NS;
  v: typeof BRIDGE_VERSION;
  id: string;
  type: M['type'];
  payload: M['payload'];
}

export function envelope(message: HostToWebMessage): BridgeEnvelope<HostToWebMessage> {
  return { ns: BRIDGE_NS, v: BRIDGE_VERSION, id: crypto.randomUUID(), ...message };
}

/** Routes a web module may ask the app to open. Anything else is ignored. */
export const NAVIGABLE_ROUTES = ['/tabs/book', '/tabs/trips', '/tabs/status', '/assistant'] as const;

const isObj = (x: unknown): x is Record<string, unknown> =>
  typeof x === 'object' && x !== null && !Array.isArray(x);
const isStr = (x: unknown, max = 200): x is string => typeof x === 'string' && x.length <= max;

/**
 * Validates an incoming message (object or JSON string, since native WebViews pass strings).
 * Returns null for anything that does not match the contract exactly.
 */
export function parseWebMessage(raw: unknown): WebToHostMessage | null {
  let data = raw;
  if (typeof raw === 'string') {
    if (raw.length > 10_000) return null;
    try {
      data = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (!isObj(data) || data['ns'] !== BRIDGE_NS || data['v'] !== BRIDGE_VERSION || !isStr(data['id'], 64)) {
    return null;
  }
  const p = isObj(data['payload']) ? data['payload'] : {};
  switch (data['type']) {
    case 'web.ready':
    case 'web.close':
      return { type: data['type'], payload: {} };
    case 'web.resize': {
      const h = p['height'];
      return typeof h === 'number' && h > 0 && h < 10_000 ? { type: 'web.resize', payload: { height: Math.round(h) } } : null;
    }
    case 'web.log':
      return isStr(p['message'], 500) ? { type: 'web.log', payload: { message: p['message'] } } : null;
    case 'web.pong':
      return typeof p['at'] === 'number' ? { type: 'web.pong', payload: { at: p['at'] } } : null;
    case 'web.navigate': {
      const route = p['route'];
      return isStr(route) && (NAVIGABLE_ROUTES as readonly string[]).includes(route)
        ? { type: 'web.navigate', payload: { route } }
        : null;
    }
    case 'payment.result': {
      const status = p['status'];
      const reference = p['reference'];
      return (status === 'paid' || status === 'failed') && isStr(reference, 64)
        ? { type: 'payment.result', payload: { status, reference } }
        : null;
    }
    case 'checkin.completed': {
      const seat = p['seat'];
      return isStr(seat, 4) && /^[0-9]{1,2}[A-K]$/.test(seat)
        ? { type: 'checkin.completed', payload: { seat } }
        : null;
    }
    default:
      return null;
  }
}
