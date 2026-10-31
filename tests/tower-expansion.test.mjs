import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import {loadExams,renderExams} from '../scripts/exams.mjs';
import {selectQuestions,makePaper,gradePaper,sanitizeState,mergeState} from '../public/exam-core.js';
import {createFocusView,focusChapterHref,resolveChapterNavigation} from '../public/exam-focus.js';

const files=new Map(),contexts=new Map();
renderExams({page:(title,body,opts)=>{contexts.set(title,opts);return body;},write:(name,body)=>files.set(name,body),render:s=>s,esc:s=>String(s)});
const data=JSON.parse(files.get('assets/exam-data.json')),focus=createFocusView(data);
const draft=(scope)=>{const qs=data.questions.filter(q=>q.scope===scope).slice(0,3);return {...makePaper(qs,{shuffle:false}),id:'draft-'+scope,title:scope,scope,answers:{[qs[0].id]:qs[0].answer},startedAt:1,position:1,marked:[]};};

test('新增内容不修改原有三库，版本迁移依据确为原发布内容',()=>{
  const original=loadExams().filter(b=>['guoxin','cosco','current'].includes(b.id));
  const hash=crypto.createHash('sha256').update(JSON.stringify(original)).digest('hex').slice(0,12);
  assert.equal(hash,'908424273982');assert(data.compatibleVersions.includes(hash));assert.notEqual(data.version,hash);
  const paper=draft('guoxin'),finished={...paper,id:'finished',finishedAt:2};
  const state=sanitizeState({version:hash,attempts:{guoxin:paper},history:[finished],wrong:[paper.questionIds[1]],read:['gx-core-01']},data.version,data.compatibleVersions);
  assert.equal(state.version,data.version);assert.deepEqual(state.attempts.guoxin,paper);assert.equal(state.history[0].id,'finished');
  assert.deepEqual(state.wrong,[paper.questionIds[1]]);assert.deepEqual(state.read,['gx-core-01']);
  assert.equal(sanitizeState({...state,version:'unknown'},data.version,data.compatibleVersions).history.length,0);
});
test('铁塔文化与AI专业组卷隔离，所有新增题均能按答案评分',()=>{
  for(const scope of ['tower','tower-ai']){
    const qs=selectQuestions(focus.questions,{scope});assert(qs.length>20);assert(qs.every(q=>q.origin==='original'));
    const paper=makePaper(qs,{shuffle:true,random:()=>.31}),answers=Object.fromEntries(qs.map(q=>[q.id,q.answer]));
    assert.equal(gradePaper(paper,data.questions,answers).score,100);assert.equal(gradePaper(paper,data.questions,{}).score,0);
    for(const l of focus.lessons.filter(l=>l.scope===scope))assert(selectQuestions(focus.questions,{scope,lesson:l.id}).length>=3);
  }
  assert.equal(selectQuestions(focus.questions,{scope:'tower',lesson:'tai-01'}).length,0);
  assert.equal(selectQuestions(focus.questions,{scope:'tower-ai',wrongOnly:true},['tt-q001','tai-q001']).length,1);
});
test('新专业草稿与其他板块可并存，跨页保存不会丢掉另一份草稿',()=>{
  const empty=sanitizeState(null,data.version),local=structuredClone(empty),remote=structuredClone(empty);
  local.attempts['tower-ai']=draft('tower-ai');remote.attempts.tower=draft('tower');remote.attempts.guoxin=draft('guoxin');
  const merged=sanitizeState(mergeState(empty,local,remote),data.version);
  assert.deepEqual(Object.keys(merged.attempts).sort(),['guoxin','tower','tower-ai']);
  const before=structuredClone(merged),answering=structuredClone(before),reading=structuredClone(before);
  answering.attempts['tower-ai'].position=2;reading.read.push('tt-01');
  const result=mergeState(before,answering,reading);assert.equal(result.attempts['tower-ai'].position,2);assert.deepEqual(result.read,['tt-01']);
});
test('专业章节、旧参考、解析回链与搜索均进入专业栏目',()=>{
  assert(files.get('professional.html').includes('professional-tower-ai.html'));assert(!files.get('culture.html').includes('catalog-tower-ai'));
  assert(files.get('culture.html').includes('culture-tower.html'));assert(files.get('professional-tower-ai.html').includes('scope=tower-ai'));
  assert.equal(contexts.get('中国铁塔 · 人工智能 · 专业知识').active,'professional');
  assert(files.get('learn/exam-tai-01.html').includes('../professional-tower-ai.html#tai-01'));
  assert.equal(focusChapterHref(data,'tai-01','tower-ai'),'professional-tower-ai.html#tai-01');
  assert.equal(focusChapterHref(data,'tt-01','tower'),'culture-tower.html#tt-01');
  assert.deepEqual(resolveChapterNavigation(data,'/professional-tower-ai.html','#tai-01'),{action:'none',id:'tai-01'});
});
test('历年材料保留笔试/面试区别与题干缺失，不把回忆片段计入原题库',()=>{
  const evidence=JSON.parse(fs.readFileSync(new URL('../content/tower-evidence.json',import.meta.url),'utf8'));
  assert(evidence.sources.some(s=>s.kind.includes('面试分享')&&s.limit.includes('不能')));
  assert(evidence.sources.some(s=>s.kind.includes('全文未核')));
  assert(evidence.fragments.every(f=>f.missing&&f.sourceId));
  assert(!data.questions.some(q=>evidence.fragments.some(f=>f.quote===q.stem)));
  assert(files.get('tower-evidence.html').includes('不参加计分'));
});
