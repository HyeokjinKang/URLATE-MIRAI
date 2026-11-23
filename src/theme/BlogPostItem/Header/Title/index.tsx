import React, { type ReactNode } from "react";
import clsx from "clsx";
import Link from "@docusaurus/Link";
import { useBlogPost } from "@docusaurus/plugin-content-blog/client";
import type { Props } from "@theme/BlogPostItem/Header/Title";
import { useCategoryOf } from "../../../../components/blog/categories";
import { stripTitleDate } from "../../../../utils/postTitle";

import styles from "./styles.module.css";

export default function BlogPostItemHeaderTitle({
  className,
}: Props): ReactNode {
  const { metadata, isBlogPostPage } = useBlogPost();
  const title = stripTitleDate(metadata.title);
  const category = useCategoryOf(metadata.tags.map((tag) => tag.permalink));
  const TitleHeading = isBlogPostPage ? "h1" : "h2";
  return (
    <>
      {isBlogPostPage && category && (
        <Link to={category.permalink} className={styles.category}>
          {category.label}
        </Link>
      )}
      <TitleHeading className={clsx(styles.title, className)}>
        {isBlogPostPage ? title : <Link to={metadata.permalink}>{title}</Link>}
      </TitleHeading>
    </>
  );
}
