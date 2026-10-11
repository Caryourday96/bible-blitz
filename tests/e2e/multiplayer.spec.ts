import { test, expect, type Page } from '@playwright/test';
import { questions } from '../../src/game/questions';
async function setupHost(page: Page, mode: 'online' | 'host' = 'online') {
  await page.goto('./');
  await page
    .getByRole('button', { name: mode === 'online' ? /Play online Share/ : /Host \+ big screen/ })
    .click();
  await page.getByLabel('Rounds', { exact: true }).fill('1');
  await page.getByLabel('Words / round').fill('1');
  await page.getByLabel('Time per word').selectOption('0');
  await page.getByLabel('Sudden-death tiebreaker').uncheck();
  await page.getByRole('button', { name: 'Create game', exact: true }).click();
  await expect(page.getByRole('heading', { name: /Ready, set/ })).toBeVisible();
  return await page.getByLabel('Room invite link').inputValue();
}
test('online: player and display synchronize, buzz and answer, reconnect and replay', async ({
  page,
  browser,
}) => {
  const invite = await setupHost(page);
  const playerContext = await browser.newContext(),
    displayContext = await browser.newContext();
  const player = await playerContext.newPage(),
    display = await displayContext.newPage();
  try {
    await player.goto(invite);
    await player.getByLabel('Your name', { exact: true }).fill('Ada');
    await player.getByRole('button', { name: 'Join the game', exact: true }).click();
    await player.getByLabel('Your team', { exact: true }).selectOption('team-2');
    await display.goto(`${invite}&display=1`);
    await display.getByRole('button', { name: 'Connect display', exact: true }).click();
    await expect(display.getByRole('heading', { name: /Ready, set/ })).toBeVisible();
    await expect(display.getByRole('button', { name: 'Let’s play', exact: true })).toHaveCount(0);
    await page.reload();
    await expect(page.getByRole('button', { name: 'Let’s play', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Let’s play', exact: true }).click();
    await expect(player.getByRole('button', { name: 'BUZZ IN', exact: true })).toBeEnabled();
    await expect(display.getByLabel('Current question')).toContainText('UNSCRAMBLE THE WORD');
    await expect(display.getByRole('button', { name: 'Reveal', exact: true })).toHaveCount(0);
    const scramble = await player.locator('.letter-tiles').getAttribute('aria-label');
    await expect(display.locator('.letter-tiles')).toHaveAttribute('aria-label', scramble!);
    await player.reload();
    await expect(player.getByRole('button', { name: 'BUZZ IN', exact: true })).toBeEnabled();
    await player.getByRole('button', { name: 'BUZZ IN', exact: true }).click();
    await expect(page.getByText('Team Faith buzzed first!')).toBeVisible();
    // Known fixture bank resolves the visible anagram; do not read private server state through the app.
    const sorted = (scramble || '').replace('Scrambled word: ', '').split('').sort().join('');
    const candidates = questions.filter((q) => q.scrambled.split('').sort().join('') === sorted);
    expect(candidates.length).toBeGreaterThan(0);
    await player.getByLabel('Your answer').fill(candidates[0].answer);
    await player.getByRole('button', { name: 'Lock it in' }).click();
    await expect(page.getByLabel('Team Faith score 100')).toBeVisible();
    await expect(display.getByLabel('Team Faith score 100')).toBeVisible();
    await display.screenshot({
      path: `test-results/display-${test.info().project.name}.png`,
      fullPage: true,
    });
    await page.getByRole('button', { name: 'See results' }).click();
    await expect(player.getByRole('heading', { name: 'Team Faith wins!' })).toBeVisible();
    await expect(display.getByRole('heading', { name: 'Team Faith wins!' })).toBeVisible();
    await page.getByRole('button', { name: 'Play again' }).click();
    await expect(player.getByLabel('Your team', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Team Faith score 0')).toBeVisible();
  } finally {
    await playerContext.close();
    await displayContext.close();
  }
});
test('host mode: cross-device screen follows host and has no admin controls', async ({
  page,
  browser,
}) => {
  const invite = await setupHost(page, 'host');
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const display = await context.newPage();
  try {
    await display.goto(`${invite}&display=1`);
    await display.getByRole('button', { name: 'Connect display', exact: true }).click();
    await page.getByRole('button', { name: 'Let’s play', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Reveal', exact: true })).toBeEnabled();
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    await expect(display.getByRole('heading', { name: 'A little breather.' })).toBeVisible();
    await page.getByRole('button', { name: 'Resume', exact: true }).click();
    await page.getByRole('button', { name: 'Reveal', exact: true }).click();
    await expect(display.locator('.letter-tiles')).toHaveAttribute('aria-label', /^Answer:/);
    await page.getByRole('button', { name: /Team Grace \+100/ }).click();
    await expect(display.getByLabel('Team Grace score 100')).toBeVisible();
    await expect(display.getByRole('button', { name: /Undo|Pause|Reveal|End game/ })).toHaveCount(
      0,
    );
    expect(await display.evaluate(() => document.documentElement.scrollWidth)).toBe(1920);
    await display.screenshot({
      path: `test-results/projector-${test.info().project.name}.png`,
      fullPage: true,
    });
  } finally {
    await context.close();
  }
});
