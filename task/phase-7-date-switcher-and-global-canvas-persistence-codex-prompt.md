# Codex Prompt：Phase 7 - Date Switcher + Timeline-by-Day + Persistent Canvas

你现在要在项目 `/home/sk/project/Nowtl` 中继续实现 **Now 时间线 PWA**。

本任务承接当前已经完成的状态：时间线和画布已经合并到 `TimelineCanvasSurface`，并且有全屏工作区模式。现在要修正“按天切换”与“画布持久化”的数据边界。

---

## 0. 背景校准

频道里之前的计划曾经是：

```txt
/day/YYYY-MM-DD
  - Timeline
  - Canvas
/review/month/YYYY-MM
  - Heatmap
```

早期文档也写过 `Daily Workspace = 当天时间线 + 当天画布`。

但现在产品方向已经调整：

> 日期切换只切换「时间线」。
> 画布本体是一个持续存在的完整工作区，不应该因为换到第二天而清空。

也就是说：

```txt
TimelineNode = date-scoped / day-scoped
Canvas cards + edges + mind-map layout = global persistent workspace
```

时间线是每天的记录层；画布是持续工作的空间层。

不要再把每一天都当成一个全新的独立画布工作区。这个会导致第二天所有卡片、Todo、想法、连线消失，正是当前要修的问题。

---

## 1. 当前问题

现在的问题表现：

1. 到第二天后，画布上的所有东西都会清空：
   - todo card
   - thought card
   - 思维导图连线
   - 画布 viewport / 布局状态

2. 时间线也没有一个明确的日期切换入口。

3. 每一天看起来都变成一个新的完整工作区，而不是：
   - 同一个画布工作区
   - 不同日期的时间线记录

---

## 2. 本阶段目标

### A. 做日期切换 / 热力图入口

在工作区旁边新增一个轻量时间切换器，可以先做 MVP，不需要完整年度日历。

推荐形态：

- 右侧或左侧窄栏
- 显示最近 14 / 30 天的小点或小格子
- 今天高亮
- 有记录的日期根据活跃度改变深浅
- 点击某一天后切换当前 timeline date
- URL 同步为：`/timeline?date=YYYY-MM-DD`

可以命名为：

```txt
DateHeatmapRail
TimelineDateSwitcher
TemporalHeatmapRail
```

优先简单可靠，不要做复杂动画犯罪现场。

### B. 每一天的时间线可切换并落库

要求：

- 创建 timeline node 时，`date` 必须等于当前选中的日期。
- `happenedAt` 可以是当前选中日期 + 当前时间，或用户选择的时间。
- 切换到其他日期后，只显示该日期的 timeline nodes。
- 刷新后仍然保留。
- URL query date 是可恢复状态。

### C. 画布内容跨日期保持不变

要求：

- 切换日期时，不要清空 canvas cards。
- 刷新页面后，canvas cards / edges 仍存在。
- todo card / thought card / mind-map edge 都是全局画布数据。
- 日期切换只触发 timeline nodes reload，不触发 canvas reload 到空 day workspace。
- 完成 todo 后，如果生成 timeline node，则这个 timeline node 属于当前选中的日期；但 todo card 本身继续留在画布上。

---

## 3. 必须先阅读

```txt
src/pages/TimelinePage.tsx
src/features/timeline/components/TimelineCanvasSurface.tsx
src/features/timeline/hooks/useTimelineActions.ts
src/features/timeline/services/timelineService.ts
src/features/canvas/hooks/useCanvasActions.ts
src/features/canvas/services/canvasService.ts
src/db/repositories/cardRepository.ts
src/db/repositories/edgeRepository.ts
src/db/repositories/timelineRepository.ts
src/features/day/hooks/useCurrentDay.ts
src/features/day/hooks/useDayWorkspace.ts
src/features/day/services/dayStatsService.ts
src/db/schema.ts
```

也参考：

```txt
docs/daily-workspace-model.md
docs/current-progress-summary.md
docs/immersive-timeline-uiux.md
```

注意：`docs/daily-workspace-model.md` 里的“每天自己的画布”已经不再符合当前产品方向。不要机械照抄旧文档。

---

## 4. 推荐工程改法

### 4.1 保留 day workspace 给 timeline 用

可以继续让 `TimelineNode` 使用：

```ts
dayId: string
date: string
```

这部分不用推倒。

### 4.2 Canvas 改成全局加载

当前 `useCanvasActions(workspace)` 很可能调用：

```ts
loadCanvasByDay(workspace)
```

这就是画布换天后清空的根因。

改法二选一：

#### 方案 1：新增全局 canvas service，最推荐

新增 / 修改：

```txt
src/features/canvas/services/canvasService.ts
```

提供：

```ts
loadGlobalCanvas(): Promise<{ cards: Card[]; edges: Edge[] }>
createGlobalCanvasCard(input: CreateCardInput): Promise<Card>
createGlobalCanvasEdge(input: CreateEdgeInput): Promise<Edge>
```

底层调用 repository 的全量 list：

```ts
cardRepository.list()
edgeRepository.list()
```

创建 card / edge 时仍可填充 `dayId/date` 为当前日期作为创建来源元数据，但加载画布时不要按日期过滤。

#### 方案 2：保留旧函数但改语义

把 `loadCanvasByDay` 改成实际返回全局 canvas。

不推荐，因为名字会骗人。名字骗人，后面 bug 会长蘑菇。

### 4.3 Edge 删除逻辑也要全局

当前如果有：

```ts
removeByCardIdAndDayId(cardId, dayId)
```

删除全局画布卡片时不要只删当天 edge，否则跨日创建来源不同的 edge 可能残留。

全局画布删除卡片应该使用：

```ts
removeByCardId(cardId)
```

### 4.4 Canvas viewport 持久化

现在 viewport 可能存在 `DayWorkspace.canvasViewport`。

新方向下 viewport 应该是全局设置，不应该随日期变。

MVP 可选两种：

1. 用现有 settings 表存一个 key：
   ```txt
   canvas.viewport.global
   ```

2. 如果不想改太多，先保存在 Zustand + localStorage。

推荐用 settings 表，因为本项目已经有 `settings` store/repository。

刷新后需要恢复 viewport。

---

## 5. 日期切换实现细节

### 5.1 修正 `useCurrentDay`

当前 `useCurrentDay()` 只监听 `popstate`。

如果代码里用 `history.pushState` 切日期，React 不会自动知道。

推荐新增一个统一函数：

```ts
setCurrentTimelineDate(date: LocalDateString)
```

它负责：

```ts
const url = new URL(window.location.href);
url.searchParams.set("date", date);
window.history.pushState({}, "", url);
window.dispatchEvent(new CustomEvent("now:date-change", { detail: { date } }));
```

然后 `useCurrentDay` 同时监听：

```ts
popstate
now:date-change
```

这样 Date Switcher 点击后页面会立即刷新 timeline state。

### 5.2 DateHeatmapRail 数据

可以用已有：

```ts
getDayActivityStats(startDate, endDate)
```

但注意：旧统计里 `cardCount` 如果改成全局 canvas 后，不应该再算进每天活跃度，否则每天都会一样。

本阶段 heatmap activity 建议只用：

```txt
activityCount = timelineNodeCount + completedTodoCount(optional)
```

MVP 最简单：只用 timelineNodeCount。

---

## 6. 验收标准

必须手动验证：

1. 在 2026-06-08 创建一个 thought card。
2. 创建一个 todo card。
3. 两张卡之间拉一条 edge。
4. 刷新页面：卡片和 edge 仍在。
5. 切换到 2026-06-09：卡片和 edge 仍在。
6. 在 2026-06-09 创建 timeline node。
7. 切回 2026-06-08：看不到 06-09 的 timeline node，但画布仍在。
8. 切回 2026-06-09：能看到刚才的 timeline node。
9. 再刷新：日期、timeline、canvas 都不丢。

工程验证：

```bash
npm run build
```

如果项目已有 lint / typecheck，也一起跑。

---

## 7. 禁止事项

- 不要重做整个 UI。
- 不要引入后端。
- 不要引入账号系统。
- 不要改 Dexie 表名，除非必须做 migration。
- 不要清空 IndexedDB。
- 不要把 canvas 继续按 date 过滤。
- 不要让 Date Switcher 变成大日历管理系统。

---

## 8. 一句话目标

> 每天切换的是时间线，不是把整个宇宙换掉。

画布是宇宙本体；时间线是当天被钉住的星点。👿
