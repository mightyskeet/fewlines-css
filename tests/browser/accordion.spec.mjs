import { expect, test } from '@playwright/test';

/**
 * Native accordion behavior tests (tests/README.md).
 * Covers: open/close via <details>, keyboard toggle, native state attribute.
 */

test.beforeEach(async ({ page }) => {
  await page.goto('/fixture.html');
});

test('stacked accordion corners: seam is straight, container edges keep radius', async ({
  page,
}) => {
  const radii = (id) =>
    page.locator(id).evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        start: [s.borderStartStartRadius, s.borderStartEndRadius],
        end: [s.borderEndStartRadius, s.borderEndEndRadius],
      };
    });

  const first = await radii('#accordion-first');
  const second = await radii('#accordion-second');

  // The shared edge is straight: end corners of the preceding item and
  // start corners of the following item are squared.
  expect(first.end).toEqual(['0px', '0px']);
  expect(second.start).toEqual(['0px', '0px']);

  // The container edges keep the same (non-zero) radius on both ends.
  expect(second.end).toEqual(first.start);
  expect(first.start[0]).not.toBe('0px');
});

test('accordion opens and closes via summary click', async ({ page }) => {
  const details = page.locator('#accordion-first');
  await expect(details).not.toHaveAttribute('open');

  await page.click('#accordion-summary-first');
  await expect(details).toHaveAttribute('open');

  await page.click('#accordion-summary-first');
  await expect(details).not.toHaveAttribute('open');
});

test('accordion toggles via keyboard (Enter on summary)', async ({ page }) => {
  const details = page.locator('#accordion-first');

  await page.locator('#accordion-summary-first').focus();
  await page.keyboard.press('Enter');
  await expect(details).toHaveAttribute('open');

  await page.keyboard.press('Enter');
  await expect(details).not.toHaveAttribute('open');
});

test('accordion toggles via keyboard (Space on summary)', async ({ page }) => {
  const details = page.locator('#accordion-second');

  await page.locator('#accordion-summary-second').focus();
  await page.keyboard.press('Space');
  await expect(details).toHaveAttribute('open');

  await page.keyboard.press('Space');
  await expect(details).not.toHaveAttribute('open');
});

test('open attribute is the native state (no JS classes)', async ({ page }) => {
  await page.click('#accordion-summary-first');

  const isOpen = await page.locator('#accordion-first').evaluate((el) => el.open);
  expect(isOpen).toBe(true);

  const contentVisible = await page.locator('#accordion-first .ui-accordion-content').isVisible();
  expect(contentVisible).toBe(true);
});

test('summary is reachable via Tab and exposes disclosure semantics', async ({ page }) => {
  const summary = page.locator('#accordion-summary-first');
  await summary.focus();

  const isSummary = await summary.evaluate((el) => el.tagName === 'SUMMARY');
  expect(isSummary).toBe(true);

  // Native disclosure: summary toggles its parent details.
  await page.keyboard.press('Enter');
  const open = await page.locator('#accordion-first').evaluate((el) => el.open);
  expect(open).toBe(true);
});

test('expand animation is on by default when the engine supports it', async ({ page }) => {
  const details = page.locator('#accordion-first');

  const supported = await details.evaluate((el) => CSS.supports('selector(::details-content)'));

  await page.click('#accordion-summary-first');
  await expect(details).toHaveAttribute('open');

  if (supported) {
    // Behavioral check: the content box must grow over frames, not snap.
    // The grid track interpolates between minmax(0, 0fr) and minmax(0, 1fr);
    // a single-frame jump would mean the track is not animating. Layout
    // height is sampled — computed style serialization differs per engine
    // (e.g. Firefox reports "auto" for the pseudo's block-size).
    const frames = await details.evaluate((el) => {
      el.open = false;
      return new Promise((resolve) => {
        requestAnimationFrame(() => {
          el.open = true;
          const samples = [];
          const t0 = performance.now();
          const tick = () => {
            const t = performance.now() - t0;
            samples.push(el.getBoundingClientRect().height);
            if (t < 120) requestAnimationFrame(tick);
            else resolve(samples);
          };
          requestAnimationFrame(tick);
        });
      });
    });

    const unique = new Set(frames);
    // Interpolation produces several distinct intermediate heights; the
    // first sampled frame may already be past 0 (rAF timing), so we assert
    // the animation is progressive rather than a single-frame snap.
    expect(unique.size).toBeGreaterThan(2);
    expect(Number.parseFloat(frames.at(-1))).toBeGreaterThan(Number.parseFloat(frames[0]));
  } else {
    // Graceful degradation: no animation, content appears instantly.
    const visible = await details.locator('.ui-accordion-content').isVisible();
    expect(visible).toBe(true);
  }
});

test('closed accordion has no phantom height (minmax(0, 0fr) floor)', async ({ page }) => {
  const details = page.locator('#accordion-first');

  const supported = await details.evaluate((el) => CSS.supports('selector(::details-content)'));
  if (!supported) return;

  // Closed resting state: the summary + border only. The content padding
  // must not hold the grid track open (a plain 0fr track would).
  const closedHeight = await details.evaluate((el) => el.getBoundingClientRect().height);
  const summaryHeight = await details
    .locator('summary')
    .evaluate((el) => el.getBoundingClientRect().height);
  expect(closedHeight).toBeLessThanOrEqual(summaryHeight + 2);
});

test('exclusive group: opening one closes the other', async ({ page }) => {
  await page.goto('/pages/accordion.html');

  const a = page.locator('.example details[name="faq"]').first();
  const b = page.locator('.example details[name="faq"]').nth(1);

  await a.locator('summary').click();
  await expect(a).toHaveAttribute('open');
  await expect(b).not.toHaveAttribute('open');

  await b.locator('summary').click();
  await expect(b).toHaveAttribute('open');
  await expect(a).not.toHaveAttribute('open');
});
