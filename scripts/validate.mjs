import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { loadModules } from './content.mjs';
const read=f=>JSON.parse(fs.readFileSync(f,'utf8').replace(/^\uFEFF/,''));
const data=loadModules();
const ids=new Set(),sources=new Set();let lessonCount=0,exampleCount=0,cardCount=0;
function unique(id){assert.match(id,/^[a-z0-9-]+$/);assert(!ids.has(id),`Duplicate id: ${id}`);ids.add(id);}
function fields(o,keys){for(const k of keys)assert(typeof o[k]==='string'&&o[k].trim(),`${o.id}: missing ${k}`);}
for(const m of data)for(const s of m.sources){unique(s.id);sources.add(s.id);fields(s,['title','url','publisher','kind','verified','note']);assert(['https:','http:'].includes(new URL(s.url).protocol));assert.match(s.verified,/^\d{4}-\d{2}-\d{2}$/);}
const references=[];
for(const m of data){
 for(const l of m.lessons||[]){unique(l.id);lessonCount++;fields(l,['title','summary','body','level']);assert(Number.isInteger(l.minutes)&&l.minutes>0);assert(Array.isArray(l.tags));assert(l.examples.length>=2&&l.examples.length<=3,`${l.id}: 2–3 examples expected`);assert(!/^# /m.test(l.body),`${l.id}: do not use h1 in lesson body`);assert(l.body.length>=450,`${l.id}: insufficient teaching explanation`);references.push(l);
  if(l.material){
   const mat=l.material;unique(mat.id);fields(mat,['title','intro']);assert(mat.notes?.length&&mat.readGuide?.length);assert(mat.charts?.length);
   for(const c of mat.charts){
    unique(c.id);fields(c,['type','title','unit']);assert(['bar','line','pie','stacked','combo'].includes(c.type));
    assert(c.categories.length>=2&&c.categories.length<=8);assert(c.series?.length);
    for(const series of c.series){assert(series.name?.trim());assert.equal(series.values.length,c.categories.length);assert(series.values.every(v=>Number.isFinite(v)&&v>=0));}
    if(c.type==='pie'){assert.equal(c.series.length,1);assert(Math.abs(c.series[0].values.reduce((a,b)=>a+b,0)-100)<1e-7);assert(c.series[0].values.every(v=>v>0));}
    else {assert(c.max>0&&c.tick>0);assert(c.max/c.tick<=12);for(let i=0;i<c.categories.length;i++){const values=c.series.filter(s=>s.axis!=='right').map(s=>s.values[i]);assert((c.type==='stacked'?values.reduce((a,b)=>a+b,0):Math.max(...values))<=c.max);}}
    if(c.type==='combo'){assert(c.series[0].axis!=='right'&&c.series[1].axis==='right');assert(c.rightMax>0&&c.rightTick>0&&c.rightUnit);assert.equal(c.series.filter(s=>s.axis==='right').length,1);assert.equal(c.series.filter(s=>s.axis!=='right').length,1);assert(c.series.find(s=>s.axis==='right').values.every(v=>v<=c.rightMax));}
   }
  }
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
