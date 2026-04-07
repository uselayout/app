import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { promises as dns } from 'dns';

// The source imports `{ promises as dns } from "dns"` and calls `dns.lookup()`.
// dns.promises and dns/promises are the same object reference in Node.js, so
// spying directly on it intercepts calls in the source module without needing
// vi.mock module hoisting.
const lookupSpy = vi.spyOn(dns, 'lookup');

import { validateExtractionUrl, SsrfError } from './validate-url';

describe('validateExtractionUrl', () => {
  beforeEach(() => {
    // Default: public IP returned by DNS lookup
    lookupSpy.mockResolvedValue({ address: '93.184.216.34', family: 4 });
  });

  afterEach(() => {
    lookupSpy.mockReset();
  });

  describe('valid URLs', () => {
    it('returns url and resolvedIp for a valid public https URL', async () => {
      const result = await validateExtractionUrl('https://example.com');

      expect(result.url).toBeInstanceOf(URL);
      expect(result.url.hostname).toBe('example.com');
      expect(result.resolvedIp).toBe('93.184.216.34');
    });

    it('returns url and resolvedIp for a valid public http URL', async () => {
      lookupSpy.mockResolvedValue({ address: '8.8.8.8', family: 4 });

      const result = await validateExtractionUrl('http://google.com');

      expect(result.url.hostname).toBe('google.com');
      expect(result.resolvedIp).toBe('8.8.8.8');
    });

    it('calls dns.lookup with the correct hostname', async () => {
      await validateExtractionUrl('https://example.com/path?q=1');

      expect(lookupSpy).toHaveBeenCalledWith('example.com');
    });
  });

  describe('blocked protocols', () => {
    it('throws SsrfError for ftp:// protocol', async () => {
      await expect(validateExtractionUrl('ftp://example.com')).rejects.toThrow(SsrfError);
      await expect(validateExtractionUrl('ftp://example.com')).rejects.toThrow(
        '"ftp:" is not allowed'
      );
    });

    it('throws SsrfError for file:// protocol', async () => {
      await expect(validateExtractionUrl('file:///etc/passwd')).rejects.toThrow(SsrfError);
    });

    it('throws SsrfError for javascript: protocol', async () => {
      await expect(validateExtractionUrl('javascript:alert(1)')).rejects.toThrow(SsrfError);
    });
  });

  describe('invalid URLs', () => {
    it('throws SsrfError for a completely invalid URL string', async () => {
      await expect(validateExtractionUrl('not-a-url')).rejects.toThrow(SsrfError);
      await expect(validateExtractionUrl('not-a-url')).rejects.toThrow('Invalid URL format');
    });

    it('throws SsrfError for an empty string', async () => {
      await expect(validateExtractionUrl('')).rejects.toThrow(SsrfError);
      await expect(validateExtractionUrl('')).rejects.toThrow('Invalid URL format');
    });

    it('throws SsrfError for a bare hostname with no protocol', async () => {
      await expect(validateExtractionUrl('example.com')).rejects.toThrow(SsrfError);
    });
  });

  describe('private IP literals in hostname', () => {
    it('throws SsrfError when hostname is 127.0.0.1', async () => {
      await expect(validateExtractionUrl('http://127.0.0.1')).rejects.toThrow(SsrfError);
      await expect(validateExtractionUrl('http://127.0.0.1')).rejects.toThrow(
        'private/internal IP'
      );
    });

    it('throws SsrfError when hostname is 10.0.0.1', async () => {
      await expect(validateExtractionUrl('http://10.0.0.1')).rejects.toThrow(SsrfError);
    });

    it('throws SsrfError when hostname is 192.168.1.1', async () => {
      await expect(validateExtractionUrl('http://192.168.1.1')).rejects.toThrow(SsrfError);
    });

    it('throws SsrfError when hostname is the link-local address 169.254.169.254', async () => {
      await expect(validateExtractionUrl('http://169.254.169.254')).rejects.toThrow(SsrfError);
    });

    it('throws SsrfError when hostname is 0.0.0.0', async () => {
      await expect(validateExtractionUrl('http://0.0.0.0')).rejects.toThrow(SsrfError);
    });

    it('throws SsrfError when IPv6 loopback ::1 is used and DNS resolves to a private address', async () => {
      // The URL constructor wraps IPv6 in brackets: hostname = "[::1]", which does not
      // match the /^::1$/ regex. The request therefore reaches the dns.lookup call.
      // We simulate dns returning a private address so the guard still rejects it.
      lookupSpy.mockResolvedValue({ address: '127.0.0.1', family: 4 });
      await expect(validateExtractionUrl('http://[::1]')).rejects.toThrow(SsrfError);
    });

    it('throws SsrfError for private range 172.16.0.1', async () => {
      await expect(validateExtractionUrl('http://172.16.0.1')).rejects.toThrow(SsrfError);
    });

    it('throws SsrfError for private range 172.31.255.255', async () => {
      await expect(validateExtractionUrl('http://172.31.255.255')).rejects.toThrow(SsrfError);
    });

    it('does not throw for 172.15.x (just outside the blocked 172.16-172.31 range)', async () => {
      // 172.15 passes the hostname check, dns.lookup is called and returns the mock value
      const result = await validateExtractionUrl('http://172.15.0.1');
      expect(result.resolvedIp).toBe('93.184.216.34');
    });
  });

  describe('DNS resolves to private IP', () => {
    it('throws SsrfError when DNS resolves hostname to 127.0.0.1', async () => {
      lookupSpy.mockResolvedValue({ address: '127.0.0.1', family: 4 });

      await expect(validateExtractionUrl('https://evil.example.com')).rejects.toThrow(SsrfError);
      await expect(validateExtractionUrl('https://evil.example.com')).rejects.toThrow(
        'private/internal IP'
      );
    });

    it('throws SsrfError when DNS resolves hostname to 10.0.0.1', async () => {
      lookupSpy.mockResolvedValue({ address: '10.0.0.1', family: 4 });

      await expect(validateExtractionUrl('https://internal.example.com')).rejects.toThrow(SsrfError);
    });

    it('throws SsrfError when DNS resolves hostname to 192.168.1.100', async () => {
      lookupSpy.mockResolvedValue({ address: '192.168.1.100', family: 4 });

      await expect(validateExtractionUrl('https://sneaky.example.com')).rejects.toThrow(SsrfError);
    });

    it('throws SsrfError when DNS resolves hostname to link-local 169.254.169.254', async () => {
      lookupSpy.mockResolvedValue({ address: '169.254.169.254', family: 4 });

      await expect(
        validateExtractionUrl('https://metadata.example.com')
      ).rejects.toThrow(SsrfError);
    });
  });

  describe('DNS lookup failures', () => {
    it('throws SsrfError with "Could not resolve hostname" when DNS lookup fails', async () => {
      lookupSpy.mockRejectedValue(new Error('ENOTFOUND nonexistent.example.com'));

      await expect(validateExtractionUrl('https://nonexistent.example.com')).rejects.toThrow(
        SsrfError
      );
      await expect(validateExtractionUrl('https://nonexistent.example.com')).rejects.toThrow(
        'Could not resolve hostname'
      );
    });

    it('preserves SsrfError thrown inside the DNS block without re-wrapping', async () => {
      // dns.lookup resolves successfully to a private IP, so the SsrfError is thrown
      // inside the try block and must propagate as-is (not caught and re-wrapped).
      lookupSpy.mockResolvedValue({ address: '10.10.10.10', family: 4 });

      const error = await validateExtractionUrl('https://tricky.example.com').catch((e) => e);
      expect(error).toBeInstanceOf(SsrfError);
      expect(error.message).toMatch('private/internal IP');
    });
  });
});
