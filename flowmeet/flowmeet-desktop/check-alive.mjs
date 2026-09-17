/* Сплошная проверка живости: снимок → клик → снимок. Не изменилось ничего —
   элемент мёртвый. Один элемент на «подпись» (одинаковые кнопки шестидесяти
   строк — это одна кнопка), окна-модалки проверяются только своим содержимым,
   диалоги переименования принимаются, иначе они выглядят мёртвыми. */
import { chromium } from '/tmp/corphub-cache/portal-pw/node_modules/playwright/index.mjs';
const BASE = 'http://localhost:10005/flowmeet-desktop/';
const SCREENS = [
  ['список файлов', ''],
  ['поиск', '?scope=search&value=встреч'],
  ['запись · расшифровка', '?file=demo&tab=transcript'],
  ['запись · конспект', '?file=demo&tab=summary'],
  ['запись · пустой конспект', '?file=tz&tab=summary'],
  ['главная', '?screen=home'],
  ['спросить ИИ', '?screen=ask'],
  ['шаблоны', '?screen=templates'],
  ['квота и лимиты', '?screen=membership'],
  ['корзина', '?scope=trash'],
  ...['account','person','prefs','vocab','cloud','support','feedback','help','about']
      .map(k => ['настройки · ' + k, '?settings=' + k]),
  ...['autoflow','apps','integr','ideas'].map(k => ['возможности · ' + k, '?explore=' + k]),
  ['новая папка', '?folder=new'],
  ['шаблон · карточка', '?screen=templates&tplmodal=Протокол встречи'],
  /* Экраны и состояния, добавленные 27.08.2026 по спеке сверки: подсказки,
     диктофоны, очередь отправки, режим организации, отмена записи. */
  ['диктофоны', '?screen=devices'],
  ['диктофоны · не на связи', '?screen=devices&dev=off'],
  ['отправка', '?screen=outbox'],
  ['отправка · связи нет', '?screen=outbox&link=off'],
  ['отправка · места нет', '?screen=outbox&disk=full'],
  ['виджет · идёт запись', '?view=tray&rec=on&hints=3'],
  ['виджет · автостарт', '?view=tray&rec=auto&hints=2'],
  ['виджет · запись обязательна', '?view=tray&rec=on&org=mandatory'],
  ['виджет · связи нет', '?view=tray&link=off'],
  ['виджет · детектор упал', '?os=mac&view=tray&detector=down'],
  ['подтверждение отмены', '?view=tray&rec=on&confirm=cancel'],
  ['параметры · организация', '?view=prefs&prefs=org'],
  ['параметры · организация · обязательная', '?view=prefs&prefs=org&org=mandatory'],
  ...['general','recording','keys','notify','cloud','about'].map(k => ['параметры · ' + k, '?view=prefs&prefs=' + k]),
  ['виджет', '?view=tray'],
  /* Состояние «запись сохранена». Своего адреса у него не было до 28.08.2026 —
     оно жило вне всякой проверки, а именно на этом экране в мобильном прототипе
     нашли тупик. */
  ['виджет · запись сохранена', '?view=tray&rec=saved'],
  ['виджет · запись сохранена · связи нет', '?view=tray&rec=saved&link=off'],
  /* Рамка macOS — своя оболочка: строка меню, светофор, Dock, поповер виджета.
     Без этих строк проверялась бы половина интерфейса (в рамке Windows этих
     элементов нет вовсе). Три окна продукта покрыты каждое. */
  ['mac · список файлов', '?os=mac'],
  ['mac · запись', '?os=mac&file=demo&tab=summary'],
  ['mac · поиск', '?os=mac&scope=search&value=встреч'],
  ['mac · корзина', '?os=mac&scope=trash'],
  ...['general','recording','keys','notify','cloud','org','about'].map(k => ['mac · параметры · ' + k, '?os=mac&view=prefs&prefs=' + k]),
  ['mac · диктофоны', '?os=mac&screen=devices'],
  ['mac · отправка', '?os=mac&screen=outbox'],
  ['mac · виджет · идёт запись', '?os=mac&view=tray&rec=on&hints=3'],
  ['mac · виджет', '?os=mac&view=tray'],
  ['mac · виджет · запись сохранена', '?os=mac&view=tray&rec=saved'],
  ['mac · во весь экран', '?os=mac&screen=home']
];
/* Снимок состояния. Кроме разметки берём то, чего в разметке не видно и из-за
   чего живые кнопки выглядели мёртвыми: значения полей ввода (их не видно в
   innerHTML — так «подставить тему в поле» читалось как бездействие) и признак
   темы на корне страницы (переключатель светлой и тёмной правит именно его). */
const snap = (pg, withMenu = true) => pg.evaluate(wm => {
  const scrims = [...document.querySelectorAll('.fm-scrim')].map(s => s.className).join('|');
  const menu = document.querySelector('.fm-menu') ? document.querySelector('.fm-menu').innerHTML.length : 0;
  const toast = document.querySelector('#toast.is-open') ? 1 : 0;
  const vals = [...document.querySelectorAll('input, textarea, select')].map(i => i.value).join('|');
  const theme = document.documentElement.getAttribute('data-theme') || '';
  /* Выпадающее меню живёт в теле страницы, поэтому его вынимаем: иначе при
     проверке ПУНКТА меню закрытие меню меняло бы снимок само по себе и любой
     мёртвый пункт читался бы как живой. Само наличие меню — отдельным полем,
     им ловятся кнопки, которые меню открывают. */
  const clone = document.body.cloneNode(true);
  clone.querySelectorAll('.fm-menu').forEach(m => m.remove());
  const body = clone.innerHTML.replace(/\s+/g, '');
  return [body.length, scrims, wm ? menu : '', toast, vals, theme, body.slice(0, 250000)].join('¦');
}, withMenu);
const b = await chromium.launch({ args: ['--no-sandbox'] });
const pg = await b.newPage({ viewport: { width: 1500, height: 950 } });
pg.on('dialog', d => d.accept('Переименовано проверкой'));
const errs = []; pg.on('pageerror', e => errs.push(e.message));

for (const [name, q] of SCREENS) {
  const modal = /settings=|explore=|folder=|tplmodal=|confirm=/.test(q);
  const root = modal ? '.fm-scrim.is-open ' : '';
  const SEL = ['button', '.fm-toggle', '.fm-chip-btn', '.fm-swatch', '.fm-track', '.fm-ent', '.fm-navitem', 'a']
    .map(x => root + x).join(', ');
  await pg.goto(BASE + q);
  const sigs = await pg.evaluate(sel => {
    const seen = new Set(), out = [];
    [...document.querySelectorAll(sel)].forEach((el, i) => {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const data = [...el.attributes].map(a => a.name).filter(n => n.startsWith('data-')).sort().join(',');
      const label = (el.textContent || '').trim().slice(0, 40) || el.getAttribute('aria-label')
        || el.getAttribute('data-tip') || '(без подписи)';
      const sig = el.tagName + '|' + (el.className || '') + '|' + data + '|' + label;
      if (seen.has(sig)) return;
      seen.add(sig);
      out.push({ i, label, tag: el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + '.' + String(el.className || '').split(' ')[0] });
    });
    return out;
  }, SEL);
  const dead = [];
  for (const c of sigs) {
    await pg.goto(BASE + q);
    const el = pg.locator(SEL).nth(c.i);
    const before = await snap(pg);
    await el.click({ timeout: 1500, force: true }).catch(() => {});
    await pg.waitForTimeout(150);
    const after = await snap(pg).catch(() => 'сломалось');
    if (before === after) dead.push(`«${c.label}» [${c.tag}]`);
  }
  console.log(`${name}: подписей ${sigs.length}, мёртвых ${dead.length}${dead.length ? ' → ' + dead.join(' · ') : ''}`);
}
/* ── Выпадающие меню приложения (обе рамки) ────────────────────────────────
   Главный проход их не видит: в закрытом меню пунктов в разметке нет, ловится
   только кнопка, которая меню открывает. Поэтому меню открывается заново перед
   каждым пунктом, а снимок берётся БЕЗ меню — иначе закрытие само меняло бы
   снимок и любой мёртвый пункт читался бы как живой.
   Ложная тревога здесь: уже выбранный пункт (скорость, область поиска,
   текущее пространство), «Загрузить файл…» (открывает выбор файлов системы) и
   пункт, который открывает вложенное меню (его снимок как раз вырезан). */
const DROPDOWNS = [
  ['пространство', '', '#wsBtn'],
  ['добавить запись', '', '#btnAdd'],
  ['меню записи в списке', '', '[data-rowmenu]'],
  ['меню записи в корзине', '?scope=trash', '[data-rowmenu]'],
  ['меню открытой записи', '?file=demo&tab=summary', '[data-notemenu]'],
  ['выгрузка', '?file=demo&tab=summary', '[data-exportmenu]'],
  ['меню вкладки разбора', '?file=demo&tab=summary', '.fm-tab.is-active'],
  ['добавить разбор', '?file=demo&tab=summary', '#tabAdd'],
  ['меню блока конспекта', '?file=demo&tab=summary', '[data-blockmenu]'],
  ['добавить блок', '?file=demo&tab=summary', '[data-addblock]'],
  ['скорость', '?file=demo&tab=transcript', '#btnSpeed'],
  ['карточка участника', '?file=demo&tab=summary', '.fm-ent'],
  ['где искать встречи', '?view=prefs&prefs=recording', '#meetApps'],
  ['событие снаружи', '', '#eventsBtn'],
  /* Что решила организация: режим записи, профиль подсказок, разрешения
     сервера. Переехало из окна параметров в плашку прототипа 28.08.2026 —
     в продукте это состояние с сервера, а не настройка приложения. */
  ['организация (плашка)', '', '#orgBtn'],
  ['где искать (спросить)', '?screen=ask', '#askScope']
];
for (const [name, q, sel] of DROPDOWNS) {
  const open = async () => {
    await pg.goto(BASE + q); await pg.waitForTimeout(150);
    await pg.click(sel).catch(() => {}); await pg.waitForTimeout(120);
  };
  await open();
  const n = await pg.locator('.fm-menu .fm-menu__item:not(.is-off)').count();
  const dead = [];
  for (let i = 0; i < n; i++) {
    await open();
    const el = pg.locator('.fm-menu .fm-menu__item:not(.is-off)').nth(i);
    const label = ((await el.textContent().catch(() => '')) || '').trim().slice(0, 40) || '(без подписи)';
    const before = await snap(pg, false);
    await el.click({ timeout: 1500, force: true }).catch(() => {});
    await pg.waitForTimeout(150);
    const after = await snap(pg, false).catch(() => 'сломалось');
    if (before === after) dead.push(`«${label}»`);
  }
  console.log(`меню · ${name}: пунктов ${n}, мёртвых ${dead.length}${dead.length ? ' → ' + dead.join(' · ') : ''}`);
}

/* ── Пункты меню рамки macOS ────────────────────────────────────────────────
   Главный проход их не видит: в закрытом меню пунктов в разметке нет. Здесь
   меню открывается заново перед каждым пунктом (нажатие его закрывает), а
   снимок берётся БЕЗ меню — тогда «ничего не изменилось» означает мёртвый
   пункт, а не просто закрытие. Недоступные пункты (.is-off) не кнопки и в
   проверку не идут. */
const MACMENUS = ['system', 'app', 'file', 'edit', 'view', 'rec', 'window', 'help'];
const MACWHERE = [['mac · меню · список файлов', '?os=mac'], ['mac · меню · запись', '?os=mac&file=demo&tab=summary']];
for (const [name, q] of MACWHERE) {
  for (const key of MACMENUS) {
    const open = async () => { await pg.goto(BASE + q); await pg.click(`[data-macmenu="${key}"]`); };
    await open();
    const items = pg.locator('.fm-menu .fm-menu__item:not(.is-off)');
    const n = await items.count();
    const dead = [];
    for (let i = 0; i < n; i++) {
      await open();
      const el = pg.locator('.fm-menu .fm-menu__item:not(.is-off)').nth(i);
      const label = ((await el.textContent().catch(() => '')) || '').trim().slice(0, 40) || '(без подписи)';
      const before = await snap(pg, false);
      await el.click({ timeout: 1500, force: true }).catch(() => {});
      await pg.waitForTimeout(150);
      const after = await snap(pg, false).catch(() => 'сломалось');
      if (before === after) dead.push(`«${label}»`);
    }
    console.log(`${name} · ${key}: пунктов ${n}, мёртвых ${dead.length}${dead.length ? ' → ' + dead.join(' · ') : ''}`);
  }
}
/* Меню Dock открывается только Control-кликом по значку. */
{
  const open = async () => {
    await pg.goto(BASE + '?os=mac');
    await pg.click('[data-dockmenu]', { button: 'right' });
  };
  await open();
  const n = await pg.locator('.fm-menu .fm-menu__item:not(.is-off)').count();
  const dead = [];
  for (let i = 0; i < n; i++) {
    await open();
    const el = pg.locator('.fm-menu .fm-menu__item:not(.is-off)').nth(i);
    const label = ((await el.textContent().catch(() => '')) || '').trim().slice(0, 40);
    const before = await snap(pg, false);
    await el.click({ timeout: 1500, force: true }).catch(() => {});
    await pg.waitForTimeout(150);
    const after = await snap(pg, false).catch(() => 'сломалось');
    if (before === after) dead.push(`«${label}»`);
  }
  console.log(`mac · меню Dock: пунктов ${n}, мёртвых ${dead.length}${dead.length ? ' → ' + dead.join(' · ') : ''}`);
}

if (errs.length) console.log('ОШИБКИ СТРАНИЦЫ:', [...new Set(errs)].join(' | '));
await b.close();
