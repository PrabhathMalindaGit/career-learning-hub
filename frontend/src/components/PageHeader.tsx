import type { ReactNode } from "react";

interface PageHeaderProps {
  heading: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  heading,
  description,
  actions,
  className,
}: PageHeaderProps) {
  const classes = className
    ? `page-header ${className}`
    : "page-header";

  return (
    <div className={classes}>
      <div className="page-header__copy">
        {heading}
        {description !== undefined && description !== null ? (
          <div className="page-header__description">
            {description}
          </div>
        ) : null}
      </div>

      {actions !== undefined && actions !== null ? (
        <div className="page-header__actions">{actions}</div>
      ) : null}
    </div>
  );
}
