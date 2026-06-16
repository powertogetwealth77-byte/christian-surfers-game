import { test } from '@playwright/test';
import path from 'path';

test('capture david gameplay', async ({ page }) => {
  console.log("Navigating to http://localhost:5173/ ...");
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  
  // Wait 1.5 seconds for animations and loading modals to settle
  console.log("Waiting for loading and animations to settle...");
  await page.waitForTimeout(1500);
  
  // Check if Daily Blessing modal is open and dismiss it
  const claimButton = page.locator('text="✝️ CLAIM BLESSING"');
  if (await claimButton.isVisible()) {
    console.log("Daily Blessing modal is visible. Clicking '✝️ CLAIM BLESSING'...");
    await claimButton.click();
    // Wait for the exit transition to finish
    await page.waitForTimeout(1000);
  }
  
  console.log("Clicking '🏃 Characters'...");
  await page.click('text="🏃 Characters"');
  
  console.log("Selecting 'David'...");
  await page.click('text="David"');
  
  console.log("Clicking '▶ RUN IN THE LIGHT'...");
  await page.click('text="▶ RUN IN THE LIGHT"');
  
  console.log("Waiting 3 seconds for gameplay to run...");
  await page.waitForTimeout(3000);
  
  const screenshotPath = path.join('C:', 'Users', 'Dishawn Smith', '.gemini', 'antigravity', 'brain', '94cff3c2-7bed-4dfa-b9b6-699eceec9cfe', 'david_gameplay.png');
  console.log(`Taking screenshot to ${screenshotPath}...`);
  await page.screenshot({ path: screenshotPath });
});
