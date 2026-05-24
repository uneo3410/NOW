import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className = "", ...props }: InputProps) {
  return (
    <input
      className={[
        "min-h-11 w-full rounded-2xl border border-line bg-white/70 px-4 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-moss focus:bg-white focus:ring-4 focus:ring-moss/10",
        className,
      ].join(" ")}
      {...props}
    />
  );
}
