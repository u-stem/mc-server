'use client';

import { Accordion, AccordionGroup } from './Accordion';
import { InlineCode } from './CodeBlock';

function PresetIcon({ icon }: { icon: string }) {
  const iconClass = 'w-5 h-5';

  switch (icon) {
    case 'balanced':
      return (
        <svg
          className={iconClass}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
          />
        </svg>
      );
    case 'lightweight':
      return (
        <svg
          className={iconClass}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      );
    case 'creative':
      return (
        <svg
          className={iconClass}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
          />
        </svg>
      );
    case 'hardcore':
      return (
        <svg
          className={iconClass}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      );
    case 'friendly':
      return (
        <svg
          className={iconClass}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      );
    default:
      return (
        <svg
          className={iconClass}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
          />
        </svg>
      );
  }
}

interface PresetDescriptionProps {
  icon: string;
  name: string;
  description: string;
  details: string[];
  recommended?: boolean;
}

function PresetDescription({
  icon,
  name,
  description,
  details,
  recommended,
}: PresetDescriptionProps) {
  return (
    <div className="p-3 bg-gray-700/30 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-gray-400">
          <PresetIcon icon={icon} />
        </span>
        <span className="font-medium text-gray-200">{name}</span>
        {recommended && (
          <span className="px-2 py-0.5 text-xs bg-green-600 text-white rounded-full">推奨</span>
        )}
      </div>
      <p className="text-gray-400 mb-2">{description}</p>
      <ul className="list-disc list-inside text-gray-500 text-xs space-y-0.5">
        {details.map((detail) => (
          <li key={detail}>{detail}</li>
        ))}
      </ul>
    </div>
  );
}

interface SettingDescriptionProps {
  name: string;
  description: string;
  recommended?: string;
  range?: string;
  options?: Array<{ value: string; label: string }>;
}

function SettingDescription({
  name,
  description,
  recommended,
  range,
  options,
}: SettingDescriptionProps) {
  return (
    <div className="p-3 bg-gray-700/30 rounded-lg">
      <div className="font-medium text-gray-200 mb-1">{name}</div>
      <p className="text-gray-400 mb-2">{description}</p>
      {recommended && <p className="text-xs text-green-400">推奨: {recommended}</p>}
      {range && <p className="text-xs text-gray-500">範囲: {range}</p>}
      {options && (
        <ul className="mt-2 space-y-1">
          {options.map((option) => (
            <li key={option.value} className="text-xs text-gray-500">
              <InlineCode copyable={false}>{option.value}</InlineCode> - {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CommandRow({ cmd, desc }: { cmd: string; desc: string }) {
  return (
    <div className="flex justify-between items-start gap-4 py-1 border-b border-gray-700/50 last:border-0">
      <InlineCode>{cmd}</InlineCode>
      <span className="text-gray-400 text-right text-xs sm:text-sm">{desc}</span>
    </div>
  );
}

export function GeneralHelpPage() {
  return (
    <div className="space-y-6">
      {/* 設定リファレンス */}
      <div className="space-y-3">
        <h3 className="font-semibold text-lg px-1">設定リファレンス</h3>

        <AccordionGroup>
          <Accordion title="プリセットについて" defaultOpen>
            <div className="space-y-4 text-sm">
              <p className="text-gray-400">
                サーバー作成時に選択できるプリセットは、よく使われる設定の組み合わせをまとめたものです。
              </p>

              <div className="space-y-3">
                <PresetDescription
                  icon="balanced"
                  name="バランス"
                  recommended
                  description="標準的なマルチプレイ設定。大多数のプレイヤーに適しています。"
                  details={[
                    '難易度: ノーマル',
                    'ゲームモード: サバイバル',
                    '描画距離: 10',
                    'PvP: ON',
                  ]}
                />
                <PresetDescription
                  icon="lightweight"
                  name="軽量"
                  description="低スペック環境やVPS向けに最適化された設定。"
                  details={['描画距離: 6', 'シミュレーション距離: 6', 'パフォーマンス優先']}
                />
                <PresetDescription
                  icon="creative"
                  name="クリエイティブ"
                  description="建築やアート制作に最適な設定。"
                  details={[
                    'ゲームモード: クリエイティブ',
                    '難易度: ピースフル',
                    'PvP: OFF',
                    'モンスター無し',
                  ]}
                />
                <PresetDescription
                  icon="hardcore"
                  name="ハードコア"
                  description="上級者向けのチャレンジ設定。死亡時にスペクテイターモードになります。"
                  details={['難易度: ハード', 'ハードコア: ON', 'PvP: ON', 'ゲームモード強制: ON']}
                />
                <PresetDescription
                  icon="friendly"
                  name="フレンドリー"
                  description="初心者やお子様向けの安全な設定。"
                  details={[
                    '難易度: ピースフル',
                    'PvP: OFF',
                    'モンスター無し',
                    'スポーン保護: 広め',
                  ]}
                />
              </div>
            </div>
          </Accordion>

          <Accordion title="JVM設定">
            <div className="space-y-3 text-sm">
              <SettingDescription
                name="Aikar's Flags"
                description="ガベージコレクションを最適化するJVMフラグ。特別な理由がない限りONを推奨します。"
                recommended="ON"
              />
            </div>
          </Accordion>

          <Accordion title="パフォーマンス設定">
            <div className="space-y-3 text-sm">
              <SettingDescription
                name="描画距離 (view-distance)"
                description="プレイヤーから見えるチャンクの範囲。大きいほど遠くまで見えますが、サーバー負荷が増加します。"
                recommended="10（低スペック: 6-8）"
                range="3-32"
              />
              <SettingDescription
                name="シミュレーション距離 (simulation-distance)"
                description="エンティティやレッドストーンがアクティブになる範囲。描画距離以下を推奨します。"
                recommended="10（描画距離以下）"
                range="3-32"
              />
            </div>
          </Accordion>

          <Accordion title="ゲームプレイ設定">
            <div className="space-y-3 text-sm">
              <SettingDescription
                name="難易度 (difficulty)"
                description="ゲームの難易度。ピースフルではモンスターが出現しません。"
                options={[
                  { value: 'peaceful', label: 'ピースフル - モンスター無し、空腹なし' },
                  { value: 'easy', label: 'イージー - モンスター弱い' },
                  { value: 'normal', label: 'ノーマル - 標準的な難易度' },
                  { value: 'hard', label: 'ハード - モンスター強い、空腹で死亡あり' },
                ]}
              />
              <SettingDescription
                name="ゲームモード (gamemode)"
                description="プレイヤーのデフォルトゲームモード。"
                options={[
                  { value: 'survival', label: 'サバイバル - 通常プレイ' },
                  { value: 'creative', label: 'クリエイティブ - 建築モード' },
                  { value: 'adventure', label: 'アドベンチャー - 配布マップ向け' },
                  { value: 'spectator', label: 'スペクテイター - 観戦モード' },
                ]}
              />
              <SettingDescription
                name="PvP"
                description="プレイヤー同士の戦闘を許可するかどうか。"
                recommended="用途に応じて設定"
              />
              <SettingDescription
                name="ハードコア (hardcore)"
                description="ONにすると死亡時にスペクテイターモードになります。復活にはOP権限が必要です。"
                recommended="上級者向け"
              />
              <SettingDescription
                name="飛行許可 (allow-flight)"
                description="サバイバルモードでの飛行を許可するかどうか。Mod使用時はON推奨です。"
                recommended="ON（Mod使用時）"
              />
              <SettingDescription
                name="ゲームモード強制 (force-gamemode)"
                description="ONにするとプレイヤーは参加時に常にデフォルトのゲームモードに戻されます。"
                recommended="OFF（通常）"
              />
            </div>
          </Accordion>

          <Accordion title="スポーン設定">
            <div className="space-y-3 text-sm">
              <SettingDescription
                name="モンスター出現 (spawn-monsters)"
                description="敵対的なMob（ゾンビ、スケルトンなど）が出現するかどうか。難易度がピースフルの場合は無効です。"
                recommended="ON（通常）"
              />
              <SettingDescription
                name="動物出現 (spawn-animals)"
                description="受動的なMob（牛、豚、羊など）が出現するかどうか。"
                recommended="ON"
              />
              <SettingDescription
                name="村人出現 (spawn-npcs)"
                description="村人NPCが出現するかどうか。"
                recommended="ON"
              />
              <SettingDescription
                name="スポーン保護範囲 (spawn-protection)"
                description="スポーン地点周辺でOP以外がブロックを壊せない範囲（ブロック数）。0で無効。"
                recommended="16（小規模サーバー）"
                range="0-100"
              />
            </div>
          </Accordion>
        </AccordionGroup>
      </div>

      {/* コマンドリファレンス */}
      <div className="space-y-3">
        <h3 className="font-semibold text-lg px-1">コマンドリファレンス</h3>
        <p className="text-sm text-gray-400 px-1">
          Java
          版サーバーで使用できるコマンド一覧です。統合版（Bedrock）サーバーでは一部コマンドが異なります。
        </p>

        <AccordionGroup>
          <Accordion title="基本コマンド" defaultOpen>
            <div className="grid gap-2 text-sm">
              <CommandRow cmd="list" desc="オンラインプレイヤー一覧" />
              <CommandRow cmd="say [メッセージ]" desc="全体メッセージ送信" />
              <CommandRow cmd="tell [名前] [メッセージ]" desc="個人メッセージ送信" />
              <CommandRow cmd="kick [名前] [理由]" desc="プレイヤーを追放" />
              <CommandRow cmd="ban [名前] [理由]" desc="プレイヤーをBAN" />
              <CommandRow cmd="pardon [名前]" desc="BANを解除" />
              <CommandRow cmd="op [名前]" desc="OP権限付与" />
              <CommandRow cmd="deop [名前]" desc="OP権限剥奪" />
            </div>
          </Accordion>

          <Accordion title="ワールド設定">
            <div className="grid gap-2 text-sm">
              <CommandRow cmd="time set day" desc="昼にする（1000）" />
              <CommandRow cmd="time set night" desc="夜にする（13000）" />
              <CommandRow cmd="time set [数値]" desc="時間を設定（0-24000）" />
              <CommandRow cmd="weather clear" desc="晴れにする" />
              <CommandRow cmd="weather rain" desc="雨にする" />
              <CommandRow cmd="weather thunder" desc="雷雨にする" />
              <CommandRow cmd="difficulty [難易度]" desc="難易度変更" />
              <CommandRow cmd="gamerule [ルール] [値]" desc="ゲームルール変更" />
            </div>
          </Accordion>

          <Accordion title="プレイヤー操作">
            <div className="grid gap-2 text-sm">
              <CommandRow cmd="gamemode survival [名前]" desc="サバイバルモード" />
              <CommandRow cmd="gamemode creative [名前]" desc="クリエイティブモード" />
              <CommandRow cmd="gamemode spectator [名前]" desc="スペクテイターモード" />
              <CommandRow cmd="tp [名前] [x] [y] [z]" desc="座標にテレポート" />
              <CommandRow cmd="tp [名前] [対象名]" desc="プレイヤーにテレポート" />
              <CommandRow cmd="give [名前] [アイテムID] [数]" desc="アイテム付与" />
              <CommandRow cmd="effect give [名前] [効果ID]" desc="効果付与" />
              <CommandRow cmd="effect clear [名前]" desc="全効果解除" />
            </div>
          </Accordion>

          <Accordion title="ホワイトリスト">
            <div className="grid gap-2 text-sm">
              <CommandRow cmd="whitelist on" desc="ホワイトリスト有効化" />
              <CommandRow cmd="whitelist off" desc="ホワイトリスト無効化" />
              <CommandRow cmd="whitelist add [名前]" desc="プレイヤーを追加" />
              <CommandRow cmd="whitelist remove [名前]" desc="プレイヤーを削除" />
              <CommandRow cmd="whitelist list" desc="登録プレイヤー一覧" />
              <CommandRow cmd="whitelist reload" desc="ホワイトリスト再読込" />
            </div>
          </Accordion>
        </AccordionGroup>
      </div>
    </div>
  );
}
