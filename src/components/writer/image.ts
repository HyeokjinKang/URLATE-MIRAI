import type { PendingImage } from "./post";

const MAX_WIDTH = 1920;
const KEEP_TYPES = ["image/gif", "image/svg+xml", "image/webp"];
export const VIDEO_TYPES = ["video/mp4", "video/webm"];
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

export const isVideo = (type: string) => VIDEO_TYPES.includes(type);
export const isVideoUrl = (url: string) => /\.(mp4|webm)$/i.test(url);
export const isMedia = (type: string) =>
  type.startsWith("image/") || isVideo(type);

function baseName(name: string) {
  const stem = name.replace(/\.[^.]+$/, "");
  const clean = stem
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return clean || `image-${Date.now().toString(36)}`;
}

function readBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function toWebp(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_WIDTH / bitmap.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", 0.9),
  );
  if (!blob || blob.type !== "image/webp") return file;
  return blob;
}

export async function prepareImage(
  file: File,
  folder: string,
  taken: string[],
): Promise<PendingImage> {
  if (isVideo(file.type) && file.size > MAX_VIDEO_BYTES)
    throw new Error(`${file.name}: 영상은 50MB까지 올릴 수 있습니다.`);
  const keep = KEEP_TYPES.includes(file.type) || isVideo(file.type);
  const blob = keep ? file : await toWebp(file);
  const ext =
    blob === file ? (file.name.match(/\.([^.]+)$/)?.[1] ?? "png") : "webp";
  const stem = baseName(file.name);
  let name = `${stem}.${ext.toLowerCase()}`;
  for (let i = 2; taken.includes(`/img/${folder}/${name}`); i++) {
    name = `${stem}-${i}.${ext.toLowerCase()}`;
  }
  return {
    path: `static/img/${folder}/${name}`,
    url: `/img/${folder}/${name}`,
    base64: await readBase64(blob),
    type: blob.type || file.type,
  };
}

export function dataUrl(image: PendingImage) {
  return `data:${image.type};base64,${image.base64}`;
}

export function objectUrl(image: PendingImage) {
  const binary = atob(image.base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return URL.createObjectURL(new Blob([bytes], { type: image.type }));
}

export function videoTag(url: string) {
  return `<video src="${url}" autoPlay loop muted playsInline />`;
}
