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
import type { Props } from "@theme/BlogListPage";

import styles from "./styles.module.css";

type Item = Props["items"][number];

const TITLE_DATE_PREFIX =
  /^\s*\d{4}[.\-/]\s*\d{1,2}[.\-/]\s*\d{1,2}\.?\s*\|\s*/;

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

function Card({ item, featured }: { item: Item; featured?: boolean }) {
  const { metadata, frontMatter, assets } = item.content;
  const formatDate = usePostDate();
  const author = metadata.authors[0];
  return (
    <article className={clsx(styles.card, featured && styles.featured)}>
      <Link to={metadata.permalink} className={styles.cardLink}>
        <Cover src={assets.image ?? frontMatter.image} title={metadata.title} />
        <div className={styles.cardBody}>
          <time dateTime={metadata.date} className={styles.meta}>
            {formatDate(metadata.date)}
          </time>
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

function Row({ item }: { item: Item }) {
  const { metadata } = item.content;
  const formatDate = usePostDate();
  return (
    <li>
      <Link to={metadata.permalink} className={styles.row}>
        <time dateTime={metadata.date} className={styles.meta}>
          {formatDate(metadata.date)}
        </time>
        <span className={styles.rowTitle}>
          {metadata.title.replace(TITLE_DATE_PREFIX, "")}
        </span>
      </Link>
    </li>
  );
}

function Posts({ metadata, items }: Props) {
  const hasCovers = items.some(
    (item) => item.content.assets.image ?? item.content.frontMatter.image,
  );
  if (!hasCovers) {
    return (
      <ul className={styles.rows}>
        {items.map((item) => (
          <Row key={item.content.metadata.permalink} item={item} />
        ))}
      </ul>
    );
  }
  const [first, ...rest] = metadata.page === 1 ? items : [undefined, ...items];
  return (
    <>
      {first && <Card item={first} featured />}
      <div className={styles.grid}>
        {rest.map(
          (item) =>
            item && <Card key={item.content.metadata.permalink} item={item} />,
        )}
      </div>
    </>
  );
}

export default function BlogListPage(props: Props): ReactNode {
  const { metadata } = props;
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
      <Layout>
        <main className={styles.page}>
          <header className={styles.hero}>
            <h1>{blogTitle}</h1>
            <p>{blogDescription}</p>
          </header>
          <Posts {...props} />
          <BlogListPaginator metadata={metadata} />
        </main>
      </Layout>
    </HtmlClassNameProvider>
  );
}
