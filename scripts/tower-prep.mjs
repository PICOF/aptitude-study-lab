export function renderTowerPrep(bank,{esc}){
  if(!bank.prep)return '';
  const {prep}=bank;
  const link=id=>{const l=bank.lessons.find(l=>l.id===id);return `<a href="#${esc(id)}">${esc(l.title)}</a>`;};
  const groups=[...new Set(bank.lessons.map(l=>l.category))];
  return `<section class="tower-prep" id="exam-sprint" aria-labelledby="sprint-title">
    <div class="tower-prep-heading"><span class="exam-tag">考前冲刺 · ${esc(prep.examDate)}</span><h2 id="sprint-title">先查漏，再按优先级补。</h2><p>约6小时路线，可从错题最多的一段开始。P1先复习，P2有余力再补；这是本站的复习安排，不是官方考纲或命中率预测。</p><p class="small muted">${esc(prep.dateBasis)}。不必今晚从头刷完${bank.questions.length}题。</p></div>
    <div class="exam-action-row">${bank.practiceSets.map(set=>`<a class="button ${set.id==='coverage'?'primary':'secondary'}" href="exam.html?scope=tower-ai&amp;preset=${set.id}">${esc(set.title)}（${set.lessonIds.length*set.perLesson}题） →</a>`).join('')}</div>
    <ol class="tower-sprint-steps">${prep.steps.map(step=>`<li><span class="tower-minutes">${step.minutes} 分钟</span><div><h3>${esc(step.title)}</h3><p>${esc(step.detail)}</p><div class="tower-step-links">${step.lessonIds?step.lessonIds.map(link).join(''):step.preset?`<a href="exam.html?scope=tower-ai&amp;preset=${step.preset}">开始覆盖摸底 →</a>`:`<a href="${step.href}">进入这一项 →</a>`}</div></div></li>`).join('')}</ol>
    <details class="tower-coverage"><summary>完整复习地图：30组知识、依据与优先级</summary><p>${esc(prep.priorityNote)} 技术原文证明讲解事实，不证明该细项在铁塔考过；每组课后的检测题均为原创。</p>${groups.map(group=>`<section><h3>${esc(group)}</h3><ul>${bank.lessons.filter(l=>l.category===group).map(l=>`<li><span class="prep-priority ${l.priority.toLowerCase()}">${l.priority}</span>${link(l.id)}<small>${esc(l.evidence)}</small></li>`).join('')}</ul></section>`).join('')}</details>
    <div class="chapter-pitfall"><strong>复盘到什么程度</strong><p>本站建议：每道错题能说出原因，换一题还能独立答对；能手算F1、贝叶斯、卷积尺寸/参数量、注意力形状和一次梯度更新。摸底分数用于找缺口，不等于考试通过概率。最后核对通知里的专业类别、计时与回跳规则。</p></div>
  </section>`;
}
