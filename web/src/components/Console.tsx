'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { DEFAULT_LOG_LINES, POLLING_INTERVAL_LOGS } from '@/lib/constants';
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

// Minecraftサーバーログのログレベル（lib/loggerのLogLevelとは異なる用途）
type McLogLevel = 'info' | 'warn' | 'error' | 'debug' | 'unknown';

// ログ行からログレベルを判定
function getLogLevel(line: string): McLogLevel {
  // Minecraftサーバーログ形式: [HH:MM:SS] [Thread/LEVEL]: message
  // または: [HH:MM:SS LEVEL]: message
  const levelMatch = line.match(
    /\[([\w\s-]+)\/(INFO|WARN|ERROR|DEBUG|FATAL)\]:|^\[[\d:]+\s+(INFO|WARN|ERROR|DEBUG)\]:/i
  );

  if (levelMatch) {
    const level = (levelMatch[2] || levelMatch[3] || '').toUpperCase();
    switch (level) {
      case 'INFO':
        return 'info';
      case 'WARN':
      case 'WARNING':
        return 'warn';
      case 'ERROR':
      case 'FATAL':
        return 'error';
      case 'DEBUG':
        return 'debug';
    }
  }

  // フォールバック: 行内にキーワードがあるか確認
  const lowerLine = line.toLowerCase();
  if (
    lowerLine.includes('error') ||
    lowerLine.includes('exception') ||
    lowerLine.includes('failed')
  ) {
    return 'error';
  }
  if (lowerLine.includes('warn')) {
    return 'warn';
  }

  return 'unknown';
}

// ログレベルに応じた色クラスを返す
function getLogColorClass(level: McLogLevel): string {
  switch (level) {
    case 'info':
      return 'text-gray-300';
    case 'warn':
      return 'text-yellow-400';
    case 'error':
      return 'text-red-400';
    case 'debug':
      return 'text-gray-500';
    default:
      return 'text-gray-300';
  }
}

// ログ行をパーツに分割して色付け表示するコンポーネント
function LogLine({ line }: { line: string }) {
  const level = getLogLevel(line);

  // タイムスタンプ部分を抽出: [HH:MM:SS] または [YYYY-MM-DD HH:MM:SS]
  const timestampMatch = line.match(/^(\[[\d\-:\s]+\])/);

  if (timestampMatch) {
    const timestamp = timestampMatch[1];
    const rest = line.slice(timestamp.length);

    return (
      <div className="whitespace-pre-wrap break-all">
        <span className="text-gray-500">{timestamp}</span>
        <span className={getLogColorClass(level)}>{rest}</span>
      </div>
    );
  }

  // タイムスタンプがない場合はそのまま表示
  return <div className={`whitespace-pre-wrap break-all ${getLogColorClass(level)}`}>{line}</div>;
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
      const res = await fetch(`/api/servers/${serverId}/logs?lines=${DEFAULT_LOG_LINES}`);
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
    if (logsContainerRef.current && serverLogs.length > 0) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [serverLogs]);

  useEffect(() => {
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
          <Button variant="ghost" onClick={fetchLogs} disabled={!isRunning}>
            更新
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
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
              serverLogs.map((log) => <LogLine key={log.id} line={log.line} />)
            )}
          </div>
        </div>

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
