'use client';

import { Archive } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { MSG_LOADING, MSG_NO_BACKUPS } from '@/lib/messages';
import { formatDate, formatSize } from '@/lib/utils';
import type { ApiResponse, BackupInfo } from '@/types';
import { Alert } from './Alert';
import { Button } from './Button';
import { Card, CardContent, CardHeader } from './Card';
import { EmptyState } from './EmptyState';

interface BackupManagerProps {
  serverId: string;
}

export function BackupManager({ serverId }: BackupManagerProps) {
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBackups = useCallback(async () => {
    try {
      const res = await fetch(`/api/servers/${serverId}/backups`);
      const data: ApiResponse<BackupInfo[]> = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch backups');
      }

      setBackups(data.data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [serverId]);

  useEffect(() => {
    fetchBackups();
  }, [fetchBackups]);

  const handleCreate = async () => {
    setCreating(true);
    setError(null);

    try {
      const res = await fetch(`/api/servers/${serverId}/backups`, {
        method: 'POST',
      });

      const data: ApiResponse<BackupInfo> = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to create backup');
      }

      await fetchBackups();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">バックアップ</h3>
          <p className="text-sm text-gray-400 mt-1">{backups.length} 件のバックアップ</p>
        </div>
        <Button onClick={handleCreate} loading={creating} disabled={creating}>
          バックアップ作成
        </Button>
      </CardHeader>
      <CardContent>
        {error && <Alert variant="error">{error}</Alert>}

        {loading ? (
          <EmptyState message={MSG_LOADING} />
        ) : backups.length === 0 ? (
          <EmptyState message={MSG_NO_BACKUPS} />
        ) : (
          <ul className="space-y-2">
            {backups.map((backup) => (
              <li
                key={backup.id}
                className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                    <Archive className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{backup.filename}</p>
                    <p className="text-xs text-gray-400">
                      {formatDate(backup.createdAt)} · {formatSize(backup.size)}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
