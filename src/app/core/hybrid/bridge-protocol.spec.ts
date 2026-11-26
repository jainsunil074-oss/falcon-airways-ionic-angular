import { BRIDGE_NS, BRIDGE_VERSION, envelope, parseWebMessage } from './bridge-protocol';

const msg = (type: string, payload: unknown = {}) => ({ ns: BRIDGE_NS, v: BRIDGE_VERSION, id: 'abc', type, payload });

describe('parseWebMessage', () => {
  it('accepts a valid payment result', () => {
    expect(parseWebMessage(msg('payment.result', { status: 'paid', reference: 'PSP-1' }))).toEqual({
      type: 'payment.result',
      payload: { status: 'paid', reference: 'PSP-1' },
    });
  });

  it('accepts JSON strings (native WebViews send strings)', () => {
    const parsed = parseWebMessage(JSON.stringify(msg('checkin.completed', { seat: '21A' })));
    expect(parsed).toEqual({ type: 'checkin.completed', payload: { seat: '21A' } });
  });

  it('rejects wrong namespace, version or unknown types', () => {
    expect(parseWebMessage({ ...msg('web.ready'), ns: 'other' })).toBeNull();
    expect(parseWebMessage({ ...msg('web.ready'), v: 2 })).toBeNull();
    expect(parseWebMessage(msg('payment.refund'))).toBeNull();
    expect(parseWebMessage('not json')).toBeNull();
    expect(parseWebMessage(null)).toBeNull();
  });

  it('rejects invalid payloads', () => {
    expect(parseWebMessage(msg('payment.result', { status: 'maybe', reference: 'x' }))).toBeNull();
    expect(parseWebMessage(msg('checkin.completed', { seat: '<img src=x>' }))).toBeNull();
    expect(parseWebMessage(msg('web.resize', { height: -5 }))).toBeNull();
  });

  it('only allows navigation to allowlisted routes', () => {
    expect(parseWebMessage(msg('web.navigate', { route: '/tabs/book' }))).not.toBeNull();
    expect(parseWebMessage(msg('web.navigate', { route: '/settings' }))).toBeNull();
    expect(parseWebMessage(msg('web.navigate', { route: 'javascript:alert(1)' }))).toBeNull();
  });

  it('strips unexpected payload fields', () => {
    const parsed = parseWebMessage(msg('web.ready', { evil: true }));
    expect(parsed).toEqual({ type: 'web.ready', payload: {} });
  });
});

describe('envelope', () => {
  it('wraps host messages with namespace, version and id', () => {
    const env = envelope({ type: 'host.ping', payload: { at: 1 } });
    expect(env.ns).toBe(BRIDGE_NS);
    expect(env.v).toBe(BRIDGE_VERSION);
    expect(env.id).toMatch(/[0-9a-f-]{36}/);
  });
});
