import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const read=f=>JSON.parse(fs.readFileSync(f,'utf8').replace(/^\uFEFF/,''));
const data=['quantity','data','verbal','knowledge'].map(id=>read(`content/${id}.json`));
for(const file of ['knowledge-extra.json','knowledge-policy-extra.json'])if(fs.existsSync(`content/${file}`))data.push(read(`content/${file}`));
data.push(read('content/resources-extra.json'));
const ids=new Set(),sources=new Set();let lessonCount=0,exampleCount=0,cardCount=0;
function unique(id){assert.match(id,/^[a-z0-9-]+$/);assert(!ids.has(id),`Duplicate id: ${id}`);ids.add(id);}
function fields(o,keys){for(const k of keys)assert(typeof o[k]==='string'&&o[k].trim(),`${o.id}: missing ${k}`);}
for(const m of data)for(const s of m.sources){unique(s.id);sources.add(s.id);fields(s,['title','url','publisher','kind','verified','note']);assert(['https:','http:'].includes(new URL(s.url).protocol));assert.match(s.verified,/^\d{4}-\d{2}-\d{2}$/);}
const references=[];
for(const m of data){
 for(const l of m.lessons||[]){unique(l.id);lessonCount++;fields(l,['title','summary','body','level']);assert(Number.isInteger(l.minutes)&&l.minutes>0);assert(Array.isArray(l.tags));assert(l.examples.length>=2&&l.examples.length<=3,`${l.id}: 2–3 examples expected`);assert(!/^# /m.test(l.body),`${l.id}: do not use h1 in lesson body`);assert(l.body.length>=450,`${l.id}: insufficient teaching explanation`);references.push(l);
  for(const e of l.examples){unique(e.id);exampleCount++;fields(e,['title','question','answer','pitfall','provenance']);assert(e.steps.length>=2);assert.equal(e.provenance,'原创教学例题');assert(e.steps.every(x=>typeof x==='string'&&x.trim()));}
 }
 for(const c of m.cards||[]){unique(c.id);cardCount++;fields(c,['category','front','back','mnemonic','trap','example']);references.push(c);}
}
for(const item of references){assert(item.sourceIds?.length,`${item.id}: missing references`);for(const id of item.sourceIds)assert(sources.has(id),`${item.id}: unknown source ${id}`);}
const serialized=JSON.stringify(data);
assert(!serialized.includes('\ufffd'),'Encoding replacement character');
assert(!/[A-Z]:[\\/](Users|usersdir)/.test(serialized),'Local private file path leaked into content');
const baseline=read('content/reviewed-examples.json');
const numerical=data.slice(0,2).flatMap(m=>m.lessons.flatMap(l=>l.examples));
assert.equal(Object.keys(baseline).length,numerical.length,'Numerical examples changed: independently re-check before publishing');
for(const e of numerical){const hash=crypto.createHash('sha256').update(JSON.stringify(e)).digest('hex');assert.equal(hash,baseline[e.id],`${e.id}: numerical teaching text changed; recompute, review, then update reviewed-examples.json`);}
console.log(`PASS: ${lessonCount} lessons / ${exampleCount} examples / ${cardCount} cards / ${sources.size} source records. IDs, citations, required teaching fields and reviewed numerical examples are consistent.`);
