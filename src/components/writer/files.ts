import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import {
  COLLECTIONS,
  LOCALES,
  draftFromFiles,
  postPath,
  serialize,
  type Collection,
  type Draft,
  type Locale,
  type PendingImage,
} from "./post";

export type SaveScope = "all" | "locale";

export type LoadedFiles = {
  collection: Collection | null;
  fileName: string;
  sources: Record<Locale, string | null>;
  images: PendingImage[];
};

const IMAGE_TYPES: Record<string, string> = {
  webp: "image/webp",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  svg: "image/svg+xml",
};

const POST_PATTERN = /\.mdx?$/i;

function base64FromBytes(bytes: Uint8Array) {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

function bytesFromBase64(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function download(name: string, data: BlobPart, type: string) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ---- Save ------------------------------------------------------------------

function localeFileName(draft: Draft, locale: Locale) {
  return `${draft.fileName}${locale === "ko" ? ".ko" : ""}.mdx`;
}

export function savedFiles(draft: Draft, locale: Locale, scope: SaveScope) {
  if (scope === "locale") return [localeFileName(draft, locale)];
  const posts = LOCALES.filter((l) => draft.locales[l].enabled);
  if (posts.length === 1 && draft.images.length === 0)
    return [localeFileName(draft, posts[0])];
  return [
    ...posts.map((l) => postPath(draft.collection, l, draft.fileName)),
    ...draft.images.map((image) => image.path),
  ];
}

export function saveDraft(draft: Draft, locale: Locale, scope: SaveScope) {
  const posts =
    scope === "locale"
      ? [locale]
      : LOCALES.filter((l) => draft.locales[l].enabled);
  if (posts.length === 1 && (scope === "locale" || draft.images.length === 0)) {
    download(
      localeFileName(draft, posts[0]),
      serialize(draft, posts[0]),
      "text/markdown;charset=utf-8",
    );
    return;
  }
  const entries: Record<string, Uint8Array> = {};
  for (const l of posts)
    entries[postPath(draft.collection, l, draft.fileName)] = strToU8(
      serialize(draft, l),
    );
  for (const image of draft.images)
    entries[image.path] = bytesFromBase64(image.base64);
  download(`${draft.fileName}.zip`, zipSync(entries), "application/zip");
}

// ---- Load ------------------------------------------------------------------

function classify(path: string) {
  const name = path.split("/").pop() ?? path;
  const stem = name.replace(POST_PATTERN, "");
  for (const collection of Object.keys(COLLECTIONS) as Collection[]) {
    const { dir, koDir } = COLLECTIONS[collection];
    if (path.includes(`${koDir}/`))
      return { collection, locale: "ko" as Locale, fileName: stem };
    if (new RegExp(`(^|/)${dir}/`).test(path))
      return { collection, locale: "en" as Locale, fileName: stem };
  }
  const ko = /\.ko$/i.test(stem);
  return {
    collection: null,
    locale: (ko ? "ko" : "en") as Locale,
    fileName: ko ? stem.slice(0, -3) : stem,
  };
}

function imageFromEntry(path: string, bytes: Uint8Array): PendingImage | null {
  const match = path.match(/(?:^|\/)static\/(img\/.+\.([a-z0-9]+))$/i);
  const type = match && IMAGE_TYPES[match[2].toLowerCase()];
  if (!match || !type) return null;
  return {
    path: `static/${match[1]}`,
    url: `/${match[1]}`,
    base64: base64FromBytes(bytes),
    type,
  };
}

export async function readFiles(files: File[]): Promise<LoadedFiles> {
  const posts: { path: string; text: string }[] = [];
  const images: PendingImage[] = [];
  for (const file of files) {
    if (/\.zip$/i.test(file.name)) {
      const entries = unzipSync(new Uint8Array(await file.arrayBuffer()));
      for (const [path, bytes] of Object.entries(entries)) {
        if (path.endsWith("/") || path.startsWith("__MACOSX/")) continue;
        if (POST_PATTERN.test(path))
          posts.push({ path, text: strFromU8(bytes) });
        else {
          const image = imageFromEntry(path, bytes);
          if (image) images.push(image);
        }
      }
    } else if (POST_PATTERN.test(file.name)) {
      posts.push({ path: file.name, text: await file.text() });
    } else {
      throw new Error(`${file.name}: .md, .mdx, .zip 파일만 열 수 있습니다.`);
    }
  }
  if (posts.length === 0) throw new Error("글 파일(.md, .mdx)이 없습니다.");

  const result: LoadedFiles = {
    collection: null,
    fileName: "",
    sources: { en: null, ko: null },
    images,
  };
  for (const post of posts) {
    const { collection, locale, fileName } = classify(post.path);
    if (result.fileName && result.fileName !== fileName)
      throw new Error(
        `한 번에 글 하나만 열 수 있습니다. (${result.fileName}, ${fileName})`,
      );
    if (result.sources[locale] !== null)
      throw new Error(
        `${locale === "ko" ? "한국어" : "영어"} 글 파일이 두 개 이상입니다. 한국어 글은 파일 이름을 <이름>.ko.md로 바꿔 주세요.`,
      );
    result.fileName = fileName;
    result.sources[locale] = post.text;
    result.collection ??= collection;
  }
  return result;
}

export function draftFromLoaded(
  loaded: LoadedFiles,
  collection: Collection,
  isNew: boolean,
): Draft {
  const draft = draftFromFiles(collection, loaded.fileName, loaded.sources);
  return { ...draft, isNew, images: loaded.images };
}
