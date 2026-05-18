// components/Breadcrumbs.tsx — Breadcrumb nav para páginas de detalle.

import Link from "next/link";
import { Fragment } from "react";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type Props = {
  items: BreadcrumbItem[];
};

export default function Breadcrumbs({ items }: Props) {
  if (items.length === 0) return null;
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      {items.map((item, i) => (
        <Fragment key={i}>
          {i > 0 && (
            <span className="breadcrumb-sep" aria-hidden="true">
              /
            </span>
          )}
          {item.href ? (
            <Link href={item.href} className="breadcrumb-link">
              {item.label}
            </Link>
          ) : (
            <span className="breadcrumb-current">{item.label}</span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
