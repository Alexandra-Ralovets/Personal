/* Сплошная проверка живости: снимок → клик → снимок. Не изменилось ничего —
   элемент мёртвый. Один элемент на «подпись» (одинаковые кнопки шестидесяти
   строк — это одна кнопка), окна-модалки проверяются только своим содержимым,
   диалоги переименования принимаются, иначе они выглядят мёртвыми. */
import { chromium } from '/tmp/corphub-cache/portal-pw/node_modules/playwright/index.mjs';
const BASE = 'http://localhost:10005/flowmeet-mobile/';
const SCREENS = [
  ['папки (главный экран)', ''],
  ['список записей', '?screen=files'],
  ['корзина', '?scope=trash'],
  ['папка', '?scope=folder&value=Продажи'],
  ['поиск', '?q=банк'],
  ['запись · расшифровка', '?file=demo&tab=transcript'],
  ['запись · конспект', '?file=demo&tab=summary'],
  ['запись · пустой конспект', '?file=tz&tab=summary'],
  ['запись · важное', '?file=demo&tab=marks&mark=1,4'],
  ['запись · важное пусто', '?file=demo&tab=marks'],
  ['запись · поиск внутри', '?file=demo&find=карта'],
  ['спросить', '?screen=ask'],
  ['шаблоны', '?screen=templates'],
  ['ещё', '?screen=more'],
  ['квота', '?screen=membership'],
  ...['account','lang','recording','org','cloud','notify','support','about'].map(k => ['настройки · ' + k, '?set=' + k]),
  /* Добавлено 27.08.2026 по спеке сверки: подсказки, диктофоны, отправка,
     режим организации, отмена записи, источник записи с диктофоном. */
  ['настройки · организация · обязательная', '?set=org&org=mandatory'],
  ['диктофоны', '?screen=devices'],
  ['диктофоны · не на связи', '?screen=devices&dev=off'],
  ['отправка', '?screen=outbox'],
  ['отправка · связи нет', '?screen=outbox&link=off&disk=full'],
  ['запись · с подсказками', '?rec=on&hints=3'],
  ['запись · автостарт', '?rec=auto&hints=2'],
  ['запись · обязательная', '?rec=on&org=mandatory'],
  ['запись · связи нет', '?rec=on&link=off'],
  ['шторка · подсказки', '?rec=on&hints=3&sheet=hints'],
  ['шторка · источник записи', '?file=demo&sheet=mic'],
  ['главный · диктофон не на связи', '?dev=off&mic=' + encodeURIComponent('AIREC · 0335')],
  ...['sort','speed','player','mic','askscope','addtpl','row','move','newtpl','newfolder','share']
      .map(k => ['шторка · ' + k, '?file=demo&sheet=' + k]),
  ['шторка · участник', '?file=demo&sheet=person&sheetid=' + encodeURIComponent('Сергей Ильин')],
  ['меню разбора', '?file=demo&tab=obj&sheet=row'],
  ['идёт запись', '?rec=on'],
  ['запись сохранена', '?rec=saved']
];

/* Приложение выходит на двух ОС, поэтому список экранов прогоняется ДВАЖДЫ —
   по разу на оболочку. Прогон одной оболочки оставляет половину интерфейса
   непроверенной: у Material своя панель разделов, своя кнопка действия, свои
   цели нажатия и снэкбар вместо всплывающей пилюли. */
const ALL = ['ios', 'android'].flatMap(os => SCREENS.map(([name, q]) =>
  [os + ' · ' + name, q ? q + '&os=' + os : '?os=' + os]));

const snap = pg => pg.evaluate(() => {
  const scrims = [...document.querySelectorAll('.fm-scrim')].map(s => s.className).join('|');
  const menu = document.querySelector('.fm-menu') ? document.querySelector('.fm-menu').innerHTML.length : 0;
  const toast = document.querySelector('#toast.is-open') ? 1 : 0;
  const vals = [...document.querySelectorAll('input, textarea, select')].map(i => i.value).join('|');
  const theme = document.documentElement.getAttribute('data-theme') || '';
  const body = document.body.innerHTML.replace(/\s+/g, '');
  return [body.length, scrims, menu, toast, vals, theme, body.slice(0, 250000)].join('¦');
});
const b = await chromium.launch({ args: ['--no-sandbox'] });
const pg = await b.newPage({ viewport: { width: 1500, height: 950 } });
pg.on('dialog', d => d.accept('Переименовано проверкой'));
const errs = []; pg.on('pageerror', e => errs.push(e.message));

for (const [name, q] of ALL) {
  /* Полноэкранный слой (шторка, идущая запись) закрывает всё под собой, поэтому
     проверяем только его содержимое: иначе элементы за слоем честно не нажимаются
     и отчёт заполняется ложной тревогой на два десятка строк. */
  const sheetOpen = /sheet=/.test(q);
  /* `saved` в признаке слоя стоит по той же причине, что `auto`: экран
     «Запись сохранена» рисуется тем же полноэкранным `.m-rec` и точно так же
     закрывает всё под собой. Пока его тут не было, проверка жала кнопки под
     слоем, десять из них честно не нажимались и читались как мёртвые, а сам
     экран оставался непроверенным. */
  const recOpen = /rec=(on|auto|saved)/.test(q);
  const root = sheetOpen ? '.fm-scrim.is-open ' : recOpen ? '.m-rec ' : '';
  const SEL = ['button', '.m-toggle', '.m-wave', '.m-seg-row', '.fm-ent', '.m-row[data-set]', '.m-row[data-file]',
    '.m-row[data-go]', '.m-row[data-setlang]', 'a']
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
if (errs.length) console.log('ОШИБКИ СТРАНИЦЫ:', [...new Set(errs)].join(' | '));
await b.close();
