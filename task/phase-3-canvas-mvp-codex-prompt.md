# Codex Prompt：Phase 3 - 画布 MVP

你现在要在项目 `/home/sk/project/Now 时间线` 中继续实现 Now 时间线 PWA。

当前状态：

- Phase 0 + Phase 1 已完成：工程初始化、基础目录、核心类型、Dexie / IndexedDB 数据层、Zustand stores 已建立。
- Phase 2 已完成：简版时间线可用，能创建时间节点，刷新后数据仍然存在。

本阶段任务：执行 **Phase 3：画布 MVP**。

目标：建立卡片画布的基础能力，让用户可以创建普通思维卡片 / Todo 卡片，拖拽、缩放、连线，并把位置和连线保存到 IndexedDB。

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

重点遵守：

- 不要把业务逻辑写进组件
- IndexedDB 访问必须通过 repository / service
- store 不要巨型化
- UI 要干净、有作品感，不要后台管理系统风格
- 本阶段只做画布 MVP，不要提前实现 Todo 完成转时间线闭环，那是 Phase 4

---

## 本阶段目标

完成画布页面基础闭环：

1. `/canvas` 页面可访问
2. 接入 React Flow
3. 展示卡片节点
4. 创建普通思维卡片
5. 创建 Todo 卡片
6. 拖拽卡片并保存位置
7. 创建卡片之间的连线
8. 删除卡片 / 删除连线
9. 刷新后卡片和连线仍然存在
10. 画布有基础缩放、拖拽、fit view 能力

---

## 需要安装的依赖

如果项目还没有安装 React Flow，请安装：

```bash
npm install @xyflow/react
```

注意：

- 不要安装旧包 `reactflow`，优先使用 `@xyflow/react`。
- 不要引入大型 UI 框架。
- 本阶段不需要 Framer Motion，除非项目已经安装且非常轻量使用。

---

## 需要修改 / 新增的目录

```txt
src/pages/
src/features/canvas/
src/features/cards/
src/components/ui/
src/stores/
src/db/repositories/
src/app/
src/styles/
```

---

## 需要新增或完善的文件

### 页面

```txt
src/pages/CanvasPage.tsx
```

要求：

- 作为画布主页面
- 使用 `CanvasView`
- 页面应有全屏 / 大画布感
- 保留返回首页或去时间线的简单入口
- 不要做成后台表格风

---

### 画布组件

```txt
src/features/canvas/components/CanvasView.tsx
src/features/canvas/components/CanvasToolbar.tsx
src/features/canvas/components/CardNode.tsx
src/features/canvas/components/ThoughtCardNode.tsx
src/features/canvas/components/TodoCardNode.tsx
```

#### CanvasView

负责：

- 渲染 React Flow
- 加载 cards / edges
- 映射 Card -> React Flow Node
- 映射 Edge -> React Flow Edge
- 处理节点拖拽后的坐标保存
- 处理连线创建
- 处理节点 / 连线删除
- 显示空状态或引导

#### CanvasToolbar

负责：

- 创建普通思维卡片
- 创建 Todo 卡片
- fit view
- 可选：清空当前选择

#### CardNode

通用卡片节点壳。

负责：

- 统一尺寸 / 玻璃质感 / 基础样式
- 处理节点内容展示
- 根据 card.type 分发 Thought / Todo 风格

#### ThoughtCardNode

普通思维卡片：

- 不显示完成圆圈
- 视觉更轻
- 用于想法、灵感、备注

#### TodoCardNode

Todo 卡片：

- 显示一个小圆圈或待完成标记
- 现在只展示，不实现完成逻辑
- 点击完成暂时不要创建时间线节点；Phase 4 再做

---

### 画布 hook / service

```txt
src/features/canvas/hooks/useCanvasActions.ts
src/features/canvas/services/canvasService.ts
src/features/canvas/types.ts
```

#### canvasService.ts

至少提供：

```ts
loadCanvas(): Promise<{ cards: Card[]; edges: Edge[] }>
createCanvasCard(input: CreateCardInput): Promise<Card>
updateCardPosition(cardId: string, position: { x: number; y: number }): Promise<Card>
deleteCanvasCard(cardId: string): Promise<void>
createCanvasEdge(input: { fromCardId: string; toCardId: string }): Promise<Edge>
deleteCanvasEdge(edgeId: string): Promise<void>
```

要求：

- 通过 cardRepository / edgeRepository 访问 IndexedDB
- 不要在组件里直接访问 db
- 删除 card 时，需要同时删除关联 edges
- 坐标字段要和现有 Card 类型一致；如果现有类型是 `x/y`，不要另起 `position` 结构，除非同步更新类型和 repository

#### useCanvasActions.ts

负责连接：

- canvasStore
- cardStore
- edgeStore
- canvasService
- 页面组件

不要把复杂业务塞进组件。

---

### 卡片 service / 组件

```txt
src/features/cards/components/CardEditor.tsx
src/features/cards/components/CardTypeToggle.tsx
src/features/cards/services/cardService.ts
```

本阶段可以简单实现：

- 创建卡片时输入内容
- 选择 card type：`thought` / `todo`
- 默认内容可以为空后聚焦编辑，也可以从 toolbar 弹出输入

不要做复杂富文本。

---

## store 要求

检查并完善：

```txt
src/stores/canvasStore.ts
src/stores/cardStore.ts
src/stores/edgeStore.ts
```

### canvasStore 至少包含

```ts
selectedCardId: string | null
selectedEdgeId: string | null
viewport: { x: number; y: number; zoom: number }
setSelectedCardId(id)
setSelectedEdgeId(id)
setViewport(viewport)
clearSelection()
```

### cardStore 至少包含

```ts
cards: Card[]
isLoading: boolean
error: string | null
setCards(cards)
addCard(card)
updateCard(id, patch)
removeCard(id)
setLoading(value)
setError(error)
```

### edgeStore 至少包含

```ts
edges: Edge[]
setEdges(edges)
addEdge(edge)
removeEdge(id)
removeEdgesByCardId(cardId)
```

注意：

- store 只负责状态和轻量 action
- repository / IndexedDB 操作放 service
- 不要在 store 里写复杂流程

---

## repository 要求

检查并完善：

```txt
src/db/repositories/cardRepository.ts
src/db/repositories/edgeRepository.ts
```

### cardRepository 至少支持

```ts
create(card: Card): Promise<Card>
update(id: string, patch: Partial<Card>): Promise<Card>
remove(id: string): Promise<void>
list(): Promise<Card[]>
getById(id: string): Promise<Card | undefined>
```

### edgeRepository 至少支持

```ts
create(edge: Edge): Promise<Edge>
remove(id: string): Promise<void>
list(): Promise<Edge[]>
getByCardId(cardId: string): Promise<Edge[]>
removeByCardId(cardId: string): Promise<void>
```

---

## 路由要求

检查并更新：

```txt
src/app/routes.tsx
src/app/App.tsx
src/pages/HomePage.tsx
```

需要能访问：

```txt
/
/timeline
/canvas
```

首页增加进入画布的入口。

---

## UI / UX 要求

本阶段是 MVP，但需要有作品感。

要求：

- 画布背景不要纯白死板
- 可以先使用轻微网格 / 光点 / 渐变背景，不要过度粒子化
- 卡片要轻，不要厚重 dashboard 卡片
- Todo 卡片和普通思维卡片视觉上要有区别
- 连线样式要克制
- 工具栏不要像后台管理按钮堆
- 移动端至少不崩，但复杂移动画布体验可以后续优化

注意：

- `docs/ui-style-concept.md` 里的粒子 / 光轨是整体方向，但本阶段不要为了视觉过度复杂化。
- 先保证画布基础交互稳定。

---

## 验收标准

完成后必须满足：

1. `npm run build` 成功
2. 首页可以打开
3. `/timeline` 仍然可用，不能破坏 Phase 2
4. `/canvas` 可以打开
5. 可以创建普通思维卡片
6. 可以创建 Todo 卡片
7. 可以拖拽卡片，刷新后位置仍然存在
8. 可以连接两张卡片，刷新后连线仍然存在
9. 可以删除卡片，关联连线也被删除
10. 可以删除连线
11. 没有直接在组件里访问 Dexie / IndexedDB
12. 没有提前实现 Todo 完成转时间线
13. 没有实现 AI、后端、同步

---

## 禁止事项

- 不要实现 Phase 4 的 Todo 完成转时间线
- 不要实现 AI 报告
- 不要做后端
- 不要做复杂多选 / 框选 / 分组
- 不要引入大型 UI 框架
- 不要把所有画布逻辑写进 `CanvasPage.tsx`
- 不要绕过 repository 直接访问 db
- 不要重构 Phase 2 时间线，除非 build 必须修复
- 不要因为视觉效果牺牲基础交互稳定性

---

## 交付要求

完成后请输出：

1. 修改 / 新增文件列表
2. Phase 3 完成内容
3. 关键实现说明
4. build / typecheck 结果
5. 如果有 blocker，明确说明，不要编造成功
