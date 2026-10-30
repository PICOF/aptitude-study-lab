import {selectQuestions,makePaper,gradePaper,summarizeLessons,sanitizeState,mergeState} from './exam-core.js';

const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const E=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const KEY='aptitude-exams-v1',prefix=document.body.dataset.prefix||'';
const typeNames={single:'单选题',multiple:'多选题',boolean:'判断题'};
const app=$('#exam-app');
let data,state,syncedState,storageOK=true,scope='guoxin',active=null,currentResult=null,resultFilter='all';
let filters={category:'',lesson:'',type:'',wrongOnly:false},limit='20',randomize=true;
const date=t=>new Intl.DateTimeFormat('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'Asia/Shanghai'}).format(t);
const bank=()=>data.banks.find(b=>b.id===scope);
const question=id=>data.questions.find(q=>q.id===id);
const lesson=id=>data.lessons.find(l=>l.id===id);
function announce(message){const box=$('#exam-storage-status')||$('.toast');if(!box)return;box.textContent=message;if(box.classList.contains('toast')){box.classList.add('show');setTimeout(()=>box.classList.remove('show'),3500);}}
function save({replace=false}={}){
  try{
    const remote=JSON.parse(localStorage.getItem(KEY)||'null');
    if(remote?.version&&remote.version!==data.version&&!replace){announce('题库已在其他页面更新，请导出本页记录并刷新后继续。');return false;}
    if(!replace&&syncedState)state=mergeState(syncedState,state,sanitizeState(remote,data.version));
    localStorage.setItem(KEY,JSON.stringify(state));syncedState=structuredClone(state);storageOK=true;
    if(active&&state.attempts[scope]?.id===active.id)active=state.attempts[scope];
  }catch{storageOK=false;}
  if(!storageOK)announce('当前浏览器无法保存记录，请在离开前导出备份。');
  return true;
}
function setScope(value){scope=value;const u=new URL(location.href);u.search='';u.searchParams.set('scope',scope);history.replaceState(null,'',u);}
function choiceOptions(items,selected,placeholder='全部'){return `<option value="">${placeholder}</option>`+items.map(([id,title])=>`<option value="${E(id)}" ${id===selected?'selected':''}>${E(title)}</option>`).join('');}
function getPool(){return selectQuestions(data.questions,{scope,...filters},state.wrong);}
function confirmAction(title,message,label,action){
  const dialog=$('#exam-confirm');$('#exam-confirm-title').textContent=title;$('#exam-confirm-text').textContent=message;$('#exam-confirm-yes').textContent=label;
  $('#exam-confirm-yes').onclick=()=>{dialog.close();action();};$('#exam-cancel').onclick=()=>dialog.close();dialog.showModal();
}
function validAttempt(a){
  if(!data.banks.some(b=>b.id===a.scope)||new Set(a.questionIds).size!==a.questionIds.length)return false;
  return a.questionIds.every(id=>{const q=question(id),order=a.optionOrder[id],answer=a.answers[id]||[];return q&&q.scope===a.scope&&Array.isArray(order)&&order.length===q.options.length&&new Set(order).size===order.length&&order.every(o=>q.options.some(v=>v.id===o))&&Array.isArray(answer)&&new Set(answer).size===answer.length&&answer.every(o=>q.options.some(v=>v.id===o))&&(q.type==='multiple'||answer.length<=1);});
}
function cleanAttempts(){state.history=state.history.filter(validAttempt);for(const [key,a] of Object.entries(state.attempts))if(!validAttempt(a)||key!==a.scope)delete state.attempts[key];state.wrong=state.wrong.filter(id=>question(id));state.read=state.read.filter(id=>lesson(id));}
function refreshRead(){
  $$('[data-read-indicator]').forEach(el=>{const read=state.read.includes(el.dataset.readIndicator);el.textContent=read?'已学完':'未标记学完';el.classList.toggle('is-read',read);});
  $$('[data-mark-read]').forEach(el=>{const read=state.read.includes(el.dataset.markRead);el.textContent=read?'已学完 · 点击撤销':'标记学完';el.setAttribute('aria-pressed',String(read));});
}
function setupCatalogs(){
  $$('[data-catalog]').forEach(section=>{
    const update=()=>{const category=$('[data-category]',section).value,query=$('[data-query]',section).value.trim().toLowerCase();let count=0;
      $$('.exam-lesson-row',section).forEach(row=>{row.hidden=!!(category&&row.dataset.category!==category)||!query.split(/\s+/).every(t=>row.dataset.search.toLowerCase().includes(t));if(!row.hidden)count++;});
      $('[data-catalog-count]',section).textContent=`显示 ${count} 个知识点`;$('[data-empty]',section).hidden=count!==0;};
    $('select',section).addEventListener('change',update);$('input',section).addEventListener('input',update);update();
  });
}
function renderSetup(){
  active=null;currentResult=null;const b=bank(),lessons=data.lessons.filter(l=>l.scope===scope),categories=[...new Set(lessons.map(l=>l.category))];
  if(filters.lesson&&!lessons.some(l=>l.id===filters.lesson))filters.lesson='';
  const pool=getPool(),wrong=data.questions.filter(q=>q.scope===scope&&state.wrong.includes(q.id)).length,draft=state.attempts[scope];
  const records=state.history.filter(a=>a.scope===scope);
  app.innerHTML=`<section class="exam-setup"><div class="exam-scope-buttons" role="group" aria-label="选择独立测试板块">${data.banks.map(b=>`<button class="exam-scope ${b.id===scope?'selected':''}" data-scope="${b.id}" aria-pressed="${b.id===scope}">${E(b.title)}</button>`).join('')}</div><div class="exam-setup-heading"><div><span class="exam-tag">独立题库</span><h2>${E(b.title)}</h2><p>${E(b.subtitle)}</p></div><div class="exam-pool-number"><strong>${data.questions.filter(q=>q.scope===scope).length}</strong><span>道题可反复练习</span></div></div>${draft?`<div class="exam-draft"><div><strong>有一套尚未交卷的练习</strong><span>${draft.questionIds.filter(id=>draft.answers[id]?.length).length} / ${draft.questionIds.length} 题已作答 · ${date(draft.startedAt)} 开始</span></div><button class="button primary small" id="resume-paper">继续答题</button><button class="button secondary small" id="discard-paper">放弃草稿</button></div>`:''}<div class="exam-filters"><label>知识类型<select id="exam-category">${choiceOptions(categories.map(c=>[c,c]),filters.category,'全部类型')}</select></label><label>知识点<select id="exam-lesson">${choiceOptions(lessons.filter(l=>!filters.category||l.category===filters.category).map(l=>[l.id,l.title]),filters.lesson,'全部知识点')}</select></label><label>题型<select id="exam-type">${choiceOptions(Object.entries(typeNames),filters.type,'全部题型')}</select></label><label>本次题量<select id="exam-limit">${[['10','10 题 · 快速检测'],['20','20 题 · 日常练习'],['30','30 题 · 集中训练'],['0','全部题目 · 完整一套']].map(([v,t])=>`<option value="${v}" ${limit===v?'selected':''}>${t}</option>`).join('')}</select></label></div><div class="exam-checks"><label><input type="checkbox" id="exam-random" ${randomize?'checked':''}>打乱题序与选项</label><label><input type="checkbox" id="exam-wrong-only" ${filters.wrongOnly?'checked':''}>只练错题与未答题（${wrong}）</label></div><div class="exam-start-row"><div><strong>当前范围 ${pool.length} 道题</strong><p>本次将练 ${Number(limit)?Math.min(Number(limit),pool.length):pool.length} 题。每题等权，多选须全部选对。</p></div><button class="button primary" id="start-paper" ${pool.length?'':'disabled'}>开始这一套 →</button></div>${!pool.length?'<p class="exam-empty">当前没有匹配的题目。可以扩大范围，或取消“只练错题”。</p>':''}<a class="quiet-link" href="${scope==='current'?'current-affairs.html':`culture.html#catalog-${scope}`}">先回到知识讲解</a></section><section class="exam-history"><div class="section-heading"><h2>${E(b.title)} · 练习记录</h2><span class="small muted">当前浏览器 · 最近 ${records.length} 次</span></div>${records.length?`<div class="exam-history-list">${records.map(a=>{const r=gradePaper(a,data.questions,a.answers);return `<article><span>${date(a.finishedAt)}</span><div><strong>${E(a.title||b.title)}</strong><small>${r.total} 题 · 答对 ${r.correct} 题 · 未答 ${r.unanswered} 题</small></div><b>${r.score}<small>分</small></b><button class="button secondary small" data-review="${E(a.id)}">查看批改</button></article>`;}).join('')}</div>`:'<div class="exam-empty">还没有交卷记录。完成一套后，得分和逐题解析会保存在这里。</div>'}</section>`;
  $$('[data-scope]',app).forEach(el=>el.onclick=()=>{setScope(el.dataset.scope);filters={category:'',lesson:'',type:'',wrongOnly:false};renderSetup();});
  for(const [id,field] of [['exam-category','category'],['exam-lesson','lesson'],['exam-type','type']])$('#'+id).onchange=e=>{filters[field]=e.target.value;if(field==='category')filters.lesson='';renderSetup();};
  $('#exam-limit').onchange=e=>{limit=e.target.value;renderSetup();};$('#exam-random').onchange=e=>randomize=e.target.checked;
  $('#exam-wrong-only').onchange=e=>{filters.wrongOnly=e.target.checked;renderSetup();};
  $('#start-paper').onclick=()=>{const start=()=>startPaper(getPool());if(draft)confirmAction('重新开始一套？','当前板块有未交卷草稿，开始新试卷会替换它。已交卷记录保留。','替换草稿并开始',start);else start();};
  if(draft){$('#resume-paper').onclick=()=>{active=draft;renderPractice(true);};$('#discard-paper').onclick=()=>confirmAction('放弃这套草稿？','这套尚未交卷的答案将被移除，练习记录和错题仍保留。','放弃草稿',()=>{delete state.attempts[scope];save();renderSetup();});}
  $$('[data-review]').forEach(el=>el.onclick=()=>{resultFilter='all';showResult(state.history.find(a=>a.id===el.dataset.review&&a.scope===scope));});
}
function startPaper(pool,settings={}){
  const paper=settings.paper?structuredClone(settings.paper):makePaper(pool,{limit:Number(limit),shuffle:randomize});
  const title=filters.lesson?lesson(filters.lesson)?.title:filters.category||bank().title;
  active={...paper,id:crypto.randomUUID(),scope,title:settings.title||title,answers:{},marked:[],position:0,startedAt:Date.now()};
  state.attempts[scope]=active;save();renderPractice(true);
}
function renderPractice(focus=false){
  active.position=Math.max(0,Math.min(active.position||0,active.questionIds.length-1));
  const id=active.questionIds[active.position],q=question(id),order=active.optionOrder[id];
  app.innerHTML=`<section class="exam-practice"><div class="exam-practice-top"><div><span class="exam-tag">${E(bank().title)} · ${E(active.title)}</span><h2>把答案交给自己。</h2></div><button class="button secondary small" id="leave-paper">保存并返回</button></div><div class="exam-progress-label"><span id="exam-answered"></span><span>${storageOK?'每次选择自动保存':'当前浏览器无法自动保存'}</span></div><div class="progress-track"><span id="exam-progress"></span></div><div class="exam-paper-layout"><div><article class="exam-question"><div class="exam-question-meta"><span>${typeNames[q.type]} · ${E(q.variant)}</span><button id="mark-question" class="exam-mark" aria-pressed="${active.marked?.includes(id)||false}">${active.marked?.includes(id)?'已标记':'标记待复查'}</button></div><h3 id="exam-stem" tabindex="-1"><span>${String(active.position+1).padStart(2,'0')}.</span> ${E(q.stem)}</h3><p class="exam-choice-help">${q.type==='multiple'?'有多个正确选项；全部选对才得分。':'请选择一个答案。'}</p><fieldset class="exam-options"><legend class="sr-only">第 ${active.position+1} 题的选项</legend>${order.map((oid,i)=>{const o=q.options.find(o=>o.id===oid),checked=active.answers[id]?.includes(oid);return `<label class="exam-option ${checked?'checked':''}"><input type="${q.type==='multiple'?'checkbox':'radio'}" name="question-answer" value="${oid}" ${checked?'checked':''}><span class="exam-option-letter">${String.fromCharCode(65+i)}</span><span>${E(o.text)}</span></label>`;}).join('')}</fieldset><button class="exam-clear" id="clear-answer">清除本题选择</button></article><div class="exam-pagination"><button class="button secondary" id="prev-question" ${active.position===0?'disabled':''}>上一题</button><span>${active.position+1} / ${active.questionIds.length}</span><button class="button primary" id="next-question">${active.position===active.questionIds.length-1?'检查并交卷':'下一题 →'}</button></div></div><aside class="exam-answer-card"><h3>答题卡</h3><p>蓝色已答 · 圆点待复查</p><div class="exam-number-grid">${active.questionIds.map((qid,i)=>`<button data-jump="${i}" class="${i===active.position?'current ':''}${active.answers[qid]?.length?'answered ':''}${active.marked?.includes(qid)?'marked':''}" aria-label="第${i+1}题${active.answers[qid]?.length?'，已答':'，未答'}${active.marked?.includes(qid)?'，待复查':''}" ${i===active.position?'aria-current="step"':''}>${i+1}</button>`).join('')}</div><button class="button primary" id="submit-paper">提交整套并批改</button><small>交卷前不展示正确答案</small></aside></div></section>`;
  updateProgress();
  $$('.exam-options input').forEach(input=>input.onchange=()=>{active.answers[id]=$$('.exam-options input:checked').map(e=>e.value);$$('.exam-option').forEach(el=>el.classList.toggle('checked',$('input',el).checked));if(persistActive())updateProgress();});
  $('#mark-question').onclick=()=>{active.marked=active.marked||[];active.marked=active.marked.includes(id)?active.marked.filter(x=>x!==id):[...active.marked,id];if(!persistActive())return;renderPractice();$('#mark-question').focus();};
  $('#clear-answer').onclick=()=>{delete active.answers[id];if(!persistActive())return;renderPractice();$('#clear-answer').focus();};
  const go=n=>{active.position=n;if(!persistActive())return;renderPractice(true);};
  $('#prev-question').onclick=()=>go(active.position-1);$('#next-question').onclick=()=>active.position===active.questionIds.length-1?submitPaper():go(active.position+1);
  $$('[data-jump]').forEach(el=>el.onclick=()=>go(Number(el.dataset.jump)));$('#submit-paper').onclick=submitPaper;
  $('#leave-paper').onclick=()=>{if(!persistActive())return;renderSetup();app.scrollIntoView({block:'start'});};
  if(focus)$('#exam-stem').focus({preventScroll:false});
}
function persistActive(){state.attempts[scope]=active;if(!save())return false;if(state.attempts[scope]?.id!==active.id){active=null;renderSetup();announce('此板块的草稿已在另一页面交卷或更新，请从最新记录继续。');return false;}return true;}
function updateProgress(){const count=active.questionIds.filter(id=>active.answers[id]?.length).length;$('#exam-answered').textContent=`已答 ${count} / ${active.questionIds.length} 题`;$('#exam-progress').style.width=`${count/active.questionIds.length*100}%`;$$('[data-jump]').forEach(el=>{const id=active.questionIds[Number(el.dataset.jump)],answered=!!active.answers[id]?.length;el.classList.toggle('answered',answered);el.setAttribute('aria-label',`第${Number(el.dataset.jump)+1}题，${answered?'已答':'未答'}${active.marked?.includes(id)?'，待复查':''}`);});}
function submitPaper(){
  const unanswered=active.questionIds.filter(id=>!active.answers[id]?.length).length,marked=active.marked?.length||0;
  confirmAction(unanswered?`还有 ${unanswered} 题未作答`:'这套题已经全部作答',`${unanswered?'未答题将按0分计入结果和错题本。':'提交后将展示得分、薄弱知识点和逐题解析。'}${marked?` 另有 ${marked} 题标记待复查。`:''}交卷后可重新练习。`,'确认交卷并批改',()=>{
    const attempt={...active,finishedAt:Date.now()},result=gradePaper(attempt,data.questions,attempt.answers);
    const wrong=new Set(state.wrong);for(const row of result.rows){if(row.correct)wrong.delete(row.id);else wrong.add(row.id);}state.wrong=[...wrong];
    state.history=[attempt,...state.history].slice(0,50);delete state.attempts[scope];save();active=null;resultFilter='all';showResult(attempt);
  });
}
function answerText(q,ids,order){return ids.length?ids.map(id=>`${String.fromCharCode(65+order.indexOf(id))}. ${q.options.find(o=>o.id===id)?.text||''}`).join('；'):'未作答';}
function showResult(attempt){
  if(!attempt||attempt.scope!==scope){renderSetup();announce('该记录不属于当前板块，请重新选择。');return;}
  currentResult=attempt;const result=gradePaper(attempt,data.questions,attempt.answers),weak=summarizeLessons(result,data.questions).filter(s=>s.correct<s.total);
  const wrongRows=result.rows.filter(r=>!r.correct),elapsed=Math.max(1,Math.round((attempt.finishedAt-attempt.startedAt)/60000));
  app.innerHTML=`<section class="exam-results"><div class="exam-result-hero"><div><span class="exam-tag">${E(bank().title)} · 本次批改</span><h2 tabindex="-1" id="exam-result-heading">${result.score===100?'这一套，全部答对。':result.score>=80?'记住大部分，再补几个易混点。':'找到薄弱点，就是下一步的方向。'}</h2><p>${date(attempt.finishedAt)} · ${E(attempt.title)} · 历时约 ${elapsed} 分钟（含离开时间）</p></div><div class="exam-score"><strong>${result.score}</strong><span>/ 100 分</span></div></div><div class="exam-result-stats"><span><b>${result.correct}</b> 答对</span><span><b>${result.total-result.correct-result.unanswered}</b> 答错</span><span><b>${result.unanswered}</b> 未答</span><span><b>${result.total}</b> 总题数</span></div><div class="exam-action-row exam-result-actions"><button class="button primary" id="retry-same">重做这一套</button><button class="button secondary" id="retry-wrong" ${wrongRows.length?'':'disabled'}>只练本次错题（${wrongRows.length}）</button><button class="button secondary" id="new-paper">返回组卷与记录</button></div><section class="exam-weak"><h3>下一轮，优先补这些知识点</h3>${weak.length?`<div class="exam-weak-list">${weak.map(s=>`<a href="learn/exam-${s.id}.html"><span>${E(lesson(s.id)?.title)}</span><b>${s.correct} / ${s.total} 答对</b><span>回看讲解 →</span></a>`).join('')}</div>`:'<p>本套覆盖的知识点全部答对。可以返回组卷，扩大范围或换一批题检验理解。</p>'}</section><section class="exam-review"><div class="section-heading"><h3>逐题批改与解析</h3><div class="exam-review-tabs"><button data-result-filter="all" aria-pressed="${resultFilter==='all'}">全部 ${result.total}</button><button data-result-filter="wrong" aria-pressed="${resultFilter==='wrong'}">错题与未答 ${wrongRows.length}</button></div></div>${result.rows.filter(r=>resultFilter==='all'||!r.correct).map(row=>{
    const q=question(row.id),order=attempt.optionOrder[row.id],i=attempt.questionIds.indexOf(row.id);
    return `<details class="exam-review-item ${row.correct?'correct':'incorrect'}" ${row.correct?'':'open'}><summary><span class="exam-review-status">${row.correct?'答对':row.unanswered?'未答':'答错'}</span><span>${i+1}. ${E(q.stem)}</span></summary><div class="exam-review-body"><p class="small muted">${typeNames[q.type]} · ${E(q.variant)}</p><ol class="exam-review-options" type="A">${order.map(id=>`<li class="${q.answer.includes(id)?'right-option':''}">${E(q.options.find(o=>o.id===id).text)}${q.answer.includes(id)?' <strong>正确选项</strong>':''}</li>`).join('')}</ol><div class="exam-answer-compare"><p><b>你的答案</b> ${E(answerText(q,row.selected,order))}</p><p><b>正确答案</b> ${E(answerText(q,q.answer,order))}</p></div><p class="exam-explanation"><b>为什么这样选</b><br>${E(q.explanation)}</p><div class="exam-review-links">${q.lessonIds.map(id=>`<a href="learn/exam-${id}.html">回看：${E(lesson(id)?.title)}</a>`).join('')}${q.sourceIds.map(id=>`<a href="exam-sources.html#${id}" target="_blank" rel="noopener">原文依据 ↗</a>`).join('')}</div></div></details>`;
  }).join('')||'<p class="exam-empty">这套没有错题或未答题。</p>'}</section></section>`;
  const run=(qs,settings)=>{const action=()=>startPaper(qs,settings);if(state.attempts[scope])confirmAction('开始复练？','此板块还有未交卷草稿，复练会替换该草稿。已交卷记录保留。','替换草稿并复练',action);else action();};
  $('#retry-same').onclick=()=>run(attempt.questionIds.map(question),{paper:{questionIds:attempt.questionIds,optionOrder:attempt.optionOrder},title:attempt.title});
  $('#retry-wrong').onclick=()=>run(wrongRows.map(r=>question(r.id)),{paper:makePaper(wrongRows.map(r=>question(r.id)),{shuffle:true}),title:`${attempt.title} · 错题复练`});
  $('#new-paper').onclick=()=>{renderSetup();app.scrollIntoView({block:'start'});};
  $$('[data-result-filter]').forEach(el=>el.onclick=()=>{resultFilter=el.dataset.resultFilter;showResult(attempt);$('.exam-review').scrollIntoView({block:'start'});});
  $('#exam-result-heading').focus({preventScroll:true});
}
function setupBackup(){
  $('#export-exam').onclick=()=>{const blob=new Blob([JSON.stringify({app:'aptitude-exams',...state},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`企业文化时政-学习记录-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);announce('学习记录已导出。');};
  $('#import-exam').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{
    if(file.size>5000000)throw new Error('文件过大，请使用本站导出的记录。');const raw=JSON.parse(await file.text());
    if(raw.app!=='aptitude-exams'||raw.version!==data.version)throw new Error('记录格式或题库版本不匹配，未覆盖当前记录。');
    const imported=sanitizeState(raw,data.version);if(imported.history.length!==(raw.history?.length||0)||Object.keys(imported.attempts).length!==Object.keys(raw.attempts||{}).length||!imported.history.every(validAttempt)||!Object.values(imported.attempts).every(validAttempt))throw new Error('记录中的试卷数据不完整，未覆盖当前记录。');
    confirmAction('导入学习记录？',`将用文件中的 ${imported.history.length} 次交卷记录和草稿替换当前浏览器的专题记录。建议先导出当前记录备份。`,'确认导入',()=>{state=imported;cleanAttempts();save({replace:true});renderSetup();announce('学习记录已导入。');});
  }catch(error){announce(error.message||'无法读取该记录文件。');}finally{e.target.value='';}};
}
async function init(){
  setupCatalogs();
  try{const response=await fetch(prefix+'assets/exam-data.json');if(!response.ok)throw new Error('题库文件加载失败');data=await response.json();
    let raw=null;try{raw=JSON.parse(localStorage.getItem(KEY)||'null');if(raw?.version&&raw.version!==data.version)localStorage.setItem(KEY+'-previous',JSON.stringify(raw));}catch{storageOK=false;}
    state=sanitizeState(raw,data.version);cleanAttempts();syncedState=structuredClone(state);if(raw?.version&&raw.version!==data.version)save({replace:true});refreshRead();
    $$('[data-mark-read]').forEach(el=>el.onclick=()=>{const id=el.dataset.markRead;state.read=state.read.includes(id)?state.read.filter(x=>x!==id):[...state.read,id];save();refreshRead();});
    if(!app)return;const params=new URLSearchParams(location.search);scope=data.banks.some(b=>b.id===params.get('scope'))?params.get('scope'):'guoxin';
    const requestedLesson=data.lessons.find(l=>l.id===params.get('lesson')&&l.scope===scope);if(requestedLesson){filters.lesson=requestedLesson.id;filters.category=requestedLesson.category;limit='0';}
    renderSetup();setupBackup();if(raw?.version&&raw.version!==data.version)announce('题库已更新，已启用新版练习记录；上一版本记录保留在本机归档键中。');if(!storageOK)announce('无法读取浏览器存储，本次仍可练习，请及时导出记录。');
  }catch(error){if(app)app.innerHTML=`<div class="notice"><h2>题库暂时没有载入</h2><p>请刷新重试，或先阅读知识点。${E(error.message)}</p><button class="button primary" id="retry-load">重新载入</button></div>`;if($('#retry-load'))$('#retry-load').onclick=()=>location.reload();}
}
init();
