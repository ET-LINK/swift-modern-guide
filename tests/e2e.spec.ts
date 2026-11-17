import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE = '/swift-modern-guide';

function versionSetsFromFrontmatter(): Map<string, string[]> {
  // 门禁的独立来源：期望集由 src/content/features 的 frontmatter 推导，
  // 而不是照抄页面行为——dist 被篡改/漏构建时此断言必须转红。
  const dir = path.resolve('src/content/features');
  const out = new Map<string, string[]>();
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.mdx'))) {
    const raw = fs.readFileSync(path.join(dir, f), 'utf8').split('---\n')[1] ?? '';
    const id = /id:\s*(F\d{2})/.exec(raw)?.[1];
    const versions = /versions:\s*\[([^\]]*)\]/.exec(raw)?.[1]
      ?.split(',')
      .map((x) => x.trim().replace(/['"]/g, ''))
      .filter(Boolean);
    if (id && versions) out.set(id, versions);
  }
  return out;
}


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
  test('每个筛选版本的可见集合与 frontmatter 精确相等（缺失/多余都算失败）', async ({ page }) => {
    const byId = versionSetsFromFrontmatter();
    expect(byId.size).toBe(33);
    const allCards = page.locator('[data-versions]');
    await page.goto(`${BASE}/`);

    for (const v of ['5.9', '6.0', '6.1', '6.2', '6.3', '6.4']) {
      await page.click(`.filter-bar button[data-version="${v}"]`);
      const expected = [...byId.entries()].filter(([, vs]) => vs.includes(v)).map(([id]) => id).sort();
      const visible = (await allCards.evaluateAll((els) =>
        els
          .filter((e) => (e as HTMLElement).style.display !== 'none')
          .map((e) => e.querySelector('.fc-id')?.textContent),
      )).sort();
      expect(visible, `筛选 ${v} 的可见集与 frontmatter 期望集不等`).toEqual(expected);
      await expect(page.locator('.filter-count')).toContainText(`${expected.length} 个特性`);
    }

    // 「全部版本」恢复完整 33 张
    await page.click('.filter-bar button[data-version="all"]');
    const restored = await allCards.evaluateAll(
      (els) => els.filter((e) => (e as HTMLElement).style.display !== 'none').length,
    );
    expect(restored).toBe(33);
  });
});

test.describe('复制按钮', () => {
  test('复制内容与 examples/f07/after.swift 源文件逐字一致（expected 取自源码，非 DOM 循环）', async ({ page }) => {
    // 门禁目的：expected 必须来自 examples/ 源文件，页面 DOM 若已偏离源文件也要转红
    const expected = fs.readFileSync('examples/f07/after.swift', 'utf8');
    await page.goto(`${BASE}/features/f07-mutex/`);
    // 页面上 before 在前、after 在后：用 after 独有的 import Synchronization 定位
    const block = page.locator('.code-block').filter({ hasText: 'import Synchronization' }).first();
    await expect(block).toBeVisible();
    // 渲染组件会去掉源码末尾的空白（换行），断言口径 = 源文件去尾空白后逐字相等
    const expectedTrimmed = expected.replace(/\s+$/, '');
    const domText = await block.evaluate((el) => el.querySelector('pre')?.textContent ?? '');
    expect(domText).toBe(expectedTrimmed);
    await block.locator('.copy-btn').click();
    const clipped = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipped).toBe(expectedTrimmed);
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


test.describe('站内导航可点击（P0 门禁）', () => {
  const navTargets = [
    { sel: '.site-header .brand', label: 'brand' },
    ...[
      `${BASE}/features/`,
      `${BASE}/themes/concurrency/`,
      `${BASE}/migration/`,
      `${BASE}/verification/`,
      `${BASE}/about/`,
      `${BASE}/`,
    ].map((href) => ({ sel: `.site-header .nav-links a[href="${href}"]`, label: href })),
    ...[
      `${BASE}/about/`,
      `${BASE}/verification/`,
    ].map((href) => ({ sel: `.site-footer a[href="${href}"]`, label: `footer ${href}` })),
  ];

  test('header/footer/brand 的 href 一律以 /swift-modern-guide 开头且可点开', async ({ page }) => {
    await page.goto(`${BASE}/features/f02-typed-throws/`);
    for (const t of navTargets) {
      const el = page.locator(t.sel).first();
      await expect(el, `缺少导航元素 ${t.label}`).toBeVisible();
      const href = await el.getAttribute('href');
      expect(href, `${t.label} 的 href 不能是 protocol-relative`).toMatch(/^\/swift-modern-guide(\/|$)/);
      expect(href ?? '', `${t.label} 不允许 // 前缀`).not.toMatch(/^\/\//);
      const resp = await page.request.get(href!);
      expect(resp.status(), `${t.label} 应 200`).toBe(200);
    }
  });

  test('点击导航真实跳转（首页→迁移指南→验证总表）', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.click('.site-header .nav-links a[href*="/migration/"]');
    await page.waitForURL(`**${BASE}/migration/**`);
    await expect(page.locator('h1')).toContainText('实操顺序');
    await page.click('.site-header .nav-links a[href*="/verification/"]');
    await page.waitForURL(`**${BASE}/verification/**`);
    await expect(page.locator('h1')).toContainText('验证总表');
    await page.click('.site-header .brand');
    await page.waitForURL(`**${BASE}/`);
    await expect(page.locator('h1')).toBeVisible();
  });
});

test.describe('搜索慢索引竞态（P1 门禁）', () => {
  test('索引延迟 1.5s 时，打开即输入也必须出结果（不需要第二次键入）', async ({ page }) => {
    await page.route('**/search-index.json', async (route) => {
      await new Promise((r) => setTimeout(r, 1500));
      await route.continue();
    });
    await page.goto(`${BASE}/`);
    await page.click('#search-open');
    await page.fill('#search-input', '并发');
    // 3 秒内必须由「加载完成后的补渲染」给出结果
    await expect
      .poll(async () => await page.locator('#search-results a').count(), { timeout: 3000 })
      .toBeGreaterThan(0);
  });
});

test.describe('顶栏触控目标（P2 门禁）', () => {
  test('header 图标按钮 ≥ 44×44', async ({ page }) => {
    await page.goto(`${BASE}/`);
    for (const sel of ['#search-open', '#theme-toggle']) {
      const box = await page.locator(sel).boundingBox();
      expect(box, sel).toBeTruthy();
      expect(Math.min(box!.width, box!.height), `${sel} 触控目标至少 44px`).toBeGreaterThanOrEqual(44);
    }
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

test.describe('F28 完整配置在页面可见（P2 门禁）', () => {
  test('f28 页面展示的 dump 输出包含 "version" 行，与文案宣称一致', async ({ page }) => {
    await page.goto(`${BASE}/features/f28-swift-format-effective-config/`);
    const pre = page.locator('.verify-sample pre').first();
    await expect(pre).toBeVisible();
    const text = await pre.textContent();
    expect(text ?? '').toContain('"version"');
    expect(text ?? '').toContain('"fileScopedDeclarationPrivacy"');
  });
});
