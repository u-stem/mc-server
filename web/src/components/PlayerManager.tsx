'use client';

import { useState } from 'react';
import type { ApiResponse } from '@/types';
import { Button } from './Button';
import { Card, CardContent, CardHeader } from './Card';
import { ConfirmDialog } from './ConfirmDialog';
import { Input } from './Input';
import { useToast } from './Toast';

interface PlayerManagerProps {
  serverId: string;
  isRunning: boolean;
  onlinePlayers: string[];
}

type PlayerAction = 'ban' | 'kick' | 'op' | 'deop' | 'pardon';

export function PlayerManager({ serverId, isRunning, onlinePlayers }: PlayerManagerProps) {
  const { addToast } = useToast();
  const [targetPlayer, setTargetPlayer] = useState('');
  const [loading, setLoading] = useState<PlayerAction | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    action: PlayerAction;
    player: string;
  } | null>(null);

  const executePlayerAction = async (action: PlayerAction, player: string) => {
    if (!isRunning) {
      addToast('error', 'サーバーが起動していません');
      return;
    }

    setLoading(action);

    const commands: Record<PlayerAction, string> = {
      ban: `ban ${player}`,
      kick: `kick ${player}`,
      op: `op ${player}`,
      deop: `deop ${player}`,
      pardon: `pardon ${player}`,
    };

    try {
      const res = await fetch(`/api/servers/${serverId}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: commands[action] }),
      });

      const data: ApiResponse<{ response: string }> = await res.json();

      if (data.success) {
        const messages: Record<PlayerAction, string> = {
          ban: `${player} をBanしました`,
          kick: `${player} をKickしました`,
          op: `${player} にOP権限を付与しました`,
          deop: `${player} のOP権限を剥奪しました`,
          pardon: `${player} のBanを解除しました`,
        };
        addToast('success', messages[action]);
        setTargetPlayer('');
      } else {
        addToast('error', data.error || 'コマンドの実行に失敗しました');
      }
    } catch (error) {
      console.error('Failed to execute player action:', error);
      addToast('error', 'コマンドの実行に失敗しました');
    } finally {
      setLoading(null);
      setConfirmAction(null);
    }
  };

  const handleAction = (action: PlayerAction, player: string) => {
    if (action === 'ban' || action === 'kick') {
      setConfirmAction({ action, player });
    } else {
      executePlayerAction(action, player);
    }
  };

  const actionLabels: Record<PlayerAction, string> = {
    ban: 'Ban',
    kick: 'Kick',
    op: 'OP付与',
    deop: 'OP剥奪',
    pardon: 'Ban解除',
  };

  return (
    <>
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-lg">プレイヤー管理</h3>
          <p className="text-sm text-gray-400 mt-1">
            {isRunning ? 'プレイヤーの管理操作' : 'サーバーが停止中です'}
          </p>
        </CardHeader>
        <CardContent>
          {/* オンラインプレイヤー */}
          {onlinePlayers.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                オンラインプレイヤー
              </p>
              <div className="space-y-2">
                {onlinePlayers.map((player) => (
                  <div
                    key={player}
                    className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-600/30 rounded flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-green-400"
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
                      <span className="font-medium">{player}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        onClick={() => handleAction('op', player)}
                        loading={loading === 'op'}
                        disabled={loading !== null || !isRunning}
                      >
                        OP
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => handleAction('kick', player)}
                        loading={loading === 'kick'}
                        disabled={loading !== null || !isRunning}
                      >
                        Kick
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => handleAction('ban', player)}
                        loading={loading === 'ban'}
                        disabled={loading !== null || !isRunning}
                      >
                        Ban
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* オフラインプレイヤー操作 */}
          <div className={onlinePlayers.length > 0 ? 'border-t border-gray-700 pt-4' : ''}>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">プレイヤー名で操作</p>
            <div className="flex gap-2">
              <Input
                placeholder="プレイヤー名"
                value={targetPlayer}
                onChange={(e) => setTargetPlayer(e.target.value)}
                disabled={!isRunning}
                className="flex-1"
              />
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <Button
                variant="ghost"
                onClick={() => handleAction('op', targetPlayer)}
                loading={loading === 'op'}
                disabled={!targetPlayer.trim() || loading !== null || !isRunning}
              >
                OP付与
              </Button>
              <Button
                variant="ghost"
                onClick={() => handleAction('deop', targetPlayer)}
                loading={loading === 'deop'}
                disabled={!targetPlayer.trim() || loading !== null || !isRunning}
              >
                OP剥奪
              </Button>
              <Button
                variant="ghost"
                onClick={() => handleAction('pardon', targetPlayer)}
                loading={loading === 'pardon'}
                disabled={!targetPlayer.trim() || loading !== null || !isRunning}
              >
                Ban解除
              </Button>
              <Button
                variant="danger"
                onClick={() => handleAction('ban', targetPlayer)}
                loading={loading === 'ban'}
                disabled={!targetPlayer.trim() || loading !== null || !isRunning}
              >
                Ban
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmAction !== null}
        title={`${confirmAction?.player} を${confirmAction ? actionLabels[confirmAction.action] : ''}しますか？`}
        message={
          confirmAction?.action === 'ban'
            ? `${confirmAction.player} をBanすると、このプレイヤーはサーバーに接続できなくなります。`
            : `${confirmAction?.player} をKickすると、このプレイヤーはサーバーから切断されます。`
        }
        confirmLabel={confirmAction ? actionLabels[confirmAction.action] : ''}
        variant="danger"
        loading={loading !== null}
        onConfirm={() =>
          confirmAction && executePlayerAction(confirmAction.action, confirmAction.player)
        }
        onCancel={() => setConfirmAction(null)}
      />
    </>
  );
}
