import { Fragment } from "react";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface AppBreadcrumbProps {
  items: BreadcrumbItem[];
}

/**
 * Breadcrumb trail above the page title, as in Veronika's prototype: earlier
 * steps are links, the last one is where the teacher is.
 */
export function AppBreadcrumb({ items }: AppBreadcrumbProps) {
  if (items.length <= 1) return null;

  return (
    <nav aria-label="Drobečková navigace" className="mb-5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
      {items.map((item, i) => {
        const last = i === items.length - 1;
        return (
          <Fragment key={`${item.label}-${i}`}>
            {i > 0 && <ChevronRight className="h-3 w-3 shrink-0 text-subtle" aria-hidden="true" />}
            {item.href && !last ? (
              <Link to={item.href} className="transition-colors hover:text-foreground">
                {item.label}
              </Link>
            ) : (
              <span className={last ? "text-foreground" : undefined} aria-current={last ? "page" : undefined}>
                {item.label}
              </span>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
