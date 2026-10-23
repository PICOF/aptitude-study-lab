"""Independent exact-arithmetic audit for the five chart-based data lessons.

Reads the same raw chart data that the page renderer consumes.  Each exercise
has an independent calculation or explicit truth table; answer letters and all
four printed options are checked against those results.  No SVG coordinates,
answer prose, or generator calculations are used to derive the right answer.
"""
from pathlib import Path
from fractions import Fraction as F
import json
import re

BASE = Path(__file__).resolve().parents[1]
doc = json.loads((BASE / 'content/data-charts.json').read_text(encoding='utf-8'))
lessons = {x['id']: x for x in doc['lessons']}
examples = {e['id']: e for l in doc['lessons'] for e in l['examples']}
checks = 0
verified = set()


def check(condition, message):
    global checks
    checks += 1
    if not condition:
        raise AssertionError(message)


def equal(actual, expected, message):
    check(actual == expected, f'{message}: got {actual!r}; expected {expected!r}')


def options(eid):
    found = re.findall(r'^([A-D])\. (.+)$', examples[eid]['question'], re.M)
    equal([x[0] for x in found], list('ABCD'), f'{eid}: four printed options')
    check(len(set(x[1] for x in found)) == 4, f'{eid}: distinct options')
    return [x[1] for x in found]


def answer(eid, truths):
    equal(len(truths), 4, f'{eid}: truth table length')
    equal(sum(bool(x) for x in truths), 1, f'{eid}: exactly one correct option')
    label = 'ABCD'[truths.index(True)]
    check(examples[eid]['answer'].startswith(label + '，'), f'{eid}: answer letter {label}')
    verified.add(eid)


def numeric(eid, value, expected_options):
    printed = options(eid)
    numbers = [F(x.rstrip('%')) for x in printed]
    equal(numbers, [F(str(x)) for x in expected_options], f'{eid}: numeric option text')
    distances = [abs(n - value) for n in numbers]
    closest = min(distances)
    answer(eid, [d == closest for d in distances])
    return numbers


def semantic(eid, expected_options, truths):
    equal(options(eid), expected_options, f'{eid}: semantic option text')
    answer(eid, truths)


def values(lid, series=0, chart=0):
    return [F(str(x)) for x in lessons[lid]['material']['charts'][chart]['series'][series]['values']]


def percent(current, base):
    check(base > 0, 'growth base must be positive')
    return (current / base - 1) * 100


def differences(cumulative):
    return [cumulative[0]] + [b - a for a, b in zip(cumulative, cumulative[1:])]


expected_types = {
    'd-chart-bar': ['bar'], 'd-chart-line': ['line'],
    'd-chart-pie': ['pie', 'pie'], 'd-chart-stacked': ['stacked'],
    'd-chart-combo': ['combo'],
}
equal(set(lessons), set(expected_types), 'lesson IDs')
equal(len(doc['lessons']), 5, 'five chart lessons')
equal(len(examples), 15, '15 unique examples')
known_sources = {x['id'] for x in doc['sources']}
known_sources.update(x['id'] for x in json.loads((BASE / 'content/data.json').read_text(encoding='utf-8'))['sources'])
equal(len(doc['sources']), len({s['id'] for s in doc['sources']}), 'unique new sources')
chart_ids = set()
for lesson in doc['lessons']:
    lid = lesson['id']
    equal(len(lesson['examples']), 3, f'{lid}: three examples')
    check(len(re.findall(r'[\u4e00-\u9fff]', lesson['body'])) >= 500, f'{lid}: substantial method explanation')
    check(set(lesson['sourceIds']) <= known_sources, f'{lid}: resolved source IDs')
    material = lesson['material']
    for key in ['id', 'title', 'intro', 'notes', 'readGuide']:
        check(bool(material[key]), f'{lid}: material {key}')
    equal([c['type'] for c in material['charts']], expected_types[lid], f'{lid}: chart types')
    for chart in material['charts']:
        check(chart['id'] not in chart_ids, 'unique chart id')
        chart_ids.add(chart['id'])
        count = len(chart['categories'])
        check(count >= 3, f'{chart["id"]}: at least 3 categories')
        equal(len(set(chart['categories'])), count, 'unique chart categories')
        for series in chart['series']:
            equal(len(series['values']), count, 'series and category lengths')
            check(all(isinstance(v, (int, float)) and v >= 0 for v in series['values']), 'nonnegative numeric chart values')
        if chart['type'] == 'pie':
            equal(len(chart['series']), 1, 'pie has one percentage series')
            equal(sum(F(str(x)) for x in chart['series'][0]['values']), 100, 'pie totals 100%')
            equal(chart['unit'], '%', 'pie unit')
            check(re.search(r'总量\d+万件', chart['title']) is not None, 'pie total explicitly labelled')
        else:
            check(chart['max'] > 0 and chart['tick'] > 0, 'positive left-axis range/tick')
            equal(F(chart['max']) % F(chart['tick']), 0, 'left ticks divide range')
            if chart['type'] == 'stacked':
                check(max(sum(s['values'][i] for s in chart['series']) for i in range(count)) <= chart['max'], 'stacked totals fit axis')
            else:
                for series in chart['series']:
                    if series.get('axis') != 'right':
                        check(max(series['values']) <= chart['max'], 'left series fits axis')
            if chart['type'] == 'combo':
                equal([s.get('axis') for s in chart['series']], ['left', 'right'], 'combo explicit axis assignment')
                equal(chart['rightUnit'], '%', 'combo right unit')
                equal(F(chart['rightMax']) % F(chart['rightTick']), 0, 'right ticks divide range')
                check(max(chart['series'][1]['values']) <= chart['rightMax'], 'right series fits axis')
    for e in lesson['examples']:
        for key in ['id', 'title', 'question', 'answer', 'steps', 'pitfall', 'provenance']:
            check(bool(e[key]), f'{e["id"]}: {key}')
        equal(e['provenance'], '原创教学例题', 'original provenance')
        check(len(e['steps']) >= 5, 'worked reading/calculation/options/precision steps')
        check('读图定位' in e['steps'][0], 'explicit data location')
        check('精度' in e['steps'][-1], 'explicit precision instruction')
        check('根据上图' in e['question'], 'question depends on shared graphical material')
        check('\ufffd' not in json.dumps(e, ensure_ascii=False), 'no encoding corruption')

# 15. Grouped bars: differences and rates are different rankings.
bar0 = values('d-chart-bar', 0)
bar1 = values('d-chart-bar', 1)
equal(bar0, [240, 360, 180, 120], 'bar base labels')
equal(bar1, [300, 396, 234, 150], 'bar current labels')
categories = lessons['d-chart-bar']['material']['charts'][0]['categories']
equal(categories, ['东区', '西区', '南区', '北区'], 'bar category binding')
delta = [a - b for a, b in zip(bar1, bar0)]
rates = [percent(a, b) for a, b in zip(bar1, bar0)]
equal(delta, [60, 36, 54, 30], 'bar growth amounts')
equal(rates, [25, 10, 30, 25], 'bar growth rates')
winner = (categories[delta.index(max(delta))], categories[rates.index(max(rates))])
pair_options = options('d-chart-bar-e1')
equal(pair_options, ['东区、南区', '西区、南区', '南区、东区', '东区、东区'], 'bar pair options')
answer('d-chart-bar-e1', [tuple(x.split('、')) == winner for x in pair_options])
overall = percent(sum(bar1), sum(bar0))
equal(overall, 20, 'bar overall rate')
numeric('d-chart-bar-e2', overall, ['16.7', 20, '22.5', 25])
equal(sum(rates) / 4, F(45, 2), 'bar arithmetic-mean distractor')
share_diff = (bar1[0] / sum(bar1) - bar0[0] / sum(bar0)) * 100
equal(share_diff, F(10, 9), 'bar share change in percentage points')
numeric('d-chart-bar-e3', share_diff, ['1.1', '4.2', 5, 25])
equal(percent(bar1[0] / sum(bar1), bar0[0] / sum(bar0)), F(25, 6), 'bar share-relative-growth distractor')

# 16. Lines: recover actual months before asking for year-on-year/month-on-month.
line0 = values('d-chart-line', 0)
line1 = values('d-chart-line', 1)
equal(line0, [80, 180, 300, 440, 600, 780], 'line prior cumulative labels')
equal(line1, [90, 210, 360, 520, 700, 900], 'line current cumulative labels')
monthly0, monthly1 = differences(line0), differences(line1)
equal(monthly0, [80, 100, 120, 140, 160, 180], 'prior monthly values')
equal(monthly1, [90, 120, 150, 160, 180, 200], 'current monthly values')
jun_yoy = percent(monthly1[5], monthly0[5])
equal(jun_yoy, F(100, 9), 'June monthly year-on-year')
numeric('d-chart-line-e1', jun_yoy, ['15.4', '11.1', 20, 25])
mom = [percent(monthly1[i], monthly1[i - 1]) for i in range(2, 6)]
equal(mom, [25, F(20, 3), F(25, 2), F(100, 9)], 'March-June month-on-month')
semantic('d-chart-line-e2', ['3月', '4月', '5月', '6月'], [r == max(mom) for r in mom])
q1_rate = percent(line1[2], line0[2])
q2_rate = percent(line1[5] - line1[2], line0[5] - line0[2])
yoy = [percent(a, b) for a, b in zip(monthly1, monthly0)]
equal([q1_rate, q2_rate], [20, F(25, 2)], 'two quarterly growth rates')
semantic('d-chart-line-e3', [
    '2025年上半年累计销售额同比增长20%',
    '2025年第二季度销售额同比增幅低于第一季度',
    '2025年6月当月销售额环比增幅高于3月',
    '2025年各月当月销售额同比增幅持续提高',
], [percent(line1[-1], line0[-1]) == 20, q2_rate < q1_rate,
    mom[-1] > mom[0], all(b > a for a, b in zip(yoy, yoy[1:]))])

# 17. Pies: total is read from each displayed chart title, never from circle size.
pie_charts = lessons['d-chart-pie']['material']['charts']
totals = [F(re.search(r'总量(\d+)万件', c['title']).group(1)) for c in pie_charts]
equal(totals, [800, 1000], 'displayed pie totals')
shares0, shares1 = values('d-chart-pie', chart=0), values('d-chart-pie', chart=1)
equal(shares0, [40, 30, 20, 10], 'pie prior shares')
equal(shares1, [36, 32, 24, 8], 'pie current shares')
pie0 = [totals[0] * p / 100 for p in shares0]
pie1 = [totals[1] * p / 100 for p in shares1]
equal(pie0, [320, 240, 160, 80], 'pie prior absolute amounts')
equal(pie1, [360, 320, 240, 80], 'pie current absolute amounts')
pie_rates = [percent(a, b) for a, b in zip(pie1, pie0)]
# Printed direction words carry signs, unlike the other purely numeric lists.
semantic('d-chart-pie-e1', ['下降10%', '下降4%', '增长12.5%', '增长25%'],
         [pie_rates[0] == x for x in [F(-10), F(-4), F(25, 2), F(25)]])
contribution = ((pie1[1] + pie1[2]) - (pie0[1] + pie0[2])) / (totals[1] - totals[0]) * 100
equal(contribution, 80, 'two pie categories growth contribution')
numeric('d-chart-pie-e2', contribution, [16, 56, 40, 80])
equal(percent(pie1[1] + pie1[2], pie0[1] + pie0[2]), 40, 'own-growth distractor')
semantic('d-chart-pie-e3', [
    '2025年其他业务量同比减少20%',
    '2025年国内快件业务量同比约增长33.3%',
    '2025年国际件对企业总业务量增长的贡献率为24%',
    '四类业务同比增速的算术平均，等于企业总业务量增速25%',
], [pie_rates[3] == -20, abs(pie_rates[1] - F(333, 10)) < F(1, 20),
    (pie1[2] - pie0[2]) / (totals[1] - totals[0]) * 100 == 24,
    sum(pie_rates) / 4 == percent(totals[1], totals[0]) == 25])
equal(sum(pie_rates) / 4, F(575, 24), 'pie arithmetic-mean trap')

# 18. Stacked bars: each segment is its own value, not its upper boundary.
stack = [values('d-chart-stacked', i) for i in range(3)]
equal(stack, [[180, 210, 240, 240], [90, 120, 180, 210], [30, 70, 80, 150]], 'stack segment values')
quarter_totals = [sum(row[i] for row in stack) for i in range(4)]
online = [stack[1][i] + stack[2][i] for i in range(4)]
equal(quarter_totals, [300, 400, 500, 600], 'stack total amounts')
equal(online, [120, 190, 260, 360], 'stack online amounts')
online_rate = percent(online[2], online[1])
equal(online_rate, F(700, 19), 'stack online growth')
numeric('d-chart-stacked-e1', online_rate, [25, '26.9', '36.8', 50])
equal(percent(quarter_totals[2], quarter_totals[1]), 25, 'stack total-growth distractor')
equal(percent(stack[1][2], stack[1][1]), 50, 'stack self-operated-only distractor')
online_share_change = (online[3] / quarter_totals[3] - online[0] / quarter_totals[0]) * 100
equal(online_share_change, 20, 'stack share change')
numeric('d-chart-stacked-e2', online_share_change, [15, 20, 50, 60])
equal((stack[2][3] / quarter_totals[3] - stack[2][0] / quarter_totals[0]) * 100, 15, 'platform-only share distractor')
channel_deltas = [row[3] - row[2] for row in stack]
equal(channel_deltas, [0, 30, 70], 'stack channel growth amounts')
contributions = [d / (quarter_totals[3] - quarter_totals[2]) * 100 for d in channel_deltas]
equal(contributions, [0, 30, 70], 'stack channel contributions')
semantic('d-chart-stacked-e3', ['线上自营，30%', '第三方平台，25%', '第三方平台，70%', '线下门店，40%'], [
    channel_deltas[1] == max(channel_deltas) and contributions[1] == 30,
    channel_deltas[2] == max(channel_deltas) and contributions[2] == 25,
    channel_deltas[2] == max(channel_deltas) and contributions[2] == 70,
    channel_deltas[0] == max(channel_deltas) and contributions[0] == 40,
])

# 19. Combo: percentage series is on the right axis; reconstruct six bases.
combo_current = values('d-chart-combo', 0)
combo_rates = values('d-chart-combo', 1)
equal(combo_current, [110, 240, 315, 480, 550, 660], 'combo bar labels')
equal(combo_rates, [10, 20, 5, 20, 10, 10], 'combo right-axis percentage labels')
combo_base = [a / (1 + r / 100) for a, r in zip(combo_current, combo_rates)]
combo_delta = [a - b for a, b in zip(combo_current, combo_base)]
equal(combo_base, [100, 200, 300, 400, 500, 600], 'combo recovered bases')
equal(combo_delta, [10, 40, 15, 80, 50, 60], 'combo recovered growth amounts')
numeric('d-chart-combo-e1', combo_base[3], [384, 400, 460, 500])
semantic('d-chart-combo-e2', ['2月', '4月', '5月', '6月'],
         [combo_delta[i] == max(combo_delta) for i in [1, 3, 4, 5]])
equal([sum(combo_current), sum(combo_base), sum(combo_delta)], [2355, 2100, 255], 'combo half-year totals')
half_year_growth = percent(sum(combo_current), sum(combo_base))
equal(half_year_growth, F(85, 7), 'combo exact half-year percentage')
numeric('d-chart-combo-e3', half_year_growth, ['12.1', '12.5', '10.8', 20])
equal(sum(combo_rates) / len(combo_rates), F(25, 2), 'combo arithmetic-mean distractor')
check(F(121, 10) - F(1, 20) <= half_year_growth < F(121, 10) + F(1, 20), 'combo answer rounding to one decimal')

equal(verified, set(examples), 'every exercise independently checked')
print(f'PASS: {len(lessons)} chart lessons, {len(chart_ids)} charts, {len(verified)} four-option exercises; {checks} exact arithmetic / structure / option checks.')
