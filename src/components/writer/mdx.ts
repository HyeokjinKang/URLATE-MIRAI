import GithubSlugger from "github-slugger";
import { visit, SKIP } from "unist-util-visit";
import { toString } from "mdast-util-to-string";
import { valueToEstree } from "estree-util-value-to-estree";
import type { Program } from "estree";
import type { Heading, Root, RootContent, Text } from "mdast";
import type { CompileOptions } from "@mdx-js/mdx";

export const ADMONITIONS = [
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

export const IMAGE_PATTERN = /\.(webp|png|jpe?g|gif|svg|avif|bmp|ico)$/i;

export type CompileError = { message: string; line?: number; column?: number };

export type TocItem = { value: string; id: string; level: number };

type Directive = RootContent & {
  name: string;
  attributes?: Record<string, string | null | undefined> | null;
  children: RootContent[];
  data?: Record<string, unknown>;
};

/* ---- Preprocessing ----------------------------------------------------- */

function unwrapMdxCodeBlocks(content: string) {
  const fence = (ticks: string) =>
    new RegExp(
      `(?<begin>^|\\r?\\n)(?<indentStart>\\x20*)${ticks}(?<spaces>\\x20*)mdx-code-block\\r?\\n(?<children>.*?)\\r?\\n(?<indentEnd>\\x20*)${ticks}(?<end>\\r?\\n|$)`,
      "gs",
    );
  const replacer = (...args: unknown[]) => {
    const groups = args.at(-1) as Record<string, string>;
    return `${groups.begin}${groups.children}${groups.end}`;
  };
  return content
    .replaceAll(fence("```"), replacer)
    .replaceAll(fence("````"), replacer);
}

function escapeHeadingIds(content: string) {
  return content.replaceAll(/(?:^|\n)#{1,6}(?!#).*/g, (line) =>
    line.replace("{#", "\\{#").replace("\\\\{#", "\\{#"),
  );
}

function admonitionTitleToLabel(content: string) {
  const regexp = new RegExp(
    `^(?<quote>(> ?)*)(?<indentation>( +|\\t+))?(?<directive>:{3,}(${ADMONITIONS.join("|")})) +(?<title>.*)$`,
    "gm",
  );
  return content.replaceAll(regexp, (...args: unknown[]) => {
    const groups = args.at(-1) as Record<string, string | undefined>;
    return `${groups.quote ?? ""}${groups.indentation ?? ""}${groups.directive}[${groups.title}]`;
  });
}

export function preprocess(content: string) {
  return admonitionTitleToLabel(escapeHeadingIds(unwrapMdxCodeBlocks(content)));
}

/* ---- Remark plugins ---------------------------------------------------- */

function remarkAdmonitions() {
  return (root: Root) => {
    visit(root, "containerDirective", (node) => {
      const directive = node as unknown as Directive;
      if (!ADMONITIONS.includes(directive.name)) return;
      const [first, ...rest] = directive.children;
      const labelled =
        (first?.data as { directiveLabel?: boolean } | undefined)
          ?.directiveLabel === true;
      const label = labelled ? (first as { children?: RootContent[] }) : null;
      const title =
        directive.attributes?.title ??
        (label?.children?.length === 1 && label.children[0].type === "text"
          ? label.children[0].value
          : undefined);
      directive.data = {
        hName: "admonition",
        hProperties: {
          ...(title && { title }),
          ...(directive.attributes?.class && {
            className: directive.attributes.class.split(" "),
          }),
          ...(directive.attributes?.id && { id: directive.attributes.id }),
          type: directive.name,
        },
      };
      directive.children = labelled ? rest : directive.children;
      if (label && !title) {
        directive.children.unshift({
          type: "mdxAdmonitionTitle",
          data: { hName: "mdxAdmonitionTitle", hProperties: {} },
          children: label.children ?? [],
        } as never);
      }
    });
  };
}

function headingCommentId(heading: Heading) {
  const last = heading.children.at(-1) as
    | {
        type: string;
        value?: string;
        data?: {
          estree?: { body: unknown[]; comments?: { value: string }[] };
        };
      }
    | undefined;
  let comment: string | undefined;
  if (last?.type === "mdxTextExpression") {
    const program = last.data?.estree;
    if (program?.body.length === 0 && program.comments?.length === 1) {
      comment = program.comments[0].value;
    }
  } else if (last?.type === "html") {
    comment = /^<!--(?<comment>[\s\S]*)-->$/.exec(last.value ?? "")?.groups
      ?.comment;
  }
  const id = comment?.trim().replace(/^#/, "").trim();
  if (!id || /\s/.test(id)) return undefined;
  heading.children.pop();
  const newLast = heading.children.at(-1);
  if (newLast?.type === "text") newLast.value = newLast.value.trimEnd();
  return id;
}

function headingClassicId(heading: Heading) {
  const pattern = /\s*\{#(?<id>(?:.(?!\{#|\}))*.)\}$/;
  const last = heading.children.at(-1);
  if (last?.type !== "text") return undefined;
  const match = pattern.exec(last.value);
  if (!match) return undefined;
  const text = last.value.replace(match[0], "");
  if (text || heading.children.length === 1) last.value = text;
  else heading.children.pop();
  return match.groups!.id.trim();
}

function remarkHeadings() {
  return (root: Root) => {
    const slugger = new GithubSlugger();
    visit(root, "heading", (heading) => {
      const data = (heading.data ??= {}) as {
        id?: string;
        hProperties?: Record<string, unknown>;
      };
      const properties = (data.hProperties ??= {});
      const id = properties.id
        ? slugger.slug(String(properties.id), true)
        : (headingCommentId(heading) ??
          headingClassicId(heading) ??
          slugger.slug(
            toString(
              heading.children.filter(
                (child) => !["html", "jsx"].includes(child.type),
              ),
            ),
          ));
      data.id = id;
      properties.id = id;
    });
  };
}

function escapeHtml(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function remarkToc() {
  return (root: Root) => {
    let exported = false;
    visit(root, "mdxjsEsm", (node) => {
      const program = node.data?.estree as Program | undefined;
      program?.body.forEach((statement) => {
        if (
          statement.type === "ExportNamedDeclaration" &&
          statement.declaration?.type === "VariableDeclaration" &&
          statement.declaration.declarations.some(
            (d) => d.id.type === "Identifier" && d.id.name === "toc",
          )
        ) {
          exported = true;
        }
      });
    });
    if (exported) return;
    const items: TocItem[] = [];
    visit(root, "heading", (heading) => {
      const value = toString(heading);
      if (!value || heading.depth < 2) return;
      const id = (heading.data as { id?: string } | undefined)?.id ?? "";
      items.push({ value: escapeHtml(value), id, level: heading.depth });
    });
    root.children.unshift({
      type: "mdxjsEsm",
      value: "",
      data: {
        estree: {
          type: "Program",
          sourceType: "module",
          body: [
            {
              type: "ExportNamedDeclaration",
              specifiers: [],
              attributes: [],
              source: null,
              declaration: {
                type: "VariableDeclaration",
                kind: "const",
                declarations: [
                  {
                    type: "VariableDeclarator",
                    id: { type: "Identifier", name: "toc" },
                    init: valueToEstree(items),
                  },
                ],
              },
            },
          ],
        } as Program,
      },
    } as RootContent);
  };
}

function remarkRename() {
  const names: Record<string, string> = { details: "Details", head: "Head" };
  return (root: Root) => {
    visit(root, "mdxJsxFlowElement", (node) => {
      if (node.name && names[node.name]) node.name = names[node.name];
    });
  };
}

function remarkMermaid() {
  return (root: Root) => {
    visit(root, "code", (node) => {
      if (node.lang !== "mermaid") return;
      const value = node.value;
      for (const key of Object.keys(node)) delete (node as never)[key];
      Object.assign(node, {
        type: "mermaidCodeBlock",
        data: { hName: "mermaid", hProperties: { value } },
      });
    });
  };
}

function directiveText(directive: Directive, prefix: string) {
  const attributes = Object.entries(directive.attributes ?? {})
    .map(([key, value]) => (value ? `${key}="${value}"` : key))
    .join(" ");
  const nodes: RootContent[] = [
    { type: "text", value: `${prefix}${directive.name}` } as Text,
  ];
  if (directive.children.length > 0) {
    nodes.push({ type: "text", value: "[" } as Text, ...directive.children, {
      type: "text",
      value: "]",
    } as Text);
  }
  if (attributes)
    nodes.push({ type: "text", value: `{${attributes}}` } as Text);
  return nodes;
}

function remarkUnusedDirectives() {
  return (root: Root) => {
    visit(root, (node, index, parent) => {
      if (index === undefined || !parent) return;
      const directive = node as Directive;
      if (directive.data?.hName) return;
      if (node.type === "textDirective") {
        const nodes = directiveText(directive, ":");
        parent.children.splice(index, 1, ...(nodes as never[]));
        return [SKIP, index + nodes.length];
      }
      if (node.type === "leafDirective") {
        parent.children.splice(index, 1, {
          type: "paragraph",
          children: directiveText(directive, "::"),
        } as never);
        return [SKIP, index + 1];
      }
      return undefined;
    });
  };
}

function remarkCodeCompat() {
  return (root: Root) => {
    visit(root, "code", (node) => {
      const data = (node.data ??= {}) as {
        hProperties?: Record<string, unknown>;
      };
      data.hProperties ??= {};
      data.hProperties.metastring = node.meta;
      data.hProperties.live = node.meta?.split(" ").includes("live");
    });
  };
}

/* ---- Compiler ---------------------------------------------------------- */

async function loadPlugins() {
  const [directive, gfm, emoji, comment, math, katex] = await Promise.all([
    import("remark-directive"),
    import("remark-gfm"),
    import("remark-emoji"),
    import("@slorber/remark-comment"),
    import("remark-math"),
    import("rehype-katex"),
  ]);
  return {
    remarkPlugins: [
      directive.default,
      remarkAdmonitions,
      remarkHeadings,
      emoji.default,
      remarkToc,
      remarkRename,
      remarkMermaid,
      gfm.default,
      comment.default,
      math.default,
      remarkUnusedDirectives,
      remarkCodeCompat,
    ],
    rehypePlugins: [katex.default],
  } as Pick<CompileOptions, "remarkPlugins" | "rehypePlugins">;
}

export function toCompileError(e: unknown): CompileError {
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

const KNOWN_PREFIXES = ["@theme/", "@docusaurus/", "@theme-original/"];

export function parseImports(body: string) {
  const imports: {
    start: number;
    end: number;
    clause: string;
    spec: string;
  }[] = [];
  const pattern =
    /^import\s+(?:([\s\S]*?)\s+from\s+)?["']([^"'\n]+)["'];?[ \t]*$/gm;
  for (const match of body.matchAll(pattern)) {
    imports.push({
      start: match.index!,
      end: match.index! + match[0].length,
      clause: match[1] ?? "",
      spec: match[2],
    });
  }
  return imports;
}

export async function checkMdx(
  body: string,
  knownModules: string[],
): Promise<CompileError | null> {
  const { compile } = await import("@mdx-js/mdx");
  try {
    await compile(preprocess(body), await loadPlugins());
  } catch (e) {
    return toCompileError(e);
  }
  for (const { start, spec } of parseImports(body)) {
    if (
      KNOWN_PREFIXES.some((prefix) => spec.startsWith(prefix)) &&
      !knownModules.includes(spec)
    ) {
      return {
        message: `"${spec}" 모듈을 찾을 수 없습니다.`,
        line: body.slice(0, start).split("\n").length,
      };
    }
  }
  return null;
}

export async function evaluateMdx(body: string) {
  const [{ evaluate }, runtime, plugins] = await Promise.all([
    import("@mdx-js/mdx"),
    import("react/jsx-runtime"),
    loadPlugins(),
  ]);
  return evaluate(preprocess(body), {
    ...(runtime as unknown as Parameters<typeof evaluate>[1]),
    ...plugins,
  });
}
