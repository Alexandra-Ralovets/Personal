import { chromium } from '/tmp/corphub-cache/portal-pw/node_modules/playwright/index.mjs';
const B = 'http://localhost:10005/flowmeet-mobile/?lang=en';
const SCREENS = ['', '&scope=trash', '&screen=ask', '&screen=templates', '&screen=more', '&screen=membership',
  '&file=demo&tab=summary', '&file=demo&tab=transcript', '&file=tz&tab=summary', '&q=банк',
  '&file=demo&tab=marks&mark=1,4', '&file=demo&tab=marks', '&file=demo&find=карта', '&file=demo&find=щщщ',
  ...['account','lang','recording','org','cloud','notify','support','about'].map(k => '&set=' + k),
  '&set=org&org=mandatory', '&screen=devices', '&screen=devices&dev=off',
  '&screen=outbox', '&screen=outbox&link=off&disk=full',
  '&rec=on&hints=5', '&rec=auto&hints=2', '&rec=on&org=mandatory', '&rec=on&link=off',
  '&rec=on&hints=5&sheet=hints', '&dev=off&mic=' + encodeURIComponent('AIREC · 0335'),
  '&os=android&set=recording', '&set=recording',
  ...['sales','support','hr','dev'].map(k => '&rec=on&hints=5&profile=' + k),
  ...['sort','speed','player','mic','askscope','addtpl','row','move','newtpl','newfolder','share'].map(k => '&file=demo&sheet=' + k),
  '&file=demo&sheet=person&sheetid=' + encodeURIComponent('Сергей Ильин'),
  '&rec=on', '&rec=saved',
  '&os=android', '&os=android&file=demo&tab=summary', '&os=android&screen=more'];
const b = await chromium.launch({ args: ['--no-sandbox'] });
const pg = await b.newPage({ viewport: { width: 460, height: 1000 } });
const left = new Set();
for (const q of SCREENS) {
  await pg.goto(B + q);
  await pg.waitForTimeout(260);
  const got = await pg.evaluate(() => {
    /* Пропускаем содержимое записей: речь, конспекты, названия — это данные,
       они и должны остаться на языке разговора. */
    const SKIP = ['.m-doc', '.m-row__title', '.m-row__prev', '.m-seg-row', '.m-cite', '.m-data',
      '.m-hitrow__txt', '.m-rec__line', '.m-avatar', '.m-answer p:not(:first-child)',
      '#shareLink', '.m-nav__compact', '.fm-sheet__head'];
    const out = [];
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      const el = n.parentElement;
      if (!el || SKIP.some(s => el.closest(s)) || !el.offsetParent) continue;
      const v = n.nodeValue.replace(/\s+/g, ' ').trim();
      if (v && /[А-Яа-яЁё]/.test(v)) out.push(v);
    }
    document.querySelectorAll('[placeholder],[title],[aria-label]').forEach(el =>
      ['placeholder','title','aria-label'].forEach(a => {
        const v = el.getAttribute(a);
        if (v && /[А-Яа-яЁё]/.test(v)) out.push(v.replace(/\s+/g,' ').trim());
      }));
    return out;
  });
  got.forEach(v => left.add(v));
}
console.log('непереведённых строк в мобильном:', left.size);
[...left].sort((a,b)=>a.localeCompare(b,'ru')).forEach(v => console.log('  •', v));
await b.close();
