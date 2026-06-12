import type { CardImageFilter, CardImageStyle, CardStyle, CardStyleVariant } from "../../cards/types";

export type StickyCardVariantOption = {
  icon: string;
  label: string;
  value: CardStyleVariant;
};

export type StickyCardColorOption = {
  label: string;
  value?: string;
};

export type StickyCardImageFilterOption = {
  label: string;
  value: CardImageFilter;
};

export const DEFAULT_STICKY_CARD_STYLE: CardStyle = {
  variant: "paper",
};

export const DEFAULT_STICKY_IMAGE_STYLE: Required<CardImageStyle> = {
  filter: "none",
  rotate: 0,
  scale: 1,
  x: 50,
  y: 50,
};

export const STICKY_CARD_VARIANTS: StickyCardVariantOption[] = [
  { icon: "article", label: "纸张", value: "paper" },
  { icon: "blur_on", label: "玻璃", value: "glass" },
  { icon: "photo_camera", label: "相片", value: "photo" },
  { icon: "texture", label: "胶带", value: "tape" },
];

export const STICKY_CARD_COLORS: StickyCardColorOption[] = [
  { label: "默认" },
  { label: "柠檬", value: "#fff2a8" },
  { label: "薄荷", value: "#d7f8df" },
  { label: "湖蓝", value: "#dcecff" },
  { label: "珊瑚", value: "#ffd8c9" },
  { label: "紫雾", value: "#ece1ff" },
];

export const STICKY_IMAGE_FILTERS: StickyCardImageFilterOption[] = [
  { label: "原图", value: "none" },
  { label: "柔和", value: "soft" },
  { label: "黑白", value: "mono" },
  { label: "暖调", value: "warm" },
];

export function resolveStickyCardStyle(style?: CardStyle): CardStyle {
  return {
    ...DEFAULT_STICKY_CARD_STYLE,
    ...style,
    variant: style?.variant ?? DEFAULT_STICKY_CARD_STYLE.variant,
  };
}

export function resolveStickyImageStyle(style?: CardImageStyle): Required<CardImageStyle> {
  return {
    ...DEFAULT_STICKY_IMAGE_STYLE,
    ...style,
    filter: style?.filter ?? DEFAULT_STICKY_IMAGE_STYLE.filter,
  };
}

export function getStickyImageFilterValue(filter: CardImageFilter): string {
  if (filter === "soft") {
    return "saturate(1.08) contrast(0.95) brightness(1.05)";
  }

  if (filter === "mono") {
    return "grayscale(1) contrast(1.05)";
  }

  if (filter === "warm") {
    return "sepia(0.24) saturate(1.16) brightness(1.03)";
  }

  return "none";
}
