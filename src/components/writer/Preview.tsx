import React, {
  Component,
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import MDXComponents from "@theme/MDXComponents";
import { dataUrl } from "./image";
import {
  checkMdx as compileCheck,
  evaluateMdx,
  toCompileError,
  type CompileError,
} from "./mdx";
import { KNOWN_MODULES, previewSource } from "./modules";
import type { PendingImage } from "./post";
import styles from "./styles.module.css";

type Content = ComponentType<{ components: Record<string, unknown> }>;

export function checkMdx(body: string) {
  return compileCheck(body, KNOWN_MODULES);
}

class RenderBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className={styles.compileError}>
          <strong>렌더링 오류</strong>
          <span>{this.state.error.message}</span>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function Preview({
  title,
  description,
  body,
  images,
}: {
  title: string;
  description: string;
  body: string;
  images: PendingImage[];
}) {
  const [content, setContent] = useState<{ Content: Content; key: number }>();
  const [error, setError] = useState<CompileError | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const mod = await evaluateMdx(previewSource(body));
        if (cancelled) return;
        setContent((prev) => ({
          Content: mod.default as unknown as Content,
          key: (prev?.key ?? 0) + 1,
        }));
        setError(null);
      } catch (e) {
        if (cancelled) return;
        setError(toCompileError(e));
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [body]);

  const components = useMemo(() => {
    const map = new Map(images.map((image) => [image.url, dataUrl(image)]));
    const Img = MDXComponents.img as ComponentType<Record<string, unknown>>;
    return {
      ...MDXComponents,
      Head: () => null,
      img: (props: { src?: string }) => (
        <Img {...props} src={map.get(props.src ?? "") ?? props.src} />
      ),
    };
  }, [images]);

  return (
    <div className={styles.preview}>
      {error && (
        <div className={styles.compileError}>
          <strong>MDX 오류{error.line ? ` (${error.line}번째 줄)` : ""}</strong>
          <span>{error.message}</span>
        </div>
      )}
      <article className="markdown">
        <h1>{title || <span className={styles.muted}>제목 없음</span>}</h1>
        {description && <p className={styles.description}>{description}</p>}
        {content && (
          <RenderBoundary key={content.key}>
            <content.Content components={components} />
          </RenderBoundary>
        )}
      </article>
    </div>
  );
}
