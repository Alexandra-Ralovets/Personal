/* ─────────────────────────────────────────────────────────────────────────────
   Страница «Постановка». Содержание — в flowmeet-shared/sa-data.js (window.SA),
   который собирает tools/build_requirements.py из tools/sa_content_*.py; здесь
   только разметка. Правки текста вносятся в источник, а не сюда.
   ───────────────────────────────────────────────────────────────────────────── */
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
  <a href="#sa-product">О продукте</a><a href="#sa-terms">Термины</a><a href="#sa-rules">Сквозные правила</a>${toc}
</nav>
${saProductHtml(S.product, S.date)}

<h2 class="text-header-2" id="sa-terms">Термины</h2>
<div class="sa-scroll"><table class="text-body-3"><thead><tr><th>Термин</th><th>Определение</th></tr></thead><tbody>${terms}</tbody></table></div>

<h2 class="text-header-2" id="sa-rules">Сквозные правила</h2>
<p class="text-body-3">Действуют во всех целях; требования ссылаются на них по номеру.</p>
<div class="sa-scroll"><table class="text-body-3"><thead><tr><th>№</th><th>Правило</th><th>Содержание</th></tr></thead><tbody>${rules}</tbody></table></div>

${S.goals.map(saGoalHtml).join('')}

<p class="text-caption-2" style="margin-top:var(--size-8x)">Полные требования по каждой цели — файлы Требования/Требования_Ц-N.md.</p>
</div>`;
}
