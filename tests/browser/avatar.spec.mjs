import { expect, test } from '../fixtures/test.mjs';

/**
 * Avatar component tests.
 * Avatar is a static identity container: the contract under test is the
 * circle geometry (object-fit cover), token sizes, the status-dot color
 * model, the group stacking and the absence of interactive semantics
 * (tests/README.md).
 */

test.beforeEach(async ({ page }) => {
  await page.goto('/fixture.html');
});

const token = (page, name) =>
  page.evaluate(
    (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim(),
    [name],
  );

test('the image is cropped into the circle (object-fit: cover)', async ({ page }) => {
  const styles = await page.locator('#avatar-default img').evaluate((el) => {
    const s = getComputedStyle(el);
    return { objectFit: s.objectFit, radius: s.borderRadius, width: s.width, height: s.height };
  });
  expect(styles.objectFit).toBe('cover');
  // The image rounds itself (the container must not clip the status dot).
  expect(styles.radius).not.toBe('0px');
});

test('the container is square and circular', async ({ page }) => {
  const box = await page.locator('#avatar-default').evaluate((el) => {
    const s = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return { width: rect.width, height: rect.height, radius: s.borderRadius };
  });
  expect(box.width).toBe(box.height);
  expect(box.radius).not.toBe('0px');
});

test('sizes scale monotonically (sm < md < lg)', async ({ page }) => {
  const heightOf = (id) =>
    page.locator(`#${id}`).evaluate((el) => el.getBoundingClientRect().height);
  const sm = await heightOf('avatar-sm');
  const md = await heightOf('avatar-default');
  const lg = await heightOf('avatar-lg');
  expect(sm).toBeLessThan(md);
  expect(md).toBeLessThan(lg);
  // Integer heights at the full space scale: the avatar keeps the
  // device-pixel grid of the flow below (the Badge precedent).
  for (const h of [sm, md, lg]) expect(Number.isInteger(h)).toBe(true);
});

test('status dots map to their family tokens', async ({ page }) => {
  const cases = [
    { id: 'avatar-online', tokenName: '--ui-color-brand' },
    { id: 'avatar-away', tokenName: '--ui-color-text-muted' },
    { id: 'avatar-busy', tokenName: '--ui-color-attention' },
  ];
  for (const { id, tokenName } of cases) {
    const dot = await page.locator(`#${id}`).evaluate((el) => {
      const s = getComputedStyle(el, '::after');
      return { content: s.content, background: s.backgroundColor };
    });
    expect(dot.content, id).toBe('""');
    expect(dot.background, id).toBe(await token(page, tokenName));
  }
});

test('the dot renders only with data-status', async ({ page }) => {
  const content = await page
    .locator('#avatar-default')
    .evaluate((el) => getComputedStyle(el, '::after').content);
  expect(content).toBe('none');
});

test('the dot color follows the theme switch (light-dark token)', async ({ page }) => {
  const readDot = () =>
    page
      .locator('#avatar-online')
      .evaluate((el) => getComputedStyle(el, '::after').backgroundColor);

  await page.emulateMedia({ colorScheme: 'light' });
  const light = await readDot();

  await page.emulateMedia({ colorScheme: 'dark' });
  const dark = await readDot();

  expect(light).not.toBe(dark);
});

test('group avatars stack with a negative offset and a separation ring', async ({ page }) => {
  const group = page.locator('#avatar-group .ui-avatar');
  const second = await group.nth(1).evaluate((el) => {
    const s = getComputedStyle(el);
    return { marginInlineStart: s.marginInlineStart, borderWidth: s.borderTopWidth };
  });
  expect(parseFloat(second.marginInlineStart)).toBeLessThan(0);
  expect(parseFloat(second.borderWidth)).toBeGreaterThan(0);

  // A standalone avatar wears no ring.
  const standalone = await page.locator('#avatar-standalone').evaluate((el) => {
    const s = getComputedStyle(el);
    return { marginInlineStart: s.marginInlineStart, borderWidth: s.borderTopWidth };
  });
  expect(standalone.borderWidth).toBe('0px');
});

test('avatar exposes no interactive semantics', async ({ page }) => {
  const avatar = page.locator('#avatar-default');
  await expect(avatar).not.toHaveRole('button');
  await expect(avatar).not.toHaveRole('link');
  const tabindex = await avatar.evaluate((el) => el.getAttribute('tabindex'));
  expect(tabindex).toBeNull();
});

test('the img is the named element (role img, alt); the span stays generic', async ({ page }) => {
  await expect(page.locator('#avatar-default img')).toHaveAccessibleName('Ada Lovelace');
  await expect(page.locator('#avatar-default')).not.toHaveRole('img');
});
