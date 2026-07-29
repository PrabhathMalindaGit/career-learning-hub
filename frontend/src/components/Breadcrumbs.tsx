import { Link } from "react-router-dom";

export type BreadcrumbItem = {
  label: string;
  to?: string;
};

export function Breadcrumbs({
  items,
}: {
  items: readonly BreadcrumbItem[];
}) {
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <ol>
        {items.map((item, index) => {
          const current = index === items.length - 1;
          return (
            <li key={`${item.to ?? "current"}:${item.label}`}>
              {!current && item.to ? (
                <Link to={item.to} title={item.label}>
                  {item.label}
                </Link>
              ) : (
                <span aria-current="page" title={item.label}>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
