# Now 时间线：当前阶段完成总结

本文档记录截至 Phase 3.5 Daily Workspace 重构后，项目已经完成的工程骨架、数据层、时间线页面、画布页面、按天工作区，以及关键目录职责。

## 1. 当前完成阶段

### Phase 0：项目初始化

已完成：

- 初始化 Vite + React + TypeScript 前端工程。
- 接入 Tailwind CSS。
- 建立基础目录结构。
- 建立最小可运行 App 骨架。
- 首页展示项目名和核心标语。

相关目录 / 文件：

```txt
package.json
vite.config.ts
tailwind.config.ts
postcss.config.js
tsconfig.json
index.html

src/app/
src/pages/
src/styles/
src/types/
src/utils/
src/pwa/
```

### Phase 1：数据层与本地存储

已完成：

- 建立核心数据模型：`Card`、`Edge`、`TimelineNode`、`Report`。
- 接入 Dexie / IndexedDB。
- 建立 `cards`、`edges`、`timelineNodes`、`reports` 表。
- 建立 repository 层，作为 IndexedDB 唯一访问入口。
- 建立分域 Zustand store，避免巨型 store。

相关目录 / 文件：

```txt
src/db/client.ts
src/db/schema.ts
src/db/repositories/

src/features/cards/types.ts
src/features/timeline/types.ts
src/features/reports/types.ts

src/stores/cardStore.ts
src/stores/edgeStore.ts
src/stores/timelineStore.ts
src/stores/canvasStore.ts
src/stores/uiStore.ts
src/stores/reportStore.ts
src/stores/syncStore.ts
```

### Phase 2：时间线 MVP

已完成：

- 新增 `/timeline` 页面。
- 支持创建时间线节点。
- 支持展示时间线节点。
- 支持编辑时间线节点。
- 支持删除时间线节点。
- 节点按发生时间倒序展示。
- 数据写入 IndexedDB，刷新后保留。
- 增加空状态和基础作品感 UI。

相关目录 / 文件：

```txt
src/pages/TimelinePage.tsx

src/features/timeline/components/
  TimelineView.tsx
  TimelineCreateInput.tsx
  TimelineNodeCard.tsx

src/features/timeline/hooks/
  useTimelineActions.ts

src/features/timeline/services/
  timelineService.ts

src/stores/timelineStore.ts
src/db/repositories/timelineRepository.ts
```

### Phase 3：画布 MVP

已完成：

- 安装并接入 `@xyflow/react`。
- 新增 `/canvas` 页面。
- 支持创建普通思维卡片。
- 支持创建 Todo 卡片。
- 支持拖拽卡片，并在拖拽结束后保存位置。
- 支持缩放、拖动画布、fit view。
- 支持从卡片四边中点拉出连线。
- 连接点默认隐藏，hover / 选中 / 按住时显示。
- 支持保存连接点方向：`fromHandleId`、`toHandleId`。
- 支持删除卡片，并同步删除相关连线。
- 支持选中连线后删除连线。
- 画布卡片和连线刷新后仍然存在。

相关目录 / 文件：

```txt
src/pages/CanvasPage.tsx

src/features/canvas/components/
  CanvasView.tsx
  CanvasToolbar.tsx
  CardNode.tsx
  ThoughtCardNode.tsx
  TodoCardNode.tsx

src/features/canvas/hooks/
  useCanvasActions.ts

src/features/canvas/services/
  canvasService.ts

src/features/cards/components/
  CardEditor.tsx
  CardTypeToggle.tsx

src/features/cards/services/
  cardService.ts

src/stores/canvasStore.ts
src/stores/cardStore.ts
src/stores/edgeStore.ts

src/db/repositories/cardRepository.ts
src/db/repositories/edgeRepository.ts
```

### Phase 3.5：Daily Workspace 按天工作区

已完成：

- 新增 `DayWorkspace` 数据模型。
- 新增 `dayWorkspaces` IndexedDB 表。
- `Card`、`Edge`、`TimelineNode` 增加 `dayId` 和 `date` 字段。
- `/timeline` 和 `/canvas` 默认加载今天。
- 支持 `/timeline?date=YYYY-MM-DD` 和 `/canvas?date=YYYY-MM-DD`。
- 创建时间线节点、卡片、连线时自动归属当前日期 workspace。
- 画布 viewport 可保存到当前 day workspace。
- 旧数据兼容：缺少 `dayId/date` 的旧记录会补到今天的 DayWorkspace。
- 为后续日历 / 热力图预留每日活跃统计方法。

相关目录 / 文件：

```txt
src/features/day/types.ts
src/features/day/hooks/useCurrentDay.ts
src/features/day/hooks/useDayWorkspace.ts
src/features/day/services/dayWorkspaceService.ts
src/features/day/services/dayStatsService.ts
src/db/repositories/dayWorkspaceRepository.ts
```

## 2. 当前路由

```txt
/          首页
/timeline  时间线页面，默认今天
/canvas    思维画布页面，默认今天
/timeline?date=YYYY-MM-DD  指定日期时间线
/canvas?date=YYYY-MM-DD    指定日期画布
```

路由相关文件：

```txt
src/app/App.tsx
src/app/routes.tsx
src/pages/HomePage.tsx
src/pages/TimelinePage.tsx
src/pages/CanvasPage.tsx
```

当前没有引入 React Router，使用轻量路径判断满足 MVP 阶段需求。

## 3. 组件分层说明

### 通用 UI 组件

目录：

```txt
src/components/ui/
```

当前包含：

```txt
Button.tsx
IconButton.tsx
Input.tsx
Textarea.tsx
EmptyState.tsx
```

职责：

- 只提供通用 UI 能力。
- 不包含时间线、画布、卡片等业务概念。
- 被 timeline / canvas 等 feature 复用。

### 时间线组件

目录：

```txt
src/features/timeline/components/
```

组件职责：

- `TimelineView.tsx`：时间线页面主体，负责加载节点、渲染创建区、空状态和节点列表。
- `TimelineCreateInput.tsx`：创建时间线节点的输入表单。
- `TimelineNodeCard.tsx`：展示单个时间线节点，并支持编辑 / 删除。

### 画布组件

目录：

```txt
src/features/canvas/components/
```

组件职责：

- `CanvasView.tsx`：React Flow 主画布，负责节点 / 连线渲染、拖拽、缩放、选择、连接事件。
- `CanvasToolbar.tsx`：画布工具栏，负责创建卡片、fit view、清空选择、删除所选。
- `CardNode.tsx`：React Flow 自定义节点壳，统一卡片外观和四边连接点。
- `ThoughtCardNode.tsx`：普通思维卡片内容展示。
- `TodoCardNode.tsx`：Todo 卡片内容展示，仅显示待完成标记，不实现完成逻辑。

### 卡片组件

目录：

```txt
src/features/cards/components/
```

组件职责：

- `CardEditor.tsx`：创建卡片表单，输入内容并选择卡片类型。
- `CardTypeToggle.tsx`：在 `thought` 和 `todo` 两种卡片类型之间切换。

## 4. 状态管理说明

当前使用 Zustand，按领域拆分 store。

### `timelineStore.ts`

职责：

- 保存时间线节点缓存。
- 保存加载状态和错误信息。
- 提供轻量 action：`setNodes`、`addNode`、`updateNode`、`removeNode`。

不负责：

- 不直接访问 IndexedDB。
- 不负责创建时间默认值等业务流程。

相关业务流程在：

```txt
src/features/timeline/services/timelineService.ts
src/features/timeline/hooks/useTimelineActions.ts
```

### `cardStore.ts`

职责：

- 保存画布卡片缓存。
- 保存加载状态和错误信息。
- 提供轻量 action：`setCards`、`addCard`、`updateCard`、`removeCard`。

不负责：

- 不直接创建数据库记录。
- 不直接持久化拖拽坐标。

相关业务流程在：

```txt
src/features/cards/services/cardService.ts
src/features/canvas/services/canvasService.ts
src/features/canvas/hooks/useCanvasActions.ts
```

### `edgeStore.ts`

职责：

- 保存画布连线缓存。
- 提供轻量 action：`setEdges`、`addEdge`、`removeEdge`、`removeEdgesByCardId`。

用于支持：

- 创建连线后同步 UI。
- 删除连线后同步 UI。
- 删除卡片时移除相关连线。

### `canvasStore.ts`

职责：

- 保存画布 viewport。
- 保存当前选中的卡片 ID。
- 保存当前选中的连线 ID。
- 提供选择状态相关 action。

当前包含：

```txt
selectedCardId
selectedEdgeId
viewport
setSelectedCardId
setSelectedEdgeId
setViewport
clearSelection
```

按天工作区状态不单独做巨型 store。当前日期从 URL query 解析，workspace 通过 day hooks 获取：

```txt
src/features/day/hooks/useCurrentDay.ts
src/features/day/hooks/useDayWorkspace.ts
```

## 5. 数据层说明

### Dexie 客户端

目录：

```txt
src/db/
```

关键文件：

```txt
client.ts
schema.ts
```

职责：

- 定义数据库名称和版本。
- 定义 IndexedDB 表结构。
- 暴露 typed Dexie database client。

### Repository 层

目录：

```txt
src/db/repositories/
```

当前 repository：

```txt
dayWorkspaceRepository.ts
cardRepository.ts
edgeRepository.ts
timelineRepository.ts
reportRepository.ts
```

职责：

- 作为 IndexedDB 的唯一直接访问层。
- 提供基础 CRUD。
- 不处理复杂业务流程。

### Service 层

当前 feature service：

```txt
src/features/day/services/dayWorkspaceService.ts
src/features/day/services/dayStatsService.ts
src/features/timeline/services/timelineService.ts
src/features/cards/services/cardService.ts
src/features/canvas/services/canvasService.ts
```

职责：

- 组装业务流程。
- 创建实体默认字段，如 `id`、`createdAt`、`updatedAt`。
- 处理删除卡片时同时删除相关连线。
- 处理拖拽结束后的坐标持久化。
- 处理按日期获取 / 创建 DayWorkspace。
- 处理旧数据补全到今天的 DayWorkspace。
- 预留按天活跃统计能力。

## 6. 关键数据模型

### Card

位置：

```txt
src/features/cards/types.ts
```

用途：

- 表示画布上的卡片。
- 当前支持 `thought` 和 `todo` 两种类型。
- 使用 `x` / `y` 保存画布坐标。
- 使用 `dayId` / `date` 归属到某一天的 DayWorkspace。

### Edge

位置：

```txt
src/features/cards/types.ts
```

用途：

- 表示画布卡片之间的连线。
- 保存 `fromCardId`、`toCardId`。
- 保存 `fromHandleId`、`toHandleId`，用于让连线准确连接到卡片四边的具体连接点。
- 使用 `dayId` / `date` 归属到某一天的 DayWorkspace。

### TimelineNode

位置：

```txt
src/features/timeline/types.ts
```

用途：

- 表示时间线上的记录节点。
- 支持手动创建，也为后续 Todo 完成转时间线预留 `source` 和 `sourceCardId`。
- 使用 `dayId` / `date` 归属到某一天的 DayWorkspace。

### DayWorkspace

位置：

```txt
src/features/day/types.ts
```

用途：

- 表示某一天的工作区容器。
- 关联当天时间线、当天画布卡片、当天连线。
- 保存当天画布 viewport，为后续每日工作台体验预留。

### Report

位置：

```txt
src/features/reports/types.ts
```

用途：

- 为后续 AI 周报 / 月报 / 年报预留数据结构。
- 当前阶段只建模，不实现 AI 生成。

## 7. 当前尚未实现内容

以下内容按 roadmap 后续阶段再做：

- Todo 卡片完成后自动生成时间线节点。
- Todo 完成动效。
- 移动端专门布局和底部 sheet。
- 更完整的 PWA manifest / service worker / 离线缓存。
- 数据导入导出和备份。
- AI 回顾 / 周报 / 月报 / 年报。
- 后端、账号、同步。
- 复杂画布能力，如多选、框选、分组。
- 完整日历 / 热力图 UI。

## 8. 当前验证状态

最近一次验证：

```bash
npm run typecheck
npm run build
```

结果：

```txt
typecheck 成功
build 成功
```

当前开发服务器访问地址：

```txt
http://localhost:5173/
http://localhost:5173/timeline
http://localhost:5173/canvas
http://localhost:5173/timeline?date=YYYY-MM-DD
http://localhost:5173/canvas?date=YYYY-MM-DD
```
