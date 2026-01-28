'use client';

import Link from 'next/link';
import { useTailscaleIp } from '@/hooks/useTailscaleIp';
import type { ServerDetails } from '@/types';
import { isBedrockServer, isModServer } from '@/types';
import { Accordion, AccordionGroup } from './Accordion';
import { CodeBlock, InlineCode } from './CodeBlock';
import { HelpCircle } from './Icons';

interface HelpPageProps {
  server: ServerDetails;
}

function StepList({ children }: { children: React.ReactNode }) {
  return <ol className="space-y-2 text-sm text-gray-300">{children}</ol>;
}

function Step({ number, children }: { number: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-600 text-white text-xs flex items-center justify-center font-bold">
        {number}
      </span>
      <div className="pt-0.5">{children}</div>
    </li>
  );
}

function Alert({
  type,
  children,
}: {
  type: 'info' | 'warning' | 'error';
  children: React.ReactNode;
}) {
  const styles = {
    info: 'bg-blue-900/30 border-blue-700 text-blue-300',
    warning: 'bg-yellow-900/30 border-yellow-700 text-yellow-300',
    error: 'bg-red-900/30 border-red-700 text-red-300',
  };

  return <div className={`p-3 rounded-lg border text-sm ${styles[type]}`}>{children}</div>;
}

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-400 hover:text-blue-300 underline"
    >
      {children}
    </a>
  );
}

export function HelpPage({ server }: HelpPageProps) {
  const showModInfo = isModServer(server.type);
  const isBedrock = isBedrockServer(server.type);
  const { ip: tailscaleIp } = useTailscaleIp();

  return (
    <div className="space-y-6">
      {/* Bedrock サーバーの説明 */}
      {isBedrock && (
        <div className="p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
          <h4 className="font-medium text-blue-300 mb-2">統合版（Bedrock）サーバーについて</h4>
          <p className="text-sm text-gray-300 mb-2">
            このサーバーは Minecraft 統合版（Bedrock Edition）専用です。
            以下のデバイスから接続できます:
          </p>
          <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
            <li>スマートフォン（iOS / Android）</li>
            <li>Nintendo Switch</li>
            <li>Xbox</li>
            <li>PlayStation</li>
            <li>Windows 10/11（Bedrock版）</li>
          </ul>
          <p className="text-xs text-gray-500 mt-3">
            注意:
            Java版のMinecraftからは接続できません。Java版プレイヤーとのクロスプレイには、Java版サーバーでGeyserMCプラグインを使用してください。
          </p>
        </div>
      )}

      {/* 接続方法 */}
      <div className="space-y-3">
        <h3 className="font-semibold text-lg px-1">接続方法</h3>

        <AccordionGroup>
          {isBedrock ? (
            <Accordion title="統合版からの接続" defaultOpen>
              <div className="space-y-4">
                <Alert type="info">
                  統合版サーバーはUDPポート {server.port} で接続を受け付けています。
                </Alert>

                <div>
                  <h4 className="font-medium text-gray-200 mb-3">スマートフォン / タブレット</h4>
                  <StepList>
                    <Step number={1}>Minecraftを起動し「遊ぶ」をタップ</Step>
                    <Step number={2}>「サーバー」タブを選択</Step>
                    <Step number={3}>「サーバーを追加」をタップ</Step>
                    <Step number={4}>
                      サーバー情報を入力:
                      <div className="mt-2 space-y-1">
                        <div className="text-gray-400 text-xs">
                          サーバー名: <InlineCode copyable={false}>{server.name}</InlineCode>
                        </div>
                        <div className="text-gray-400 text-xs">
                          サーバーアドレス: <InlineCode>{tailscaleIp || 'サーバーIP'}</InlineCode>
                        </div>
                        <div className="text-gray-400 text-xs">
                          ポート: <InlineCode copyable={false}>{String(server.port)}</InlineCode>
                        </div>
                      </div>
                    </Step>
                    <Step number={5}>「保存」してサーバーを選択して接続</Step>
                  </StepList>
                </div>

                <div>
                  <h4 className="font-medium text-gray-200 mb-3">
                    Nintendo Switch / Xbox / PlayStation
                  </h4>
                  <Alert type="warning">
                    コンソール版では外部サーバーへの直接接続が制限されています。
                    BedrockConnectやPhantomなどのツールが必要な場合があります。
                  </Alert>
                </div>

                <div>
                  <h4 className="font-medium text-gray-200 mb-3">Windows 10/11 (Bedrock版)</h4>
                  <StepList>
                    <Step number={1}>Minecraftを起動し「遊ぶ」をクリック</Step>
                    <Step number={2}>「サーバー」タブを選択</Step>
                    <Step number={3}>「サーバーを追加」をクリック</Step>
                    <Step number={4}>
                      サーバーアドレスとポートを入力:
                      <CodeBlock>{`${tailscaleIp || 'サーバーIP'}:${server.port}`}</CodeBlock>
                    </Step>
                    <Step number={5}>「保存」してサーバーを選択して接続</Step>
                  </StepList>
                </div>
              </div>
            </Accordion>
          ) : (
            <Accordion title="ローカル接続（同じPC）" defaultOpen={false}>
              <StepList>
                <Step number={1}>
                  Minecraftを起動
                  {showModInfo && (
                    <span className="text-gray-400">（{server.type}プロファイルを選択）</span>
                  )}
                </Step>
                <Step number={2}>「マルチプレイ」から「サーバーを追加」</Step>
                <Step number={3}>
                  サーバーアドレスに入力:
                  <CodeBlock>{`localhost:${server.port}`}</CodeBlock>
                </Step>
                <Step number={4}>「完了」をクリックしてサーバーを選択して接続</Step>
              </StepList>
            </Accordion>
          )}

          <Accordion
            title={`ゲストを招待する（Tailscale）${isBedrock ? ' - 統合版' : ''}`}
            defaultOpen={!isBedrock}
          >
            <div className="space-y-6">
              <p className="text-sm text-gray-400">
                Tailscaleを使うと、ポート開放なしで安全にゲストとプレイできます。無料で利用可能です。
              </p>

              {tailscaleIp && (
                <Alert type="info">
                  このサーバーのTailscale IP:{' '}
                  <InlineCode>{`${tailscaleIp}:${server.port}`}</InlineCode>
                </Alert>
              )}

              {/* サーバー側の設定 */}
              <div>
                <h4 className="font-medium text-gray-200 mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-green-600 text-white text-xs flex items-center justify-center">
                    1
                  </span>
                  サーバー側の設定（ホスト）
                </h4>
                <div className="pl-8 space-y-3">
                  <StepList>
                    <Step number={1}>
                      <ExternalLink href="https://tailscale.com/">Tailscale</ExternalLink>
                      でアカウント作成
                    </Step>
                    <Step number={2}>サーバーPCにTailscaleをインストールしてログイン</Step>
                    <Step number={3}>
                      <ExternalLink href="https://login.tailscale.com/admin/users">
                        管理画面
                      </ExternalLink>
                      を開き「Invite external users」でゲストのメールアドレスを入力して招待
                    </Step>
                    <Step number={4}>
                      TailscaleのIPアドレスを確認（ターミナルで実行）:
                      <CodeBlock>tailscale ip -4</CodeBlock>
                      <span className="text-gray-400">100.x.x.x 形式のIPが表示されます</span>
                    </Step>
                  </StepList>

                  <Alert type="warning">
                    macOSの場合、ファイアウォールの設定が必要です。
                    「システム設定」→「ネットワーク」→「ファイアウォール」→「オプション」で
                    OrbStack/Dockerを許可してください。
                  </Alert>
                </div>
              </div>

              {/* クライアント側の設定 */}
              <div>
                <h4 className="font-medium text-gray-200 mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-green-600 text-white text-xs flex items-center justify-center">
                    2
                  </span>
                  クライアント側の設定（ゲスト）
                </h4>
                <div className="pl-8 space-y-3">
                  <Alert type="warning">
                    ゲストは招待メールのリンクからアカウントを作成する必要があります。
                    自分でtailscale.comから登録すると、別のネットワークになってしまいます。
                  </Alert>

                  <StepList>
                    <Step number={1}>招待メールを開き、リンクをクリック</Step>
                    <Step number={2}>Tailscaleアカウントを作成（またはログイン）</Step>
                    <Step number={3}>PCにTailscaleをインストール</Step>
                    <Step number={4}>Tailscaleアプリで招待されたアカウントでログイン</Step>
                    <Step number={5}>「Connected」になっていることを確認</Step>
                    <Step number={6}>
                      Minecraftで接続:
                      <CodeBlock>
                        {tailscaleIp
                          ? `${tailscaleIp}:${server.port}`
                          : `[サーバーのTailscale IP]:${server.port}`}
                      </CodeBlock>
                    </Step>
                  </StepList>
                </div>
              </div>

              {/* ホワイトリスト */}
              <div>
                <h4 className="font-medium text-gray-200 mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-green-600 text-white text-xs flex items-center justify-center">
                    3
                  </span>
                  ホワイトリストに追加
                </h4>
                <div className="pl-8 space-y-3">
                  <p className="text-sm text-gray-300">
                    ゲストのMinecraftプレイヤー名をホワイトリストに追加してください。
                  </p>
                  <Alert type="warning">
                    プレイヤー名はMinecraftランチャーの左上に表示される名前です。
                    Xboxのゲーマータグに「#1234」のような数字がついている場合、Minecraftでは数字部分は不要です。
                  </Alert>
                </div>
              </div>

              {/* トラブルシューティング */}
              <div>
                <h4 className="font-medium text-gray-200 mb-3">トラブルシューティング</h4>
                <div className="space-y-2 text-sm">
                  <div className="p-3 bg-gray-700/30 rounded-lg">
                    <p className="font-medium text-gray-200">pingが通らない</p>
                    <ul className="list-disc list-inside text-gray-400 mt-1 space-y-1">
                      <li>ゲストがTailscaleで「Connected」になっているか確認</li>
                      <li>ゲストが正しいネットワーク（ホストのtailnet）に参加しているか確認</li>
                      <li>管理画面のUsersでゲストが「Connected」になっているか確認</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-gray-700/30 rounded-lg">
                    <p className="font-medium text-gray-200">pingは通るが接続できない</p>
                    <ul className="list-disc list-inside text-gray-400 mt-1 space-y-1">
                      <li>
                        サーバーアドレスにポート番号{' '}
                        <InlineCode copyable={false}>{`:${server.port}`}</InlineCode>{' '}
                        が含まれているか確認
                      </li>
                      <li>サーバーが起動しているか確認</li>
                      <li>サーバー側のファイアウォール設定を確認</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-gray-700/30 rounded-lg">
                    <p className="font-medium text-gray-200">「Connection throttled」エラー</p>
                    <p className="text-gray-400 mt-1">
                      短時間に何度も接続を試みた場合に表示されます。1〜2分待ってから再接続してください。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Accordion>

          {showModInfo && (
            <Accordion title="Mod環境のセットアップ">
              <div className="space-y-4">
                <p className="text-sm text-gray-400">
                  このサーバーは{server.type}
                  で動作しています。クライアントにも同じMod環境が必要です。
                </p>

                {server.type === 'FABRIC' && (
                  <StepList>
                    <Step number={1}>
                      <ExternalLink href="https://fabricmc.net/use/installer/">
                        Fabric Installer
                      </ExternalLink>
                      をダウンロード
                    </Step>
                    <Step number={2}>インストーラーを実行し「Client」を選択</Step>
                    <Step number={3}>
                      バージョン <InlineCode copyable={false}>{server.version}</InlineCode>{' '}
                      を選択して「Install」
                    </Step>
                    <Step number={4}>Minecraftランチャーで「Fabric」プロファイルを選択</Step>
                  </StepList>
                )}

                {server.type === 'FORGE' && (
                  <StepList>
                    <Step number={1}>
                      <ExternalLink href="https://files.minecraftforge.net/">
                        Minecraft Forge
                      </ExternalLink>
                      から {server.version} 用をダウンロード
                    </Step>
                    <Step number={2}>インストーラーを実行し「Install client」を選択</Step>
                    <Step number={3}>Minecraftランチャーで「Forge」プロファイルを選択</Step>
                  </StepList>
                )}

                {server.type === 'NEOFORGE' && (
                  <StepList>
                    <Step number={1}>
                      <ExternalLink href="https://neoforged.net/">NeoForge</ExternalLink>
                      から {server.version} 用をダウンロード
                    </Step>
                    <Step number={2}>インストーラーを実行し「Install client」を選択</Step>
                    <Step number={3}>Minecraftランチャーで「NeoForge」プロファイルを選択</Step>
                  </StepList>
                )}

                {server.type === 'QUILT' && (
                  <StepList>
                    <Step number={1}>
                      <ExternalLink href="https://quiltmc.org/en/install/">
                        Quilt Installer
                      </ExternalLink>
                      をダウンロード
                    </Step>
                    <Step number={2}>インストーラーを実行し「Client」タブを選択</Step>
                    <Step number={3}>
                      バージョン <InlineCode copyable={false}>{server.version}</InlineCode>{' '}
                      を選択して「Install」
                    </Step>
                    <Step number={4}>Minecraftランチャーで「Quilt」プロファイルを選択</Step>
                  </StepList>
                )}

                <Alert type="info">
                  サーバーにインストールされているModと同じModをクライアントにも入れる必要がある場合があります。
                  「Mod」タブでサーバーのMod一覧を確認してください。
                </Alert>
              </div>
            </Accordion>
          )}
        </AccordionGroup>
      </div>

      {/* 一般ヘルプへのリンク */}
      <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
        <div className="flex items-start gap-3">
          <HelpCircle className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-gray-200 mb-1">設定・コマンドリファレンス</h4>
            <p className="text-sm text-gray-400 mb-3">
              プリセットの詳細、JVM設定、ゲームプレイ設定、コマンド一覧などの一般的なヘルプは別ページにあります。
            </p>
            <Link
              href="/help"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
              ヘルプページを開く
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
