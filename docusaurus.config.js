module.exports = {
  title: "URLATE-v3l",
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
    image: "img/icon.webp",
    navbar: {
      title: "URLATE-v3l",
      logo: {
        alt: "Logo",
        src: "img/icon.webp",
      },
    },
    colorMode: {
      defaultMode: "light",
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
  },
};
