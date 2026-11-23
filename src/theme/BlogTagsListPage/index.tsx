import React, { type ReactNode } from "react";
import clsx from "clsx";
import Link from "@docusaurus/Link";
import { translate } from "@docusaurus/Translate";
import {
  PageMetadata,
  HtmlClassNameProvider,
  ThemeClassNames,
} from "@docusaurus/theme-common";
import SearchMetadata from "@theme/SearchMetadata";
import { BlogIndex } from "../BlogListPage";
import { useBlogCategories } from "../../components/blog/categories";

import styles from "../BlogListPage/styles.module.css";

function postCount(count: number) {
  return translate(
    {
      id: "mirai.blog.categories.postCount",
      message: "{count} posts",
      description: "The number of posts in a blog category",
    },
    { count },
  );
}

export default function BlogTagsListPage(): ReactNode {
  const data = useBlogCategories();
  const categories = data?.categories.filter((c) => c.count > 0) ?? [];
  const title = translate({
    id: "mirai.blog.categories.title",
    message: "Categories",
    description: "The title of the blog category list page",
  });
  return (
    <HtmlClassNameProvider
      className={clsx(
        ThemeClassNames.wrapper.blogPages,
        ThemeClassNames.page.blogTagsListPage,
      )}
    >
      <PageMetadata title={title} />
      <SearchMetadata tag="blog_tags_list" />
      <BlogIndex
        title={data?.title ?? title}
        description={data?.description ?? ""}
        category={null}
      >
        <ul className={styles.categoryGrid}>
          {categories.map((category) => (
            <li key={category.key}>
              <Link to={category.permalink} className={styles.categoryCard}>
                <h2>{category.label}</h2>
                <p>{category.description}</p>
                <span>{postCount(category.count)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </BlogIndex>
    </HtmlClassNameProvider>
  );
}
