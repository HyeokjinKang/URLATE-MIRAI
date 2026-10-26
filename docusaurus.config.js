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
    title: "URLATE MIRAI",
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
            routeBasePath: "/",
            blogTitle: "URLATE Blog",
            blogDescription: "URLATE announcements and updates",
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
        "@docusaurus/plugin-content-blog",
        /** @type {import('@docusaurus/plugin-content-blog').Options} */
        ({
          id: "announcements",
          routeBasePath: "announcements",
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
          title: "URLATE MIRAI",
          logo: {
            alt: "Logo",
            src: "img/icon.webp",
          },
          items: [
            { to: "/docs", label: "Docs", position: "left" },
            { to: "/announcements", label: "Announcements", position: "left" },
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
        colorMode: {
          defaultMode: "light",
          disableSwitch: false,
          respectPrefersColorScheme: true,
        },
      }),
  };
};
