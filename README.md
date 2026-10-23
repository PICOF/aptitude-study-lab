# 行测自习室

一个无需登录的中文静态备考网站。以通俗讲解、原创例题、可检索知识卡片和公开资料来源，帮助学习数量关系、资料分析、言语理解、常识与时政。

在线阅读：**https://picof.github.io/aptitude-study-lab/**

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
