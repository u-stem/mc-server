import type { Metadata } from 'next';
import { GeneralHelpPage } from '@/components/GeneralHelpPage';

export const metadata: Metadata = {
  title: 'ヘルプ - Minecraft Server Manager',
  description: 'Minecraft サーバーの設定リファレンスとコマンド一覧',
};

export default function HelpPage() {
  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">ヘルプ</h1>
          <p className="text-gray-400">Minecraft サーバーの設定リファレンスとコマンド一覧</p>
        </div>
        <GeneralHelpPage />
      </div>
    </main>
  );
}
