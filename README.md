# Now 时间线

一个以 **时间线 + 思维画布** 为核心的个人 PWA 项目。

它不是传统 Todo，也不是传统日记，而是一个把“正在发生的生活”沉淀成可视化时间网格的个人系统。

## 当前定位

- 优先做成 PWA MVP，服务个人使用。
- 不走原生 App 首发，避免 App Store 上架和审核成本。
- 后续如果需要，可以再用 Capacitor / Tauri / Expo 等方式封装成 iOS / Android 可安装版本。

## 核心概念

- **时间线**：记录已经发生、完成、值得留下的节点。
- **思维画布**：承载想法、待办、计划、灵感和它们之间的关系。
- **Todo 卡片**：一种特殊画布卡片，完成后会转化为时间线节点。
- **普通思维卡片**：只作为想法节点存在，不带完成状态。

## MVP 目标

先做一个能用、能记录、能在 iOS Safari 添加到主屏幕的版本。

最小可用功能：

1. 时间线页面
   - 手动创建时间节点
   - 展示节点内容和时间
   - 支持简单编辑 / 删除

2. 思维画布页面
   - 创建卡片
   - 区分 Todo 卡片和普通卡片
   - 拖拽卡片位置
   - Todo 卡片完成后自动进入时间线

3. 本地优先
   - 初期可以使用 localStorage / IndexedDB
   - 后续再考虑同步、账号和后端

## 文档

- [设计灵感](./docs/design-inspiration.md)
- [架构草案](./docs/architecture.md)
- [作品定位与展示价值](./docs/product-positioning.md)
- [付费级 UI/UX 标准](./docs/paid-grade-uiux.md)
- [技术栈选择](./docs/tech-stack.md)
- [目录结构与修改规范](./docs/project-structure-and-rules.md)
- [开发阶段计划表](./docs/development-roadmap.md)
- [Codex 执行 Prompt：Phase 0 + Phase 1](./task/phase-0-1-codex-prompt.md)

## 开发命令

```bash
npm install
npm run dev
npm run build
npm run typecheck
```

## 当前阶段

已进入 Phase 0 + Phase 1：

- Phase 0：建立 Vite + React + TypeScript + Tailwind 的前端工程骨架。
- Phase 1：建立核心类型、Dexie / IndexedDB 数据层、repository 入口和分域 Zustand store。

当前页面只保留最小可运行首页，不提前实现完整时间线 UI、React Flow 画布、AI、后端或复杂 PWA 能力。

## 技术栈摘要

- Vite + React + TypeScript
- Tailwind CSS
- Zustand
- Dexie / IndexedDB
- 后续阶段预留 React Flow、Framer Motion、vite-plugin-pwa
