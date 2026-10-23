// Data-bound, pre-rendered SVG. No network or client-side chart runtime is needed.
const esc = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const colors = ['#286da8', '#a85a28', '#2d7c72', '#7762a2', '#7b6b3c'];
const kinds = {bar:'分组柱状图', line:'折线图', pie:'饼图', stacked:'堆积柱状图', combo:'柱线混合图'};
const fmt = n => Number.isInteger(n) ? String(n) : String(Number(n.toFixed(2)));
const text = (x,y,value,attrs='') => `<text x="${x}" y="${y}" ${attrs}>${esc(value)}</text>`;
const line = (x1,y1,x2,y2,attrs='') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${attrs}/>`;

function pieGeometry(c) {
  const W=340,H=300,cx=170,cy=143,r=105;
  let angle=-Math.PI/2;
  let marks='';
  c.series[0].values.forEach((value,i) => {
    const start=angle, end=angle+value/100*Math.PI*2;
    const x1=cx+r*Math.cos(start),y1=cy+r*Math.sin(start);
    const x2=cx+r*Math.cos(end),y2=cy+r*Math.sin(end);
    marks+=`<path class="data-sector" data-value="${value}" d="M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${value>50?1:0},1 ${x2},${y2} Z" fill="${colors[i%colors.length]}" stroke="#fff" stroke-width="2"/>`;
    const mid=(start+end)/2, lr=r*.67;
    marks+=text(cx+lr*Math.cos(mid),cy+lr*Math.sin(mid)+5,`${i+1} · ${fmt(value)}%`,'text-anchor="middle" class="sector-label"');
    angle=end;
  });
  return {W,H,marks};
}

function cartesianGeometry(c,narrow) {
  const W=narrow?520:720,H=358,L=58,R=c.type==='combo'?70:30,T=50,B=H-57;
  const plotW=W-L-R,plotH=B-T;
  const rightMax=c.rightMax||100;
  const maxima=c.categories.map((_,i)=>c.type==='stacked'?c.series.reduce((sum,s)=>sum+s.values[i],0):Math.max(...c.series.filter(s=>s.axis!=='right').map(s=>s.values[i])));
  const max=c.max || Math.ceil(Math.max(...maxima)/10)*10;
  const tick=c.tick||max/5;
  const scale=(value,axis='left')=>B-value/(axis==='right'?rightMax:max)*plotH;
  const x=i=>L+plotW*(i+.5)/c.categories.length;
  let marks='';
  for(let value=0;value<=max+tick/100;value+=tick){
    const y=scale(value);
    marks+=line(L,y,W-R,y,'class="chart-grid"')+text(L-9,y+4,fmt(value),'text-anchor="end" class="tick-label"');
  }
  marks+=line(L,T,L,B,'class="chart-axis"')+line(L,B,W-R,B,'class="chart-axis"');
  marks+=text(L,22,`左轴：${c.unit}`,'class="axis-unit"');
  if(c.type==='combo') {
    const rightTick=c.rightTick||rightMax/5;
    for(let value=0;value<=rightMax+rightTick/100;value+=rightTick){
      const y=scale(value,'right');
      marks+=text(W-R+9,y+4,fmt(value),'class="tick-label right-label"');
    }
    marks+=line(W-R,T,W-R,B,'class="chart-axis"');
    marks+=text(W-R,22,`右轴：${c.rightUnit||'%'}`,'text-anchor="end" class="axis-unit right-label"');
  }
  c.categories.forEach((category,i)=>{
    marks+=line(x(i),B,x(i),B+5,'class="chart-axis"');
    marks+=text(x(i),B+25,category,'text-anchor="middle" class="category-label"');
  });
  const step=plotW/c.categories.length;
  const groupWidth=Math.min(step*.68,94);
  if(c.type==='stacked') {
    c.categories.forEach((_,i)=>{
      let base=0;
      c.series.forEach((s,j)=>{
        const value=s.values[i],y=scale(base+value),height=value/max*plotH;
        marks+=`<rect class="data-bar" data-value="${value}" x="${x(i)-groupWidth/2}" y="${y}" width="${groupWidth}" height="${height}" fill="${colors[j%colors.length]}" stroke="white" stroke-width="1"/>`;
        if(height<18&&j===c.series.length-1){
          marks+=line(x(i),y,x(i),y-7,'class="chart-axis"');
          marks+=text(x(i),y-12,`${s.name} ${fmt(value)}`,'text-anchor="middle" class="data-label"');
        }else marks+=text(x(i),y+height/2+4,fmt(value),'text-anchor="middle" class="stack-label"');
        base+=value;
      });
    });
  } else if(c.type==='bar'||c.type==='combo') {
    const bars=c.series.filter(s=>s.axis!=='right');
    const bw=groupWidth/bars.length;
    bars.forEach((s,j)=>s.values.forEach((value,i)=>{
      const bx=x(i)-groupWidth/2+j*bw;
      marks+=`<rect class="data-bar" data-value="${value}" x="${bx}" y="${scale(value)}" width="${bw-3}" height="${B-scale(value)}" fill="${colors[j%colors.length]}"/>`;
      // Series numbers keep grouped bars identifiable without relying on color.
      marks+=text(bx+(bw-3)/2,scale(value)-8,fmt(value),'text-anchor="middle" class="data-label"');
      if(bars.length>1)marks+=text(bx+(bw-3)/2,B-7,String(j+1),'text-anchor="middle" class="bar-series-number"');
    }));
  }
  if(c.type==='line'||c.type==='combo') {
    const lines=c.type==='combo'?c.series.filter(s=>s.axis==='right'):c.series;
    lines.forEach((s,j)=>{
      const color=colors[c.type==='combo'?1:j];
      const points=s.values.map((v,i)=>`${x(i)},${scale(v,s.axis)}`).join(' ');
      marks+=`<polyline points="${points}" fill="none" stroke="${color}" stroke-width="2.5" ${j?'stroke-dasharray="7 4"':''}/>`;
      s.values.forEach((v,i)=>{
        const y=scale(v,s.axis);
        marks+=j?`<rect class="data-point" data-value="${v}" x="${x(i)-4.5}" y="${y-4.5}" width="9" height="9" fill="white" stroke="${color}" stroke-width="2"/>`:`<circle class="data-point" data-value="${v}" cx="${x(i)}" cy="${y}" r="4.5" fill="white" stroke="${color}" stroke-width="2"/>`;
        // The unit suffix keeps a percentage distinct from a bar's amount on dual axes.
        const otherValues=c.series.filter(series=>series!==s).map(series=>series.values[i]);
        const above=c.type==='combo'||!otherValues.length||v>Math.max(...otherValues)||(j>0&&v===Math.max(...otherValues));
        marks+=text(x(i),y+(above?-13:18),fmt(v)+(s.axis==='right'?(c.rightUnit||'%'):''),`text-anchor="middle" class="data-label line-value" style="fill:${color}"`);
      });
    });
  }
  return {W,H,marks};
}

function svg(c,narrow=false) {
  const geometry=c.type==='pie'?pieGeometry(c):cartesianGeometry(c,narrow);
  const id=`${c.id}-${narrow?'narrow':'wide'}`;
  const description=`${kinds[c.type]}。${c.title}。${c.type==='pie'?'扇区标注百分比，编号对应下方分类。':`横轴为${c.categories.join('、')}；左轴单位${c.unit}，从零起。`}${c.type==='combo'?`折线读右轴，单位${c.rightUnit}，不要比较柱和线的视觉高度。`:''}完整数值也可在下方数据表查阅。`;
  return `<svg class="stat-chart ${c.type==='pie'?'chart-pie':narrow?'chart-narrow':'chart-wide'}" viewBox="0 0 ${geometry.W} ${geometry.H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="${id}-title ${id}-desc"><title id="${id}-title">${esc(c.title)}</title><desc id="${id}-desc">${esc(description)}</desc>${geometry.marks}</svg>`;
}

function dataTable(c) {
  const unitFor=s=>c.type==='pie'?'%':s.axis==='right'?c.rightUnit:c.unit;
  return `<details class="chart-table"><summary>查看图中数据表（读数核对 / 无障碍）</summary><div class="table-wrap"><table><caption>${esc(c.title)}</caption><thead><tr><th scope="col">${c.type==='pie'?'分类':'时间 / 类别'}</th>${c.series.map(s=>`<th scope="col">${esc(s.name)}（${esc(unitFor(s))}）</th>`).join('')}</tr></thead><tbody>${c.categories.map((cat,i)=>`<tr><th scope="row">${esc(cat)}</th>${c.series.map(s=>`<td>${fmt(s.values[i])}</td>`).join('')}</tr>`).join('')}</tbody></table></div></details>`;
}

export function chartFigure(c) {
  const legend=(c.type==='pie'?c.categories.map((name,i)=>({name,index:i})):c.series.map((s,i)=>({name:s.name+(c.type==='combo'?(s.axis==='right'?' · 折线 / 右轴':' · 柱 / 左轴'):c.type==='line'?(i?' · 虚线方点':' · 实线圆点'):c.type==='stacked'?` · 自下向上第${i+1}层`:''),index:i})))
    .map(({name,index})=>`<span><i style="--series-color:${colors[index%colors.length]}" aria-hidden="true"></i><b>${index+1}</b> ${esc(name)}</span>`).join('');
  return `<figure class="stat-figure" id="${esc(c.id)}"><figcaption>${esc(c.title)}</figcaption><div class="chart-scroll" ${c.type==='pie'?'':'tabindex="0" role="region"'} aria-label="${esc(c.title)}${c.type==='pie'?'':'，窄屏可横向滚动'}">${svg(c)}${c.type==='pie'?'':svg(c,true)}</div><div class="chart-legend">${legend}</div>${c.type==='pie'?'':'<p class="chart-scroll-hint">手机上可左右滑动看全图；数值以标注和坐标轴为准。</p>'}${dataTable(c)}</figure>`;
}

export function renderMaterial(material,renderMarkdown) {
  return `<section class="chart-material" id="material"><div class="material-heading"><span>共用材料 · 原创模拟数据</span><h2>${esc(material.title)}</h2></div><div class="prose">${renderMarkdown(material.intro)}</div><div class="material-charts ${material.charts.every(c=>c.type==='pie')?'pie-pair':''}">${material.charts.map(chartFigure).join('')}</div><ul class="material-notes">${material.notes.map(n=>`<li>${esc(n)}</li>`).join('')}</ul><details class="reading-guide"><summary>先自己读图，需要时再看读图提示</summary><ol>${material.readGuide.map(s=>`<li>${renderMarkdown(s)}</li>`).join('')}</ol></details><a class="quiet-link" href="#practice">材料看完了，开始做题 ↓</a></section>`;
}

export { kinds as chartKinds };
