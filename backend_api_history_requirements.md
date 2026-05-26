# 历史记录功能 - 后端 API 需求文档

> 状态：历史归档文档，不再作为当前接口契约。
>
> 当前线上契约以 `D:\Code\AIDetector-Back\contract\openapi.yaml` 为准；历史接口实际统一在 `/api/v1/history`，响应字段由后端 Pydantic alias 输出为 camelCase，例如 `userId / createdAt / inputText / editorHtml`。本文中早期出现的 UUID、`snake_case` 响应示例、`per_page / total_pages` 等只代表旧需求阶段，不代表当前 active contract。

## 概述

前端目前将历史记录存储在 `localStorage`，需要迁移到后端实现持久化存储和跨设备同步。

## 数据模型

### HistoryRecord (历史记录)

```typescript
interface HistoryRecord {
  id: string;                    // 唯一标识符，建议使用 UUID
  user_id: string;              // 所属用户 ID
  title: string;                // 记录标题，如 "扫描记录 · 2026-02-11 13:15:21"
  created_at: string;           // 创建时间，ISO 8601 格式
  functions: string[];          // 使用的功能列表，如 ["scan", "polish", "citation"]
  input_text: string;           // 原始输入文本
  editor_html: string;          // 富文本编辑器的 HTML 内容
  analysis: Analysis | null;    // 分析结果（可选）
}
```

### Analysis (分析结果)

```typescript
interface Analysis {
  summary: Summary;             // 摘要统计
  sentences: Sentence[];        // 句子级别的分析结果
  translation: string;          // 翻译结果（如果使用了翻译功能）
  polish: string;      // 润色建议（如果使用了润色功能）
  citations: Citation[];        // 引用检测结果（如果使用了引用功能）
  ai_likely_count: number;      // AI 生成可能性高的句子数量
  highlighted_html: string;     // 高亮标注后的 HTML
}
```

### Summary (摘要统计)

```typescript
interface Summary {
  ai: number;       // AI 生成的百分比 (0-100)
  mixed: number;    // 混合内容的百分比 (0-100)
  human: number;    // 人工撰写的百分比 (0-100)
}
// 注意：ai + mixed + human 应该等于 100
```

### Sentence (句子分析)

```typescript
interface Sentence {
  id: string;           // 句子唯一标识
  text: string;         // 句子文本内容
  raw: string;          // 原始文本（包含可能的前后空格）
  type: 'ai' | 'mixed' | 'human';  // 分类结果
  probability: number;  // 概率值 (0-1)
  score: number;        // 分数 (0-100)
  reason: string;       // 判断理由
  suggestion: string;   // 改进建议
}
```

### Citation (引用检测)

```typescript
interface Citation {
  id: string;       // 引用唯一标识
  text: string;     // 引用的文本片段
  source: string;   // 来源说明
}
```

## API 端点

### 1. 获取历史记录列表

**端点**: `GET /api/v1/history`

**查询参数**:
- `page` (可选): 页码，默认 1
- `per_page` (可选): 每页数量，默认 20，最大 100
- `sort` (可选): 排序字段，默认 `created_at`
- `order` (可选): 排序方向，`asc` 或 `desc`，默认 `desc`

**请求头**:
```
Authorization: Bearer <token>
```

**响应** (200 OK):
```json
{
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "user_id": "user-123",
      "title": "扫描记录 · 2026-02-11 13:15:21",
      "created_at": "2026-02-11T13:15:21.000Z",
      "functions": ["scan"],
      "input_text": "The quick brown fox...",
      "editor_html": "<p>The quick brown fox...</p>",
      "analysis": {
        "summary": {
          "ai": 45,
          "mixed": 25,
          "human": 30
        },
        "sentences": [
          {
            "id": "sent-1",
            "text": "The quick brown fox jumps over the lazy dog.",
            "raw": "The quick brown fox jumps over the lazy dog.",
            "type": "ai",
            "probability": 0.85,
            "score": 85,
            "reason": "高度结构化的表达方式",
            "suggestion": "可以使用更加口语化的表述"
          }
        ],
        "translation": "",
        "polish": "",
        "citations": [],
        "ai_likely_count": 5,
        "highlighted_html": "<span class=\"bg-amber-100\">...</span>"
      }
    }
  ],
  "total": 50,
  "page": 1,
  "per_page": 20,
  "total_pages": 3
}
```

### 2. 获取单条历史记录

**端点**: `GET /api/v1/history/{history_id}`

**路径参数**:
- `history_id`: 历史记录 ID

**请求头**:
```
Authorization: Bearer <token>
```

**响应** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "user-123",
  "title": "扫描记录 · 2026-02-11 13:15:21",
  "created_at": "2026-02-11T13:15:21.000Z",
  "functions": ["scan", "polish"],
  "input_text": "...",
  "editor_html": "...",
  "analysis": { /* ... */ }
}
```

**错误响应** (404 Not Found):
```json
{
  "error": "HISTORY_NOT_FOUND",
  "message": "历史记录不存在"
}
```

### 3. 创建历史记录

**端点**: `POST /api/v1/history`

**请求头**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**请求体**:
```json
{
  "title": "扫描记录 · 2026-02-11 13:15:21",
  "functions": ["scan"],
  "input_text": "The quick brown fox...",
  "editor_html": "<p>The quick brown fox...</p>",
  "analysis": {
    "summary": {
      "ai": 45,
      "mixed": 25,
      "human": 30
    },
    "sentences": [ /* ... */ ],
    "translation": "",
    "polish": "",
    "citations": [],
    "ai_likely_count": 5,
    "highlighted_html": "..."
  }
}
```

**响应** (201 Created):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "user-123",
  "title": "扫描记录 · 2026-02-11 13:15:21",
  "created_at": "2026-02-11T13:15:21.000Z",
  "functions": ["scan"],
  "input_text": "The quick brown fox...",
  "editor_html": "<p>The quick brown fox...</p>",
  "analysis": { /* ... */ }
}
```

### 4. 更新历史记录

**端点**: `PATCH /api/v1/history/{history_id}`

**路径参数**:
- `history_id`: 历史记录 ID

**请求头**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**请求体** (所有字段均可选):
```json
{
  "title": "新标题"
}
```

**响应** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "user-123",
  "title": "新标题",
  "created_at": "2026-02-11T13:15:21.000Z",
  "functions": ["scan"],
  "input_text": "...",
  "editor_html": "...",
  "analysis": { /* ... */ }
}
```

### 5. 删除历史记录

**端点**: `DELETE /api/v1/history/{history_id}`

**路径参数**:
- `history_id`: 历史记录 ID

**请求头**:
```
Authorization: Bearer <token>
```

**响应** (204 No Content):
```
(空响应体)
```

**错误响应** (404 Not Found):
```json
{
  "error": "HISTORY_NOT_FOUND",
  "message": "历史记录不存在"
}
```

### 6. 批量删除历史记录

**端点**: `POST /api/v1/history/batch-delete`

**请求头**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**请求体**:
```json
{
  "ids": [
    "550e8400-e29b-41d4-a716-446655440000",
    "660f9511-f3ac-52e5-b827-557766551111"
  ]
}
```

**响应** (200 OK):
```json
{
  "deleted_count": 2,
  "failed_ids": []
}
```

### 7. 清空所有历史记录

**端点**: `DELETE /api/v1/history`

**请求头**:
```
Authorization: Bearer <token>
```

**响应** (200 OK):
```json
{
  "deleted_count": 50
}
```

## 业务逻辑要求

### 1. 权限控制
- 用户只能访问自己的历史记录
- 游客用户不应该有历史记录功能（或者使用临时存储）

### 2. 数据限制
- 每个用户最多保存 **100** 条历史记录
- 当达到上限时，自动删除最旧的记录（按 `created_at` 排序）
- 单条记录的 `input_text` 最大 **50,000** 字符

### 3. 自动保存
- **建议在前端扫描完成后自动创建历史记录**
- 不需要用户手动保存

### 4. 关联检测结果
- 历史记录应该保存完整的 `analysis` 数据
- 这样用户可以回顾之前的检测结果，无需重新检测

### 5. 搜索和过滤（未来扩展）
以下功能可在后续版本实现：
- 按标题搜索
- 按时间范围过滤
- 按功能类型过滤（scan/polish/citation）
- 按 AI 检测得分过滤

## 数据库设计建议

### 主表: `history_records`

| 字段名 | 类型 | 说明 | 索引 |
|--------|------|------|------|
| id | UUID | 主键 | PRIMARY KEY |
| user_id | VARCHAR/UUID | 用户 ID | INDEX |
| title | VARCHAR(255) | 标题 | |
| created_at | TIMESTAMP | 创建时间 | INDEX |
| updated_at | TIMESTAMP | 更新时间 | |
| functions | JSON/TEXT | 功能列表 | |
| input_text | TEXT | 输入文本 | |
| editor_html | TEXT | HTML 内容 | |
| analysis_data | JSON/TEXT | 分析结果 JSON | |

**索引建议**:
- `(user_id, created_at DESC)` - 用于列表查询和分页
- `(user_id, id)` - 用于单条查询

## 错误码定义

| 错误码 | HTTP 状态码 | 说明 |
|--------|-------------|------|
| HISTORY_NOT_FOUND | 404 | 历史记录不存在 |
| HISTORY_LIMIT_EXCEEDED | 400 | 超出历史记录数量限制 |
| INVALID_HISTORY_DATA | 400 | 无效的历史记录数据 |
| UNAUTHORIZED | 401 | 未授权访问 |
| FORBIDDEN | 403 | 无权访问该历史记录 |

## 迁移建议

### 阶段 1: 后端 API 实现
1. 实现数据库表结构
2. 实现所有 CRUD 接口
3. 添加单元测试和集成测试

### 阶段 2: 前端迁移
1. 前端添加 API 调用逻辑
2. 实现自动同步机制
3. 迁移现有 localStorage 数据到后端（可选）

### 阶段 3: 优化
1. 添加搜索和过滤功能
2. 实现分享历史记录功能
3. 添加导出功能（PDF/Word）

## 注意事项

1. **数据迁移**: 前端现有的 localStorage 数据在用户登录后应该自动上传到后端
2. **离线支持**: 考虑未来支持离线模式，允许在无网络时使用 localStorage
3. **安全性**: 确保用户只能访问自己的历史记录
4. **性能**: 对于大量历史记录，要考虑分页和懒加载
5. **存储成本**: `analysis_data` 可能包含大量数据，考虑压缩或只保存关键信息

---

# 阶段一完成总结（后端实现）

**完成时间**: 2026-02-11  
**实现方案**: 方案1 - 复用 `detections` 表作为历史记录表

## ✅ 已完成功能

### 1. 数据存储
- **表结构**: 复用现有 `detections` 表，无需数据库迁移
- **字段映射**:
  - `id` → 历史记录 ID
  - `user_id` → 用户关联
  - `title` → 记录标题
  - `created_at` → 创建时间
  - `functions_used` → 功能列表（JSON）
  - `input_text` → 原始输入
  - `editor_html` → 富文本HTML
  - `meta_json.analysis` → 完整分析数据（JSON）

### 2. API 端点（8个）

所有端点路径前缀：`/api/v1/history`

| 端点 | 方法 | 功能 | 认证 |
|------|------|------|------|
| `/history` | GET | 获取历史记录列表（分页） | 必需 |
| `/history/{id}` | GET | 获取单条历史记录 | 必需 |
| `/history` | POST | 创建历史记录 | 必需 |
| `/history/{id}` | PATCH | 更新历史记录（仅 title） | 必需 |
| `/history/{id}` | DELETE | 删除单条历史记录 | 必需 |
| `/history/batch-delete` | POST | 批量删除 | 必需 |
| `/history` | DELETE | 清空所有历史记录 | 必需 |

### 3. 核心功能

#### ✅ CRUD 操作
- 创建、读取、更新（title）、删除历史记录
- 所有操作都有用户权限验证

#### ✅ 分页与排序
- 支持 `page`、`per_page` 参数（最大 100 条/页）
- 支持 `sort`（字段）、`order`（asc/desc）参数
- 默认按 `created_at` 降序排列

#### ✅ 批量操作
- 批量删除：返回成功数和失败 ID 列表
- 清空所有：返回删除计数

#### ✅ 100 条限制
- 每个用户最多保存 100 条历史记录
- 超出时自动删除最旧记录（按 `created_at` 排序）

#### ✅ 权限控制
- 用户只能访问自己的历史记录
- 游客用户无权访问历史记录 API

### 4. 测试验证

**测试文件**: `backend/tests/test_history.py`  
**测试用例数**: 11 个  
**测试状态**: ✅ 全部通过

测试覆盖：
- [x] 创建历史记录
- [x] 获取历史记录列表
- [x] 分页功能
- [x] 获取单条记录
- [x] 404 错误处理
- [x] 更新记录
- [x] 删除记录
- [x] 批量删除
- [x] 清空所有
- [x] 权限隔离
- [x] 100 条限制

## 📖 前端集成指南

### API 调用示例

#### 1. 创建历史记录

```typescript
POST /api/v1/history
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "扫描记录 · 2026-02-11 13:15:21",
  "functions": ["scan"],
  "input_text": "Sample text...",
  "editor_html": "<p>Sample text...</p>",
  "analysis": {
    "summary": {
      "ai": 45,
      "mixed": 25,
      "human": 30
    },
    "sentences": [
      {
        "id": "sent-1",
        "text": "Sample sentence.",
        "raw": "Sample sentence.",
        "type": "ai",
        "probability": 0.85,
        "score": 85,
        "reason": "高度结构化",
        "suggestion": "可以更口语化"
      }
    ],
    "translation": "",
    "polish": "",
    "citations": [],
    "ai_likely_count": 5,
    "highlighted_html": "<span>...</span>"
  }
}

// 响应 (201 Created)
{
  "id": 123,
  "user_id": 456,
  "title": "扫描记录 · 2026-02-11 13:15:21",
  "created_at": "2026-02-11T13:15:21.000Z",
  "functions": ["scan"],
  "input_text": "Sample text...",
  "editor_html": "<p>Sample text...</p>",
  "analysis": { /* ... */ }
}
```

#### 2. 获取历史记录列表

```typescript
GET /api/v1/history?page=1&per_page=20&sort=created_at&order=desc
Authorization: Bearer <token>

// 响应 (200 OK)
{
  "items": [
    {
      "id": 123,
      "user_id": 456,
      "title": "扫描记录 · 2026-02-11 13:15:21",
      "created_at": "2026-02-11T13:15:21.000Z",
      "functions": ["scan"],
      "input_text": "...",
      "editor_html": "...",
      "analysis": { /* ... */ }
    }
  ],
  "total": 50,
  "page": 1,
  "per_page": 20,
  "total_pages": 3
}
```

#### 3. 获取单条历史记录

```typescript
GET /api/v1/history/123
Authorization: Bearer <token>

// 响应 (200 OK)
{
  "id": 123,
  "user_id": 456,
  // ... 完整记录数据
}

// 错误响应 (404 Not Found)
{
  "error": "HISTORY_NOT_FOUND",
  "message": "历史记录不存在"
}
```

#### 4. 更新历史记录

```typescript
PATCH /api/v1/history/123
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "新标题"
}

// 响应 (200 OK) - 返回更新后的完整记录
```

#### 5. 删除历史记录

```typescript
DELETE /api/v1/history/123
Authorization: Bearer <token>

// 响应 (204 No Content) - 空响应体
```

#### 6. 批量删除

```typescript
POST /api/v1/history/batch-delete
Authorization: Bearer <token>
Content-Type: application/json

{
  "ids": [123, 456, 789]
}

// 响应 (200 OK)
{
  "deleted_count": 3,
  "failed_ids": []
}
```

#### 7. 清空所有历史记录

```typescript
DELETE /api/v1/history
Authorization: Bearer <token>

// 响应 (200 OK)
{
  "deleted_count": 50
}
```

## 🔄 阶段二任务（前端实现）

### 必需任务

1. **API 集成**
   - 实现所有 7 个 API 调用函数
   - 添加错误处理和重试逻辑
   - 实现 loading 状态管理

2. **自动保存机制**
   - 在检测完成后自动调用 `POST /api/v1/history` 保存记录
   - 保存完整的 `analysis` 数据

3. **历史记录列表界面**
   - 实现分页列表展示
   - 支持按时间排序
   - 实现下拉刷新/无限滚动

4. **单条记录查看**
   - 点击列表项查看完整的检测结果
   - 复用现有的检测结果展示组件

5. **记录管理功能**
   - 重命名记录（更新 title）
   - 删除单条记录（带确认提示）
   - 批量删除（多选 + 批量操作）
   - 清空所有记录（带二次确认）

### 可选任务

6. **localStorage 迁移**（推荐）
   - 在用户登录后，检查 localStorage 中的历史记录
   - 自动上传到后端（去重）
   - 迁移成功后清空 localStorage

7. **离线支持**（可选）
   - 无网络时仍然使用 localStorage
   - 有网络时自动同步到后端
   - 实现冲突解决策略

8. **用户体验优化**
   - 记录卡片显示功能图标（scan/polish/citation）
   - 显示 AI 检测得分的可视化标签
   - 实现搜索功能（前端过滤或后端扩展）

## 📝 注意事项

1. **认证**: 所有 API 请求都需要在 Header 中携带 `Authorization: Bearer <token>`
2. **错误处理**: 
   - 401: 未登录，重定向到登录页
   - 403: 无权访问，提示错误
   - 404: 记录不存在，从列表中移除
   - 429: 请求过多，实现限流提示
3. **数据验证**:
   - `input_text` 最大 50,000 字符
   - 创建时自动触发 100 条限制检查
4. **性能优化**:
   - 列表使用虚拟滚动（大量记录时）
   - 图片/大数据懒加载
   - 实现列表缓存机制

## 🎯 推荐前端技术栈

- **HTTP 客户端**: 现有 `apiClient` / fetch 封装
- **状态管理**: 现有 Pinia store；如果后续要服务端缓存，可选 `@tanstack/vue-query`
- **UI 组件**: 现有 Vue 组件
- **虚拟滚动**: `@vueuse/core` 的 `useVirtualList` 或 Vue 兼容虚拟列表库

## 📞 后端支持

如有任何 API 相关问题，请联系后端团队。后端已完成：
- ✅ 所有 API 端点
- ✅ 完整的单元测试和集成测试
- ✅ API 文档和使用示例
- ✅ 错误处理和权限验证
