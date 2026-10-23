"""Check generated routes, accessible SVG IDs and plotted geometry against source data."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import xml.etree.ElementTree as ET
import json, math, re

BASE = Path(__file__).resolve().parents[1]
DIST = BASE / 'dist'
class Page(HTMLParser):
    def __init__(self, source):
        super().__init__()
        self.ids=set(); self.links=[]; self.h1=0
        self.feed(source)
    def handle_starttag(self, tag, attrs):
        attrs=dict(attrs)
        if 'id' in attrs:
            assert attrs['id'] not in self.ids, f"Duplicate ID {attrs['id']}"
            self.ids.add(attrs['id'])
        if tag=='h1': self.h1+=1
        for attr in ['href','src']:
            if attr in attrs: self.links.append(attrs[attr])

pages={p.resolve():Page(p.read_text('utf-8')) for p in DIST.rglob('*.html')}
for path,page in pages.items():
    assert page.h1==1, (path,page.h1)
    for link in page.links:
        u=urlsplit(link)
        if u.scheme or u.netloc: continue
        target=(path.parent/unquote(u.path)).resolve() if u.path else path
        if target.is_dir(): target=target/'index.html'
        assert target.is_relative_to(DIST.resolve()), (path,link)
        assert target.exists(), (path,link)
        if u.fragment and target in pages:
            assert unquote(u.fragment) in pages[target].ids, (path,link,'missing anchor')

source=json.loads((BASE/'content/data-charts.json').read_text('utf-8-sig'))
NS={'s':'http://www.w3.org/2000/svg'}
marks_checked=0
def close(a,b):
    assert math.isclose(float(a),float(b),rel_tol=1e-9,abs_tol=1e-7), (a,b)
for lesson in source['lessons']:
    page=DIST/'learn'/f"{lesson['id']}.html"
    roots=[ET.fromstring(s) for s in re.findall(r'<svg\b.*?</svg>',page.read_text('utf-8'),re.S)]
    for chart in lesson['material']['charts']:
        variants=[r for r in roots if r.find('s:title',NS) is not None and r.find('s:title',NS).text==chart['title']]
        assert len(variants)==(1 if chart['type']=='pie' else 2)
        for svg in variants:
            assert svg.attrib['role']=='img'
            assert svg.find('s:desc',NS) is not None
            width,height=map(float,svg.attrib['viewBox'].split()[2:])
            left,top,bottom=58,50,height-57
            right=70 if chart['type']=='combo' else 30
            plots=[e for e in svg.iter() if 'data-value' in e.attrib]
            expected=sum(len(s['values']) for s in chart['series'])
            assert len(plots)==expected,(chart['id'],len(plots),expected)
            if chart['type']=='pie':
                vals=chart['series'][0]['values']
                assert [float(p.attrib['data-value']) for p in plots]==vals
                angle=-math.pi/2
                for sector,v in zip(plots,vals):
                    # Arc endpoint and large-arc flag must encode the stated proportion.
                    arc=re.search(r'A([\d.]+),([\d.]+) 0 ([01]),1 ([\d.eE+-]+),([\d.eE+-]+)',sector.attrib['d'])
                    assert arc
                    angle+=v/100*2*math.pi
                    close(arc[4],170+105*math.cos(angle));close(arc[5],143+105*math.sin(angle))
                    assert int(arc[3])==int(v>50)
                    marks_checked+=1
            else:
                bars=[e for e in plots if e.attrib.get('class')=='data-bar']
                points=[e for e in plots if e.attrib.get('class')=='data-point']
                for bar in bars:
                    v=float(bar.attrib['data-value'])
                    close(float(bar.attrib['height'])/(bottom-top),v/chart['max'])
                    assert 0<=float(bar.attrib['x'])<width
                    assert float(bar.attrib['y'])>=top-1e-7
                    marks_checked+=1
                if chart['type']=='stacked':
                    for i in range(len(chart['categories'])):
                        seg=bars[i*len(chart['series']):(i+1)*len(chart['series'])]
                        close(sum(float(x.attrib['height']) for x in seg),sum(s['values'][i] for s in chart['series'])/chart['max']*(bottom-top))
                        assert [float(x.attrib['data-value']) for x in seg]==[s['values'][i] for s in chart['series']]
                        cursor=bottom
                        for part in seg:
                            close(float(part.attrib['y'])+float(part.attrib['height']),cursor)
                            cursor=float(part.attrib['y'])
                            center=float(part.attrib['x'])+float(part.attrib['width'])/2
                            close(center,left+(width-left-right)*(i+.5)/len(chart['categories']))
                else:
                    expected_bars=[v for s in chart['series'] if chart['type'] in ['bar','combo'] and s.get('axis')!='right' for v in s['values']]
                    assert [float(x.attrib['data-value']) for x in bars]==expected_bars
                    bar_count=len([s for s in chart['series'] if s.get('axis')!='right'])
                    group_width=min((width-left-right)/len(chart['categories'])*.68,94)
                    for j,part in enumerate(bars):
                        series_index=j//len(chart['categories']);category_index=j%len(chart['categories'])
                        center=left+(width-left-right)*(category_index+.5)/len(chart['categories'])
                        expected_x=center-group_width/2+series_index*group_width/bar_count
                        close(part.attrib['x'],expected_x)
                        close(float(part.attrib['y'])+float(part.attrib['height']),bottom)
                line_series=[s for s in chart['series'] if chart['type']=='line' or (chart['type']=='combo' and s.get('axis')=='right')]
                pairs=[(s,v,i) for s in line_series for i,v in enumerate(s['values'])]
                assert len(points)==len(pairs)
                for point,(series,v,i) in zip(points,pairs):
                    px=float(point.attrib.get('cx',float(point.attrib.get('x',0))+4.5))
                    py=float(point.attrib.get('cy',float(point.attrib.get('y',0))+4.5))
                    close(point.attrib['data-value'],v)
                    close(px,left+(width-left-right)*(i+.5)/len(chart['categories']))
                    maximum=chart['rightMax'] if series.get('axis')=='right' else chart['max']
                    close((bottom-py)/(bottom-top),v/maximum)
                    marks_checked+=1
print(f'PASS: {len(pages)} HTML pages, internal routes/anchors and {marks_checked} chart marks checked against source values (desktop/mobile).')
