// Pure question selection and grading. Option identities never depend on position.
export function selectQuestions(questions, filters={}, wrongIds=[]) {
  const wrong=new Set(wrongIds);
  return questions.filter(q=>(!filters.scope||q.scope===filters.scope)
    &&(!filters.category||q.category===filters.category)
    &&(!filters.lesson||q.lessonIds.includes(filters.lesson))
    &&(!filters.type||q.type===filters.type)
    &&(!filters.wrongOnly||wrong.has(q.id)));
}
function shuffled(items, random) {
  const copy=[...items];
  for(let i=copy.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}
  return copy;
}
export function makePaper(questions,{limit=0,shuffle=true,random=Math.random}={}) {
  if(!questions.length)throw new Error('当前范围没有可练习的题目。');
  const order=shuffle?shuffled(questions,random):[...questions];
  const selected=limit>0?order.slice(0,limit):order;
  return {questionIds:selected.map(q=>q.id),optionOrder:Object.fromEntries(selected.map(q=>[q.id,shuffle&&q.type!=='boolean'?shuffled(q.options.map(o=>o.id),random):q.options.map(o=>o.id)]))};
}
export function gradePaper(paper,questions,answers={}) {
  const map=new Map(questions.map(q=>[q.id,q]));
  if(!paper.questionIds?.length)throw new Error('空试卷不能批改。');
  const rows=paper.questionIds.map(id=>{
    const q=map.get(id);if(!q)throw new Error('题库已更新，请重新组卷。');
    const selected=Array.isArray(answers[id])?answers[id]:[];
    const correct=selected.length===q.answer.length&&new Set(selected).size===selected.length&&selected.every(a=>q.answer.includes(a));
    return {id,selected:[...selected],correct,unanswered:selected.length===0};
  });
  const correct=rows.filter(r=>r.correct).length;
  return {rows,total:rows.length,correct,unanswered:rows.filter(r=>r.unanswered).length,score:Math.round(100*correct/rows.length)};
}
export function summarizeLessons(result,questions) {
  const map=new Map(questions.map(q=>[q.id,q])),stats=new Map();
  for(const row of result.rows)for(const id of map.get(row.id)?.lessonIds||[]){
    const stat=stats.get(id)||{id,total:0,correct:0};stat.total++;if(row.correct)stat.correct++;stats.set(id,stat);
  }
  return [...stats.values()].sort((a,b)=>a.correct/a.total-b.correct/b.total);
}
export function sanitizeState(raw,version) {
  const empty={version,attempts:{},history:[],wrong:[],read:[]};
  if(!raw||raw.version!==version)return empty;
  const strings=v=>Array.isArray(v)?[...new Set(v.filter(x=>typeof x==='string'))]:[];
  const validDate=n=>Number.isFinite(n)&&n>=0&&n<=8640000000000000;
  const validAttempt=a=>a&&typeof a.id==='string'&&typeof a.scope==='string'&&Array.isArray(a.questionIds)&&a.questionIds.length&&a.questionIds.every(x=>typeof x==='string')&&a.answers&&typeof a.answers==='object'&&!Array.isArray(a.answers)&&a.optionOrder&&typeof a.optionOrder==='object'&&validDate(a.startedAt);
  const normalize=a=>({...a,title:typeof a.title==='string'?a.title:a.scope,position:Number.isInteger(a.position)?Math.max(0,Math.min(a.position,a.questionIds.length-1)):0,marked:strings(a.marked).filter(id=>a.questionIds.includes(id))});
  const attempts=raw.attempts&&typeof raw.attempts==='object'&&!Array.isArray(raw.attempts)?Object.fromEntries(Object.entries(raw.attempts).filter(([k,a])=>['guoxin','cosco','current'].includes(k)&&validAttempt(a)&&k===a.scope).map(([k,a])=>[k,normalize(a)])):{};
  const seen=new Set();
  const history=Array.isArray(raw.history)?raw.history.filter(a=>{if(!validAttempt(a)||!validDate(a.finishedAt)||a.finishedAt<a.startedAt||seen.has(a.id))return false;seen.add(a.id);return true;}).slice(0,50).map(normalize):[];
  return {version,attempts,history,wrong:strings(raw.wrong),read:strings(raw.read)};
}
// Apply only this page's changes to the latest browser state. Reading a lesson
// in another tab must not overwrite a draft or a submission saved meanwhile.
export function mergeState(before,local,remote){
  const merged=structuredClone(remote),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
  const mergeSet=(old,now,latest)=>[...new Set([...latest.filter(id=>!old.includes(id)||now.includes(id)),...now.filter(id=>!old.includes(id))])];
  for(const key of ['read','wrong'])merged[key]=mergeSet(before[key],local[key],remote[key]);
  for(const scope of ['guoxin','cosco','current']){
    const old=before.attempts[scope],now=local.attempts[scope],latest=remote.attempts[scope];
    if(same(old,now))continue;
    if(!now){if(!latest||latest.id===old?.id)delete merged.attempts[scope];continue;}
    if(old?.id===now.id&&latest?.id===now.id){
      const draft=structuredClone(latest);
      for(const id of now.questionIds)if(!same(old.answers[id],now.answers[id])){if(now.answers[id])draft.answers[id]=[...now.answers[id]];else delete draft.answers[id];}
      draft.marked=mergeSet(old.marked||[],now.marked||[],latest.marked||[]);
      if(old.position!==now.position)draft.position=now.position;
      merged.attempts[scope]=draft;
    }else if(old?.id!==now.id){merged.attempts[scope]=structuredClone(now);}
    // If another tab already submitted this unchanged attempt, don't resurrect it.
  }
  const records=new Map(remote.history.map(a=>[a.id,a]));for(const a of local.history)if(!before.history.some(p=>p.id===a.id))records.set(a.id,structuredClone(a));
  merged.history=[...records.values()].sort((a,b)=>b.finishedAt-a.finishedAt).slice(0,50);return merged;
}
