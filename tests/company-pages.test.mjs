import test from 'node:test';
import assert from 'node:assert/strict';
import {renderExams} from '../scripts/exams.mjs';

const files=new Map(),options=new Map();
const result=renderExams({page:(title,body,opts)=>{options.set(title,opts);return `<head></head><main>${body}</main>`;},write:(name,text)=>files.set(name,text),render:s=>s,esc:s=>String(s)});

test('企业目录只选择企业，知识目录分到企业专属页',()=>{
  assert(!files.get('culture.html').includes('data-chapter-lesson='));
  for(const id of ['guoxin','cosco']){
    const html=files.get(`culture-${id}.html`);
    assert(html,`Missing independent page ${id}`);
    assert(html.includes(`data-chapter-lesson="${id==='guoxin'?'gx':'co'}-core-01"`));
    assert.equal((html.match(/data-chapter-lesson=/g)||[]).length,4);
    assert(html.includes(`exam.html?scope=${id}`));
    assert(result.routes.includes(`culture-${id}.html`));
  }
});

test('精简仅改变默认范围，旧题面与记录版本保持可用',()=>{
  const data=JSON.parse(files.get('assets/exam-data.json'));
  assert.equal(data.version,'908424273982');
  assert.equal(data.questions.length,204);
  assert.equal(data.lessons.length,68);
  assert.equal(data.study.lessons.length,29);
  assert.equal(data.study.questionIds.length,91);
  assert.equal(Object.keys(data.study.explanations).length,28);
  assert(!data.study.explanations['co-q031'].includes('四个领航'));
  assert(!data.study.explanations['gx-q031'].includes('投资观'));
  assert.equal(data.study.lessonMap['gx-07'],'gx-core-02');
  assert(!data.study.questionIds.includes('gx-q011'));
  assert(!data.study.questionIds.includes('cu-q046'));
  assert(!result.searchEntries.some(l=>['gx-04','cu-16'].includes(l.id)));
  assert(files.get('learn/exam-gx-04.html').includes('已退出默认学习与新组卷'));
  assert(!files.get('learn/exam-gx-04.html').includes('data-chapter-redirect'));
  assert(files.get('learn/exam-gx-07.html').includes('data-chapter-redirect="../culture-guoxin.html#gx-core-02"'));
});

test('考情证据与官网事实来源分开，并保留来源强度说明',()=>{
  assert(files.get('culture-guoxin.html').includes('exam-evidence.html#guoxin'));
  assert(files.get('culture-cosco.html').includes('exam-evidence.html#cosco'));
  assert(result.routes.includes('exam-evidence.html'));
  assert(files.get('exam-sources.html').includes('不代表相关内容已考或高频'));
});
test('企业课程返回专属目录，并向导航传递企业上下文',()=>{
  assert(files.get('learn/exam-gx-01.html').includes('href="../culture-guoxin.html"'));
  assert(files.get('learn/exam-co-01.html').includes('href="../culture-cosco.html"'));
  assert.equal(options.get('中国国新 · 企业文化').company,'guoxin');
  assert.equal(options.get('中远海运 · 企业文化').company,'cosco');
});
