import type { ReactNode } from "react";
import { AppBreadcrumb, type BreadcrumbItem } from "./AppBreadcrumb";
import { PageHelp } from "./PageHelp";

interface PageHeaderProps {
  title: ReactNode;
  /** Trail above the title; the last item is the current page. */
  breadcrumbs?: BreadcrumbItem[];
  /** Plain-language explanation behind the "?" next to the title. */
  help?: string;
  /** The page's main action, on the right. One black primary button at most. */
  actions?: ReactNode;
  description?: ReactNode;
}

export function PageHeader({ title, breadcrumbs, help, actions, description }: PageHeaderProps) {
  return (
    <header className="mb-7">
      {breadcrumbs && <AppBreadcrumb items={breadcrumbs} />}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex flex-wrap items-center text-2xl font-medium leading-10">
          {title}
          {help && <PageHelp text={help} />}
        </h1>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {description && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>}
    </header>
  );
}
