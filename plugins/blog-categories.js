// @ts-check

const fs = require("fs");
const path = require("path");
const { parse } = require("yaml");

/**
 * Exposes the blog categories (tags.yml of the default blog) with post counts
 * as global data, so list pages and the writer can render a category bar.
 * @type {import('@docusaurus/types').PluginModule}
 */
module.exports = function blogCategories(context) {
  const { siteDir, localizationDir } = context;
  const tagsFile = [
    path.join(localizationDir, "docusaurus-plugin-content-blog", "tags.yml"),
    path.join(siteDir, "blog", "tags.yml"),
  ].find((file) => fs.existsSync(file));

  return {
    name: "blog-categories",
    getPathsToWatch: () => (tagsFile ? [tagsFile] : []),
    async allContentLoaded({ allContent, actions }) {
      const blog =
        /** @type {import('@docusaurus/plugin-content-blog').BlogContent | undefined} */ (
          allContent["docusaurus-plugin-content-blog"]?.default
        );
      if (!blog || !tagsFile) return;
      /** @type {Record<string, {label?: string; permalink?: string; description?: string}>} */
      const defined = parse(fs.readFileSync(tagsFile, "utf8")) ?? {};
      const tags = Object.values(blog.blogTags);
      const categories = Object.entries(defined).map(([key, tag]) => {
        const permalink = `${blog.blogTagsListPath}${tag.permalink ?? `/${key}`}`;
        const used = tags.find((t) => t.permalink === permalink);
        return {
          key,
          label: tag.label ?? key,
          description: tag.description ?? "",
          permalink,
          count: used ? used.items.length : 0,
        };
      });
      actions.setGlobalData({
        title: blog.blogTitle,
        description: blog.blogDescription,
        listPath: `${context.baseUrl}blog`,
        total: blog.blogPosts.filter((post) => !post.metadata.unlisted).length,
        categories,
      });
    },
  };
};
