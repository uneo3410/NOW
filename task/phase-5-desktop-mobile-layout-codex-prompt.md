# Codex Prompt：Phase 5 - 桌面 / 移动双布局

你现在要在项目 `/home/sk/project/Now 时间线` 中继续实现 **Now 时间线 PWA**。

本任务只实现 **Phase 5：桌面 / 移动双布局**。

核心目标：

> 不再把同一套桌面工作台硬塞进手机屏幕，而是建立桌面端「工作台」和移动端「快速捕捉」两种体验策略。

这阶段不是新增复杂业务能力，而是把现有 Phase 0-4 的能力重新安放到更合理的外壳里。

---

## 0. 当前状态

已完成：

- Phase 0：项目初始化
- Phase 1：Dexie / IndexedDB 数据层、repository、Zustand stores
- Phase 2：时间线 MVP
- Phase 3：画布 MVP
- Phase 3.5：Daily Workspace 按天工作区
- Phase 4：Todo 闭环

当前核心路由：

```txt
/          首页
/timeline  时间线页面，默认今天；支持 ?date=YYYY-MM-DD
/canvas    画布页面，默认今天；支持 ?date=YYYY-MM-DD
```

当前关键特征：

- `Card`、`Edge`、`TimelineNode` 已有 `dayId/date`
- `/timeline` 和 `/canvas` 使用 `useCurrentDay()` + `useDayWorkspace(date)`
- Todo 完成后会归档 / 隐藏，并生成 `source = "todo-card"` 的时间线节点
- 当前没有 React Router，`src/app/App.tsx` + `src/app/routes.tsx` 使用轻量 pathname 判断
- `src/layouts/` 目前基本为空，可用于本阶段布局外壳

---

## 1. 必须先阅读

请先阅读并遵守：

```txt
docs/architecture.md
docs/product-positioning.md
docs/project-structure-and-rules.md
docs/development-roadmap.md
docs/current-progress-summary.md
docs/daily-workspace-model.md
docs/paid-grade-uiux.md
docs/ui-style-concept.md

src/app/App.tsx
src/app/routes.tsx
src/pages/HomePage.tsx
src/pages/TimelinePage.tsx
src/pages/CanvasPage.tsx
src/features/day/hooks/useCurrentDay.ts
src/features/day/hooks/useDayWorkspace.ts
src/features/canvas/components/CanvasView.tsx
src/features/timeline/components/TimelineView.tsx
src/features/canvas/hooks/useCanvasActions.ts
src/features/timeline/hooks/useTimelineActions.ts
src/features/todo/services/todoService.ts
src/stores/uiStore.ts
src/utils/date.ts
src/utils/device.ts
```

硬规则：

- 不要重写数据层
- 不要破坏 Daily Workspace 模型
- 不要破坏 Phase 4 Todo 闭环
- 不要引入后端 / AI / 账号系统 / 同步系统
- 不要为了布局引入大型 UI 框架
- 不要把所有页面做成两套重复业务逻辑
- 桌面 / 移动可以有不同壳，但业务 hooks / services 尽量复用

---

## 2. 本阶段目标

实现以下能力：

1. 建立全局 AppShell
2. 建立桌面布局 DesktopLayout
3. 建立移动布局 MobileLayout
4. 根据 viewport / media query 自动选择布局策略
5. 桌面端保留完整工作台体验：画布 + 时间线入口清晰
6. 移动端提供更适合单手操作的快速入口：快速记录 Todo / 想法、查看今日时间线
7. 页面导航从散落的 header nav 收敛到统一 shell
8. 保持 `/timeline?date=...` 和 `/canvas?date=...` 可用
9. 移动端不要强迫用户进行复杂画布连线
10. `npm run build` 必须通过

---

## 3. 推荐新增 / 修改文件

### 3.1 Layouts

新增：

```txt
src/layouts/AppShell.tsx
src/layouts/DesktopLayout.tsx
src/layouts/MobileLayout.tsx
```

职责：

```txt
AppShell
- 判断当前 surface / path
- 读取当前日期
- 提供统一页面外壳
- 根据设备选择 DesktopLayout 或 MobileLayout

DesktopLayout
- 桌面端主导航
- 左侧 / 顶部品牌区
- 当前日期显示
- 时间线 / 画布 / 首页入口
- 主内容区域

MobileLayout
- 移动端顶部轻量标题
- 底部 Tab / 底部导航
- 快速捕捉入口
- 主内容区域
```

注意：

- Layout 只负责布局和导航，不直接操作 IndexedDB
- Layout 可以传入 `children`
- 不要把 TimelineView / CanvasView 业务塞进 layout

---

### 3.2 Device utils

检查 / 完善：

```txt
src/utils/device.ts
```

推荐提供：

```ts
export function isMobileViewport(width: number): boolean;
export function getViewportKind(width: number): "mobile" | "desktop";
```

可选新增 hook：

```txt
src/hooks/useViewportKind.ts
```

或：

```txt
src/utils/useViewportKind.ts
```

要求：

- 使用 `window.innerWidth` + `resize` 即可
- SSR 不需要复杂处理，因为当前是纯前端 Vite PWA
- breakpoint 推荐 `768px`

---

### 3.3 移动端快速捕捉

新增或调整：

```txt
src/features/capture/components/QuickCapture.tsx
src/features/capture/hooks/useQuickCapture.ts
```

如果不想新增 feature，也可以放在：

```txt
src/components/quick-capture/QuickCapture.tsx
```

但推荐 `features/capture/`，因为这是业务能力。

移动端 QuickCapture 最小能力：

- 输入一条内容
- 选择类型：`todo` / `thought`
- 默认归属今天的 DayWorkspace
- 创建后写入 card repository/service
- 创建成功后清空输入
- 给出轻量反馈

实现要求：

- 必须复用现有 `createCanvasCard(input, workspace)` 或 `createCard(input, workspace)`
- 不要直接访问 Dexie
- 不要复制一套 card 创建逻辑
- 默认位置可以使用简单规则，例如 `{ x: 80, y: 80 }` 或根据当天已有卡片数量偏移

推荐文案：

```txt
今天先抓住它。
```

---

## 4. 桌面端体验要求

桌面端重点是「工作台」。

推荐结构：

```txt
DesktopLayout
├─ 左侧 rail / 顶部 nav
│  ├─ Now 时间线
│  ├─ 今日日期
│  ├─ 首页
│  ├─ 时间线
│  └─ 画布
└─ main content
```

要求：

- `/canvas` 仍然是大画布优先
- `/timeline` 仍然是阅读 / 回顾优先
- 页面不再各自重复一套完整 header nav（可以保留页面标题，但导航应收敛）
- 桌面端可显示日期切换入口的预留 UI，但本阶段不必实现完整日历

可以做：

- 今日快捷按钮
- 时间线 / 画布切换按钮
- 当前日期 badge

不要做：

- 复杂 command palette
- 复杂多面板拖拽布局
- 分屏编辑器
- 高级日历 / 热力图

---

## 5. 移动端体验要求

移动端重点是「快速捕捉 + 查看」。

推荐结构：

```txt
MobileLayout
├─ 顶部：Now / 日期
├─ main content
├─ QuickCapture（首页或底部 sheet）
└─ 底部 Tab：时间线 / 捕捉 / 画布
```

移动端策略：

- 首页优先展示 QuickCapture + 今日入口
- 时间线页面可正常查看和创建节点
- 画布页面可以打开，但应弱化复杂连线操作提示
- 不要求移动端完成复杂拖拽/连线优化
- 不要让移动端 UI 横向溢出

底部导航至少包含：

```txt
今日
时间线
画布
```

可选包含：

```txt
捕捉
```

如果实现 BottomSheet：

```txt
src/components/ui/BottomSheet.tsx
```

要求：

- 不要引入 Radix / HeadlessUI 等新依赖，除非项目已存在
- 简单 CSS + React state 足够

---

## 6. 页面改造范围

需要修改：

```txt
src/app/App.tsx
src/app/routes.tsx
src/pages/HomePage.tsx
src/pages/TimelinePage.tsx
src/pages/CanvasPage.tsx
src/stores/uiStore.ts
src/styles/globals.css
src/styles/theme.css
```

重点：

- App 层接入 AppShell
- routes 仍保持轻量，不强制引入 React Router
- HomePage 拆成可被 shell 包裹的内容，不再独占整屏导航
- TimelinePage / CanvasPage 去掉重复的首页/页面切换 nav，交给 shell
- 保持原业务组件功能不变

---

## 7. uiStore 要求

检查并适度完善：

```txt
src/stores/uiStore.ts
```

可增加：

```ts
type ViewportKind = "mobile" | "desktop";
type ActiveSurface = "home" | "timeline" | "canvas" | "capture" | "reports" | "settings";
```

可存储：

```ts
viewportKind
isMobileNavOpen
isQuickCaptureOpen
feedback
```

注意：

- 不要把业务数据塞进 uiStore
- card/timeline 数据仍然归对应 store

---

## 8. 样式要求

本阶段需要让布局可靠，但不要进入 Phase 6 的精细动效大工程。

要求：

- `min-h-dvh` 正常
- 移动端底部导航不遮挡主要内容
- 桌面端 main content 有合理 max width / full width 策略
- canvas 在桌面端尽量吃满高度
- canvas 在移动端不横向炸裂
- 保留当前视觉语言：surface / ink / moss / ember / line / muted 等 token

可以新增少量 CSS utility。

不要：

- 大改主题色
- 大规模重做视觉系统
- 引入动画库
- 重写 Tailwind config 除非必要

---

## 9. 验收标准

完成后必须满足：

1. `npm run build` 成功
2. `/` 可打开
3. `/timeline` 可打开
4. `/canvas` 可打开
5. `/timeline?date=YYYY-MM-DD` 仍然按指定日期加载
6. `/canvas?date=YYYY-MM-DD` 仍然按指定日期加载
7. 桌面宽度下显示桌面工作台 layout
8. 移动宽度下显示移动 layout / 底部导航
9. 移动端可以快速创建 Todo 或 thought 卡片，并归属今天
10. Phase 4 Todo 完成闭环仍然可用
11. 刷新后数据仍然存在
12. 没有直接在组件里访问 Dexie / IndexedDB
13. 没有新增后端、AI、同步、账号系统
14. 没有引入大型 UI / 动画依赖

---

## 10. 禁止事项

- 不要重构整个应用路由系统
- 不要强行引入 React Router
- 不要重写 canvas / timeline 业务逻辑
- 不要破坏 Todo 完成闭环
- 不要破坏 Daily Workspace
- 不要做完整日历系统
- 不要做复杂手势系统
- 不要做原生 App 包装
- 不要实现 AI 报告
- 不要做后端同步

---

## 11. 交付格式

完成后请输出：

1. 修改 / 新增文件列表
2. 桌面 layout 实现说明
3. 移动 layout 实现说明
4. QuickCapture 实现说明
5. 如何保持 Daily Workspace / Todo 闭环不被破坏
6. `npm run build` 结果
7. 如果有 blocker，明确说明，不要编造成功
