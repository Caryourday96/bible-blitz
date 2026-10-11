import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function create(page: Page, remote = true) {
  await page.goto('./');
  await page
    .getByRole('button', { name: remote ? /Host \+ big screen/ : 'Let’s play', exact: !remote })
    .click();
  await page.getByLabel('Rounds', { exact: true }).fill('2');
  await page.getByLabel('Words / round').fill('2');
  await page.getByLabel('Time per word').selectOption('0');
  await page.getByLabel('Sudden-death tiebreaker').uncheck();
  await page.getByRole('button', { name: 'Create game', exact: true }).click();
  await expect(page.getByRole('heading', { name: /Ready, set/ })).toBeVisible();
}
test('host plans privately, replaces words, edits teams and publishes a TV theme without exposing controls', async ({
  page,
  browser,
  baseURL,
}, info) => {
  await create(page);
  const code = new URL(await page.getByLabel('Room invite link').inputValue()).searchParams.get(
    'room',
  );
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    reducedMotion: 'reduce',
  });
  const tv = await context.newPage();
  try {
    await tv.goto(new URL(`tv?room=${code}`, baseURL).href);
    await expect(tv.getByRole('heading', { name: /Ready, set/ })).toBeVisible();
    await page.getByRole('button', { name: 'Host Control Center', exact: true }).click();
    const before = await page.locator('.plan-word strong').allTextContents();
    await page.getByRole('button', { name: 'Move word 2 earlier', exact: true }).click();
    await expect(page.locator('.plan-word strong').first()).toHaveText(before[1]);
    await page.getByRole('button', { name: 'Move round later', exact: true }).click();
    await expect(page.getByLabel('View round')).toHaveValue('1');
    await expect(page.locator('.plan-word strong').first()).toHaveText(before[1]);
    await page.getByLabel('View round').selectOption('0');
    await page.getByRole('button', { name: 'Replace word 1', exact: true }).click();
    const replacement = await page.locator('.replacement-option strong').first().innerText();
    await page.locator('.replacement-option').first().click();
    await expect(page.locator('.plan-word strong').first()).toHaveText(replacement);
    await expect(tv.locator('.host-tools')).toHaveCount(0);
    await expect(tv.getByText(replacement, { exact: true })).toHaveCount(0);
    await page.screenshot({
      path: `test-results/host-center-${info.project.name}.png`,
      fullPage: true,
      animations: 'disabled',
    });
    await page.getByRole('button', { name: 'Teams', exact: true }).click();
    await page.getByLabel('Name for Team Grace', { exact: true }).fill('Champions');
    await page.getByLabel('Color for Team Grace', { exact: true }).fill('#a5c7f7');
    await page.locator('.team-editor').first().getByRole('button', { name: 'Save team' }).click();
    await expect(tv.getByLabel('Champions score 0')).toBeVisible();
    await page.getByRole('button', { name: 'TV Presentation Studio', exact: true }).click();
    await page.getByLabel('Event title', { exact: true }).fill('Youth Night');
    await page.getByRole('combobox', { name: 'Theme', exact: true }).selectOption('midnight');
    await page.getByRole('combobox', { name: 'Background', exact: true }).selectOption('grid');
    await page
      .getByRole('combobox', { name: 'TV text size', exact: true })
      .selectOption('extra-large');
    await page.getByLabel('Announcement', { exact: true }).fill('Welcome, everyone!');
    await page.getByLabel('Winner screen message', { exact: true }).fill('See you next Friday!');
    await page.getByLabel('Celebration confetti', { exact: true }).uncheck();
    await expect(tv.getByText('Youth Night', { exact: true })).toHaveCount(0);
    await page.getByRole('button', { name: 'Apply to TV', exact: true }).click();
    await expect(tv.locator('.tv-studio')).toHaveClass(
      /theme-midnight background-grid type-extra-large/,
    );
    await expect(tv.getByText('Welcome, everyone!', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Apply to TV', exact: true })).toBeDisabled();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
      page.viewportSize()!.width,
    );
    const accessibility = await new AxeBuilder({ page }).include('.host-tools').analyze();
    expect(accessibility.violations).toEqual([]);
    await page.getByRole('heading', { name: 'TV Presentation Studio', exact: true }).click();
    await page.screenshot({
      path: `test-results/studio-${info.project.name}.png`,
      fullPage: true,
      animations: 'disabled',
    });
    await page.getByRole('button', { name: 'Host Control Center', exact: true }).click();
    await page.getByRole('button', { name: 'Start game', exact: true }).click();
    await page.getByRole('button', { name: 'Pause clock', exact: true }).click();
    await page.getByRole('button', { name: 'Replace word 1', exact: true }).click();
    await page.locator('.replacement-option').first().click();
    await page.getByRole('button', { name: 'Resume clock', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Award Champions', exact: true })).toBeEnabled();
    await page.getByRole('button', { name: 'Award Champions', exact: true }).click();
    await expect(tv.getByLabel('Champions score 100')).toBeVisible();
    const scoreboard = await tv.locator('.scoreboard').boundingBox();
    expect(scoreboard!.y + scoreboard!.height).toBeLessThanOrEqual(1080);
    expect(await tv.evaluate(() => document.documentElement.scrollWidth)).toBe(1920);
    await expect(page.getByRole('button', { name: 'Replace word 1', exact: true })).toBeDisabled();
    await tv.screenshot({
      path: `test-results/studio-tv-${info.project.name}.png`,
      fullPage: true,
      animations: 'disabled',
    });
    await page.getByRole('button', { name: 'End game', exact: true }).click();
    await page.getByRole('button', { name: 'Finish game', exact: true }).click();
    await expect(tv.getByRole('heading', { name: 'Champions wins!' })).toBeVisible();
    await expect(tv.getByText('See you next Friday!', { exact: true })).toBeVisible();
    await expect(tv.locator('.confetti')).toHaveCount(0);
    await page.getByRole('button', { name: 'Play again', exact: true }).click();
    await expect(tv.getByText('Youth Night', { exact: true })).toBeVisible();
    await expect(tv.getByLabel('Champions score 0')).toBeVisible();
  } finally {
    await context.close();
  }
});
test('local presentation windows receive studio settings while drafts and host plans remain private', async ({
  page,
}) => {
  await create(page, false);
  const popup = page.waitForEvent('popup');
  await page.getByRole('link', { name: 'Open a presentation window on this device' }).click();
  const tv = await popup;
  await expect(tv.getByRole('heading', { name: /Ready, set/ })).toBeVisible();
  await page.getByRole('button', { name: 'TV Presentation Studio', exact: true }).click();
  await page.getByLabel('Event title', { exact: true }).fill('Family night');
  await page.getByRole('combobox', { name: 'Theme', exact: true }).selectOption('plum');
  await page.getByRole('button', { name: 'Apply to TV', exact: true }).click();
  await expect(tv.getByText('Family night', { exact: true })).toBeVisible();
  await expect(tv.locator('.tv-studio')).toHaveClass(/theme-plum/);
  await expect(tv.locator('.host-tools')).toHaveCount(0);
  await page.getByRole('button', { name: 'Reset draft', exact: true }).click();
  await expect(tv.getByText('Family night', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Apply to TV', exact: true }).click();
  await expect(tv.getByText('Family night', { exact: true })).toHaveCount(0);
  await tv.close();
});
