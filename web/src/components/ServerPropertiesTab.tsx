'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ApiResponse, PropertyCategory } from '@/types';
import { PROPERTY_CATEGORIES } from '@/types';
import { Button } from './Button';
import { Card, CardContent, CardHeader } from './Card';
import { Input } from './Input';
import { Select } from './Select';
import { useToast } from './Toast';

interface ServerPropertiesTabProps {
  serverId: string;
  serverRunning?: boolean;
  /** 'card' = Card wrapper付き (default), 'plain' = wrapper無し */
  variant?: 'card' | 'plain';
}

interface ServerProperties {
  [key: string]: string | number | boolean;
}

export function ServerPropertiesTab({
  serverId,
  serverRunning,
  variant = 'card',
}: ServerPropertiesTabProps) {
  const { addToast } = useToast();
  const [properties, setProperties] = useState<ServerProperties | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeCategory, setActiveCategory] = useState<PropertyCategory>('gameplay');

  const fetchProperties = useCallback(async () => {
    try {
      const res = await fetch(`/api/servers/${serverId}/properties`);
      const data: ApiResponse<ServerProperties> = await res.json();
      if (data.success && data.data) {
        setProperties(data.data);
      }
    } catch {
      addToast('error', 'サーバー設定の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [serverId, addToast]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const handlePropertyChange = (key: string, value: string | number | boolean) => {
    if (!properties) return;
    setProperties({ ...properties, [key]: value });
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!properties || !hasChanges) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/servers/${serverId}/properties`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(properties),
      });

      const data: ApiResponse<ServerProperties> = await res.json();

      if (data.success) {
        setProperties(data.data || properties);
        setHasChanges(false);
        addToast('success', '設定を保存しました。変更を反映するにはサーバーを再起動してください。');
      } else {
        addToast('error', data.error || '設定の保存に失敗しました');
      }
    } catch {
      addToast('error', '設定の保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    fetchProperties();
    setHasChanges(false);
  };

  const renderProperty = (
    prop: (typeof PROPERTY_CATEGORIES)[PropertyCategory]['properties'][number]
  ) => {
    if (!properties) return null;
    const value = properties[prop.key as keyof ServerProperties];

    switch (prop.type) {
      case 'boolean':
        return (
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={value as boolean}
              onChange={(e) => handlePropertyChange(prop.key, e.target.checked)}
              className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-green-500 focus:ring-green-500"
            />
            <span>{prop.label}</span>
          </label>
        );
      case 'select':
        return (
          <Select
            label={prop.label}
            value={value as string}
            onChange={(e) => handlePropertyChange(prop.key, e.target.value)}
            options={(prop.options ?? []).map((opt) => ({ value: opt, label: opt }))}
          />
        );
      case 'number':
        return (
          <Input
            label={prop.label}
            type="number"
            value={value as number}
            onChange={(e) => handlePropertyChange(prop.key, parseInt(e.target.value, 10) || 0)}
            min={prop.min}
            max={prop.max}
          />
        );
      default:
        return (
          <Input
            label={prop.label}
            type="text"
            value={value as string}
            onChange={(e) => handlePropertyChange(prop.key, e.target.value)}
          />
        );
    }
  };

  const categories = Object.entries(PROPERTY_CATEGORIES) as [
    PropertyCategory,
    (typeof PROPERTY_CATEGORIES)[PropertyCategory],
  ][];

  const content = (
    <>
      {variant === 'plain' && (
        <div className="flex justify-end gap-2 mb-4">
          {hasChanges && (
            <Button variant="ghost" onClick={handleReset} disabled={saving}>
              リセット
            </Button>
          )}
          <Button onClick={handleSave} loading={saving} disabled={!hasChanges}>
            保存
          </Button>
        </div>
      )}
      {loading ? (
        <div className="text-center py-8 text-gray-400">読み込み中...</div>
      ) : !properties ? (
        <div className="text-center py-8 text-gray-400">設定を読み込めませんでした</div>
      ) : (
        <>
          {serverRunning && hasChanges && (
            <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-700 rounded-lg text-yellow-400 text-sm">
              サーバーが起動中です。設定の変更を反映するには再起動が必要です。
            </div>
          )}

          <div className="flex gap-2 mb-6 border-b border-gray-700 pb-4 overflow-x-auto">
            {categories.map(([key, category]) => (
              <button
                type="button"
                key={key}
                onClick={() => setActiveCategory(key)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors whitespace-nowrap ${
                  activeCategory === key
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {PROPERTY_CATEGORIES[activeCategory].properties.map((prop) => (
              <div key={prop.key}>{renderProperty(prop)}</div>
            ))}
          </div>
        </>
      )}
    </>
  );

  if (variant === 'plain') {
    return content;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <h3 className="font-semibold">サーバー設定</h3>
          <p className="text-sm text-gray-400 mt-1">server.properties の設定</p>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <Button variant="ghost" onClick={handleReset} disabled={saving}>
              リセット
            </Button>
          )}
          <Button onClick={handleSave} loading={saving} disabled={!hasChanges}>
            保存
          </Button>
        </div>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}
