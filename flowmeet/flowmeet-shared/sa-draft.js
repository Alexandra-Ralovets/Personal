/* Схемы BPMN постановки. Разметку страницы см. ниже, содержание — sa-data.js. */

function saTask(x, y, w, h, lines) {
  const t = lines.map((s, i) =>
    `<text class="fm-bpmn-t" x="${x + w / 2}" y="${y + 18 + i * 14}" text-anchor="middle">${s}</text>`).join('');
  return `<rect class="fm-bpmn-task" x="${x}" y="${y}" width="${w}" height="${h}" rx="8"/>${t}`;
}
function saGw(x, y, cap) {
  return `<path class="fm-bpmn-gw" d="M${x} ${y + 18} L${x + 18} ${y} L${x + 36} ${y + 18} L${x + 18} ${y + 36} z"/>
    <text class="fm-bpmn-cap" x="${x + 18}" y="${y + 50}" text-anchor="middle">${cap}</text>`;
}
function saStart(x, y, cap) {
  return `<circle class="fm-bpmn-start" cx="${x}" cy="${y}" r="11"/>
    <text class="fm-bpmn-cap" x="${x}" y="${y + 26}" text-anchor="middle">${cap}</text>`;
}
function saEnd(x, y, cap) {
  return `<circle class="fm-bpmn-end" cx="${x}" cy="${y}" r="11"/>
    <text class="fm-bpmn-cap" x="${x > 960 ? x + 11 : x}" y="${y + 26}" text-anchor="${x > 960 ? 'end' : 'middle'}">${cap}</text>`;   // подпись у правого края не обрезается
}
function saBpmnDefs() {
  return `<defs>
    <marker id="fmArr" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
      <path d="M0 0 L8 4 L0 8 z" fill="var(--text-primary)"/></marker>
    <marker id="fmArrMsg" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
      <path d="M0 0 L8 4 L0 8 z" fill="var(--text-complimentary)"/></marker>
  </defs>`;
}

function saLanes(title, a, b, c) {
  return `<rect class="fm-bpmn-lane" x="0" y="28" width="1080" height="130"/>
    <rect class="fm-bpmn-lane" x="0" y="158" width="1080" height="160"/>
    <rect class="fm-bpmn-lane" x="0" y="318" width="1080" height="150"/>
    <line class="fm-bpmn-seq" x1="48" y1="28" x2="48" y2="468"/>
    <text class="fm-bpmn-lt" x="24" y="95" text-anchor="middle" transform="rotate(-90 24 95)">${a}</text>
    <text class="fm-bpmn-lt" x="24" y="238" text-anchor="middle" transform="rotate(-90 24 238)">${b}</text>
    <text class="fm-bpmn-lt" x="24" y="395" text-anchor="middle" transform="rotate(-90 24 395)">${c}</text>
    <text class="fm-bpmn-lt" x="8" y="20">${title}</text>`;
}

function saBpmnC1() {
  return `<svg class="fm-bpmn" id="fm-bpmn-c1" viewBox="0 0 1080 500" role="img" aria-label="Ц-1 после разговора">
    ${saLanes('Ц-1. После разговора. Без id карточки в продажи не кладём.', 'FlowMeet', 'Система продаж', 'Продавец')}
    ${saStart(80, 90, 'разговор кончился')}
    ${saTask(125, 66, 150, 48, ['Запись ушла', 'на сервер компании'])}
    ${saGw(300, 72, 'id карточки уже есть?')}

    ${saTask(400, 190, 170, 48, ['Встреча на карточке', 'в «Встречах и звонках»'])}
    ${saTask(610, 190, 180, 48, ['Черновик: кто решает,', 'что сказали, что пообещали'])}
    ${saEnd(1040, 214, 'руководитель видит встречу')}

    ${saGw(300, 330, 'это клиент?')}
    ${saTask(400, 348, 170, 48, ['Указать карточку'])}
    ${saTask(610, 348, 180, 48, ['Подтвердить, поправить', 'или отправить переделать'])}
    ${saEnd(1040, 372, 'в карточку не кладём')}

    <path class="fm-bpmn-seq" d="M91 90 H125"/>
    <path class="fm-bpmn-seq" d="M275 90 H300"/>
    <path class="fm-bpmn-seq" d="M336 90 V214 H400"/>
    <text class="fm-bpmn-cap" x="455" y="182">да · календарь, телефон, выбрали</text>
    <path class="fm-bpmn-seq" d="M318 108 V330"/>
    <text class="fm-bpmn-cap" x="268" y="220">нет</text>
    <path class="fm-bpmn-seq" d="M336 348 H400"/>
    <text class="fm-bpmn-cap" x="368" y="338">да</text>
    <path class="fm-bpmn-seq" d="M318 366 V430 H1040 V383"/>
    <text class="fm-bpmn-cap" x="700" y="422">нет · не касание, найм</text>
    <path class="fm-bpmn-msg" d="M485 348 V238"/>
    <path class="fm-bpmn-seq" d="M570 214 H610"/>
    <path class="fm-bpmn-seq" d="M790 214 H1029"/>
    <path class="fm-bpmn-msg" d="M700 238 V348"/>
    <path class="fm-bpmn-seq" d="M790 372 H960 V225 H1040"/>
  </svg>`;
}

function saBpmnC2() {
  return `<svg class="fm-bpmn" id="fm-bpmn-c2" viewBox="0 0 1080 500" role="img" aria-label="Ц-2 контур">
    ${saLanes('Ц-2. Запись остаётся на сервере компании, не в чужом облаке.', 'FlowMeet', 'Сервер компании', 'Сотрудник')}
    ${saStart(80, 90, 'разговор кончился')}
    ${saGw(150, 72, 'связь есть?')}
    ${saTask(250, 66, 140, 48, ['Очередь', 'на устройстве'])}
    ${saTask(450, 66, 160, 48, ['Отправить', 'на сервер компании'])}
    ${saTask(650, 66, 170, 48, ['Нет кнопки', '«отправить в облако»'])}

    ${saTask(450, 190, 170, 48, ['Принять, расшифровать,', 'хранить в контуре'])}
    ${saEnd(1040, 214, 'архив в периметре, не в облаке')}

    <path class="fm-bpmn-seq" d="M91 90 H150"/>
    <path class="fm-bpmn-seq" d="M186 90 H250"/>
    <text class="fm-bpmn-cap" x="218" y="80">нет</text>
    <path class="fm-bpmn-seq" d="M168 72 V48 H530 V66"/>
    <text class="fm-bpmn-cap" x="360" y="44">да</text>
    <path class="fm-bpmn-seq" d="M390 90 H450"/>
    <path class="fm-bpmn-seq" d="M530 114 V190"/>
    <path class="fm-bpmn-seq" d="M620 214 H1029"/>
  </svg>`;
}

function saBpmnC3() {
  return `<svg class="fm-bpmn" id="fm-bpmn-c3" viewBox="0 0 1080 500" role="img" aria-label="Ц-3 картина по клиенту">
    ${saLanes('Ц-3. Онлайн, переговорная и телефон — на одну карточку предприятия.', 'FlowMeet', 'Система продаж', 'Новый продавец')}
    ${saStart(80, 90, 'разговор')}
    ${saGw(155, 72, 'привязка есть?')}
    ${saTask(270, 48, 130, 40, ['Компьютер', 'онлайн'])}
    ${saTask(270, 96, 130, 40, ['Диктофон', 'или телефон'])}
    ${saEnd(1040, 90, 'не в карточку клиента')}

    ${saTask(470, 190, 190, 48, ['Та же карточка ООО «Норд»', 'канал «Встречи и звонки»'])}
    ${saEnd(1040, 214, 'картина у предприятия')}

    ${saTask(470, 348, 190, 48, ['Открыл карточку', 'без телефона прежнего'])}

    <path class="fm-bpmn-seq" d="M91 90 H155"/>
    <path class="fm-bpmn-seq" d="M173 72 V36 H1029"/>
    <text class="fm-bpmn-cap" x="700" y="32">нет</text>
    <path class="fm-bpmn-seq" d="M191 90 V68 H270"/>
    <path class="fm-bpmn-seq" d="M191 90 V116 H270"/>
    <text class="fm-bpmn-cap" x="230" y="56">да</text>
    <path class="fm-bpmn-seq" d="M400 68 H440 V214 H470"/>
    <path class="fm-bpmn-seq" d="M400 116 H440 V214 H470"/>
    <path class="fm-bpmn-seq" d="M660 214 H1029"/>
    <path class="fm-bpmn-msg" d="M565 238 V348"/>
  </svg>`;
}

function saBpmnC4() {
  return `<svg class="fm-bpmn" id="fm-bpmn-c4" viewBox="0 0 1080 500" role="img" aria-label="Ц-4 касания">
    ${saLanes('Ц-4. Счёт касаний в системе продаж, не в приложении часов.', 'FlowMeet', 'Система продаж', 'Руководитель')}
    ${saStart(80, 90, 'запись ушла')}
    ${saGw(165, 72, 'привязка есть?')}
    ${saEnd(1040, 90, 'не считаем')}

    ${saGw(165, 206, 'уже считали этот файл?')}
    ${saTask(320, 190, 150, 48, ['+1 касание', 'дата в канале'])}
    ${saTask(520, 190, 160, 48, ['Этап сделки', 'не двигать'])}
    ${saEnd(1040, 214, 'не второй счётчик')}

    ${saTask(320, 348, 170, 48, ['Видит число встреч', 'и дни между ними'])}

    <path class="fm-bpmn-seq" d="M91 90 H165"/>
    <path class="fm-bpmn-seq" d="M201 90 H1029"/>
    <text class="fm-bpmn-cap" x="500" y="80">нет · не касание</text>
    <path class="fm-bpmn-seq" d="M183 108 V206"/>
    <text class="fm-bpmn-cap" x="155" y="155">да</text>
    <path class="fm-bpmn-seq" d="M201 224 V170 H1040 V203"/>
    <text class="fm-bpmn-cap" x="720" y="162">да · тот же файл</text>
    <path class="fm-bpmn-seq" d="M201 224 H320"/>
    <text class="fm-bpmn-cap" x="250" y="244">нет · новое касание</text>
    <path class="fm-bpmn-seq" d="M470 214 H520"/>
    <path class="fm-bpmn-seq" d="M680 214 H1029"/>
    <path class="fm-bpmn-msg" d="M395 238 V348"/>
  </svg>`;
}

function saBpmnC5() {
  return `<svg class="fm-bpmn" id="fm-bpmn-c5" viewBox="0 0 1080 500" role="img" aria-label="Ц-5 подсказка">
    ${saLanes('Ц-5. Подсказка в FlowMeet, пока идёт разговор. В карточку не пишем.', 'FlowMeet', 'Сервер / карточка', 'Сотрудник')}
    ${saStart(80, 90, 'запись идёт')}
    ${saGw(165, 72, 'подсказки включены?')}
    ${saGw(320, 72, 'связь есть?')}
    ${saTask(430, 66, 150, 48, ['Карточка подсказки', 'в FlowMeet'])}
    ${saEnd(1040, 90, 'пишет без карточек')}

    ${saTask(300, 190, 150, 48, ['Честно: живых', 'подсказок нет'])}
    ${saEnd(510, 214, 'без живых подсказок')}
    ${saGw(630, 206, 'клиент опознан?')}
    ${saTask(700, 168, 150, 40, ['Факты карточки', 'только чтение'])}
    ${saTask(700, 228, 150, 40, ['Профиль,', 'не чужая карточка'])}
    ${saEnd(1040, 214, 'в CRM не писали')}

    ${saTask(70, 348, 150, 48, ['Включил', 'подсказки сам'])}
    ${saTask(430, 348, 150, 48, ['Читает карточку', 'не уходит выяснять'])}

    <path class="fm-bpmn-seq" d="M91 90 H165"/>
    <path class="fm-bpmn-seq" d="M183 72 V36 H1029"/>
    <text class="fm-bpmn-cap" x="700" y="32">нет</text>
    <path class="fm-bpmn-seq" d="M201 90 H320"/>
    <text class="fm-bpmn-cap" x="250" y="80">да</text>
    <path class="fm-bpmn-seq" d="M356 90 H430"/>
    <text class="fm-bpmn-cap" x="390" y="80">да</text>
    <path class="fm-bpmn-seq" d="M338 108 V190"/>
    <text class="fm-bpmn-cap" x="310" y="155">нет</text>
    <path class="fm-bpmn-seq" d="M450 214 H499"/>
    <path class="fm-bpmn-msg" d="M580 114 V224 H630"/>
    <path class="fm-bpmn-seq" d="M666 224 V188 H700"/>
    <text class="fm-bpmn-cap" x="680" y="180">да</text>
    <path class="fm-bpmn-seq" d="M666 224 V248 H700"/>
    <text class="fm-bpmn-cap" x="680" y="268">нет</text>
    <path class="fm-bpmn-seq" d="M850 188 H1040 V203"/>
    <path class="fm-bpmn-seq" d="M850 248 H1040 V225"/>
    <path class="fm-bpmn-msg" d="M145 348 H183 V108"/>
    <path class="fm-bpmn-msg" d="M505 114 V348"/>
  </svg>`;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Страница «Постановка». Содержание — в flowmeet-shared/sa-data.js (window.SA),
   который собирает tools/build_requirements.py из tools/sa_content_*.py; здесь
   только разметка. Правки текста вносятся в источник, а не сюда.
   ───────────────────────────────────────────────────────────────────────────── */
const SA_BPMN = { 1: saBpmnC1, 2: saBpmnC2, 3: saBpmnC3, 4: saBpmnC4, 5: saBpmnC5 };
const saEsc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const saTxt = s => saEsc(s).replace(/`([^`]+)`/g, '<code>$1</code>');
const SA_CSS = `<style>
.sa h2 { margin: var(--size-8x) 0 var(--size-3x); }
.sa h3 { margin: var(--size-6x) 0 var(--space-m); }
.sa table { width: 100%; border-collapse: collapse; margin: 0 0 var(--size-4x); }
.sa th { text-align: left; padding: var(--space-s) var(--space-m); border-bottom: 1px solid var(--line-border); color: var(--text-complimentary); font-weight: 500; white-space: nowrap; }
.sa td { padding: var(--space-m); border-bottom: 1px solid var(--line-divider); vertical-align: top; }
.sa a { color: var(--primary-active); }
.sa .sa-scroll { overflow-x: auto; }
.sa .sa-id { white-space: nowrap; font-weight: 500; }
.sa .sa-lead { max-width: 900px; }
.sa .sa-meta { display: grid; grid-template-columns: 9rem 1fr; gap: var(--space-s) var(--size-4x); margin: 0 0 var(--size-4x); }
.sa .sa-meta dt { color: var(--text-complimentary); }
.sa .sa-meta dd { margin: 0; }
.sa .sa-case { border: 1px solid var(--line-divider); border-radius: var(--radius-m); padding: var(--size-4x); margin: 0 0 var(--size-3x); }
.sa .sa-case h4 { margin: 0 0 var(--space-s); }
.sa .sa-story { margin: 0 0 var(--space-m); color: var(--text-complimentary); }
.sa .sa-case dl { display: grid; grid-template-columns: 9rem 1fr; gap: var(--space-s) var(--size-4x); margin: 0; }
.sa .sa-case dt { color: var(--text-complimentary); }
.sa .sa-case dd { margin: 0; }
.sa details { margin-top: var(--space-m); }
.sa summary { cursor: pointer; color: var(--primary-active); }
.sa ol, .sa ul { margin: var(--space-s) 0; padding-left: 1.4em; }
.sa .sa-chip { display: inline-block; padding: 0 var(--space-m); border: 1px solid var(--line-border); border-radius: var(--radius-m); margin-right: var(--space-s); white-space: nowrap; }
.sa .sa-two { display: grid; grid-template-columns: 1fr 1fr; gap: var(--size-6x); }
@media (max-width: 900px) { .sa .sa-two, .sa .sa-meta, .sa .sa-case dl { grid-template-columns: 1fr; } }
</style>`;

function saList(items) { return '<ul class="text-body-3">' + items.map(x => '<li>' + saTxt(x) + '</li>').join('') + '</ul>'; }
const saLink = id => '<a href="#sa-' + id + '">' + id + '</a>';

function saCaseHtml(c) {
  const alts = c.alts.length
    ? '<p style="margin:var(--space-m) 0 0"><strong>Другие исходы</strong></p><ul>' + c.alts.map(a => '<li><strong>' + saTxt(a[0]) + '.</strong> ' + saTxt(a[1]) + '</li>').join('') + '</ul>'
    : '';
  return `<div class="sa-case text-body-3" id="sa-${c.id}">
    <h4 class="text-subheader-1"><span class="sa-id">${c.id}</span> ${saTxt(c.title)}</h4>
    <p class="sa-story">${saTxt(c.story)}</p>
    <dl>
      <dt>Ситуация</dt><dd>${saTxt(c.situation)}</dd>
      <dt>Проблема сейчас</dt><dd>${saTxt(c.problem)}</dd>
      <dt>Результат</dt><dd>${saTxt(c.result)}</dd>
      <dt>Требования</dt><dd>${c.fts.map(f => '<a class="sa-chip" href="#sa-' + f + '">' + f + '</a>').join('')}</dd>
    </dl>
    <details><summary>Сценарий по шагам</summary>
      <ol>${c.steps.map(x => '<li>' + saTxt(x) + '</li>').join('')}</ol>${alts}
      <p style="margin:var(--space-m) 0 0"><strong>Итог.</strong> ${saTxt(c.post)}</p>
    </details>
  </div>`;
}

function saFtTable(g) {
  const rows = g.fts.map(f => `<tr id="sa-${f.id}">
      <td class="sa-id">${f.id}</td>
      <td><strong>${saTxt(f.name)}.</strong> ${saTxt(f.text)}<br><span style="color:var(--text-complimentary)">${saTxt(f.who)}</span></td>
      <td>${saTxt(f.params)}</td>
      <td>${saTxt(f.check)}</td>
      <td class="sa-id">${f.ac.map(saLink).join('<br>')}</td>
    </tr>`).join('');
  return `<div class="sa-scroll"><table class="text-body-3">
    <thead><tr><th>№</th><th>Требование</th><th>Параметры</th><th>Проверка и ограничения</th><th>Приёмка</th></tr></thead>
    <tbody>${rows}</tbody></table></div>`;
}

function saAcTable(g) {
  const rows = g.ac.map(a => `<tr id="sa-${a[0]}"><td class="sa-id">${a[0]}</td><td>${saTxt(a[1])}</td><td class="sa-id">${a[2].map(saLink).join(' ')}</td></tr>`).join('');
  return `<table class="text-body-3"><thead><tr><th>№</th><th>Критерий</th><th>Требования</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function saOpenTable(g) {
  const rows = g.open.map(o => `<tr${o[0] !== '—' ? ' id="sa-' + o[0] + '"' : ''}><td class="sa-id">${o[0]}</td><td>${saTxt(o[1])}</td><td>${saTxt(o[2])}</td><td>${saTxt(o[3])}</td></tr>`).join('');
  return `<div class="sa-scroll"><table class="text-body-3"><thead><tr><th>№</th><th>Вопрос или решение</th><th>Владелец</th><th>Статус</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

function saGoalHtml(g) {
  const n = g.id;
  return `
<h2 class="text-header-2" id="sa-c${n}">${g.code}. ${saTxt(g.title)}</h2>
<p class="text-body-2 sa-lead">${saTxt(g.value)}</p>
<dl class="sa-meta text-body-3">
  <dt>Роль цели</dt><dd>${saTxt(g.role)}</dd>
  <dt>Мера</dt><dd>${saTxt(g.measure)}</dd>
</dl>
<div class="sa-two text-body-3">
  <div><p class="text-subheader-1" style="margin:0 0 var(--space-s)">Цели</p>${saList(g.goal)}
    <p class="text-subheader-1" style="margin:var(--size-3x) 0 var(--space-s)">Входит</p>${saList(g.in)}</div>
  <div><p class="text-subheader-1" style="margin:0 0 var(--space-s)">Не входит</p>${saList(g.out)}</div>
</div>
<p class="text-body-3" style="margin-top:var(--size-4x)">Схема. Сплошная стрелка — шаг за шагом; пунктир — передали человеку; ромб — вопрос; жирная точка — конец.</p>
<svg width="0" height="0" aria-hidden="true">${saBpmnDefs()}</svg>
${SA_BPMN[n]()}
<h3 class="text-header-3" id="sa-c${n}-cases">${g.code} · Пользовательские кейсы</h3>
${g.cases.map(saCaseHtml).join('')}
<h3 class="text-header-3" id="sa-c${n}-ft">${g.code} · Функциональные требования</h3>
${saFtTable(g)}
<h3 class="text-header-3" id="sa-c${n}-ac">${g.code} · Критерии приёмки</h3>
${saAcTable(g)}
<h3 class="text-header-3" id="sa-c${n}-open">${g.code} · Открытые вопросы</h3>
${saOpenTable(g)}`;
}

function saProductHtml(P, date) {
  const li = arr => '<ol class="text-body-3">' + arr.map(x => '<li>' + saTxt(x) + '</li>').join('') + '</ol>';
  const rows = (arr, cols) => '<div class="sa-scroll"><table class="text-body-3"><tbody>' +
    arr.map(r => '<tr>' + r.map((c, i) => '<td' + (i === 0 ? ' class="sa-id"' : '') + '>' + saTxt(c) + '</td>').join('') + '</tr>').join('') +
    '</tbody></table></div>';
  return `
<h2 class="text-header-2" id="sa-product">О продукте</h2>
<p class="text-body-2 sa-lead">${saTxt(P.lead)}</p>
<dl class="sa-meta text-body-3">
  <dt>Для кого</dt><dd>${saTxt(P.who)}</dd>
  <dt>Какую боль снимает</dt><dd>${saTxt(P.pain)}</dd>
  <dt>Где сейчас</dt><dd>${saTxt(P.now)}</dd>
</dl>
<h3 class="text-header-3">Как это работает</h3>
${li(P.how)}
<h3 class="text-header-3">Что получает каждый</h3>
${rows(P.value)}
<h3 class="text-header-3">Из чего состоит</h3>
${rows(P.parts)}
<div class="sa-two text-body-3">
  <div><h3 class="text-header-3" style="margin-top:0">Принципы</h3>
    <ul>${P.principles.map(x => '<li><strong>' + saTxt(x[0]) + '.</strong> ' + saTxt(x[1]) + '</li>').join('')}</ul></div>
  <div><h3 class="text-header-3" style="margin-top:0">Чего продукт не делает</h3>${saList(P.not)}</div>
</div>
<h3 class="text-header-3">Как связаны пять целей</h3>
<div class="sa-scroll"><table class="text-body-3"><thead><tr><th>Цель</th><th>О чём</th><th>Роль</th><th>Зависит от</th></tr></thead><tbody>${
  P.goals_map.map(r => '<tr><td class="sa-id"><a href="#sa-c' + r[0].slice(-1) + '">' + r[0] + '</a></td><td>' + saTxt(r[1]) + '</td><td>' + saTxt(r[2]) + '</td><td>' + saTxt(r[3]) + '</td></tr>').join('')
}</tbody></table></div>`;
}

function saDraftHtml() {
  const S = window.SA;
  if (!S) return '<p class="text-body-2">Данные постановки не загружены: нет flowmeet-shared/sa-data.js.</p>';
  const toc = S.goals.map(g => `<a href="#sa-c${g.id}">${g.code}</a>`).join('');
  const terms = S.terms.map(t => '<tr><td class="sa-id">' + saTxt(t[0]) + '</td><td>' + saTxt(t[1]) + '</td></tr>').join('');
  const rules = S.rules.map(r => '<tr id="sa-' + r[0] + '"><td class="sa-id">' + r[0] + '</td><td class="sa-id">' + saTxt(r[1]) + '</td><td>' + saTxt(r[2]) + '</td></tr>').join('');
  return `<div class="sa">${SA_CSS}
<p class="text-caption-2" style="margin:0 0 var(--space-s)">${S.date}</p>
<h1 class="text-header-1" style="margin:0 0 var(--size-3x)">FlowMeet — постановка</h1>
<nav class="fm-brief__toc text-body-3">
  <a href="#sa-product">О продукте</a><a href="#sa-terms">Термины</a><a href="#sa-rules">Сквозные правила</a>${toc}<a href="#sa-known">Что известно</a>
</nav>
${saProductHtml(S.product, S.date)}

<h2 class="text-header-2" id="sa-terms">Термины</h2>
<div class="sa-scroll"><table class="text-body-3"><thead><tr><th>Термин</th><th>Определение</th></tr></thead><tbody>${terms}</tbody></table></div>

<h2 class="text-header-2" id="sa-rules">Сквозные правила</h2>
<p class="text-body-3">Действуют во всех целях; требования ссылаются на них по номеру.</p>
<div class="sa-scroll"><table class="text-body-3"><thead><tr><th>№</th><th>Правило</th><th>Содержание</th></tr></thead><tbody>${rules}</tbody></table></div>

${S.goals.map(saGoalHtml).join('')}

<h2 class="text-header-2" id="sa-known">Что известно и чего мы не знаем</h2>
<p class="text-body-3">${saTxt(S.known.lead)}</p>
<dl class="sa-meta text-body-3">${S.known.facts.map(f => '<dt>' + saTxt(f[0]) + '</dt><dd>' + saTxt(f[1]) + '</dd>').join('')}</dl>
<p class="text-body-3">${saTxt(S.known.refs)}</p>
<p class="text-caption-2" style="margin-top:var(--size-8x)">Конец. Полные требования по целям — файлы Требования/Требования_Ц-N.md; страница и файлы собираются из одного источника (tools/build_requirements.py).</p>
</div>`;
}
