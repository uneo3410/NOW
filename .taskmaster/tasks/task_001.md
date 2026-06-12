# Task ID: 1

**Title:** 验证并收尾全局画布持久化

**Status:** done

**Dependencies:** None

**Priority:** high

**Description:** 在 Sticky Note 开发前确认 Phase 7 的数据边界：画布卡片、连线、viewport 是全局持久的，时间线节点仍按当前日期隔离。

**Details:**

审计并在必要时调整 `src/features/canvas/services/canvasService.ts`、`src/features/canvas/hooks/useCanvasActions.ts`、`src/features/timeline/components/TimelineCanvasSurface.tsx`、`src/features/day/hooks/useCurrentDay.ts`、`src/features/timeline/components/DateHeatmapRail.tsx`、`src/features/day/services/dayStatsService.ts`。`loadGlobalCanvas()` 必须全局读取 cards/edges；删除卡片必须全局删除关联 edge；viewport 必须使用 `canvas.viewport.global` settings key；切换日期只重新加载 timeline nodes，不能隐藏或清空 canvas cards/edges。

**Test Strategy:**

运行 `npm run build`。手动验收：在一个日期创建 thought + todo + edge，刷新后仍存在；切换到另一个日期后画布仍存在；在第二个日期创建 timeline node，切回第一个日期后只切换 timeline 内容，画布不变。

## Subtasks

### 1.1. 审计全局画布加载和删除语义

**Status:** done  
**Dependencies:** None  

确认 canvas cards/edges 全局加载，并且删除卡片会跨日期删除所有关联 edge。

**Details:**

检查 service/repository 是否使用 `list()` 和 `removeByCardId()`，避免继续使用 day-scoped 的读取或删除。

### 1.2. 审计时间线日期切换

**Status:** done  
**Dependencies:** None  

确认日期切换会更新 URL 状态，并只重新加载当前日期的 timeline nodes。

**Details:**

检查 `setCurrentTimelineDate`、`useCurrentDay`、`useDayWorkspace`、`useTimelineActions` 的行为。

### 1.3. 审计全局 viewport 持久化

**Status:** done  
**Dependencies:** None  

确认 React Flow viewport 从全局 settings 恢复，而不是跟随 day workspace。

**Details:**

确认 `loadGlobalCanvasViewport()` 和 `saveGlobalCanvasViewport()` 使用 settings，并且 UI 只在合适时机应用一次持久化 viewport。
