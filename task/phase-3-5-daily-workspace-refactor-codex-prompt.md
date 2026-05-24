# Codex Prompt：Phase 3.5 - Daily Workspace 按天工作区重构

你现在要在项目 `/home/sk/project/Now 时间线` 中继续实现 Now 时间线 PWA。

当前状态：

- Phase 0 + Phase 1 已完成：工程初始化、基础目录、核心类型、Dexie / IndexedDB 数据层、Zustand stores 已建立。
- Phase 2 已完成：时间线 MVP 可用，能创建时间节点，刷新后数据仍然存在。
- Phase 3 已完成：画布 MVP 可用，能创建普通思维卡片 / Todo 卡片，拖拽、缩放、连线，并持久化。

本阶段任务：执行 **Phase 3.5：Daily Workspace 按天工作区重构**。

目标：把当前“全局时间线 + 全局画布”重构为“按天划分的 Day Workspace”。

这是 Phase 4 Todo 闭环之前必须完成的地基调整。

---

## 必须先阅读的文档

请先阅读并遵守：

- `docs/design-inspiration.md`
- `docs/architecture.md`
- `docs/product-positioning.md`
- `docs/paid-grade-uiux.md`
- `docs/tech-stack.md`
- `docs/project-structure-and-rules.md`
- `docs/development-roadmap.md`
- `docs/ui-style-concept.md`
- `docs/daily-workspace-model.md`

重点遵守：

- 不要把业务逻辑写进组件
- IndexedDB 访问必须通过 repository / service
- store 不要巨型化
- 本阶段只做 Daily Workspace 数据模型和按日期加载，不做 Todo 完成转时间线闭环
- 不要做 AI、后端、同步、复杂热力图

---

## 本阶段核心目标

完成以下能力：

1. 新增 `DayWorkspace` 数据模型
2. 新增 `dayWorkspaces` IndexedDB 表
3. `Card` 增加 `dayId` 和 `date`
4. `Edge` 增加 `dayId` 和 `date`
5. `TimelineNode` 增加 `dayId` 和 `date`
6. 时间线页面按当前日期加载节点
7. 画布页面按当前日期加载卡片和连线
8. 创建时间节点时自动归属当前日期 workspace
9. 创建卡片 / 连线时自动归属当前日期 workspace
10. 支持路由 query：`?date=YYYY-MM-DD`
11. 如果没有传 date，默认使用今天本地日期
12. 为后续日历 / 热力图预留统计方法

---

## 数据模型要求

### 新增 DayWorkspace

建议位置：

```txt
src/features/day/types.ts
```

如果项目更适合放公共 types，也可以放：

```txt
src/types/day.ts
```

类型：

```ts
export type DayWorkspace = {
  id: string
  date: string // YYYY-MM-DD, local date
  createdAt: string
  updatedAt: string
  canvasViewport?: {
    x: number
    y: number
    zoom: number
  }
}
```

### 更新 Card

`Card` 必须包含：

```ts
dayId: string
date: string // YYYY-MM-DD
```

### 更新 Edge

`Edge` 必须包含：

```ts
dayId: string
date: string
```

### 更新 TimelineNode

`TimelineNode` 必须包含：

```ts
dayId: string
date: string
```

---

## 数据库要求

修改：

```txt
src/db/schema.ts
src/db/client.ts
```

新增表：

```txt
dayWorkspaces
```

需要保证以下表支持按 date 查询：

```txt
cards
timelineNodes
edges
```

Dexie schema 建议包含索引：

```txt
dayWorkspaces: id, date
cards: id, dayId, date, type, completedAt
edges: id, dayId, date, fromCardId, toCardId
timelineNodes: id, dayId, date, happenedAt, source, sourceCardId
reports: id, type, periodStart, periodEnd
```

注意：

- 如果 Dexie 版本需要升级，请用新的 version。
- 如果现有旧数据没有 dayId/date，需要做兼容处理。
- 简化方案：旧数据迁移到今天的 DayWorkspace。
- 不要直接丢弃旧数据。

---

## Repository 要求

新增：

```txt
src/db/repositories/dayWorkspaceRepository.ts
```

至少支持：

```ts
getByDate(date: string): Promise<DayWorkspace | undefined>
create(workspace: DayWorkspace): Promise<DayWorkspace>
getOrCreateByDate(date: string): Promise<DayWorkspace>
update(id: string, patch: Partial<DayWorkspace>): Promise<DayWorkspace>
list(): Promise<DayWorkspace[]>
```

完善：

```txt
src/db/repositories/cardRepository.ts
src/db/repositories/edgeRepository.ts
src/db/repositories/timelineRepository.ts
```

增加按日期 / dayId 查询：

```ts
listByDate(date: string): Promise<Card[]>
listByDayId(dayId: string): Promise<Card[]>

listByDate(date: string): Promise<Edge[]>
listByDayId(dayId: string): Promise<Edge[]>

listByDate(date: string): Promise<TimelineNode[]>
listByDayId(dayId: string): Promise<TimelineNode[]>
```

Edge 删除关联也要限定 dayId / date 时保持安全。

---

## Service 要求

新增或完善：

```txt
src/features/day/services/dayWorkspaceService.ts
src/features/day/hooks/useCurrentDay.ts
```

### dayWorkspaceService.ts

至少提供：

```ts
getOrCreateDayWorkspace(date?: string): Promise<DayWorkspace>
resolveDate(input?: string | null): string
```

规则：

- 如果传入合法 `YYYY-MM-DD`，使用传入 date
- 如果没有传入，使用本地今天日期
- date 统一格式：`YYYY-MM-DD`
- 注意不要用 UTC 日期误伤本地日期

### useCurrentDay.ts

负责从 URL query 读取：

```txt
?date=YYYY-MM-DD
```

如果没有 query，则返回今天。

---

## Timeline 改造要求

修改：

```txt
src/pages/TimelinePage.tsx
src/features/timeline/services/timelineService.ts
src/features/timeline/hooks/useTimelineActions.ts
src/stores/timelineStore.ts
```

要求：

- TimelinePage 根据当前 date 加载对应 day workspace
- 只展示当前日期的 timeline nodes
- 创建节点时写入：

```ts
dayId: workspace.id
date: workspace.date
```

- `listTimelineNodes` 改为支持 date 参数，例如：

```ts
listTimelineNodesByDate(date: string): Promise<TimelineNode[]>
```

- 保留兼容旧方法也可以，但页面必须使用按日期查询

---

## Canvas 改造要求

修改：

```txt
src/pages/CanvasPage.tsx
src/features/canvas/services/canvasService.ts
src/features/canvas/hooks/useCanvasActions.ts
src/stores/cardStore.ts
src/stores/edgeStore.ts
src/stores/canvasStore.ts
```

要求：

- CanvasPage 根据当前 date 加载对应 day workspace
- 只展示当前日期的 cards / edges
- 创建 card 时写入：

```ts
dayId: workspace.id
date: workspace.date
```

- 创建 edge 时写入：

```ts
dayId: workspace.id
date: workspace.date
```

- 拖拽卡片时更新的是当前 day 的 card
- 删除 card 时删除当前 day 下关联 edges

---

## 路由要求

当前至少支持：

```txt
/timeline?date=YYYY-MM-DD
/canvas?date=YYYY-MM-DD
```

如果没有 date：

```txt
/timeline
/canvas
```

则默认今天。

首页可以增加今天入口：

- 今日时间线
- 今日画布

链接建议带上今天日期：

```txt
/timeline?date=YYYY-MM-DD
/canvas?date=YYYY-MM-DD
```

---

## 热力图预留，不做完整 UI

本阶段只预留统计方法，不做完整热力图页面。

可以新增：

```txt
src/features/day/services/dayStatsService.ts
```

可选方法：

```ts
getDayActivityStats(startDate: string, endDate: string): Promise<Array<{
  date: string
  timelineNodeCount: number
  cardCount: number
  completedTodoCount: number
  activityCount: number
}>>
```

如果时间不够，可以只写 TODO 注释，不强行实现。

不要在本阶段做完整日历 UI。

---

## 迁移 / 兼容要求

如果当前数据库已有旧数据：

- 旧 TimelineNode 没有 `dayId/date`：迁移到今天 workspace
- 旧 Card 没有 `dayId/date`：迁移到今天 workspace
- 旧 Edge 没有 `dayId/date`：迁移到今天 workspace

如果 Dexie migration 太复杂，可以在 app 初始化时做一次轻量补全，但必须：

- 不丢旧数据
- 不重复创建 workspace
- 不造成 build 错误

---

## 验收标准

完成后必须满足：

1. `npm run build` 成功
2. `/timeline` 默认打开今天的时间线
3. `/canvas` 默认打开今天的画布
4. `/timeline?date=YYYY-MM-DD` 只显示该日期节点
5. `/canvas?date=YYYY-MM-DD` 只显示该日期卡片和连线
6. 创建时间节点后刷新仍属于同一天
7. 创建卡片后刷新仍属于同一天
8. 切换到另一天，不显示前一天的数据
9. 再切回原日期，原数据仍存在
10. 旧数据不会被直接删除
11. 没有直接在组件里访问 Dexie / IndexedDB
12. 没有实现 Todo 完成转时间线闭环
13. 没有实现 AI、后端、复杂热力图 UI

---

## 禁止事项

- 不要实现 Phase 4 Todo 完成闭环
- 不要实现 AI 报告
- 不要做后端
- 不要做完整日历 / 热力图 UI
- 不要做账号系统
- 不要大重构 UI 风格
- 不要丢弃旧数据
- 不要把所有按天逻辑写进页面组件
- 不要用 UTC 日期代替本地日期

---

## 交付要求

完成后请输出：

1. 修改 / 新增文件列表
2. Phase 3.5 完成内容
3. Daily Workspace 数据模型说明
4. 旧数据兼容 / 迁移说明
5. build / typecheck 结果
6. 如果有 blocker，明确说明，不要编造成功
