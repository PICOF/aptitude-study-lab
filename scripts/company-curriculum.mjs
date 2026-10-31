import {chapterRoute} from '../public/exam-routes.js';
export function renderCurriculum(bank,{prefix='',currentLesson='',open=false,esc,icon,label='知识学习'}={}){
  const route=chapterRoute(bank.id);
  const categories=[...new Set(bank.lessons.map(l=>l.category))];
  const selected=bank.lessons.find(l=>l.id===currentLesson);
  return `<details class="company-curriculum ${bank.id==='current'?'current-curriculum':''}" data-company-curriculum="${bank.id}" ${open?'open':''}>
    <summary data-company-action="learn">${icon('book')}<span>${esc(label)}</span><span class="curriculum-count">${bank.lessons.length}</span>${icon('chevron','curriculum-chevron')}</summary>
    <a class="chapter-overview" href="${prefix}${route}">完整章节与整章测试</a>
    <nav class="curriculum-groups" aria-label="${esc(bank.title)}知识目录">${categories.map((category,index)=>{
      const expanded=selected?selected.category===category:index===0;
      const lessons=bank.lessons.filter(l=>l.category===category);
      return `<details class="company-course-group" data-course-category="${esc(category)}" ${expanded?'open':''}>
        <summary><span>${esc(category)}</span><small>${lessons.length}</small>${icon('chevron','curriculum-chevron')}</summary>
        <div class="company-course-links">${lessons.map(l=>`<a class="company-course-link" data-company-lesson="${l.id}" data-chapter-link="${l.id}" ${l.id===currentLesson?'aria-current="location"':''} href="${prefix}${route}#${l.id}"><span class="course-number">${String(bank.lessons.indexOf(l)+1).padStart(2,'0')}</span><span>${esc(l.title)}</span></a>`).join('')}</div>
      </details>`;
    }).join('')}</nav>
  </details>`;
}
