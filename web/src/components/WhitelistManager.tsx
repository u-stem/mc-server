'use client';

import { useCallback, useEffect, useState } from 'react';
import { MSG_LOADING, MSG_NO_PLAYERS } from '@/lib/messages';
import type { ApiResponse, WhitelistEntry } from '@/types';
import { Button } from './Button';
import { Card, CardContent, CardHeader } from './Card';
import { ConfirmDialog } from './ConfirmDialog';
import { EmptyState } from './EmptyState';
import { Input } from './Input';
import { useToast } from './Toast';

interface WhitelistManagerProps {
  serverId: string;
}

export function WhitelistManager({ serverId }: WhitelistManagerProps) {
  const { addToast } = useToast();
  const [players, setPlayers] = useState<WhitelistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [playerToRemove, setPlayerToRemove] = useState<string | null>(null);
  const [newPlayer, setNewPlayer] = useState('');

  const fetchWhitelist = useCallback(async () => {
    try {
      const res = await fetch(`/api/servers/${serverId}/whitelist`);
      const data: ApiResponse<WhitelistEntry[]> = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch whitelist');
      }

      setPlayers(data.data || []);
    } catch (err) {
      addToast('error', 'ホワイトリストの取得に失敗しました');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [serverId, addToast]);

  useEffect(() => {
    fetchWhitelist();
  }, [fetchWhitelist]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const playerName = newPlayer.trim();
    if (!playerName || adding) return;

    setAdding(true);

    try {
      const res = await fetch(`/api/servers/${serverId}/whitelist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: playerName }),
      });

      const data: ApiResponse = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to add player');
      }

      addToast('success', `${playerName} をホワイトリストに追加しました`);
      setNewPlayer('');
      await fetchWhitelist();
    } catch (err) {
      console.error('Whitelist add error:', err);
      const message = err instanceof Error ? err.message : 'プレイヤーの追加に失敗しました';
      addToast('error', message);
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (name: string) => {
    if (removing) return;
    setRemoving(name);

    try {
      const res = await fetch(`/api/servers/${serverId}/whitelist/${encodeURIComponent(name)}`, {
        method: 'DELETE',
      });

      const data: ApiResponse = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to remove player');
      }

      addToast('success', `${name} をホワイトリストから削除しました`);
      await fetchWhitelist();
    } catch (err) {
      console.error('Whitelist remove error:', err);
      const message = err instanceof Error ? err.message : 'プレイヤーの削除に失敗しました';
      addToast('error', message);
    } finally {
      setRemoving(null);
      setPlayerToRemove(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-lg">ホワイトリスト</h3>
          <p className="text-sm text-gray-400 mt-1">{players.length} 人のプレイヤー</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="flex gap-2 mb-4">
            <Input
              placeholder="プレイヤー名"
              value={newPlayer}
              onChange={(e) => setNewPlayer(e.target.value)}
              disabled={adding}
              className="flex-1"
            />
            <Button type="submit" loading={adding} disabled={!newPlayer.trim()}>
              追加
            </Button>
          </form>

          {loading ? (
            <EmptyState message={MSG_LOADING} />
          ) : players.length === 0 ? (
            <EmptyState message={MSG_NO_PLAYERS} />
          ) : (
            <ul className="space-y-2">
              {players.map((player) => (
                <li
                  key={player.name}
                  className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-600 rounded flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <span className="font-medium">{player.name}</span>
                  </div>
                  <Button
                    variant="danger"
                    onClick={() => setPlayerToRemove(player.name)}
                    loading={removing === player.name}
                    disabled={removing !== null}
                  >
                    削除
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={playerToRemove !== null}
        title="プレイヤーを削除しますか？"
        message={`${playerToRemove} をホワイトリストから削除します。このプレイヤーはサーバーに接続できなくなります。`}
        confirmLabel="削除する"
        variant="danger"
        loading={removing !== null}
        onConfirm={() => playerToRemove && handleRemove(playerToRemove)}
        onCancel={() => setPlayerToRemove(null)}
      />
    </>
  );
}
