import React, { useEffect, useMemo, useState, type ComponentType } from "react";
import MDXComponents from "@theme/MDXComponents";
import { dataUrl } from "./image";
import type { PendingImage } from "./post";
import styles from "./styles.module.css";

const ADMONITIONS = [
  "secondary",
  "info",
  "success",
  "danger",
  "note",
  "tip",
  "warning",
  "important",
  "caution",
];

type Node = {
  type: string;
  name?: string;
  attributes?: Record<string, string>;
  children?: Node[];
  value?: string;
  data?: Record<string, unknown>;
};

function remarkAdmonitions() {
  const walk = (node: Node) => {
    if (
      node.type === "containerDirective" &&
      ADMONITIONS.includes(node.name!)
    ) {
      const [first, ...rest] = node.children ?? [];
      const labelled = first?.data?.directiveLabel === true;
      const title =
        node.attributes?.title ??
        (labelled && first.children?.[0]?.type === "text"
          ? first.children[0].value
          : undefined);
      node.data = {
        hName: "admonition",
        hProperties: { type: node.name, ...(title && { title }) },
      };
      node.children = labelled ? rest : node.children;
    }
    node.children?.forEach(walk);
  };
  return walk;
}

function previewSource(body: string) {
  return body.replace(
    /^import\s+(\w+)\s+from\s+["']([^"']+)["'];?[ \t]*$/gm,
    (_, name: string, path: string) =>
      /\.(webp|png|jpe?g|gif|svg|avif)$/i.test(path)
        ? `export const ${name} = ${JSON.stringify(path)};`
        : `export const ${name} = () => null;`,
  );
}

type CompileError = { message: string; line?: number; column?: number };

function toCompileError(e: unknown): CompileError {
  const err = e as {
    reason?: string;
    message: string;
    line?: number;
    column?: number;
  };
  return {
    message: err.reason ?? err.message,
    line: err.line,
    column: err.column,
  };
}

export async function checkMdx(body: string): Promise<CompileError | null> {
  const [{ compile }, gfm, directive] = await Promise.all([
    import("@mdx-js/mdx"),
    import("remark-gfm"),
    import("remark-directive"),
  ]);
  try {
    await compile(body, {
      remarkPlugins: [gfm.default, directive.default],
    });
    return null;
  } catch (e) {
    return toCompileError(e);
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
  const [Content, setContent] = useState<ComponentType<{
    components: Record<string, unknown>;
  }> | null>(null);
  const [error, setError] = useState<CompileError | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const [{ evaluate }, runtime, gfm, directive] = await Promise.all([
          import("@mdx-js/mdx"),
          import("react/jsx-runtime"),
          import("remark-gfm"),
          import("remark-directive"),
        ]);
        const mod = await evaluate(previewSource(body), {
          ...(runtime as unknown as Parameters<typeof evaluate>[1]),
          remarkPlugins: [gfm.default, directive.default, remarkAdmonitions],
        });
        if (cancelled) return;
        setContent(
          () =>
            mod.default as unknown as ComponentType<{
              components: Record<string, unknown>;
            }>,
        );
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
        {Content && <Content components={components} />}
      </article>
    </div>
  );
}
