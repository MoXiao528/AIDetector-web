# AIDetector Web V2.0

`AIDetector-web` 是 AIDetector V2.0 的前端仓库。当前正式交付的是一个以 AI 文本检测为核心的 Web 工作台，不是完整的学术写作平台。

V2.0 当前正式提供：
- 首页与产品入口
- 检测工作台
- 游客 / 登录 / 注册
- 历史记录与 PDF 报告
- API Key 相关页面与入口
- 管理后台页面
- Dashboard 内静态 QA 帮助面板
- RoBERTa v2.0 概率分数展示、阈值语义摘要和段落高亮

## V2.0 边界

### 已开放
- 文本检测 `scan`
- 历史记录
- PDF 报告
- 配额显示
- 游客模式
- 登录 / 注册
- 管理后台

### 未开放
- `polish`
- `translate`
- `citation`
- `pricing`
- `contact`

说明：
- 代码里如果仍有占位字段或旧页面，不代表功能已上线。
- V2.0 对外口径只以“已开放”列表为准。

## 技术栈

- Vue 3
- Vue Router
- Pinia
- Vite
- Tailwind CSS

常用命令：

```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm run test:smoke
npm run build
```

## 环境变量

前端只关心两个变量。

### `VITE_API_BASE_URL`

生产环境推荐留空：

```env
VITE_API_BASE_URL=
```

留空后前端会直接请求同域 `/api/...`。

### `VITE_DEV_PROXY_TARGET`

本地开发默认代理到后端 `8020`：

```env
VITE_DEV_PROXY_TARGET=http://localhost:8020
```

## 本地开发

### 准备

```bash
cp .env.example .env.local
```

### 启动

```bash
npm install
npm run dev
```

默认前端开发地址通常是：

- `http://localhost:5300`（以 `vite.config.js` 为准；端口占用时 Vite 可能自动递增）

RoBERTa V2.0 本地联调顺序：

```text
RepreGuard detect service -> http://127.0.0.1:9000
AIDetector-back API       -> http://127.0.0.1:8020
AIDetector-web Vite       -> http://localhost:5300
Docker API container      -> http://host.docker.internal:9000
```

## 生产构建

```bash
npm install
npm run build
```

构建产物输出到：

- `dist/`

## V2.0 推荐部署方式

推荐结构：

1. 前端 `dist/` 直接放到服务器静态目录
2. 后端服务只监听 `127.0.0.1:8020`
3. 反向代理统一把 `/api/...` 转发到 `127.0.0.1:8020`
4. 前端继续请求相对路径 `/api/...`

正确流量路径：

```text
Browser -> https://your-domain.example
Browser -> https://your-domain.example/api/... -> reverse proxy -> 127.0.0.1:8020
```

不要把前端生产环境写成请求 `localhost:8020`，因为浏览器里的 `localhost` 指向的是用户自己的机器。

## 当前真实页面边界

默认正式开放的页面只有：

- `/`
- `/dashboard`
- `/login`
- `/register`
- `/admin/overview`
- `/admin/users`
- `/admin/detections`

当前行为：

- `/scan` 重定向到 `/dashboard`
- `/multi-upload` 重定向到 `/dashboard`

下面这些页面代码存在，但默认不对用户开放：

- `/contact`
- `/pricing`

说明：Dashboard 内的 `qa` 面板是静态帮助内容，当前可访问；独立路径 `/qa` 仍由路由守卫拦截，不作为 V2.0 对外页面。

## 文件导入和富文本预览

当前可见文件导入链路已经支持：

- 编辑器内容保留富文本结构高亮
- `div / p` 等块级结构会映射为换行文本，避免送检文本被拼成 `FirstSecond`
- `docx` 结构化导入
- `pdf` 尽量结构化重建
- 未知文件类型不会强行按文本读入编辑器

所有当前可见的文件导入都只在浏览器本地解析。前端只把解析后的文本内容送去检测，原始文件不会上传到后端。

## Evidence Engine V1：接口与四维卡片

前端将可选 Evidence 沿 API → store → 当前结果 / 历史记录传递，在检测侧栏和历史详情抽屉复用同一个四维面板，展示只读路由、证据可用性和逐项参考解释。主模型 score、阈值、AI/Human 标签、顶部百分比和段落高亮保持现有行为。实施、验收与发布进度只记录在研究仓库的[唯一实施台账](https://github.com/MoXiao528/AIDetector-evidence-research/blob/main/EVIDENCE_V1_IMPLEMENTATION_TRACKER.md)，面板存在不表示已上线。

- 公共 Evidence 只取检测响应和历史记录根级的 `evidence`，不从 `result` / `analysis` 内读取；旧响应省略该字段时继续按现有方式展示。前端不把 Evidence 写入历史创建请求或 Web Storage。
- 四维卡片按后端顺序展示词汇 5 项、短语模板 2 项、句段节奏 9 项、语篇衔接 6 项，使用原生 `details/summary`，默认收起。每项显示已有观察值与 Human/AI `referenceRanges`；区间是同单位的 Q05–Q95 闭区间，不是置信区间或来源概率。仅用 `Intl.NumberFormat` 显示最多 6 位有效数字，不换算比例、不计算关系或合成评分；保留 0、等端点区间、小数长度、大于 1 的 CV，以及观察值和参考各自的缺失状态。
- 中文句段长度与标点密度按汉字计，其他支持语言按词元计；过渡表达密度始终按词元计。MATTR 使用词元窗口；“过渡表达词表覆盖率”不是自由词汇多样性，“首尾段”限于前 100 段，不代表自动识别引言与结论。
- `ready/partial/insufficient` 保留四维卡片；所有公开状态都显示对应 Quality 和原因，`unsupported/failed` 没有路由或指标卡片；缺失 Evidence 完全不渲染面板。参考百分位仅显示数值，不增加图表、文本摘录、定位或语言/领域/generator 选择器。
- 自动路由只读显示语言、领域、长度档与参考分组；`exact/language_length/language` 分别表示同语言领域长度、跨领域同语言长度、同语言跨领域长度的参考范围，`unavailable` 表示本次未使用参考组，不擅自归因为参考库缺数据。两个 confidence 是 XLM-R 语言边缘诊断值和所选语言内的条件领域诊断值，不是 py3langid 分数；保持 0–1 数值且不新增低分弃权阈值。
- Quality 只消费后端 `level/coverage/reasons`，coverage 用百分比格式化、保留 1 位小数且分母固定 22，不在前端重新计数；例如 19/22 显示为 86.4%，不会改成 19/19。全部 28 个公共原因均有中英文文案，区分观察不足、参考样本不足、语言无法确定、语言不支持、服务失败和参考范围扩大；不回显原始异常或原因码。
- 每项 `sampleCount` 是该指标的 Human/AI 配对共同有效来源组数，保留 0、1–9、null 及完整整数，不跨指标相加或作为路由总 N。两侧参考百分位直接展示后端 0–100 近似值；`relation` 直接显示低于/位于/高于范围，不按百分位或舍入值重判。Q05/Q95 端点允许 P2.5/P97.5 且关系仍为 within。
- `reference_mismatch` 表示主结果对应侧范围外、另一侧范围内的逐项参考差异，不表示主模型判错；`outside_both` 表示两侧范围外，null 不产生“主结果正确”的结论。提示跟随指标，折叠维度标题显示中性的“有参考提示”，不计票、不生成新标签、不从顶部百分比推断主标签。两处面板复用原 Evidence prop，历史切换清除旧元信息。
- 后端 Evidence 默认 `off`；`off` / `shadow`、无快照或无效快照时，公共响应省略 Evidence。历史和幂等回放使用服务端保存并投影的快照，前端不重新提取、比较或按当前 Bundle 重算。历史 PATCH 沿用只更新历史集合的行为，重新选择记录时再加载该结果。
- `confidence`、参考百分位、`coverage` 都不是 AI 概率或判断正确率。保留 classifier-only internal CV、支持 `8×6 always-route` 和两项治理豁免；waiver 不等于认证通过。历史统计/Reference cohort 受旧排除比例算法影响的范围仍未核查，Runtime 修复不代表历史产物已经修复。
- offsets 是提交原始整文上 0-based Unicode code-point 半开区间 `[start, end)`，当前原样传递。定位前不得先 trim、NFKC、折叠空白或从 HTML 重新提取文本；以后接入 DOM 定位时，需将这些原文边界转换为 JavaScript UTF-16 索引，不能直接用 offsets 切字符串或 HTML。
- 本地 Vue Test Utils/Vitest 使用真实挂载组件和受控 API 响应验证；happy-dom 测试与构建不代表真实浏览器响应式/键盘验收、真实服务联调或生产部署通过。目标 Linux 部署仍按用户决定暂缓。

`POST /api/v1/detect` 单独使用 180 秒客户端超时，其他 API 仍使用 15 秒默认值。依据当前后端默认主检测预算 120 秒、随后 Evidence 总预算 12 秒，并给结算与传输留出余量；这不是所有后端配置下的响应时间保证。若后端预算或反向代理超时调整，需重新核对整条请求链。请求超时沿用原错误与幂等重试行为，不自动重发、不提前给出替代结果。

CI 使用 Node 22，在 push 和 pull request 上按 `package-lock.json` 执行 `npm ci`、`npm run check`、`npm run build`。本机已有依赖时直接使用下面的验收命令；CI 通过不代表目标 Linux 部署通过。W1 合并前须等待最终 head 的 CI 和 Codex review 完成并处理实际发现。

## V2.0 验收清单

```bash
npm run check
npm run lint
npm run typecheck
npm run test:smoke
npm run build
```

和后端联调上线时，再一起检查：

- 首页加载
- 游客检测
- 游客额度不足后的登录/注册引导
- 登录 / 注册回跳
- 登录后检测
- 历史记录
- PDF 报告
- 管理后台

## 后续优化方向

### 体验层
- 更稳的句级定位
- 更细的检测结果 hover / 对照联动
- 长文档编辑体验和版本回滚
- 结构化导入结果的差异对比

### 产品层
- 润色建议
- 翻译
- 引用核查
- 学术写作工作流

### 工程层
- 更完整的 E2E 回归
- 与 OpenAPI 的类型同步进一步自动化
- 收口隐藏页面与历史占位模块

后端部署和接口说明看同级后端仓库：

- `..\AIDetector-Back\README.md`
- `..\AIDetector-Back\docs\deploy-cutover-checklist.md`
- `..\AIDetector-Back\contract\openapi.yaml`

