'use client';

import { useTailscaleIp } from '@/hooks/useTailscaleIp';
import type { ServerDetails } from '@/types';
import { isBedrockServer, isModServer } from '@/types';
import { Accordion, AccordionGroup } from './Accordion';
import { CodeBlock } from './CodeBlock';

interface HelpPageProps {
  server: ServerDetails;
}

function StepList({ children }: { children: React.ReactNode }) {
  return <ol className="space-y-3 text-sm text-gray-300">{children}</ol>;
}

function Step({ number, children }: { number: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-600 text-gray-200 text-xs flex items-center justify-center">
        {number}
      </span>
      <div className="pt-0.5">{children}</div>
    </li>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-gray-500 mt-1">{children}</p>;
}

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-green-400 hover:text-green-300"
    >
      {children} ↗
    </a>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h4 className="font-medium text-gray-200 mb-3">{children}</h4>;
}

export function HelpPage({ server }: HelpPageProps) {
  const showModInfo = isModServer(server.type);
  const isBedrock = isBedrockServer(server.type);
  const { ip: tailscaleIp } = useTailscaleIp();

  return (
    <div className="space-y-6">
      {/* Bedrock サーバーの説明 */}
      {isBedrock && (
        <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
          <p className="text-sm text-gray-300 mb-2">
            統合版（Bedrock Edition）専用サーバーです。以下から接続できます:
          </p>
          <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
            <li>スマートフォン（iOS / Android）</li>
            <li>Nintendo Switch / Xbox / PlayStation</li>
            <li>Windows 10/11（Bedrock版）</li>
          </ul>
          <Note>Java版からは接続できません。クロスプレイにはGeyserMCが必要です。</Note>
        </div>
      )}

      {/* 接続方法 */}
      <div className="space-y-3">
        <h3 className="font-semibold text-lg px-1">接続方法</h3>

        <AccordionGroup>
          {isBedrock ? (
            <Accordion title="統合版からの接続" defaultOpen>
              <div className="space-y-4">
                <div>
                  <SectionHeading>スマートフォン / タブレット</SectionHeading>
                  <StepList>
                    <Step number={1}>Minecraftを起動 →「遊ぶ」→「サーバー」タブ</Step>
                    <Step number={2}>「サーバーを追加」をタップ</Step>
                    <Step number={3}>
                      サーバー情報を入力して「保存」
                      <CodeBlock>{`サーバー名: ${server.name}\nアドレス: ${tailscaleIp || 'サーバーIP'}\nポート: ${server.port}`}</CodeBlock>
                    </Step>
                    <Step number={4}>追加したサーバーを選択して接続</Step>
                  </StepList>
                </div>

                <div>
                  <SectionHeading>Nintendo Switch / Xbox / PlayStation</SectionHeading>
                  <p className="text-sm text-gray-400">
                    コンソール版では外部サーバーへの直接接続が制限されています。BedrockConnectやPhantomなどのツールが必要です。
                  </p>
                </div>

                <div>
                  <SectionHeading>Windows 10/11 (Bedrock版)</SectionHeading>
                  <StepList>
                    <Step number={1}>Minecraftを起動 →「遊ぶ」→「サーバー」タブ</Step>
                    <Step number={2}>「サーバーを追加」をクリック</Step>
                    <Step number={3}>
                      サーバーアドレスとポートを入力
                      <CodeBlock>{`${tailscaleIp || 'サーバーIP'}:${server.port}`}</CodeBlock>
                    </Step>
                    <Step number={4}>「保存」してサーバーを選択</Step>
                  </StepList>
                </div>
              </div>
            </Accordion>
          ) : (
            <Accordion title="ローカル接続（同じPC）" defaultOpen={false}>
              <StepList>
                <Step number={1}>
                  Minecraftを起動{showModInfo && `（${server.type}プロファイル）`}
                </Step>
                <Step number={2}>「マルチプレイ」→「サーバーを追加」</Step>
                <Step number={3}>
                  サーバーアドレスを入力して「完了」
                  <CodeBlock>{`localhost:${server.port}`}</CodeBlock>
                </Step>
                <Step number={4}>サーバーを選択して接続</Step>
              </StepList>
            </Accordion>
          )}

          <Accordion
            title={`ゲストを招待する（Tailscale）${isBedrock ? ' - 統合版' : ''}`}
            defaultOpen={!isBedrock}
          >
            <div className="space-y-6">
              <p className="text-sm text-gray-400">
                Tailscaleを使うと、ポート開放なしで安全にゲストとプレイできます。
              </p>

              {tailscaleIp && (
                <div className="p-3 bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">サーバーアドレス</p>
                  <CodeBlock>{`${tailscaleIp}:${server.port}`}</CodeBlock>
                </div>
              )}

              {/* サーバー側の設定 */}
              <div>
                <SectionHeading>ホスト側の準備</SectionHeading>
                <StepList>
                  <Step number={1}>
                    <ExternalLink href="https://tailscale.com/">Tailscale</ExternalLink>
                    でアカウント作成、サーバーPCにインストール
                  </Step>
                  <Step number={2}>
                    <ExternalLink href="https://login.tailscale.com/admin/users">
                      管理画面
                    </ExternalLink>
                    で「Invite external users」からゲストを招待
                  </Step>
                  <Step number={3}>
                    TailscaleのIPを確認
                    <CodeBlock>tailscale ip -4</CodeBlock>
                    <Note>100.x.x.x 形式のIPが表示されます</Note>
                  </Step>
                  <Step number={4}>
                    macOSの場合: システム設定 → ネットワーク → ファイアウォール → オプション
                    でOrbStack/Dockerを許可
                  </Step>
                </StepList>
              </div>

              {/* クライアント側の設定 */}
              {isBedrock ? (
                <div className="space-y-4">
                  <SectionHeading>ゲスト側の準備</SectionHeading>
                  <p className="text-sm text-gray-400 mb-3">
                    招待メールのリンクからアカウントを作成してください。tailscale.comから直接登録すると別ネットワークになります。
                  </p>

                  <div>
                    <p className="text-sm font-medium text-gray-300 mb-2">
                      スマートフォン / タブレット / Windows
                    </p>
                    <StepList>
                      <Step number={1}>招待メールのリンクからアカウント作成</Step>
                      <Step number={2}>Tailscaleをインストールしてログイン</Step>
                      <Step number={3}>「Connected」を確認</Step>
                      <Step number={4}>
                        Minecraft →「遊ぶ」→「サーバー」→「サーバーを追加」
                        <CodeBlock>
                          {`アドレス: ${tailscaleIp || '[サーバーIP]'}\nポート: ${server.port}`}
                        </CodeBlock>
                      </Step>
                    </StepList>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-300 mb-2">
                      Nintendo Switch / PlayStation / Xbox
                    </p>
                    <p className="text-sm text-gray-400 mb-2">
                      コンソール版はTailscaleをインストールできないため、別の方法が必要です。
                    </p>
                    <div className="space-y-2 text-sm text-gray-400">
                      <div className="p-3 bg-gray-800/50 rounded-lg">
                        <p className="font-medium text-gray-300">BedrockConnect（DNS方式）</p>
                        <p className="mt-1">
                          コンソールのDNS設定を変更し、「特集サーバー」経由で接続。
                          ホスト側でTailscaleサブネットルーターの設定が必要です。
                        </p>
                      </div>
                      <div className="p-3 bg-gray-800/50 rounded-lg">
                        <p className="font-medium text-gray-300">BedrockTogether（PS/Xboxのみ）</p>
                        <p className="mt-1">
                          ゲストのスマートフォンにTailscale + BedrockTogetherアプリをインストール。
                          コンソールとスマホを同じWi-Fiに接続し、LANゲームとして表示させます。
                        </p>
                        <Note>Nintendo Switchは非対応</Note>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <SectionHeading>ゲスト側の準備</SectionHeading>
                  <p className="text-sm text-gray-400 mb-3">
                    招待メールのリンクからアカウントを作成してください。tailscale.comから直接登録すると別ネットワークになります。
                  </p>
                  <StepList>
                    <Step number={1}>招待メールのリンクからアカウント作成</Step>
                    <Step number={2}>Tailscaleをインストールしてログイン</Step>
                    <Step number={3}>「Connected」を確認</Step>
                    <Step number={4}>
                      Minecraft →「マルチプレイ」→「サーバーを追加」
                      <CodeBlock>
                        {tailscaleIp
                          ? `${tailscaleIp}:${server.port}`
                          : `[サーバーのTailscale IP]:${server.port}`}
                      </CodeBlock>
                    </Step>
                  </StepList>
                </div>
              )}

              {/* ホワイトリスト */}
              <div>
                <SectionHeading>ホワイトリストに追加</SectionHeading>
                {isBedrock ? (
                  <>
                    <p className="text-sm text-gray-400">
                      ゲストのXboxゲーマータグ（またはMicrosoftアカウント名）をホワイトリストに追加してください。
                    </p>
                    <Note>
                      GeyserMC +
                      Floodgate使用時は、プレイヤー名の前にプレフィックス（通常「.」）が付きます。
                      例: .PlayerName
                    </Note>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-gray-400">
                      ゲストのJavaプロファイル名をホワイトリストに追加してください。
                    </p>
                    <Note>
                      XboxゲーマータグではなくJava版専用の名前です。minecraft.net → プロフィール
                      →「Java版Minecraftのプロフィール名」で確認できます。
                    </Note>
                  </>
                )}
              </div>

              {/* トラブルシューティング */}
              <div>
                <SectionHeading>トラブルシューティング</SectionHeading>
                <div className="space-y-2 text-sm">
                  <div className="p-3 bg-gray-800/50 rounded-lg">
                    <p className="font-medium text-gray-300">pingが通らない</p>
                    <p className="text-gray-500 mt-1">
                      ゲストがTailscaleで「Connected」か確認。管理画面のUsersでも確認できます。
                    </p>
                  </div>
                  <div className="p-3 bg-gray-800/50 rounded-lg">
                    <p className="font-medium text-gray-300">pingは通るが接続できない</p>
                    <p className="text-gray-500 mt-1">
                      アドレスにポート番号（:{server.port}
                      ）が含まれているか確認。サーバー起動中か、ファイアウォール設定も確認。
                    </p>
                  </div>
                  <div className="p-3 bg-gray-800/50 rounded-lg">
                    <p className="font-medium text-gray-300">「Connection throttled」エラー</p>
                    <p className="text-gray-500 mt-1">1〜2分待ってから再接続してください。</p>
                  </div>
                </div>
              </div>
            </div>
          </Accordion>

          {showModInfo && (
            <Accordion title="Mod環境のセットアップ">
              <div className="space-y-4">
                <p className="text-sm text-gray-400">
                  サーバーは {server.type} ({server.version})
                  で動作しています。クライアントにも同じ環境が必要です。
                </p>

                {server.type === 'FABRIC' && (
                  <StepList>
                    <Step number={1}>
                      <ExternalLink href="https://fabricmc.net/use/installer/">
                        Fabric Installer
                      </ExternalLink>
                      をダウンロード・実行
                    </Step>
                    <Step number={2}>
                      「Client」を選択、バージョン {server.version} で「Install」
                    </Step>
                    <Step number={3}>ランチャーで「Fabric」プロファイルを選択</Step>
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
                    <Step number={3}>ランチャーで「Forge」プロファイルを選択</Step>
                  </StepList>
                )}

                {server.type === 'NEOFORGE' && (
                  <StepList>
                    <Step number={1}>
                      <ExternalLink href="https://neoforged.net/">NeoForge</ExternalLink>
                      から {server.version} 用をダウンロード
                    </Step>
                    <Step number={2}>インストーラーを実行し「Install client」を選択</Step>
                    <Step number={3}>ランチャーで「NeoForge」プロファイルを選択</Step>
                  </StepList>
                )}

                {server.type === 'QUILT' && (
                  <StepList>
                    <Step number={1}>
                      <ExternalLink href="https://quiltmc.org/en/install/">
                        Quilt Installer
                      </ExternalLink>
                      をダウンロード・実行
                    </Step>
                    <Step number={2}>
                      「Client」タブ、バージョン {server.version} で「Install」
                    </Step>
                    <Step number={3}>ランチャーで「Quilt」プロファイルを選択</Step>
                  </StepList>
                )}

                <Note>
                  サーバーと同じModをクライアントにも入れる必要がある場合があります。「Mod」タブで確認してください。
                </Note>
              </div>
            </Accordion>
          )}
        </AccordionGroup>
      </div>
    </div>
  );
}
