import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test('party: configure teams, play two words, undo, win and replay', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Let’s play', exact: true }).click();
  await page.getByRole('textbox', { name: 'Team 1 name' }).fill('Lightning');
  await page.getByRole('button', { name: /Add a team/ }).click();
  await page.getByRole('textbox', { name: 'Team 3 name' }).fill('Thunder');
  await page.getByLabel('Rounds', { exact: true }).fill('1');
  await page.getByLabel('Words / round').fill('2');
  await page.getByLabel('Time per word').selectOption('0');
  await page.getByLabel('Sudden-death tiebreaker').uncheck();
  await page.getByRole('button', { name: 'Create game', exact: true }).click();
  await expect(page.getByRole('heading', { name: /Ready, set/ })).toBeVisible();
  await page.getByRole('button', { name: 'Let’s play', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Reveal', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'A little breather.' })).toBeVisible();
  await page.getByRole('button', { name: 'Resume', exact: true }).click();
  await page.getByRole('button', { name: /Lightning \+100/ }).click();
  await expect(page.getByLabel('Lightning score 100')).toBeVisible();
  await page.getByRole('button', { name: 'Undo score' }).click();
  await expect(page.getByLabel('Lightning score 0')).toBeVisible();
  await page.getByRole('button', { name: /Lightning \+100/ }).click();
  await page.getByRole('button', { name: 'Next word' }).click();
  await expect(page.getByRole('button', { name: 'Reveal', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: /Lightning \+100/ }).click();
  await page.getByRole('button', { name: 'See results' }).click();
  await expect(page.getByRole('heading', { name: 'Lightning wins!' })).toBeVisible();
  await expect(page.getByLabel('Leaderboard')).toContainText('200');
  await page.getByRole('button', { name: 'Play again' }).click();
  await expect(page.getByRole('heading', { name: /Ready, set/ })).toBeVisible();
  await expect(page.getByLabel('Lightning score 0')).toBeVisible();
});
test('home and setup are accessible and fit the viewport', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { name: /Know the Word/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Solo challenge/ })).toBeVisible();
  await expect(page.locator('.home')).toHaveCSS('opacity', '1');
  await page.screenshot({
    path: `test-results/home-${test.info().project.name}.png`,
    fullPage: true,
  });
  expect(await page.evaluate(() => window.innerWidth)).toBe(page.viewportSize()!.width);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  const home = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(home.violations).toEqual([]);
  await page.getByRole('button', { name: 'Let’s play', exact: true }).click();
  await expect(page.locator('.setup')).toHaveCSS('opacity', '1');
  const setup = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(setup.violations).toEqual([]);
});
test('solo: hint, wrong feedback, timer and personal best replay', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: /Solo challenge/ }).click();
  await page.getByLabel('Words / round').fill('1');
  await page.getByRole('button', { name: 'Start my challenge' }).click();
  await page.getByRole('button', { name: 'Let’s play', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Hint', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Hint', exact: true }).click();
  await expect(page.getByText(/Starts with/)).toBeVisible();
  await page.getByLabel('Your answer').fill('not-the-answer');
  await page.getByRole('button', { name: 'Lock it in' }).click();
  await expect(page.getByText('Good try. Here’s the answer.')).toBeVisible();
  await page.getByRole('button', { name: 'See results' }).click();
  await expect(page.getByText(/Personal best:/)).toBeVisible();
  await page.getByRole('button', { name: 'Play again' }).click();
  await expect(page.getByRole('heading', { name: /Ready, set/ })).toBeVisible();
});
