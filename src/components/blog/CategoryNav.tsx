import React, { type ReactNode } from "react";
import clsx from "clsx";
import Link from "@docusaurus/Link";
import { translate } from "@docusaurus/Translate";
import { useBlogCategories } from "./categories";

import styles from "./CategoryNav.module.css";

export default function CategoryNav({
  active,
}: {
  active?: string | null;
}): ReactNode {
  const data = useBlogCategories();
  if (!data) return null;
  const categories = data.categories.filter((c) => c.count > 0);
  if (categories.length === 0) return null;
  const current = categories.find((c) => c.permalink === active);
  const items = [
    {
      key: "all",
      label: translate({
        id: "mirai.blog.categories.all",
        message: "All",
        description: "The category tab that lists every blog post",
      }),
      permalink: data.listPath,
      count: data.total,
    },
    ...categories,
  ];
  return (
    <nav
      className={styles.nav}
      aria-label={translate({
        id: "mirai.blog.categories.navLabel",
        message: "Blog categories",
        description: "The ARIA label of the blog category tabs",
      })}
    >
      <ul className={styles.tabs}>
        {items.map((item) => {
          const selected = current
            ? item.permalink === current.permalink
            : active === undefined && item.key === "all";
          return (
            <li key={item.key}>
              <Link
                to={item.permalink}
                className={clsx(styles.tab, selected && styles.active)}
                aria-current={selected ? "page" : undefined}
              >
                {item.label}
                <span className={styles.count}>{item.count}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      {current?.description && (
        <p className={styles.description}>{current.description}</p>
      )}
    </nav>
  );
}
