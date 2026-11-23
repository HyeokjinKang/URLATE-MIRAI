import React, { type ReactNode } from "react";
import clsx from "clsx";
import {
  PageMetadata,
  HtmlClassNameProvider,
  ThemeClassNames,
} from "@docusaurus/theme-common";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import SearchMetadata from "@theme/SearchMetadata";
import Unlisted from "@theme/ContentVisibility/Unlisted";
import type { Props } from "@theme/BlogTagsPostsPage";
import { BlogIndex } from "../BlogListPage";
import { useBlogCategories } from "../../components/blog/categories";

export default function BlogTagsPostsPage({
  tag,
  items,
  listMetadata,
}: Props): ReactNode {
  const {
    siteConfig: { title: siteTitle },
  } = useDocusaurusContext();
  const data = useBlogCategories();
  return (
    <HtmlClassNameProvider
      className={clsx(
        ThemeClassNames.wrapper.blogPages,
        ThemeClassNames.page.blogTagPostListPage,
      )}
    >
      <PageMetadata
        title={`${tag.label} | ${siteTitle}`}
        description={tag.description}
      />
      <SearchMetadata tag="blog_tags_posts" />
      {tag.unlisted && <Unlisted />}
      <BlogIndex
        title={data?.title ?? listMetadata.blogTitle}
        description={data?.description ?? listMetadata.blogDescription}
        metadata={listMetadata}
        items={items}
        category={tag.permalink}
      />
    </HtmlClassNameProvider>
  );
}
