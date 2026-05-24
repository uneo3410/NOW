# 自定义时间线主题接口计划

## Summary

自定义主题只作为后续设置页的接口设计，本阶段不实现上传入口、设置 UI、数据库持久化或运行时编辑器。

目标是把时间线视觉拆成可组合的主题层：壁纸、柔光、模糊、光柱、光标、卡片、背景粒子。设置页以后只需要产出一份主题配置，时间线页面消费这份配置即可。

## Theme Config Draft

```ts
type TimelineThemeConfig = {
  id: string;
  name: string;
  wallpaper: TimelineWallpaperConfig;
  cursor?: TimelineCursorConfig;
  card?: TimelineCardStyleConfig;
  particles?: TimelineParticleStyleConfig;
  beam?: TimelineBeamStyleConfig;
  depth?: TimelineDepthStyleConfig;
};

type TimelineWallpaperConfig = {
  type: "default" | "image";
  imageUrl?: string;
  blur?: number;
  dim?: number;
};

type TimelineCursorConfig = {
  type: "default" | "image";
  imageUrl?: string;
  size?: number;
  hotspot?: { x: number; y: number };
};

type TimelineCardStyleConfig = {
  background?: string;
  border?: string;
  blur?: number;
  radius?: number;
  shadow?: string;
  textColor?: string;
};

type TimelineParticleStyleConfig = {
  enabled: boolean;
  density: number;
  color: string;
  glow: number;
  speed: number;
  sizeRange: [number, number];
};

type TimelineBeamStyleConfig = {
  color: string;
  glowColor: string;
  glowIntensity: number;
  focusGap: number;
};

type TimelineDepthStyleConfig = {
  enabled: boolean;
  blur: number;
  focusRange: number;
  dim: number;
};
```

## Layer Ownership

1. Wallpaper layer: 只负责默认背景或用户壁纸图片。
2. Background particle layer: 只负责壁纸上方、模糊层下方的慢速漂浮粒子。
3. Blur and dim layer: 只负责统一调光、背景模糊、壁纸可读性。
4. Interaction particle layer: 保留当前光标/触摸拖尾粒子。
5. Beam layer: 光柱主线、流光、焦点柔光、节点呼吸联动。
6. Content layer: 时间卡片、Now 输入条、编辑删除控件。

## Implementation Phases

1. Extract theme types into `src/features/timeline/theme/types.ts`.
2. Move current default wallpaper、beam、card、particle 参数到 `defaultTimelineTheme`。
3. Let `TimelineView` consume `themeConfig?: TimelineThemeConfig` instead of scattered props.
4. Add settings page integration later: upload cursor, upload wallpaper, tune particles and card style.
5. Add persistence later through Dexie settings table or app-level settings store.

## Constraints

- 上传图片必须生成 object URL preview，确认后再持久化。
- 移动端优先限制粒子 density、blur、glow 上限，避免 PWA 卡顿。
- 卡片透明度和文字对比需要设置安全边界，不能允许主题把正文变得不可读。
- 光柱主线始终保持 1px 清晰线，主题只调整颜色、柔光和流光，不允许变成宽色块。
