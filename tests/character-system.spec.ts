import { test, expect } from '@playwright/test';

const SAVE_KEY = 'christian-surfers-save-v1';

function todayKey() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

function seedSave(overrides: Record<string, unknown> = {}) {
  return {
    totalCoins: 1500,
    totalXp: 0,
    bestScore: 0,
    bestDistance: 0,
    selectedCharacter: 'zion',
    ownedBoards: ['john316'],
    equippedBoard: 'john316',
    lastDailyClaim: todayKey(),
    dailyStreak: 1,
    lifetime: { distance: 0, coins: 0, scrolls: 0, runs: 0, bestCombo: 0, perfectDodges: 0 },
    claimedAchievements: [],
    completedMissions: [],
    unlockedScriptures: [],
    upgrades: {},
    settings: {
      muted: false,
      music: true,
      haptics: true,
      screenShake: true,
      voiceScriptures: false,
    },
    ...overrides,
  };
}

test.describe('character system', () => {
  test('shows locked characters, allows purchase/equip, and persists the equipped runner', async ({ page }) => {
    await page.addInitScript((save) => {
      if (!localStorage.getItem('christian-surfers-save-v1')) {
        localStorage.setItem('christian-surfers-save-v1', JSON.stringify(save));
      }
    }, seedSave());

    await page.goto('/', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: '🏃 Characters' }).click();
    await page.getByRole('button', { name: /Grace/i }).click();

    const heroCard = page.getByTestId('hero-stage-card');
    await expect(heroCard.getByText('Locked', { exact: true })).toBeVisible();
    await expect(heroCard.getByRole('button', { name: /Purchase/i })).toBeVisible();

    await heroCard.getByRole('button', { name: /Purchase/i }).click();
    await expect(heroCard.getByRole('button', { name: 'Equipped' })).toBeVisible();
    await expect(heroCard.getByText(/joined your roster and is now equipped/i)).toBeVisible();

    await page.reload({ waitUntil: 'networkidle' });
    await page.getByRole('button', { name: '🏃 Characters' }).click();
    await page.getByRole('button', { name: /Grace/i }).click();
    await expect(page.getByTestId('hero-stage-card').getByRole('button', { name: 'Equipped' })).toBeVisible();
  });

  test('prevents purchase when coins are insufficient and keeps lock state unchanged', async ({ page }) => {
    await page.addInitScript((save) => {
      if (!localStorage.getItem('christian-surfers-save-v1')) {
        localStorage.setItem('christian-surfers-save-v1', JSON.stringify(save));
      }
    }, seedSave({ totalCoins: 100 }));

    await page.goto('/', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: '🏃 Characters' }).click();
    await page.getByRole('button', { name: /David/i }).click();

    const heroCard = page.getByTestId('hero-stage-card');
    await expect(heroCard.getByText('Locked', { exact: true })).toBeVisible();
    await expect(heroCard.getByText('Price: 1,200 Light Coins')).toBeVisible();
    await expect(heroCard.getByRole('button', { name: 'Need More Coins' })).toBeDisabled();
    await expect(page.getByText('💰 100 Light Coins')).toBeVisible();
    await expect(page.getByText('Equipped: Zion')).toBeVisible();

    const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('christian-surfers-save-v1') ?? '{}'));
    expect(persisted.totalCoins).toBe(100);
    expect(persisted.selectedCharacter).toBe('zion');
    expect(persisted.ownedCharacters).toEqual(['zion']);
  });

  test('persists the selected runner into gameplay and shows runner identity after the run', async ({ page }) => {
    test.setTimeout(45_000);

    await page.addInitScript((save) => {
      if (!localStorage.getItem('christian-surfers-save-v1')) {
        localStorage.setItem('christian-surfers-save-v1', JSON.stringify(save));
      }
    }, seedSave({ bestScore: -1 }));

    await page.goto('/', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: '🏃 Characters' }).click();
    await page.getByRole('button', { name: /Grace/i }).click();
    await page.getByTestId('hero-stage-card').getByRole('button', { name: /Purchase/i }).click();
    await page.reload({ waitUntil: 'networkidle' });

    await expect(page.getByText('Grace · The Gentle Heart')).toBeVisible();
    await page.getByRole('button', { name: /play/i }).click({ force: true });

    await expect(page.locator('canvas')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();
    await expect(page.getByText('Grace: "Mercy carries me!"')).toBeVisible({ timeout: 30000 });
  });

  test('migrates legacy saves without ownedCharacters while preserving a valid selected runner', async ({ page }) => {
    await page.addInitScript((save) => {
      localStorage.setItem('christian-surfers-save-v1', JSON.stringify(save));
    }, {
      totalCoins: 999,
      totalXp: 0,
      bestScore: 0,
      bestDistance: 0,
      selectedCharacter: 'grace',
      ownedBoards: ['john316'],
      equippedBoard: 'john316',
      lastDailyClaim: todayKey(),
      dailyStreak: 1,
      lifetime: { distance: 0, coins: 0, scrolls: 0, runs: 0, bestCombo: 0, perfectDodges: 0 },
      claimedAchievements: [],
      completedMissions: [],
      unlockedScriptures: [],
      upgrades: {},
      settings: {
        muted: false,
        music: true,
        haptics: true,
        screenShake: true,
        voiceScriptures: false,
      },
    });

    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page.getByText(/Grace/)).toBeVisible();
    await page.getByRole('button', { name: '🏃 Characters' }).click();
    await expect(page.getByText('Owned: 2/6')).toBeVisible();
    await expect(page.getByText('Equipped: Grace')).toBeVisible();

    const migrated = await page.evaluate(() => JSON.parse(localStorage.getItem('christian-surfers-save-v1') ?? '{}'));
    expect(migrated.selectedCharacter).toBe('grace');
    expect(migrated.ownedCharacters).toEqual(expect.arrayContaining(['zion', 'grace']));
  });
});
