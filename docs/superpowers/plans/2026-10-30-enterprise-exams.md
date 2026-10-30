# 企业文化与时政自测实施计划

用户已确认扩展现有行测自习室，第二家企业为中国远洋海运集团。沿用现有静态构建、页面布局和 GitHub Pages Actions 部署。

目标：先学习有官方依据的知识点，再按企业／知识类型或独立时政范围组卷，交卷批改并重复练习。

- [ ] 内容：三个独立 JSON 题库；每个知识点至少三道不同方式的原创练习。每题与知识点均引用具体官方来源，记录核验日；不混用集团与子公司文化，也不把旧口号当新口号。
- [ ] 判分：新增独立纯函数模块及 Node 测试，验证单选、多选严格匹配、判断、未答、乱序后答案稳定、筛选不跨板块、复习统计。
- [ ] 页面：新增企业文化、独立时政目录、预渲染知识课与自测页。复用现有导航、搜索和字体配色；无需登录。
- [ ] 练习：企业／专题／知识点／题型筛选；10、20、30题或完整一套；每题自动保存；答题卡与标记；交卷确认；得分、解析、薄弱点；原卷重做、错题复练、历史成绩。
- [ ] 持久化：练习草稿与最近50次记录保存在本地浏览器；内容版本改变不沿用旧答案口径；支持导出备份与导入校验。
- [ ] 质量：题库结构与引用完整检查、原有全站检查、桌面和手机浏览器验证，覆盖答题→刷新恢复→交卷→批改→重做。
- [ ] 发布：仅提交网站目录的相关文件，推送已授权目标仓库，检查 Actions 与公开 URL。

文件边界：content/exam-{guoxin,cosco,current}.json 为三份资料；public/exam-core.js 为判分逻辑；public/exam-app.js 为交互；public/exams.css 为增量样式；scripts/exams.mjs 为生成器；tests/exam-core.test.mjs 为行为测试；scripts/validate-exams.mjs 为内容校验。scripts/build.mjs 只增加导航、入口、搜索集成；不重写旧课程。

验收命令：npm test；python scripts/check-quantity.py；python scripts/check-data.py；python scripts/check-quantity-applied.py；python scripts/check-data-charts.py；npm run build；python scripts/check-site.py。浏览器验证脚本与截图保存在仓库外。
