import { expect, test } from '@playwright/test';

test.describe('サーバー編集ページ', () => {
  test('存在しないサーバーにアクセスするとエラーが表示される', async ({ page }) => {
    await page.goto('/servers/non-existent-server-id/edit');
    // ローディングが終わるのを待つ（エラーメッセージまたはダッシュボードに戻るボタンが表示される）
    await expect(page.getByRole('button', { name: 'ダッシュボードに戻る' })).toBeVisible({
      timeout: 10000,
    });
  });

  test('エラー時にダッシュボードに戻れる', async ({ page }) => {
    await page.goto('/servers/non-existent-server-id/edit');
    await expect(page.getByRole('button', { name: 'ダッシュボードに戻る' })).toBeVisible({
      timeout: 10000,
    });
    await page.getByRole('button', { name: 'ダッシュボードに戻る' }).click();
    await expect(page).toHaveURL('/');
  });
});

test.describe('サーバー編集ページ（サーバー存在時）', () => {
  // サーバーが存在する場合のテストはAPI mockまたは実サーバー作成が必要
  // ここでは基本的なUI構造のテストを記載

  test.skip('ページタイトルが表示される', async ({ page }) => {
    // 実サーバーが必要なためスキップ
    await page.goto('/servers/test-server/edit');
    await expect(page.getByRole('heading', { name: 'サーバー設定' })).toBeVisible();
  });

  test.skip('タブナビゲーションが表示される', async ({ page }) => {
    // 実サーバーが必要なためスキップ
    await page.goto('/servers/test-server/edit');
    await expect(page.getByRole('button', { name: '基本設定' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'サーバー設定' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'バージョン' })).toBeVisible();
  });

  test.skip('戻るボタンで詳細ページに遷移できる', async ({ page }) => {
    // 実サーバーが必要なためスキップ
    await page.goto('/servers/test-server/edit');
    await page.getByRole('button', { name: '← 戻る' }).click();
    await expect(page).toHaveURL('/servers/test-server');
  });
});
