// @ts-check

const path = require("path");

/** @returns {Promise<import('@docusaurus/types').Config>} */
module.exports = async function createConfig() {
  const remarkMath = (await import("remark-math")).default;
  const rehypeKatex = (await import("rehype-katex")).default;
  const markdownPlugins = {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
  };

  return {
    title: "MIRAI",
    tagline: "URLATE announcements, updates and documentation",
    url: "https://mirai.urlate.coupy.dev",
    baseUrl: "/",
    favicon: "img/icon.webp",
    organizationName: "HyeokjinKang",
    projectName: "URLATE-MIRAI",
    onBrokenLinks: "throw",
    onBrokenAnchors: "warn",
    markdown: {
      mermaid: true,
      hooks: {
        onBrokenMarkdownLinks: "warn",
      },
    },
    headTags: [
      {
        tagName: "link",
        attributes: {
          rel: "preconnect",
          href: "https://cdn.jsdelivr.net",
          crossorigin: "anonymous",
        },
      },
    ],
    stylesheets: [
      {
        href: "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css",
        type: "text/css",
      },
    ],
    i18n: {
      defaultLocale: "en",
      locales: ["en", "ko"],
      path: "i18n",
      localeConfigs: {
        en: {
          label: "English",
          direction: "ltr",
          htmlLang: "en-US",
          calendar: "gregory",
          path: "en",
        },
        ko: {
          label: "한국어",
          direction: "ltr",
          htmlLang: "ko-KR",
          calendar: "gregory",
          path: "ko",
        },
      },
    },
    presets: [
      [
        "classic",
        /** @type {import('@docusaurus/preset-classic').Options} */
        ({
          docs: {
            path: "docs",
            routeBasePath: "docs",
            sidebarPath: "./sidebars.js",
            ...markdownPlugins,
          },
          blog: {
            path: "blog",
            routeBasePath: "blog",
            blogTitle: "MIRAI",
            blogDescription: "Stories from the making of URLATE",
            blogSidebarCount: 0,
            postsPerPage: 13,
            onInlineAuthors: "ignore",
            onUntruncatedBlogPosts: "ignore",
            ...markdownPlugins,
          },
          theme: {
            customCss: [
              // relative paths are relative to site dir
              require.resolve("./src/css/custom.css"),
              require.resolve("katex/dist/katex.min.css"),
            ],
          },
        }),
      ],
    ],
    plugins: [
      () => ({
        name: "esm-only-aliases",
        configureWebpack: () => ({
          resolve: {
            alias: {
              "remark-emoji$": path.resolve(
                __dirname,
                "node_modules/remark-emoji/index.js",
              ),
            },
          },
        }),
      }),
      [
        "@docusaurus/plugin-client-redirects",
        /** @type {import('@docusaurus/plugin-client-redirects').Options} */
        ({
          redirects: [{ from: "/", to: "/blog" }],
          createRedirects: (existingPath) =>
            existingPath.startsWith("/blog/")
              ? existingPath.slice("/blog".length)
              : undefined,
        }),
      ],
      [
        "@docusaurus/plugin-content-blog",
        /** @type {import('@docusaurus/plugin-content-blog').Options} */
        ({
          id: "announcements",
          routeBasePath: "announcements",
          blogTitle: "Announcements",
          blogDescription: "Notices for URLATE players",
          path: "./announcements",
          blogSidebarCount: 0,
          onInlineAuthors: "ignore",
          onUntruncatedBlogPosts: "ignore",
          ...markdownPlugins,
        }),
      ],
    ],
    themes: ["@docusaurus/theme-mermaid"],
    themeConfig:
      /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
      ({
        image: "img/icon.webp",
        navbar: {
          title: "MIRAI",
          hideOnScroll: true,
          logo: {
            alt: "MIRAI",
            src: "img/icon.webp",
            href: "/blog",
          },
          items: [
            { to: "/blog", label: "Blog", position: "left" },
            { to: "/announcements", label: "Announcements", position: "left" },
            { to: "/docs", label: "Docs", position: "left" },
            {
              type: "localeDropdown",
              position: "right",
            },
            {
              href: "https://github.com/HyeokjinKang/URLATE",
              position: "right",
              className: "header-github-link",
              "aria-label": "GitHub repository",
              target: "_blank",
            },
          ],
        },
        footer: {
          links: [
            {
              items: [
                { label: "Blog", to: "/blog" },
                { label: "Announcements", to: "/announcements" },
                { label: "Docs", to: "/docs" },
                { label: "RSS", href: "pathname:///blog/rss.xml" },
                { label: "URLATE", href: "https://urlate.coupy.dev" },
                {
                  label: "GitHub",
                  href: "https://github.com/HyeokjinKang/URLATE",
                },
              ],
            },
          ],
          copyright: `© ${new Date().getFullYear()} Coupyworks`,
        },
        colorMode: {
          defaultMode: "light",
          disableSwitch: false,
          respectPrefersColorScheme: true,
        },
      }),
  };
};
