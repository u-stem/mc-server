import { expect, test } from '@playwright/test';

test.describe('サーバー詳細ページ', () => {
  test('存在しないサーバーにアクセスするとエラーが表示される', async ({ page }) => {
    await page.goto('/servers/non-existent-server-id');
    // ローディングが終わるのを待つ（エラーメッセージまたはダッシュボードに戻るボタンが表示される）
    await expect(page.getByRole('button', { name: 'ダッシュボードに戻る' })).toBeVisible({
      timeout: 10000,
    });
  });

  test('エラー時にダッシュボードに戻れる', async ({ page }) => {
    await page.goto('/servers/non-existent-server-id');
    await expect(page.getByRole('button', { name: 'ダッシュボードに戻る' })).toBeVisible({
      timeout: 10000,
    });
    await page.getByRole('button', { name: 'ダッシュボードに戻る' }).click();
    await expect(page).toHaveURL('/');
  });
});

test.describe('サーバー詳細ページ（サーバー存在時）', () => {
  // サーバーが存在する場合のテストはAPI mockまたは実サーバー作成が必要
  // ここでは基本的なUI構造のテストを記載

  test.skip('サーバー名とステータスが表示される', async ({ page }) => {
    // 実サーバーが必要なためスキップ
    await page.goto('/servers/test-server');
    await expect(page.getByRole('heading', { level: 2 })).toBeVisible();
  });

  test.skip('タブナビゲーションが表示される', async ({ page }) => {
    // 実サーバーが必要なためスキップ
    await page.goto('/servers/test-server');
    await expect(page.getByRole('tab', { name: '概要' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'バックアップ' })).toBeVisible();
    await expect(page.getByRole('tab', { name: '基本設定' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'サーバー設定' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'バージョン' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'ヘルプ' })).toBeVisible();
  });
});
