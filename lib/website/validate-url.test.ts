import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as dns from 'dns';
import { validateExtractionUrl, SsrfError } from './validate-url';

describe('SsrfError', () => {
  it('is an instance of Error', () => {
    const err = new SsrfError('test');
    expect(err).toBeInstanceOf(Error);
  });

  it('has name "SsrfError"', () => {
    const err = new SsrfError('test');
    expect(err.name).toBe('SsrfError');
  });

  it('preserves the message', () => {
    const err = new SsrfError('blocked!');
    expect(err.message).toBe('blocked!');
  });
});

describe('validateExtractionUrl', () => {
  let lookupSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    lookupSpy = vi.spyOn(dns.promises, 'lookup');
  });

  afterEach(() => {
    lookupSpy.mockRestore();
  });

  it('resolves with url and resolvedIp for a public hostname', async () => {
    lookupSpy.mockResolvedValue({ address: '93.184.216.34', family: 4 });
    const result = await validateExtractionUrl('https://example.com');
    expect(result.url.hostname).toBe('example.com');
    expect(result.resolvedIp).toBe('93.184.216.34');
  });

  it('throws SsrfError for an invalid URL', async () => {
    await expect(validateExtractionUrl('not-a-url')).rejects.toThrow(SsrfError);
    await expect(validateExtractionUrl('not-a-url')).rejects.toThrow('Invalid URL format');
  });

  it('throws SsrfError for non-http/https protocols', async () => {
    await expect(validateExtractionUrl('ftp://example.com')).rejects.toThrow(SsrfError);
    await expect(validateExtractionUrl('file:///etc/passwd')).rejects.toThrow(SsrfError);
  });

  it('throws SsrfError when bare IP is in the 127.x range', async () => {
    await expect(validateExtractionUrl('http://127.0.0.1')).rejects.toThrow(SsrfError);
  });

  it('throws SsrfError when bare IP is in the 10.x private range', async () => {
    await expect(validateExtractionUrl('http://10.0.0.1')).rejects.toThrow(SsrfError);
  });

  it('throws SsrfError when bare IP is in the 192.168.x range', async () => {
    await expect(validateExtractionUrl('http://192.168.1.1')).rejects.toThrow(SsrfError);
  });

  it('throws SsrfError when bare IP is in the 172.16-31.x range', async () => {
    await expect(validateExtractionUrl('http://172.16.0.1')).rejects.toThrow(SsrfError);
    await expect(validateExtractionUrl('http://172.31.255.255')).rejects.toThrow(SsrfError);
  });

  it('throws SsrfError when bare IP is the link-local 169.254.x range', async () => {
    await expect(validateExtractionUrl('http://169.254.169.254')).rejects.toThrow(SsrfError);
  });

  it('throws SsrfError when DNS resolves to a private address', async () => {
    lookupSpy.mockResolvedValue({ address: '192.168.0.100', family: 4 });
    await expect(validateExtractionUrl('https://evil.internal')).rejects.toThrow(SsrfError);
    await expect(validateExtractionUrl('https://evil.internal')).rejects.toThrow(
      'private/internal'
    );
  });

  it('throws SsrfError when DNS lookup fails', async () => {
    lookupSpy.mockRejectedValue(new Error('ENOTFOUND'));
    await expect(validateExtractionUrl('https://no-such-host.example')).rejects.toThrow(SsrfError);
    await expect(validateExtractionUrl('https://no-such-host.example')).rejects.toThrow(
      'Could not resolve hostname'
    );
  });

  it('passes through the SsrfError when DNS resolves private (does not double-wrap)', async () => {
    lookupSpy.mockResolvedValue({ address: '10.0.0.1', family: 4 });
    const err = await validateExtractionUrl('https://sneaky.example').catch((e) => e);
    expect(err).toBeInstanceOf(SsrfError);
    expect(err.name).toBe('SsrfError');
  });

  it('accepts http:// scheme for public IPs', async () => {
    lookupSpy.mockResolvedValue({ address: '8.8.8.8', family: 4 });
    await expect(validateExtractionUrl('http://public.example.com')).resolves.toBeDefined();
  });
});
