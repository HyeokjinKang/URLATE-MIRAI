// @ts-check

/** @type {import('@docusaurus/types').Config} */
const config = {
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
    hooks: {
      onBrokenMarkdownLinks: "warn",
    },
  },
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
        },
        blog: {
          path: "blog",
          routeBasePath: "/",
          blogTitle: "URLATE Blog",
          blogDescription: "URLATE announcements and updates",
          onInlineAuthors: "ignore",
          onUntruncatedBlogPosts: "ignore",
        },
        theme: {
          customCss: [
            // relative paths are relative to site dir
            require.resolve("./src/css/custom.css"),
          ],
        },
      }),
    ],
  ],
  plugins: [
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
      }),
    ],
  ],
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

module.exports = config;
