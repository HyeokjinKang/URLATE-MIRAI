import React, {
  useLayoutEffect,
  useRef,
  type ClipboardEvent,
  type DragEvent,
  type KeyboardEvent,
} from "react";
import styles from "./styles.module.css";

type Edit = (
  value: string,
  start: number,
  end: number,
) => {
  value: string;
  start: number;
  end: number;
};

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

function block(text: string, cursor = text.length): Edit {
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
  { label: "알림", title: "알림 상자", edit: block(":::note\n\n:::", 9) },
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

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !selection.current) return;
    el.focus();
    el.setSelectionRange(...selection.current);
    selection.current = null;
  }, [value]);

  const apply = (edit: Edit) => {
    const el = ref.current!;
    const result = edit(el.value, el.selectionStart, el.selectionEnd);
    if (result.value === el.value) {
      el.setSelectionRange(result.start, result.end);
      return;
    }
    selection.current = [result.start, result.end];
    onChange(result.value);
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
    if (mod && e.key.toLowerCase() === "b") {
      e.preventDefault();
      apply(TOOLS[0].edit);
    } else if (mod && e.key.toLowerCase() === "i") {
      e.preventDefault();
      apply(TOOLS[1].edit);
    } else if (mod && e.key.toLowerCase() === "k") {
      e.preventDefault();
      apply(TOOLS[7].edit);
    } else if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault();
      apply((v, s, en) => ({
        value: `${v.slice(0, s)}  \n${v.slice(en)}`,
        start: s + 3,
        end: s + 3,
      }));
    } else if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      const el = e.currentTarget;
      const lineStart = el.value.lastIndexOf("\n", el.selectionStart - 1) + 1;
      const line = el.value.slice(lineStart, el.selectionStart);
      const match = line.match(/^(\s*)(- |\* |> |(\d+)\. )/);
      if (!match) return;
      e.preventDefault();
      if (line === match[0]) {
        apply((v, s, en) => ({
          value: v.slice(0, lineStart) + v.slice(en),
          start: lineStart,
          end: lineStart,
        }));
        return;
      }
      const marker = match[3] ? `${Number(match[3]) + 1}. ` : match[2];
      const insert = `\n${match[1]}${marker}`;
      apply((v, s, en) => ({
        value: v.slice(0, s) + insert + v.slice(en),
        start: s + insert.length,
        end: s + insert.length,
      }));
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
        Shift+Enter 줄바꿈 · Enter 두 번 문단 나누기 · Ctrl+B 굵게 · Ctrl+K 링크
      </div>
    </div>
  );
}
