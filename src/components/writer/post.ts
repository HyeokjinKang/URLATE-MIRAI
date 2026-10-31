import { parse, stringify } from "yaml";

export type Collection = "blog" | "announcements";
export type Locale = "en" | "ko";

export const LOCALES: Locale[] = ["en", "ko"];

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  ko: "한국어",
};

export const COLLECTIONS: Record<
  Collection,
  { label: string; dir: string; koDir: string; route: string }
> = {
  blog: {
    label: "블로그",
    dir: "blog",
    koDir: "i18n/ko/docusaurus-plugin-content-blog",
    route: "/blog",
  },
  announcements: {
    label: "공지",
    dir: "announcements",
    koDir: "i18n/ko/docusaurus-plugin-content-blog-announcements",
    route: "/announcements",
  },
};

export const DEFAULT_AUTHORS: Record<Locale, unknown[]> = {
  en: [
    {
      name: "Coupy (Kang Hyeokjin)",
      title: "Founder",
      url: "https://github.com/HyeokjinKang",
      image_url: "/img/coupy.webp",
    },
  ],
  ko: [
    {
      name: "Coupy(강혁진)",
      title: "Founder",
      url: "https://github.com/HyeokjinKang",
      image_url: "/img/coupy.webp",
    },
  ],
};

export type LocaleDraft = {
  enabled: boolean;
  title: string;
  description: string;
  body: string;
  extra: Record<string, unknown>;
};

export type PendingImage = {
  path: string;
  url: string;
  base64: string;
  type: string;
};

export type Draft = {
  collection: Collection;
  fileName: string;
  isNew: boolean;
  date: string;
  slug: string;
  hideToc: boolean;
  showAuthor: boolean;
  thumbnail: string;
  locales: Record<Locale, LocaleDraft>;
  images: PendingImage[];
};

const pad = (n: number) => String(n).padStart(2, "0");

export function toLocalInput(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function fileNameFromDate(input: string) {
  return input.slice(0, 10).replaceAll("-", "");
}

function withOffset(input: string) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return input;
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? "+" : "-";
  const abs = Math.abs(offset);
  return `${input.length === 16 ? `${input}:00` : input}${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}

export function slugify(text: string) {
  return text
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s-]+/g, "-")
    .slice(0, 60)
    .replace(/-$/, "");
}

function emptyLocale(enabled: boolean): LocaleDraft {
  return { enabled, title: "", description: "", body: "", extra: {} };
}

export function newDraft(collection: Collection): Draft {
  const date = toLocalInput(new Date());
  return {
    collection,
    fileName: fileNameFromDate(date),
    isNew: true,
    date,
    slug: "",
    hideToc: collection === "announcements",
    showAuthor: collection === "blog",
    thumbnail: "",
    locales: {
      en: { ...emptyLocale(true), body: "\n\n{/* truncate */}\n\n" },
      ko: { ...emptyLocale(true), body: "\n\n{/* truncate */}\n\n" },
    },
    images: [],
  };
}

export function postPath(collection: Collection, locale: Locale, file: string) {
  const { dir, koDir } = COLLECTIONS[collection];
  return `${locale === "en" ? dir : koDir}/${file}.mdx`;
}

export function postUrl(draft: Draft) {
  const id = draft.slug || draft.fileName;
  return `${COLLECTIONS[draft.collection].route}/${id}`;
}

export function splitFrontMatter(source: string) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return { data: {} as Record<string, unknown>, body: source };
  const data = (parse(match[1]) ?? {}) as Record<string, unknown>;
  return {
    data,
    body: source.slice(match[0].length).replace(/^(\r?\n)+/, ""),
  };
}

const KNOWN_KEYS = [
  "title",
  "description",
  "slug",
  "date",
  "authors",
  "hide_table_of_contents",
];

export function draftFromFiles(
  collection: Collection,
  fileName: string,
  sources: Record<Locale, string | null>,
): Draft {
  const draft: Draft = {
    collection,
    fileName,
    isNew: false,
    date: "",
    slug: "",
    hideToc: false,
    showAuthor: false,
    thumbnail: "",
    locales: { en: emptyLocale(false), ko: emptyLocale(false) },
    images: [],
  };
  for (const locale of LOCALES) {
    const source = sources[locale];
    if (source === null) continue;
    const { data, body } = splitFrontMatter(source);
    const extra: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (collection === "blog" && key === "image") continue;
      if (!KNOWN_KEYS.includes(key) || key === "authors") extra[key] = value;
    }
    draft.locales[locale] = {
      enabled: true,
      title: String(data.title ?? ""),
      description: String(data.description ?? ""),
      body,
      extra,
    };
    if (locale === "en" || sources.en === null) {
      if (data.slug) draft.slug = String(data.slug);
      if (data.date) {
        const date = new Date(String(data.date));
        if (!Number.isNaN(date.getTime())) draft.date = toLocalInput(date);
      }
      draft.hideToc = data.hide_table_of_contents === true;
      draft.showAuthor = Boolean(data.authors);
      if (collection === "blog" && typeof data.image === "string")
        draft.thumbnail = data.image;
    }
  }
  return draft;
}

export function serialize(draft: Draft, locale: Locale) {
  const loc = draft.locales[locale];
  const { authors, ...rest } = loc.extra;
  const data: Record<string, unknown> = { title: loc.title };
  if (loc.description) data.description = loc.description;
  if (draft.slug) data.slug = draft.slug;
  if (draft.date) data.date = withOffset(draft.date);
  if (draft.showAuthor) data.authors = authors ?? DEFAULT_AUTHORS[locale];
  if (draft.collection === "blog" && draft.thumbnail)
    data.image = draft.thumbnail;
  data.hide_table_of_contents = draft.hideToc;
  Object.assign(data, rest);
  const yaml = stringify(data, { lineWidth: 0 });
  return `---\n${yaml}---\n\n${loc.body.trim()}\n`;
}

const LEAD_IMAGE = /^!\[[^\]]*\]\(([^)\s]+)\)[ \t]*(?:\r?\n)*/;

export function leadImage(body: string) {
  return body.trimStart().match(LEAD_IMAGE)?.[1] ?? null;
}

export function withLeadImage(body: string, url: string, previous: string) {
  const trimmed = body.trimStart();
  const match = trimmed.match(LEAD_IMAGE);
  const rest =
    match && (url || match[1] === previous)
      ? trimmed.slice(match[0].length)
      : trimmed;
  return url ? `![](${url})\n\n${rest}` : rest;
}
