# Task ID: 6

**Title:** 增加轻量 sticky 图片编辑控制

**Status:** done

**Dependencies:** 5 ✓

**Priority:** low

**Description:** 在图片上传稳定后，为 sticky cards 增加简单、非破坏性的图片调整元数据。

**Details:**

只做 MVP 图片控制：crop/position、scale、rotation、简单滤镜 preset。调整元数据存到 `Card.style` 或嵌套 image style 对象中。避免图层、mask、自由绘制、多对象选择，以及任何会变成完整图片编辑器的能力。UI 应该是 card-specific compact panel，不是通用设计工具。

**Test Strategy:**

运行 `npm run build`。给 sticky card 分配已上传图片，调整 crop/scale/rotation/filter，刷新后确认元数据持久化且渲染稳定。

## Subtasks

### 6.1. 定义图片调整元数据

**Status:** done  
**Dependencies:** None  

为简单 sticky 图片变换增加类型化元数据。

**Details:**

模型要小、可序列化。优先使用非破坏性的 CSS transform。

### 6.2. 实现紧凑图片调整控件

**Status:** done  
**Dependencies:** 6.1  

增加 crop/position、scale、rotate、filter preset 控件。

**Details:**

使用简单 slider/select/button。不要引入完整 canvas editor。
