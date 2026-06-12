# Task ID: 3

**Title:** 实现 Sticky Note UI MVP

**Status:** done

**Dependencies:** 2 ✓

**Priority:** high

**Description:** 把 sticky cards 作为一等画布材料加入创建和渲染流程，但暂不做图片上传或图片编辑。

**Details:**

新增 `src/features/canvas/components/StickyCardNode.tsx`，并在 `CardNode` 中路由 `card.type === "sticky"`。更新 `CardTypeToggle`、`CardEditor`、`QuickCapture`、`TimelineCanvasSurface` 的右键菜单/composer，让用户可以创建 sticky cards。Sticky cards 必须支持现有文本编辑、拖拽、连线、删除、undo/redo restore 和持久化。视觉上要像贴在画布上的材料，但本任务不要实现图片上传/图片编辑。

**Test Strategy:**

运行 `npm run build`。从 toolbar/card editor 和 timeline-canvas 右键菜单创建 sticky cards；验证编辑、移动、连线、删除、撤销/重做、刷新、切换日期都正常。

## Subtasks

### 3.1. 新增 StickyCardNode 渲染组件

**Status:** done  
**Dependencies:** None  

创建独立 sticky card renderer，提供 MVP 视觉样式。

**Details:**

组件只负责视觉展示和文本换行。缺少 `style` 时应使用默认 paper variant。

### 3.2. 把 sticky 接入卡片创建入口

**Status:** done  
**Dependencies:** 3.1  

在 editor、quick capture、context menu 中暴露 sticky card type。

**Details:**

更新 `CardTypeToggle` 三选项布局、placeholder、label、context menu action、composer title/placeholder、creation draft type 和 undo label。

### 3.3. 验证 sticky 画布行为

**Status:** done  
**Dependencies:** 3.1, 3.2  

确认 sticky cards 能参与普通 canvas 行为。

**Details:**

Sticky cards 必须可选择、可拖拽、可连线、可删除、可通过 undo/redo 恢复，并且刷新/切换日期后仍存在。
