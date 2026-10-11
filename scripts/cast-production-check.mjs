import { chromium, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

// Real deployed pages, iframe headers and sockets. Only Google Cast hardware transport is simulated.
const base = process.env.E2E_BASE_URL;
if (base !== 'https://adeticket.com/bibleblitz/')
  throw new Error('Set E2E_BASE_URL=https://adeticket.com/bibleblitz/ to run this live check.');
await mkdir('test-results', { recursive: true });
const browser = await chromium.launch();
const hostContext = await browser.newContext();
const tvContext = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
const host = await hostContext.newPage();
const tv = await tvContext.newPage();
const errors = [];
for (const page of [host, tv]) {
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('response', (response) => {
    if (response.status() >= 400 && /^https:\/\/(ff\.)?adeticket\.com\//.test(response.url()))
      errors.push(`${response.status()} ${response.url()}`);
  });
}
try {
  for (const path of ['tv', 'tv.html']) {
    const response = await host.request.get(new URL(path, base).href);
    expect(response.ok()).toBe(true);
    expect(response.headers()['x-frame-options'] || '').toBe('');
    expect(response.headers()['content-security-policy']).toBe(
      "frame-ancestors 'self' https://ff.adeticket.com",
    );
  }
  expect((await host.request.get(base)).headers()['x-frame-options']).toBe('DENY');
  await host.exposeFunction('sendToTV', (namespace, data) =>
    tv.evaluate(({ namespace, data }) => window.testReceiver.select(namespace, data), {
      namespace,
      data,
    }),
  );
  await tv.exposeFunction('sendToHost', (namespace, senderId, message) => {
    expect(senderId).toBe('test-host');
    return host.evaluate(
      ({ namespace, message }) => window.testSender.receive(namespace, message),
      { namespace, message },
    );
  });
  await host.addInitScript(() => {
    let active = false;
    let listener;
    const events = new Map();
    const session = {
      getCastDevice: () => ({ friendlyName: 'Simulated Cast transport' }),
      sendMessage: (namespace, message) => window.sendToTV(namespace, message),
      addMessageListener: (_namespace, callback) => {
        listener = callback;
      },
      removeMessageListener: () => {
        listener = undefined;
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
      addEventListener: (name, callback) => events.set(name, callback),
      removeEventListener: (name) => events.delete(name),
    };
    Object.assign(window, {
      cast: { framework: { CastContext: { getInstance: () => context } } },
      testSender: { receive: (namespace, message) => listener?.(namespace, message) },
    });
  });
  await tv.addInitScript(() => {
    const handlers = new Map();
    const context = {
      addCustomMessageListener: (namespace, callback) => handlers.set(namespace, callback),
      sendCustomMessage: (namespace, senderId, message) =>
        void window.sendToHost(namespace, senderId, message),
      start: () => {},
    };
    Object.assign(window, {
      cast: { framework: { CastReceiverContext: { getInstance: () => context } } },
      testReceiver: {
        ready: () => handlers.has('urn:x-cast:com.adeticket.bibleblitz'),
        select: (namespace, data) => handlers.get(namespace)?.({ senderId: 'test-host', data }),
      },
    });
  });
  await tv.goto('https://ff.adeticket.com/cast');
  await expect.poll(() => tv.evaluate(() => window.testReceiver.ready())).toBe(true);
  await host.goto(base);
  await host.getByRole('button', { name: /Host \+ big screen/ }).click();
  await host.getByLabel('Rounds', { exact: true }).fill('1');
  await host.getByLabel('Words / round').fill('1');
  await host.getByLabel('Time per word').selectOption('0');
  await host.getByLabel('Sudden-death tiebreaker').uncheck();
  await host.getByRole('button', { name: 'Create game', exact: true }).click();
  await expect(host.getByRole('heading', { name: /Ready, set/ })).toBeVisible();
  const panel = host.getByRole('region', { name: 'Cast to TV', exact: true });
  await panel.getByRole('button', { name: 'Cast to TV', exact: true }).click();
  await expect(panel.getByRole('status')).toContainText('Game connected to TV', { timeout: 20000 });
  const display = tv.frameLocator('iframe[title="Bible Blitz TV display"]');
  await expect(display.getByRole('heading', { name: /Ready, set/ })).toBeVisible();
  await expect(display.getByRole('button')).toHaveCount(0);
  await host.getByRole('button', { name: 'Let’s play', exact: true }).click();
  await expect(host.getByRole('button', { name: 'Reveal', exact: true })).toBeEnabled();
  await host.getByRole('button', { name: /Team Grace \+100/ }).click();
  await expect(display.getByLabel('Team Grace score 100')).toBeVisible();
  await tv.screenshot({
    path: 'test-results/live-cast-tv.png',
    fullPage: true,
    animations: 'disabled',
  });
  await host.getByRole('button', { name: 'See results' }).click();
  await expect(display.getByRole('heading', { name: 'Team Grace wins!' })).toBeVisible();
  await host.getByRole('button', { name: 'Play again' }).click();
  await expect(display.getByLabel('Team Grace score 0')).toBeVisible();
  await tvContext.setOffline(true);
  await expect(panel.getByRole('status')).toContainText('reconnecting', { timeout: 60000 });
  await tvContext.setOffline(false);
  await expect(panel.getByRole('status')).toContainText('Game connected to TV', { timeout: 20000 });
  await panel.getByRole('button', { name: 'Stop casting' }).click();
  await expect(host.getByRole('button', { name: 'Let’s play', exact: true })).toBeEnabled();
  expect(errors).toEqual([]);
  console.log(
    'Live host → receiver → restricted iframe → Socket.IO → acknowledgement passed; scoring, replay, network recovery and stop controls passed. Google Cast hardware transport was simulated; physical TV discovery/launch remains unverified.',
  );
} finally {
  await browser.close();
}
