# RepreGuard Web 工作台

在浏览器中粘贴文本，或导入 TXT、DOCX、PDF，运行 AI 文本检测并查看段落高亮。文件在浏览器内解析，检测时只提交提取后的文本。检测完成后可以回看历史记录，登录后可以导出 PDF 报告。

- **前端**（本仓库）负责文档编辑、检测结果、历史和报告入口。
- **后端**负责会话、配额、历史和报告，并调用检测服务。[AIDetector-Back](https://github.com/MoXiao528/AIDetector-Back/blob/main/README.md)
- **检测端**运行文本检测模型，可选返回语言和领域路由，供后端生成写作特点分析。[RepreGuard 检测服务](https://github.com/MoXiao528/repre_guard_server/blob/main/README.md)

## 快速开始

使用 Node.js 22，与 CI 一致。

```bash
git clone https://github.com/MoXiao528/AIDetector-web.git
cd AIDetector-web
npm ci
```

开发配置默认直连 `http://localhost:8020`。如果使用直连，将浏览器中打开的前端源（默认 `http://localhost:5300`）加入后端的 `BACKEND_CORS_ORIGINS`。也可以在仓库根目录创建 `.env.development.local`，通过 Vite 走同域代理。

```env
VITE_API_BASE_URL=
VITE_DEV_PROXY_TARGET=http://localhost:8020
```

```bash
npm run dev
```

打开 `http://localhost:5300`，端口被占用时以终端输出为准。

- **浏览示例**。首页点「查看示例」，可以在后端未启动时查看随前端打包的检测结果。
- **检测自己的文本**。按各端 README 启动检测服务和后端，确认后端 `/api/v1/ready` 返回 `database: ok` 和 `detect_service: ok`。打开 `/dashboard`，选择「开始新检测」，粘贴至少 200 个非空白字符，或拖入含足量文字的文档，再点「开始检测」。可以用游客会话完成这一步。

## 环境变量

| 变量 | 用途 | 何时生效 |
| --- | --- | --- |
| `VITE_API_BASE_URL` | 浏览器请求的 API 源。开发默认是 `http://localhost:8020`，留空时走同域 `/api/`。 | 启动开发服务器或生产构建时 |
| `VITE_DEV_PROXY_TARGET` | Vite 开发代理的上游地址，仓库开发配置为 `http://localhost:8020`。 | 仅开发环境通过 Vite 代理请求 `/api/` 时 |
| `VITE_EVIDENCE_ENABLED` | 控制写作特点展示。显式设为 `false` 时隐藏，未配置时显示可用数据。 | 启动开发服务器或生产构建时 |

进程环境变量优先于 `.env` 文件。同一模式下，`.env.<模式>.local` 优先于 `.env.<模式>`。修改开发配置后重启 Vite，修改生产配置后重新构建并部署。浏览器可读取构建时写入产物的 `VITE_*` 值，密钥留在服务端。

写作特点要在新检测结果中出现，需先验收检测端并设置后端 `DETECT_EVIDENCE_MODE=serve`。暂停计算时在后端设为 `off`，前端开关只影响展示。

## 本地检查

```bash
npm run check
```

`check` 依次执行 ESLint（`npm run lint`）、类型检查（`npm run typecheck`）和 Vitest（`npm run test:smoke`）。CI 还会执行 `npm run build`。

## 生产构建

在根目录配置 `.env.production`，或使用优先级更高的 `.env.production.local`。下面以同域部署、关闭写作特点展示为例。

```env
VITE_API_BASE_URL=
VITE_EVIDENCE_ENABLED=false
```

```bash
npm ci
npm run build
```

构建产物位于 `dist/`，部署时上传目录内的全部文件。部署后检查首页、`/dashboard` 直接访问及刷新，再验证检测、历史记录和登录后的 PDF 导出。
