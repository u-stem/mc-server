'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { POLLING_INTERVAL_LOGS } from '@/lib/constants';
import type { ApiResponse } from '@/types';
import { Button } from './Button';
import { Card, CardContent, CardHeader } from './Card';
import { Input } from './Input';

interface ConsoleProps {
  serverId: string;
  isRunning: boolean;
}

interface CommandEntry {
  id: string;
  type: 'command' | 'response' | 'error';
  content: string;
  timestamp: Date;
}

interface LogEntry {
  id: string;
  line: string;
}

let logIdCounter = 0;

export function Console({ serverId, isRunning }: ConsoleProps) {
  const [serverLogs, setServerLogs] = useState<LogEntry[]>([]);
  const [commandHistory, setCommandHistory] = useState<CommandEntry[]>([]);
  const [command, setCommand] = useState('');
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const logsContainerRef = useRef<HTMLDivElement>(null);
  const commandContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchLogs = useCallback(async () => {
    if (!isRunning) return;

    try {
      const res = await fetch(`/api/servers/${serverId}/logs?lines=100`);
      const data: ApiResponse<{ logs: string }> = await res.json();

      if (data.success && data.data) {
        const logLines = data.data.logs.split('\n').filter(Boolean);
        setServerLogs(logLines.map((line) => ({ id: `log-${logIdCounter++}`, line })));
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    }
  }, [serverId, isRunning]);

  useEffect(() => {
    fetchLogs();

    if (autoRefresh && isRunning) {
      const interval = setInterval(fetchLogs, POLLING_INTERVAL_LOGS);
      return () => clearInterval(interval);
    }
  }, [fetchLogs, autoRefresh, isRunning]);

  useEffect(() => {
    // serverLogs が更新されたらスクロール
    if (logsContainerRef.current && serverLogs.length > 0) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [serverLogs]);

  useEffect(() => {
    // commandHistory が更新されたらスクロール
    if (commandContainerRef.current && commandHistory.length > 0) {
      commandContainerRef.current.scrollTop = commandContainerRef.current.scrollHeight;
    }
  }, [commandHistory]);

  const handleCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || !isRunning) return;

    const commandText = command.trim();
    setCommand('');
    setLoading(true);

    // コマンドを履歴に追加
    const commandEntry: CommandEntry = {
      id: `cmd-${Date.now()}`,
      type: 'command',
      content: `> ${commandText}`,
      timestamp: new Date(),
    };
    setCommandHistory((prev) => [...prev, commandEntry]);

    try {
      const res = await fetch(`/api/servers/${serverId}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: commandText }),
      });

      const data: ApiResponse<{ response: string }> = await res.json();

      if (data.success) {
        const responseEntry: CommandEntry = {
          id: `res-${Date.now()}`,
          type: 'response',
          content: data.data?.response || '(no response)',
          timestamp: new Date(),
        };
        setCommandHistory((prev) => [...prev, responseEntry]);
      } else {
        const errorEntry: CommandEntry = {
          id: `err-${Date.now()}`,
          type: 'error',
          content: data.error || 'Command failed',
          timestamp: new Date(),
        };
        setCommandHistory((prev) => [...prev, errorEntry]);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorEntry: CommandEntry = {
        id: `err-${Date.now()}`,
        type: 'error',
        content: errorMessage,
        timestamp: new Date(),
      };
      setCommandHistory((prev) => [...prev, errorEntry]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const getEntryStyle = (type: CommandEntry['type']) => {
    switch (type) {
      case 'command':
        return 'text-yellow-400';
      case 'response':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
    }
  };

  const clearHistory = () => {
    setCommandHistory([]);
  };

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
        <div>
          <h3 className="font-semibold text-lg">コンソール</h3>
          <p className="text-sm text-gray-400 mt-1">
            {isRunning ? 'サーバーログとコマンド実行' : 'サーバーが停止中です'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-green-500 focus:ring-green-500 focus:ring-offset-gray-800"
            />
            自動更新
          </label>
          <Button variant="ghost" size="sm" onClick={fetchLogs} disabled={!isRunning}>
            更新
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* サーバーログ */}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">サーバーログ</p>
          <div
            ref={logsContainerRef}
            className="h-[200px] overflow-auto bg-gray-900 rounded-lg p-3 font-mono text-xs"
          >
            {!isRunning ? (
              <div className="text-gray-500 text-center py-8">
                サーバーを起動するとログが表示されます
              </div>
            ) : serverLogs.length === 0 ? (
              <div className="text-gray-500 text-center py-8">ログを読み込み中...</div>
            ) : (
              serverLogs.map((log) => (
                <div key={log.id} className="text-gray-300 whitespace-pre-wrap break-all">
                  {log.line}
                </div>
              ))
            )}
          </div>
        </div>

        {/* コマンド実行 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500 uppercase tracking-wide">コマンド</p>
            {commandHistory.length > 0 && (
              <button
                type="button"
                onClick={clearHistory}
                className="text-xs text-gray-500 hover:text-gray-400"
              >
                履歴をクリア
              </button>
            )}
          </div>
          <div
            ref={commandContainerRef}
            className="h-[120px] overflow-auto bg-gray-900 rounded-lg p-3 font-mono text-xs mb-3"
          >
            {commandHistory.length === 0 ? (
              <div className="text-gray-500 text-center py-4">コマンドを入力して実行</div>
            ) : (
              commandHistory.map((entry) => (
                <div
                  key={entry.id}
                  className={`whitespace-pre-wrap break-all ${getEntryStyle(entry.type)}`}
                >
                  {entry.content}
                </div>
              ))
            )}
          </div>
          <form onSubmit={handleCommand} className="flex gap-2">
            <Input
              ref={inputRef}
              placeholder={isRunning ? 'コマンドを入力 (例: list, time set day)' : 'サーバー停止中'}
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              disabled={!isRunning || loading}
              className="flex-1 font-mono"
            />
            <Button type="submit" loading={loading} disabled={!isRunning || !command.trim()}>
              実行
            </Button>
          </form>
          <p className="mt-2 text-xs text-gray-500">
            コマンド例: list, time set day, weather clear（詳細はヘルプタブを参照）
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
