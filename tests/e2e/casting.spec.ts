import { expect, test, type Page } from '@playwright/test';

async function host(page: Page) {
  await page.goto('./');
  await page.getByRole('button', { name: /Host \+ big screen/ }).click();
  await page.getByLabel('Rounds', { exact: true }).fill('1');
  await page.getByLabel('Words / round').fill('1');
  await page.getByLabel('Time per word').selectOption('0');
  await page.getByLabel('Sudden-death tiebreaker').uncheck();
  await page.getByRole('button', { name: 'Create game', exact: true }).click();
  await expect(page.getByRole('heading', { name: /Ready, set/ })).toBeVisible();
  return new URL(await page.getByLabel('Room invite link').inputValue()).searchParams.get('room')!;
}
test('Cast controls require TV confirmation, support reconnect and stop without ending the game', async ({
  page,
}) => {
  // A deterministic SDK fixture exercises controls, not real hardware discovery.
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'userAgent', { get: () => 'Desktop Chrome' });
    Object.defineProperty(navigator, 'platform', { get: () => 'Win32' });
    let active = false;
    const events = new Map<string, (event: { sessionState: string }) => void>();
    let receive: ((namespace: string, value: unknown) => void) | undefined;
    const sent: { namespace: string; message: { room: string; requestId: string } }[] = [];
    const session = {
      getCastDevice: () => ({ friendlyName: 'Test living-room TV' }),
      sendMessage: async (namespace: string, message: { room: string; requestId: string }) => {
        sent.push({ namespace, message });
      },
      addMessageListener: (_namespace: string, callback: typeof receive) => {
        receive = callback;
      },
      removeMessageListener: () => {
        receive = undefined;
      },
      endSession: () => {
        active = false;
        events.get('sessionstatechanged')?.({ sessionState: 'SESSION_ENDED' });
      },
    };
    const context = {
      setOptions: () => {},
      getCurrentSession: () => (active ? session : null),
      requestSession: async () => {
        active = true;
        events.get('sessionstatechanged')?.({ sessionState: 'SESSION_STARTED' });
      },
      addEventListener: (type: string, callback: (event: { sessionState: string }) => void) =>
        events.set(type, callback),
      removeEventListener: (type: string) => events.delete(type),
    };
    Object.assign(window, {
      cast: { framework: { CastContext: { getInstance: () => context } } },
      testCast: {
        sent,
        status: (status: string) => {
          const last = sent.at(-1)!;
          receive?.(last.namespace, { ...last.message, type: 'DISPLAY_STATUS', status });
        },
      },
    });
  });
  const code = await host(page);
  const panel = page.getByRole('region', { name: 'Cast to TV', exact: true });
  await panel.getByRole('button', { name: 'Cast to TV', exact: true }).click();
  await expect(panel.getByText('Test living-room TV')).toBeVisible();
  await expect(panel.getByRole('status')).toContainText('Connecting the game');
  const messages = await page.evaluate(
    () => (window as unknown as { testCast: { sent: unknown[] } }).testCast.sent,
  );
  expect(messages).toEqual([
    {
      namespace: 'urn:x-cast:com.adeticket.bibleblitz',
      message: { type: 'SHOW_ROOM', room: code, requestId: expect.any(String) },
    },
  ]);
  await page.evaluate(() =>
    (window as unknown as { testCast: { status(value: string): void } }).testCast.status('ready'),
  );
  await expect(panel.getByRole('status')).toContainText('Game connected to TV');
  await page.evaluate(() =>
    (window as unknown as { testCast: { status(value: string): void } }).testCast.status('error'),
  );
  await panel.getByRole('button', { name: 'Reconnect game' }).click();
  await expect(panel.getByRole('status')).toContainText('Connecting the game');
  await panel.getByRole('button', { name: 'Stop casting' }).click();
  await expect(panel.getByRole('button', { name: 'Cast to TV', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Let’s play', exact: true })).toBeEnabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    page.viewportSize()!.width,
  );
});

test('iPhone users receive usable AirPlay instructions without an unsupported Cast picker', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'userAgent', { get: () => 'iPhone' });
  });
  await host(page);
  const panel = page.getByRole('region', { name: 'Cast to TV', exact: true });
  await expect(panel.getByText(/open Control Center/)).toBeVisible();
  await expect(panel.getByRole('button', { name: 'Cast to TV', exact: true })).toHaveCount(0);
  await expect(panel.getByRole('link', { name: 'open the big-screen view' })).toHaveAttribute(
    'href',
    /display=1/,
  );
});

test('TV route automatically joins as a display, synchronizes scoring and follows replay', async ({
  page,
  browser,
  baseURL,
}) => {
  const code = await host(page);
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const display = await context.newPage();
  try {
    await display.goto(new URL(`tv?room=${code}`, baseURL).href);
    await expect(display.getByRole('heading', { name: /Ready, set/ })).toBeVisible();
    await expect(
      display.getByRole('button', { name: /Let’s play|Reveal|Cast to TV|Connect display/ }),
    ).toHaveCount(0);
    await page.getByRole('button', { name: 'Let’s play', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Reveal', exact: true })).toBeEnabled();
    await page.getByRole('button', { name: /Team Grace \+100/ }).click();
    await expect(display.getByLabel('Team Grace score 100')).toBeVisible();
    await page.getByRole('button', { name: 'See results' }).click();
    await expect(display.getByRole('heading', { name: 'Team Grace wins!' })).toBeVisible();
    await page.getByRole('button', { name: 'Play again' }).click();
    await expect(display.getByRole('heading', { name: /Ready, set/ })).toBeVisible();
    await expect(display.getByLabel('Team Grace score 0')).toBeVisible();
    await display.screenshot({
      path: `test-results/cast-display-${test.info().project.name}.png`,
      fullPage: true,
    });
  } finally {
    await context.close();
  }
});

test('TV route explains expired or malformed rooms', async ({ page }) => {
  await page.goto('tv?room=invalid');
  await expect(page.getByRole('heading', { name: 'Choose a game from your host.' })).toBeVisible();
  await page.goto('tv?room=ZZZZZZ');
  await expect(page.getByRole('heading', { name: 'The game is unavailable.' })).toBeVisible();
});
