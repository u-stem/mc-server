import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { NextResponse } from 'next/server';

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
      timeout: 5000,
    });

    const ip = stdout.trim();

    if (!ip || !ip.match(/^100\.\d+\.\d+\.\d+$/)) {
      return NextResponse.json({
        success: false,
        error: 'Tailscale IP not found',
      });
    }

    return NextResponse.json({
      success: true,
      data: { ip },
    });
  } catch {
    return NextResponse.json({
      success: false,
      error: 'Tailscale not connected',
    });
  }
}
