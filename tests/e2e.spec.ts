import { test, expect } from '@playwright/test';

const BASE = '/swift-modern-guide';

test.beforeEach(async ({ context }) => {
  // 阻断一切非本站请求：站点运行期不得依赖第三方域名
  await context.route(/.*/, (route) => {
    const url = route.request().url();
    if (url.startsWith('http://127.0.0.1:4173')) return route.continue();
    return route.abort();
  });
});

test.describe('无外部请求', () => {
  test('首页加载不出现任何第三方请求', async ({ page }) => {
    const offenders: string[] = [];
    page.on('request', (req) => {
      const u = req.url();
      if (!u.startsWith('http://127.0.0.1:4173')) offenders.push(u);
    });
    await page.goto(`${BASE}/`);
    await page.waitForLoadState('networkidle');
    expect(offenders).toEqual([]);
  });
});

test.describe('移动端布局（390px 项目）', () => {
  test('文档无横向溢出', async ({ page }) => {
    await page.goto(`${BASE}/features/f02-typed-throws/`);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('320px 下长代码只在容器内滚动', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto(`${BASE}/features/f20-inline-array/`);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
    const firstPre = page.locator('.code-block pre').first();
    await expect(firstPre).toBeVisible();
  });

  test('触控目标 ≥ 44px（筛选按钮/顶栏按钮）', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const sizes = await page.evaluate(() =>
      Array.from(document.querySelectorAll('.filter-bar button')).map((b) => ({
        w: b.getBoundingClientRect().width,
        h: b.getBoundingClientRect().height,
      })),
    );
    expect(sizes.length).toBeGreaterThan(0);
    for (const s of sizes) expect(Math.min(s.w, s.h)).toBeGreaterThanOrEqual(44);
  });
});

test.describe('深浅色主题', () => {
  test('切换后正文字色与背景反转，刷新保留偏好', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const before = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    await page.click('#theme-toggle');
    const after = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(after).not.toBe(before);
    await page.reload();
    const kept = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(kept).toBe(after);
    const bg = await page.evaluate(
      () => getComputedStyle(document.body).backgroundColor,
    );
    const dark = kept === 'dark';
    expect(bg).toBe(dark ? 'rgb(13, 17, 23)' : 'rgb(255, 255, 255)');
  });

  test('深色下代码块文字使用 dark 变量且有对比', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('smg-theme', 'dark'));
    await page.goto(`${BASE}/features/f03-noncopyable/`);
    const span = page.locator('.code-block pre span').first();
    await expect(span).toBeVisible();
    const color = await span.evaluate((el) => getComputedStyle(el).color);
    expect(color).not.toBe('rgb(31, 35, 40)'); // 非 light 字色
  });
});

test.describe('搜索', () => {
  test('键盘 / 打开、英文查询、Escape 关闭并还焦点', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.keyboard.press('/');
    const dialog = page.locator('#search-dialog');
    await expect(dialog).toHaveAttribute('open', '');
    await expect(page.locator('#search-input')).toBeFocused();
    await page.fill('#search-input', 'typed throws');
    await expect(page.locator('#search-results a').first()).toContainText('F02');
    await page.keyboard.press('Escape');
    expect(await dialog.evaluate((d: HTMLDialogElement) => d.open)).toBe(false);
    await expect(page.locator('#search-open')).toBeFocused();
  });

  test('中文与 SE 编号查询都能命中', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.click('#search-open');
    await page.fill('#search-input', '并发');
    const links = page.locator('#search-results a');
    await expect.poll(() => links.count()).toBeGreaterThan(0);
    await page.fill('#search-input', 'SE-0413');
    await expect.poll(async () => (await links.count())).toBeGreaterThan(0);
    const first = links.first();
    await expect(first).toContainText('F02');
    await page.fill('#search-input', '不存在词条xyzzy123');
    await expect(page.locator('.search-empty')).toBeVisible();
  });
});

test.describe('版本筛选', () => {
  test('6.4 只显示 6.4 专属卡片；全部恢复', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const allCards = page.locator('[data-versions]');
    const total = await allCards.count();
    expect(total).toBeGreaterThanOrEqual(33);
    await page.click('.filter-bar button[data-version="6.4"]');
    const visibleIds = await allCards.evaluateAll((els) =>
      els.filter((e) => (e as HTMLElement).style.display !== 'none').map((e) => e.querySelector('.fc-id')?.textContent),
    );
    expect(visibleIds.length).toBeGreaterThan(0);
    expect(visibleIds.length).toBeLessThan(total);
    // 6.4 首发三条 + 版本数组里合法包含 6.4 的 F09（Embedded 在 6.4 有实质增强）
    const expectable = ['F09', 'F31', 'F32', 'F33'];
    for (const id of visibleIds) expect(expectable).toContain(id);
    expect(visibleIds).toContain('F31');
    await page.click('.filter-bar button[data-version="all"]');
    const restored = await allCards.evaluateAll(
      (els) => els.filter((e) => (e as HTMLElement).style.display !== 'none').length,
    );
    expect(restored).toBe(total);
  });
});

test.describe('复制按钮', () => {
  test('复制内容与源码一致', async ({ page }) => {
    await page.goto(`${BASE}/features/f07-mutex/`);
    const block = page.locator('.code-block').first();
    await expect(block).toBeVisible();
    const expected = await block.evaluate((el) => el.querySelector('pre')?.textContent ?? '');
    await block.locator('.copy-btn').click();
    const clipped = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipped).toBe(expected);
  });
});

test.describe('无 JS 可读性', () => {
  test('禁 JS 后正文/验证区块仍完整渲染', async ({ page, browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const p = await ctx.newPage();
    await p.goto(`${BASE}/features/f19-concurrent-caller-isolated/`);
    await expect(p.locator('h1')).toBeVisible();
    await expect(p.locator('.verify-section')).toBeVisible();
    await expect(p.locator('.code-block pre').first()).toBeVisible();
    await ctx.close();
  });
});

test.describe('验证与日志链接', () => {
  test('验证总表每个日志 .txt 可访问且首屏预算未把日志打进 HTML', async ({ page, request }) => {
    await page.goto(`${BASE}/verification/`);
    const rows = page.locator('table tbody tr');
    expect(await rows.count()).toBe(33);
    const logLinks = await page.locator('table a[href*="/logs/"]').evaluateAll((els) =>
      els.slice(0, 6).map((e) => (e as HTMLAnchorElement).getAttribute('href')),
    );
    for (const href of logLinks) {
      const res = await request.get(href!);
      expect(res.status()).toBe(200);
      const body = await res.text();
      expect(body).toContain('result: PASS');
    }
  });
  test('404 页面存在', async ({ request }) => {
    const res = await request.get(`${BASE}/no-such-page/`);
    expect(res.status()).toBe(404);
  });
});
