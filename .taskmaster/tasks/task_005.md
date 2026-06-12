# Task ID: 5

**Title:** 准备 sticky 背景图片的本地 asset 存储

**Status:** done

**Dependencies:** 4 ✓

**Priority:** medium

**Description:** 为图片型 sticky notes 建立本地资产基础，但不做裁剪/滤镜编辑。

**Details:**

决策是泛化现有 `themeAssets` 表/repository，还是引入中性的 asset model。现有 pattern 保存 Blob、mime type、name、size、createdAt、updatedAt。新增 card background/sticker asset kind 或等价中性模型。添加 service helper，把 image asset 解析为 object URL，并在不需要时释放 URL。只为 sticky cards 解析 `Card.style.backgroundImageId`。上传文件校验保持本地、简单。

**Test Strategy:**

运行 `npm run build`。上传/保存一个图片 asset，把它通过 `backgroundImageId` 关联到 sticky card，刷新后验证卡片背景可从 IndexedDB 恢复。

## Subtasks

### 5.1. 确定 asset 表策略

**Status:** done  
**Dependencies:** None  

为 card image assets 做一个小型架构决策。

**Details:**

优先复用现有 asset repository pattern，但如果会让 sticky card 与 timeline theme 命名强耦合，就引入更中性的类型。

### 5.2. 实现 card image asset 持久化

**Status:** done  
**Dependencies:** 5.1  

保存上传的本地图片 Blob，并返回可被 card style 引用的稳定 id。

**Details:**

校验图片 MIME type 和大小。不要添加云上传或外部存储。

### 5.3. 解析 sticky 背景图片

**Status:** done  
**Dependencies:** 5.2  

通过 `style.backgroundImageId` 渲染 sticky card 背景。

**Details:**

使用 object URL 并清理，避免内存泄漏。asset 缺失时优雅回退到非图片 variant。
