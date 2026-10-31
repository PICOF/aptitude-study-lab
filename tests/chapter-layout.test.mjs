import test from 'node:test';
import assert from 'node:assert/strict';
import {loadExams} from '../scripts/exams.mjs';
import {loadStudyBanks} from '../scripts/study-focus.mjs';
import {renderCurriculum} from '../scripts/company-curriculum.mjs';
import {renderChapter} from '../scripts/chapter-content.mjs';
import MarkdownIt from 'markdown-it';

const banks=loadStudyBanks(loadExams()),esc=s=>String(s),icon=()=>'<svg></svg>';
test('中文标点相邻的加粗语法正确显示，不暴露Markdown标记',()=>{
  const md=new MarkdownIt({html:false});
  for(const bank of banks)assert(!renderChapter(bank,{render:s=>md.render(s),esc}).includes('**'));
});
for(const bank of banks){
  test(`${bank.title}的章节直接包含完整内容和四类卡片`,()=>{
    const html=renderChapter(bank,{render:s=>s,esc});
    for(const lesson of bank.lessons){
      assert(html.includes(`id="${lesson.id}"`));
      const plain=s=>s.replace(/\*\*/g,'').replace(/\s/g,'');
      assert(plain(html).includes(plain(lesson.body)));
      assert(html.replaceAll('&amp;','&').includes(`exam.html?scope=${bank.id}&lesson=${lesson.id}`));
    }
    assert.equal((html.match(/data-chapter-lesson=/g)||[]).length,bank.lessons.length);
    for(const name of ['chapter-keypoint','chapter-content','chapter-resources','chapter-citations'])assert.equal((html.match(new RegExp(`class="${name}(?:[ "])`,'g'))||[]).length,bank.lessons.length);
    assert(!html.includes('href="learn/exam-'));
  });
  test(`${bank.title}左侧目录覆盖全部知识点并跳转到本章`,()=>{
    const current=bank.lessons.at(-1),html=renderCurriculum(bank,{prefix:'../',currentLesson:current.id,open:true,esc,icon});
    const route=bank.id==='current'?'current-affairs.html':bank.id==='tower-ai'?'professional-tower-ai.html':`culture-${bank.id}.html`;
    for(const lesson of bank.lessons)assert(html.includes(`href="../${route}#${lesson.id}"`));
    assert.equal((html.match(/data-chapter-link=/g)||[]).length,bank.lessons.length);
    assert(html.includes('aria-current="location"'));
    assert(html.includes(`data-course-category="${current.category}" open`));
  });
}
