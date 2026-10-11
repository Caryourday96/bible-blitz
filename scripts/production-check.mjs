import { chromium, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const base = process.env.E2E_BASE_URL;
if (!base) throw new Error('Set E2E_BASE_URL to the deployed app URL ending with /.');
await mkdir('test-results', { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({ reducedMotion: 'reduce' });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('response', (response) => {
  if (response.status() >= 400 && response.url().startsWith(new URL(base).origin))
    errors.push(`${response.status()} ${response.url()}`);
});
try {
  await page.goto(base);
  await expect(page.locator('.home')).toHaveCSS('opacity', '1');
  for (const width of [320, 768, 1280, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(await page.evaluate(() => window.innerWidth)).toBe(width);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
  }
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.screenshot({ path: 'test-results/live-desktop.png', fullPage: true });
  const create = async (host, name) => {
    await host.goto(base);
    await host.getByRole('button', { name: 'Let’s play', exact: true }).click();
    await host.getByLabel('Team 1 name').fill(name);
    await host.getByLabel('Time per word').selectOption('0');
    await host.getByRole('button', { name: 'Create game', exact: true }).click();
    await expect(host.getByRole('heading', { name: /Ready, set/ })).toBeVisible();
  };
  await create(page, 'Local One');
  const popupEvent = page.waitForEvent('popup');
  await page.getByRole('link', { name: 'Open a presentation window on this device' }).click();
  const display = await popupEvent;
  await expect(display.getByLabel('Local One score 0')).toBeVisible();
  const secondHost = await context.newPage();
  await create(secondHost, 'Local Two');
  await page.getByRole('button', { name: 'Let’s play', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Reveal', exact: true })).toBeEnabled();
  await page.getByText('UNSCRAMBLE THE WORD', { exact: true }).click();
  await page.keyboard.press('r');
  await expect(display.locator('.letter-tiles')).toHaveAttribute('aria-label', /^Answer:/);
  await page.keyboard.press('1');
  await expect(display.getByLabel('Local One score 100')).toBeVisible();
  await expect(display.getByText('Local Two', { exact: true })).toHaveCount(0);
  await expect(secondHost.getByLabel('Local Two score 0')).toBeVisible();
  await expect(display.getByRole('button', { name: 'Undo score' })).toHaveCount(0);
  expect(errors).toEqual([]);
  console.log(
    'Live assets, 320/768/1280/1920px layouts, reduced motion, keyboard scoring, local display sync and game isolation passed.',
  );
} finally {
  await browser.close();
}
