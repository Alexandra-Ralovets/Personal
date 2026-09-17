/* ПРОВЕРКА МАРШРУТОВ: есть ли из состояния ВЫХОД.
   ─────────────────────────────────────────────────────────────────────────────
   Живость (check-alive.mjs) спрашивает «отвечает ли кнопка». Экран-тупик собран
   из ЖИВЫХ кнопок, поэтому для неё он чистый: так экран «Запись сохранена» жил
   тупиком до 28.08.2026 — выйти можно было только внутрь записи или начав новую,
   обе кнопки при этом честно работали.

   Здесь вопрос другой: «есть ли из этого экрана выход». Проверка поведенческая —
   нажимаем и смотрим, КУДА попали, а не читаем разметку.

   ПРАВИЛО. Из любого экрана человек попадает в свои записи не больше чем за один
   шаг. Цель — пространство записей: список записей (`files`) или папки
   (`folders`). Папки засчитаны наравне со списком потому, что нижняя панель
   разделов — законный выход, а ведёт она именно на папки; требовать с экрана
   «Спросить» попадания сразу в список значило бы объявить тупиком весь
   интерфейс.

   ЧТО СЧИТАЕТСЯ ВЫХОДОМ: любое одно нажатие, после которого человек оказался в
   пространстве записей без открытых слоёв. Автоматически НЕ считаются выходом
   кнопка, открывающая шторку, и кнопка, начинающая новую запись: после них
   остаётся открытый слой (`rec.on`) или шторка, а цель требует чистого экрана.

   СЛОИ ПРОВЕРЯЮТСЯ ДРУГИМ ПРАВИЛОМ. Шторка и идущая запись закрывают всё под
   собой; требовать из них шага сразу в список неверно — человек сначала
   закрывает слой. Поэтому для слоя цель — выйти ИМЕННО ИЗ ЭТОГО слоя, а не
   «чтобы слоёв не осталось вовсе»: шторка подсказок открыта поверх идущей
   записи, и закрытие шторки честно возвращает на запись, которая продолжает
   идти. Пока цель была «слоёв нет», проверка объявляла тупиком шторку с живой
   кнопкой «Закрыть».

   ТАП ПО ЗАТЕМНЕНИЮ — ЗАКОННЫЙ ВЫХОД и пробуется наравне с кнопками. На
   телефоне шторка закрывается касанием вне её, и признак этого виден: у шторки
   есть ручка-полоска сверху (`.fm-sheet__grip`) — системная манера обеих
   платформ. Не пробовать затемнение значило бы объявлять тупиком пульт
   проигрывателя, у которого кнопки закрытия нет намеренно. Шторку, которую не
   закрывает НИЧТО, проверка по-прежнему назовёт.

   ГДЕ ИЩЕМ ВЫХОД: только внутри корпуса телефона (`#phone`). Плашка над
   корпусом — элемент прототипа, а не продукта; засчитывать её кнопки значило бы
   получать зелёный отчёт на любом тупике.

   Запускать из каталога-черновика, не из репозитория (chromium при падении
   пишет `core.*` в текущий каталог):

     cd "$SCRATCH" && PLAYWRIGHT_BROWSERS_PATH=/tmp/corphub-cache/portal-pw/browsers \
       node .../flowmeet-mobile/check-routes.mjs
*/
import { chromium } from '/tmp/corphub-cache/portal-pw/node_modules/playwright/index.mjs';
const BASE = 'http://localhost:10005/flowmeet-mobile/';

/* Список тот же, что у проверки живости: у него уже есть адреса всех экранов и
   состояний. Держать второй список значило бы завести второго владельца — он
   разъедется с первым при первой правке. */
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
  ['запись сохранена', '?rec=saved'],
  /* Тот же экран при пустой очереди и без связи: сообщение под кнопками другое,
     а выход обязан оставаться на месте. */
  ['запись сохранена · связи нет', '?rec=saved&link=off']
];

/* Обе оболочки: возврат в iOS — шеврон в панели, в Android — стрелка, и живут
   они в разной разметке. Прогон одной оболочки оставил бы вторую без проверки. */
const ALL = ['ios', 'android'].flatMap(os => SCREENS.map(([name, q]) =>
  [os + ' · ' + name, q ? q + '&os=' + os : '?os=' + os]));

/* Где человек оказался. Пространство записей — список или папки; слой открыт,
   если видна шторка или идёт запись. Экран «запись сохранена» слоем НЕ считаем:
   это состояние, в котором человек живёт после встречи, и правило к нему
   применяется полное — именно здесь тупик и был. */
const where = pg => pg.evaluate(() => ({
  screen: M.screen,
  sheetOpen: !!document.querySelector('.fm-scrim.is-open'),
  recOn: M.rec.on,
  saved: !!M.rec.saved,
  sheet: M.sheet || null
}));

const b = await chromium.launch({ args: ['--no-sandbox'] });
const pg = await b.newPage({ viewport: { width: 1500, height: 950 } });
pg.on('dialog', d => d.accept('Проверка маршрутов'));
const errs = []; pg.on('pageerror', e => errs.push(e.message));

let dead = 0;
for (const [name, q] of ALL) {
  await pg.goto(BASE + q);
  const start = await where(pg);

  /* Слой закрывает всё под собой, поэтому нажимаемое берём только из него —
     иначе элементы за слоем честно не нажимаются и отчёт заполняется ложной
     тревогой (та же причина, что в проверке живости). */
  const inSheet = start.sheetOpen;
  const inLayer = inSheet || start.recOn;
  const root = inSheet ? '#phone .fm-scrim.is-open ' : start.recOn ? '#phone .m-rec ' : '#phone ';
  const SEL = ['button', '.m-toggle', '.m-wave', '.m-seg-row', '.fm-ent', '.m-row[data-set]',
    '.m-row[data-file]', '.m-row[data-go]', '.m-row[data-setlang]', 'a']
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

  /* Экран, который уже И ЕСТЬ пространство записей, тупиком быть не может. */
  const atHome = !inLayer && !start.saved && (start.screen === 'files' || start.screen === 'folders');

  /* Тап вне шторки — законный выход телефона, поэтому пробуется наравне с
     кнопками. Отдельной пробой, а не селектором: нажимать надо в затемнение
     над панелью шторки, а не в саму панель. */
  const probes = sigs.map(c => ({ label: c.label, nth: c.i }));
  if (inSheet) probes.push({ label: 'тап вне шторки', scrim: true });

  const outs = [];
  if (!atHome) {
    for (const c of probes) {
      if (outs.length >= 2) break;          // двух названных выходов хватает для отчёта
      await pg.goto(BASE + q);
      if (c.scrim) {
        await pg.locator('#phone .fm-scrim.is-open')
          .click({ position: { x: 195, y: 40 }, force: true, timeout: 1500 }).catch(() => {});
      } else {
        await pg.locator(SEL).nth(c.nth).click({ timeout: 1500, force: true }).catch(() => {});
      }
      await pg.waitForTimeout(200);
      const now = await where(pg).catch(() => null);
      if (!now) continue;
      /* Из шторки выход — закрыть ЭТУ шторку (запись под ней имеет право идти
         дальше); из идущей записи — прекратить запись; с экрана — попасть в
         пространство записей. */
      const ok = inSheet ? !now.sheetOpen
        : start.recOn ? !now.recOn
        : !now.sheetOpen && !now.recOn && !now.saved && (now.screen === 'files' || now.screen === 'folders');
      if (ok) outs.push(c.label);
    }
  }

  const verdict = atHome ? 'сам список записей'
    : outs.length ? 'выход: ' + outs.map(s => `«${s}»`).join(' · ')
    : inLayer ? '🔴 СЛОЙ БЕЗ ВЫХОДА' : '🔴 ТУПИК';
  if (!atHome && !outs.length) dead++;
  console.log(`${name}: элементов ${sigs.length}, ${verdict}`);
}
console.log(dead ? `\n🔴 состояний без выхода: ${dead}` : '\n✅ тупиков нет');

/* ── ВОЗВРАТ ВЕДЁТ ТУДА, ОТКУДА ПРИШЛИ ──────────────────────────────────────
   Проверка выхода выше берёт состояние ПО АДРЕСУ, поэтому истории у неё нет: в
   запись она не приходит из поиска, а стартует в ней. Класс «назад уводит не
   туда» ей структурно не виден — и он жил в обоих прототипах: открыв запись из
   поиска, человек возвращался в общий список, теряя запрос и найденное.
   HIG «Toolbars»: «the standard Back button lets them retrace their steps
   through a hierarchy of information» — по пройденному пути, а не в заранее
   назначенное место. */
console.log('\n── возврат из записи ──');
let notBack = 0;
const BACK_FROM = [
  ['поиск', '?q=скидка'],
  ['«Спросить»', '?screen=ask'],
  ['корзина', '?scope=trash'],
  ['папка', '?scope=folder&value=Продажи'],
  ['все записи', '?screen=files'],
  ['важное', '?screen=files&sort=date']
];
const spot = () => pg.evaluate(() => M.screen + (M.scope.kind !== 'all' ? ':' + M.scope.kind + (M.scope.value || '') : '') + (M.q ? ' q=' + M.q : ''));
for (const os of ['ios', 'android']) {
  for (const [name, q] of BACK_FROM) {
    await pg.goto(BASE + q + (q ? '&' : '?') + 'os=' + os);
    await pg.waitForTimeout(300);
    if (/screen=ask/.test(q)) {                 // в «Спросить» сперва нужен ответ
      await pg.locator('[data-askq]').first().click({ timeout: 1500 }).catch(() => {});
      await pg.waitForTimeout(400);
    }
    const from = await spot();
    await pg.evaluate(() => { const el = document.querySelector('#phone [data-file]'); if (el) el.click(); });
    await pg.waitForTimeout(350);
    const mid = await spot();
    if (mid !== 'note' && !mid.startsWith('note')) { console.log(`${os} · ${name}: в запись не зашли (${mid})`); continue; }
    await pg.locator('#phone [data-back]').first().click({ timeout: 1500 }).catch(() => {});
    await pg.waitForTimeout(350);
    const to = await spot();
    const ok = to === from;
    if (!ok) notBack++;
    console.log(`${os} · ${name}: ${from} → запись → ${to} ${ok ? '✅' : '🔴 НЕ ТУДА, откуда пришли'}`);
  }
}
console.log(notBack ? `🔴 возврат уводит не туда: ${notBack}` : '✅ возврат везде ведёт туда, откуда пришли');

/* ── НИЧЕГО НЕ ВЫЛЕЗАЕТ ЗА ГРАНИЦЫ ЭКРАНА ───────────────────────────────────
   Геометрию не мерила ни одна проверка: живость смотрит на изменение снимка,
   язык — на строки, выход — на переходы. Карточка лимита на главном экране
   торчала за правый край на 20 px и даже за корпус телефона — владелец увидела
   это на глаз, а отчёты были зелёные.
   Намеренно прокручиваемые полосы (чипсы, сегменты) шире экрана по замыслу,
   поэтому элементы внутри контейнера с горизонтальной прокруткой пропускаются. */
console.log('\n── выход за границы экрана ──');
let over = 0;
for (const os of ['ios', 'android']) {
  for (const [name, q] of SCREENS) {
    await pg.goto(BASE + (q ? q + '&os=' + os : '?os=' + os));
    await pg.waitForTimeout(300);
    const bad = await pg.evaluate(() => {
      const scroll = document.querySelector('#phone #scroll') || document.querySelector('#phone');
      if (!scroll) return [];
      const box = scroll.getBoundingClientRect();
      const out = [];
      for (const el of scroll.querySelectorAll('*')) {
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) continue;
        let p = el.parentElement, scrolls = false;
        while (p && p !== scroll.parentElement) {
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
    if (bad.length) { over++; console.log(`🔴 ${os} · ${name}: ${bad.join(' · ')}`); }
  }
}
console.log(over ? `🔴 экранов с выходом за границы: ${over}` : '✅ за границы экрана ничего не выходит');

if (errs.length) console.log('ОШИБКИ СТРАНИЦЫ:', [...new Set(errs)].join(' | '));
await b.close();
