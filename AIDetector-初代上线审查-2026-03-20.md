# AIDetector 初代上线审查

日期：2026-03-20  
范围：`D:\Code\AIDetector-web` + `D:\Code\AIDetector-Back`

## 已修复

### P1-1 前端 API 配置仍带开发默认值

问题：
- 前端曾直接把 `http://localhost:8000` 当默认 API 地址。
- 一旦生产构建误带该配置，用户浏览器会请求自己的本机。

处理：
- 前端默认改为走相对 `/api`。
- `VITE_API_BASE_URL` 仍可覆盖默认值。
- 非 `development` 模式下如果把 `VITE_API_BASE_URL` 配成 `localhost/127.0.0.1` 或带路径，构建直接报错。
- 增加 `.env.development` 和 `.env.example`。

定位：
- `D:\Code\AIDetector-web\src\api\client.ts:30`
- `D:\Code\AIDetector-web\vite.config.js:6`
- `D:\Code\AIDetector-web\.env:1`
- `D:\Code\AIDetector-web\.env.development:1`
- `D:\Code\AIDetector-web\.env.example:1`

### P1-2 multi-upload 仍可通过路由直达

问题：
- 虽然 UI 入口已隐藏，但直接访问 `/multi-upload` 仍能进入页面。

处理：
- `/multi-upload` 改为直接重定向到 dashboard。
- 路由白名单移除 `multi-upload`。
- 登录后跳转白名单同步移除 `/multi-upload`。
- 扫描页隐藏分支统一改成 `Coming Soon`。

定位：
- `D:\Code\AIDetector-web\src\router\index.js:27`
- `D:\Code\AIDetector-web\src\router\index.js:98`
- `D:\Code\AIDetector-web\src\pages\LoginPage.vue:216`
- `D:\Code\AIDetector-web\src\pages\ScanPage.vue:2187`

### P1-3 敏感文本与历史仍落 localStorage

问题：
- 原文、编辑器 HTML、历史记录和分析详情曾被写入 `localStorage`。

处理：
- 历史记录不再持久化到 `localStorage`，旧缓存会在初始化时清理。
- 游客历史仅保留当前会话内存态，不再跨刷新持久化。
- 草稿本地只保留无敏感的 UI 状态，不再保存 `inputText` 和 `editorHtml`。

定位：
- `D:\Code\AIDetector-web\src\store\scan.js:558`
- `D:\Code\AIDetector-web\src\store\scan.js:567`
- `D:\Code\AIDetector-web\src\store\scan.js:765`
- `D:\Code\AIDetector-web\src\store\scan.js:863`
- `D:\Code\AIDetector-web\src\store\scan.js:877`
- `D:\Code\AIDetector-web\src\store\scan.js:916`

### P2-1 兼容扫描接口会返回伪造增强结果

问题：
- 兼容扫描接口曾伪造 `translation / polish / citation`。
- 主检测链路在传入这些函数时也会把假结果写进分析结构。

处理：
- 后端能力面收成 `scan only`，不再接受未上线功能作为真实能力。
- `_detect_impl` 统一过滤为 `scan`。
- 历史分析结构不再伪造 `translation / polish / citation`。
- `/api/v1/api/scan/detect` 改为复用真实 `/detect` 结果做兼容映射。

定位：
- `D:\Code\AIDetector-Back\backend\app\api\v1\detections.py:39`
- `D:\Code\AIDetector-Back\backend\app\api\v1\detections.py:70`
- `D:\Code\AIDetector-Back\backend\app\api\v1\detections.py:152`
- `D:\Code\AIDetector-Back\backend\app\api\v1\detections.py:235`
- `D:\Code\AIDetector-Back\backend\app\api\v1\detections.py:332`
- `D:\Code\AIDetector-Back\backend\tests\test_detect.py:157`

### P2-2 健康检查是假绿

问题：
- `/health` 曾无条件返回 `ok`，不能代表数据库和 detect service 真实可用。

处理：
- 保留 `/health` 作为 liveness。
- 新增 `/ready` 作为 readiness。
- `/ready` 同时检查数据库和 RepreGuard 的 `/health`。
- 新增 detect service health client，并补了成功/失败测试。

定位：
- `D:\Code\AIDetector-Back\backend\app\api\v1\health.py:12`
- `D:\Code\AIDetector-Back\backend\app\api\v1\health.py:22`
- `D:\Code\AIDetector-Back\backend\app\services\repre_guard_client.py:36`
- `D:\Code\AIDetector-Back\backend\tests\test_health.py:1`

## 仍待处理

### P2 营销与联系链路仍有假入口

问题：
- 落地页 CTA 提交只是跳注册，填写的邮箱未被使用。
- Footer 订阅输入框没有任何提交逻辑。
- Contact 页提交只是本地 `setTimeout` 后展示成功。

定位：
- `D:\Code\AIDetector-web\src\sections\CallToAction.vue:15`
- `D:\Code\AIDetector-web\src\sections\CallToAction.vue:40`
- `D:\Code\AIDetector-web\src\sections\AppFooter.vue:21`
- `D:\Code\AIDetector-web\src\pages\ContactPage.vue:126`

建议：
- 未上线前直接隐藏。
- 要保留就接真实后端接口，不要继续假提交。

### P2 自动化验证仍偏弱

问题：
- 前端现在只有 `lint/typecheck/build`，没有最小业务 smoke test。
- 后端虽然已经跑通 `pytest`，但还没有更贴近上线链路的接口级回归。

定位：
- `D:\Code\AIDetector-web\package.json:10`
- `D:\Code\AIDetector-Back\backend\tests\conftest.py:18`
- `D:\Code\AIDetector-Back\backend\tests\test_detect.py`

建议：
- 前端至少补 4 条 smoke：登录、检测、历史、管理员入口。
- 后端后续可补 `TestClient` 级别的路由回归，覆盖 `/ready`、`/detect`、`/history`。

### P3 文档和日志还需要清

问题：
- 后端 README 还写着“前端暂未打通，请用 Postman/PowerShell 测试”。
- 前端生产日志里仍有一批历史同步和调试输出。

定位：
- `D:\Code\AIDetector-Back\README.md:7`
- `D:\Code\AIDetector-web\src\store\scan.js:572`
- `D:\Code\AIDetector-web\src\store\scan.js:607`
- `D:\Code\AIDetector-web\src\store\scan.js:757`
- `D:\Code\AIDetector-web\src\api\client.ts:165`

建议：
- README 改成当前真实联调方式。
- 上线前清理前端生产日志，保留必要错误监控即可。

## 本轮验证

- 前端 `npm run check`：通过
- 前端 `npm run build`：通过
- 后端 `pytest -q -p no:cacheprovider`：通过，`36 passed, 1 warning`
- 后端 warning：`D:\Code\AIDetector-Back\backend\app\api\v1\admin.py:277` 仍使用已弃用的 `HTTP_422_UNPROCESSABLE_ENTITY`
