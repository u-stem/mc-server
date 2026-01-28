import type { Metadata } from 'next';
import Link from 'next/link';
import { GeneralHelpPage } from '@/components/GeneralHelpPage';
import { LABEL_BACK } from '@/lib/messages';

export const metadata: Metadata = {
  title: 'ヘルプ - Minecraft Server Manager',
  description: 'Minecraft サーバーの設定リファレンスとコマンド一覧',
};

export default function HelpPage() {
  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8 p-4 bg-gray-800 rounded-lg border border-gray-700">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-sm text-gray-400 hover:text-white inline-flex items-center"
            >
              {LABEL_BACK}
            </Link>
            <span className="text-gray-600">|</span>
            <h1 className="text-xl font-bold">ヘルプ</h1>
          </div>
        </div>
        <GeneralHelpPage />
      </div>
    </main>
  );
}
