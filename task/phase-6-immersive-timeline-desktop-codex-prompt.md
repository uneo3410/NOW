# Codex Prompt：Phase 6 - Immersive Timeline Desktop UI/UX

你现在要在项目 `/home/sk/project/Now 时间线` 中继续实现 **Now 时间线 PWA**。

本任务只实现 **Phase 6 的第一段：桌面端沉浸式时间线页**。

核心目标：

> 把 `/timeline` 从普通列表页重做成全屏沉浸式时间线。用户点击时间线上的 Now Anchor，把“当下发生了什么”钉进时间线。

注意：本阶段暂时 **不考虑移动端**，只先在桌面端看整体效果。

---

## 0. 必须先阅读

请先阅读并遵守：

```txt
docs/immersive-timeline-uiux.md
docs/architecture.md
docs/product-positioning.md
docs/project-structure-and-rules.md
docs/development-roadmap.md
docs/current-progress-summary.md
docs/daily-workspace-model.md
docs/paid-grade-uiux.md
docs/ui-style-concept.md

src/pages/TimelinePage.tsx
src/features/timeline/components/TimelineView.tsx
src/features/timeline/components/TimelineCreateInput.tsx
src/features/timeline/components/TimelineNodeCard.tsx
src/features/timeline/hooks/useTimelineActions.ts
src/features/timeline/services/timelineService.ts
src/features/day/hooks/useCurrentDay.ts
src/features/day/hooks/useDayWorkspace.ts
src/stores/timelineStore.ts
src/stores/uiStore.ts
src/styles/globals.css
src/styles/theme.css
```

硬规则：

- 不要改 Dexie schema
- 不要破坏 Daily Workspace 的 `dayId/date`
- 不要破坏 Phase 4 Todo 闭环
- 不要重写 repository / service 主语义
- 不要实现移动端
- 不要实现画布页重做
- 不要引入大型 3D / 粒子库
- 不要做 AI、后端、同步、账号系统

---

## 1. 当前问题

当前 UI/UX 仍然像 MVP 页面：

- 普通 header
- 普通创建输入框
- 普通列表卡片
- 缺乏 Now 时间线的产品记忆点

本阶段要重做 `/timeline` 的第一眼和核心输入方式。

---

## 2. 目标体验

用户打开 `/timeline` 后：

1. 看到全屏深色 / 宇宙粒子感时间场
2. 看到一根独立时间线
3. 时间线上有一个闪烁的 `Now Anchor / 当下锚点`
4. 引导用户点击这个点
5. 点击后从锚点旁边浮出磨砂玻璃时间卡
6. 默认时间是当前时刻
7. 确认 / 继续后出现内容输入浮卡
8. 输入框文案是：`当下发生了什么？`
9. 保存后生成时间线节点
10. 新节点像被钉在线上一样出现

核心隐喻：

> 在时间线上点击当下，把这一刻钉住。

---

## 3. 需要新增 / 修改的文件

可以新增：

```txt
src/features/timeline/components/ImmersiveTimelineView.tsx
src/features/timeline/components/NowAnchor.tsx
src/features/timeline/components/GlassTimePicker.tsx
src/features/timeline/components/TimelineMomentComposer.tsx
src/features/timeline/components/ImmersiveTimelineNode.tsx
src/features/timeline/components/TimelineParticleField.tsx
src/components/navigation/BottomDock.tsx
```

也可以复用 / 改造现有：

```txt
src/features/timeline/components/TimelineView.tsx
src/features/timeline/components/TimelineCreateInput.tsx
src/features/timeline/components/TimelineNodeCard.tsx
src/pages/TimelinePage.tsx
src/styles/globals.css
src/styles/theme.css
```

推荐做法：

- 保留旧组件逻辑可参考，但 `/timeline` 页面切换到新的 immersive timeline 组件
- 业务创建 / 删除仍复用 `useTimelineActions` 和 `timelineService`
- UI 状态如 active node / composer open / selected time 可以放组件本地 state

---

## 4. TimelinePage 改造要求

`/timeline` 应成为全屏页面：

```txt
<main className="min-h-dvh overflow-hidden ...">
  <TimelineParticleField />
  <ImmersiveTimelineView workspace={workspace} />
  <BottomDock active="timeline" />
</main>
```

要求：

- 不再使用传统大 header + 创建表单 + 列表布局
- loading / error 状态也要保持沉浸式风格
- 保留 date query 支持：`/timeline?date=YYYY-MM-DD`
- 页面文案不要写“今天发生了什么”
- 正确文案：`当下发生了什么？`

---

## 5. Now Anchor

新增组件建议：

```txt
src/features/timeline/components/NowAnchor.tsx
```

职责：

- 显示时间线上的当下锚点
- 默认闪烁 / 脉冲
- hover 发光
- click 打开时间选择 / 输入流程

UI 要求：

- 光点在线上
- 有小光晕
- 附近有短提示：`点击当下，把这一刻钉住`
- 不要像普通 button

交互：

```ts
onClick={() => openComposerWithCurrentTime()}
```

---

## 6. Glass Time Picker

新增组件建议：

```txt
src/features/timeline/components/GlassTimePicker.tsx
```

职责：

- 显示当前选中的日期时间
- 默认值为当前时刻
- 允许轻量修改
- 磨砂玻璃风格
- 从 Now Anchor 旁边浮出，而不是居中 modal

最低实现：

- 使用 `datetime-local` input
- 视觉上包裹成 glass card
- 提供“继续”按钮

注意：

- 默认不是当天零点
- 必须包含小时分钟
- 选择结果传给 composer

---

## 7. Timeline Moment Composer

新增组件建议：

```txt
src/features/timeline/components/TimelineMomentComposer.tsx
```

职责：

- 输入当下内容
- 调用已有创建 action
- 保存后关闭
- 成功后触发节点生成反馈

文案：

```txt
当下发生了什么？
```

按钮文案：

```txt
钉入时间线
```

禁止文案：

```txt
今天发生了什么？
添加任务
新建事项
```

行为：

- 空内容不保存
- Enter 可保存，Shift+Enter 换行
- Esc 可关闭
- 保存失败显示错误，不要假装成功

---

## 8. 已有节点展示

新增组件建议：

```txt
src/features/timeline/components/ImmersiveTimelineNode.tsx
```

要求：

- 节点光点在线上
- 内容卡片浮在线侧
- 显示发生时间
- 可点击进入 active 状态
- active 后右上角出现小 `×`
- 点击 `×` 删除节点

布局：

- 桌面端优先左右交错
- 如果交错成本高，可以先统一右侧，但必须保留“挂在线上”的结构

删除交互：

```txt
点击卡片 → active → 右上角浮出 × → 点击删除
```

不要常驻删除按钮。

---

## 9. Timeline Particle Field

新增组件建议：

```txt
src/features/timeline/components/TimelineParticleField.tsx
```

目标：制造宇宙 / 粒子 / 时间场氛围。

实现建议：

- CSS gradient
- absolute 星点
- blur glow
- slow animation
- 不引入 three.js
- 不引入大型粒子库

性能要求：

- 轻量
- 不阻塞输入
- 不造成明显卡顿

---

## 10. Bottom Dock

新增组件建议：

```txt
src/components/navigation/BottomDock.tsx
```

本阶段 Dock 只做导航。

包含：

```txt
首页 / 时间线 / 画布
```

要求：

- 底部居中悬浮
- 毛玻璃
- 当前页面高亮
- 不放中央创建按钮
- 不抢 Now Anchor 的主视觉

---

## 11. 数据和业务要求

必须复用现有数据流：

- 加载节点：继续用 `useTimelineActions(workspace)` 或同等现有 hook
- 创建节点：继续走 `timelineService.createTimelineNode(...)`
- 删除节点：继续走已有 delete action / service
- `TimelineNode.dayId/date` 必须仍来自当前 `DayWorkspace`
- `happenedAt` 使用 GlassTimePicker 选出的时间

不要：

- 在组件里直接访问 Dexie
- 在 UI 层手写 repository 调用
- 复制一套 timeline 数据逻辑

---

## 12. 样式方向

关键词：

```txt
深色
星尘
微光
磨砂玻璃
漂浮
时间线独立存在
```

可以使用现有 token：

```txt
surface / ink / moss / ember / line / muted
```

也可以在 theme 中增加少量 timeline 专用 token。

注意：

- 这是桌面效果验证，优先大屏观感
- 不需要完美移动端
- 不要为了移动端牺牲桌面沉浸感

---

## 13. 验收标准

完成后必须满足：

1. `npm run build` 成功
2. `/timeline` 可打开
3. `/timeline?date=YYYY-MM-DD` 仍按指定日期加载
4. 第一眼是全屏沉浸式时间线，不是普通列表页
5. 页面有 Now Anchor，且可点击
6. 点击 Now Anchor 后出现磨砂玻璃时间选择
7. 默认时间是当前时刻
8. 输入文案是 `当下发生了什么？`
9. 保存后生成 timeline node
10. 新节点显示在线上 / 线旁，而不是普通列表追加
11. 点击已有节点卡片后才显示删除 `×`
12. 删除节点仍可用
13. Dock 只做导航，不作为主输入入口
14. 没有破坏 Daily Workspace
15. 没有破坏 Todo 完成后生成 timeline node 的能力
16. 没有实现移动端重做、画布重做、AI、后端、同步

---

## 14. 交付格式

完成后请输出：

1. 修改 / 新增文件列表
2. 沉浸式时间线实现说明
3. Now Anchor / Glass Time Picker / Composer 交互说明
4. 删除交互说明
5. 如何保持 Daily Workspace 正确
6. 如何确认 Todo 闭环未被破坏
7. `npm run build` 结果
8. 如果有 blocker，明确说明，不要编造成功
