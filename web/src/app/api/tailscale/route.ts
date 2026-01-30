import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { NextResponse } from 'next/server';
import { TAILSCALE_COMMAND_TIMEOUT_MS } from '@/lib/constants';
import { ERROR_TAILSCALE_IP_NOT_FOUND, ERROR_TAILSCALE_NOT_CONNECTED } from '@/lib/errorMessages';

const execFileAsync = promisify(execFile);

export async function GET() {
  // 環境変数からTailscale IPを取得（Docker環境用）
  const envIp = process.env.TAILSCALE_IP;
  if (envIp?.match(/^100\.\d+\.\d+\.\d+$/)) {
    return NextResponse.json({
      success: true,
      data: { ip: envIp },
    });
  }

  // ローカル実行時はtailscaleコマンドを試行
  try {
    const { stdout } = await execFileAsync('tailscale', ['ip', '-4'], {
      timeout: TAILSCALE_COMMAND_TIMEOUT_MS,
    });

    const ip = stdout.trim();

    if (!ip || !ip.match(/^100\.\d+\.\d+\.\d+$/)) {
      return NextResponse.json({
        success: false,
        error: ERROR_TAILSCALE_IP_NOT_FOUND,
      });
    }

    return NextResponse.json({
      success: true,
      data: { ip },
    });
  } catch {
    return NextResponse.json({
      success: false,
      error: ERROR_TAILSCALE_NOT_CONNECTED,
    });
  }
}
