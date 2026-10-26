import React, { type ReactNode } from "react";
import * as Admonition from "@theme/Admonition";
import * as CodeBlock from "@theme/CodeBlock";
import * as Details from "@theme/Details";
import * as Heading from "@theme/Heading";
import * as MDXComponents from "@theme/MDXComponents";
import * as Mermaid from "@theme/Mermaid";
import * as TabItem from "@theme/TabItem";
import * as Tabs from "@theme/Tabs";
import * as ThemedImage from "@theme/ThemedImage";
import * as TOCInline from "@theme/TOCInline";
import * as BrowserOnly from "@docusaurus/BrowserOnly";
import * as Interpolate from "@docusaurus/Interpolate";
import * as isInternalUrl from "@docusaurus/isInternalUrl";
import * as Link from "@docusaurus/Link";
import * as Translate from "@docusaurus/Translate";
import * as useBaseUrl from "@docusaurus/useBaseUrl";
import * as useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import * as useIsBrowser from "@docusaurus/useIsBrowser";
import { IMAGE_PATTERN, parseImports } from "./mdx";
import styles from "./styles.module.css";

function NoHead() {
  return null;
}

export const MODULES: Record<string, object> = {
  "@theme/Admonition": Admonition,
  "@theme/CodeBlock": CodeBlock,
  "@theme/Details": Details,
  "@theme/Heading": Heading,
  "@theme/MDXComponents": MDXComponents,
  "@theme/Mermaid": Mermaid,
  "@theme/TabItem": TabItem,
  "@theme/Tabs": Tabs,
  "@theme/ThemedImage": ThemedImage,
  "@theme/TOCInline": TOCInline,
  "@docusaurus/BrowserOnly": BrowserOnly,
  "@docusaurus/Head": { default: NoHead },
  "@docusaurus/Interpolate": Interpolate,
  "@docusaurus/isInternalUrl": isInternalUrl,
  "@docusaurus/Link": Link,
  "@docusaurus/Translate": Translate,
  "@docusaurus/useBaseUrl": useBaseUrl,
  "@docusaurus/useDocusaurusContext": useDocusaurusContext,
  "@docusaurus/useIsBrowser": useIsBrowser,
};

export const KNOWN_MODULES = Object.keys(MODULES);

function staticUrl(spec: string) {
  return spec.replace(/^@site\/static(?=\/)/, "");
}

function unsupported(spec: string) {
  const Unsupported = ({ children }: { children?: ReactNode }) => (
    <div className={styles.unsupported}>
      미리보기에서 불러올 수 없는 모듈: <code>{spec}</code>
      {children}
    </div>
  );
  return new Proxy({} as Record<string, unknown>, {
    get: (_, key) => (key === "__esModule" ? true : Unsupported),
  });
}

declare global {
  var __miraiModule: ((spec: string) => object) | undefined;
}

globalThis.__miraiModule = (spec: string) => {
  if (MODULES[spec]) return MODULES[spec];
  if (IMAGE_PATTERN.test(spec)) return { default: staticUrl(spec) };
  return unsupported(spec);
};

function bindings(clause: string, ref: string) {
  const parts: string[] = [];
  const named = clause.match(/\{([\s\S]*)\}/);
  const rest = clause
    .replace(/\{[\s\S]*\}/, "")
    .trim()
    .replace(/,$/, "");
  for (const part of rest
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean)) {
    const namespace = part.match(/^\*\s+as\s+(\w+)$/);
    if (namespace) parts.push(`export const ${namespace[1]} = ${ref};`);
    else parts.push(`export const ${part} = ${ref}.default;`);
  }
  if (named) {
    const items = named[1]
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => item.replace(/^(\w+)\s+as\s+(\w+)$/, "$1: $2"));
    if (items.length > 0)
      parts.push(`export const { ${items.join(", ")} } = ${ref};`);
  }
  return parts.join(" ");
}

export function previewSource(body: string) {
  let result = "";
  let cursor = 0;
  for (const { start, end, clause, spec } of parseImports(body)) {
    const original = body.slice(start, end);
    const ref = `globalThis.__miraiModule(${JSON.stringify(spec)})`;
    const newlines = "\n".repeat(original.split("\n").length - 1);
    result += body.slice(cursor, start) + bindings(clause, ref) + newlines;
    cursor = end;
  }
  result += body.slice(cursor);
  return result.replace(
    /require\(\s*["']([^"']+)["']\s*\)\.default/g,
    (whole, spec: string) =>
      IMAGE_PATTERN.test(spec) ? JSON.stringify(staticUrl(spec)) : whole,
  );
}
