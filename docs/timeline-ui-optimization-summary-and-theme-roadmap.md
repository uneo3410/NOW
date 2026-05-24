# 时间线 UI 优化总结与主题自定义路线图

## Summary

本文档整理本轮窗口中已经完成的时间线 UI/UX 优化，以及下一阶段要重点打通的自定义主题能力。

当前时间线页面已经从“局部调样式”转为围绕原型 `example/timeline test.html` 的沉浸式时间线体验：光柱、节点卡片、Now 输入区、背景粒子、移动端/PWA 适配、交互动效都已经形成稳定基础。后续重点不再继续散改视觉，而是把这些视觉能力抽象成主题配置，通过设置页统一管理。

## 已完成的 UI/UX 优化

### 原型视觉迁移

- 时间线页面按原型结构重建：背景层、粒子层、主画布、缩放容器、时间轴、节点卡片、Now 输入条分层清晰。
- 光柱恢复为原型方向的细 cyan 主线，避免宽蓝柱、白线叠加、重复光束等问题。
- Now 圆点重新对齐光柱中心，普通节点圆点与光柱共用同一条视觉中线。
- 时间卡片采用毛玻璃质感，提升背景分离度和正文可读性。

### 时间轴布局与交互

- 时间节点按发生时间从新到旧排序，最新卡片始终在最上方。
- 以 Now 锚点为原点，卡片只向上等距延伸，不再向下撞进 Now 输入区。
- 卡片间距多轮拉大，目前整体更舒展。
- 光柱会根据最高卡片动态向上延伸，避免节点增加后只有光点、没有时间线延展。
- Now 圆点支持点击展开/收起输入条；输入条默认展开，创建后保持展开。
- Now 输入条展开时，上方卡片整体留出空间并平滑位移。

### 光柱、流光与节点联动

- 光柱保留 1px 清晰主线，并加入上下柔光段。
- 增加焦点流光：桌面跟随光标位置，移动端默认跟随视觉中心，触摸时短暂跟随触点。
- 修复流光中的白点/蓝点重叠 bug，当前流光为单一连续白色核心，cyan 只作为极淡外晕。
- 光线扫过节点位置时，节点光点会同步放大、增强阴影，形成呼吸感。
- 新增“光环层”：每个光点外都有贴边白色描边光环，随光点自动缩放，颜色和外晕可配置。

### 背景与粒子

- 移除大面积背景柔光、白色蒙层和脏感模糊层，默认背景恢复为干净浅色底色。
- 背景粒子改为常驻粒子场：粒子在背景层慢速漂浮、轻微呼吸。
- 光标或触摸划过时，附近已有粒子被向外拨开，再慢慢回到漂浮状态，形成类似水面扰动的流动感。
- 粒子 canvas 已放在壁纸之上、时间线内容之下，不遮挡卡片和操作控件。
- 粒子数量按屏幕面积动态计算，并限制上限，兼顾桌面与移动端性能。

### PWA 与移动端

- 已接入 PWA 基础能力：manifest、service worker、图标、移动端 meta。
- 时间线移动端隐藏干扰导航，适配安全区域，便于作为独立 PWA 页面测试。
- 页面默认禁止整体复制，输入框和文本编辑区域仍允许正常输入与选择。

## 当前视觉层级

从底到顶：

1. Wallpaper layer：默认浅色背景或未来自定义壁纸。
2. Background particle canvas：慢速漂浮粒子，支持光标/触摸扰动。
3. Timeline canvas：时间线缩放/拖拽画布。
4. Beam layer：光柱主线、柔光段、流光焦点。
5. Node layer：节点光点、光环层、时间卡片。
6. Now input layer：Now 圆点、输入条、时间选择、错误提示。
7. Controls layer：右下角缩放控件。

## 已预留的主题接口方向

已有独立草案：`docs/custom-timeline-theme-plan.md`。

当前代码里已经出现的可主题化入口：

- `TimelineWallpaperConfig`：壁纸类型、图片 URL、blur、dim。
- `TimelineHaloConfig`：光环颜色、光晕颜色、透明度。
- 背景粒子逻辑：已具备 density/count 抽象条件，后续可转为主题参数。

## 下一阶段重点：打通自定义主题

### 目标

把当前散落在组件和 CSS 里的视觉参数抽成一份 `TimelineThemeConfig`，由设置页管理、持久化，并在时间线页面运行时消费。

### 建议主题结构

```ts
type TimelineThemeConfig = {
  id: string;
  name: string;
  wallpaper: TimelineWallpaperConfig;
  particles: TimelineParticleTheme;
  beam: TimelineBeamTheme;
  halo: TimelineHaloConfig;
  card: TimelineCardTheme;
  cursor?: TimelineCursorTheme;
};
```

### 需要支持的能力

- 壁纸：默认背景、自定义上传图片、图片预览、blur/dim 可调，但默认不叠加蒙层。
- 粒子：数量/密度、颜色、透明度、大小范围、漂浮速度、呼吸幅度、光标斥力半径和强度。
- 光柱：主线颜色、柔光颜色、流光强度、焦点范围。
- 光环层：描边颜色、描边粗细、外晕颜色、外晕强度、呼吸联动强度。
- 卡片：背景透明度、玻璃模糊、边框、阴影、圆角、正文颜色安全范围。
- 光标：自定义上传光标图案、尺寸、热点位置。

## 实施路线

### Phase 1: 抽离主题类型

- 新增 `src/features/timeline/theme/types.ts`。
- 将 `TimelineWallpaperConfig`、`TimelineHaloConfig`、粒子主题、光柱主题、卡片主题集中到类型文件。
- 新增 `src/features/timeline/theme/defaultTheme.ts`，把当前视觉参数沉淀成 `defaultTimelineTheme`。

### Phase 2: TimelineView 消费统一主题

- 将 `TimelineView` props 从分散的 `wallpaperConfig`、`haloConfig` 过渡为 `themeConfig?: TimelineThemeConfig`。
- 保留兼容层，避免一次性改动过大。
- 粒子 canvas 从硬编码数量、颜色、速度改为读取 `themeConfig.particles`。

### Phase 3: 设置页与预览

- 增加主题设置入口。
- 支持实时预览，但保存前不写入持久化。
- 上传壁纸和光标时使用 object URL 预览，确认后再保存。
- 提供“恢复默认主题”操作。

### Phase 4: 持久化

- 设计 settings store 或 Dexie settings table。
- 保存用户当前主题 ID 和自定义主题配置。
- 图片资产需要明确存储策略：IndexedDB Blob、本地文件引用或后续同步方案。

### Phase 5: 性能与移动端边界

- 粒子数量需要设置移动端上限。
- blur、shadow、backdrop-filter 要设置最大值，避免 PWA 卡顿。
- 主题编辑页需要给出可读性保护：卡片文字对比度不足时提示或自动纠偏。

## 近期优先级

1. 抽出 `TimelineThemeConfig` 和 `defaultTimelineTheme`。
2. 让背景粒子数量接入 `particles.density`。
3. 让光环层接入 `halo.strokeWidth`、`halo.color`、`halo.glowColor`。
4. 新增设置页的主题预览骨架。
5. 再接壁纸上传和光标上传。

## 验收标准

- 默认主题保持当前时间线视觉，不回退到脏背景或宽光柱。
- 切换粒子密度后，背景粒子数量即时变化，移动端不卡顿。
- 调整光环颜色和粗细后，所有普通节点和 Now 节点同步变化。
- 壁纸上传只影响 Wallpaper layer，不破坏粒子、光柱和卡片层级。
- 主题设置保存后刷新页面仍能恢复。
