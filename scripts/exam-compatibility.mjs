import crypto from 'node:crypto';
import fs from 'node:fs';

export function compatibleExamVersions(banks) {
  const hash=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
  const versions=[];
  const original=banks.filter(b=>['guoxin','cosco','current'].includes(b.id));
  if(hash(original).slice(0,12)==='908424273982')versions.push('908424273982');
  const questions=new Map(banks.flatMap(b=>b.questions.map(q=>[q.id,{...q,scope:b.id}])));
  const lessons=new Set(banks.flatMap(b=>b.lessons.map(l=>l.id)));
  const releases=JSON.parse(fs.readFileSync(new URL('../content/exam-compatible-versions.json',import.meta.url),'utf8'));
  for(const release of releases){
    const kept=release.questionIds.map(id=>questions.get(id));
    // Only migrate when every historical question and lesson reference survives.
    // Text, option IDs, answers and explanations must all remain identical.
    if(kept.every(Boolean)&&release.lessonIds.every(id=>lessons.has(id))&&hash(kept)===release.questionHash)versions.push(release.version);
  }
  return [...new Set(versions)];
}
