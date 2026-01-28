'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useCallback, useEffect, useState } from 'react';
import { Accordion } from '@/components/Accordion';
import { BasicSettingsTab } from '@/components/BasicSettingsTab';
import { Button } from '@/components/Button';
import { Frown } from '@/components/Icons';
import { ServerPropertiesTab } from '@/components/ServerPropertiesTab';
import { Spinner } from '@/components/Spinner';
import { VersionTab } from '@/components/VersionTab';
import {
  LABEL_BACK,
  LABEL_BACK_TO_DASHBOARD,
  MSG_LOADING,
  MSG_SERVER_NOT_FOUND,
  MSG_SERVER_NOT_FOUND_DESC,
} from '@/lib/messages';
import type { ApiResponse, ServerDetails } from '@/types';

interface PageProps {
  params: Promise<{ serverId: string }>;
}

export default function EditServerPage({ params }: PageProps) {
  const router = useRouter();
  const { serverId } = use(params);

  const [server, setServer] = useState<ServerDetails | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServer = useCallback(async () => {
    try {
      const res = await fetch(`/api/servers/${serverId}`);
      const data: ApiResponse<ServerDetails> = await res.json();

      if (data.success && data.data) {
        setServer(data.data);
        setError(null);
      } else {
        setError('サーバーが見つかりません');
      }
    } catch {
      setError('サーバーの読み込みに失敗しました');
    } finally {
      setInitializing(false);
    }
  }, [serverId]);

  useEffect(() => {
    fetchServer();
  }, [fetchServer]);

  if (initializing) {
    return (
      <output className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Spinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-400">{MSG_LOADING}</p>
        </div>
      </output>
    );
  }

  if (error || !server) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" role="alert">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-6 bg-gray-800 rounded-full flex items-center justify-center">
            <Frown className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">{MSG_SERVER_NOT_FOUND}</h2>
          <p className="text-gray-400 mb-6">{error || MSG_SERVER_NOT_FOUND_DESC}</p>
          <Button onClick={() => router.push('/')}>{LABEL_BACK_TO_DASHBOARD}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
        <div className="flex items-center gap-3">
          <Link
            href={`/servers/${serverId}`}
            className="text-sm text-gray-400 hover:text-white inline-flex items-center"
          >
            {LABEL_BACK}
          </Link>
          <span className="text-gray-600">|</span>
          <h2 className="text-xl font-bold">サーバー編集</h2>
        </div>
      </div>

      <div className="space-y-4">
        {/* 基本設定 */}
        <Accordion title="基本設定" defaultOpen>
          <div className="p-4">
            <BasicSettingsTab
              serverId={serverId}
              server={server}
              onUpdate={fetchServer}
              variant="plain"
            />
          </div>
        </Accordion>

        {/* サーバー設定 */}
        <Accordion title="サーバー設定（server.properties）">
          <div className="p-4">
            <ServerPropertiesTab
              serverId={serverId}
              serverRunning={server.status.running}
              variant="plain"
            />
          </div>
        </Accordion>

        {/* バージョン */}
        <Accordion title={`バージョン管理（${server.type} ${server.version}）`}>
          <div className="p-4">
            <VersionTab
              serverId={serverId}
              currentVersion={server.version}
              serverType={server.type}
              onVersionUpdated={(newVersion) => {
                setServer((prev) => (prev ? { ...prev, version: newVersion } : null));
              }}
              variant="plain"
            />
          </div>
        </Accordion>
      </div>
    </div>
  );
}
