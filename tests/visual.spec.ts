import { test, expect } from '@playwright/test';

const SAVE_KEY = 'christian-surfers-save-v1';

function todayKey() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

// Default-shaped save with today's daily blessing already claimed, so the
// character-pipeline checks below aren't gated behind that modal.
function seedSave() {
  return {
    totalCoins: 0,
    totalXp: 0,
    bestScore: 0,
    bestDistance: 0,
    selectedCharacter: 'zion',
    ownedCharacters: ['zion', 'grace', 'judah', 'kai'],
    ownedBoards: ['john316'],
    equippedBoard: 'john316',
    ownedShoes: ['gospel'],
    equippedShoe: 'gospel',
    selectedVenue: 'boardwalk',
    lastDailyClaim: todayKey(),
    dailyStreak: 1,
    lifetime: { distance: 0, coins: 0, scrolls: 0, runs: 0, bestCombo: 0, perfectDodges: 0, playSeconds: 0 },
    claimedAchievements: [],
    completedMissions: [],
    unlockedScriptures: [],
    scriptureMastery: {},
    scriptureHeard: {},
    scriptureLastHeard: {},
    favoriteScriptures: [],
    upgrades: {},
    friendship: {},
    scriptureBadges: 0,
    scriptureStreakDays: 0,
    scriptureStreakLastDate: '',
    scriptureStreakBest: 0,
    finishVictories: 0,
    finishCorrectAnswers: 0,
    finishScriptureTier: 1,
    finishVictoryStreak: 0,
    finishLongestStreak: 0,
    finishAttempts: 0,
    cosmeticPurchases: [],
    cosmeticShards: {},
    settings: {
      muted: false,
      music: true,
      haptics: true,
      screenShake: true,
      voiceScriptures: false,
    },
  };
}

test.describe('character asset pipeline (fresh-character-asset-pipeline-pr3)', () => {
  test('character select shows the full roster with Esther and no playable Accuser', async ({ page }) => {
    await page.addInitScript((save) => {
      localStorage.setItem('christian-surfers-save-v1', JSON.stringify(save));
    }, seedSave());

    await page.goto('/', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: '🏃 Characters' }).click();

    // Full current PR3 roster — this pipeline must not remove any hero.
    const roster = ['Zion', 'Judah', 'Grace', 'Kai', 'Selah', 'Mercy', 'Samuel', 'Malachi', 'David', 'Esther'];
    for (const name of roster) {
      await expect(page.getByText(name, { exact: true }).first()).toBeVisible();
    }

    // The Accuser must never appear as a playable/selectable hero card.
    await expect(page.getByText('The Accuser', { exact: true })).toHaveCount(0);

    // No broken image icons: every rendered <img> either has no src or loaded successfully.
    const brokenImages = await page.locator('img').evaluateAll((imgs) =>
      (imgs as HTMLImageElement[]).filter((img) => !!img.src && img.complete && img.naturalWidth === 0).length,
    );
    expect(brokenImages).toBe(0);
  });

  test('gameplay starts and renders the active hero without console errors', async ({ page }) => {
    const errors: string[] = [];
    // Pre-existing Google Fonts <link> in index.html, unrelated to gameplay —
    // fails to load in network-restricted test environments. Any other
    // failed resource (a character asset, for example) still fails the test.
    page.on('requestfailed', (req) => {
      if (!req.url().includes('fonts.googleapis.com')) errors.push(`request failed: ${req.url()}`);
    });
    page.on('console', (msg) => {
      if (msg.type() === 'error' && !msg.text().includes('Failed to load resource')) errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));

    await page.addInitScript((save) => {
      localStorage.setItem('christian-surfers-save-v1', JSON.stringify(save));
    }, seedSave());

    await page.goto('/', { waitUntil: 'networkidle' });
    // The Play button pulses continuously (framer-motion scale loop), which
    // trips Playwright's actionability "stable" check — force is safe here.
    await page.getByRole('button', { name: '▶ PLAY' }).click({ force: true });

    await expect(page.locator('canvas')).toBeVisible();
    await page.waitForTimeout(1500);

    expect(errors).toEqual([]);
  });
});
