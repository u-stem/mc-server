import { describe, expect, it } from 'vitest';
import { withFileLock } from './fileLock';

describe('withFileLock', () => {
  it('returns the value from the callback', async () => {
    const result = await withFileLock('test-key', async () => 42);

    expect(result).toBe(42);
  });

  it('serializes concurrent calls with the same key', async () => {
    const order: number[] = [];

    const task1 = withFileLock('same-key', async () => {
      order.push(1);
      await new Promise((r) => setTimeout(r, 50));
      order.push(2);
    });

    const task2 = withFileLock('same-key', async () => {
      order.push(3);
    });

    await Promise.all([task1, task2]);

    expect(order).toEqual([1, 2, 3]);
  });

  it('serializes three concurrent tasks correctly', async () => {
    const order: number[] = [];

    const task1 = withFileLock('race-key', async () => {
      order.push(1);
      await new Promise((r) => setTimeout(r, 30));
      order.push(2);
    });

    const task2 = withFileLock('race-key', async () => {
      order.push(3);
      await new Promise((r) => setTimeout(r, 30));
      order.push(4);
    });

    const task3 = withFileLock('race-key', async () => {
      order.push(5);
      await new Promise((r) => setTimeout(r, 30));
      order.push(6);
    });

    await Promise.all([task1, task2, task3]);

    expect(order).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('allows concurrent execution for different keys', async () => {
    const order: string[] = [];

    const task1 = withFileLock('key-a', async () => {
      order.push('a-start');
      await new Promise((r) => setTimeout(r, 50));
      order.push('a-end');
    });

    const task2 = withFileLock('key-b', async () => {
      order.push('b-start');
      await new Promise((r) => setTimeout(r, 50));
      order.push('b-end');
    });

    await Promise.all([task1, task2]);

    expect(order.indexOf('b-start')).toBeLessThan(order.indexOf('a-end'));
  });

  it('releases the lock when the callback throws', async () => {
    await expect(
      withFileLock('error-key', async () => {
        throw new Error('fail');
      })
    ).rejects.toThrow('fail');

    const result = await withFileLock('error-key', async () => 'ok');
    expect(result).toBe('ok');
  });
});
