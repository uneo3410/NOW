# Codex Prompt：Phase 0 + Phase 1

你现在要在项目 `/home/sk/project/Now 时间线` 中开始实现 Now 时间线 PWA。

先阅读这些文档，必须遵守：

- `docs/design-inspiration.md`
- `docs/architecture.md`
- `docs/product-positioning.md`
- `docs/paid-grade-uiux.md`
- `docs/tech-stack.md`
- `docs/project-structure-and-rules.md`
- `docs/development-roadmap.md`

当前任务：执行 **Phase 0 + Phase 1**，只做工程初始化和数据层，不要提前做 UI 大功能。

## 技术栈

- Vite + React + TypeScript
- Tailwind CSS
- Zustand
- Dexie / IndexedDB
- React Flow 后续阶段再接
- Framer Motion 后续阶段再接
- vite-plugin-pwa 后续阶段再完善

## 任务要求

### 1. 初始化前端工程

- 如果目录里还没有 `package.json`，就创建 Vite React TS 项目结构
- 配置 TypeScript
- 配置 Tailwind
- 保持目录结构符合 `docs/project-structure-and-rules.md`

### 2. 创建基础目录

```txt
src/app/
src/pages/
src/layouts/
src/components/ui/
src/components/motion/
src/features/timeline/
src/features/canvas/
src/features/cards/
src/features/todo/
src/features/reports/
src/features/settings/
src/stores/
src/db/repositories/
src/services/
src/types/
src/utils/
src/styles/
src/pwa/
```

### 3. 创建基础 App 骨架

- `src/app/App.tsx`
- `src/app/routes.tsx`
- `src/app/providers.tsx`
- `src/pages/HomePage.tsx`
- `src/styles/globals.css`
- `src/styles/theme.css`

### 4. 创建核心类型

- `src/features/cards/types.ts`
- `src/features/timeline/types.ts`
- `src/features/reports/types.ts`
- `src/types/common.ts`
- `src/types/id.ts`

核心类型必须包含：

- `Card`
- `Edge`
- `TimelineNode`
- `Report`
- `CreateCardInput`
- `CreateTimelineNodeInput`

### 5. 创建 Dexie 数据层

- `src/db/client.ts`
- `src/db/schema.ts`
- `src/db/repositories/cardRepository.ts`
- `src/db/repositories/edgeRepository.ts`
- `src/db/repositories/timelineRepository.ts`
- `src/db/repositories/reportRepository.ts`

数据表至少包含：

- `cards`
- `edges`
- `timelineNodes`
- `reports`

### 6. 创建 Zustand store

- `src/stores/cardStore.ts`
- `src/stores/edgeStore.ts`
- `src/stores/timelineStore.ts`
- `src/stores/canvasStore.ts`
- `src/stores/uiStore.ts`
- `src/stores/reportStore.ts`
- `src/stores/syncStore.ts`

注意：

- 不要做一个巨型 store。
- store 只负责状态和轻量 action。
- IndexedDB 访问必须通过 repository。
- 复杂业务流程后续放 service，不要写进组件。

### 7. 创建基础 utils

- `src/utils/id.ts`
- `src/utils/date.ts`
- `src/utils/device.ts`
- `src/utils/format.ts`

### 8. 创建最小可运行页面

- App 可以正常启动
- `HomePage` 显示项目名：`Now 时间线`
- 显示一句说明：`用卡片计划今天，用时间线保存发生过的事。`
- 不需要复杂 UI，但要保持干净、有作品感，不要后台管理系统风格。

### 9. 更新 README

- 增加开发启动命令
- 增加当前阶段说明
- 增加技术栈摘要

### 10. 最后运行

- `npm install`
- `npm run build`
- 如有 lint/typecheck 脚本，也运行

## 交付要求

- 给出修改文件列表
- 说明完成了 Phase 0 / Phase 1 的哪些内容
- 说明是否 build 成功
- 如果遇到问题，不要硬编，直接报告 blocker

## 禁止

- 不要现在实现完整时间线 UI
- 不要现在接 React Flow
- 不要现在做 AI
- 不要现在做后端
- 不要把业务逻辑写进组件
- 不要新增没有必要的依赖
