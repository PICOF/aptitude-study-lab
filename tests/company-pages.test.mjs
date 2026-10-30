import test from 'node:test';
import assert from 'node:assert/strict';
import {renderExams} from '../scripts/exams.mjs';

const files=new Map(),options=new Map();
const result=renderExams({page:(title,body,opts)=>{options.set(title,opts);return `<head></head><main>${body}</main>`;},write:(name,text)=>files.set(name,text),render:s=>s,esc:s=>String(s)});

test('企业目录只选择企业，知识目录分到企业专属页',()=>{
  assert(!files.get('culture.html').includes('data-catalog='));
  for(const id of ['guoxin','cosco']){
    const html=files.get(`culture-${id}.html`);
    assert(html,`Missing independent page ${id}`);
    assert(html.includes(`data-catalog="${id}"`));
    assert.equal((html.match(/data-catalog=/g)||[]).length,1);
    assert(html.includes(`exam.html?scope=${id}`));
    assert(result.routes.includes(`culture-${id}.html`));
  }
});
test('企业课程返回专属目录，并向导航传递企业上下文',()=>{
  assert(files.get('learn/exam-gx-01.html').includes('href="../culture-guoxin.html"'));
  assert(files.get('learn/exam-co-01.html').includes('href="../culture-cosco.html"'));
  assert.equal(options.get('中国国新 · 企业文化').company,'guoxin');
  assert.equal(options.get('中远海运 · 企业文化').company,'cosco');
});
