import type { PropsWithChildren, ReactNode } from "react";

type EmptyStateProps = PropsWithChildren<{
  action?: ReactNode;
  description: string;
  title: string;
}>;

export function EmptyState({ action, children, description, title }: EmptyStateProps) {
  return (
    <div className="rounded-[2rem] border border-dashed border-line bg-white/35 px-6 py-12 text-center shadow-soft sm:px-10">
      <div className="mx-auto mb-7 h-px w-20 bg-ember" />
      <h2 className="text-2xl font-semibold text-ink">{title}</h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted">{description}</p>
      {children ? <div className="mt-5 text-sm leading-7 text-muted">{children}</div> : null}
      {action ? <div className="mt-7">{action}</div> : null}
    </div>
  );
}
