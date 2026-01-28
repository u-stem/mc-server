import { expect, test } from '@playwright/test';

test.describe('ホームページ', () => {
  test('タイトルが表示される', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Minecraft/);
  });

  test('ローディング後にサーバー一覧が表示される', async ({ page }) => {
    await page.goto('/');
    // ローディングが終わるのを待つ
    await expect(page.getByRole('heading', { name: 'サーバー一覧' })).toBeVisible();
  });

  test('新規作成ボタンが存在する', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'サーバー一覧' })).toBeVisible();
    const createButton = page.getByRole('button', { name: '新規作成' });
    await expect(createButton).toBeVisible();
  });

  test('新規作成ボタンで新規作成ページに遷移できる', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'サーバー一覧' })).toBeVisible();
    await page.getByRole('button', { name: '新規作成' }).click();
    await expect(page).toHaveURL(/\/servers\/new/);
  });
});
