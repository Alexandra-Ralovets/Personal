/* Сплошная проверка перевода: обходим экраны на английском и ищем оставшийся
   русский текст в интерфейсе. Данные записей (речь, конспекты, названия) не
   считаются — они и должны остаться на языке разговора. */
import { chromium } from '/tmp/corphub-cache/portal-pw/node_modules/playwright/index.mjs';
const BASE = 'http://localhost:10005/flowmeet-desktop/?lang=en';
const SCREENS = ['', '&scope=search&value=банк', '&file=demo&tab=transcript', '&file=demo&tab=summary',
  '&file=tz&tab=summary', '&screen=home', '&screen=ask', '&screen=templates', '&screen=membership', '&scope=trash',
  ...['account','person','prefs','vocab','cloud','support','feedback','help','about'].map(k => '&settings=' + k),
  ...['autoflow','apps','integr','ideas'].map(k => '&explore=' + k),
  '&folder=new',
  '&screen=devices', '&screen=devices&dev=off', '&screen=outbox', '&screen=outbox&link=off&disk=full',
  '&view=tray&rec=on&hints=5', '&view=tray&rec=auto&hints=2', '&view=tray&rec=on&org=mandatory',
  '&view=tray&link=off', '&view=prefs&prefs=org', '&view=prefs&prefs=org&org=mandatory',
  '&view=tray&rec=on&confirm=cancel',
  ...['sales','support','hr','dev'].map(k => '&view=tray&rec=on&hints=5&profile=' + k),
  ...['general','recording','keys','notify','cloud','org','about'].map(k => '&view=prefs&prefs=' + k),
  '&view=tray',
  /* Рамка macOS приносит свои строки: меню, Dock, разрешения системы. */
  '&os=mac', '&os=mac&file=demo&tab=summary', '&os=mac&screen=templates',
  ...['general','recording','keys','notify','cloud','org','about'].map(k => '&os=mac&view=prefs&prefs=' + k),
  '&os=mac&view=tray&detector=down', '&os=mac&screen=devices',
  '&os=mac&view=tray'];
/* Что считается ДАННЫМИ, а не интерфейсом: речь, конспекты, названия записей и
   устройств. Их русский на английском экране — норма. */
const scanRu = pg => pg.evaluate(() => {
  const SKIP = ['.fm-doc', '.fm-tbl__title', '.fm-list', '.fm-seg-row', '.fm-answer', '.fm-cite',
    '.fm-tray__row', '.fm-crumbs__now', '.fm-menu__mail', '#shareLink', '.fm-well',
    /* Шапка окна в рамке macOS называет открытую запись — это данные. */
    '.fm-chrome__name',
    /* Названия записей в меню «Открыть недавнюю запись» — тоже данные. */
    '.fm-data'];
  const out = [];
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) {
    const el = n.parentElement;
    if (!el || SKIP.some(s => el.closest(s)) || !el.offsetParent) continue;
    const v = n.nodeValue.replace(/\s+/g, ' ').trim();
    if (v && /[А-Яа-яЁё]/.test(v)) out.push(v);
  }
  document.querySelectorAll('[placeholder],[title],[data-tip],[aria-label]').forEach(el =>
    ['placeholder','title','data-tip','aria-label'].forEach(a => {
      const v = el.getAttribute(a);
      if (v && /[А-Яа-яЁё]/.test(v)) out.push(v.trim());
    }));
  return out;
});
const b = await chromium.launch({ args: ['--no-sandbox'] });
const pg = await b.newPage({ viewport: { width: 1500, height: 950 } });
const left = new Map();
for (const q of SCREENS) {
  await pg.goto(BASE + q);
  await pg.waitForTimeout(250);
  (await scanRu(pg)).forEach(v => left.set(v, (left.get(v) || 0) + 1));
}

/* ── Пункты выпадающих меню ─────────────────────────────────────────────────
   В закрытом меню пунктов в разметке НЕТ, поэтому проход по экранам их не
   видит: до 28.08.2026 словарь меню («Событие снаружи», «Организация», меню
   записи, скорость) не проверялся вовсе. Меню открывается и сканируется тем же
   правилом, что экран. Добавил меню — впиши его сюда. */
const MENUS = [
  ['пространство', '', '#wsBtn'],
  ['добавить запись', '', '#btnAdd'],
  ['событие снаружи', '', '#eventsBtn'],
  ['организация (плашка)', '', '#orgBtn'],
  ['меню записи в списке', '', '[data-rowmenu]'],
  ['меню открытой записи', '&file=demo&tab=summary', '[data-notemenu]'],
  ['выгрузка', '&file=demo&tab=summary', '[data-exportmenu]'],
  ['скорость', '&file=demo&tab=transcript', '#btnSpeed'],
  ['где искать (спросить)', '&screen=ask', '#askScope'],
  ['где искать встречи', '&view=prefs&prefs=recording', '#meetApps'],
  ...['app','file','edit','view','rec','window','help'].map(k =>
    ['mac · меню · ' + k, '&os=mac', `[data-macmenu="${k}"]`])
];
for (const [name, q, sel] of MENUS) {
  await pg.goto(BASE + q);
  await pg.waitForTimeout(200);
  await pg.click(sel).catch(() => {});
  await pg.waitForTimeout(150);
  const n = await pg.locator('.fm-menu').count();
  if (!n) { console.log('меню не открылось:', name); continue; }
  (await scanRu(pg)).forEach(v => left.set(v, (left.get(v) || 0) + 1));
}
console.log('осталось непереведённых строк:', left.size);
[...left.keys()].sort().forEach(v => console.log('  •', v));
await b.close();
