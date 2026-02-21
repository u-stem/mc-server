// Serialize file operations on the same key using a promise-chain lock
const fileLocks = new Map<string, Promise<unknown>>();

export async function withFileLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const previous = fileLocks.get(key) ?? Promise.resolve();
  let release!: () => void;
  const lock = new Promise<void>((r) => {
    release = r;
  });
  // synchronously chain: get -> set ensures no race between await and set
  fileLocks.set(key, lock);
  try {
    await previous;
    return await fn();
  } finally {
    if (fileLocks.get(key) === lock) {
      fileLocks.delete(key);
    }
    release();
  }
}
