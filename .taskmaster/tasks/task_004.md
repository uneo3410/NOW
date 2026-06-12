# Task ID: 4

**Title:** 为 sticky 增加 variant 和颜色样式控制

**Status:** done

**Dependencies:** 3 ✓

**Priority:** medium

**Description:** 允许用户修改 sticky note 的视觉样式，但仍不引入图片 assets。

**Details:**

为选中的 sticky card 增加紧凑的样式编辑入口。可以放在 context menu、composer 或小型 selected-card panel，但必须符合现有 UI 密度。支持 `paper`、`glass`、`photo`、`tape` variant 和小色板。样式变更通过 card update service 持久化，并立即反映到 Zustand state。字体/边框/纹理保持克制，避免破坏现有视觉系统。

**Test Strategy:**

运行 `npm run build`。修改 sticky variant/color，刷新和切换日期后确认样式仍存在。验证 thought/todo 不显示无关 sticky 控件。

## Subtasks

### 4.1. 设计样式默认值和 class 映射

**Status:** done  
**Dependencies:** None  

为 sticky variant 和 color 定义稳定的视觉映射。

**Details:**

尽量用 TypeScript helper，而不是到处散落临时 class。保持卡片尺寸稳定、文本可读。

### 4.2. 实现 sticky 样式编辑器

**Status:** done  
**Dependencies:** 4.1  

为选中的 sticky card 增加 variant/color 更新控件。

**Details:**

使用熟悉控件，例如 segmented buttons 或色板。不要在应用内放大段功能说明文案。
