'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { UI_ACTION_DELAY_MS } from '@/lib/constants';
import type { ServerDetails } from '@/types';
import { Button } from './Button';
import { Card, CardContent, CardHeader } from './Card';
import { ConfirmDialog } from './ConfirmDialog';
import { StatusBadge } from './StatusBadge';
import { useToast } from './Toast';

interface ServerCardProps {
  server: ServerDetails;
  onRefresh: () => void;
}

export function ServerCard({ server, onRefresh }: ServerCardProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [loading, setLoading] = useState<'start' | 'stop' | null>(null);
  const [showStopConfirm, setShowStopConfirm] = useState(false);

  const handleStart = async () => {
    setLoading('start');
    try {
      const res = await fetch(`/api/servers/${server.id}/start`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to start');
      addToast('success', `${server.name} を起動しています...`);
      setTimeout(onRefresh, UI_ACTION_DELAY_MS);
    } catch (error) {
      console.error('Failed to start server:', error);
      addToast('error', 'サーバーの起動に失敗しました');
    } finally {
      setLoading(null);
    }
  };

  const handleStop = async () => {
    setLoading('stop');
    try {
      const res = await fetch(`/api/servers/${server.id}/stop`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to stop');
      addToast('success', `${server.name} を停止しました`);
      setTimeout(onRefresh, UI_ACTION_DELAY_MS);
    } catch (error) {
      console.error('Failed to stop server:', error);
      addToast('error', 'サーバーの停止に失敗しました');
    } finally {
      setLoading(null);
      setShowStopConfirm(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-lg">{server.name}</h3>
              <p className="text-sm text-gray-400">
                {server.type} {server.version}
              </p>
            </div>
          </div>
          <StatusBadge running={server.status.running} />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">ポート</p>
              <p className="text-sm font-mono">{server.port}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">プレイヤー</p>
              <p className="text-sm">
                {server.status.players.online} / {server.maxPlayers}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">メモリ</p>
              <p className="text-sm font-mono">{server.memory}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">稼働時間</p>
              <p className="text-sm">{server.status.uptime || '-'}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {server.status.running ? (
              <Button
                variant="danger"
                onClick={() => setShowStopConfirm(true)}
                loading={loading === 'stop'}
                disabled={loading !== null}
              >
                停止
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleStart}
                loading={loading === 'start'}
                disabled={loading !== null}
              >
                起動
              </Button>
            )}
            <Button variant="ghost" onClick={() => router.push(`/servers/${server.id}`)}>
              詳細
            </Button>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={showStopConfirm}
        title="サーバーを停止しますか？"
        message={`${server.name} を停止します。接続中のプレイヤーは切断されます。`}
        confirmLabel="停止する"
        variant="danger"
        loading={loading === 'stop'}
        onConfirm={handleStop}
        onCancel={() => setShowStopConfirm(false)}
      />
    </>
  );
}
