import { usePluginData } from "@docusaurus/useGlobalData";

export type Category = {
  key: string;
  label: string;
  description: string;
  permalink: string;
  count: number;
};

export type BlogCategories = {
  title: string;
  description: string;
  listPath: string;
  total: number;
  categories: Category[];
};

export function useBlogCategories() {
  return usePluginData("blog-categories") as BlogCategories | undefined;
}

export function useCategoryOf(permalinks: string[]) {
  const data = useBlogCategories();
  return data?.categories.find((c) => permalinks.includes(c.permalink));
}
