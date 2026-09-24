# -*- coding: utf-8 -*-
"""Собирает из одного источника (tools/sa_content_*.py) страницу «Постановка» и файлы Требования/*.md.

Запуск из корня flowmeet:  python tools/build_requirements.py
Выход:
  flowmeet-shared/sa-data.js         — данные для вкладки «Постановка» (window.SA)
  Требования/Требования_Ц-N.md       — требования по каждой цели

Править содержание нужно в tools/sa_content_*.py, а не в выходных файлах.
"""
import io, json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)

import sa_content_common as C
import sa_content_c1, sa_content_c2, sa_content_c3, sa_content_c4, sa_content_c5

GOALS = [m.GOAL for m in (sa_content_c1, sa_content_c2, sa_content_c3, sa_content_c4, sa_content_c5)]


def w(path, text):
    with io.open(path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(text)


def check():
    """Ссылки между кейсами, ФТ и приёмкой не должны висеть."""
    ft_all = {ft['id'] for g in GOALS for ft in g['fts']}
    ac_all = {a[0] for g in GOALS for a in g['ac']}
    problems = []
    for g in GOALS:
        ft_ids = [ft['id'] for ft in g['fts']]
        if len(ft_ids) != len(set(ft_ids)):
            problems.append('%s: повтор ФТ' % g['code'])
        used = set()
        for c in g['cases']:
            for r in c['fts']:
                used.add(r)
                if r not in ft_all:
                    problems.append('%s %s: нет %s' % (g['code'], c['id'], r))
        for ft in g['fts']:
            for a in ft['ac']:
                if a not in ac_all:
                    problems.append('%s %s: нет %s' % (g['code'], ft['id'], a))
        for a in g['ac']:
            for r in a[2]:
                if r not in ft_all:
                    problems.append('%s %s: нет %s' % (g['code'], a[0], r))
        for ft in g['fts']:
            if ft['id'] not in used and not any(ft['id'] in a[2] for a in g['ac']):
                problems.append('%s: %s не привязано ни к кейсу, ни к приёмке' % (g['code'], ft['id']))
    return problems


def esc_cell(s):
    return s.replace('|', '\\|').replace('\n', '<br>')


def md_goal(g):
    L = []
    a = L.append
    a('# FlowMeet: %s (%s)' % (g['title'], g['code']))
    a('')
    a('Стадия: %s' % g['stage'])
    a('')
    a('Роль цели: %s' % g['role'])
    a('')
    a('Ключ задачи PRD: [ТРЕБУЕТ УТОЧНЕНИЯ]')
    a('')
    a('О продукте: %s' % C.PRODUCT['lead'])
    a('')
    a('В примерах клиент — тестовое ООО «Норд», не живая компания.')
    a('')
    a('Файл собран из `tools/sa_content_*.py` скриптом `tools/build_requirements.py`; правки вносятся в источник, не сюда.')
    a('')
    a('---')
    a('')
    a('## Глоссарий')
    a('')
    a('Общий словарь постановки. Термины, которыми пользуется эта цель, — те же, что в остальных целях.')
    a('')
    a('| Термин | Определение |')
    a('|--------|-------------|')
    for t, d in C.TERMS:
        a('| %s | %s |' % (t, esc_cell(d)))
    a('')
    a('## Сквозные правила')
    a('')
    a('| № | Правило | Содержание |')
    a('|---|---------|------------|')
    for rid, name, text in C.RULES:
        a('| %s | %s | %s |' % (rid, name, esc_cell(text)))
    a('')
    a('---')
    a('')
    a('## Бизнес-ценность')
    a('')
    a(g['value'])
    a('')
    a('## Цели')
    a('')
    for x in g['goal']:
        a('- %s' % x)
    a('')
    a('**Мера:** %s' % g['measure'])
    a('')
    a('**Входит в контур:**')
    a('')
    for x in g['in']:
        a('- %s' % x)
    a('')
    a('**Не входит:**')
    a('')
    for x in g['out']:
        a('- %s' % x)
    a('')
    a('---')
    a('')
    a('## Проблемы')
    a('')
    a('**AS-IS (как сейчас):**')
    a('')
    a(g['asis'])
    a('')
    a('**Последствия:**')
    a('')
    a(g['consequences'])
    a('')
    a('**Масштаб:** %s' % g['scale'])
    a('')
    a('---')
    a('')
    a('## Акторы и ролевая модель')
    a('')
    a('| Актор | Описание | Права в рамках функции |')
    a('|-------|----------|------------------------|')
    for n, d, r in g['actors']:
        a('| %s | %s | %s |' % (esc_cell(n), esc_cell(d), esc_cell(r)))
    a('')
    a('---')
    a('')
    a('## Пользовательские кейсы')
    a('')
    for c in g['cases']:
        a('### %s. %s' % (c['id'], c['title']))
        a('')
        a('%s' % c['story'])
        a('')
        a('| | |')
        a('|--|--|')
        a('| **Актор** | %s |' % esc_cell(c['actor']))
        a('| **Ситуация** | %s |' % esc_cell(c['situation']))
        a('| **Проблема сейчас** | %s |' % esc_cell(c['problem']))
        a('| **Ожидаемый результат** | %s |' % esc_cell(c['result']))
        a('| **Требования** | %s |' % ', '.join(c['fts']))
        a('')
    a('---')
    a('')
    a('## Функциональные требования')
    a('')
    a('| № | Кто | Требование | Параметры | Проверка и ограничения | Приёмка |')
    a('|---|-----|------------|-----------|------------------------|---------|')
    for ft in g['fts']:
        a('| %s | %s | **%s.** %s | %s | %s | %s |' % (
            ft['id'], esc_cell(ft['who']), esc_cell(ft['name']), esc_cell(ft['text']),
            esc_cell(ft['params']), esc_cell(ft['check']), ', '.join(ft['ac'])))
    a('')
    a('---')
    a('')
    a('## Взаимодействие с пользователем (Use Cases)')
    a('')
    for c in g['cases']:
        a('| | |')
        a('|--|--|')
        a('| **Use case** | %s: %s |' % (c['id'], esc_cell(c['title'])))
        a('| **Акторы** | %s |' % esc_cell(c['actor']))
        a('| **Предусловия** | %s |' % esc_cell(c['situation']))
        a('| **Основной сценарий** | %s |' % '<br>'.join('%d. %s' % (i + 1, s) for i, s in enumerate(c['steps'])))
        for i, (n, t) in enumerate(c['alts']):
            a('| **Альт. сценарий %s** | **%s:** %s |' % ('ABCDEFGH'[i], esc_cell(n), esc_cell(t)))
        a('| **Постусловия** | %s |' % esc_cell(c['post']))
        a('')
    a('---')
    a('')
    a('## Corner-cases')
    a('')
    for x in g['corner']:
        a('- %s' % x)
    a('')
    a('---')
    a('')
    a('## Критерии приёмки')
    a('')
    for aid, text, refs in g['ac']:
        a('- **%s:** %s (%s)' % (aid, text, ', '.join(refs)))
    a('')
    a('---')
    a('')
    a('## Нефункциональные требования')
    a('')
    a('| Категория | Требование |')
    a('|-----------|------------|')
    for k, v in g['nfr']:
        a('| %s | %s |' % (k, esc_cell(v)))
    a('')
    a('---')
    a('')
    a('## Миграция')
    a('')
    a(g['migration'])
    a('')
    a('---')
    a('')
    a('## Аналитика и мониторинг')
    a('')
    a(g['analytics'])
    a('')
    a('---')
    a('')
    a('## Допущения')
    a('')
    a('| Допущение | Влияние на решение | Способ проверки |')
    a('|-----------|--------------------|-----------------|')
    for x, y, z in g['assumptions']:
        a('| %s | %s | %s |' % (esc_cell(x), esc_cell(y), esc_cell(z)))
    a('')
    a('---')
    a('')
    a('## Открытые вопросы')
    a('')
    a('| № | Вопрос / решение | Владелец | Статус |')
    a('|---|------------------|----------|--------|')
    for n, q, o, s in g['open']:
        a('| %s | %s | %s | %s |' % (n, esc_cell(q), esc_cell(o), esc_cell(s)))
    a('')
    a('---')
    a('')
    a('## Референсы')
    a('')
    for x in g['refs']:
        a('- %s' % x)
    a('')
    return '\n'.join(L)


def main():
    problems = check()
    if problems:
        print('ОШИБКИ ССЫЛОК:')
        for p in problems:
            print('  ', p)
        sys.exit(1)
    data = {
        'date': C.DATE,
        'product': C.PRODUCT,
        'known': C.KNOWN,
        'terms': C.TERMS,
        'rules': C.RULES,
        'goals': GOALS,
    }
    js = ('/* Собрано tools/build_requirements.py из tools/sa_content_*.py. Не править вручную. */\n'
          'window.SA = ' + json.dumps(data, ensure_ascii=False, indent=1) + ';\n')
    w(os.path.join(ROOT, 'flowmeet-shared', 'sa-data.js'), js)
    out_dir = os.path.join(ROOT, 'Требования')
    os.makedirs(out_dir, exist_ok=True)
    for g in GOALS:
        w(os.path.join(out_dir, 'Требования_%s.md' % g['code']), md_goal(g))
    print('готово: %d целей, %d кейсов, %d ФТ, %d приёмок' % (
        len(GOALS), sum(len(g['cases']) for g in GOALS),
        sum(len(g['fts']) for g in GOALS), sum(len(g['ac']) for g in GOALS)))


if __name__ == '__main__':
    main()
