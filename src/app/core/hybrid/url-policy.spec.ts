import { isAllowedUrl, isTrustedOrigin, originOf } from './url-policy';

const BASE = 'https://localhost/tabs/home';
const HOSTS = ['falconairways.example'];

describe('isAllowedUrl', () => {
  it('allows same-origin relative URLs', () => {
    expect(isAllowedUrl('/web/payment.html', HOSTS, BASE)).toBe(true);
  });

  it('allows https on allowlisted hosts and their subdomains', () => {
    expect(isAllowedUrl('https://falconairways.example/x', HOSTS, BASE)).toBe(true);
    expect(isAllowedUrl('https://pay.falconairways.example/x', HOSTS, BASE)).toBe(true);
  });

  it('blocks look-alike hosts', () => {
    expect(isAllowedUrl('https://falconairways.example.evil.com', HOSTS, BASE)).toBe(false);
    expect(isAllowedUrl('https://evilfalconairways.example', HOSTS, BASE)).toBe(false);
  });

  it('blocks non-https and dangerous schemes', () => {
    expect(isAllowedUrl('http://falconairways.example', HOSTS, BASE)).toBe(false);
    expect(isAllowedUrl('javascript:alert(1)', HOSTS, BASE)).toBe(false);
    expect(isAllowedUrl('data:text/html,<script>1</script>', HOSTS, BASE)).toBe(false);
    expect(isAllowedUrl('file:///etc/passwd', HOSTS, BASE)).toBe(false);
  });
});

describe('origins', () => {
  it('resolves the origin of a frame URL', () => {
    expect(originOf('/web/offers.html', BASE)).toBe('https://localhost');
  });

  it("treats 'self' as the app's own origin", () => {
    expect(isTrustedOrigin('https://localhost', ['self'], 'https://localhost')).toBe(true);
    expect(isTrustedOrigin('https://evil.com', ['self'], 'https://localhost')).toBe(false);
    expect(isTrustedOrigin('null', ['self'], 'https://localhost')).toBe(false);
  });
});
