import fs from 'node:fs';

// Curation is separate from the immutable question bank so existing papers keep
// their original wording, answers, IDs and storage version.
export function loadStudyBanks(banks) {
  const focus=JSON.parse(fs.readFileSync('content/exam-focus.json','utf8'));
  return banks.map(bank=>{
    const spec=focus[bank.id];
    if(!spec)return bank;
    const lessons=spec.lessons||bank.lessons.filter(l=>!spec.excludeLessons.includes(l.id));
    const questionIds=spec.lessons?new Set(lessons.flatMap(l=>l.questionIds)):null;
    const questions=bank.questions.filter(q=>questionIds?questionIds.has(q.id):q.lessonIds.every(id=>lessons.some(l=>l.id===id))).map(q=>{
      const lesson=lessons.find(l=>l.questionIds?.includes(q.id)||q.lessonIds.includes(l.id));
      if(!lesson)throw new Error(`Missing study lesson for ${q.id}`);
      return {...q,lessonIds:[lesson.id],category:lesson.category};
    });
    for(const lesson of lessons){
      for(const id of lesson.questionIds||[])if(!questions.some(q=>q.id===id))throw new Error(`Unknown focus question ${id}`);
      for(const id of lesson.memberLessonIds||[])if(!bank.lessons.some(l=>l.id===id))throw new Error(`Unknown original lesson ${id}`);
      for(const id of lesson.sourceIds)if(!bank.sources.some(s=>s.id===id))throw new Error(`Unknown source ${id}`);
    }
    return {...bank,subtitle:spec.subtitle,scopeNote:spec.scopeNote,lessons,questions};
  });
}

export function studyPayload(banks) {
  const explanations=JSON.parse(fs.readFileSync('content/exam-focus-explanations.json','utf8'));
  const companyQuestions=banks.filter(b=>['guoxin','cosco'].includes(b.id)).flatMap(b=>b.questions.map(q=>q.id));
  if(companyQuestions.some(id=>!explanations[id])||Object.keys(explanations).some(id=>!companyQuestions.includes(id)))throw new Error('Condensed explanations must cover exactly the company study questions');
  return {
    explanations,
    lessons:banks.flatMap(b=>b.lessons.map(l=>({...l,scope:b.id,scopeTitle:b.title}))),
    questionIds:banks.flatMap(b=>b.questions.map(q=>q.id)),
    lessonMap:Object.fromEntries(banks.flatMap(b=>b.lessons.flatMap(l=>(l.memberLessonIds||[l.id]).map(id=>[id,l.id]))))
  };
}
