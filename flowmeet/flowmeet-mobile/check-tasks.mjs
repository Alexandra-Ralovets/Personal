/* ПРОХОДИМОСТЬ РАБОТ: доходит ли человек до цели своей работы.
   ─────────────────────────────────────────────────────────────────────────────
   Третья проверка рядом с живостью и маршрутами, и вопрос у неё свой.

   · Живость: «отвечает ли кнопка». Тупик из живых кнопок для неё чист.
   · Маршруты: «есть ли из состояния выход» и «возвращает ли назад туда, откуда
     пришли». Это СВОЙСТВА — они верны для любого экрана и сами распространяются
     на все состояния, включая те, о которых мы не подумали.
   · Здесь: «пройден ли ПУТЬ работы до результата». Свойство пути не заменяет:
     оно проверяет каждый экран по отдельности, а работа человека — это цепочка,
     и рвётся она между экранами.

   ЗАЧЕМ. Работы проверки удобства до сих пор проходились руками перед каждым
   прогоном на людях. Руками это делается один раз и забывается: правка макета
   через неделю ломает путь молча. Здесь тот же список работ, что дают людям
   ([материалы прогона](../Progon-udobstva-FlowMeet-materialy.2026-08-28.md)) —
   второго перечня работ не заводим.

   ЧТО ПРОВЕРЯЕТСЯ И ЧТО НЕТ. Машина проверяет ДОСТИЖИМОСТЬ цели: есть ли путь и
   приводит ли он к нужному состоянию. Понимание человеком она не проверяет — это
   и есть предмет прогона на людях. Зелёный отчёт значит «пройти можно», а не
   «человек пройдёт».

   КАЖДАЯ РАБОТА НАЧИНАЕТСЯ С ЧИСТОГО СОСТОЯНИЯ — с базового адреса, как на живом
   прогоне: иначе вторая работа стартует из того, чем кончилась первая.

   Запускать из каталога-черновика, не из репозитория (chromium при падении
   пишет `core.*` в текущий каталог):

     cd "$SCRATCH" && PLAYWRIGHT_BROWSERS_PATH=/tmp/corphub-cache/portal-pw/browsers \
       node .../flowmeet-mobile/check-tasks.mjs
*/
import { chromium } from '/tmp/corphub-cache/portal-pw/node_modules/playwright/index.mjs';
const BASE = 'http://localhost:10005/flowmeet-mobile/';

const b = await chromium.launch({ args: ['--no-sandbox'] });
const pg = await b.newPage({ viewport: { width: 430, height: 1000 } });
pg.on('dialog', d => d.accept('Проверка работ'));
const errs = []; pg.on('pageerror', e => errs.push(e.message));

const wait = (ms = 350) => pg.waitForTimeout(ms);
const текст = () => pg.evaluate(() => (document.querySelector('#phone') || document.body).innerText);
const жать = sel => pg.locator('#phone ' + sel).first().click({ timeout: 2000 }).catch(() => {});
/* exact — по умолчанию нестрогое совпадение, но пункт нижней панели «Записи»
   так ловит «Все записи» и «60 записей», и нажатие уходит не туда. Где подпись
   короткая и встречается внутри других — жмём строго. */
const жатьТекст = (t, exact = false) =>
  pg.getByText(t, { exact }).first().click({ timeout: 2000 }).catch(() => {});

/* Работы — те же, что на карточках прогона. Каждая: шаги и проверяемый исход. */
const РАБОТЫ = [
  ['1 · о чём договорились на вчерашней встрече', async () => {
    await жатьТекст('Все записи'); await wait();
    /* Первая запись в группе «Вчера» — на ней стоят работы 1–3. */
    await pg.evaluate(() => {
      const узлы = [...document.querySelectorAll('#scroll *')];
      const i = узлы.findIndex(e => e.textContent.trim() === 'Вчера' && e.children.length === 0);
      const строка = узлы.slice(i).find(e => e.hasAttribute && e.hasAttribute('data-file'));
      if (строка) строка.click();
    });
    await wait();
    const t = await текст();
    return /Договорились/.test(t) ? null : 'в записи нет раздела «Договорились»';
  }],

  ['2 · что ответили про скидку и на какой минуте', async () => {
    await жатьТекст('Все записи'); await wait();
    await жать('[data-go="search"], [data-search]');
    await wait();
    await pg.locator('#phone input').first().fill('скидка').catch(() => {});
    await wait(500);
    const t = await текст();
    if (!/нашли/i.test(t)) return 'поиск ничего не нашёл';
    return /\d\d:\d\d/.test(t) ? null : 'у найденного не видно времени — минуту назвать нечем';
  }],

  ['3 · отдать руководителю содержание встречи', async () => {
    await pg.goto(BASE + '?file=demo&tab=summary'); await wait();
    await жать('[data-rowmenu]'); await wait();
    const t = await текст();
    return /Поделиться|Выгрузить/.test(t) ? null : 'отдать содержание нечем';
  }],

  ['4 · чтобы следующие встречи разбирались по своей структуре', async () => {
    await жатьТекст('Шаблоны'); await wait();
    await жать('.m-card'); await wait();
    await жать('[data-tpldefault]'); await wait();
    const вкл = await pg.evaluate(() => {
      const el = document.querySelector('[data-tpldefault]');
      return el && el.classList.contains('is-on');
    });
    return вкл ? null : 'шаблон для новых записей не назначается';
  }],

  ['5 · все встречи с этим клиентом', async () => {
    await жатьТекст('Все записи'); await wait();
    await жать('[data-go="search"], [data-search]'); await wait();
    await pg.locator('#phone input').first().fill('производственный холдинг').catch(() => {});
    await wait(500);
    const t = await текст();
    const m = t.match(/нашли (\d+)/i);
    return m && +m[1] > 1 ? null : 'встречи с клиентом одним списком не собираются';
  }],

  ['6 · убрать личный разговор, записанный по ошибке', async () => {
    await жатьТекст('Все записи'); await wait();
    const было = await pg.evaluate(() => document.querySelectorAll('#phone [data-file]').length);
    /* Личная запись — свежая, с нейтральным названием «Запись от …». */
    await pg.evaluate(() => {
      const стр = [...document.querySelectorAll('#phone [data-file]')].find(e => /Запись от/.test(e.innerText));
      const кн = стр && стр.querySelector('[data-rowmenu]');
      if (кн) кн.click(); else if (стр) стр.click();
    });
    await wait();
    await жатьТекст('В корзину'); await wait(500);
    const стало = await pg.evaluate(() => document.querySelectorAll('#phone [data-file]').length);
    return стало < было ? null : 'запись не убирается из списка';
  }],

  ['10 · воспользоваться подсказкой про цену', async () => {
    /* Состояние идущей записи ведущий открывает сам — в макете разговор не
       начнётся по себе. Дальше человек работает без подсказок. */
    await pg.goto(BASE + '?rec=on&hints=3'); await wait(500);
    const t = await текст();
    if (!/Цена и правила скидок/.test(t)) return 'подсказки про цену на экране нет';
    return /Прайс-лист/.test(t) ? null : 'у подсказки не видно источника — проверить ответ нечем';
  }],

  ['11 · чтобы запись с диктофона появилась в приложении', async () => {
    await жатьТекст('Ещё'); await wait();
    await жатьТекст('Диктофоны'); await wait();
    const было = await pg.evaluate(() => FILES.length);
    await жатьТекст('Забрать'); await wait(500);
    const стало = await pg.evaluate(() => FILES.length);
    if (стало <= было) return 'запись с диктофона не забирается';
    /* Дальше идём НИЖНЕЙ ПАНЕЛЬЮ, а не адресом: прототип держит состояние в
       памяти, и переход по ссылке перезагрузил бы страницу — забранная запись
       пропала бы, и проверка обвинила бы прототип в своём же промахе. Сценарий
       обязан ходить так же, как человек: внутри приложения. */
    await жатьТекст('Записи', true); await wait();      // пункт нижней панели
    await жатьТекст('Все записи'); await wait(400);
    const список = await текст();
    return /Разговор в цехе|Встреча у заказчика/.test(список)
      ? null : 'забранная запись в общем списке не появилась';
  }]
];

let плохих = 0;
for (const os of ['ios', 'android']) {
  console.log(`\n══ оболочка ${os} ══`);
  for (const [имя, шаги] of РАБОТЫ) {
    await pg.goto(BASE + '?os=' + os);        // чистое состояние, как на живом прогоне
    await wait(400);
    let беда = null;
    try { беда = await шаги(); } catch (e) { беда = 'сорвалось: ' + e.message.slice(0, 60); }
    if (беда) плохих++;
    console.log(`  ${беда ? '🔴' : '✅'} работа ${имя}${беда ? ' → ' + беда : ''}`);
  }
}
console.log(плохих ? `\n🔴 непроходимых работ: ${плохих}` : '\n✅ все работы проходятся');
if (errs.length) console.log('ОШИБКИ СТРАНИЦЫ:', [...new Set(errs)].join(' | '));
await b.close();
