import React, {
  useLayoutEffect,
  useRef,
  type ClipboardEvent,
  type DragEvent,
  type KeyboardEvent,
} from "react";
import {
  backspace,
  enter,
  indentLines,
  lineBreak,
  moveLines,
  outdentLines,
  surround,
  tab,
  type Change,
  type Command,
} from "./keymap";
import styles from "./styles.module.css";

type Edit = (value: string, start: number, end: number) => Change;

function wrap(before: string, after = before, placeholder = ""): Edit {
  return (value, start, end) => {
    const selected = value.slice(start, end) || placeholder;
    return {
      value:
        value.slice(0, start) + before + selected + after + value.slice(end),
      start: start + before.length,
      end: start + before.length + selected.length,
    };
  };
}

function prefixLines(prefix: string): Edit {
  return (value, start, end) => {
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const block = value.slice(lineStart, end);
    const lines = block.split("\n");
    const all = lines.every((line) => line.startsWith(prefix));
    const next = lines
      .map((line) => (all ? line.slice(prefix.length) : prefix + line))
      .join("\n");
    return {
      value: value.slice(0, lineStart) + next + value.slice(end),
      start: lineStart,
      end: lineStart + next.length,
    };
  };
}

function block(text: string, cursor = text.length + 2): Edit {
  return (value, start, end) => {
    const before = value.slice(0, start);
    const lead =
      before === "" || before.endsWith("\n\n")
        ? ""
        : before.endsWith("\n")
          ? "\n"
          : "\n\n";
    const inserted = lead + text + "\n\n";
    return {
      value: before + inserted + value.slice(end).replace(/^\n+/, ""),
      start: start + lead.length + cursor,
      end: start + lead.length + cursor,
    };
  };
}

function withImports(imports: string[], edit: Edit): Edit {
  return (value, start, end) => {
    const result = edit(value, start, end);
    const missing = imports.filter((line) => !result.value.includes(line));
    if (missing.length === 0) return result;
    const leading = result.value.match(/^(?:import\s[^\n]*\n)*/)![0];
    const insert = missing.join("\n") + "\n" + (leading ? "" : "\n");
    return {
      value:
        result.value.slice(0, leading.length) +
        insert +
        result.value.slice(leading.length),
      start: result.start + insert.length,
      end: result.end + insert.length,
    };
  };
}

const footnote: Edit = (value, start, end) => {
  const used = [...value.matchAll(/\[\^(\d+)\]/g)].map((m) => Number(m[1]));
  const n = Math.max(0, ...used) + 1;
  const ref = `[^${n}]`;
  const body = value.slice(0, start) + ref + value.slice(end);
  const definition = `${ref}: `;
  const next = `${body.trimEnd()}\n\n${definition}각주 내용\n`;
  const cursor = body.trimEnd().length + 2 + definition.length;
  return { value: next, start: cursor, end: cursor + 5 };
};

const SNIPPETS: { label: string; edit: Edit }[] = [
  ...(
    [
      ["note", "참고"],
      ["tip", "팁"],
      ["info", "정보"],
      ["warning", "주의"],
      ["danger", "위험"],
    ] as const
  ).map(([type, label]) => ({
    label: `알림 상자: ${label}`,
    edit: block(`:::${type}[${label}]\n\n:::`, type.length + label.length + 6),
  })),
  {
    label: "탭",
    edit: withImports(
      [
        'import Tabs from "@theme/Tabs";',
        'import TabItem from "@theme/TabItem";',
      ],
      block(
        '<Tabs>\n  <TabItem value="first" label="첫 번째" default>\n    첫 번째 내용\n  </TabItem>\n  <TabItem value="second" label="두 번째">\n    두 번째 내용\n  </TabItem>\n</Tabs>',
      ),
    ),
  },
  {
    label: "접기 (더 보기)",
    edit: block(
      "<details>\n  <summary>더 보기</summary>\n\n  접힌 내용\n\n</details>",
    ),
  },
  {
    label: "코드 블록",
    edit: block(
      '```js title="example.js" showLineNumbers\nconst a = 1;\n// highlight-next-line\nconsole.log(a);\n```',
    ),
  },
  {
    label: "표",
    edit: block("| 항목 | 내용 |\n| --- | --- |\n| A | 1 |\n| B | 2 |"),
  },
  { label: "체크리스트", edit: block("- [x] 끝난 일\n- [ ] 할 일") },
  { label: "각주", edit: footnote },
  { label: "수식 (줄 안)", edit: wrap("$", "$", "x^2") },
  { label: "수식 (블록)", edit: block("$$\nE = mc^2\n$$", 3) },
  {
    label: "다이어그램 (Mermaid)",
    edit: block("```mermaid\ngraph LR\n  A[시작] --> B[끝]\n```"),
  },
  {
    label: "본문 속 목차",
    edit: withImports(
      ['import TOCInline from "@theme/TOCInline";'],
      block("<TOCInline toc={toc} />"),
    ),
  },
  {
    label: "라이트/다크 이미지",
    edit: withImports(
      ['import ThemedImage from "@theme/ThemedImage";'],
      block(
        '<ThemedImage\n  alt=""\n  sources={{\n    light: "/img/light.webp",\n    dark: "/img/dark.webp",\n  }}\n/>',
      ),
    ),
  },
  {
    label: "YouTube 동영상",
    edit: block(
      '<iframe\n  style={{ width: "100%", aspectRatio: "16 / 9", border: 0 }}\n  src="https://www.youtube.com/embed/VIDEO_ID"\n  allowFullScreen\n/>',
    ),
  },
];

const TOOLS: { label: string; title: string; edit: Edit }[] = [
  { label: "B", title: "굵게 (Ctrl+B)", edit: wrap("**", "**", "굵은 글씨") },
  { label: "I", title: "기울임 (Ctrl+I)", edit: wrap("*", "*", "기울임") },
  { label: "H2", title: "큰 제목", edit: prefixLines("## ") },
  { label: "H3", title: "작은 제목", edit: prefixLines("### ") },
  { label: "•", title: "목록", edit: prefixLines("- ") },
  { label: "1.", title: "번호 목록", edit: prefixLines("1. ") },
  { label: "❝", title: "인용", edit: prefixLines("> ") },
  {
    label: "링크",
    title: "링크 (Ctrl+K)",
    edit: wrap("[", "](https://)", "링크 글자"),
  },
  { label: "</>", title: "코드", edit: wrap("`", "`", "code") },
  { label: "―", title: "구분선", edit: block("---") },
  {
    label: "✂ 요약",
    title: "목록에는 이 표시 위쪽까지만 보입니다",
    edit: block("{/* truncate */}"),
  },
];

export default function Editor({
  value,
  onChange,
  onImages,
}: {
  value: string;
  onChange: (value: string) => void;
  onImages: (files: File[]) => Promise<string[]>;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const selection = useRef<[number, number] | null>(null);
  const tabEscape = useRef(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !selection.current) return;
    el.focus();
    el.setSelectionRange(...selection.current);
    selection.current = null;
  }, [value]);

  const apply = (edit: Command) => {
    const el = ref.current!;
    const result = edit(el.value, el.selectionStart, el.selectionEnd);
    if (!result) return false;
    if (result.value === el.value) {
      el.setSelectionRange(result.start, result.end);
      return true;
    }
    const old = el.value;
    let prefix = 0;
    const max = Math.min(old.length, result.value.length);
    while (prefix < max && old[prefix] === result.value[prefix]) prefix++;
    let suffix = 0;
    while (
      suffix < max - prefix &&
      old[old.length - 1 - suffix] ===
        result.value[result.value.length - 1 - suffix]
    )
      suffix++;
    const inserted = result.value.slice(prefix, result.value.length - suffix);
    el.focus();
    el.setSelectionRange(prefix, old.length - suffix);
    const native = inserted
      ? document.execCommand("insertText", false, inserted)
      : document.execCommand("delete");
    if (native && el.value === result.value) {
      el.setSelectionRange(result.start, result.end);
      return true;
    }
    selection.current = [result.start, result.end];
    onChange(result.value);
    return true;
  };

  const insertImages = async (files: File[]) => {
    const images = files.filter((file) => file.type.startsWith("image/"));
    if (images.length === 0) return false;
    const el = ref.current!;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const urls = await onImages(images);
    const text = urls.map((url) => `![](${url})`).join("\n\n");
    if (text) apply((v) => block(text)(v, start, end));
    return true;
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    const mod = e.ctrlKey || e.metaKey;
    const key = e.key.toLowerCase();
    const escaped = tabEscape.current;
    tabEscape.current = e.key === "Escape";
    const run = (command: Command) => {
      if (apply(command)) e.preventDefault();
    };
    if (mod && !e.altKey && !e.shiftKey) {
      if (key === "b") run(TOOLS[0].edit);
      else if (key === "i") run(TOOLS[1].edit);
      else if (key === "k") run(TOOLS[7].edit);
      else if (e.key === "]") run(indentLines);
      else if (e.key === "[") run(outdentLines);
      return;
    }
    if (mod || e.nativeEvent.isComposing || e.keyCode === 229) return;
    if (e.key === "Tab") {
      if (!escaped && !e.altKey) run(e.shiftKey ? outdentLines : tab);
    } else if (e.altKey) {
      if (e.key === "ArrowUp") run(moveLines(-1));
      else if (e.key === "ArrowDown") run(moveLines(1));
    } else if (e.key === "Enter") {
      run(e.shiftKey ? lineBreak : enter);
    } else if (e.key === "Backspace" && !e.shiftKey) {
      run(backspace);
    } else {
      run(surround(e.key));
    }
  };

  const onPaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const files = Array.from(e.clipboardData.files);
    if (files.some((file) => file.type.startsWith("image/"))) {
      e.preventDefault();
      void insertImages(files);
    }
  };

  const onDrop = (e: DragEvent<HTMLTextAreaElement>) => {
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;
    e.preventDefault();
    void insertImages(files);
  };

  return (
    <div className={styles.editor}>
      <div className={styles.toolbar}>
        {TOOLS.map((tool) => (
          <button
            key={tool.title}
            type="button"
            title={tool.title}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => apply(tool.edit)}
          >
            {tool.label}
          </button>
        ))}
        <select
          className={styles.insert}
          value=""
          title="Docusaurus 기능 넣기"
          onChange={(e) => {
            const snippet = SNIPPETS[Number(e.target.value)];
            if (snippet) apply(snippet.edit);
          }}
        >
          <option value="" disabled>
            ＋ 넣기
          </option>
          {SNIPPETS.map((snippet, i) => (
            <option key={snippet.label} value={i}>
              {snippet.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          title="이미지 올리기 (붙여넣기·끌어다 놓기도 됩니다)"
          onClick={() => fileRef.current?.click()}
        >
          🖼 이미지
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            void insertImages(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />
      </div>
      <textarea
        ref={ref}
        className={styles.textarea}
        value={value}
        spellCheck={false}
        placeholder="여기에 본문을 쓰세요. 이미지는 붙여넣거나 끌어다 놓으면 됩니다."
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onPaste={onPaste}
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
      />
      <div className={styles.hint}>
        Shift+Enter 줄바꿈 · Enter 두 번 문단 나누기 · Tab/Shift+Tab 들여쓰기 ·
        Alt+↑↓ 줄 옮기기 · Esc 뒤 Tab 다음 칸으로 · Ctrl+B 굵게 · Ctrl+K 링크 ·{" "}
        <a
          href="https://docusaurus.io/docs/markdown-features"
          target="_blank"
          rel="noreferrer"
        >
          문법 안내
        </a>
      </div>
    </div>
  );
}
