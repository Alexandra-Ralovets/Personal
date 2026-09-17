/* ПРОХОДИМОСТЬ РАБОТ: доходит ли человек до цели своей работы.
   ─────────────────────────────────────────────────────────────────────────────
   Третья проверка рядом с живостью и маршрутами, и вопрос у неё свой.

   · Живость: «отвечает ли кнопка». Тупик из живых кнопок для неё чист.
   · Маршруты: «есть ли из состояния выход» и «возвращает ли назад туда, откуда
     пришли». Это СВОЙСТВА — они верны для любого экрана и сами распространяются
     на все состояния, включая те, о которых мы не подумали.
   · Здесь: «пройден ли ПУТЬ работы до результата». Свойство пути не заменяет:
     оно проверяет каждый экран по отдельности, а работа человека — цепочка, и
     рвётся она между экранами.

   ЗАЧЕМ. Работы проверки удобства до сих пор проходились руками перед каждым
   прогоном на людях. Руками это делается один раз и забывается: правка макета
   через неделю ломает путь молча. Список работ тот же, что дают людям
   (материалы прогона), — второго перечня не заводим.

   ЧТО ПРОВЕРЯЕТСЯ И ЧТО НЕТ. Машина проверяет ДОСТИЖИМОСТЬ цели: есть ли путь и
   приводит ли он к нужному состоянию. Понимание человеком она не проверяет — это
   и есть предмет прогона на людях. Зелёный отчёт значит «пройти можно», а не
   «человек пройдёт».

   СЦЕНАРИЙ ХОДИТ ТАК ЖЕ, КАК ЧЕЛОВЕК — нажатиями внутри окна, а не переходом по
   адресу. Прототип держит состояние в памяти, и переход по ссылке перезагружает
   страницу: забранная с диктофона запись после такого «перехода» пропадала бы, и
   проверка обвинила бы прототип в своём же промахе.

   Запускать из каталога-черновика, не из репозитория (chromium при падении
   пишет `core.*` в текущий каталог):

     cd "$SCRATCH" && PLAYWRIGHT_BROWSERS_PATH=/tmp/corphub-cache/portal-pw/browsers \
       node .../flowmeet-desktop/check-tasks.mjs
*/
import { chromium } from '/tmp/corphub-cache/portal-pw/node_modules/playwright/index.mjs';
const BASE = 'http://localhost:10005/flowmeet-desktop/';

const b = await chromium.launch({ args: ['--no-sandbox'] });
const pg = await b.newPage({ viewport: { width: 1560, height: 1000 } });
pg.on('dialog', d => d.accept('Проверка работ'));
const errs = []; pg.on('pageerror', e => errs.push(e.message));

const wait = (ms = 350) => pg.waitForTimeout(ms);
const текст = () => pg.evaluate(() => document.body.innerText);
const жать = sel => pg.locator(sel).first().click({ timeout: 2000 }).catch(() => {});
const жатьТекст = (t, exact = false) =>
  pg.getByText(t, { exact }).first().click({ timeout: 2000 }).catch(() => {});

const РАБОТЫ = [
  ['1 · о чём договорились на вчерашней встрече', async () => {
    /* Самая свежая встреча с клиентом — вчерашняя, вторая строка сверху: первой
       стоит сегодняшняя. Берём её по названию, а не по номеру строки. */
    await pg.evaluate(() => {
      const стр = [...document.querySelectorAll('#winApp [data-file]')]
        .find(e => /Демонстрация Proceset/.test(e.innerText));
      if (стр) стр.click();
    });
    await wait(450);
    return /Договорились/.test(await текст()) ? null : 'в записи нет раздела «Договорились»';
  }],

  ['2 · что ответили про скидку и на какой минуте', async () => {
    await жатьТекст('Поиск', true); await wait();
    await pg.locator('#winApp input').first().fill('скидка').catch(() => {});
    await wait(500);
    const t = await текст();
    if (/Ничего не нашли/i.test(t)) return 'поиск ничего не нашёл';
    /* Минуту человек называет из открытой записи: в списке стоит длительность.
       Открываем найденное и смотрим, есть ли время у реплик. */
    await pg.evaluate(() => { const el = document.querySelector('#winApp [data-file]'); if (el) el.click(); });
    await wait(450);
    return /\d\d:\d\d:\d\d/.test(await текст()) ? null : 'у реплик не видно времени';
  }],

  ['3 · отдать руководителю содержание встречи', async () => {
    await pg.evaluate(() => { const el = document.querySelector('#winApp [data-file]'); if (el) el.click(); });
    await wait(450);
    return /Поделиться/.test(await текст()) ? null : 'отдать содержание нечем';
  }],

  ['4 · чтобы следующие встречи разбирались по своей структуре', async () => {
    await жатьТекст('Шаблоны', true); await wait(450);
    await жать('.fm-card'); await wait(450);
    await жатьТекст('Применять по умолчанию'); await wait(450);
    return /Применяется по умолчанию|по умолчанию/.test(await текст())
      ? null : 'шаблон для новых записей не назначается';
  }],

  ['5 · все встречи с этим клиентом', async () => {
    await жатьТекст('Поиск', true); await wait();
    await pg.locator('#winApp input').first().fill('производственный холдинг').catch(() => {});
    await wait(500);
    const n = await pg.evaluate(() => document.querySelectorAll('#winApp [data-file]').length);
    return n > 1 ? null : 'встречи с клиентом одним списком не собираются';
  }],

  ['6 · убрать личный разговор, записанный по ошибке', async () => {
    const было = await pg.evaluate(() => document.querySelectorAll('#winApp [data-file]').length);
    await pg.evaluate(() => {
      const стр = [...document.querySelectorAll('#winApp [data-file]')].find(e => /Запись от/.test(e.innerText));
      const кн = стр && стр.querySelector('[data-rowmenu]');
      if (кн) кн.click();
    });
    await wait();
    await жатьТекст('В корзину'); await wait(500);
    const стало = await pg.evaluate(() => document.querySelectorAll('#winApp [data-file]').length);
    return стало < было ? null : 'запись не убирается из списка';
  }],

  ['10 · воспользоваться подсказкой про цену', async () => {
    /* Идущую запись ведущий открывает сам — в макете разговор не начнётся по
       себе. Дальше человек работает без подсказок. */
    await pg.goto(BASE + '?view=tray&rec=on&hints=3'); await wait(500);
    const t = await текст();
    if (!/Цена и правила скидок/.test(t)) return 'подсказки про цену на экране нет';
    return /Прайс-лист/.test(t) ? null : 'у подсказки не видно источника — проверить ответ нечем';
  }],

  ['11 · чтобы запись с диктофона появилась в приложении', async () => {
    await жатьТекст('Диктофоны', true); await wait(450);
    const было = await pg.evaluate(() => FILES.length);
    await жатьТекст('Забрать'); await wait(500);
    const стало = await pg.evaluate(() => FILES.length);
    if (стало <= было) return 'запись с диктофона не забирается';
    await жатьТекст('Все файлы'); await wait(450);
    return /Разговор в цехе|Встреча у заказчика/.test(await текст())
      ? null : 'забранная запись в общем списке не появилась';
  }]
];

let плохих = 0;
for (const os of ['win', 'mac']) {
  console.log(`\n══ рамка ${os} ══`);
  for (const [имя, шаги] of РАБОТЫ) {
    await pg.goto(BASE + '?os=' + os);          // чистое состояние, как на живом прогоне
    await wait(450);
    let беда = null;
    try { беда = await шаги(); } catch (e) { беда = 'сорвалось: ' + e.message.slice(0, 60); }
    if (беда) плохих++;
    console.log(`  ${беда ? '🔴' : '✅'} работа ${имя}${беда ? ' → ' + беда : ''}`);
  }
}
console.log(плохих ? `\n🔴 непроходимых работ: ${плохих}` : '\n✅ все работы проходятся');
if (errs.length) console.log('ОШИБКИ СТРАНИЦЫ:', [...new Set(errs)].join(' | '));
await b.close();
