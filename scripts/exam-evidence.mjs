import fs from 'node:fs';

const evidence=JSON.parse(fs.readFileSync(new URL('../content/exam-evidence.json',import.meta.url),'utf8'));

export function renderEvidenceSummary(scope,{esc}={}){
  const entry=evidence.scopes[scope];
  if(!entry)return '';
  return `<div class="exam-note" data-exam-evidence="${esc(scope)}"><strong>考情范围</strong><p>${esc(entry.summary)} <a href="exam-evidence.html#${esc(scope)}">查看公开回忆与证据边界 →</a></p></div>`;
}

function renderSource(source,esc){
  const dates=`发布 ${source.publishedAt}${source.editedAt?` · 编辑 ${source.editedAt}`:''}`;
  return `<article class="exam-source" id="${esc(source.id)}">
    <div class="meta"><span>${esc(source.level)} · ${esc(source.kind)}</span><span>${esc(source.publisher)}</span></div>
    <h3><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.title)} ↗</a></h3>
    <p class="small muted">${esc(dates)}${source.dateNote?` · ${esc(source.dateNote)}`:''}</p>
    <p><strong>岗位与批次：</strong>${esc(source.context)}</p>
    ${source.modules.length?`<p><strong>文中列出的模块：</strong>${source.modules.map(esc).join('；')}。</p>`:''}
    <p><strong>原文短引：</strong>“${esc(source.excerpt)}”</p>
    <p><strong>能支持：</strong>${esc(source.supports)}</p>
    <p><strong>边界：</strong>${esc(source.limit)}</p>
  </article>`;
}

// Returns page body content; the caller supplies the existing site shell.
export function renderEvidencePage({esc}={}){
  const scopes=Object.entries(evidence.scopes);
  return `<div class="breadcrumb"><a href="culture.html">企业文化</a><span>/</span>考情证据</div>
    <header class="page-heading"><h1>考过什么，证据到哪。</h1><p class="lead">把考试回忆与官网事实分开看。这里记录公开来源明确说了什么，也保留没有查到的部分。</p><div class="meta"><span>核验 ${esc(evidence.verifiedAt)}</span><span>未核到可确认的具体企业文化题干</span></div></header>
    <nav class="exam-tabs" aria-label="选择企业考情">${scopes.map(([scope,entry])=>`<a href="#${esc(scope)}">${esc(entry.title)}</a>`).join('')}</nav>
    <div class="notice"><strong>先看范围，再决定背多少</strong><p>${esc(evidence.dateNote)}</p><p>单人回忆只能支持其描述的场次；培训机构文章只能作线索。本次检索未取得足以确认两家企业具体文化题干的证据，不把模块名称扩写成历年题目。</p></div>
    ${scopes.map(([scope,entry])=>`<section class="section" id="${esc(scope)}"><div class="section-heading"><h2>${esc(entry.title)}</h2><a class="quiet-link" href="culture-${esc(scope)}.html">返回基础短卡 →</a></div><div class="chapter-content"><div class="chapter-body"><p><strong>目前能确认的范围：</strong>${esc(entry.conclusion)}</p><p>${esc(entry.scopeNote)}</p></div></div>${entry.sources.map(source=>renderSource(source,esc)).join('')}<p class="exam-note"><strong>版本边界：</strong>${esc(entry.versionNote)}</p></section>`).join('')}
    <section class="section chapter-content"><div class="chapter-body"><h2>怎样使用这些资料</h2><p><strong>A 官方说明：</strong>只按明文范围使用。招聘流程写“笔试”，不等于公布了科目。</p><p><strong>B 考生回忆：</strong>本页是网名用户的单人自述，不是官方试卷，身份和经历未独立核验；不能凭一篇或重复转载判断频率。</p><p><strong>C 机构文章：</strong>可以帮助了解可能的模块，不能升级为正式大纲或真题。</p><p><strong>D 官网事实：</strong>${esc(evidence.factNote)} <a href="exam-sources.html">查看官网原文来源 →</a></p><p><strong>经济与资本市场：</strong>公司业务涉及资本运营或产融服务，不能据此把金融理论列入企业文化。岗位专业知识应按当次通知另行准备；概率统计和资料分析仍属于公开回忆明确提到的数量能力。</p><p>当次招聘公告、测评邮件或短信若明确了模块，优先按对应单位和岗位的通知调整。本页保留检索缺口，不把“尚未找到”写成“绝对不考”。</p></div></section>`;
}
