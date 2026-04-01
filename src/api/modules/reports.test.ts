import { describe, expect, it, vi } from 'vitest';
import { exportPdfReport } from './reports';

describe('exportPdfReport', () => {
  it('只提交最小报告参数，不再把正文和分析细节发给后端', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(new Blob(['pdf']), {
        status: 200,
        headers: { 'content-type': 'application/pdf' },
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    await exportPdfReport({
      reportType: 'history',
      historyId: 42,
      locale: 'zh-CN',
    });

    const [, requestOptions] = fetchMock.mock.calls[0];
    expect(requestOptions?.method).toBe('POST');
    expect(requestOptions?.credentials).toBe('include');
    expect(JSON.parse(String(requestOptions?.body))).toEqual({
      reportType: 'history',
      historyId: 42,
      locale: 'zh-CN',
    });
  });
});
