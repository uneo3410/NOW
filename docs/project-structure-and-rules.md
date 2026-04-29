# Now 时间线：目录结构与修改规范

## 1. 目标

这个项目会高度依赖 vibeCoding，因此目录结构和修改规范必须提前定好。

目标不是搞企业级仪式感，而是防止 AI 编程时出现：

- 组件乱放
- store 巨型化
- 业务逻辑散落在 UI 里
- 数据库操作到处都是
- 类型定义重复
- 动效和状态互相污染
- 后续改一个功能牵一片

原则：

> 结构要清楚，边界要硬，文件要短，复杂流程要集中。

---

## 2. 推荐目录结构

```txt
now-timeline/
  public/
    icons/
    manifest.webmanifest

  src/
    app/
      App.tsx
      routes.tsx
      providers.tsx

    pages/
      HomePage.tsx
      TimelinePage.tsx
      CanvasPage.tsx
      ReviewPage.tsx
      SettingsPage.tsx

    layouts/
      DesktopLayout.tsx
      MobileLayout.tsx
      AppShell.tsx

    features/
      timeline/
        components/
          TimelineView.tsx
          TimelineNodeCard.tsx
          TimelineCreateInput.tsx
        hooks/
          useTimelineActions.ts
        services/
          timelineService.ts
        types.ts

      canvas/
        components/
          CanvasView.tsx
          CardNode.tsx
          ThoughtCardNode.tsx
          TodoCardNode.tsx
          CanvasToolbar.tsx
        hooks/
          useCanvasActions.ts
        services/
          canvasService.ts
        types.ts

      cards/
        components/
          CardEditor.tsx
          CardTypeToggle.tsx
        services/
          cardService.ts
        types.ts

      todo/
        services/
          todoService.ts
        animations/
          completeTodoAnimation.ts

      reports/
        components/
          ReportList.tsx
          ReportViewer.tsx
        services/
          reportService.ts
        types.ts

      settings/
        components/
          AiProviderSettings.tsx
          BackupSettings.tsx

    components/
      ui/
        Button.tsx
        IconButton.tsx
        Input.tsx
        Textarea.tsx
        Modal.tsx
        BottomSheet.tsx
        EmptyState.tsx
      motion/
        FadeIn.tsx
        ScaleIn.tsx
        Presence.tsx

    stores/
      canvasStore.ts
      cardStore.ts
      edgeStore.ts
      timelineStore.ts
      uiStore.ts
      syncStore.ts
      reportStore.ts

    db/
      client.ts
      schema.ts
      repositories/
        cardRepository.ts
        edgeRepository.ts
        timelineRepository.ts
        reportRepository.ts

    services/
      backupService.ts
      exportService.ts
      importService.ts
      aiService.ts

    types/
      id.ts
      common.ts
      app.ts

    utils/
      date.ts
      id.ts
      device.ts
      format.ts

    styles/
      globals.css
      theme.css

    pwa/
      registerServiceWorker.ts

  docs/
    design-inspiration.md
    architecture.md
    product-positioning.md
    paid-grade-uiux.md
    tech-stack.md
    project-structure-and-rules.md

  package.json
  vite.config.ts
  tsconfig.json
  tailwind.config.ts
```

---

## 3. 分层规则

### 3.1 pages

`pages/` 只负责页面组合。

允许：

- 引入 layout
- 引入 feature 组件
- 做页面级布局

禁止：

- 直接访问 IndexedDB
- 写复杂业务流程
- 写大量状态逻辑

### 3.2 features

`features/` 是业务模块核心。

每个 feature 内部可以有：

- components
- hooks
- services
- types
- animations

规则：

- 和时间线有关的东西放 `features/timeline`
- 和画布有关的东西放 `features/canvas`
- 和 Todo 完成流程有关的东西放 `features/todo`
- 和报告有关的东西放 `features/reports`

### 3.3 components/ui

`components/ui/` 只能放通用 UI 原子组件。

例如：

- Button
- Input
- Modal
- BottomSheet
- EmptyState

禁止放业务概念。

如果组件名字里出现 `Timeline`、`Card`、`Todo`、`Report`，它就不应该在 `components/ui/`。

### 3.4 stores

`stores/` 只负责状态，不负责复杂业务。

禁止把所有状态塞进一个 store。

推荐拆分：

```txt
canvasStore.ts     // viewport, selected ids, interaction mode
cardStore.ts       // cards cache and basic actions
edgeStore.ts       // edges cache and basic actions
timelineStore.ts   // timeline nodes cache and basic actions
uiStore.ts         // modal, sheet, theme, device mode
syncStore.ts       // import/export/backup status
reportStore.ts     // report list and generation status
```

### 3.5 db

`db/` 是 IndexedDB 唯一入口。

组件和页面不能直接访问 Dexie。

所有数据库操作必须通过 repository 或 service。

### 3.6 services

`services/` 负责流程和副作用。

适合放：

- completeTodoCard
- createTimelineNode
- exportData
- importData
- backupData
- generateReport

复杂业务流程必须集中在 service，不要散落在组件里。

---

## 4. 核心业务流程规范

### 4.1 Todo 完成流程

Todo 完成是核心产品瞬间，必须集中实现。

入口统一为：

```ts
completeTodoCard(cardId: string): Promise<void>
```

流程：

```txt
1. 读取 card
2. 校验 card.type === "todo"
3. 写入 completedAt
4. 创建 TimelineNode
5. 更新本地 store
6. 触发完成动效
7. 归档 / 隐藏原卡片
```

禁止组件自己拼流程。

错误示范：

```txt
TodoCardNode.tsx 里直接：
- update card
- create timeline node
- write db
- play animation
```

正确示范：

```txt
TodoCardNode.tsx
  -> todoService.completeTodoCard(cardId)
```

### 4.2 时间线节点创建

入口统一为：

```ts
createTimelineNode(input: CreateTimelineNodeInput): Promise<TimelineNode>
```

所有来源都走同一个方法：

- 手动创建
- Todo 完成创建
- 未来导入创建
- 未来系统自动创建

用 `source` 区分来源，不要写多套节点结构。

### 4.3 卡片创建

入口统一为：

```ts
createCard(input: CreateCardInput): Promise<Card>
```

卡片类型只允许：

```ts
type CardType = "thought" | "todo"
```

不要临时发明 `normal`、`task`、`idea` 等重复概念。

---

## 5. 类型规范

所有核心类型必须集中定义。

推荐：

```txt
features/cards/types.ts
features/timeline/types.ts
features/reports/types.ts
```

公共类型放：

```txt
types/common.ts
types/id.ts
```

禁止在组件里临时写大型 type。

如果一个 type 被两个以上模块使用，就移到公共位置。

---

## 6. 文件长度规范

为了适配 vibeCoding，文件不要太长。

建议：

- UI 组件：不超过 180 行
- service：不超过 250 行
- store：不超过 220 行
- repository：不超过 200 行
- 单个类型文件：不超过 200 行

超过后优先拆分。

不是为了洁癖，是为了让 AI 修改时不会丢上下文。

---

## 7. 命名规范

### 7.1 文件命名

组件：

```txt
PascalCase.tsx
```

例如：

```txt
TimelineView.tsx
TodoCardNode.tsx
```

非组件：

```txt
camelCase.ts
```

例如：

```txt
todoService.ts
cardRepository.ts
```

### 7.2 类型命名

```ts
Card
TimelineNode
Report
CreateCardInput
CreateTimelineNodeInput
```

### 7.3 方法命名

动作用动词开头：

```ts
createCard
updateCard
completeTodoCard
createTimelineNode
exportData
importData
generateReport
```

---

## 8. 修改规范

每次修改前先判断属于哪一层：

```txt
只是视觉变化 -> components / styles
页面布局变化 -> pages / layouts
业务流程变化 -> services
状态缓存变化 -> stores
数据库结构变化 -> db/schema + repositories
类型变化 -> types 或 feature/types
```

### 8.1 禁止顺手乱改

一次修改只解决一个主题。

不要在“改按钮样式”的时候顺手重构 store。

不要在“加 Todo 动效”的时候顺手改数据库 schema。

### 8.2 数据结构变更必须记录

如果修改 IndexedDB schema，必须同步更新：

- `db/schema.ts`
- 对应 repository
- 类型定义
- migration 说明
- docs 中的数据模型

### 8.3 新增依赖必须说明理由

新增 npm 包前要回答：

1. 它解决什么问题？
2. 是否已有依赖能解决？
3. 是否影响 PWA 体积？
4. 是否会增加维护复杂度？

不要因为 AI 顺手推荐就安装。

### 8.4 AI 生成代码后必须检查

重点检查：

- 是否重复造类型
- 是否绕过 service 直接写 db
- 是否把业务写进组件
- 是否新增了没用的依赖
- 是否破坏移动端布局
- 是否引入不可控全局状态

---

## 9. UI / UX 修改规范

这个项目按作品集级完成度做，UI 修改不能只追求能用。

每次改 UI 都要考虑：

- 桌面端是否成立
- 移动端是否成立
- 动效是否克制
- 空状态是否好看
- 触控区域是否够大
- 是否破坏时间线 / 画布的空间感

### 桌面端

桌面端优先：

- 大画布
- 缩放
- 拖拽
- 空间感
- 快捷操作

### 移动端

移动端优先：

- 快速记录
- 底部 sheet
- 单手操作
- 卡片流
- 少复杂连线

不要强行让移动端复刻桌面画布。

---

## 10. Git / 提交规范

建议使用简洁 commit 类型：

```txt
feat: add timeline node creation
fix: repair todo completion flow
ui: polish card completion animation
docs: update architecture notes
refactor: split canvas store
db: add reports table
```

每次提交尽量只包含一个主题。

---

## 11. MVP 前必须先定下来的文件

正式编码前，至少先创建：

```txt
src/db/schema.ts
src/db/client.ts
src/features/cards/types.ts
src/features/timeline/types.ts
src/features/reports/types.ts
src/stores/cardStore.ts
src/stores/timelineStore.ts
src/stores/canvasStore.ts
src/features/todo/services/todoService.ts
```

这些是项目骨架。先立柱子，再盖房。

---

## 12. 一句话规范

> UI 可以浪漫，代码必须守规矩。

这个项目可以有审美、有动效、有仪式感，但底层结构不能玄学。
