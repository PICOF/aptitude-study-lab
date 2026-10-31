import {chapterRoute,examScopes} from './exam-routes.js';
// Study scope changes selection only. Original questions remain the grading source.
export function resolveFocusLesson(data,id,scope) {
  const original=data.lessons.find(l=>l.id===id);
  const direct=data.study?.lessons.find(l=>l.id===id);
  const candidate=direct||original;
  if(!candidate)return {status:'unknown',lesson:null};
  if(scope&&candidate.scope!==scope)return {status:'other-scope',lesson:candidate};
  if(direct||!data.study)return {status:'active',lesson:candidate};
  const mapped=data.study.lessons.find(l=>l.id===data.study.lessonMap?.[id]&&l.scope===original.scope);
  return mapped?{status:'active',lesson:mapped}:{status:'retired',lesson:original};
}

export function createFocusView(data) {
  const lessons=data.study?data.study.lessons:data.lessons;
  const allowed=data.study?new Set(data.study.questionIds):null;
  const reviewQuestions=data.questions.map(q=>{
    const resolved=q.lessonIds.map(id=>resolveFocusLesson(data,id,q.scope));
    const lessonIds=[...new Set(q.lessonIds.map((id,i)=>resolved[i].status==='active'?resolved[i].lesson.id:id))];
    const category=resolved.find(r=>r.status==='active')?.lesson.category||q.category;
    return {...q,lessonIds,category};
  });
  const questions=reviewQuestions.filter(q=>(!allowed||allowed.has(q.id))
    &&q.lessonIds.some(id=>lessons.some(l=>l.id===id&&l.scope===q.scope)));
  return {lessons,questions,reviewQuestions,questionIds:new Set(questions.map(q=>q.id)),
    knownLessonIds:new Set([...data.lessons,...lessons].map(l=>l.id))};
}

export function retiredQuestionIds(attempt,focus) {
  return attempt.questionIds.filter(id=>!focus.questionIds.has(id));
}

export function focusChapterHref(data,id,scope='guoxin',prefix='') {
  const resolved=resolveFocusLesson(data,id);
  if(resolved.status==='retired')return `${prefix}learn/exam-${encodeURIComponent(id)}.html`;
  const target=resolved.lesson,scopeId=target?.scope||scope;
  const page=chapterRoute(scopeId);
  return `${prefix}${page}${target?`#${encodeURIComponent(target.id)}`:''}`;
}

export function resolveChapterNavigation(data,pathname,hash,prefix='') {
  let id='';try{id=decodeURIComponent(hash.replace(/^#/,''));}catch{}
  const unchanged={action:'none',id};
  const scope=examScopes.find(s=>chapterRoute(s)===pathname.split('/').pop());
  if(!scope||!id)return unchanged;
  const resolved=resolveFocusLesson(data,id,scope);
  if(resolved.status==='retired')return {action:'redirect',id,href:focusChapterHref(data,id,scope,prefix)};
  if(resolved.status==='active'&&resolved.lesson.id!==id)return {action:'replace-hash',id:resolved.lesson.id};
  return unchanged;
}
