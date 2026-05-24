# Codex Prompt：Phase 2 - 时间线 MVP

你现在要在项目 `/home/sk/project/Now 时间线` 中继续实现 Now 时间线 PWA。

上一阶段 Phase 0 + Phase 1 已完成：工程初始化、基础目录、核心类型、Dexie / IndexedDB 数据层、Zustand stores 已建立。

本阶段任务：执行 **Phase 2：时间线 MVP**。

目标：先做出第一个完整可用页面 —— 时间线页面。

## 必须先阅读的文档

请先阅读并遵守：

- `docs/design-inspiration.md`
- `docs/architecture.md`
- `docs/product-positioning.md`
- `docs/paid-grade-uiux.md`
- `docs/tech-stack.md`
- `docs/project-structure-and-rules.md`
- `docs/development-roadmap.md`

重点遵守：

- 不要把业务逻辑写进组件
- IndexedDB 访问必须通过 repository / service
- store 不要巨型化
- UI 要干净、有作品感，不要后台管理系统风格
- 本阶段只做时间线 MVP，不要提前做画布、AI、后端

---

## 本阶段目标

完成时间线页面的基础闭环：

1. 展示时间线节点
2. 创建时间节点
3. 编辑时间节点
4. 删除时间节点
5. 按时间排序
6. 空状态设计
7. 数据写入 IndexedDB，并同步 Zustand store

---

## 需要修改 / 新增的目录

```txt
src/pages/
src/features/timeline/
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
src/pages/TimelinePage.tsx
```

要求：

- 作为时间线主页面
- 使用 `TimelineView`
- 页面风格保持干净、克制、有作品感
- 不要做复杂 dashboard

### 时间线组件

```txt
src/features/timeline/components/TimelineView.tsx
src/features/timeline/components/TimelineNodeCard.tsx
src/features/timeline/components/TimelineCreateInput.tsx
```

#### TimelineView

负责：

- 加载 timeline nodes
- 按 `happenedAt` 倒序或正序展示，优先选择更适合当前 UI 的方式
- 渲染空状态
- 渲染创建输入区
- 渲染节点列表

#### TimelineNodeCard

负责：

- 展示单个时间节点
- 展示内容
- 展示时间
- 支持编辑
- 支持删除
- 显示 source，但不要做得很重

#### TimelineCreateInput

负责：

- 输入节点内容
- 可选设置 happenedAt，默认当前时间
- 提交后创建节点
- 创建成功后清空输入

### 时间线 hook / service

```txt
src/features/timeline/hooks/useTimelineActions.ts
src/features/timeline/services/timelineService.ts
```

#### timelineService.ts

至少提供：

```ts
createTimelineNode(input: CreateTimelineNodeInput): Promise<TimelineNode>
updateTimelineNode(id: string, patch: Partial<TimelineNode>): Promise<TimelineNode>
deleteTimelineNode(id: string): Promise<void>
listTimelineNodes(): Promise<TimelineNode[]>
```

要求：

- 通过 `timelineRepository` 访问 IndexedDB
- 不要在组件里直接访问 db
- 创建节点时默认：
  - `source: "manual"`
  - `createdAt: now`
  - `happenedAt: input.happenedAt ?? now`

#### useTimelineActions.ts

负责连接：

- timelineStore
- timelineService
- 页面组件

不要把复杂业务塞进组件。

### UI 组件

如果还没有这些文件，请创建：

```txt
src/components/ui/Button.tsx
src/components/ui/IconButton.tsx
src/components/ui/Input.tsx
src/components/ui/Textarea.tsx
src/components/ui/EmptyState.tsx
```

要求：

- 简洁、可复用
- 不要引入重型 UI 库
- 使用 Tailwind
- 保持移动端触控区域可用

---

## store 要求

完善：

```txt
src/stores/timelineStore.ts
```

至少包含：

```ts
nodes: TimelineNode[]
isLoading: boolean
error: string | null
setNodes(nodes)
addNode(node)
updateNode(id, patch)
removeNode(id)
setLoading(value)
setError(error)
```

注意：

- store 只负责状态和轻量 action
- repository / IndexedDB 操作放 service
- 不要在 store 里写复杂流程

---

## repository 要求

检查并完善：

```txt
src/db/repositories/timelineRepository.ts
```

至少支持：

```ts
create(node: TimelineNode): Promise<TimelineNode>
update(id: string, patch: Partial<TimelineNode>): Promise<TimelineNode>
remove(id: string): Promise<void>
list(): Promise<TimelineNode[]>
getById(id: string): Promise<TimelineNode | undefined>
```

---

## 路由要求

检查并更新：

```txt
src/app/routes.tsx
src/app/App.tsx
```

需要能访问：

```txt
/
/timeline
```

首页可以保留简单入口：

- 项目名：Now 时间线
- 标语：用卡片计划今天，用时间线保存发生过的事。
- 进入时间线的按钮 / 链接

---

## UI / UX 要求

本阶段不是最终视觉，但不能廉价。

要求：

- 空状态要好看，不要只写 `No data`
- 创建节点的输入体验要顺
- 节点卡片不要像后台表格
- 删除前可以用轻量确认，或者明确的删除按钮
- 移动端至少不崩
- 桌面端要有空间感

可以使用轻量 CSS / Tailwind 完成。

不要为了本阶段引入 Framer Motion，除非项目已经安装且使用成本很低。

---

## 验收标准

完成后必须满足：

1. `npm run build` 成功
2. 首页可以打开
3. `/timeline` 可以打开
4. 可以创建时间节点
5. 刷新后节点仍然存在
6. 可以编辑节点
7. 可以删除节点
8. 空状态正常显示
9. 没有直接在组件里访问 Dexie / IndexedDB
10. 没有提前实现画布、AI、后端

---

## 禁止事项

- 不要接 React Flow
- 不要做 CanvasPage 的真实功能
- 不要实现 Todo 卡片
- 不要实现 AI 报告
- 不要做后端
- 不要引入大型 UI 框架
- 不要把所有时间线逻辑写进 `TimelinePage.tsx`
- 不要绕过 repository 直接访问 db
- 不要重构 Phase 0 / Phase 1 已完成的基础结构，除非 build 必须修复

---

## 交付要求

完成后请输出：

1. 修改 / 新增文件列表
2. Phase 2 完成内容
3. 关键实现说明
4. build / typecheck 结果
5. 如果有 blocker，明确说明，不要编造成功

