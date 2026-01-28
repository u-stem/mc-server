import { expect, test } from '@playwright/test';

test.describe('新規サーバー作成ページ', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/servers/new');
  });

  test('ページタイトルとヘッダーが表示される', async ({ page }) => {
    await expect(page).toHaveTitle(/Minecraft/);
    await expect(page.getByRole('heading', { name: '新規サーバー作成' })).toBeVisible();
  });

  test('戻るリンクでダッシュボードに遷移できる', async ({ page }) => {
    await page.getByRole('link', { name: '← 戻る' }).click();
    await expect(page).toHaveURL('/');
  });

  test('エディション選択が表示される', async ({ page }) => {
    await expect(page.getByText('エディション')).toBeVisible();
    await expect(page.getByText('Java版')).toBeVisible();
    await expect(page.getByText('統合版（Bedrock）')).toBeVisible();
  });

  test('Java版がデフォルトで選択されている', async ({ page }) => {
    const javaButton = page.getByRole('button', { name: /Java版/ });
    await expect(javaButton).toHaveClass(/border-green-500/);
  });

  test('統合版を選択できる', async ({ page }) => {
    await page.getByRole('button', { name: /統合版/ }).click();
    const bedrockButton = page.getByRole('button', { name: /統合版/ });
    await expect(bedrockButton).toHaveClass(/border-green-500/);
  });

  test('サーバー名入力フィールドが表示される', async ({ page }) => {
    await expect(page.getByLabel('サーバー名')).toBeVisible();
  });

  test('ゲームポートとRCONポートが表示される（Java版）', async ({ page }) => {
    await expect(page.getByLabel('ゲームポート')).toBeVisible();
    await expect(page.getByLabel('RCONポート')).toBeVisible();
  });

  test('統合版ではRCONポートが非表示になる', async ({ page }) => {
    await page.getByRole('button', { name: /統合版/ }).click();
    await expect(page.getByLabel('RCONポート')).not.toBeVisible();
    await expect(page.getByLabel(/ゲームポート/)).toBeVisible();
  });

  test('サーバータイプ選択が表示される（Java版）', async ({ page }) => {
    await expect(page.getByLabel('サーバータイプ')).toBeVisible();
  });

  test('メモリ選択が表示される', async ({ page }) => {
    await expect(page.getByLabel('メモリ')).toBeVisible();
  });

  test('最大プレイヤー数入力が表示される', async ({ page }) => {
    await expect(page.getByLabel('最大プレイヤー数')).toBeVisible();
  });

  test('作成ボタンが表示される', async ({ page }) => {
    await expect(page.getByRole('button', { name: '作成' })).toBeVisible();
  });

  test('サーバー名フィールドは必須属性を持つ', async ({ page }) => {
    const nameInput = page.getByLabel('サーバー名');
    await expect(nameInput).toHaveAttribute('required', '');
  });

  test('RCONパスワードフィールドは必須属性を持つ', async ({ page }) => {
    const passwordInput = page.getByLabel('RCONパスワード');
    await expect(passwordInput).toHaveAttribute('required', '');
  });

  test('プリセット選択が表示される', async ({ page }) => {
    await expect(page.getByText('プリセット')).toBeVisible();
  });
});
