# Codex Prompt：Phase 4 - Todo 闭环（日工作区版）

你现在要在项目 `/home/sk/project/Now 时间线` 中继续实现 **Now 时间线 PWA**。

本任务只实现 **Phase 4：Todo 闭环**。

核心目标：

> Todo 卡片完成后，从当天画布中消失 / 归档，并自动生成当天时间线节点。

这是产品的第一个真正闭环：

```txt
捕捉 Todo → 在画布里存在 → 完成 → 沉淀成时间线事实
```

---

## 0. 当前状态

已完成：

- Phase 0：项目初始化
- Phase 1：Dexie / IndexedDB 数据层、repository、Zustand stores
- Phase 2：时间线 MVP
- Phase 3：画布 MVP
- Phase 3.5：Daily Workspace 按天工作区重构

当前重要能力：

- `/timeline` 默认加载今天
- `/canvas` 默认加载今天
- 支持 `/timeline?date=YYYY-MM-DD`
- 支持 `/canvas?date=YYYY-MM-DD`
- `Card`、`Edge`、`TimelineNode` 已包含 `dayId` 和 `date`
- `DayWorkspace` 已存在
- 画布 viewport 已按 day workspace 保存

当前关键类型：

```ts
export type Card = {
  id: CardId;
  dayId: DayWorkspaceId;
  date: LocalDateString;
  type: "thought" | "todo";
  content: string;
  x: number;
  y: number;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  completedAt?: ISODateString;
  archivedAt?: ISODateString;
};

export type TimelineNode = {
  id: TimelineNodeId;
  dayId: DayWorkspaceId;
  date: LocalDateString;
  content: string;
  happenedAt: ISODateString;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  source: "manual" | "todo-card" | "import" | "system";
  sourceCardId?: CardId;
  tags?: string[];
};
```

---

## 1. 必须先阅读

请先读这些文件，确认当前结构后再改：

```txt
docs/architecture.md
docs/product-positioning.md
docs/project-structure-and-rules.md
docs/development-roadmap.md
docs/current-progress-summary.md
docs/daily-workspace-model.md

src/features/cards/types.ts
src/features/timeline/types.ts
src/features/day/types.ts
src/features/canvas/services/canvasService.ts
src/features/canvas/hooks/useCanvasActions.ts
src/features/canvas/components/TodoCardNode.tsx
src/features/canvas/components/CardNode.tsx
src/features/canvas/components/CanvasView.tsx
src/features/timeline/services/timelineService.ts
src/features/cards/services/cardService.ts
src/db/repositories/cardRepository.ts
src/db/repositories/timelineRepository.ts
```

硬规则：

- 不要把业务逻辑写进组件
- IndexedDB 访问必须经过 repository / service
- store 只做前端状态同步，不吞业务流程
- Todo 完成主流程集中在 `todoService.completeTodoCard(...)`
- 不做 AI
- 不做后端
- 不做账号系统
- 不做复杂同步
- 不重构整个画布

---

## 2. 本阶段目标

实现以下能力：

1. Todo 卡片显示可点击完成圆圈 / 勾选控件
2. 点击完成时进入 pending 状态，防止重复点击
3. 调用统一 service：`completeTodoCard(cardId)`
4. 校验 card 存在
5. 校验 `card.type === "todo"`
6. 写入 `completedAt`
7. 创建对应 `TimelineNode`
8. `TimelineNode.content = card.content`
9. `TimelineNode.happenedAt = completedAt`
10. `TimelineNode.source = "todo-card"`
11. `TimelineNode.sourceCardId = card.id`
12. `TimelineNode.dayId/date` 必须继承原 Todo 卡片的 `dayId/date`
13. 完成后 Todo 卡片从画布可见列表消失 / 被过滤
14. 时间线页面能看到新生成节点
15. 刷新后状态仍然正确
16. 重复点击不会生成多个 timeline node

---

## 3. 推荐新增文件

### 3.1 Todo service

新增：

```txt
src/features/todo/services/todoService.ts
```

必须导出：

```ts
import type { Card } from "../../cards/types";
import type { TimelineNode } from "../../timeline/types";
import type { CardId } from "../../../types/id";

export async function completeTodoCard(cardId: CardId): Promise<{
  card: Card;
  timelineNode: TimelineNode;
}>;
```

推荐流程：

```txt
1. getCardById(cardId)
2. card 不存在：抛明确错误
3. card.type !== "todo"：抛明确错误
4. 如果 card.completedAt 已存在：
   - 查找已有 sourceCardId = card.id 的 timeline node
   - 如果存在，直接返回现有 card + node
   - 如果不存在，再补建一个 timeline node（但不要更新 completedAt）
5. 如果未完成：
   - completedAt = nowISO()
   - updateCard(card.id, { completedAt, archivedAt: completedAt })
   - 创建 timeline node
6. 返回更新后的 card + timeline node
```

注意：

- `TimelineNode.dayId/date` 必须使用 card 原本的 `dayId/date`
- 现有 `createTimelineNode(input, workspace)` 需要 `DayWorkspace`；本阶段可以二选一：
  1. 给 timeline service 新增一个按 `card.dayId/date` 创建的内部方法；或
  2. 在 repository 层直接创建完整 `TimelineNode`，但仍要封装在 service 内，不要散在组件里
- 不要在 React 组件里拼 timeline node

---

## 4. Repository / service 需要补的能力

### 4.1 timelineRepository

检查并新增查询能力：

```ts
listBySourceCardId(sourceCardId: CardId): Promise<TimelineNode[]>
```

用途：防止重复完成时生成多个 timeline node。

当前 schema 已有索引：

```ts
timelineNodes: "id, dayId, date, happenedAt, createdAt, source, sourceCardId"
```

所以可以直接按 `sourceCardId` 查。

### 4.2 timelineService

建议新增：

```ts
createTimelineNodeFromTodoCard(card: Card, completedAt: ISODateString): Promise<TimelineNode>
```

或等价内部封装。

生成节点至少包含：

```ts
{
  id: createId("node"),
  dayId: card.dayId,
  date: card.date,
  content: card.content.trim(),
  happenedAt: completedAt,
  createdAt: completedAt,
  updatedAt: completedAt,
  source: "todo-card",
  sourceCardId: card.id,
}
```

如果内容为空，使用可控错误，不要生成空节点。

---

## 5. Canvas 侧改动

需要修改：

```txt
src/features/canvas/components/TodoCardNode.tsx
src/features/canvas/components/CardNode.tsx
src/features/canvas/components/CanvasView.tsx
src/features/canvas/hooks/useCanvasActions.ts
src/features/canvas/services/canvasService.ts
```

要求：

- Todo 卡片左上 / 标题区有完成圆圈
- 点击完成圆圈时不触发拖拽、连线等意外行为
- 点击后设置 pending 状态
- 完成成功后：
  - 更新 card store
  - 从画布可见卡片中隐藏 / 移除该 todo
  - timeline store 增加新节点（如果当前页面有 timeline store 可用）
- 完成失败时显示错误，不要假装成功
- thought 卡片没有完成入口

推荐 hook：

```txt
src/features/todo/hooks/useTodoActions.ts
```

也可以把协调逻辑放在 `useCanvasActions`，但不要让 `TodoCardNode.tsx` 直接调用 DB / service。

---

## 6. 画布过滤规则

完成后的 Todo 默认不再作为活跃卡片显示。

建议过滤位置：

```txt
loadCanvasByDay(workspace)
```

或 `useCanvasActions.load()` 后进入 store 前过滤。

推荐更干净：在 `canvasService.loadCanvasByDay` 返回活跃卡片：

```ts
cards.filter((card) => !card.completedAt && !card.archivedAt)
```

注意：

- 如果 edge 连接了已完成卡片，画布可见 edges 也要过滤掉，否则 React Flow 会出现孤儿 edge
- visible edges 只保留两端 card 都可见的边

---

## 7. UI / UX 要求

要有一点仪式感，但别发疯。

推荐实现：

- Todo 圆圈 hover：边框亮起
- 点击 pending：圆圈显示 loading / 变暗
- 完成成功：卡片轻微缩小 + 透明
- 短反馈文案：`已保存到时间线`
- 可选：提供「去时间线查看」轻量入口

不要：

- 不要引入大型动画库
- 不要粒子爆炸
- 不要让动画阻塞数据写入
- 不要为了动效牺牲状态一致性

---

## 8. Store 要求

检查：

```txt
src/stores/cardStore.ts
src/stores/timelineStore.ts
src/stores/uiStore.ts
```

需要能力：

- cardStore：更新 card / 移除 visible card
- timelineStore：addNode
- uiStore：可选 toast / transient feedback

如果已有 store 方法足够，复用即可；不要为了一个 action 大改 store。

---

## 9. 验收标准

完成后必须满足：

1. `npm run build` 成功
2. `/canvas` 可打开
3. `/timeline` 可打开
4. 可以创建 Todo 卡片
5. 点击 Todo 完成后，卡片从当前日期画布消失 / 归档
6. 自动生成对应 timeline node
7. timeline node 内容等于 Todo 卡片内容
8. timeline node `source === "todo-card"`
9. timeline node `sourceCardId === card.id`
10. timeline node `dayId/date` 与原 Todo 一致
11. 刷新后：已完成 Todo 不再作为活跃卡片显示
12. 刷新后：时间线节点仍存在
13. 重复点击不会生成多个 timeline node
14. thought 卡片不能被完成
15. 没有直接在组件里访问 Dexie / IndexedDB
16. 没有实现 AI、后端、复杂同步

---

## 10. 禁止事项

- 不要实现 AI 报告
- 不要做后端
- 不要做账号系统
- 不要做复杂同步
- 不要重构整个画布
- 不要重写时间线页面
- 不要引入大型动画库 / 粒子库
- 不要把完整完成流程写进 `TodoCardNode.tsx`
- 不要让同一个 Todo 重复生成多个 timeline node
- 不要破坏 Phase 3.5 的按天工作区模型

---

## 11. 交付格式

完成后请输出：

1. 修改 / 新增文件列表
2. Phase 4 完成内容
3. Todo 完成闭环关键实现说明
4. 如何保证 `dayId/date` 正确继承
5. 如何防止重复生成 timeline node
6. `npm run build` 结果
7. 如果有 blocker，明确说明，不要编造成功
