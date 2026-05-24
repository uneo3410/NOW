import type { TextareaHTMLAttributes } from "react";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className = "", ...props }: TextareaProps) {
  return (
    <textarea
      className={[
        "min-h-28 w-full resize-none rounded-3xl border border-line bg-white/70 px-4 py-3 text-base leading-7 text-ink outline-none transition placeholder:text-muted/70 focus:border-moss focus:bg-white focus:ring-4 focus:ring-moss/10",
        className,
      ].join(" ")}
      {...props}
    />
  );
}
