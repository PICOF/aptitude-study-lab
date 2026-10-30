import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {selectQuestions, makePaper, gradePaper, summarizeLessons, sanitizeState} from '../public/exam-core.js';
import {createFocusView, resolveFocusLesson, focusChapterHref, retiredQuestionIds, resolveChapterNavigation} from '../public/exam-focus.js';

const lessons=[
  {id:'gx-old-1',scope:'guoxin',category:'旧分类',title:'使命'},
  {id:'gx-old-2',scope:'guoxin',category:'旧分类',title:'愿景'},
  {id:'gx-retired',scope:'guoxin',category:'业务',title:'业务详情'},
  {id:'co-old',scope:'cosco',category:'文化',title:'中远使命'},
  {id:'cu-old',scope:'current',category:'时政',title:'政策'},
];
const makeQuestion=(id,scope,lessonIds)=>({id,scope,lessonIds,category:'旧分类',type:'single',options:[{id:'a',text:'甲'},{id:'b',text:'乙'}],answer:['b']});
const data={version:'same-version',lessons,questions:[
  makeQuestion('g1','guoxin',['gx-old-1']),makeQuestion('g2','guoxin',['gx-old-1','gx-old-2']),
  makeQuestion('g3','guoxin',['gx-retired']),makeQuestion('c1','cosco',['co-old']),makeQuestion('u1','current',['cu-old']),
],study:{lessons:[
  {id:'gx-core-01',scope:'guoxin',category:'核心文化',title:'使命与愿景'},
  {id:'co-core-01',scope:'cosco',category:'核心文化',title:'中远使命'},
  {id:'cu-core-01',scope:'current',category:'政策摘要',title:'政策摘要'},
],questionIds:['g1','g2','c1','u1'],lessonMap:{'gx-old-1':'gx-core-01','gx-old-2':'gx-core-01','co-old':'co-core-01','cu-old':'cu-core-01'}}};

test('默认题池只包含精简题，按合并后的知识点筛选且不跨企业',()=>{
  const before=structuredClone(data),focus=createFocusView(data);
  assert.deepEqual(selectQuestions(focus.questions,{scope:'guoxin',lesson:'gx-core-01',category:'核心文化'}).map(q=>q.id),['g1','g2']);
  assert.deepEqual(selectQuestions(focus.questions,{scope:'cosco',lesson:'gx-core-01'}),[]);
  assert.deepEqual(selectQuestions(focus.questions,{scope:'guoxin',wrongOnly:true},['g2','g3','c1']).map(q=>q.id),['g2']);
  assert.deepEqual(focus.questions.find(q=>q.id==='g2').lessonIds,['gx-core-01']);
  assert.deepEqual(data,before,'映射不能改写保留用于旧卷批改的原题');
});

test('薄弱点合并同一知识点但保留未映射旧题，不重复统计同一题',()=>{
  const focus=createFocusView(data),paper=makePaper(data.questions.slice(0,3),{shuffle:false});
  const result=gradePaper(paper,data.questions,{g1:['b']});
  assert.deepEqual(summarizeLessons(result,focus.reviewQuestions).sort((a,b)=>a.id.localeCompare(b.id)),[
    {id:'gx-core-01',total:2,correct:1},{id:'gx-retired',total:1,correct:0},
  ]);
});

test('旧课程链接映射到精简分组，退出范围与其他企业链接明确区分',()=>{
  assert.equal(resolveFocusLesson(data,'gx-old-2','guoxin').lesson.id,'gx-core-01');
  assert.equal(resolveFocusLesson(data,'gx-core-01','guoxin').status,'active');
  assert.equal(resolveFocusLesson(data,'gx-retired','guoxin').status,'retired');
  assert.equal(resolveFocusLesson(data,'co-old','guoxin').status,'other-scope');
  assert.equal(resolveFocusLesson(data,'missing','guoxin').status,'unknown');
  assert.equal(focusChapterHref(data,'gx-old-1','guoxin'),'culture-guoxin.html#gx-core-01');
  assert.equal(focusChapterHref(data,'gx-retired','guoxin'),'learn/exam-gx-retired.html');
  assert.equal(focusChapterHref(data,'cu-core-01','current','../'),'../current-affairs.html#cu-core-01');
  assert.equal(focusChapterHref(data,'','cosco'),'culture-cosco.html');
});

test('公司章节旧锚点映射新分组，退出范围的锚点转入旧参考页',()=>{
  assert.deepEqual(resolveChapterNavigation(data,'/aptitude-study-lab/culture-guoxin.html','#gx-old-1'),{action:'replace-hash',id:'gx-core-01'});
  assert.deepEqual(resolveChapterNavigation(data,'/culture-guoxin.html','#gx-retired'),{action:'redirect',id:'gx-retired',href:'learn/exam-gx-retired.html'});
  assert.deepEqual(resolveChapterNavigation(data,'/culture-guoxin.html','#gx-core-01'),{action:'none',id:'gx-core-01'});
  assert.deepEqual(resolveChapterNavigation(data,'/culture-cosco.html','#gx-old-1'),{action:'none',id:'gx-old-1'});
});

test('时政同名映射与旧参考页不会触发替换循环，损坏锚点保持可用',()=>{
  const unchanged=structuredClone(data);
  unchanged.study.lessons[2]={...unchanged.study.lessons[2],id:'cu-old'};
  unchanged.study.lessonMap['cu-old']='cu-old';
  assert.deepEqual(resolveChapterNavigation(unchanged,'/current-affairs.html','#cu-old'),{action:'none',id:'cu-old'});
  assert.deepEqual(resolveChapterNavigation(data,'/learn/exam-gx-retired.html','#gx-retired','../'),{action:'none',id:'gx-retired'});
  assert.deepEqual(resolveChapterNavigation(data,'/culture-guoxin.html','#%broken'),{action:'none',id:''});
});

test('映射配置不可把一家企业的题目挂到另一家课程',()=>{
  const broken=structuredClone(data);broken.study.lessonMap['gx-old-1']='co-core-01';
  const focus=createFocusView(broken);
  assert.deepEqual(selectQuestions(focus.questions,{scope:'guoxin',lesson:'co-core-01'}),[]);
  assert.deepEqual(focus.reviewQuestions.find(q=>q.id==='g1').lessonIds,['gx-old-1']);
  assert.equal(resolveFocusLesson(broken,'gx-old-1','guoxin').status,'retired');
});

test('旧卷中的退出题可明确计数，原课程与新课程阅读标记都被接受',()=>{
  const focus=createFocusView(data);
  assert.deepEqual(retiredQuestionIds({questionIds:['g1','g3']},focus),['g3']);
  assert.ok(focus.knownLessonIds.has('gx-old-1'));
  assert.ok(focus.knownLessonIds.has('gx-core-01'));
  assert.ok(focus.knownLessonIds.has('gx-retired'));
  assert.equal(focus.knownLessonIds.has('missing'),false);
});

test('尚未带study的历史数据继续使用原范围；空study不回退到全部题',()=>{
  const old={...data};delete old.study;
  assert.equal(createFocusView(old).questions.length,5);
  assert.equal(resolveFocusLesson(old,'gx-old-1','guoxin').status,'active');
  assert.equal(focusChapterHref(old,'gx-old-1','guoxin'),'culture-guoxin.html#gx-old-1');
  const empty={...data,study:{lessons:[],questionIds:[],lessonMap:{}}};
  assert.equal(createFocusView(empty).questions.length,0);
});

test('真实60题旧卷在默认缩为1题后仍可完整恢复、批改与整套重做',()=>{
  const original=JSON.parse(fs.readFileSync(new URL('../content/exam-guoxin.json',import.meta.url),'utf8').replace(/^\uFEFF/,''));
  const fullQuestions=original.questions.map(q=>({...q,scope:'guoxin'}));
  const fullLessons=original.lessons.map(l=>({...l,scope:'guoxin'}));
  const narrowed={version:'unchanged',lessons:fullLessons,questions:fullQuestions,study:{
    lessons:[{id:'gx-core-01',scope:'guoxin',category:'身份',title:'企业身份'}],questionIds:['gx-q001'],lessonMap:{'gx-01':'gx-core-01'},
  }};
  const paper=makePaper(fullQuestions,{shuffle:false}),answers=Object.fromEntries(fullQuestions.map(q=>[q.id,q.answer]));
  const attempt={...paper,id:'legacy-attempt',scope:'guoxin',answers,startedAt:1,finishedAt:2};
  const state=sanitizeState({version:'unchanged',attempts:{guoxin:{...attempt,finishedAt:undefined}},history:[attempt],wrong:['gx-q060'],read:['gx-20']},'unchanged');
  const focus=createFocusView(narrowed);
  assert.equal(focus.questions.length,1);
  assert.equal(state.attempts.guoxin.questionIds.length,60);
  assert.equal(gradePaper(state.history[0],narrowed.questions,state.history[0].answers).score,100);
  assert.equal(retiredQuestionIds(attempt,focus).length,59);
  const replay=makePaper(attempt.questionIds.map(id=>narrowed.questions.find(q=>q.id===id)),{shuffle:false});
  assert.equal(replay.questionIds.length,60);
  assert.equal(gradePaper(replay,narrowed.questions,answers).total,60);
});
