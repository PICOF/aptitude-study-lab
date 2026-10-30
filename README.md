# 行测自习室

一个无需登录的中文静态备考网站。以通俗讲解、原创例题、可检索知识卡片和公开资料来源，帮助学习数量关系、资料分析、言语理解、常识与时政。

在线阅读：**https://picof.github.io/aptitude-study-lab/**

## 企业文化与时政自测（2026-10-30新增）

共68个知识点、204道原创变式题：中国国新20课／60题，中远海运20课／60题，独立时政28课／84题。共25条官方来源记录，各题均能回查对应知识点及原文。

- [企业文化](https://picof.github.io/aptitude-study-lab/culture.html)：中国国新、中远海运集团分别学习，支持按知识类型筛选。采用本轮实际读取的官网现行口径，区分旧版文化、集团与下属企业。
- 左侧“企业文化”可展开企业列表；[中国国新](https://picof.github.io/aptitude-study-lab/culture-guoxin.html)和[中远海运](https://picof.github.io/aptitude-study-lab/culture-cosco.html)各有独立页面。选中企业后显示“知识学习”“题目训练”两个入口，训练页仅显示该企业范围，旧企业锚点链接自动跳转。
- 每家企业与时政各采用一篇完整章节，知识点全文连续展示。“知识学习”下按知识类型展开页内目录；蓝色圆角卡是知识要点、白色正文卡是内容讲解、绿色资料卡是官方阅读材料、灰色虚线卡是引用与核验记录。旧单知识点页面及搜索结果转到章节内对应位置，检测与学习记录沿用原题库。
- [独立时政专题](https://picof.github.io/aptitude-study-lab/current-affairs.html)：2026年两会与十五五、科技创新、国资金融、绿色发展、交通航运、开放发展等，明确目标／实绩、通过／施行的时间口径。
- [自测与错题](https://picof.github.io/aptitude-study-lab/exam.html)：按板块、类型、知识点和题型组卷，可选10／20／30题或全部题目；每个知识点另有专属课后检测。
- [全部原文依据](https://picof.github.io/aptitude-study-lab/exam-sources.html)：每条来源标明支持范围、发布日期和本轮核验日期。截止日后的新政策不会自动纳入。

练习支持题目及选项乱序、答题卡、待复查标记、自动保存草稿、整套提交、得分、逐题解析、薄弱知识点、原卷重做、错题复练和历史成绩。每题等权，总分折算100分；多选需全部选对，少选、多选、错选和未答均不得分。这是本站练习规则，不代表实际考试规则；全部为原创教学题，非官方真题。

草稿按企业或时政分别保存；最近50次交卷记录、错题与学完标记存于当前浏览器的 `aptitude-exams-v1`。可导出／导入 JSON 备份，不跨设备自动同步。题库版本改变时启用新记录，旧版原始记录保留在 `aptitude-exams-v1-previous`，避免依据已修改题目错误复用分数；旧版本记录不能直接导入新题库。请在清理浏览器数据前导出备份。

新增内容分别位于 `content/exam-guoxin.json`、`exam-cosco.json`、`exam-current.json`，每个知识点至少三道变式题，题目与课程均绑定来源。`scripts/validate-exams.mjs` 检查引用、题型、选项、解析和每课覆盖数，`tests/exam-core.test.mjs` 验证筛选与判分行为。原有 Actions 的 `npm test` 会执行这些检查，通过后才构建部署。

## 内容与边界

- 数量关系：建模、代入、整除奇偶、比例赋值、工程行程、利润浓度、容斥、组合概率、最值、数字推理、几何及特殊题型。
- 资料分析：口径定位、截位估算、基期与增长、两期比重、平均数、倍数、混合增长和综合判断；另有分组柱状、累计折线、两期饼图、堆积柱状和柱线双轴五组完整图表材料题。
- 言语理解：主旨意图、细节、标题、衔接排序、逻辑填空、词语成语辨析。
- 常识与时政：知识卡片与复习方法。每张卡关联来源，时政明确年份与资料截止日期。

来源核验截至 **2026-10-23**。时政是精选重点，不是全年新闻的完整收录；未来内容不会自动刷新。国央企没有统一行测考纲，具体科目以招聘公告和测评通知为准。本版四个板块不包含完整图形推理、其他判断推理、英语或专业课。

站内例题明确标记为原创教学例题，不冒充真题。常用方法不等于固定提分承诺；词卡也不是统计得到的考频排名。视频核验以可公开访问的元数据和目录为限，没有声称逐分钟看完或验证学习效果。第三方课程与原文的权利归原作者。

## 本地开发

需要 Node.js 20+；数值校验使用 Python 3 标准库。

```sh
npm ci
npm test
python scripts/check-quantity.py
python scripts/check-data.py
python scripts/check-quantity-applied.py
python scripts/check-data-charts.py
npm run build
python scripts/check-site.py
npm run dev
```

预览：`http://127.0.0.1:4173/aptitude-study-lab/`。

生成结果在 `dist/`。全部课程预渲染为独立 HTML；导航和正文不依赖后端。静态搜索、记忆卡片与学习记录使用少量浏览器 JavaScript，无远程模型或付费 API。收藏、进度与卡片状态保存在浏览器 localStorage，可在“我的学习记录”导入导出。

## 发布

`.github/workflows/deploy.yml` 在 `main` 推送后执行内容检查、数值校验、静态构建和 GitHub Pages 部署。仓库 Pages 的 Source 需设为 **GitHub Actions**。页面使用相对路径适配项目子目录。

如果部署到别的用户名或仓库名，修改 `scripts/build.mjs` 中仓库链接、站点地图网址与404页的绝对前缀，以及本README的网址。普通页面资源路径无需修改。

## 更新内容

`content/quantity.json`、`data.json`、`verbal.json`、`knowledge.json` 是四个主体；`knowledge-extra.json` 和 `knowledge-policy-extra.json` 在构建时并入知识板块。

图表实战在 `content/data-charts.json`；图表数值、系列、坐标轴和数据表使用同一份结构化数据，SVG由 `scripts/charts.mjs` 预渲染，无外部图表运行库。手机使用单独的紧凑坐标布局，较宽图在容器内横向滚动。数据表和读图提示默认收起。

`quantity-applied.json`、`verbal-applied.json`、`knowledge-applied.json` 补充情境训练；数量图示绑定具体例题ID，图中只给已知条件，答案留在解析中。`scripts/content.mjs` 统一加载补充内容，导航、搜索、来源和课程统计一起更新，原有课程ID保持不变。

每课包含：学习摘要、正文、建议用时、标签、2—3道题、逐步解析、陷阱和来源ID。每张卡包含：问题、答案、记忆提示、易错点、例句和来源ID。参考来源必须说明实际支持的内容及核验日期；不能只挂门户入口来代替事实核验。

数值例题由 `check-quantity.py` 和 `check-data.py` 用精确分数或枚举独立复算。`reviewed-examples.json` 保存已审校例题文本摘要，防止改了题干而未同步复核答案。修改数值题后，应先重新计算和审校，再更新对应摘要；不要绕过失败检查。

新增应用题另由 `check-quantity-applied.py` 和 `check-data-charts.py` 校验。`check-site.py` 检查生成页的链接、锚点与重复ID，并从SVG元素反查柱高、分类位置、堆积连续性、左右轴折线点和饼图角度，避免数据对而画错图。

浏览器验证应覆盖手机与桌面、答案展开、搜索、导航焦点、收藏/进度持久化、卡片筛选翻面与计算图示。教学图示采用可访问的 SVG；动画尊重系统“减少动态效果”设置。
