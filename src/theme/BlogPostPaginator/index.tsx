import React, { type ReactNode } from "react";
import BlogPostPaginator from "@theme-original/BlogPostPaginator";
import type BlogPostPaginatorType from "@theme/BlogPostPaginator";
import type { WrapperProps } from "@docusaurus/types";
import { stripTitleDate } from "../../utils/postTitle";

type Props = WrapperProps<typeof BlogPostPaginatorType>;
type Item = Props["nextItem"];

const strip = (item: Item): Item =>
  item && { ...item, title: stripTitleDate(item.title) };

export default function BlogPostPaginatorWrapper(props: Props): ReactNode {
  return (
    <BlogPostPaginator
      {...props}
      prevItem={strip(props.prevItem)}
      nextItem={strip(props.nextItem)}
    />
  );
}
