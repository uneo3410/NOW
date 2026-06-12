# Task ID: 2

**Title:** 扩展 Card model 支持 sticky 样式和未来 assets

**Status:** done

**Dependencies:** 1 ✓

**Priority:** high

**Description:** 新增 `sticky` card type 和可选样式字段，同时避免破坏现有 IndexedDB 数据。

**Details:**

更新 `src/features/cards/types.ts`，让 `CardType` 包含 `sticky`。新增 `CardStyle` 类型，MVP variant 包括 `paper`、`glass`、`photo`、`tape`，并支持可选 `color`、`backgroundImageId`。扩展 `CreateCardInput`，允许创建时传入 style。更新 `cardService.createCard`、`updateCard` 和相关调用点以保留可选 style。现有 thought/todo 记录没有 style 时必须继续有效。除非引入新索引或新表，否则不要改 Dexie 表名或做破坏性 migration。

**Test Strategy:**

运行 `npm run typecheck` 和 `npm run build`。验证现有 thought/todo 创建仍能通过编译；验证手动创建 sticky card 记录后，create/update/list 能完整保留 style。

## Subtasks

### 2.1. 新增 CardStyle 和 sticky 类型定义

**Status:** done  
**Dependencies:** None  

在共享 card 类型模块中定义 sticky 相关类型。

**Details:**

添加 `CardType = "thought" | "todo" | "sticky"`、`CardStyleVariant`、`CardStyle`。`Card.style` 保持可选，确保向后兼容。

### 2.2. 让 create/update service 持久化 style

**Status:** done  
**Dependencies:** 2.1  

把可选 style 数据贯穿 card 创建和更新流程。

**Details:**

更新 `CreateCardInput`、`cardService.createCard`、canvas creation helpers、undo restore 路径，以及需要的 store patch。

### 2.3. 保持 thought/todo 行为稳定

**Status:** done  
**Dependencies:** 2.1, 2.2  

确认新类型不会改变 todo 完成流程或 thought 渲染行为。

**Details:**

审计 `todoService`、`useTodoActions`、`CardNode`、`CardEditor`、`QuickCapture`、`TimelineCanvasSurface` 中对 card type 的假设。
