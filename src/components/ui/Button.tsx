import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variantClassName: Record<ButtonVariant, string> = {
  primary: "bg-ink text-surface shadow-soft hover:bg-ink/90",
  secondary: "border border-line bg-white/60 text-ink hover:bg-white",
  ghost: "text-muted hover:bg-white/60 hover:text-ink",
  danger: "border border-ember/30 bg-ember/10 text-ember hover:bg-ember/15",
};

export function Button({
  children,
  className = "",
  type = "button",
  variant = "primary",
  ...props
}: PropsWithChildren<ButtonProps>) {
  return (
    <button
      className={[
        "inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
        variantClassName[variant],
        className,
      ].join(" ")}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}
