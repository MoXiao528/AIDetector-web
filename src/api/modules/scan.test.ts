import { afterEach, describe, expect, it, vi } from 'vitest';
import { detectText } from './scan';
import type { EvidenceResult } from './scan';
import { getHistoryList, getHistoryRecord, updateHistoryRecord } from './history';

const failedEvidence: EvidenceResult = {
  status: 'failed',
  artifactVersion: null,
  featureSchemaVersion: 1,
  route: null,
  quality: { level: 'unavailable', coverage: 0, reasons: ['timeout'] },
  signals: [],
  patterns: null,
};

describe('detectText guest identity pinning', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    window.localStorage.clear();
  });

  it('显式 guest token 不会被另一个标签刚写入的 token 覆盖', async () => {
    const response = { score: 0.1, label: 'human', evidence: failedEvidence };
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(response), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    );
    vi.stubGlobal('fetch', fetchMock);
    window.localStorage.setItem('guest_token', 'guest-b-token');

    const payload = {
      text: 'guest A private text',
      functions: ['scan'],
      editorHtml: '<p>guest A private text</p>',
    };
    const result = await detectText(
      payload,
      'guest-a-token',
      '11111111-1111-4111-8111-111111111111'
    );

    expect(result).toEqual(response);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/detect');
    const requestOptions = fetchMock.mock.calls[0][1];
    expect(requestOptions.method).toBe('POST');
    expect(requestOptions.credentials).toBe('include');
    expect(JSON.parse(requestOptions.body)).toEqual(payload);
    expect(new Headers(requestOptions?.headers).get('Authorization')).toBe('Bearer guest-a-token');
    expect(new Headers(requestOptions?.headers).get('Idempotency-Key')).toBe(
      '11111111-1111-4111-8111-111111111111'
    );
  });

  it('账号检测不会携带残留的 guest token', async () => {
    const response = { score: 0.1, label: 'human' };
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(response), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    );
    vi.stubGlobal('fetch', fetchMock);
    window.localStorage.setItem('auth_session', '1');
    window.localStorage.setItem('guest_token', 'residual-guest-token');

    const result = await detectText(
      { text: 'account text', functions: ['scan'] },
      '',
      '22222222-2222-4222-8222-222222222222'
    );

    expect(result).toEqual(response);
    expect(result).not.toHaveProperty('evidence');
    const requestOptions = fetchMock.mock.calls[0][1];
    expect(JSON.parse(requestOptions.body)).toEqual({ text: 'account text', functions: ['scan'] });
    expect(new Headers(requestOptions?.headers).has('Authorization')).toBe(false);
    expect(new Headers(requestOptions?.headers).get('Idempotency-Key')).toBe(
      '22222222-2222-4222-8222-222222222222'
    );
  });
});

describe('detection request timeout budget', () => {
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it.each([false, true])('20 秒响应仍返回原主结果（降级 Evidence=%s）', async (hasEvidence) => {
    vi.useFakeTimers();
    const response = { score: 0.23, label: 'human', ...(hasEvidence ? { evidence: failedEvidence } : {}) };
    vi.stubGlobal('fetch', vi.fn((_url, { signal }: RequestInit) => new Promise<Response>((resolve, reject) => {
      const timer = setTimeout(() => resolve(new Response(JSON.stringify(response), {
        status: 200, headers: { 'content-type': 'application/json' },
      })), 20000);
      signal!.addEventListener('abort', () => {
        clearTimeout(timer);
        reject(new DOMException('Aborted', 'AbortError'));
      }, { once: true });
    })));
    const outcome = detectText({ text: 'slow detection', functions: ['scan'] }, '', 'timeout-budget')
      .then((value) => ({ value }), (error) => ({ error }));

    await vi.advanceTimersByTimeAsync(20000);

    expect(await outcome).toEqual({ value: response });
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each([
    { name: '检测', timeout: 180000, call: () => detectText({ text: 'timeout', functions: ['scan'] }, '', 'timeout-budget') },
    { name: '历史', timeout: 15000, call: () => getHistoryList() },
  ])('$name 在 $timeout 毫秒才中止，沿用原 408 错误链', async ({ timeout, call }) => {
    vi.useFakeTimers();
    let requestSignal: AbortSignal;
    vi.stubGlobal('fetch', vi.fn((_url, { signal }: RequestInit) => new Promise<Response>((_resolve, reject) => {
      requestSignal = signal!;
      signal!.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
    })));
    const outcome = call().catch((error) => error);

    await vi.advanceTimersByTimeAsync(timeout - 1);
    expect(requestSignal.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(requestSignal.aborted).toBe(true);
    expect(await outcome).toMatchObject({ status: 408, code: 'UNKNOWN_ERROR' });
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('history Evidence snapshot passthrough', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    window.localStorage.clear();
  });

  it.each([
    { name: '列表', call: () => getHistoryList(), path: '/api/v1/history', method: 'GET' },
    { name: '详情', call: () => getHistoryRecord(7), path: '/api/v1/history/7', method: 'GET' },
    {
      name: '改名',
      call: () => updateHistoryRecord(7, { title: 'renamed' }),
      path: '/api/v1/history/7',
      method: 'PATCH',
    },
  ])('$name 原样返回根级 Evidence，也兼容缺失和 null', async ({ name, call, path, method }) => {
    for (const evidence of [failedEvidence, undefined, null]) {
      const record = {
        id: 7,
        title: 'renamed',
        analysis: { summary: { ai: 10, human: 90 } },
        ...(evidence === undefined ? {} : { evidence }),
      };
      const response =
        name === '列表' ? { items: [record], page: 1, perPage: 20, totalPages: 1, total: 1 } : record;
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(response), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      );
      vi.stubGlobal('fetch', fetchMock);

      expect(await call()).toEqual(response);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock.mock.calls[0][0]).toBe(path);
      const requestOptions = fetchMock.mock.calls[0][1];
      expect(requestOptions.method).toBe(method);
      expect(requestOptions.body).toBe(method === 'PATCH' ? JSON.stringify({ title: 'renamed' }) : undefined);
    }
  });
});
