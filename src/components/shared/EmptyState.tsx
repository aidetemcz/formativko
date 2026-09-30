import type { ComponentType, ReactNode } from "react";

interface EmptyStateProps {
  icon: ComponentType<{ className?: string }>;
  title: string;
  children?: ReactNode;
  /** The next step: a button or link. */
  action?: ReactNode;
}

/** An empty page that says what to do next, instead of just "nothing here". */
export function EmptyState({ icon: Icon, title, children, action }: EmptyStateProps) {
  return (
    <div className="px-4 pb-16 pt-10 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-soft">
        <Icon className="h-9 w-9 text-brand" />
      </div>
      <p className="mt-5 text-lg font-medium">{title}</p>
      {children && (
        <div className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{children}</div>
      )}
      {action && <div className="mt-6 flex justify-center gap-2">{action}</div>}
    </div>
  );
}
