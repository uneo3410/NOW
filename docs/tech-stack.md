# Now 时间线：技术栈选择

## 1. 当前推荐栈

```txt
Vite + React + TypeScript
React Flow
Zustand
Dexie / IndexedDB
Framer Motion
Tailwind CSS
vite-plugin-pwa
```

后端后置：

```txt
Hono / Fastify
SQLite / Postgres
Custom AI API
Backup API
```

---

## 2. 为什么选这套

这个项目的核心难点不是普通 CRUD，而是：

- PWA 体验
- 桌面 / 移动两套 UI
- 画布拖拽、缩放、连线
- 时间线节点交互
- Todo 完成后的动效闭环
- 本地数据稳定保存
- 未来接入 AI / 备份

React 生态在这些点上最省事，尤其是画布和动效。

React Flow 可以直接解决：

- 节点
- 连线
- 拖拽
- 缩放
- viewport
- selection
- 基础画布交互

不要在 MVP 阶段自研画布底层。

---

## 3. vibeCoding 约束

这个项目大概率会采用 vibeCoding，也就是高度依赖 AI 编程。

因此技术栈选择不能只看“工程师手写时是否优雅”，还要看：

- AI 是否熟悉
- 代码模式是否常见
- 出错后是否容易定位
- 文件结构是否清晰
- 状态流是否容易被 AI 搞乱
- 组件边界是否足够明确

React + TypeScript + Vite 对 AI 来说是高熟悉度组合，稳定性优先。

---

## 4. 状态管理风险

Zustand 虽然轻，但如果没有约束，也会变成一锅粥。

尤其在这个项目里，状态会包含：

- 当前画布 viewport
- 卡片列表
- 连线列表
- 时间线节点
- 当前选中节点
- 编辑状态
- Todo 完成动画状态
- 数据库同步状态

如果全部塞进一个 store，会很快失控。

### 解决策略

不要做一个巨型 store。

建议拆成多个领域 store：

```txt
stores/
  canvasStore.ts       // viewport, selection, canvas interaction
  cardStore.ts         // cards CRUD
  edgeStore.ts         // edges CRUD
  timelineStore.ts     // timeline nodes CRUD
  uiStore.ts           // panels, modals, sheets, theme
  syncStore.ts         // backup / import / export / future sync
  reportStore.ts       // future AI reports
```

并且规定：

- 数据 CRUD 尽量走 service 层
- store 负责状态，不直接写复杂业务
- IndexedDB 访问集中在 db 层
- Todo 完成这种跨域逻辑放到 action / service 中

示例：

```txt
completeTodoCard(cardId)
  -> update card.completedAt
  -> create TimelineNode
  -> trigger UI animation
```

不要让多个组件各自拼这套流程。

---

## 5. 推荐目录结构

```txt
src/
  app/
    routes/
    layout/
  components/
    canvas/
    timeline/
    cards/
    ui/
  features/
    canvas/
    timeline/
    cards/
    reports/
  stores/
    canvasStore.ts
    cardStore.ts
    edgeStore.ts
    timelineStore.ts
    uiStore.ts
  services/
    cardService.ts
    timelineService.ts
    todoService.ts
    backupService.ts
    reportService.ts
  db/
    schema.ts
    client.ts
    repositories/
  types/
    card.ts
    timeline.ts
    report.ts
  styles/
  pwa/
```

原则：

> 组件不要直接操纵数据库；复杂业务不要散落在组件里。

---

## 6. 关于开源

如果后续做成免费开源产品，这套技术栈也合适。

优点：

- 入门门槛相对低
- 社区熟悉
- contributors 容易理解
- PWA 部署简单
- 不绑定重后端
- 本地优先理念清晰

AI / 自定义 API 可以作为高级可选能力，不影响核心开源体验。

---

## 7. 当前结论

技术栈可以沿用可靠组合，但需要提前治理状态管理。

真正要避免的不是 React / Zustand 本身，而是：

> vibeCoding 把所有状态、业务、数据库和 UI 动效写进同一个泥潭。

所以 MVP 开始前必须先定文件结构和 store 边界。

