# Now 时间线：架构草案

## 1. 总体判断

Now 时间线建议采用：

> PWA 前端优先 + 本地数据库优先 + 可选后端同步 + 自定义 AI API

不要一开始就做重型后端。

这个项目首先是一个作品集级 PWA，不是复杂 SaaS。它需要的是可控、可迁移、可展示、可扩展，而不是一上来搞账号系统、团队协作、权限模型和多租户。

---

## 2. 推荐阶段

### Phase 1：纯本地 PWA MVP

目标：先把产品手感跑通。

包含：

- 时间线节点
- 画布卡片
- Todo 卡片完成后进入时间线
- IndexedDB 本地存储
- PWA manifest
- iOS Safari 添加到主屏幕

这一阶段不需要后端。

技术建议：

- 前端框架：React / Vue / Svelte 均可
- 本地数据库：IndexedDB + Dexie
- 状态管理：Zustand / Pinia / Svelte store
- 画布：React Flow / Vue Flow / 自研 canvas 层

### Phase 2：本地优先 + 备份 API

目标：数据不丢。

增加一个非常轻的后端，只负责：

- 接收本地导出的数据包
- 保存备份
- 返回备份列表
- 支持恢复

后端暂时不负责复杂业务逻辑。

推荐接口：

```txt
POST /api/backup/upload
GET  /api/backup/list
GET  /api/backup/:id
```

备份格式建议使用 JSON / SQLite dump / 压缩包。

### Phase 3：AI 分析 API

目标：让 AI 对时间线做阶段性总结。

AI 不应该直接散落在前端里。

建议走自定义 API：

```txt
POST /api/ai/report
GET  /api/reports
GET  /api/reports/:id
```

前端把需要总结的时间范围、本地节点数据、报告类型发送给自己的 API。

后端负责：

- 拼接上下文
- 调用模型
- 分批总结
- 存储报告
- 返回结果

### Phase 4：Agent / 定时任务

目标：自动生成周报、月报、年报。

可以在后端加定时任务：

- 每周生成周报
- 每月生成月报
- 每年生成年报
- 报告写入数据库
- 自动备份到服务器

这阶段才需要 Agent。

不要在 MVP 阶段就上 Agent。否则项目会被复杂度反噬。

---

## 3. AI 在项目里的位置

AI 是分析层，不是基础层。

基础层应该是稳定的数据系统：

- 卡片
- 时间节点
- 连接关系
- 报告
- 备份

AI 只读取这些数据，然后生成总结。

推荐报告类型：

```ts
type ReportType = "weekly" | "monthly" | "yearly" | "custom"
```

报告结构：

```ts
type Report = {
  id: string
  type: ReportType
  title: string
  content: string
  periodStart: string
  periodEnd: string
  createdAt: string
  sourceNodeIds: string[]
  model?: string
}
```

---

## 4. 是否需要后端？

结论：

- MVP：不需要。
- 备份：需要一个轻后端。
- AI 总结：建议需要后端。
- 自动 Agent：必须需要后端或常驻任务环境。

原因：

1. API Key 不应该放在前端。
2. AI 总结可能需要长任务、分批处理和重试。
3. 周报、月报、年报需要定时触发。
4. 备份需要稳定服务器存储。
5. 作品集级产品也需要展示可控的数据与扩展能力，而不是依赖第三方黑盒。

---

## 5. 数据模型草案

### Card

```ts
type Card = {
  id: string
  type: "thought" | "todo"
  content: string
  x: number
  y: number
  createdAt: string
  updatedAt: string
  completedAt?: string
  archivedAt?: string
}
```

### Edge

```ts
type Edge = {
  id: string
  fromCardId: string
  toCardId: string
  createdAt: string
}
```

### TimelineNode

```ts
type TimelineNode = {
  id: string
  content: string
  happenedAt: string
  createdAt: string
  source: "manual" | "todo-card" | "import" | "system"
  sourceCardId?: string
  tags?: string[]
}
```

### Report

```ts
type Report = {
  id: string
  type: "weekly" | "monthly" | "yearly" | "custom"
  title: string
  content: string
  periodStart: string
  periodEnd: string
  createdAt: string
  sourceNodeIds: string[]
}
```

---

## 6. UI / UX 架构判断

桌面端和移动端建议共享数据层，但使用不同布局。

不要强行一套 UI 横跨所有屏幕。

### 桌面端

桌面端可以做成沉浸式工作台：

- 全屏模式
- 大画布
- 无限缩放
- 拖拽卡片
- 连线
- 时间线可横向拉伸 / 缩放
- 类似 Mac 桌面空间

桌面端重点是空间感。

### 移动端

移动端不要照搬无限画布。

手机屏幕太小，硬塞大画布会变成灾难。

移动端建议：

- 以卡片流为主
- 画布缩略视图为辅
- 添加时间点用底部弹层
- 添加卡片用快速输入框
- 连接关系可以简化成“关联到某张卡片”
- 长按进入编辑 / 拖动模式

移动端重点是快速记录，不是复杂编排。

---

## 7. 动效建议

### 添加时间点

桌面：

- 点击时间线位置
- 出现一个轻量输入框
- 输入后节点从点击位置生长出来

移动：

- 点击悬浮按钮
- 底部 sheet 弹出
- 输入内容
- 提交后节点进入当天时间线

### 添加卡片

桌面：

- 双击画布空白处创建卡片
- 卡片从点击点浮现
- 支持拖动和连线

移动：

- 点击底部按钮创建
- 新卡片进入当前视图中心
- 长按拖动
- 连线用“选择关联对象”代替直接拉线

### Todo 完成

桌面 / 移动通用：

- 点击小圆圈
- 卡片轻微收缩
- 内容变淡
- 粒子 / 雾化 / 折叠消失
- 时间线生成对应节点

动效原则：短、轻、克制。

不要为了酷炫牺牲交互效率。

---

## 8. 推荐技术栈

一个相对稳的组合：

```txt
Frontend: Vite + React + TypeScript
Canvas: React Flow
State: Zustand
Local DB: Dexie / IndexedDB
PWA: Vite PWA Plugin
Backend: Node.js / Hono / Fastify
DB later: SQLite / Postgres
AI API: 自定义 /api/ai/report
Mobile wrapper later: Capacitor
```

如果想更轻，也可以：

```txt
Frontend: SvelteKit
Local DB: Dexie
Backend: SvelteKit server routes / Hono
```

---

## 9. 当前推荐路线

最稳路线：

1. 先做纯前端 PWA MVP。
2. 数据放 IndexedDB。
3. 把数据模型设计成未来可同步。
4. 第二阶段做自定义备份 API。
5. 第三阶段做 AI 报告 API。
6. 第四阶段再引入 Agent 自动定时总结。

一句话：

> 前端先跑通体验，后端只在“备份”和“AI”出现时介入。

