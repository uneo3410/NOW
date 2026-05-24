import type { ButtonHTMLAttributes } from "react";

type IconButtonVariant = "ghost" | "danger";

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  variant?: IconButtonVariant;
};

const variantClassName: Record<IconButtonVariant, string> = {
  ghost: "text-muted hover:bg-white/70 hover:text-ink",
  danger: "text-ember hover:bg-ember/10",
};

export function IconButton({
  children,
  className = "",
  label,
  type = "button",
  variant = "ghost",
  ...props
}: IconButtonProps) {
  return (
    <button
      aria-label={label}
      className={[
        "inline-flex size-10 items-center justify-center rounded-full text-base transition disabled:cursor-not-allowed disabled:opacity-50",
        variantClassName[variant],
        className,
      ].join(" ")}
      title={label}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}
