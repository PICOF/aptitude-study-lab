import test from 'node:test';
import assert from 'node:assert/strict';
import { selectQuestions, makePaper, gradePaper, summarizeLessons, sanitizeState, mergeState } from '../public/exam-core.js';
const questions = [
  {id:'q1',scope:'guoxin',category:'文化',lessonIds:['l1'],type:'single',options:[{id:'a'},{id:'b'}],answer:['b']},
  {id:'q2',scope:'guoxin',category:'文化',lessonIds:['l1','l2'],type:'multiple',options:[{id:'a'},{id:'b'},{id:'c'}],answer:['a','c']},
  {id:'q3',scope:'current',category:'政策',lessonIds:['l3'],type:'boolean',options:[{id:'a'},{id:'b'}],answer:['b']},
];
test('企业、分类、知识点、题型与错题筛选不会跨范围',()=>{
  assert.deepEqual(selectQuestions(questions,{scope:'guoxin',lesson:'l2'}).map(q=>q.id),['q2']);
  assert.equal(selectQuestions(questions,{scope:'guoxin',category:'政策'}).length,0);
  assert.equal(selectQuestions(questions,{scope:'guoxin',type:'multiple'}).length,1);
  assert.deepEqual(selectQuestions(questions,{scope:'guoxin',wrongOnly:true},['q2','q3']).map(q=>q.id),['q2']);
});
test('判分严格区分漏选、错选、全选、正确与未答',()=>{
  const paper=makePaper(questions,{shuffle:false,limit:0});
  assert.equal(gradePaper(paper,questions,{q1:['b'],q2:['c','a'],q3:['b']}).score,100);
  for(const chosen of [['a'],['a','b','c'],['a','a','c'],['x']]){
    const r=gradePaper(paper,questions,{q1:['b'],q2:chosen});
    assert.equal(r.correct,1);assert.equal(r.unanswered,1);assert.equal(r.total,3);
  }
  const blank=gradePaper(paper,questions,{});assert.equal(blank.score,0);assert.equal(blank.unanswered,3);
});
test('洗牌只改变位置不改变选项标识，限制题量且不重复',()=>{
  const paper=makePaper(questions,{limit:2,shuffle:true,random:()=>0});
  assert.equal(paper.questionIds.length,2);assert.equal(new Set(paper.questionIds).size,2);
  for(const id of paper.questionIds)assert.deepEqual([...paper.optionOrder[id]].sort(),questions.find(q=>q.id===id).options.map(o=>o.id).sort());
  const answers=Object.fromEntries(questions.map(q=>[q.id,q.answer]));
  assert.equal(gradePaper(paper,questions,answers).score,100);
  assert.deepEqual(questions[0].options.map(o=>o.id),['a','b']);
});
test('知识点统计包括未答，复习薄弱点有依据',()=>{
  const result=gradePaper(makePaper(questions,{shuffle:false}),questions,{q1:['b']});
  const stats=summarizeLessons(result,questions);
  assert.deepEqual(stats.find(s=>s.id==='l1'),{id:'l1',total:2,correct:1});
  assert.deepEqual(stats.find(s=>s.id==='l3'),{id:'l3',total:1,correct:0});
});
test('空卷与已删除试题不能静默产生分数',()=>{
  assert.throws(()=>makePaper([]));
  assert.throws(()=>gradePaper({questionIds:['missing']},questions,{}));
});
test('损坏或不同题库版本的浏览器记录不被恢复',()=>{
  assert.deepEqual(sanitizeState(null,'v1'),{version:'v1',attempts:{},history:[],wrong:[],read:[]});
  assert.equal(sanitizeState({version:'v0',attempts:{guoxin:{}},history:[],wrong:['q1'],read:[]},'v1').wrong.length,0);
  assert.equal(sanitizeState({version:'v1',attempts:[],history:'bad',wrong:[4,'q1'],read:['l1']},'v1').wrong.join(','),'q1');
});
test('导入记录的定位和标记字段必须归一化，避免恢复时崩溃',()=>{
  const a={id:'attempt',scope:'guoxin',questionIds:['q1'],answers:{},optionOrder:{q1:['a','b']},startedAt:1,position:'invalid',marked:{broken:true}};
  const restored=sanitizeState({version:'v1',attempts:{guoxin:a}},'v1');
  assert.equal(restored.attempts.guoxin.position,0);
  assert.deepEqual(restored.attempts.guoxin.marked,[]);
});
test('无效日期不能通过导入后破坏整个成绩页',()=>{
  const a={id:'bad',scope:'guoxin',questionIds:['q1'],answers:{},optionOrder:{q1:['a','b']},startedAt:1e100,finishedAt:1e100};
  const restored=sanitizeState({version:'v1',attempts:{guoxin:a},history:[a]},'v1');
  assert.deepEqual(restored.attempts,{});assert.deepEqual(restored.history,[]);
});
test('两页并行学习与答题不会互相删除记录',()=>{
  const before=sanitizeState(null,'v1'),a={id:'a1',scope:'guoxin',questionIds:['q1'],answers:{q1:['b']},optionOrder:{q1:['a','b']},startedAt:1};
  const remote={...structuredClone(before),attempts:{guoxin:a},wrong:['q2']};
  const local={...structuredClone(before),read:['l1']};
  const merged=mergeState(before,local,remote);
  assert.equal(merged.attempts.guoxin.id,'a1');assert.deepEqual(merged.read,['l1']);assert.deepEqual(merged.wrong,['q2']);
  const finished={...structuredClone(merged),attempts:{},history:[{...a,finishedAt:2}],wrong:[]};
  const further={...structuredClone(merged),read:['l1','l2']};
  const next=mergeState(merged,finished,further);
  assert.deepEqual(next.attempts,{});assert.equal(next.history.length,1);assert.deepEqual(next.read,['l1','l2']);assert.deepEqual(next.wrong,[]);
});
test('导入不一致板块映射与重复交卷ID会被筛掉',()=>{
  const a={id:'same',scope:'guoxin',questionIds:['q1'],answers:{},optionOrder:{q1:['a','b']},startedAt:1,finishedAt:2};
  const restored=sanitizeState({version:'v1',attempts:{cosco:a},history:[a,{...a,scope:'cosco'}]},'v1');
  assert.deepEqual(restored.attempts,{});assert.equal(restored.history.length,1);
});
test('另一页已交卷或重新组卷后，旧草稿不能再次覆盖新状态',()=>{
  const before=sanitizeState(null,'v1'),a={id:'a1',scope:'guoxin',questionIds:['q1'],answers:{},optionOrder:{q1:['a','b']},startedAt:1};
  before.attempts.guoxin=a;const local=structuredClone(before);local.attempts.guoxin.answers.q1=['b'];
  const remote=structuredClone(before);remote.attempts.guoxin={...a,id:'a2'};
  assert.equal(mergeState(before,local,remote).attempts.guoxin.id,'a2');
  delete remote.attempts.guoxin;assert.deepEqual(mergeState(before,local,remote).attempts,{});
});
