module.exports = {
  title: "URLATE MIRAI",
  baseUrl: "/",
  url: "https://mirai.uralte.coupy.dev",
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
      {
        docs: {
          routeBasePath: "/docs/",
        },
        blog: {
          routeBasePath: "/",
          blogTitle: "URLATE Blog",
          blogDescription: "URLATE announcements and updates",
        },
        theme: {
          customCss: [
            require.resolve("./static/css/custom.css"),
            // relative paths are relative to site dir
          ],
        },
      },
    ],
  ],
  plugins: [
    [
      "@docusaurus/plugin-content-blog",
      {
        id: "announcements",
        routeBasePath: "announcements",
        path: "./announcements",
        blogSidebarCount: 0,
      },
    ],
  ],
  themeConfig: {
    image: "img/icon.webp",
    navbar: {
      title: "URLATE MIRAI",
      logo: {
        alt: "Logo",
        src: "img/icon.webp",
      },
      items: [
        { to: "docs", label: "Docs", position: "left" },
        { to: "announcements", label: "Announcements", position: "left" },
        {
          href: "https://github.com/HyeokjinKang/URLATE",
          position: "right",
          className: "header-github-link",
          "aria-label": "GitHub repository",
          target: "_blank",
        },
        {
          type: "localeDropdown",
          position: "right",
        },
      ],
    },
    colorMode: {
      defaultMode: "light",
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
  },
};
