import { chromium } from 'playwright';
import fs from 'node:fs';
const SP = process.env.SP;
const AXE = fs.readFileSync(`${SP}/axe.min.js`, 'utf8');
const AGENT_RULES = ['button-name','input-button-name','input-image-alt','label','link-name','select-name','document-title','aria-allowed-attr','aria-allowed-role','aria-command-name','aria-conditional-attr','aria-dialog-name','aria-hidden-body','aria-hidden-focus','aria-input-field-name','aria-prohibited-attr','aria-required-attr','aria-required-children','aria-required-parent','aria-roles','aria-text','aria-toggle-field-name','aria-tooltip-name','aria-treeitem-name','aria-valid-attr','aria-valid-attr-value','duplicate-id-aria','definition-list','table-duplicate-name','tabindex','autocomplete-valid','presentation-role-conflict','svg-img-alt'];
const B = 'http://localhost:3917';
const sm = await (await fetch(B + '/sitemap.xml')).text();
const paths = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace('https://chroma-panel.jscrate.dev', '') || '/');
paths.push('/this-page-does-not-exist');
const mode = 'agent'; AGENT_RULES.push('region','landmark-unique','scrollable-region-focusable','landmark-one-main','landmark-no-duplicate-banner','landmark-no-duplicate-contentinfo','landmark-complementary-is-top-level','page-has-heading-one','nested-interactive');
const browser = await chromium.launch();
const results = {};
for (const [label, viewport, mobile] of [['mobile', { width: 412, height: 823 }, true], ['desktop', { width: 1350, height: 940 }, false]]) {
  const ctx = await browser.newContext({ viewport, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: mobile ? 2 : 1 });
  const page = await ctx.newPage();
  for (const p of paths) {
    await page.goto(B + p, { waitUntil: 'networkidle' });
    await page.waitForTimeout(p === '/' ? 1500 : 300);
    await page.addScriptTag({ content: AXE });
    const v = await page.evaluate(async ({ rules, mode }) => {
      const opts = mode === 'agent' ? { runOnly: { type: 'rule', values: rules } } : { runOnly: { type: 'tag', values: ['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa','best-practice'] } };
      const r = await window.axe.run(document, opts);
      return r.violations.map((x) => ({ id: x.id, impact: x.impact, nodes: x.nodes.map((n) => n.target.join(' ') + ' :: ' + n.html.slice(0, 140)) }));
    }, { rules: AGENT_RULES, mode });
    for (const x of v) {
      const key = `${x.id} (${x.impact})`;
      results[key] ??= {};
      for (const n of x.nodes) {
        results[key][n] ??= new Set();
        results[key][n].add(`${label}:${p}`);
      }
    }
  }
  await ctx.close();
}
await browser.close();
for (const [rule, nodes] of Object.entries(results)) {
  console.log(`\n### ${rule}`);
  for (const [n, where] of Object.entries(nodes)) {
    const w = [...where];
    console.log(`- ${n}\n    on ${w.length} page-views: ${w.slice(0, 4).join(', ')}${w.length > 4 ? ' …' : ''}`);
  }
}
console.log(`\nchecked ${paths.length} pages x 2 viewports, mode=${mode}; rules with violations: ${Object.keys(results).length}`);
