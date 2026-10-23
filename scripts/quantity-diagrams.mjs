// Every drawing is tied to an exercise, with known values only. The answer stays
// in the exercise's disclosure. Horizontal scrolling preserves readable labels.
const escape = value => String(value).replace(/[&<>\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function figure(id, title, description, body, caption, height=300) {
  return `<figure class="teaching-figure quantity-applied-figure"><div class="figure-title">${escape(title)}</div><div role="region" tabindex="0" aria-label="${escape(title)}，可横向滚动" style="overflow-x:auto;max-width:100%"><svg class="quantity-applied-svg" style="min-width:600px" viewBox="0 0 720 ${height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="${id}-figure-title ${id}-figure-desc"><title id="${id}-figure-title">${escape(title)}</title><desc id="${id}-figure-desc">${escape(description)}</desc><defs><marker id="${id}-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#3d789f"/></marker></defs><style>.quantity-applied-svg text{font-family:system-ui,'Microsoft YaHei',sans-serif;fill:#274f6b;font-size:15px}.quantity-applied-svg .qa-small{font-size:12px;fill:#617c91}.quantity-applied-svg .qa-label{font-size:17px;font-weight:650}.quantity-applied-svg .qa-line{stroke:#477d9f;stroke-width:2;fill:none}.quantity-applied-svg .qa-dash{stroke:#7897ad;stroke-width:1.5;stroke-dasharray:5 4;fill:none}.quantity-applied-svg .qa-blue{fill:#d9edf9;stroke:#729ebd;stroke-width:1.5}.quantity-applied-svg .qa-soft{fill:#eef6fc;stroke:#a7c3d7;stroke-width:1.5}.quantity-applied-svg .qa-dark{fill:#457fa6}.quantity-applied-svg .qa-white{fill:white}</style>${body}</svg></div><figcaption>${escape(caption)}</figcaption></figure>`;
}

const drawings = {
  'q-geometry-e1': () => figure('q-geometry-e1', '题目图｜相似三角形的对应边长比为3∶5', '左侧小三角形与右侧大三角形相似，对应边长分别标作3份和5份，小三角形面积18平方厘米，大三角形面积未知。份数只是同一长度尺度的比值，不是厘米数。', `
    <path d="M70 220L170 110L270 220Z" class="qa-blue"/><path d="M340 220L506 37L672 220Z" class="qa-blue"/>
    <text x="170" y="184" text-anchor="middle">18平方厘米</text><text x="506" y="176" text-anchor="middle">面积待求</text>
    <path d="M70 244H270 M70 238v12 M270 238v12 M340 244H672 M340 238v12 M672 238v12" class="qa-line"/>
    <text x="170" y="270" text-anchor="middle">对应边：3份</text><text x="506" y="270" text-anchor="middle">对应边：5份</text>
    <text x="170" y="60" text-anchor="middle" class="qa-label">题干明确：两个三角形相似</text>
  `, '示意图不按比例。“份”只表达边长比，不新增实际边长条件；面积需要按什么倍率变化，由你判断。'),
  'q-geometry-e2': () => figure('q-geometry-e2', '题目图｜只改半径，与所有长度都翻倍', '三幅圆柱示意图。第一幅原圆柱半径2厘米高10厘米。第二幅只把半径改为4厘米，高仍10厘米。第三幅半径和高都变为原来的2倍。三个体积均未给出。', `
    ${[140,360,580].map((x,i)=>`<path d="M${x-64} 88V212C${x-64} 236 ${x+64} 236 ${x+64} 212V88" class="qa-blue"/><ellipse cx="${x}" cy="88" rx="64" ry="19" class="qa-blue"/><path d="M${x} 88H${x+64}" class="qa-line"/><circle cx="${x}" cy="88" r="3" fill="#477d9f"/><text x="${x}" y="36" text-anchor="middle" class="qa-label">${['①原圆柱','②只改半径','③整体放大'][i]}</text><text x="${x}" y="66" text-anchor="middle">${['半径2厘米','半径4厘米','半径×2'][i]}</text><text x="${x}" y="161" text-anchor="middle">${['高10厘米','高仍10厘米','高也×2'][i]}</text>`).join('')}
    <text x="360" y="272" text-anchor="middle" class="qa-small">图示不按几何比例绘制，三幅图的大小不能用来判断体积倍数。</text>
  `, '每幅图的横线从圆心画到圆周，标注的是半径，不是直径。第三幅按题意改变所有对应长度。'),
  'q-geometry-e3': () => figure('q-geometry-e3', '题目图｜物体完全浸没后，水位升到哪里', '放入前，长方体容器水深12厘米，内底长30厘米宽20厘米。放入后，一个体积1200立方厘米的物体完全浸没，水没有溢出，新的水深h未知。示意图不按比例。', `
    <text x="185" y="30" text-anchor="middle" class="qa-label">放入前</text><text x="525" y="30" text-anchor="middle" class="qa-label">放入后：水深h待求</text>
    <rect x="85" y="134" width="200" height="96" fill="#b9ddf3"/><path d="M85 65V230H285V65 M85 134H285" class="qa-line"/>
    <path d="M61 134V230 M55 134h12 M55 230h12" class="qa-line"/><text x="10" y="187">12厘米</text>
    <rect x="425" y="111" width="200" height="119" fill="#b9ddf3"/><path d="M425 65V230H625V65 M425 111H625" class="qa-line"/>
    <path d="M425 134H625" class="qa-dash"/><rect x="481" y="158" width="88" height="61" rx="10" fill="#9caebc" stroke="#58768b"/>
    <text x="525" y="195" text-anchor="middle" style="font-size:13px;fill:#183e59">完全浸没</text>
    <path d="M647 111V230 M641 111h12 M641 230h12" class="qa-line"/><text x="659" y="176">h</text>
    <text x="185" y="264" text-anchor="middle">内底：30厘米×20厘米</text><text x="525" y="264" text-anchor="middle">物体体积：1200立方厘米</text>
  `, '图示不按比例，虚线表示原水位，不能从图上量出升高多少。物体完全浸没、不吸水、不溶解且未溢水。'),
  'q-geometry-applied-e1': () => figure('q-geometry-applied-e1', '题目图｜道路铺在场地内侧', '外部长方形长30米宽20米，四边内侧道路宽均为2米，中间为绿地。图示不按比例。', `
    <rect x="140" y="57" width="440" height="180" fill="#d0e7f6" stroke="#477d9f" stroke-width="2"/>
    <rect x="175" y="89" width="370" height="116" fill="#f4faf6" stroke="#91b6a1" stroke-width="2"/>
    <path d="M140 38H580 M140 31v14 M580 31v14 M603 57v180 M596 57h14 M596 237h14" class="qa-line"/>
    <text x="360" y="26" text-anchor="middle" class="qa-label">30米</text><text x="615" y="150">20米</text>
    <text x="360" y="143" text-anchor="middle" class="qa-label">中央绿地</text><text x="360" y="170" text-anchor="middle" class="qa-small">长、宽各需要减掉几次2米？</text>
    <text x="360" y="79" text-anchor="middle">2米</text><text x="360" y="228" text-anchor="middle">2米</text>
    <path d="M140 151H175 M545 151H580" class="qa-line"/>
    <text x="92" y="155">2米</text><text x="550" y="183" class="qa-small">2米</text>
    <text x="360" y="275" text-anchor="middle" class="qa-small">蓝色区域为道路；示意图不按比例，尺寸以标注为准。</text>
  `, '先找中央剩余区域，再用整个场地减去它。蓝色四个角属于道路，计算时各计一次。'),
  'q-geometry-applied-e2': () => figure('q-geometry-applied-e2', '题目图｜两块三角形，共用从B到底边的高', '三角形ABC底边AC长16米，D在AC上且AD长6米，连接BD。ABC总面积64平方米，ABD区域着色，高从B垂直到AC所在直线。图示不按比例。', `
    <path d="M100 205L390 43L290 205Z" fill="#cae4f5"/>
    <path d="M100 205L390 43L620 205Z M390 43L290 205" class="qa-line"/>
    <path d="M390 43V205" class="qa-dash"/><path d="M390 192h13v13" class="qa-line"/>
    <text x="84" y="218" class="qa-label">A</text><text x="384" y="29" class="qa-label">B</text><text x="626" y="218" class="qa-label">C</text><text x="280" y="225" class="qa-label">D</text>
    <text x="415" y="134">同一个高</text><text x="250" y="163" text-anchor="middle">所求ABD</text>
    <path d="M100 241H290 M100 236v10 M290 236v10 M100 275H620 M100 270v10 M620 270v10" class="qa-line"/>
    <text x="195" y="236" text-anchor="middle">AD=6米</text><text x="360" y="270" text-anchor="middle">AC=16米</text>
    <text x="520" y="58" class="qa-label">总面积64平方米</text>
  `, '示意图不按比例。虚线只是辅助高；两个三角形等高，不必假设它们相似。', 300),
  'q-geometry-applied-e3': () => figure('q-geometry-applied-e3', '题目图｜放入前的水，与尚未放入的物块', '左图为竖直侧壁容器放入物块前的水，底面积600平方厘米，水深10厘米。右图为尚未放入的实心长方体物块，底面积100平方厘米，高15厘米。放入后的水深未知。图示不按比例。', `
    <text x="200" y="29" text-anchor="middle" class="qa-label">容器：放入前</text>
    <rect x="88" y="137" width="224" height="91" fill="#b9ddf3"/>
    <path d="M88 67V228H312V67" class="qa-line"/><path d="M88 137H312" class="qa-line"/>
    <path d="M65 137v91 M59 137h12 M59 228h12" class="qa-line"/>
    <text x="17" y="186">10厘米</text><text x="200" y="254" text-anchor="middle">内底面积600平方厘米</text>
    <text x="525" y="29" text-anchor="middle" class="qa-label">物块：尚未放入</text>
    <rect x="465" y="83" width="116" height="145" fill="#e3e8ed" stroke="#718da1" stroke-width="2"/>
    <path d="M607 83v145 M601 83h12 M601 228h12" class="qa-line"/>
    <text x="620" y="160">15厘米</text><text x="525" y="254" text-anchor="middle">底面积100平方厘米</text>
    <text x="360" y="292" text-anchor="middle" class="qa-small">物块将竖直固定在底面。放入后的水深h，要先列式，再检查是否淹过物块。</text>
  `, '示意图不按比例，右侧不是放入后的水位。物块已固定且不吸水，不需要讨论漂浮。', 320),
  'q-travel-applied-e1': () => figure('q-travel-applied-e1', '题目时间轴｜两车在同一时刻处于哪种状态', '时间轴标出8点、8点半、9点、9点15。甲8点出发每小时40千米，9点到9点15停车，之后恢复原速。乙8点半开始每小时60千米且不停。示意不按时间比例。', `
    <path d="M130 54H675" class="qa-line"/>
    <text x="130" y="36" text-anchor="middle">8:00</text><text x="300" y="36" text-anchor="middle">8:30</text><text x="470" y="36" text-anchor="middle">9:00</text><text x="590" y="36" text-anchor="middle">9:15</text>
    <path d="M130 47V240 M300 47V240 M470 47V240 M590 47V240" class="qa-dash"/>
    <text x="40" y="111" class="qa-label">甲车</text><rect x="130" y="84" width="340" height="40" class="qa-blue"/><rect x="470" y="84" width="120" height="40" fill="#fbefd5" stroke="#b8a26f"/><rect x="590" y="84" width="85" height="40" class="qa-blue"/>
    <text x="300" y="110" text-anchor="middle">40千米/小时</text><text x="530" y="110" text-anchor="middle">停车15分</text><text x="632" y="110" text-anchor="middle" class="qa-small">恢复原速</text>
    <text x="40" y="191" class="qa-label">乙车</text><rect x="130" y="164" width="170" height="40" class="qa-soft"/><rect x="300" y="164" width="375" height="40" class="qa-blue"/>
    <text x="215" y="190" text-anchor="middle">未出发</text><text x="487" y="190" text-anchor="middle">60千米/小时，始终不停</text>
    <text x="360" y="270" text-anchor="middle" class="qa-small">先结算9:00的间距，再判断能不能在15分钟停车内追上。</text>
  `, '示意图不按时间比例，不能用色块宽度代替分钟数。出发、停车和恢复行驶都要在同一条时间轴上对齐。'),
  'q-travel-applied-e2': () => figure('q-travel-applied-e2', '题目路线｜先相向，甲在B端点折返', 'A到B相距180千米。初始时甲在A向B，每小时90千米，乙在B向A，每小时30千米。甲到B立即折返。图中没有给出相遇点，须按时刻确定位置。', `
    <text x="350" y="29" text-anchor="middle" class="qa-label">A、B相距180千米</text>
    <path d="M100 98H620" class="qa-line"/><circle cx="100" cy="98" r="6" fill="#477d9f"/><circle cx="620" cy="98" r="6" fill="#477d9f"/>
    <text x="93" y="127" class="qa-label">A</text><text x="613" y="127" class="qa-label">B</text>
    <path d="M130 78H295" class="qa-line" marker-end="url(#q-travel-applied-e2-arrow)"/><path d="M590 78H425" class="qa-line" marker-end="url(#q-travel-applied-e2-arrow)"/>
    <text x="215" y="61" text-anchor="middle">甲：90千米/小时</text><text x="505" y="61" text-anchor="middle">乙：30千米/小时</text>
    <path d="M100 183H620V219H440" class="qa-line" marker-end="url(#q-travel-applied-e2-arrow)"/>
    <text x="260" y="172" text-anchor="middle">甲先到B端点</text><text x="530" y="248" text-anchor="middle">立即折返，速度不变</text>
    <text x="360" y="285" text-anchor="middle" class="qa-small">示意图不按比例；第二次相遇也包括同向追上。</text>
  `, '先求甲到达B的时刻，再把乙放到同一时刻的位置。路线图没有暗示相遇点或相遇时间。', 310),
  'q-travel-applied-e3': () => figure('q-travel-applied-e3', '题目路线｜两段行驶，中间还有30分钟停留', '从A到B行驶60千米，速度每小时30千米；在B停留30分钟；从B到C行驶90千米，速度每小时60千米。求含停留的全程平均速度。图示不按比例。', `
    <path d="M95 127H625" class="qa-line"/>
    <circle cx="95" cy="127" r="8" fill="#457fa6"/><circle cx="360" cy="127" r="8" fill="#457fa6"/><circle cx="625" cy="127" r="8" fill="#457fa6"/>
    <text x="89" y="160" class="qa-label">A</text><text x="354" y="160" class="qa-label">B</text><text x="619" y="160" class="qa-label">C</text>
    <text x="225" y="69" text-anchor="middle" class="qa-label">60千米</text><text x="225" y="96" text-anchor="middle">30千米/小时</text><text x="490" y="69" text-anchor="middle" class="qa-label">90千米</text><text x="490" y="96" text-anchor="middle">60千米/小时</text>
    <rect x="274" y="188" width="172" height="45" rx="8" fill="#fbefd5" stroke="#b8a26f"/><text x="360" y="217" text-anchor="middle">B点停留30分钟</text>
    <text x="360" y="272" text-anchor="middle" class="qa-small">总用时=第一段行驶时间+停留时间+第二段行驶时间。</text>
  `, '示意图不按比例，两段画成相近长度并不表示路程相等。按标注取数，时间统一成小时。'),
  'q-engineering-applied-e1': () => figure('q-engineering-applied-e1', '题目分段表｜甲离开与乙提效发生在同一时刻', '甲单独12天完成，乙单独18天完成。第一段甲乙按原效率合作4天，第二段甲离开，乙原效率提高25%直到完工。问题所求是两段时间之和。', `
    <text x="360" y="30" text-anchor="middle" class="qa-label">已知：甲独做12天；乙独做18天</text>
    <rect x="38" y="58" width="644" height="42" fill="#dbeaf5"/>
    <text x="80" y="85">阶段</text><text x="235" y="85">谁在做、效率有何变化</text><text x="552" y="85">持续时间</text>
    <rect x="38" y="100" width="644" height="61" class="qa-soft"/><text x="72" y="137">第一段</text><text x="218" y="137">甲乙合作，均按原效率</text><text x="573" y="137">4天</text>
    <rect x="38" y="161" width="644" height="61" class="qa-soft"/><text x="72" y="198">第二段</text><text x="218" y="198">仅乙，效率变为原来的1.25倍</text><text x="553" y="198">t天（未知）</text>
    <path d="M185 58V222 M516 58V222" class="qa-line"/>
    <text x="360" y="264" text-anchor="middle">题目问：从最初开始到完工，共用4+t天。</text>
  `, '表格按阶段组织，不按持续时间比例绘制。先把效率写成份/天，再结算每段完成量。'),
  'q-engineering-applied-e2': () => figure('q-engineering-applied-e2', '题目分段表｜先开两管，再关排水并减小进水', '池容量120立方米，初始水量30立方米。第一阶段2小时，进水每小时20立方米，排水每小时8立方米。第二阶段排水关闭，进水比原流量降低25%，持续时间待求。', `
    <text x="360" y="28" text-anchor="middle" class="qa-label">容量120立方米；初始已有30立方米</text>
    <rect x="29" y="58" width="662" height="44" fill="#dbeaf5"/>
    <text x="66" y="85">阶段</text><text x="226" y="85">进水</text><text x="435" y="85">排水</text><text x="594" y="85">用时</text>
    <rect x="29" y="102" width="662" height="59" class="qa-soft"/><rect x="29" y="161" width="662" height="64" class="qa-soft"/>
    <path d="M150 58V225 M376 58V225 M550 58V225" class="qa-line"/>
    <text x="57" y="138">第一段</text><text x="196" y="138">20立方米/小时</text><text x="401" y="138">8立方米/小时</text><text x="591" y="138">2小时</text>
    <text x="57" y="199">第二段</text><text x="181" y="199">原流量降低25%</text><text x="413" y="199">已关闭（0）</text><text x="579" y="199">t小时</text>
    <text x="360" y="266" text-anchor="middle">问“关管后还需”，只求第二段的t。</text>
  `, '每段先算进减排，再更新池中水量。表格不按时间比例绘制，未给出任何阶段结束后的答案数值。'),
  'q-engineering-applied-e3': () => figure('q-engineering-applied-e3', '题目时间条｜前3件产品怎样接力加工', '时间轴单位分钟。甲机依次加工第1件0至12分钟、第2件12至24、第3件24至36。乙机先等第一件，依次加工第1件12至27分钟、第2件27至42、第3件42至57。此图只展示前3件，不给出40件的最终完工时刻。', `
    <text x="360" y="25" text-anchor="middle" class="qa-label">每件先甲后乙；不同件可以同时在两台机器上加工</text>
    <path d="M140 68H668" class="qa-line"/>
    ${[0,12,24,36,48,60].map(t=>`<path d="M${140+t*8.8} 62V226" class="qa-dash"/><text x="${140+t*8.8}" y="54" text-anchor="middle" class="qa-small">${t}分</text>`).join('')}
    <text x="22" y="115" class="qa-label">甲机</text><text x="22" y="137" class="qa-small">12分钟/件</text>
    ${[0,1,2].map(i=>`<rect x="${140+i*105.6}" y="94" width="105.6" height="42" fill="${i%2?'#dceaf4':'#beddf1'}" stroke="#729ebd"/><text x="${192.8+i*105.6}" y="121" text-anchor="middle">第${i+1}件</text>`).join('')}
    <text x="552" y="122" class="qa-small">继续加工后续产品…</text>
    <text x="22" y="194" class="qa-label">乙机</text><text x="22" y="216" class="qa-small">15分钟/件</text>
    <rect x="140" y="173" width="105.6" height="42" fill="#f5f0e2" stroke="#c9b786"/><text x="192.8" y="200" text-anchor="middle" class="qa-small">等待第1件</text>
    ${[0,1,2].map(i=>`<rect x="${245.6+i*132}" y="173" width="132" height="42" fill="${i%2?'#dceaf4':'#beddf1'}" stroke="#729ebd"/><text x="${311.6+i*132}" y="200" text-anchor="middle">第${i+1}件</text>`).join('')}
    <text x="360" y="260" text-anchor="middle" class="qa-small">只画前3件。甲先完成的产品允许暂存，不能在乙尚未空闲时挤进乙机。</text>
  `, '时间条按标注分钟线性绘制；这不是零件的几何比例图。总共40件，最终时刻留给你计算。', 285)
};

export function quantityAppliedDiagramFor(id) {
  return drawings[id]?.() || '';
}
