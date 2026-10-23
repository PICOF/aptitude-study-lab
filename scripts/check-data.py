"""Independent arithmetic/structure audit. Does not import the content generator."""
from pathlib import Path
from fractions import Fraction as F
import json, math, re, hashlib

BASE=Path(__file__).resolve().parents[1]
HERE=Path(__file__).resolve().parent
d=json.loads((BASE/'content/data.json').read_text(encoding='utf8'))
results={}
def check(id,actual,expected):
 assert actual==expected, (id,actual,expected)
 results[id]=str(actual)

check('d-locate-e1',F(360,1380),F(6,23))
check('d-locate-e2',[(480-400),(1120-1000),F(80,400),F(120,1000)],[80,120,F(1,5),F(3,25)])
check('d-scope-e1',F((720-590)-100,100),F(3,10))
check('d-scope-e2',[F(30-25,100),F(30-25,25),F(360000000,12000)],[F(1,20),F(1,5),30000])
check('d-division-e1',min([31,42,53,64],key=lambda x:abs(F(2998,7126)*100-x)),42)
assert F(4152,10000)<F(2998,7126)<F(4226,10000)
check('d-division-e2',F(4872,11860)<F(411,1000),True)
assert F(11860)*F(411,1000)==F(487446,100)
check('d-fractions-e1',900-F(900)/F(9,8),100)
check('d-fractions-e2',F(700)/F(7,8)-700,100)
check('d-growth-e1',[F(1260)/F(105,100),1260-F(1260)/F(105,100)],[1200,60])
check('d-growth-e2',F(1000-800,800),F(1,4))
check('d-growth-e3',[F(550)/F(11,10),F(10+5,100)],[500,F(3,20)])
check('d-interval-e1',F(12,10)*F(9,10)-1,F(2,25))
check('d-interval-e2',[F(11,10)**4,F(14641-10000,100)/4],[F(14641,10000),F(4641,400)])
check('d-share-e1',(F(120)/F(12,10))/(F(500)/F(125,100)),F(1,4))
check('d-share-e2',F(200-(120+80-50),200),F(1,4))
check('d-share-change-e1',F(264,660)-(F(264)/F(12,10))/(F(660)/F(11,10)),F(1,30))
check('d-share-change-e2',[F(45,60)-F(90,100),abs((F(45,90)-1)-(F(60,100)-1))],[F(-3,20),F(1,10)])
check('d-share-change-e3',F(12,10)/F(11,10)-1,F(1,11))
check('d-average-e1',F(12,10)/F(105,100)-1,F(1,7))
check('d-average-e2',F(792,24)-F(600,20),3)
check('d-average-e3',F(10*5000+30*7000,10+30),6500)
check('d-multiples-e1',[F(200,80),F(200-80,80)],[F(5,2),F(3,2)])
check('d-multiples-e2',(F(720)/F(12,10))/(F(330)/F(11,10)),2)
check('d-mixed-e1',[x for x in [14,10,8,5] if x<8],[5])
check('d-mixed-e2',F(240)/(F(120)/F(12,10)+120)-1,F(1,11))
check('d-mixed-e3',F(11-5,20-11),F(2,3))
current=[1080,1320,990,1600]
rates=[F(1,5),F(1,10),F(-1,10),F(1,4)]
bases=[F(a)/(1+r) for a,r in zip(current,rates)]
deltas=[a-b for a,b in zip(current,bases)]
check('d-comparison-e1',[bases,deltas,bases.index(max(bases)),deltas.index(max(deltas))],[[900,1200,1100,1280],[180,120,-110,320],3,3])
check('d-comparison-e2',[F(600)*F(1)/(1+F(1)),F(4000)*F(1,10)/(1+F(1,10))],[300,F(4000,11)])
check('d-special-e1',[F(30,30-10),F(30,1000)],[F(3,2),F(3,100)])
check('d-special-e2',F(11,10)*F(95,100)-1,F(9,200))
check('d-comprehensive-e1',[F(66,60)-1==F(15,100),F(360,1380)<F(300,1200),F(264,88)==F(240,80),1760-1600==1600],[False,False,True,False])
overall=F(sum(current),sum(bases))-1
check('d-comprehensive-e2',[sum(current)==4990,bases[2]==1100,deltas[0]>deltas[1],overall==sum(rates)/4],[True,True,True,False])
check('d-comprehensive-e3',[x for x in [-4,5,12,23] if 6<x<18],[12])

lessonids=[x['id'] for x in d['lessons']]
exampleids=[e['id'] for l in d['lessons'] for e in l['examples']]
assert len(set(lessonids))==len(lessonids)==14
assert len(set(exampleids))==len(exampleids)==33
assert set(exampleids)==set(results), (set(exampleids)-set(results),set(results)-set(exampleids))
sourceids={s['id'] for s in d['sources']}
hanzi={}
for l in d['lessons']:
 assert 2<=len(l['examples'])<=3
 assert l['level'] in ['入门','进阶']
 assert l['sourceIds'] and set(l['sourceIds'])<=sourceids
 assert len(l['body'])>=500
 assert not re.search(r'^# ',l['body'],re.M)
 hanzi[l['id']]=len(re.findall(r'[\u4e00-\u9fff]',l['body']))
 assert hanzi[l['id']]>=500, (l['id'],hanzi[l['id']])
 for e in l['examples']:
  assert all(e[k] for k in ['id','title','question','answer','steps','pitfall','provenance'])
  assert len(e['steps'])>=3
  assert e['provenance']=='原创教学例题'
  assert '\ufffd' not in json.dumps(e,ensure_ascii=False)
print('PASS: 33 data-analysis examples independently checked with exact fractions.')
