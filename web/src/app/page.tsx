'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/Button';
import { ServerCard } from '@/components/ServerCard';
import { Spinner } from '@/components/Spinner';
import { POLLING_INTERVAL_DASHBOARD } from '@/lib/constants';
import type { ApiResponse, ServerDetails } from '@/types';

export default function Dashboard() {
  const router = useRouter();
  const [servers, setServers] = useState<ServerDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServers = useCallback(async () => {
    try {
      const res = await fetch('/api/servers');
      const data: ApiResponse<ServerDetails[]> = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch servers');
      }

      setServers(data.data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServers();

    // 定期的に自動更新
    const interval = setInterval(fetchServers, POLLING_INTERVAL_DASHBOARD);
    return () => clearInterval(interval);
  }, [fetchServers]);

  if (loading) {
    return (
      <output
        className="flex items-center justify-center min-h-[400px]"
        aria-live="polite"
        aria-busy="true"
      >
        <div className="text-center">
          <Spinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-400">サーバーを読み込み中...</p>
        </div>
      </output>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" role="alert">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Button onClick={fetchServers}>再試行</Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">サーバー一覧</h2>
          <p className="text-gray-400 text-sm mt-1">{servers.length} 件のサーバー</p>
        </div>
        <Button onClick={() => router.push('/servers/new')}>新規作成</Button>
      </div>

      {servers.length === 0 ? (
        <div className="text-center py-12 bg-gray-800/50 rounded-xl border border-gray-700">
          <p className="text-gray-400">サーバーがまだ登録されていません</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {servers.map((server) => (
            <ServerCard key={server.id} server={server} onRefresh={fetchServers} />
          ))}
        </div>
      )}
    </div>
  );
}
