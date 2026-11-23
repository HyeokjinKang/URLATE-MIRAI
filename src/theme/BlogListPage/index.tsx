import React, { type ReactNode } from "react";
import clsx from "clsx";
import Link from "@docusaurus/Link";
import useBaseUrl from "@docusaurus/useBaseUrl";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import {
  PageMetadata,
  HtmlClassNameProvider,
  ThemeClassNames,
} from "@docusaurus/theme-common";
import { useDateTimeFormat } from "@docusaurus/theme-common/internal";
import Layout from "@theme/Layout";
import BlogListPaginator from "@theme/BlogListPaginator";
import SearchMetadata from "@theme/SearchMetadata";
import BlogListPageStructuredData from "@theme/BlogListPage/StructuredData";
import useRouteContext from "@docusaurus/useRouteContext";
import type { Props } from "@theme/BlogListPage";
import type { BlogPaginatedMetadata } from "@docusaurus/plugin-content-blog";
import CategoryNav from "../../components/blog/CategoryNav";
import { useCategoryOf } from "../../components/blog/categories";
import { stripTitleDate } from "../../utils/postTitle";

import styles from "./styles.module.css";

type Item = Props["items"][number];

function usePostDate() {
  const format = useDateTimeFormat({
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  return (date: string) => format.format(new Date(date));
}

function Cover({ src, title }: { src?: string; title: string }) {
  const url = useBaseUrl(src ?? "");
  return (
    <div className={styles.cover}>
      {src ? (
        <img src={url} alt="" loading="lazy" />
      ) : (
        <span className={styles.coverFallback}>{title}</span>
      )}
    </div>
  );
}

function PostMeta({
  item,
  showCategory,
}: {
  item: Item;
  showCategory: boolean;
}) {
  const { metadata } = item.content;
  const formatDate = usePostDate();
  const category = useCategoryOf(metadata.tags.map((tag) => tag.permalink));
  return (
    <span className={styles.meta}>
      {showCategory && category && (
        <span className={styles.category}>{category.label}</span>
      )}
      <time dateTime={metadata.date}>{formatDate(metadata.date)}</time>
    </span>
  );
}

type ListProps = {
  items: readonly Item[];
  page: number;
  showCategory: boolean;
};

function Card({
  item,
  featured,
  showCategory,
}: {
  item: Item;
  featured?: boolean;
  showCategory: boolean;
}) {
  const { metadata, frontMatter, assets } = item.content;
  const author = metadata.authors[0];
  return (
    <article className={clsx(styles.card, featured && styles.featured)}>
      <Link to={metadata.permalink} className={styles.cardLink}>
        <Cover src={assets.image ?? frontMatter.image} title={metadata.title} />
        <div className={styles.cardBody}>
          <PostMeta item={item} showCategory={showCategory} />
          <h2 className={styles.cardTitle}>{metadata.title}</h2>
          {metadata.description && (
            <p className={styles.excerpt}>{metadata.description}</p>
          )}
          {author?.name && (
            <div className={styles.author}>
              {author.imageURL && <img src={author.imageURL} alt="" />}
              <span>{author.name}</span>
            </div>
          )}
        </div>
      </Link>
    </article>
  );
}

function Row({ item, showCategory }: { item: Item; showCategory: boolean }) {
  const { metadata } = item.content;
  return (
    <li>
      <Link to={metadata.permalink} className={styles.row}>
        <PostMeta item={item} showCategory={showCategory} />
        <span className={styles.rowTitle}>
          {stripTitleDate(metadata.title)}
        </span>
      </Link>
    </li>
  );
}

function Posts({ items, page, showCategory }: ListProps) {
  const hasCovers = items.some(
    (item) => item.content.assets.image ?? item.content.frontMatter.image,
  );
  if (!hasCovers) {
    return (
      <ul className={styles.rows}>
        {items.map((item) => (
          <Row
            key={item.content.metadata.permalink}
            item={item}
            showCategory={showCategory}
          />
        ))}
      </ul>
    );
  }
  const [first, ...rest] = page === 1 ? items : [undefined, ...items];
  return (
    <>
      {first && <Card item={first} featured showCategory={showCategory} />}
      <div className={styles.grid}>
        {rest.map(
          (item) =>
            item && (
              <Card
                key={item.content.metadata.permalink}
                item={item}
                showCategory={showCategory}
              />
            ),
        )}
      </div>
    </>
  );
}

export function BlogIndex({
  title,
  description,
  metadata,
  items = [],
  category,
  children,
}: {
  title: string;
  description: string;
  metadata?: BlogPaginatedMetadata;
  items?: readonly Item[];
  category?: string | null;
  children?: ReactNode;
}): ReactNode {
  const { plugin } = useRouteContext();
  const hasCategories = plugin.id === "default";
  return (
    <Layout>
      <main className={styles.page}>
        <header className={styles.hero}>
          <h1>{title}</h1>
          <p>{description}</p>
        </header>
        {hasCategories && <CategoryNav active={category} />}
        {children}
        {metadata && (
          <>
            <Posts
              items={items}
              page={metadata.page}
              showCategory={hasCategories && !category}
            />
            <BlogListPaginator metadata={metadata} />
          </>
        )}
      </main>
    </Layout>
  );
}

export default function BlogListPage(props: Props): ReactNode {
  const { metadata, items } = props;
  const {
    siteConfig: { title: siteTitle },
  } = useDocusaurusContext();
  const { blogTitle, blogDescription, permalink } = metadata;
  return (
    <HtmlClassNameProvider
      className={clsx(
        ThemeClassNames.wrapper.blogPages,
        ThemeClassNames.page.blogListPage,
      )}
    >
      <PageMetadata
        title={permalink === "/" ? siteTitle : blogTitle}
        description={blogDescription}
      />
      <SearchMetadata tag="blog_posts_list" />
      <BlogListPageStructuredData {...props} />
      <BlogIndex
        title={blogTitle}
        description={blogDescription}
        metadata={metadata}
        items={items}
      />
    </HtmlClassNameProvider>
  );
}
