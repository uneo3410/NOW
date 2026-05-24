# Now 时间线：按天划分与 Daily Workspace 模型

## 1. 核心问题

Now 时间线不应该只有一个全局画布。

用户的使用方式更接近：

> 每一天都有自己的时间线内容和画布状态。

后续月度 / 年度回顾可以通过日历或热力图进入某一天，再查看当天的时间线和画布。

---

## 2. 产品结构

推荐采用三层结构：

```txt
Calendar / Heatmap 总览层
  -> Day Workspace 日工作区
      -> Timeline 当日时间线
      -> Canvas 当日画布
```

### Calendar / Heatmap 总览层

负责：

- 展示一个月 / 一年的记录密度
- 每一天显示一个点或色块
- 根据当天记录数量 / 活跃程度改变颜色深浅
- 点击某一天进入对应 Day Workspace

### Day Workspace 日工作区

这是每天的主容器。

包含：

- 当日时间线节点
- 当日画布卡片
- 当日卡片连线
- 当日视图状态，例如画布缩放、位置

### Timeline 当日时间线

负责记录当天已经发生 / 完成 / 手动添加的节点。

### Canvas 当日画布

负责当天的想法、Todo、卡片关系和布局。

---

## 3. 数据模型建议

### DayWorkspace

新增一个日期级容器。

```ts
type DayWorkspace = {
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

### Card 增加 dayId / date

```ts
type Card = {
  id: string
  dayId: string
  date: string // YYYY-MM-DD, denormalized for easier query
  type: "thought" | "todo"
  content: string
  x: number
  y: number
  createdAt: string
  updatedAt: string
  completedAt?: string
  archivedAt?: string
}
```

### Edge 增加 dayId / date

```ts
type Edge = {
  id: string
  dayId: string
  date: string
  fromCardId: string
  toCardId: string
  createdAt: string
}
```

### TimelineNode 增加 dayId / date

```ts
type TimelineNode = {
  id: string
  dayId: string
  date: string
  content: string
  happenedAt: string
  createdAt: string
  source: "manual" | "todo-card" | "import" | "system"
  sourceCardId?: string
  tags?: string[]
}
```

---

## 4. 为什么要有 dayId 和 date

### dayId

用于严格关联某一天的 workspace。

### date

用于快速查询、排序、热力图统计。

虽然有一点冗余，但非常实用。

后续查询可以很简单：

```txt
listCardsByDate(date)
listEdgesByDate(date)
listTimelineNodesByDate(date)
getHeatmapStats(month)
```

---

## 5. 热力图统计

热力图可以根据每天的活跃度生成。

活跃度来源：

- 时间线节点数量
- 创建卡片数量
- 完成 Todo 数量
- 编辑次数，后续可选

MVP 可以先简单计算：

```txt
activityCount = timelineNodeCount + cardCount + completedTodoCount
```

颜色深浅：

```txt
0 = 无记录
1-2 = 轻度记录
3-5 = 中度记录
6+ = 高活跃
```

不要一开始做复杂统计。

---

## 6. 每日 Todo 如何处理

市面上 Todo 软件常见做法大概有几种：

### 6.1 全局任务 + due date

例如 Todoist / TickTick 这类。

任务本身是全局对象，通过 due date 或 scheduled date 出现在某一天。

优点：

- 适合长期任务
- 支持延期、重复、项目分类

缺点：

- 容易变成任务管理系统
- 和 Now 时间线的“当天画布”概念不完全一致

### 6.2 每日清单

例如日计划类 App。

每天有当天清单，未完成任务可以手动迁移到第二天。

优点：

- 简单
- 符合每日工作台

缺点：

- 长期任务管理弱
- 未完成任务迁移规则要设计

### 6.3 Bullet Journal 模式

每天写下任务，未完成的任务迁移到未来日期。

优点：

- 很适合个人记录
- “迁移”本身也是一次整理

缺点：

- 自动化程度低

### 6.4 日历事件模式

每个事项挂在具体日期 / 时间。

优点：

- 适合事件

缺点：

- 对灵感、卡片、思维导图不友好

---

## 7. Now 时间线推荐方案

Now 时间线适合采用：

> Daily Workspace + 可选迁移 Todo

也就是说：

- 每天有自己的画布和时间线
- 当天创建的 Todo 默认属于当天
- 完成后进入当天时间线
- 未完成 Todo 可以留在当天，也可以手动迁移到另一天
- 后续可以提供“带到今天”功能

### 不推荐一开始做

- 自动把所有未完成 Todo 滚到第二天
- 重复任务系统
- 项目级任务管理
- 优先级 / KPI / 完成率压力系统

这些会把产品拖回传统 Todo。

---

## 8. 实现复杂度判断

这个设计不算特别麻烦，但需要现在改数据模型。

如果等画布、Todo 闭环、热力图都做完再改，会很痛。

当前阶段适合尽快引入：

- `DayWorkspace`
- `dayId`
- `date`
- 按 date 查询 cards / edges / timelineNodes

这样后续日历 / 热力图会很自然。

---

## 9. 对现有 Phase 的影响

### Phase 2 时间线

时间线从“全局节点列表”改成“当前日期节点列表”。

需要支持：

```txt
/timeline?date=YYYY-MM-DD
```

或：

```txt
/day/YYYY-MM-DD
```

### Phase 3 画布

画布从“全局卡片画布”改成“当前日期画布”。

需要支持：

```txt
/canvas?date=YYYY-MM-DD
```

或统一进入：

```txt
/day/YYYY-MM-DD
```

### Phase 4 Todo 闭环

Todo 完成后生成的 TimelineNode 应该进入同一天的 workspace。

```txt
card.dayId -> timelineNode.dayId
card.date -> timelineNode.date
```

---

## 10. 推荐路由

短期可以用：

```txt
/
/timeline?date=YYYY-MM-DD
/canvas?date=YYYY-MM-DD
```

后续更推荐统一成：

```txt
/day/YYYY-MM-DD
```

这个页面内部切换：

- Timeline View
- Canvas View
- Split View，桌面端可选

热力图入口：

```txt
/review/month/YYYY-MM
/review/year/YYYY
```

---

## 11. 一句话结论

Now 时间线应该按天组织数据：

> 每一天是一个 Day Workspace，里面有当天的时间线、画布、卡片和连线。

热力图负责找到某一天，Day Workspace 负责回看某一天。

这个设计比全局画布更符合产品直觉，也更适合后续月报、年报和 AI 回顾。
