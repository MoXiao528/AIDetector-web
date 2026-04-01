# AIDetector Web V1.0

`AIDetector-web` 是 AIDetector V1.0 的前端仓库。当前正式交付的是一个以 AI 文本检测为核心的 Web 工作台，不是完整的学术写作平台。

V1.0 当前正式提供：
- 首页与产品入口
- 检测工作台
- 游客 / 登录 / 注册
- 历史记录与 PDF 报告
- API Key 相关页面与入口
- 管理后台页面

## V1.0 边界

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
- `qa`
- `contact`

说明：
- 代码里如果仍有占位字段或旧页面，不代表功能已上线。
- V1.0 对外口径只以“已开放”列表为准。

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

- `http://localhost:5173`

## 生产构建

```bash
npm install
npm run build
```

构建产物输出到：

- `dist/`

## V1.0 推荐部署方式

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
- `/qa`
- `/pricing`

## 上传和富文本预览

当前可见上传链路已经支持：

- 编辑器内容保留富文本结构高亮
- `docx` 结构化导入
- `pdf` 尽量结构化重建

但要知道：

- 隐藏的后端 `/api/v1/detections/parse-files` 仍然只是纯文本解析接口
- 当前可见上传体验依赖的是前端本地结构化导入逻辑

## V1.0 验收清单

```bash
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
- 结构化上传结果的差异对比

### 产品层
- 润色建议
- 翻译
- 引用核查
- 学术写作工作流

### 工程层
- 更完整的 E2E 回归
- 与 OpenAPI 的类型同步进一步自动化
- 收口隐藏页面与历史占位模块

后端部署和接口说明看：

- [README.md](/D:/Code/AIDetector-Back/README.md)
- [deploy-cutover-checklist.md](/D:/Code/AIDetector-Back/docs/deploy-cutover-checklist.md)
- [openapi.yaml](/D:/Code/AIDetector-Back/contract/openapi.yaml)
