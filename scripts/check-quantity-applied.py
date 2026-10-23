"""Independently verify the nine visual-application questions and their options.

Uses exact fractions, area enumeration, piecewise positions and a job schedule.
No binary-float tolerances are needed. Failing assertions stop publication.
"""
from fractions import Fraction as F
from pathlib import Path
import json
import re
import subprocess
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
CONTENT = json.loads((ROOT / 'content/quantity-applied.json').read_text(encoding='utf-8'))
BASE = json.loads((ROOT / 'content/quantity.json').read_text(encoding='utf-8'))
EXAMPLES = {e['id']: e for lesson in CONTENT['lessons'] for e in lesson['examples']}
assert len(CONTENT['lessons']) == 3 and len(EXAMPLES) == 9
assert len(EXAMPLES) == sum(len(l['examples']) for l in CONTENT['lessons'])
source_ids = {s['id'] for s in BASE['sources']}
assert all(set(l['sourceIds']) <= source_ids for l in CONTENT['lessons'])
assert all(len(l['body']) >= 450 and len(l['examples']) == 3 for l in CONTENT['lessons'])
checks = []


def numeric_option(text):
    text = text.strip()
    if ':' in text:
        h, minute = map(int, text.split(':'))
        return F(60 * h + minute)
    if '又' in text:
        integer, fraction = text.split('又')
        return F(integer) + F(fraction)
    return F(text.removeprefix('约'))


def check(example_id, computed, expected_letter, evidence):
    example = EXAMPLES[example_id]
    raw_options = re.findall(r'([A-D])\.([^A-D\n]+)', example['question'])
    assert [label for label, _ in raw_options] == list('ABCD'), example_id
    options = [(label, numeric_option(text)) for label, text in raw_options]
    assert len({value for _, value in options}) == 4, (example_id, options)
    winners = [label for label, value in options if value == computed]
    assert winners == [expected_letter], (example_id, computed, options)
    assert example['answer'].startswith(expected_letter + '，'), (example_id, example['answer'])
    assert example['provenance'] == '原创教学例题'
    checks.append({'id': example_id, 'computed': str(computed), 'only_correct_option': expected_letter,
                   'evidence': evidence})


# Count the walkway as individual square-metre cells, independently of the
# subtract-inner-rectangle formula used in the written solution.
road_cells = sum(x < 2 or x >= 28 or y < 2 or y >= 18
                 for x in range(30) for y in range(20))
assert road_cells == 30 * 20 - 26 * 16 == 184
check('q-geometry-applied-e1', F(road_cells), 'B', 'Enumerated 600 one-square-metre cells; 184 belong to the inner road.')

# Recover the common altitude from the whole triangle, then compute the small
# triangle from its base and altitude, rather than merely repeating the ratio.
altitude = F(2 * 64, 16)
triangle_area = F(6) * altitude / 2
assert triangle_area + F(10) * altitude / 2 == 64
check('q-geometry-applied-e2', triangle_area, 'B', 'Common altitude is 8 m; areas are 24 and 40 square metres, total 64.')

# Verify both immersion branches. The displacement is 100*min(h,15), not an
# unconditional 100*15; only the first branch is self-consistent.
water_volume = 600 * 10
partial_h = F(water_volume, 600 - 100)
full_h = F(water_volume + 100 * 15, 600)
assert partial_h < 15 and full_h < 15  # the full-immersion result violates h>=15
assert 600 * partial_h - 100 * min(partial_h, F(15)) == water_volume
assert 100 * partial_h == 600 * (partial_h - 10) == 1200
check('q-geometry-applied-e3', partial_h, 'B', 'Partial branch h=12<15 is valid; full branch h=12.5<15 invalidates full immersion.')

# Time t is measured in hours after 8:00. Find all roots of the separation
# function in each actual movement stage, and reject roots outside the stage.
travel_roots = []
for lower, upper, a_speed, a_intercept in [
        (F(1, 2), F(1), F(40), F(0)),
        (F(1), F(5, 4), F(0), F(40)),
        (F(5, 4), F(3), F(40), F(-10))]:
    # a_speed*t+a_intercept == 60*t-30
    root = (-30 - a_intercept) / (a_speed - 60)
    if lower <= root <= upper:
        travel_roots.append(root)
assert travel_roots == [F(7, 6)]
assert 60 * (travel_roots[0] - F(1, 2)) == 40
check('q-travel-applied-e1', 480 + 60 * min(travel_roots), 'C', 'Only valid stage intersection is 7/6 h after 8:00 = 9:10.')


def reflected_position(distance, length=180):
    phase = distance % (2 * length)
    return phase if phase <= length else 2 * length - phase


# Split at every endpoint turn through hour 6, then solve the linear distance
# difference on each interval exactly. This rules out skipped earlier meetings.
meetings = set()
for left, right in zip([F(0), F(2), F(4)], [F(2), F(4), F(6)]):
    left_gap = reflected_position(90 * left) - reflected_position(180 - 30 * left)
    right_gap = reflected_position(90 * right) - reflected_position(180 - 30 * right)
    slope = (right_gap - left_gap) / (right - left)
    root = left - left_gap / slope
    if left <= root <= right:
        meetings.add(root)
# An endpoint can be a meeting even when another root lies in the same interval;
# linearity permits at most one unless the two trajectories coincide throughout.
assert sorted(meetings)[:2] == [F(3, 2), F(3)]
assert reflected_position(90 * 3) == reflected_position(180 - 30 * 3) == 90
check('q-travel-applied-e2', sorted(meetings)[1], 'D', 'All turns split exactly: first meeting 1.5 h; second 3 h, at 90 km from A.')

elapsed = F(60, 30) + F(30, 60) + F(90, 60)
assert elapsed == 4
check('q-travel-applied-e3', F(150) / elapsed, 'B', '150 km divided by 4 h including the 30-minute stop is 37.5 km/h.')

# Work calculation uses a unit total, independent of the lesson's 36-unit scale.
first_done = 4 * (F(1, 12) + F(1, 18))
new_b_rate = F(1, 18) * F(5, 4)
remaining_time = (1 - first_done) / new_b_rate
total_time = 4 + remaining_time
assert first_done + remaining_time * new_b_rate == 1
assert remaining_time == F(32, 5)
check('q-engineering-applied-e1', total_time, 'C', 'Unit-work calculation gives 4+32/5=52/5 days; exact total work checks to 1.')

stored_at_change = 30 + (20 - 8) * 2
next_flow = 20 * F(3, 4)
remaining_fill_time = (120 - stored_at_change) / next_flow
assert 0 < stored_at_change < 120
assert stored_at_change + next_flow * remaining_fill_time == 120
check('q-engineering-applied-e2', remaining_fill_time, 'B', '54 cubic metres at change; 66 remaining / 15 per hour = 22/5 hours.')

# Simulate all forty jobs with dependency and machine-capacity constraints.
# max(previous B finish, this A finish) handles waiting correctly.
b_finish = 0
schedule = []
for item in range(1, 41):
    a_start, a_finish = (item - 1) * 12, item * 12
    b_start = max(b_finish, a_finish)
    b_finish = b_start + 15
    schedule.append((item, a_start, a_finish, b_start, b_finish))
assert schedule[:3] == [(1, 0, 12, 12, 27), (2, 12, 24, 27, 42), (3, 24, 36, 42, 57)]
assert all(current[3] == previous[4] for previous, current in zip(schedule, schedule[1:]))
assert b_finish == 612 == 12 + 40 * 15
check('q-engineering-applied-e3', F(b_finish, 60), 'B', 'All 40 jobs scheduled without overlap or dependency violations; earliest last finish 612 min.')

assert {item['id'] for item in checks} == set(EXAMPLES), 'An added example was not checked.'

# Verify SVG availability, XML validity and accessible descriptions for all nine
# new exercises plus the three existing geometry exercises repaired in this pass.
diagram_ids = list(EXAMPLES) + ['q-geometry-e1', 'q-geometry-e2', 'q-geometry-e3']
node_code = "import {quantityAppliedDiagramFor as d} from './scripts/quantity-diagrams.mjs';" \
    + f"console.log(JSON.stringify({json.dumps(diagram_ids)}.map(id=>[id,d(id)])));"
node_result = subprocess.run(['node', '--input-type=module', '-e', node_code], cwd=ROOT,
                             text=True, encoding='utf-8', capture_output=True, check=True)
for diagram_id, html in json.loads(node_result.stdout):
    match = re.search(r'<svg\b.*?</svg>', html, re.S)
    assert match, diagram_id
    svg = ET.fromstring(match.group())
    ns = {'s': 'http://www.w3.org/2000/svg'}
    assert svg.attrib['role'] == 'img'
    title, desc = svg.find('s:title', ns), svg.find('s:desc', ns)
    assert title is not None and title.text
    assert desc is not None and len(desc.text) > 25
    assert svg.attrib['aria-labelledby'] == f'{diagram_id}-figure-title {diagram_id}-figure-desc'
    assert 'overflow-x:auto' in html and 'tabindex="0"' in html
    assert len({el.attrib['id'] for el in svg.iter() if 'id' in el.attrib}) == 3

print(json.dumps({'status': 'PASS', 'lessons': 3, 'numerical_examples_checked': len(checks),
                  'unique_answers_checked': len(checks), 'accessible_svgs_checked': len(diagram_ids),
                  'checks': checks}, ensure_ascii=False, indent=2))
