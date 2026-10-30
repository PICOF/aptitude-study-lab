(() => {
  'use strict';
  const $ = (s,root=document)=>root.querySelector(s);
  const $$ = (s,root=document)=>[...root.querySelectorAll(s)];
  const prefix=document.body.dataset.prefix||'';
  const E=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
  const key='aptitude-study-v1';
  let state={saved:[],done:[],known:[]}, storageAvailable=true;
  try{const data=JSON.parse(localStorage.getItem(key)||'null');if(data&&typeof data==='object')for(const k of ['saved','done','known'])if(Array.isArray(data[k]))state[k]=[...new Set(data[k].filter(v=>typeof v==='string'))];}catch{storageAvailable=false;}
  let toastTimer;
  function toast(message){const el=$('.toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2600);}
  function save(){try{localStorage.setItem(key,JSON.stringify(state));storageAvailable=true;}catch{storageAvailable=false;}updateProgress();}
  function persisted(message){return storageAvailable?message:message+' 浏览器未允许保存，离开页面后可能丢失。';}
  function toggle(kind,id){const i=state[kind].indexOf(id);if(i<0)state[kind].push(id);else state[kind].splice(i,1);save();return i<0;}
  function updateProgress(){const total=Number(document.body.dataset.total)||0;const n=Math.min(state.done.length,total);$$('[data-progress-text]').forEach(el=>el.textContent=`${n} / ${total}`);$$('[data-progress-bar]').forEach(el=>el.style.width=`${total?n/total*100:0}%`);$$('[data-done-dot]').forEach(el=>el.classList.toggle('done',state.done.includes(el.dataset.doneDot)));$$('[data-complete-label]').forEach(el=>el.textContent=state.done.includes(el.dataset.completeLabel)?'已学完':'');for(const [sel,kind,on,off] of [['.save-lesson','saved','已收藏','收藏本课'],['.complete-lesson','done','已学完 · 可撤销','标记本课学完']])$$(sel).forEach(el=>{const active=state[kind].includes(el.dataset.id);el.setAttribute('aria-pressed',String(active));$('span',el).textContent=active?on:off;});}
  updateProgress();
  $$('.save-lesson').forEach(el=>el.addEventListener('click',()=>toast(persisted(toggle('saved',el.dataset.id)?'已加入收藏，方便下次二刷。':'已取消收藏。'))));
  $$('.complete-lesson').forEach(el=>el.addEventListener('click',()=>toast(persisted(toggle('done',el.dataset.id)?'已记下本课进度。':'已撤销学完标记。'))));
  window.addEventListener('storage',e=>{if(e.key!==key)return;try{const v=JSON.parse(e.newValue);if(v&&['saved','done','known'].every(k=>Array.isArray(v[k])))state=v;updateProgress();window.dispatchEvent(new Event('study-state-changed'));}catch{}});

  // Mobile drawer keeps keyboard focus inside the open navigation.
  const sidebar=$('.sidebar'),menu=$('.mobile-menu'),backdrop=$('.nav-backdrop');let returnFocus;sidebar.inert=innerWidth<=760;
  function setMenu(open){sidebar.inert=!open&&innerWidth<=760;if(open)returnFocus=document.activeElement;sidebar.classList.toggle('open',open);backdrop.hidden=!open;menu.setAttribute('aria-expanded',String(open));document.body.style.overflow=open?'hidden':'';$('.main').inert=open;$('.site-header').inert=open;if(open)$('.close-menu').focus();else if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});}
  menu.addEventListener('click',()=>setMenu(true));$('.close-menu').addEventListener('click',()=>setMenu(false));backdrop.addEventListener('click',()=>setMenu(false));
  sidebar.addEventListener('click',event=>{
    const link=event.target.closest('a[href]');if(!link||!sidebar.classList.contains('open'))return;
    const url=new URL(link.href,location.href);
    if(url.origin!==location.origin||url.pathname!==location.pathname||url.search!==location.search||!url.hash)return;
    setMenu(false);
    const section=document.getElementById(decodeURIComponent(url.hash.slice(1)));
    if(section){section.tabIndex=-1;requestAnimationFrame(()=>section.focus({preventScroll:true}));}
  });
  window.addEventListener('resize',()=>{if(innerWidth>760&&sidebar.classList.contains('open'))setMenu(false);sidebar.inert=innerWidth<=760&&!sidebar.classList.contains('open');});
  document.addEventListener('keydown',e=>{if(!sidebar.classList.contains('open'))return;if(e.key==='Escape'){e.preventDefault();setMenu(false);}if(e.key==='Tab'){const focusable=$$('a[href],button:not([disabled]),summary',sidebar).filter(x=>x.offsetParent!==null),first=focusable[0],last=focusable.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});

  // Tables remain scrollable even in lessons with long source material.
  $$('table').forEach(table=>{if(table.parentElement.classList.contains('table-wrap'))return;const div=document.createElement('div');div.className='table-wrap';div.tabIndex=0;div.setAttribute('role','region');div.setAttribute('aria-label','可横向滚动的数据表');table.before(div);div.append(table);});
  function loadScript(file,global){if(window[global])return Promise.resolve(window[global]);return new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=prefix+'assets/'+file;script.onload=()=>resolve(window[global]);script.onerror=()=>reject(new Error('资源加载失败'));document.head.append(script);});}
  let studyPromise;const studyData=()=>studyPromise||(studyPromise=loadScript('study-data.js','STUDY_DATA'));
  let searchPromise;const searchData=()=>searchPromise||(searchPromise=loadScript('search-data.js','STUDY_SEARCH'));
  const dialog=$('.search-dialog'),searchInput=$('#site-search'),results=$('.search-results');
  $('.search-top button').type='button';$('form',dialog).addEventListener('submit',e=>e.preventDefault());$('.search-top button').addEventListener('click',()=>dialog.close());
  async function openSearch(){dialog.showModal();searchInput.focus();await search();}
  $$('.search-trigger').forEach(b=>b.addEventListener('click',openSearch));
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
  document.addEventListener('keydown',e=>{if((e.key==='/'||(e.key.toLowerCase()==='k'&&(e.ctrlKey||e.metaKey)))&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)&&!sidebar.classList.contains('open')){e.preventDefault();if(!dialog.open)openSearch();}});
  let searchVersion=0,debounce;
  searchInput.addEventListener('input',()=>{clearTimeout(debounce);debounce=setTimeout(search,100);});
  function marked(text,term){const low=text.toLowerCase(),pos=low.indexOf(term.toLowerCase());if(pos<0||!term)return E(text);return E(text.slice(0,pos))+'<mark>'+E(text.slice(pos,pos+term.length))+'</mark>'+E(text.slice(pos+term.length));}
  async function search(){const version=++searchVersion;results.innerHTML='<p class="search-status">正在打开本地索引…</p>';let all;try{all=await searchData();}catch{results.innerHTML='<p class="search-status">索引加载失败，请刷新后重试。课程仍可从导航直接阅读。</p>';return;}if(version!==searchVersion)return;const query=searchInput.value.trim().toLowerCase(),terms=query.split(/\s+/).filter(Boolean);let hits;
    if(!query)hits=all.filter(x=>x.type==='lesson').filter((_,i)=>i%7===0).slice(0,7).map(x=>({x,score:1}));
    else hits=all.map(x=>{const title=x.title.toLowerCase(),text=x.text.toLowerCase();let score=0;if(terms.every(t=>text.includes(t)||title.includes(t))){score=terms.reduce((n,t)=>n+(title.includes(t)?12:2),0)+(title===query?30:0);}else if(terms.length===1&&/^[\u4e00-\u9fff]{4,16}$/.test(query)){const grams=Array.from({length:query.length-1},(_,i)=>query.slice(i,i+2)),matched=grams.filter(t=>text.includes(t)).length;if(matched/grams.length>=.7)score=matched/grams.length;}return{x,score};}).filter(x=>x.score>0).sort((a,b)=>b.score-a.score);
    if(!hits.length){results.innerHTML='<p class="search-status">没找到匹配内容。试试更短的词，比如“工程”“比重”“搭配”；多个关键词用空格隔开。</p>';return;}
    results.innerHTML=`<p class="search-status">${query?`找到 ${hits.length} 条，按相关性显示前 ${Math.min(hits.length,30)} 条`:'可以从这些方法开始'}</p>`+hits.slice(0,30).map(({x})=>`<a class="search-result" href="${prefix}${E(x.url)}"><span>${E(x.moduleTitle)} · ${x.type==='card'?'知识卡片':'方法教程'}</span><strong>${marked(x.title,terms[0]||'')}</strong><p>${marked(x.summary.slice(0,125),terms[0]||'')}${x.summary.length>125?'…':''}</p></a>`).join('');
  }

  if(document.body.dataset.page==='cards')initCards().catch(()=>{$('.flashcard').innerHTML='<h2>卡片加载失败</h2><p>请刷新重试，或从教程页面继续学习。</p>';});
  async function initCards(){const data=await studyData(),all=data.cards;let filtered=[],cursor=0,directoryLimit=20;
    const module=$('#card-module'),category=$('#card-category'),status=$('#card-status'),query=$('#card-query');const params=new URLSearchParams(location.search),requested=all.find(c=>c.id===params.get('card'));
    if(requested)module.value=requested.module;else if(['verbal','knowledge'].includes(params.get('module')))module.value=params.get('module');
    function categories(){const previous=category.value;category.innerHTML='<option value="all">全部分类</option>'+[...new Set(all.filter(c=>module.value==='all'||c.module===module.value).map(c=>c.category))].map(v=>`<option value="${E(v)}">${E(v)}</option>`).join('');if([...category.options].some(o=>o.value===previous))category.value=previous;}
    function apply(selected){directoryLimit=20;const q=query.value.trim().toLowerCase();filtered=all.filter(c=>(module.value==='all'||c.module===module.value)&&(category.value==='all'||c.category===category.value)&&(status.value==='all'||(state.known.includes(c.id)===(status.value==='known')))&&(!q||[c.front,c.back,c.mnemonic,c.trap,c.example].join(' ').toLowerCase().includes(q)));cursor=Math.max(0,filtered.findIndex(c=>c.id===selected));show();directory();}
    function directory(){const el=$('#card-directory');el.innerHTML=filtered.slice(0,directoryLimit).map((c,i)=>`<button data-card-index="${i}" class="${i===cursor?'active':''}"><span>${String(i+1).padStart(2,'0')}</span>${E(c.front)}</button>`).join('')+(filtered.length>directoryLimit?`<button class="directory-more">再显示 ${Math.min(20,filtered.length-directoryLimit)} 张（共 ${filtered.length} 张）</button>`:'');$('.directory-more',el)?.addEventListener('click',()=>{directoryLimit+=20;directory();});$$('button[data-card-index]',el).forEach(b=>b.addEventListener('click',()=>{cursor=Number(b.dataset.cardIndex);show();$('.flashcard').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'start'});}));}
    function show(){const empty=!filtered.length;$('.flashcard').hidden=empty;$('.flashcard-actions').hidden=empty;$('.card-empty').hidden=!empty;$('#shuffle-cards').disabled=empty;$('#card-counter').textContent=empty?'0 张卡片':`${cursor+1} / ${filtered.length} 张 · 当前筛选已记住 ${filtered.filter(c=>state.known.includes(c.id)).length} 张`;if(empty)return;const c=filtered[cursor];$('#flash-label').textContent=c.category+(c.date?' · '+c.date:'');$('#flash-front').textContent=c.front;$('.flash-prompt').hidden=false;$('#flip-card').hidden=false;const back=$('#flash-back');back.hidden=true;const sourceList=c.sourceIds.map(id=>data.sources.find(s=>s.id===id)).filter(Boolean);back.innerHTML=`<p>${E(c.back)}</p><div class="card-detail"><strong>怎么记</strong><p>${E(c.mnemonic)}</p></div><div class="card-detail"><strong>易错提醒</strong><p>${E(c.trap)}</p></div><div class="card-detail"><strong>放进题里</strong><p>${E(c.example).replaceAll('\n','<br>')}</p></div><div class="card-source"><span>核验 2026-10-23 ·</span>${sourceList.map(s=>`<a href="${E(s.url)}" target="_blank" rel="noopener noreferrer">${E(s.title)}</a>`).join('')}</div>`;const known=state.known.includes(c.id);$('#mark-card').setAttribute('aria-pressed',String(known));$('#mark-card').innerHTML=known?'已记住 · 可撤销':'标记记住了';$$('#card-directory button').forEach((b,i)=>b.classList.toggle('active',i===cursor));history.replaceState(null,'',location.pathname+'?card='+encodeURIComponent(c.id));}
    module.addEventListener('change',()=>{categories();apply();});category.addEventListener('change',()=>apply());status.addEventListener('change',()=>apply());query.addEventListener('input',()=>apply());
    $('#flip-card').addEventListener('click',()=>{$('#flash-back').hidden=false;$('#flip-card').hidden=true;$('.flash-prompt').hidden=true;});
    $('#next-card').addEventListener('click',()=>{cursor=(cursor+1)%filtered.length;show();$('.flashcard').scrollIntoView({block:'start',behavior:'auto'});});$('#prev-card').addEventListener('click',()=>{cursor=(cursor-1+filtered.length)%filtered.length;show();$('.flashcard').scrollIntoView({block:'start',behavior:'auto'});});
    $('#mark-card').addEventListener('click',()=>{const id=filtered[cursor].id,known=toggle('known',id);toast(persisted(known?'已记住这张卡，之后也记得复习。':'已放回“还要练”。'));if(status.value!=='all')apply();else{const wasOpen=!$('#flash-back').hidden;show();if(wasOpen){$('#flash-back').hidden=false;$('#flip-card').hidden=true;$('.flash-prompt').hidden=true;}}});
    $('#shuffle-cards').addEventListener('click',()=>{for(let i=filtered.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[filtered[i],filtered[j]]=[filtered[j],filtered[i]];}cursor=0;show();directory();toast('已换一个顺序，避免只记卡片位置。');});
    window.addEventListener('study-state-changed',()=>apply(filtered[cursor]?.id));categories();apply(requested?.id);
  }

  if(document.body.dataset.page==='saved')initRecords().catch(()=>$('#record-list').innerHTML='<p class="empty-records">记录列表加载失败，请刷新重试。</p>');
  async function initRecords(){const data=await studyData();let tab='saved';const draw=()=>{const list=data.lessons.filter(l=>state[tab].includes(l.id));$('#record-list').innerHTML=list.length?list.map((l,i)=>`<a class="lesson-row" href="learn/${E(l.id)}.html"><span class="lesson-number">${String(i+1).padStart(2,'0')}</span><div><h2>${E(l.title)}</h2><p>${E(l.summary)}</p><span class="lesson-meta">${E(l.moduleTitle)}</span></div></a>`).join(''):`<div class="empty-records"><p>${tab==='saved'?'还没有收藏。遇到想二刷的方法，在课程页点击“收藏本课”。':'还没有标记学完的课程。会做本课例题后，再点击“标记本课学完”。'}</p><a href="index.html">去学习地图看看</a></div>`;};window.addEventListener('study-state-changed',draw);
    $$('[data-record]').forEach(b=>b.addEventListener('click',()=>{tab=b.dataset.record;$$('[data-record]').forEach(x=>{const active=x===b;x.classList.toggle('primary',active);x.classList.toggle('secondary',!active);x.setAttribute('aria-pressed',String(active));});draw();}));
    $('#export-records').addEventListener('click',()=>{const blob=new Blob([JSON.stringify({version:1,...state},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='行测自习室-学习记录.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('已导出学习记录。');});
    $('#import-records').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>1024*1024)throw new Error('size');const imported=JSON.parse(await file.text());if(imported.version!==1||!['saved','done','known'].every(k=>Array.isArray(imported[k])))throw new Error('format');const ids=new Set(data.lessons.map(l=>l.id)),cardIds=new Set(data.cards.map(c=>c.id));for(const k of ['saved','done','known'])state[k]=[...new Set([...state[k],...imported[k].filter(id=>typeof id==='string'&&(k==='known'?cardIds:ids).has(id))])];save();draw();toast(persisted('已合并有效的课程与卡片记录。'));}catch{toast('文件格式不正确，请选择本站导出的学习记录。');}e.target.value='';});draw();
  }

  if(document.body.dataset.page==='tools'){
    const fmt=n=>Number(n.toFixed(3)).toLocaleString('zh-CN',{maximumFractionDigits:3});
    function growth(){const base=Number($('#growth-base').value),r=Number($('#growth-rate').value)/100;$('#growth-rate-label').textContent=fmt(r*100)+'%';if(!Number.isFinite(base)||base<=0||base>100000){$('#growth-formula').textContent='请输入大于0且不超过100000的基期量。';$('#base-label').textContent='—';$('#current-label').textContent='—';$('#base-bar').style.width='0%';$('#current-bar').style.width='0%';return;}const current=base*(1+r),gain=current-base,max=Math.max(base,current)*1.12;$('#base-label').textContent=fmt(base);$('#current-label').textContent=fmt(current);$('#base-bar').style.width=base/max*100+'%';$('#current-bar').style.width=current/max*100+'%';$('#growth-formula').innerHTML=`现期＝${fmt(base)} × ${fmt(1+r)}＝<strong>${fmt(current)}</strong><br>基期＝${fmt(current)} ÷ ${fmt(1+r)}＝<strong>${fmt(base)}</strong><br>${gain<0?'减少量':'增长量'}＝<strong>${fmt(Math.abs(gain))}</strong> ${gain<0?'（有符号增长量为 '+fmt(gain)+'）':''}`;}
    $('#growth-base').addEventListener('input',growth);$('#growth-rate').addEventListener('input',growth);growth();
    function mixture(){const a=Number($('#mix-a').value),b=Number($('#mix-b').value),v=(10*a+30*b)/(a+b);$('#mix-a-label').textContent=a+' 份';$('#mix-b-label').textContent=b+' 份';$('#mix-strip').innerHTML='<span></span>'.repeat(a)+'<span class="high"></span>'.repeat(b);$('#mix-marker').style.left=((v-10)/20*100)+'%';$('#mix-result').textContent='混合后 '+fmt(v)+'%';$('#mix-formula').textContent=`（10% × ${a} ＋ 30% × ${b}）÷ ${a+b} ＝ ${fmt(v)}%`;
      $('#mix-ratio').textContent=`10%溶液 : 30%溶液＝（30%−混合浓度）:（混合浓度−10%）＝${a}:${b}。${a>b?'低浓度的更多，所以结果靠近10%。':a<b?'高浓度的更多，所以结果靠近30%。':'两份质量相同，混合浓度正好在中间20%。'}这里显示的小数经过四舍五入，比例关系按精确值成立。`;}
    $('#mix-a').addEventListener('input',mixture);$('#mix-b').addEventListener('input',mixture);mixture();
    const explain={background:'背景肯定已有成效，但作者没有在这里结束。只选“线上平台便利群众”，会漏掉后面要解决的问题。',problem:'转折把问题摆出来：老年人可能遇到困难。下一句还提出对策，所以主旨不能只停在问题本身。',point:'“因此”承接问题，落在兼顾老年人需求的服务安排上。抓住主体、问题和对策，才能覆盖文段重点。'};
    $$('.reading-toggle').forEach(b=>b.addEventListener('click',()=>{const type=b.dataset.highlight;$$('.reading-example [data-role]').forEach(s=>s.classList.toggle('highlighted',s.dataset.role===type));$$('.reading-toggle').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));$('#reading-explanation').textContent=explain[type];}));
    $('.reading-reset').addEventListener('click',()=>{$$('.reading-example span').forEach(s=>s.classList.remove('highlighted'));$$('.reading-toggle').forEach(x=>x.setAttribute('aria-pressed','false'));$('#reading-explanation').textContent='先找文段的完整走向：已有成效 → 存在问题 → 提出对策。';});
  }
  if(document.body.dataset.page==='resources'){
    const box=document.createElement('div');box.className='resource-filter';box.innerHTML='<label>按标题、作者或知识点筛选来源<input type="search" placeholder="如：免费视频、混合增长、宪法" id="resource-query"></label><p id="resource-count" class="small muted" aria-live="polite"></p>';$('.page-heading').after(box);const entries=$$('.resource[id]');$('#resource-count').textContent=`共 ${entries.length} 条来源`;
    $('#resource-query').addEventListener('input',e=>{const q=e.target.value.trim().toLowerCase();let n=0;entries.forEach(el=>{const match=el.textContent.toLowerCase().includes(q);el.hidden=!match;if(match)n++;});$$('.resource-terms').forEach(s=>s.open=!!q);$$('.main>section[id]').forEach(s=>s.hidden=!$$('.resource',s).some(r=>!r.hidden));$('#resource-count').textContent=`显示 ${n} / ${entries.length} 条来源`;});
  }
})();
