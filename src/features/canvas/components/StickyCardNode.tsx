import { useEffect, useState, type CSSProperties } from "react";
import type { Card, CardStyleVariant } from "../../cards/types";
import { createCardAssetObjectUrl } from "../../cards/services/cardAssetService";
import {
  getStickyImageFilterValue,
  resolveStickyCardStyle,
  resolveStickyImageStyle,
} from "./stickyCardStyles";

type StickyCardNodeProps = {
  card: Card;
};

const variantClassName: Record<CardStyleVariant, string> = {
  paper: "border-[#e5cf62] bg-[#fff2a8] text-[#26210f] shadow-[0_18px_34px_rgba(107,91,25,0.18)]",
  glass: "border-white/70 bg-white/[0.58] text-ink shadow-glass backdrop-blur-[22px]",
  photo: "border-white bg-white text-ink shadow-[0_18px_36px_rgba(25,28,30,0.16)]",
  tape: "border-[#c7d6ef] bg-[#eef5ff] text-[#172233] shadow-[0_18px_34px_rgba(28,65,108,0.14)]",
};

export function StickyCardNode({ card }: StickyCardNodeProps) {
  const cardStyle = resolveStickyCardStyle(card.style);
  const imageStyle = resolveStickyImageStyle(cardStyle.image);
  const variant = cardStyle.variant;
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const style = {
    backgroundColor: cardStyle.color,
  } satisfies CSSProperties;

  useEffect(() => {
    let objectUrl: string | null = null;
    let isMounted = true;

    async function loadImage() {
      if (!cardStyle.backgroundImageId) {
        setImageUrl(null);
        return;
      }

      objectUrl = await createCardAssetObjectUrl(cardStyle.backgroundImageId);

      if (!isMounted && objectUrl) {
        URL.revokeObjectURL(objectUrl);
        return;
      }

      if (isMounted) {
        setImageUrl(objectUrl);
      }
    }

    void loadImage();

    return () => {
      isMounted = false;

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [cardStyle.backgroundImageId]);

  return (
    <div
      className={[
        "relative min-h-40 overflow-hidden rounded-[1.1rem] border p-4 transition",
        variantClassName[variant],
      ].join(" ")}
      style={style}
    >
      {imageUrl ? (
        <img
          aria-hidden="true"
          className="absolute inset-0 size-full object-cover opacity-55"
          draggable={false}
          src={imageUrl}
          style={{
            filter: getStickyImageFilterValue(imageStyle.filter),
            objectPosition: `${imageStyle.x}% ${imageStyle.y}%`,
            transform: `scale(${imageStyle.scale}) rotate(${imageStyle.rotate}deg)`,
          }}
        />
      ) : null}
      {imageUrl ? <div aria-hidden="true" className="absolute inset-0 bg-white/45" /> : null}
      {variant === "tape" ? (
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-2 h-5 w-24 -translate-x-1/2 -rotate-2 rounded-[3px] bg-white/[0.58] shadow-[0_3px_12px_rgba(70,88,120,0.14)]"
        />
      ) : null}
      {variant === "photo" ? (
        <div aria-hidden="true" className="mb-3 h-1.5 rounded-full bg-primary-soft" />
      ) : null}
      <div
        className={[
          "relative",
          imageUrl ? "rounded-xl bg-white/[0.74] p-3 shadow-sm" : "",
        ].join(" ")}
      >
        <div className="mb-3 flex items-center justify-between gap-3 text-[11px] font-semibold uppercase text-ink/60">
          <span>Sticky</span>
          <span className="material-symbols-outlined text-[16px] leading-none opacity-60">
            sticky_note_2
          </span>
        </div>
        <p className="line-clamp-7 whitespace-pre-wrap break-words text-sm leading-6">
          {card.content}
        </p>
      </div>
    </div>
  );
}
