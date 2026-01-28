'use client';

import { useEffect, useState } from 'react';
import type { ApiResponse } from '@/types';

interface UseTailscaleIpResult {
  ip: string | null;
  loading: boolean;
  error: string | null;
}

// キャッシュ用（同一セッション内で再利用）
let cachedIp: string | null = null;
let cachePromise: Promise<string | null> | null = null;

async function fetchTailscaleIp(): Promise<string | null> {
  // 既にキャッシュがあれば返す
  if (cachedIp !== null) {
    return cachedIp;
  }

  // フェッチ中のPromiseがあれば待つ
  if (cachePromise) {
    return cachePromise;
  }

  // 新しくフェッチ
  cachePromise = (async () => {
    try {
      const res = await fetch('/api/tailscale');
      const data: ApiResponse<{ ip: string }> = await res.json();
      if (data.success && data.data) {
        cachedIp = data.data.ip;
        return cachedIp;
      }
      return null;
    } catch {
      return null;
    } finally {
      cachePromise = null;
    }
  })();

  return cachePromise;
}

export function useTailscaleIp(): UseTailscaleIpResult {
  // 初期値でキャッシュを反映（useEffect内でのsetState回避）
  const [ip, setIp] = useState<string | null>(() => cachedIp);
  const [loading, setLoading] = useState(() => cachedIp === null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 既にキャッシュがあれば何もしない
    if (cachedIp !== null) {
      return;
    }

    let cancelled = false;

    fetchTailscaleIp()
      .then((result) => {
        if (!cancelled) {
          setIp(result);
          setLoading(false);
          if (result === null) {
            setError('Tailscale IPを取得できませんでした');
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('Tailscale IPの取得に失敗しました');
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { ip, loading, error };
}
