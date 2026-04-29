# Now 时间线：开发阶段计划表

## 1. 目标

这份计划用于指导 Now 时间线从 0 到可展示 MVP 的开发。

每个阶段都要明确：

- 本阶段做什么
- 修改哪些目录
- 大致新增哪些文件
- 阶段收益是什么
- 不做什么，避免范围失控

原则：

> 先立骨架，再做核心闭环，再打磨作品集级体验。

---

## 2. 阶段总览

| 阶段 | 名称 | 目标 | 主要收益 |
|---|---|---|---|
| Phase 0 | 项目初始化 | 建立工程骨架和基础规范 | 后续 vibeCoding 不乱飞 |
| Phase 1 | 数据层与本地存储 | 建立核心数据模型和 IndexedDB | 数据可持久化，架构稳定 |
| Phase 2 | 时间线 MVP | 完成时间节点创建、展示、编辑 | 第一个可用页面成立 |
| Phase 3 | 画布 MVP | 完成卡片创建、拖拽、连线 | 核心空间交互成立 |
| Phase 4 | Todo 闭环 | Todo 完成后生成时间线节点 | 产品差异点成立 |
| Phase 5 | 桌面 / 移动双布局 | 分离桌面工作台和移动捕捉体验 | PWA 体验接近真实产品 |
| Phase 6 | 作品级 UI/UX 打磨 | 动效、空状态、视觉系统、细节 | 看起来像成品，不像 demo |
| Phase 7 | 导入导出与备份预留 | 支持数据迁移和未来备份 API | 项目可长期使用，可扩展 |
| Phase 8 | AI 回顾预留 | 预留报告模型和自定义 API 设置 | 后续 AI 功能不割裂 |
| Phase 9 | PWA 发布准备 | manifest、离线缓存、安装体验 | 可展示、可安装、可分享 |

---

## 3. Phase 0：项目初始化

### 目标

建立 Vite + React + TypeScript 项目，配置基础工具链和目录结构。

### 修改目录

```txt
/
  package.json
  vite.config.ts
  tsconfig.json
  tailwind.config.ts
  postcss.config.js
  index.html

src/
  app/
  pages/
  layouts/
  components/
  features/
  stores/
  db/
  services/
  types/
  utils/
  styles/
  pwa/
```

### 新增文件

```txt
src/app/App.tsx
src/app/routes.tsx
src/app/providers.tsx
src/styles/globals.css
src/styles/theme.css
src/types/common.ts
src/types/id.ts
src/utils/id.ts
src/utils/date.ts
```

### 阶段收益

- 工程可以启动。
- 目录边界先定下来。
- 后续 AI 编程有固定落点。
- 避免第一天就把代码写散。

### 暂不做

- 不做复杂 UI。
- 不接数据库。
- 不做 AI。
- 不做后端。

---

## 4. Phase 1：数据层与本地存储

### 目标

建立核心数据模型，接入 Dexie / IndexedDB。

### 修改目录

```txt
src/db/
src/features/cards/
src/features/timeline/
src/features/reports/
src/stores/
```

### 新增文件

```txt
src/db/client.ts
src/db/schema.ts
src/db/repositories/cardRepository.ts
src/db/repositories/edgeRepository.ts
src/db/repositories/timelineRepository.ts
src/db/repositories/reportRepository.ts

src/features/cards/types.ts
src/features/timeline/types.ts
src/features/reports/types.ts

src/stores/cardStore.ts
src/stores/edgeStore.ts
src/stores/timelineStore.ts
```

### 核心模型

```txt
Card
Edge
TimelineNode
Report
```

### 阶段收益

- 数据可以本地持久化。
- 后续 UI 不会依赖假数据。
- 为导入导出、AI 报告、备份留下结构。

### 暂不做

- 不做同步。
- 不做复杂 migration。
- 不做 AI 报告生成。

---

## 5. Phase 2：时间线 MVP

### 目标

先做出第一个完整可用页面：时间线。

### 功能

- 展示时间线节点
- 点击 / 按钮创建时间节点
- 编辑节点内容
- 删除节点
- 按时间排序
- 空状态设计

### 修改目录

```txt
src/pages/
src/features/timeline/
src/components/ui/
src/stores/
```

### 新增文件

```txt
src/pages/TimelinePage.tsx
src/features/timeline/components/TimelineView.tsx
src/features/timeline/components/TimelineNodeCard.tsx
src/features/timeline/components/TimelineCreateInput.tsx
src/features/timeline/hooks/useTimelineActions.ts
src/features/timeline/services/timelineService.ts

src/components/ui/Button.tsx
src/components/ui/Input.tsx
src/components/ui/Textarea.tsx
src/components/ui/EmptyState.tsx
```

### 阶段收益

- 产品的“记录已经发生的事”能力成立。
- 项目不再只是架构空壳。
- 可开始测试视觉气质。

### 暂不做

- 不做 AI 总结。
- 不做时间线复杂缩放。
- 不做高级筛选。

---

## 6. Phase 3：画布 MVP

### 目标

接入 React Flow，完成卡片画布基础能力。

### 功能

- 创建普通思维卡片
- 创建 Todo 卡片
- 拖拽卡片
- 缩放画布
- 连接卡片
- 保存卡片位置和连线

### 修改目录

```txt
src/pages/
src/features/canvas/
src/features/cards/
src/stores/
src/db/repositories/
```

### 新增文件

```txt
src/pages/CanvasPage.tsx

src/features/canvas/components/CanvasView.tsx
src/features/canvas/components/CanvasToolbar.tsx
src/features/canvas/components/CardNode.tsx
src/features/canvas/components/ThoughtCardNode.tsx
src/features/canvas/components/TodoCardNode.tsx
src/features/canvas/hooks/useCanvasActions.ts
src/features/canvas/services/canvasService.ts
src/features/canvas/types.ts

src/features/cards/components/CardEditor.tsx
src/features/cards/components/CardTypeToggle.tsx
src/features/cards/services/cardService.ts

src/stores/canvasStore.ts
```

### 阶段收益

- 项目的“空间感”成立。
- 作品区别于普通 Todo / 日记。
- 可以开始打磨桌面端核心体验。

### 暂不做

- 不做复杂多选。
- 不做无限高级画布能力。
- 不做移动端复杂拉线。

---

## 7. Phase 4：Todo 闭环

### 目标

完成 Now 时间线最关键的产品闭环：Todo 卡片完成后转为时间线节点。

### 功能

- Todo 卡片显示完成圆圈
- 点击完成
- 写入 completedAt
- 创建 TimelineNode
- 卡片从画布消散 / 归档
- 时间线出现对应节点

### 修改目录

```txt
src/features/todo/
src/features/canvas/
src/features/timeline/
src/stores/
src/db/repositories/
```

### 新增文件

```txt
src/features/todo/services/todoService.ts
src/features/todo/animations/completeTodoAnimation.ts
```

### 统一入口

```ts
completeTodoCard(cardId: string): Promise<void>
```

### 阶段收益

- 产品差异点成立。
- “做完的事情不会消失，而是沉淀进时间线”这个核心概念可以被演示。
- 这是作品集中最值得展示的交互之一。

### 暂不做

- 不做复杂奖励系统。
- 不做完成率统计。
- 不做 KPI 化设计。

---

## 8. Phase 5：桌面 / 移动双布局

### 目标

建立桌面端和移动端不同的体验策略。

### 桌面端

- 全屏工作台
- 左 / 右 / 底部工具区
- 大画布
- 横向或可缩放时间线
- 快捷创建

### 移动端

- 快速记录
- 卡片流
- 底部 Sheet
- 单手操作
- 少复杂连线

### 修改目录

```txt
src/layouts/
src/pages/
src/components/ui/
src/utils/
src/stores/uiStore.ts
```

### 新增文件

```txt
src/layouts/AppShell.tsx
src/layouts/DesktopLayout.tsx
src/layouts/MobileLayout.tsx
src/utils/device.ts
src/stores/uiStore.ts
src/components/ui/BottomSheet.tsx
src/components/ui/Modal.tsx
```

### 阶段收益

- PWA 更接近真实产品。
- 避免手机端硬塞桌面画布。
- 展示响应式设计能力。

### 暂不做

- 不做所有页面完全双套。
- 不做复杂手势系统。
- 不做原生 App 包装。

---

## 9. Phase 6：作品级 UI/UX 打磨

### 目标

把 MVP 从“能用”打磨到“像成品”。

### 功能 / 任务

- 视觉主题
- 字体、色彩、阴影、圆角规范
- 空状态
- 卡片出现动效
- Todo 完成动效
- 时间线节点生成动效
- 页面切换动效
- 图标系统
- 桌面端空间感
- 移动端底部交互手感

### 修改目录

```txt
src/styles/
src/components/ui/
src/components/motion/
src/features/todo/animations/
src/features/timeline/components/
src/features/canvas/components/
```

### 新增文件

```txt
src/components/motion/FadeIn.tsx
src/components/motion/ScaleIn.tsx
src/components/motion/Presence.tsx
src/styles/theme.css
```

### 阶段收益

- 项目从 demo 变成作品。
- 形成求职展示价值。
- UI/UX 成为项目记忆点。

### 暂不做

- 不为了酷炫堆过度动画。
- 不引入复杂 3D。
- 不牺牲交互效率。

---

## 10. Phase 7：导入导出与备份预留

### 目标

保证数据可迁移，为未来服务器备份预留接口。

### 功能

- 导出 JSON
- 导入 JSON
- 数据版本号
- 备份 API service 空实现 / mock
- 设置页入口

### 修改目录

```txt
src/services/
src/features/settings/
src/stores/syncStore.ts
src/db/
```

### 新增文件

```txt
src/services/exportService.ts
src/services/importService.ts
src/services/backupService.ts
src/stores/syncStore.ts
src/features/settings/components/BackupSettings.tsx
```

### 阶段收益

- 数据不被锁死。
- 未来接服务器备份更自然。
- 开源 / 展示时更完整。

### 暂不做

- 不做真实用户账号。
- 不做云同步冲突解决。
- 不做多人协作。

---

## 11. Phase 8：AI 回顾预留

### 目标

预留 AI 报告结构，但不让 AI 抢主线。

### 功能

- Report 数据模型
- 报告列表页面
- 报告详情页
- 自定义 AI Provider 设置入口
- AI service 接口定义
- 可先使用 mock 生成

### 修改目录

```txt
src/features/reports/
src/features/settings/
src/services/
src/stores/reportStore.ts
```

### 新增文件

```txt
src/pages/ReviewPage.tsx
src/features/reports/components/ReportList.tsx
src/features/reports/components/ReportViewer.tsx
src/features/reports/services/reportService.ts
src/features/settings/components/AiProviderSettings.tsx
src/services/aiService.ts
src/stores/reportStore.ts
```

### 阶段收益

- 展示项目扩展能力。
- 未来可以自然接入周报 / 月报 / 年报。
- 自定义 API 不会割裂主产品。

### 暂不做

- 不直接暴露复杂 Token 配置在首页。
- 不做自动 Agent。
- 不做真实付费系统。

---

## 12. Phase 9：PWA 发布准备

### 目标

让项目可以被安装、展示、分享。

### 功能

- manifest
- app icons
- service worker
- 离线缓存
- iOS 添加到主屏幕优化
- 基础 SEO / meta
- README 展示说明
- 截图 / 演示 GIF

### 修改目录

```txt
public/
src/pwa/
docs/
README.md
```

### 新增文件

```txt
public/manifest.webmanifest
public/icons/icon-192.png
public/icons/icon-512.png
src/pwa/registerServiceWorker.ts
```

### 阶段收益

- 项目可以作为完整作品展示。
- 可部署到 Vercel / Netlify / 自己服务器。
- 可被添加到 iOS 主屏幕。

### 暂不做

- 不上 App Store。
- 不做 Capacitor 包装。
- 不做复杂后端部署。

---

## 13. 后续增强阶段

MVP 完成后再考虑：

| 增强方向 | 内容 |
|---|---|
| 后端备份 | Hono / Fastify + SQLite / Postgres |
| AI 总结 | 自定义 API、周报、月报、年报 |
| 自动任务 | 定时生成报告 |
| 多端同步 | 账号、冲突解决、增量同步 |
| 原生包装 | Capacitor 打包 iOS / Android |
| 开源完善 | 文档、贡献指南、示例数据 |

---

## 14. 推荐实际开发顺序

如果只做一个最小可展示版本，顺序可以压缩为：

```txt
Phase 0 项目初始化
Phase 1 数据层
Phase 2 时间线 MVP
Phase 3 画布 MVP
Phase 4 Todo 闭环
Phase 6 UI/UX 打磨
Phase 9 PWA 发布
```

Phase 5、7、8 可以根据精力后置。

---

## 15. 一句话路线

> 先做出能展示的核心闭环，再补移动适配、导入导出、AI 预留和 PWA 发布体验。

不要一上来做全宇宙。

Now 时间线的第一胜利条件是：

> 用户能创建卡片，完成它，然后看到它成为时间线的一部分。
