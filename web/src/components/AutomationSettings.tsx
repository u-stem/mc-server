'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ApiResponse, AutomationConfig } from '@/types';
import { DEFAULT_AUTOMATION_CONFIG } from '@/types';
import { AutoBackupSettings } from './AutoBackupSettings';
import { Card, CardContent, CardHeader } from './Card';
import { DiscordSettings } from './DiscordSettings';
import { HealthCheckSettings } from './HealthCheckSettings';
import { PluginUpdateSettings } from './PluginUpdateSettings';
import { Spinner } from './Spinner';
import { useToast } from './Toast';

interface AutomationSettingsProps {
  serverId: string;
  serverType: string;
}

export function AutomationSettings({ serverId, serverType }: AutomationSettingsProps) {
  const { addToast } = useToast();
  const [config, setConfig] = useState<AutomationConfig>(DEFAULT_AUTOMATION_CONFIG);
  const [loading, setLoading] = useState(true);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch(`/api/servers/${serverId}/automation`);
      const data: ApiResponse<AutomationConfig> = await res.json();

      if (data.success && data.data) {
        setConfig(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch automation config:', error);
      addToast('error', 'オートメーション設定の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [serverId, addToast]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const saveConfig = async (updates: Partial<AutomationConfig>) => {
    try {
      const res = await fetch(`/api/servers/${serverId}/automation`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const data: ApiResponse<AutomationConfig> = await res.json();

      if (data.success && data.data) {
        setConfig(data.data);
        addToast('success', '設定を保存しました');
        return true;
      } else {
        addToast('error', data.error || '保存に失敗しました');
        return false;
      }
    } catch {
      addToast('error', '保存に失敗しました');
      return false;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // プラグインサーバーかどうかを判定
  const isPluginServer = ['SPIGOT', 'PAPER', 'PURPUR', 'FOLIA'].includes(serverType);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-lg">オートメーション</h3>
          <p className="text-sm text-gray-400 mt-1">
            Discord通知、自動バックアップ、ヘルスチェックなどの自動化設定
          </p>
        </CardHeader>
      </Card>

      <DiscordSettings
        serverId={serverId}
        config={config.discord}
        onSave={(discord) => saveConfig({ discord })}
      />

      <AutoBackupSettings config={config.backup} onSave={(backup) => saveConfig({ backup })} />

      <HealthCheckSettings
        serverId={serverId}
        config={config.healthCheck}
        onSave={(healthCheck) => saveConfig({ healthCheck })}
      />

      {isPluginServer && (
        <PluginUpdateSettings
          serverId={serverId}
          config={config.pluginUpdate}
          onSave={(pluginUpdate) => saveConfig({ pluginUpdate })}
        />
      )}
    </div>
  );
}
