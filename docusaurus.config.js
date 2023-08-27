module.exports = {
  title: "URLATE-v3l Documentation",
  baseUrl: "/",
  url: "https://urlate-docs.coupy.dev",
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
    path: "i18n",
    localeConfigs: {
      en: {
        label: "English",
        direction: "ltr",
        htmlLang: "en-US",
        calendar: "gregory",
        path: "en",
      },
    },
  },
  presets: [
    [
      "classic",
      {
        docs: {
          routeBasePath: "/",
        },
      },
    ],
  ],
  themeConfig: {
    image: "img/urlate-icon.png",
    navbar: {
      title: "URLATE-v3l Documentation",
      logo: {
        alt: "URLATE-v3l Logo",
        src: "img/urlate-icon.png",
      },
    },
  },
};
