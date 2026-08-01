import { apiService } from '../api';

function jsonResponse(status: number, body: any): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

describe('ApiService retry behavior', () => {
  beforeEach(() => {
    apiService.clearCache();
    (global as any).fetch = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('retries a GET after network failures and resolves once a later attempt succeeds', async () => {
    jest.useFakeTimers();
    const fetchMock = (global.fetch as jest.Mock)
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(jsonResponse(200, { data: { totalIncome: 100 } }));

    const promise = apiService.analytics.weekly();
    await jest.advanceTimersByTimeAsync(300);
    await jest.advanceTimersByTimeAsync(800);
    const result = await promise;

    expect(result).toEqual({ totalIncome: 100 });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('retries a GET on a 5xx response and eventually throws once retries are exhausted', async () => {
    jest.useFakeTimers();
    const fetchMock = (global.fetch as jest.Mock).mockResolvedValue(
      jsonResponse(503, { error: 'Service unavailable' }),
    );

    const promise = apiService.analytics.weekly().catch((e) => e);
    await jest.advanceTimersByTimeAsync(300);
    await jest.advanceTimersByTimeAsync(800);
    const result = await promise;

    expect(result).toBeInstanceOf(Error);
    expect((result as Error).message).toBe('Service unavailable');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('does not retry a GET on a 4xx client error', async () => {
    const fetchMock = (global.fetch as jest.Mock).mockResolvedValue(
      jsonResponse(400, { error: 'Invalid date' }),
    );

    await expect(apiService.analytics.weekly()).rejects.toThrow('Invalid date');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('never retries a mutating POST request, even on a network failure', async () => {
    const fetchMock = (global.fetch as jest.Mock).mockRejectedValue(
      new TypeError('Failed to fetch'),
    );

    await expect(
      apiService.transactions.create({
        amount: 10,
        type: 'expense',
        categoryId: 'food',
        date: new Date().toISOString(),
      } as any),
    ).rejects.toThrow();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
