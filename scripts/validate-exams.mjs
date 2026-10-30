import assert from 'node:assert/strict';
import {loadExams} from './exams.mjs';
const banks=loadExams(),globalIds=new Set();let lessons=0,questions=0;
const unique=id=>{assert.match(id,/^[a-z0-9-]+$/);assert(!globalIds.has(id),`Duplicate id ${id}`);globalIds.add(id);};
for(const b of banks){
  const sourceIds=new Set(b.sources.map(s=>s.id)),lessonIds=new Set(b.lessons.map(l=>l.id));
  for(const s of b.sources){unique(s.id);assert(['https:','http:'].includes(new URL(s.url).protocol));for(const k of ['title','publishedAt','verifiedAt','supports'])assert(s[k]?.trim(),`${s.id}: ${k}`);assert(s.verifiedAt<='2026-10-30');}
  for(const l of b.lessons){unique(l.id);lessons++;for(const k of ['title','category','summary','body','pitfall'])assert(l[k]?.trim(),`${l.id}: ${k}`);assert(l.body.length>=180,`${l.id}: teaching too short`);assert(!/^# /m.test(l.body),`${l.id}: h1 not allowed`);assert(l.keyPoints.length>=2);assert(l.sourceIds.length&&l.sourceIds.every(id=>sourceIds.has(id)));const qs=b.questions.filter(q=>q.lessonIds.includes(l.id));assert(qs.length>=3,`${l.id}: needs 3 variants`);assert(new Set(qs.map(q=>q.variant)).size>=2,`${l.id}: lacks varied testing`);}
  const stems=new Set();
  for(const q of b.questions){unique(q.id);questions++;assert(!stems.has(q.stem),`${q.id}: duplicated stem`);stems.add(q.stem);assert(q.stem?.trim());assert(q.explanation.length>=30,`${q.id}: explanation too short`);assert(q.variant?.trim());assert(q.lessonIds.length&&q.lessonIds.every(id=>lessonIds.has(id)));assert(q.sourceIds.length&&q.sourceIds.every(id=>sourceIds.has(id)));assert(['single','multiple','boolean'].includes(q.type));assert(q.options.length>1);assert.equal(new Set(q.options.map(o=>o.id)).size,q.options.length);assert.equal(new Set(q.options.map(o=>o.text)).size,q.options.length);assert(q.options.every(o=>o.text?.trim()&&/^[a-z]$/.test(o.id)));assert(q.answer.length&&q.answer.every(id=>q.options.some(o=>o.id===id)));assert.equal(new Set(q.answer).size,q.answer.length);assert(q.type==='multiple'?q.answer.length>=2:q.answer.length===1);if(q.type==='boolean')assert.equal(q.options.length,2);}
  assert(b.questions.length>b.lessons.length);console.log(`${b.title}: ${b.lessons.length} lessons / ${b.questions.length} questions / ${b.sources.length} sources`);
}
console.log(`Exam content checked: ${lessons} lessons and ${questions} original questions.`);
