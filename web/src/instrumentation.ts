export async function register() {
  // サーバーサイドでのみスケジューラーを起動
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startScheduler } = await import('./lib/scheduler');
    startScheduler();
  }
}
