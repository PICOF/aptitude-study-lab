/** Render one complete chapter; navigation and the page heading belong to the caller. */
export function renderChapter(bank, { render, esc }) {
  const sources = new Map(bank.sources.map(source => [source.id, source]));
  const scope = encodeURIComponent(bank.id);
  const sourceCode = source => `<span class="chapter-source-code">${esc(source.id)}</span>`;

  const legend = `<div class="chapter-legend" aria-label="章节卡片说明">
    <span><i class="chapter-swatch chapter-swatch-keypoint" aria-hidden="true"></i>知识点</span>
    <span><i class="chapter-swatch chapter-swatch-content" aria-hidden="true"></i>内容讲解</span>
    <span><i class="chapter-swatch chapter-swatch-resources" aria-hidden="true"></i>相关资料</span>
    <span><i class="chapter-swatch chapter-swatch-citations" aria-hidden="true"></i>引用记录</span>
  </div>`;

  const topics = bank.lessons.map((lesson, index) => {
    const id = esc(lesson.id);
    // CommonMark needs spacing where a bold punctuation boundary touches Chinese text.
    const body = lesson.body.replace(/\*\*([^*\n]+)\*\*/gu, (span, text, offset) => {
      const before = /^[\p{P}\p{S}]/u.test(text) && /[\p{L}\p{N}]/u.test(lesson.body[offset - 1] ?? '') ? ' ' : '';
      const after = /[\p{P}\p{S}]$/u.test(text) && /[\p{L}\p{N}]/u.test(lesson.body[offset + span.length] ?? '') ? ' ' : '';
      return `${before}${span}${after}`;
    });
    const relevantSources = [...new Set(lesson.sourceIds)].map(sourceId => sources.get(sourceId)).filter(Boolean);
    const questionCount = bank.questions.filter(question => question.lessonIds.includes(lesson.id)).length;
    const resources = relevantSources.map(source => `<li>
      <a class="chapter-resource-link" href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${sourceCode(source)}<span>${esc(source.title)} <span aria-hidden="true">↗</span></span></a>
      <p>${esc(source.supports)}</p>
    </li>`).join('');
    const citations = relevantSources.map(source => `<li>
      <a class="chapter-citation-link" href="exam-sources.html#${encodeURIComponent(source.id)}" aria-label="${esc(source.id)}：${esc(source.title)}，查看来源索引">${sourceCode(source)}<span>查看来源索引 <span aria-hidden="true">↗</span></span></a>
      <dl><div><dt>发布／页面日期</dt><dd>${esc(source.publishedAt)}</dd></div><div><dt>核验日期</dt><dd>${esc(source.verifiedAt)}</dd></div></dl>
    </li>`).join('');

    return `<section class="chapter-topic" id="${id}" data-chapter-lesson="${id}" aria-labelledby="${id}-heading">
      <header class="chapter-keypoint">
        <div class="chapter-topic-meta"><span class="chapter-topic-number">${String(index + 1).padStart(2, '0')}</span><span class="chapter-role-label">知识点</span><span class="chapter-category">${esc(lesson.category)}</span></div>
        <h2 id="${id}-heading">${esc(lesson.title)}</h2>
        <p class="chapter-summary">${esc(lesson.summary)}</p>
        <ul class="chapter-keypoint-list">${lesson.keyPoints.map(point => `<li>${esc(point)}</li>`).join('')}</ul>
      </header>
      <article class="chapter-content" aria-label="${esc(lesson.title)}：内容讲解">
        <h3 class="chapter-role-label">内容讲解</h3>
        <div class="chapter-body">${render(body)}</div>
        <aside class="chapter-pitfall"><strong>易混提醒</strong><p>${esc(lesson.pitfall)}</p></aside>
      </article>
      <div class="chapter-reference-grid">
        <aside class="chapter-resources" aria-label="${esc(lesson.title)}：相关资料"><h3 class="chapter-role-label">相关资料</h3><ul>${resources}</ul></aside>
        <aside class="chapter-citations" aria-label="${esc(lesson.title)}：引用记录"><h3 class="chapter-role-label">引用记录</h3><ul>${citations}</ul></aside>
      </div>
      <div class="chapter-topic-actions"><a class="chapter-check-link" href="exam.html?scope=${scope}&amp;lesson=${encodeURIComponent(lesson.id)}">检测这个知识点（${questionCount}题） <span aria-hidden="true">→</span></a><button class="chapter-read-button" type="button" data-mark-read="${id}" aria-pressed="false">标记学完</button></div>
    </section>`;
  }).join('');

  return `${legend}<div class="chapter-topics">${topics}</div><div class="chapter-complete"><p>本章节已读完，用整套检测回顾知识之间的联系。</p><a class="button primary" href="exam.html?scope=${scope}">完成章节，开始整套检测 <span aria-hidden="true">→</span></a></div>`;
}
