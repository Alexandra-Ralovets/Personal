/* ПРОВЕРКА МАРШРУТОВ: есть ли из состояния ВЫХОД.
   ─────────────────────────────────────────────────────────────────────────────
   Живость (check-alive.mjs) спрашивает «отвечает ли кнопка». Экран-тупик собран
   из ЖИВЫХ кнопок, поэтому для неё он чистый: так экран «Запись сохранена» жил
   тупиком в мобильном прототипе до 28.08.2026 — выйти можно было только внутрь
   записи или начав новую, обе кнопки при этом честно работали.

   Здесь вопрос другой: «есть ли из этого состояния выход». Проверка
   поведенческая — нажимаем и смотрим, КУДА попали, а не читаем разметку.

   ПРАВИЛО. Из любого состояния человек попадает к списку записей не больше чем
   за один шаг: окно приложения на списке файлов.

   ГДЕ ИЩЕМ ВЫХОД: только внутри окна продукта, которое сейчас открыто (`#winApp`,
   `#winPrefs`, `#winTray`), рамку окна включая — кнопка закрытия и светофор это
   законный выход. НЕ считаются: плашка прототипа над окном (`.fm-stamp`) с
   переключателем окон и платформ, строка меню macOS и Dock. Плашка — элемент
   прототипа, а не продукта: засчитывать её кнопки значило бы получать зелёный
   отчёт на любом тупике. Строка меню и Dock — поверхности системы: выход,
   который существует только там, человек в интерфейсе не видит, а в рамке
   Windows его нет вовсе.

   ТРИ ОКНА — НЕ ТРИ СЛОЯ. В отличие от телефона, где экран записи модальный (так
   требует HIG), здесь виджет и параметры — отдельные окна рядом с приложением, и
   идущая запись не мешает открыть список. Поэтому полное правило применяется и к
   ним; слоем считается только модальное окно поверх приложения, и для него цель
   мягче — закрыть модалку, а не дойти до списка за тот же шаг.

   Запускать из каталога-черновика, не из репозитория (chromium при падении
   пишет `core.*` в текущий каталог):

     cd "$SCRATCH" && PLAYWRIGHT_BROWSERS_PATH=/tmp/corphub-cache/portal-pw/browsers \
       node .../flowmeet-desktop/check-routes.mjs
*/
import { chromium } from '/tmp/corphub-cache/portal-pw/node_modules/playwright/index.mjs';
const BASE = 'http://localhost:10005/flowmeet-desktop/';

/* Список тот же, что у проверки живости: у него уже есть адреса всех экранов и
   состояний, включая рамку macOS. Держать второй список значило бы завести
   второго владельца — он разъедется с первым при первой правке. */
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
  /* Состояние «запись сохранена» — то самое, где в мобильном нашли тупик.
     Своего адреса у него не было до 28.08.2026, поэтому оно жило вне проверок. */
  ['виджет · запись сохранена', '?view=tray&rec=saved'],
  ['виджет · запись сохранена · связи нет', '?view=tray&rec=saved&link=off'],
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

/* Где человек оказался. Цель — окно приложения на списке записей без открытой
   модалки: это и есть «свои записи». */
const where = pg => pg.evaluate(() => ({
  view: S.view,
  screen: S.screen,
  modal: !!document.querySelector('.fm-scrim.is-open'),
  saved: !!S.rec.saved
}));

const b = await chromium.launch({ args: ['--no-sandbox'] });
const pg = await b.newPage({ viewport: { width: 1500, height: 950 } });
pg.on('dialog', d => d.accept('Проверка маршрутов'));
const errs = []; pg.on('pageerror', e => errs.push(e.message));

let dead = 0;
for (const [name, q] of SCREENS) {
  await pg.goto(BASE + q);
  const start = await where(pg);

  /* Модальное окно закрывает приложение под собой, поэтому нажимаемое берём
     только из него — иначе элементы за ним честно не нажимаются и отчёт
     заполняется ложной тревогой (та же причина, что в проверке живости). */
  const inModal = start.modal;
  const win = start.view === 'prefs' ? '#winPrefs ' : start.view === 'tray' ? '#winTray ' : '#winApp ';
  const root = inModal ? '.fm-scrim.is-open ' : win;
  const SEL = ['button', '.fm-toggle', '.fm-chip-btn', '.fm-swatch', '.fm-track', '.fm-ent', '.fm-navitem', 'a']
    .map(x => root + x).join(', ');

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
      out.push({ i, label });
    });
    return out;
  }, SEL);

  /* Состояние, которое уже И ЕСТЬ список записей, тупиком быть не может. */
  const atHome = !inModal && start.view === 'app' && start.screen === 'files';

  const outs = [];
  if (!atHome) {
    for (const c of sigs) {
      if (outs.length >= 2) break;          // двух названных выходов хватает для отчёта
      await pg.goto(BASE + q);
      await pg.locator(SEL).nth(c.i).click({ timeout: 1500, force: true }).catch(() => {});
      await pg.waitForTimeout(200);
      const now = await where(pg).catch(() => null);
      if (!now) continue;
      const ok = inModal ? !now.modal
        : !now.modal && now.view === 'app' && now.screen === 'files';
      if (ok) outs.push(c.label);
    }
  }

  const verdict = atHome ? 'сам список записей'
    : outs.length ? 'выход: ' + outs.map(s => `«${s}»`).join(' · ')
    : inModal ? '🔴 МОДАЛКА БЕЗ ЗАКРЫТИЯ' : '🔴 ТУПИК';
  if (!atHome && !outs.length) dead++;
  console.log(`${name}: элементов ${sigs.length}, ${verdict}`);
}
console.log(dead ? `\n🔴 состояний без выхода: ${dead}` : '\n✅ тупиков нет');

/* ── ВОЗВРАТ ВЕДЁТ ТУДА, ОТКУДА ПРИШЛИ ──────────────────────────────────────
   Проверка выхода выше берёт состояние ПО АДРЕСУ, поэтому истории у неё нет: в
   запись она не приходит с Главной, а стартует в ней. Класс «назад уводит не
   туда» ей структурно не виден — и он жил здесь: открыв запись с Главной,
   человек возвращался в «Все файлы».
   HIG «Toolbars»: «the standard Back button lets them retrace their steps
   through a hierarchy of information» — по пройденному пути, а не в заранее
   назначенное место. */
console.log('\n── возврат из записи ──');
let notBack = 0;
const BACK_FROM = [
  ['главная', '?screen=home'],
  ['поиск', '?scope=search&value=скидка'],
  ['корзина', '?scope=trash'],
  ['папка', '?scope=folder&value=Продажи'],
  ['все файлы', '']
];
const spot = () => pg.evaluate(() => S.screen + (S.scope.kind !== 'all' ? ':' + S.scope.kind + (S.scope.value || '') : ''));
for (const [name, q] of BACK_FROM) {
  await pg.goto(BASE + q);
  await pg.waitForTimeout(300);
  const from = await spot();
  await pg.evaluate(() => { const el = document.querySelector('#winApp [data-file]'); if (el) el.click(); });
  await pg.waitForTimeout(350);
  if (!(await spot()).startsWith('note')) { console.log(`${name}: в запись не зашли`); continue; }
  await pg.evaluate(() => { const el = document.querySelector('#btnBack'); if (el) el.click(); });
  await pg.waitForTimeout(350);
  const to = await spot();
  const ok = to === from;
  if (!ok) notBack++;
  console.log(`${name}: ${from} → запись → ${to} ${ok ? '✅' : '🔴 НЕ ТУДА, откуда пришли'}`);
}
console.log(notBack ? `🔴 возврат уводит не туда: ${notBack}` : '✅ возврат везде ведёт туда, откуда пришли');

/* ── НИЧЕГО НЕ ВЫЛЕЗАЕТ ЗА ГРАНИЦЫ ОКНА ─────────────────────────────────────
   Геометрию не мерила ни одна проверка: живость смотрит на изменение снимка,
   язык — на строки, выход — на переходы. В мобильном прототипе карточка лимита
   торчала за край экрана, и отчёты при этом были зелёные.
   Намеренно прокручиваемые области пропускаются: у них горизонтальная прокрутка
   задана, и содержимое шире окна по замыслу. */
console.log('\n── выход за границы окна ──');
let over = 0;
for (const [name, q] of SCREENS) {
  await pg.goto(BASE + q);
  await pg.waitForTimeout(300);
  const bad = await pg.evaluate(() => {
    const win = [...document.querySelectorAll('#winApp, #winPrefs, #winTray')]
      .find(w => w.getBoundingClientRect().width > 0);
    if (!win) return [];
    const box = win.getBoundingClientRect();
    const out = [];
    for (const el of win.querySelectorAll('*')) {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      let p = el.parentElement, scrolls = false;
      while (p && p !== win.parentElement) {
        const ox = getComputedStyle(p).overflowX;
        if (ox === 'auto' || ox === 'scroll') { scrolls = true; break; }
        p = p.parentElement;
      }
      if (scrolls) continue;
      const dr = Math.round(r.right - box.right), dl = Math.round(box.left - r.left);
      if (dr > 1 || dl > 1) {
        const label = (el.textContent || '').trim().slice(0, 30) || el.className || el.tagName;
        out.push(`«${label}» ${dr > 1 ? 'вправо на ' + dr : 'влево на ' + dl} px`);
      }
    }
    return [...new Set(out)].slice(0, 4);
  });
  if (bad.length) { over++; console.log(`🔴 ${name}: ${bad.join(' · ')}`); }
}
console.log(over ? `🔴 экранов с выходом за границы: ${over}` : '✅ за границы окна ничего не выходит');

if (errs.length) console.log('ОШИБКИ СТРАНИЦЫ:', [...new Set(errs)].join(' | '));
await b.close();
