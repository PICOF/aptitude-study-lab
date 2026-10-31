import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {loadExams,renderExams} from '../scripts/exams.mjs';
import {compatibleExamVersions} from '../scripts/exam-compatibility.mjs';
import {makeCoveragePaper,gradePaper,sanitizeState} from '../public/exam-core.js';
const banks=loadExams(),bank=banks.find(b=>b.id==='tower-ai');
const files=new Map();renderExams({page:(_,body)=>body,write:(n,b)=>files.set(n,b),render:s=>s,esc:s=>String(s)});
const data=JSON.parse(files.get('assets/exam-data.json'));

test('上一版铁塔59题与其他库的全部题目逐字段保留，修改旧答案不能宣告兼容',()=>{
  assert(compatibleExamVersions(banks).includes('5e49a154752e'));
  const changed=structuredClone(banks);changed.find(b=>b.id==='tower-ai').questions[0].explanation+=' changed';
  assert(!compatibleExamVersions(changed).includes('5e49a154752e'));
  const oldIds=bank.questions.slice(0,59).map(q=>q.id);
  const paper={id:'old-tower-ai',scope:'tower-ai',title:'旧版59题',startedAt:1,finishedAt:2,questionIds:oldIds,answers:{},optionOrder:Object.fromEntries(bank.questions.slice(0,59).map(q=>[q.id,q.options.map(o=>o.id)]))};
  const saved=sanitizeState({version:'5e49a154752e',attempts:{'tower-ai':paper},history:[paper],wrong:['tai-q001'],read:['tai-08']},data.version,data.compatibleVersions);
  assert.equal(saved.attempts['tower-ai'].questionIds.length,59);assert.equal(saved.history.length,1);
  assert.equal(gradePaper(saved.history[0],data.questions).total,59);assert.deepEqual(saved.read,['tai-08']);
});

test('覆盖组卷每个知识点都有题，不受题目原始顺序偏置且无重复',()=>{
  for(const set of bank.practiceSets){
    for(const random of [()=>.01,()=>.73]){
      const paper=makeCoveragePaper(bank.questions,set.lessonIds,{perLesson:set.perLesson,random});
      assert.equal(paper.questionIds.length,set.lessonIds.length*set.perLesson);
      assert.equal(new Set(paper.questionIds).size,paper.questionIds.length);
      const selected=paper.questionIds.map(id=>bank.questions.find(q=>q.id===id));
      for(const id of set.lessonIds)assert.equal(selected.filter(q=>q.lessonIds.includes(id)).length,set.perLesson);
      assert.equal(gradePaper(paper,bank.questions,Object.fromEntries(selected.map(q=>[q.id,q.answer]))).score,100);
    }
  }
  assert.throws(()=>makeCoveragePaper(bank.questions,['missing']));
  assert.throws(()=>makeCoveragePaper(bank.questions,['tai-08','tai-08']));
});

test('考前路线合计6小时，30组均有依据优先级和至少6道不同检测',()=>{
  assert.equal(bank.prep.examDate,'2026-11-01');assert.equal(bank.prep.steps.reduce((s,x)=>s+x.minutes,0),360);
  assert.equal(bank.lessons.length,30);assert.equal(bank.questions.length,183);
  for(const l of bank.lessons){
    assert(['P1','P2'].includes(l.priority));assert(l.evidence);
    const qs=bank.questions.filter(q=>q.lessonIds.includes(l.id));assert(qs.length>=6);assert(new Set(qs.map(q=>q.variant)).size>=4);
  }
  const html=files.get('professional-tower-ai.html');assert(html.includes('id="exam-sprint"'));assert(html.includes('preset=coverage'));assert(!html.includes('后7组'));
  for(const step of bank.prep.steps)for(const id of step.lessonIds||[])assert(bank.lessons.some(l=>l.id===id));
});

test('手算题按独立公式复核，轮换选项不改变正确数值',()=>{
  const cases=[
    ['火情率1%，检出率90%',(90/(90+495)*100).toFixed(2)+'%'],
    ['X以相同概率取0和1',String(.5-.5**2)],
    ['向量[1,2]和[3,4]',String(1*3+2*4)],
    ['L=(wx−y)²，w=2',String(2*(2*3-1)*3)],
    ['向量[3,4]的L2范数',String(Math.hypot(3,4))],
    ['预测[2,4]，真实[1,2]',String(((2-1)**2+(4-2)**2)/2)],
    ['节点有5个正类',String(1-.5**2-.5**2)],
    ['父节点熵1，两个子节点',String(1-(.5*.4+.5*.4))],
    ['w=2，梯度6，学习率0.1',String(2-.1*6)],
    ['普通groups=1卷积',String(16*(3*3*3+1))],
    ['输入32、核3',String(Math.floor((32+2-3)/2)+1)],
    ['W为100×80，LoRA秩4',String(4*80+100*4)],
    ['虚拟地址5000',String(5000%4096)],
    ['4KiB页大小',String(Math.log2(4096))],
    ['20路视频各采样2帧',String(Math.ceil(20*2/10))],
    ['precision=0.8、recall=0.5',(2*.8*.5/(.8+.5)).toFixed(4)],
    ['输入10维、输出3维',String(10*3+3)],
    ['两个框面积各10',String(4/(10+10-4))]
  ];
  for(const [prefix,expected] of cases){const q=bank.questions.find(q=>q.stem.includes(prefix));assert(q,prefix);assert.equal(q.options.find(o=>o.id===q.answer[0]).text,expected,q.id);}
});
