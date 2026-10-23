from pathlib import Path
from fractions import Fraction as F
from itertools import combinations, permutations, product
from math import comb, factorial
from math import ceil, lcm
import json,re

root=Path(__file__).resolve().parents[1]
data=json.loads((root/'content/quantity.json').read_text(encoding='utf8'))
checks={}
def check(id,result,expected):
    assert result==expected, (id,result,expected)
    checks[id]={'computed':str(result),'expected':str(expected),'pass':True}

check('q-read-e1',[x for x in range(61) if 20*x+10*(60-x)==840],[24])
check('q-read-e2',F(360,90),4)
check('q-substitute-e1',[x for x in [13,14,15,16] if x*(x-1)*(x-2)==2730],[15])
check('q-substitute-e2',[a for a in [8,10,12,14] if 139-7*a>0 and (139-7*a)%11==0],[12])
check('q-properties-e1',[n for n in range(81,100) if n*3%8==0 and n*5%12==0],[96])
check('q-properties-e2',[d for d in [12,15,18,20] if (51+d)%2==0 and (51-d)>0],[15])
check('q-properties-e3',pow(7,2026,10),9)
check('q-assign-e1',F(3)*F(120,100)/(F(5)*F(110,100)),F(36,55))
check('q-assign-e2',F(2)/(F(1,30)+F(1,60)),40)
check('q-engineering-e1',(1-3*(F(1,12)+F(1,18)))/F(1,18),F(21,2))
check('q-engineering-e2',1/((F(1,9)+F(1,12)+F(1,18))/2),8)
rates=[F(1,8),F(1,12)]
t=F(0); done=F(0); day=0
while done<1:
    rate=rates[day%2]
    dt=min(F(1),(1-done)/rate)
    done+=dt*rate;t+=dt;day+=1
check('q-engineering-cycle-e1',(t,day,'甲乙'[(day-1)%2]),(F(19,2),10,'乙'))
check('q-engineering-cycle-e2',1/(F(1,6)-F(1,10)),15)
check('q-travel-e1',(F(210,60+45),F(210,60+45)*60),(2,120))
check('q-travel-e2',4*F(1,2)/(6-4),1)
check('q-river-circle-e1',((F(30,2)+F(30,3))/2,(F(30,2)-F(30,3))/2),(F(25,2),F(5,2)))
check('q-river-circle-e2',(F(400,5-3),F(400,5+3)),(200,50))
check('q-profit-e1',(160*F(3,2)*F(4,5)-160)/160,F(1,5))
cost=F(120)/F(6,5)+F(120)/F(4,5)
check('q-profit-e2',(240-cost)/cost,F(-1,25))
check('q-concentration-e1',[x for x in range(401) if x*F(1,5)+(400-x)*F(2,5)==400*F(35,100)],[100])
check('q-concentration-e2',F(1,5)*F(3,4)**2,F(9,80))
check('q-concentration-e3',200-(200*F(15,100))/F(20,100),50)
both=62+55-(100-8)
check('q-set-e1',(both,62-both),(25,37))
only2=15+12+10-3*5
union=40+35+30-15-12-10+5
check('q-set-e2',(only2,80-union),(22,7))
check('q-combination-e1',(len(list(combinations(range(6),3))),len(list(permutations(range(6),2)))),(20,30))
check('q-combination-e2',sum(abs(p.index(0)-p.index(1))>1 for p in permutations(range(5))),72)
check('q-combination-e3',sum(a+b+c==7 for a,b,c in product(range(1,8),repeat=3)),15)
pair=list(combinations(range(5),2))
check('q-probability-e1',F(sum((a<3)==(b<3) for a,b in pair),len(pair)),F(2,5))
check('q-probability-e2',1-F(4,5)**4,F(5904,10000))
states=list(product(range(5),range(6),range(7)))
check('q-pigeonhole-e1',1+max(sum(s) for s in states if max(s)<3),7)
check('q-pigeonhole-e2',1+max(sum(s) for s in states if s[0]<2),13)
check('q-pigeonhole-e3',-(-37//12),4)
check('q-cycle-age-e1','ABCDE'[(47-1)%5],'B')
check('q-cycle-age-e2',[x for x in range(101,130) if x%5==2 and x%7==2],[107])
check('q-cycle-age-e3',[t for t in range(101) if 36+t==3*(8+t)],[6])
alloc=[t for t in combinations(range(1,36),5) if sum(t)==35]
check('q-extremes-e1',(min(t[-1] for t in alloc),max(t[-1] for t in alloc)),(9,25))
check('q-extremes-e2',(F(20**2,4),max(x*(20-x) for x in range(1,20) if x!=10)),(100,99))
check('q-fast-e1',(999*37,49*51),(36963,2499))
check('q-fast-e2',(1198+403//2)//403,3)
check('q-fast-e3',32*125*25,100000)
check('q-strategy-e1',[x for x in [112,120,126,132] if x*3%7==0 and x%4==0],[112])
check('q-strategy-e2',[x for x in [F(6),F(96,10),F(125,10),F(15)] if 8<x<12],[F(48,5)])
check('q-strategy-e3',(F(1,4)-F(3,4)*F(1,3),F(1,3)-F(2,3)*F(1,3)),(0,F(1,9)))

# New topics: verify arithmetic and all stated structural assumptions, not the
# uniqueness of an arbitrary finite sequence continuation.
seq=[4,9,17,28,42]
diff=[b-a for a,b in zip(seq,seq[1:])]
assert diff==[5,8,11,14] and {b-a for a,b in zip(diff,diff[1:])}=={3}
check('q-sequence-e1',seq[-1]+diff[-1]+3,59)
assert [3*3**i for i in range(4)]==[3,9,27,81]
assert [n**3+1 for n in range(1,5)]==[2,9,28,65]
check('q-sequence-e2',(3*3**4,5**3+1),(243,126))
fib=[2,3]
for _ in range(4):fib.append(sum(fib[-2:]))
alternate=[2,10,5,20,8,40]
assert alternate[::2]==[2,5,8] and alternate[1::2]==[10,20,40]
check('q-sequence-e3',(fib[-1],alternate[4]+3),(21,11))
check('q-geometry-e1',18*F(5,3)**2,50)
# Compare exact coefficients of pi.
check('q-geometry-e2',(2**2*10,4**2*10,4**2*20),(40,160,320))
check('q-geometry-e3',12+F(1200,30*20),14)
check('q-spacing-e1',(len(range(0,101,5)),len(range(5,100,5)),len(range(0,100,5))),(21,19,20))
old=set(range(0,121,6)); new=set(range(0,121,10))
check('q-spacing-e2',(len(old&new),len(old-new),len(new-old)),(5,16,8))
grid=list(product(range(9),repeat=2))
check('q-spacing-e3',(len(grid),sum(min(x,y,8-x,8-y)==0 for x,y in grid),sum(min(x,y,8-x,8-y)<2 for x,y in grid)),(81,32,56))
growth=F(10*20-15*10,20-10)
initial=(10-growth)*20
assert growth==5 and initial==100 and initial==(15-growth)*10
check('q-dynamic-e1',initial/(25-growth),5)
arrival=F(6*30-9*12,30-12)
backlog=(6-arrival)*30
assert arrival==4 and backlog==60 and backlog==(9-arrival)*12
check('q-dynamic-e2',next(n for n in range(1,20) if 3*n>arrival and backlog/(3*n-arrival)<=5),6)
check('q-diophantine-e1',[(x,y) for x,y in product(range(1,15),range(1,9)) if 8*x+13*y==111],[(9,3)])
solutions=[(x,y) for x,y in product(range(20),range(13)) if 7*x+11*y==133]
assert sorted(solutions)==[(8,7),(19,0)]
check('q-diophantine-e2',min((x+y,x,y) for x,y in solutions),(15,8,7))
check('q-diophantine-e3',next(n for n in range(101,1000) if n%5==1 and n%7==3),101)
def water_fee(q):
    return min(q,10)*3+max(0,min(q,20)-10)*5+max(0,q-20)*8
check('q-piecewise-e1',(water_fee(26),[q for q in range(101) if water_fee(q)==104]),(128,[23]))
def shipping(q):
    return 12+4*ceil(max(F(0),q-3))
check('q-piecewise-e2',(shipping(F(52,10)),shipping(F(5)),shipping(F(501,100)),shipping(F(6)),shipping(F(601,100))),(24,20,24,24,28))
check('q-piecewise-e3',[(n,4*n+14) for n in range(1,101) if 4*n+14==6*n-10],[(12,62)])

ids=[]
sourceids={s['id'] for s in data['sources']}
assert len(data['lessons'])==24
for lesson in data['lessons']:
    ids.append(lesson['id'])
    assert len(re.findall(r'[\u4e00-\u9fff]',lesson['body']))>=500
    assert 2<=len(lesson['examples'])<=3
    assert set(lesson['sourceIds'])<=sourceids
    assert not re.search(r'^#\s',lesson['body'],re.M)
    for example in lesson['examples']:
        ids.append(example['id'])
        assert example['id'] in checks
        assert len(example['steps'])>=3
        assert example['provenance']=='原创教学例题'
assert len(ids)==len(set(ids))
assert len(checks)==sum(len(l['examples']) for l in data['lessons'])==60
assert len(sourceids)==25
assert all(l['level'] in ['进阶','选学'] for l in data['lessons'][18:])
report={'lessons':24,'examples':60,'sources':25,'numeric_and_enumeration_checks':checks,'status':'PASS'}

print('PASS: 24 lessons, 60 original examples independently checked, 25 source records, every body >=500 Chinese characters.')
