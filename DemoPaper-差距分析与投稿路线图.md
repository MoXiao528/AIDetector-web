# AIDetector Demo Paper 差距分析与投稿路线图

## 0. 一句话结论

`AIDetector-web + AIDetector-Back` 现在已经不像玩具项目，已经有真实产品骨架：认证、额度、历史、PDF 报告、API key、管理员面板、团队接口、Docker、健康检查、外部 detector 适配都在。

但按 ACL / EMNLP / NAACL 近几年 Demo Paper 的标准，它现在更像一个“可上线的检测产品 MVP”，还不是一个“研究社区愿意复用的系统框架”。

**当前最大的差距不是页面不够多，而是：**

1. 论文主线还不够尖
2. benchmark / 实验基本没有
3. 系统还没有真正证明自己的可扩展性
4. 一些能力仍然停留在占位或半开放状态
5. 缺少 ethics / red-teaming framing

如果现在直接投，风险很高。  
如果按下面的路线补齐，投稿成功率会显著上升。

---

## 1. 当前项目已经具备的有利条件

这些东西不是空壳，是真正对 Demo Paper 有帮助的：

### 1.1 工程完成度不错

- 前后端分离完整
- 有登录 / 注册 / guest token
- 有每日额度控制
- 有历史记录与 PDF 报告
- 有 API key
- 有管理员面板
- 有团队接口
- 有 Docker / health / ready

这说明项目已经不是“算法脚本 + 几个页面”，而是一个完整系统。

### 1.2 已经有系统论文喜欢的基础模块

- `detection`
- `history`
- `report export`
- `admin analytics`
- `quota`
- `external detector adapter`

这些模块天然适合写进 demo paper 的 system overview。

### 1.3 已经有 contract-first 意识

你仓库里已经有：

- `contract/openapi.yaml`
- `contract/changelog.md`
- `docs/detection-contract.md`

这说明你不是纯手搓接口，而是已经往平台化、规范化走了。

### 1.4 已经有一部分自动化测试

虽然我这次在当前沙箱里没能把测试实际跑起来，但代码里确实已经有：

- detect 相关测试
- history 测试
- report 测试
- admin 测试
- health 测试
- 外部检测服务客户端测试

这对投稿是加分项，因为说明系统不是完全不可复现。

---

## 2. 距离 Demo Paper 的核心差距

下面是我认为最关键的 gap，按重要程度排。

## 2.1 差距一：定位还停留在“检测工具”，没有升成“研究框架”

现在系统真实主线还是：

- 输入文本
- 调 detector
- 给高亮和分数
- 导出 PDF

这套流程能做产品，但还不够支撑强 demo paper。

### 问题在哪

- 现在最真实的能力只有 `scan`
- `polish / translate / citation` 还没真正跑起来
- 文案里也明确写了系统当前不会 rewrite / polish / translate
- `citation` 仍然是 placeholder 思路

这意味着：

> 论文如果写成“一站式学术写作平台”，会有 overclaim 风险。

### 这会怎么被 reviewer 打

- “系统看起来更像产品，不像研究贡献”
- “真实能力和宣传能力不一致”
- “你到底贡献的是 detector UI，还是写作平台，还是 benchmark framework？”

### 我的判断

现在你最需要的不是再加一页，而是**先把论文主线收尖**。

---

## 2.2 差距二：能力边界和系统叙事不一致

当前系统里存在明显的“未来能力影子”：

- contract 里保留了 `scan / polish / translate / citation`
- schema 里也保留了这些字段
- UI 里也能看到这些入口或残留状态
- 但真实运行时实际上只开了 `scan`

### 这有什么问题

这会让系统看起来像：

- 还没收口
- 设计上没定型
- 论文里很容易出现 overpromise

### 论文视角下的危险点

你如果在 paper 里把这些统称成现有能力，但 live demo 或代码里其实是 placeholder，会非常伤。

### 需要怎么改

要么：

- 彻底把未完成能力从“核心贡献”里拿掉，只承认它们是 roadmap

要么：

- 把其中 1 到 2 个能力做成真实、可复现、可评测的模块

不能继续维持“结构里有，文案里有，系统里没真正完成”的状态。

---

## 2.3 差距三：缺 benchmark，这个是当前最大短板

现在项目有测试，但没有真正的 benchmark。

这里的 benchmark 不是“跑通了几条样例”，而是：

> 固定数据 + 固定任务 + 固定指标 + 固定协议 + 可复现实验结果

### 对你项目最重要的 benchmark 有 4 套

#### A. 文档级检测 benchmark

任务：

- 判 `human vs machine`
- 或更进一步判 `human / machine / machine-humanized / human-polished`

指标：

- Accuracy
- Macro-F1
- AUROC

#### B. 句级定位 benchmark

任务：

- 找出哪些句子高风险

指标：

- sentence-level F1
- span-F1
- top-k recall

#### C. 对抗改写 benchmark

任务：

- 看一段机器生成文本在润色、改写、翻译之后 detector 会掉多少

指标：

- attack success rate
- score drop
- semantic similarity
- fact preservation
- citation preservation

#### D. 引用核查 benchmark

任务：

- 判断 claim 是否被 citation 支持

标签：

- supported
- partially_supported
- unsupported
- not_found

指标：

- macro-F1
- precision / recall
- evidence recall@k

### 为什么这块最重要

因为没有 benchmark，reviewer 很容易下这个结论：

> “这只是一个前端系统，不是一个值得研究社区复用的研究基础设施。”

---

## 2.4 差距四：可扩展性还停留在“可以想象”，还没被证明

你现在的代码结构其实不差，模块拆分也算清楚。

但 demo paper 里 reviewer 不看“你说未来可以扩”，而看：

> 新的 detector / verifier / rewrite backend 能不能低成本接进来？

### 当前问题

- detector 现在本质上还是单一外部后端适配
- 没有真正公开的 plugin / provider registry 机制
- 没有 benchmark runner 去统一比较多个 backend
- 没有标准化的 run artifact 输出

### 审稿人真正想看到的东西

- 新 detector 只需实现一个统一接口
- benchmark runner 能统一调用不同 detector
- 输出统一 JSON / CSV / report artifact
- UI 能选择 backend 并保存 run config

现在这些还没真正成型。

---

## 2.5 差距五：系统还不是 document-centric，后续会限制你

你现在的历史记录本质上还是挂在 detection 上。

这对“检测工具”还勉强够用，但对你后面想做的“一站式学术写作平台”不够。

### 为什么不够

因为你后面想做的是：

- 写作
- 保存版本
- 局部改写建议
- 局部翻译建议
- 引用核查
- 版本回滚
- patch 应用
- 多轮审计

这些都不是“检测记录”这个模型能自然承载的。

### 正确方向

后续必须逐步切到：

- `Project`
- `Document`
- `DocumentVersion`
- `Run`
- `RunResult`
- `Suggestion`
- `Claim`
- `Evidence`

也就是：

> 从 detection-centric 转成 document-centric

这是你从“检测网站”升级成“写作工作台”的结构性前提。

---

## 2.6 差距六：缺少 ethics / red-teaming 护城河

这个点现在还没真正写出来。

如果后续你要做：

- 改写
- 润色
- 翻译
- 绕检测对抗测试

那 reviewer 很可能直接问：

> 你这个系统是在帮助研究，还是在帮助规避检测？

### 正确的 framing

必须明确写成：

- rewrite / polish 的研究目的不是帮助作弊
- 而是作为 `red-teaming` 模块，暴露 detector 脆弱性
- citation / evidence verification 是责任护栏
- 系统目标是提升 detection 和 verification 的鲁棒性

这个 ethics statement 后面是必须有的，不是 optional。

---

## 2.7 差距七：生态兼容还不够强

你已经有 REST API、API key、Docker，这很好。

但距离“研究生态兼容”还差几步：

- contract 还没有完整覆盖运行时实现
- 缺少标准化 benchmark artifact
- 缺少 CLI / batch runner
- 缺少研究者友好的 JSON / CSV 导出规范
- integration story 还没有真正打开

所以现在系统虽然“有接口”，但还没有形成强的 ecosystem story。

---

## 3. 结合你的想法，系统应该往哪个方向收束

你提的目标是：

> 后续把这个平台变成一个可以一站式完成学术写作的网站，从开始编写到结束核查、润色、优化都能做。

这个想法本身没问题，而且方向是对的。

但我建议分开看：

## 3.1 产品主线

产品上，你完全可以往这个方向做：

### `Academic Writing Audit Workspace`

核心工作流：

1. 写作 / 导入论文
2. 句级 / 段级 AI 风险检测
3. 风格与表达润色建议
4. 翻译建议
5. claim / citation / evidence 核查
6. 版本 diff 与 patch 应用
7. 导出报告

这个方向是成立的。

## 3.2 论文主线

但论文上，不建议直接写成“万能论文写作网站”。

最容易中的写法应该是二选一。

### 方案 A：我更推荐

#### `A framework for fine-grained MGT detection, adversarial rewriting evaluation, and citation-grounded verification`

这条线的优点：

- 学术味更强
- 更像研究工具
- 更适合顶会 demo

### 方案 B：次优

#### `A document-centric academic writing audit workspace`

这条线更产品化，能讲工作流，但会更容易被质疑“只是功能集成”。

### 我的建议

**产品可以往一站式平台做。**  
**论文不要贪大，先选一个尖主线。**

最推荐的论文题眼是：

> 细粒度检测 + 对抗改写评测 + 引用/证据核查

而不是“啥都能做”。

---

## 4. 如果以后真往一站式学术写作平台走，正确的系统形态是什么

## 4.1 核心原则：不要再以 detection record 为中心

未来系统应该以“文档”而不是“检测结果”作为中心对象。

### 建议的核心实体

- `Project`
- `Document`
- `DocumentVersion`
- `Run`
- `RunResult`
- `Suggestion`
- `CitationAnchor`
- `CitationSource`
- `Claim`
- `Evidence`

## 4.2 核心交互原则：不要让 AI 直接覆盖正文

不管是润色、翻译还是引用修正，都不要直接改原文。

正确做法：

- AI 先生成 patch suggestion
- 用户逐条 accept / reject
- 应用后生成新版本

这样系统会天然有：

- audit trail
- diff
- rollback
- 可解释性

这对产品和论文都是好事。

## 4.3 句级检测不要裸做句子分类

后面如果做句级检测，建议采用：

> 句级展示，窗口级推断

原因很简单：

- 单句文本太短，不稳定
- detector 在短句上波动很大
- 实际更稳的做法是用 sentence window 聚合结果

推荐流程：

1. sentence segmentation
2. 为每句构造上下文窗口
3. 跑 detector
4. 把多个 window 聚合成 sentence score
5. UI 做句级高亮

## 4.4 引用核查应该做成 evidence pipeline，不是单纯“查引文”

推荐流程：

1. 解析 bibliography
2. 抽取正文 claim
3. 找 claim 对应 citation anchor
4. 检索 Crossref / OpenAlex / Semantic Scholar
5. 做 evidence retrieval
6. 输出 `supported / partially_supported / unsupported / not_found`

这块如果做扎实，非常像强 demo contribution。

---

## 5. 投稿前必须补的事项

下面按优先级分级。

## 5.1 P0：不补基本别投

### P0-1. 收紧论文主线

先确定你到底投哪条：

- 检测 + 对抗 + 核查 framework
- 还是 document-centric academic writing workspace

不收口，后面所有功能都会变散。

### P0-2. 做 benchmark v1

至少要有：

- doc detection benchmark
- adversarial rewrite benchmark

如果你主打句级检测，再加：

- sentence localization benchmark

### P0-3. 清掉“真实能力”和“占位能力”的不一致

要么做真：

- `citation`
- `polish`
- `translate`

要么先不要把它们写成核心贡献。

### P0-4. 修 contract / runtime 漂移

现在 contract-first 的姿态是对的，但实现覆盖还不完整。

投稿前必须做到：

- OpenAPI 覆盖主要对外接口
- contract / schema / UI 语义一致
- 不要出现实现里有、contract 里没有的核心接口

### P0-5. 补 ethics statement

尤其是如果后面上：

- rewrite
- polish
- translation

必须解释红蓝对抗目的和责任边界。

---

## 5.2 P1：强加分项

### P1-1. document-centric v2 数据模型

把系统逐步从：

- detection history

切到：

- document / version / run / suggestion

### P1-2. patch-based polish

不要全文替换，做：

- span-level suggestion
- accept / reject
- 版本 diff

### P1-3. sentence-window detection

这会让“句级检测”真正有技术含量，不只是 UI 高亮。

### P1-4. benchmark runner

不是论文里临时跑脚本，而是系统内建：

- 选 dataset
- 选 detector
- 选任务
- 导出结果

### P1-5. 标准化导出

至少支持：

- JSON
- CSV
- PDF

PDF 是给用户，JSON / CSV 是给研究社区和复现实验。

---

## 5.3 P2：有用，但别优先

这些东西对产品可能有价值，但对首篇 demo paper 不是最优先：

- LMS / Moodle / Canvas 集成
- Chrome 插件
- 大量营销页面
- 定价包装
- 更复杂的 admin 运营能力
- 花哨的多租户商业化功能

这些后面可以做，但不要抢掉 benchmark 和核心架构改造的预算。

---

## 6. 一个更靠谱的实现顺序

这是我建议的顺序，尽量避免返工。

## Phase 1：先把论文最需要的东西补出来

### 目标

把系统从“检测产品 MVP”拉到“可投稿的研究系统”。

### 先做

1. 定题眼
2. 补 benchmark 数据与脚本
3. 整理 OpenAPI / schema / UI 语义
4. 清理 placeholder 能力
5. 补 ethics statement

### 结果

这一步结束后，即使产品能力没有暴增，也已经更像 demo paper 了。

---

## Phase 2：做真正的差异化功能

### 建议优先顺序

1. sentence-window detection
2. patch-based polish
3. citation verification
4. benchmark runner

### 为什么这样排

- 句级检测是你“细粒度系统”的基础
- patch-based polish 能把产品从检测器升级到写作工作台
- citation verification 是最有可能打动 reviewer 的强模块
- benchmark runner 能把所有能力组织成研究基础设施

---

## Phase 3：再做一站式学术写作平台

### 这一步再做

- DocumentVersion
- Diff
- multi-run workspace
- 多模块协同审计
- 协作
- 项目级导出

这一步更像产品扩展，不一定是首篇 demo paper 必须品。

---

## 7. 我对中稿概率的判断

这是经验判断，不是精确预测。

## 7.1 如果现在直接投

我估计：

### `10% - 20%`

因为最容易被 reviewer 质疑：

- 主线不够尖
- 没 benchmark
- placeholder 太多
- 更像产品而不是研究框架

## 7.2 如果你把核心功能都做了，但论文还是写成“大杂烩平台”

我估计：

### `20% - 35%`

因为功能多不等于 demo paper 强。

## 7.3 如果你收尖主线 + benchmark 扎实 + 系统可复现 + live demo 真实

我估计：

### `40% - 60%`

这是比较现实的“强投稿”区间。

## 7.4 如果 citation verification / adversarial benchmark 做得很硬

再加：

- 开源可复现
- 好视频
- 清晰 ethics

那往上走是有机会的。

---

## 8. 最后给你的直接建议

如果目标是“后续能发 demo paper”，我的建议非常明确：

### 建议 1

**不要把第一篇 paper 写成万能平台。**  
先把题眼收成：

> 细粒度检测 + 对抗改写评测 + 引用核查

### 建议 2

**benchmark 是头号优先级。**  
没有 benchmark，系统再完整也容易被看成产品 demo，不是研究 demo。

### 建议 3

**把系统底层改成 document-centric。**  
否则你后面加润色、翻译、版本管理时会非常别扭。

### 建议 4

**润色和翻译必须走 patch / suggestion 模式，不要直接改正文。**

### 建议 5

**citation verification 值得重投资源。**  
这是你从“检测器”升级成“学术写作审计系统”的关键一刀。

### 建议 6

**先做少数几个真实、可评测、可复现的模块，不要把系统做散。**

最忌讳的是：

- 功能全都沾一点
- 每个都不够硬
- 论文最后写成“我们集成了很多能力”

这是最容易掉进的坑。

---

## 9. 推荐的最终定位

### 产品定位

`Academic Writing Audit Workspace`

### 更适合首篇 Demo Paper 的论文定位

`A framework for fine-grained machine-generated text detection, adversarial rewriting evaluation, and citation-grounded verification`

这两个定位不冲突：

- 产品可以继续往一站式学术写作平台长
- 论文先讲一个更尖、更容易中的系统贡献

---

## 10. 结尾

你现在这个项目最好的地方，不是“有个前端页面”，而是：

> 它已经有了长成研究系统和产品系统的双重基础。

但离 demo paper 还差一段距离。  
这段距离主要不是“再写几个页面”，而是：

- 收紧主线
- 做 benchmark
- 证明 extensibility
- 建立 document-centric 结构
- 写清 ethics

如果你按这个顺序补，项目会越来越像一个真正能投的 demo system，而不是只是一套工程完成度还不错的产品壳。
