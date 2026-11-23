import React, { type ReactNode } from "react";
import Link from "@docusaurus/Link";
import { translate } from "@docusaurus/Translate";
import { useBlogPost } from "@docusaurus/plugin-content-blog/client";
import Footer from "@theme-original/BlogPostItem/Footer";
import { useCategoryOf } from "../../../components/blog/categories";

import styles from "./styles.module.css";

export default function BlogPostItemFooter(): ReactNode {
  const { metadata, isBlogPostPage } = useBlogPost();
  const category = useCategoryOf(metadata.tags.map((tag) => tag.permalink));
  if (!isBlogPostPage || !category) return <Footer />;
  return (
    <footer className={styles.footer}>
      <Link to={category.permalink} className={styles.more}>
        <span className={styles.label}>
          {translate({
            id: "mirai.blog.categories.morePrefix",
            message: "More in this category",
            description: "The small label above the category link under a post",
          })}
        </span>
        <span className={styles.name}>
          {translate(
            {
              id: "mirai.blog.categories.more",
              message: "See all {category} posts →",
              description: "The link under a post to its category page",
            },
            { category: category.label },
          )}
        </span>
      </Link>
    </footer>
  );
}
