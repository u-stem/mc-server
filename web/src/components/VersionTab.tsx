'use client';

import { useState } from 'react';
import type { ApiResponse, VersionUpdateResponse } from '@/types';
import { Button } from './Button';
import { Card, CardContent, CardHeader } from './Card';
import { ConfirmDialog } from './ConfirmDialog';
import { Input } from './Input';
import { useToast } from './Toast';

interface VersionTabProps {
  serverId: string;
  currentVersion: string;
  serverType: string;
  onVersionUpdated?: (newVersion: string) => void;
}

function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
}

export function VersionTab({
  serverId,
  currentVersion,
  serverType,
  onVersionUpdated,
}: VersionTabProps) {
  const { addToast } = useToast();
  const [newVersion, setNewVersion] = useState(currentVersion);
  const [updating, setUpdating] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [createBackup, setCreateBackup] = useState(true);

  const versionChanged = newVersion !== currentVersion;
  const isDowngrade = versionChanged && compareVersions(newVersion, currentVersion) < 0;
  const isValidVersion = /^\d+\.\d+(\.\d+)?$/.test(newVersion);

  const handleUpdate = async () => {
    if (!isValidVersion) {
      addToast('error', 'バージョン形式が正しくありません（例: 1.21.1）');
      return;
    }

    setUpdating(true);
    setShowConfirm(false);

    try {
      const res = await fetch(`/api/servers/${serverId}/version`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version: newVersion,
          createBackup,
        }),
      });

      const data: ApiResponse<VersionUpdateResponse> = await res.json();

      if (data.success && data.data) {
        const { previousVersion, newVersion: updatedVersion, backupPath } = data.data;

        let message = `バージョンを ${previousVersion} から ${updatedVersion} に更新しました`;
        if (backupPath) {
          message += `（バックアップ作成済み）`;
        }

        addToast('success', message);
        onVersionUpdated?.(updatedVersion);
      } else {
        addToast('error', data.error || 'バージョン更新に失敗しました');
      }
    } catch {
      addToast('error', 'バージョン更新に失敗しました');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <h3 className="font-semibold">バージョン管理</h3>
            <p className="text-sm text-gray-400 mt-1">
              {serverType} {currentVersion}
            </p>
          </div>
          <Button
            onClick={() => setShowConfirm(true)}
            disabled={!versionChanged || !isValidVersion || updating}
            loading={updating}
          >
            バージョンを更新
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              label="新しいバージョン"
              type="text"
              value={newVersion}
              onChange={(e) => setNewVersion(e.target.value)}
              placeholder="例: 1.21.1"
              error={newVersion && !isValidVersion ? 'バージョン形式が正しくありません' : undefined}
            />

            {isDowngrade && (
              <div className="p-3 bg-yellow-900/30 border border-yellow-700 rounded-lg text-yellow-400 text-sm">
                <strong>警告:</strong> ダウングレードしようとしています。
                ワールドデータに互換性の問題が発生する可能性があります。
              </div>
            )}

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={createBackup}
                onChange={(e) => setCreateBackup(e.target.checked)}
                className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-green-500 focus:ring-green-500"
              />
              <span className="text-sm">更新前にフルバックアップを作成（推奨）</span>
            </label>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={showConfirm}
        title="バージョンを更新"
        message={`${serverType} ${currentVersion} から ${serverType} ${newVersion} に更新します。${
          createBackup ? 'バックアップが作成されます。' : ''
        }${isDowngrade ? '\n\n警告: ダウングレードはワールドデータに問題を引き起こす可能性があります。' : ''}\n\nサーバーは自動的に再起動されます。`}
        confirmLabel="更新する"
        variant={isDowngrade ? 'warning' : 'default'}
        loading={updating}
        onConfirm={handleUpdate}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
}
