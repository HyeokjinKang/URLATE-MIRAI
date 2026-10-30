export type Change = { value: string; start: number; end: number };

export type Command = (
  value: string,
  start: number,
  end: number,
) => Change | null;

const INDENT = "  ";

const PAIRS: Record<string, string> = {
  "(": ")",
  "[": "]",
  "{": "}",
  "`": "`",
  "*": "*",
  _: "_",
  "~": "~",
  '"': '"',
};

const CLOSERS: Record<string, string> = { "{": "}", "(": ")", "[": "]" };

const VOID_TAGS = new Set(["br", "hr", "img", "input", "source", "wbr"]);

/* ---- Lines ------------------------------------------------------------- */

type Line = {
  quote: string;
  indent: string;
  marker: string;
  bullet: string;
  num: number | null;
  task: boolean;
  width: number;
  rest: string;
};

function lineStart(value: string, pos: number) {
  return value.lastIndexOf("\n", pos - 1) + 1;
}

function lineEnd(value: string, pos: number) {
  const i = value.indexOf("\n", pos);
  return i === -1 ? value.length : i;
}

function parse(text: string): Line {
  const m = text.match(
    /^((?:[ \t]{0,3}>[ \t]?)*)([ \t]*)(?:([-*+]|\d{1,9}[.)]) (\[[ xX]\] )?)?/,
  )!;
  const bullet = m[3] ?? "";
  return {
    quote: m[1],
    indent: m[2],
    marker: m[0].slice(m[1].length + m[2].length),
    bullet,
    num: /^\d/.test(bullet) ? Number(bullet.slice(0, -1)) : null,
    task: Boolean(m[4]),
    width: bullet ? bullet.length + 1 : 0,
    rest: text.slice(m[0].length),
  };
}

function inFence(value: string, pos: number) {
  let fence: string | null = null;
  for (const text of value.slice(0, pos).split("\n")) {
    const m = text.match(/^[ \t]*(`{3,}|~{3,})/);
    if (!m) continue;
    if (!fence) fence = m[1];
    else if (
      m[1][0] === fence[0] &&
      m[1].length >= fence.length &&
      text.trim() === m[1]
    )
      fence = null;
  }
  return fence !== null;
}

function previousLines(value: string, from: number) {
  const lines: Line[] = [];
  let i = from - 1;
  while (i > 0) {
    const start = lineStart(value, i);
    const text = value.slice(start, i);
    if (text.trim()) lines.push(parse(text));
    i = start - 1;
  }
  return lines;
}

function indentStep(value: string, from: number, line: Line) {
  if (!line.marker) return INDENT;
  const prev = previousLines(value, from)[0];
  return prev?.marker &&
    prev.quote === line.quote &&
    prev.indent === line.indent
    ? " ".repeat(prev.width)
    : INDENT;
}

function outdentStep(value: string, from: number, line: Line) {
  if (line.marker) {
    for (const prev of previousLines(value, from)) {
      if (prev.quote !== line.quote) break;
      if (prev.indent.length < line.indent.length) {
        if (prev.marker) return line.indent.length - prev.indent.length;
        break;
      }
    }
  }
  return INDENT.length;
}

function outdent(indent: string, n: number) {
  if (indent.startsWith("\t")) return indent.slice(1);
  const spaces = indent.match(/^ */)![0].length;
  return indent.slice(Math.min(n, spaces));
}

function editLines(
  value: string,
  start: number,
  end: number,
  change: (line: Line) => string,
): Change {
  const from = lineStart(value, start);
  const to = lineEnd(
    value,
    end > start && value[end - 1] === "\n" ? end - 1 : end,
  );
  const lines = value.slice(from, to).split("\n");
  let pos = from;
  let shift = 0;
  let nextStart = start;
  let nextEnd = end;
  const out = lines.map((text, i) => {
    const line = parse(text);
    const indent =
      lines.length > 1 && text.trim() === "" ? line.indent : change(line);
    const at = pos + line.quote.length;
    const diff = indent.length - line.indent.length;
    const map = (x: number) =>
      shift +
      (x < at
        ? x
        : x < at + line.indent.length
          ? at + Math.min(x - at, indent.length)
          : x + diff);
    if (i === 0 && !(start !== end && start === from)) nextStart = map(start);
    if (end >= pos && end <= pos + text.length) nextEnd = map(end);
    shift += diff;
    pos += text.length + 1;
    return (
      line.quote + indent + text.slice(line.quote.length + line.indent.length)
    );
  });
  if (end > to) nextEnd = end + shift;
  return {
    value: value.slice(0, from) + out.join("\n") + value.slice(to),
    start: nextStart,
    end: nextEnd,
  };
}

/* ---- Commands ---------------------------------------------------------- */

export const indentLines: Command = (value, start, end) => {
  const from = lineStart(value, start);
  const step = indentStep(
    value,
    from,
    parse(value.slice(from, lineEnd(value, from))),
  );
  return editLines(value, start, end, (line) => step + line.indent);
};

export const outdentLines: Command = (value, start, end) => {
  const from = lineStart(value, start);
  const step = outdentStep(
    value,
    from,
    parse(value.slice(from, lineEnd(value, from))),
  );
  return editLines(value, start, end, (line) => outdent(line.indent, step));
};

export const tab: Command = (value, start, end) => {
  const from = lineStart(value, start);
  if (value.slice(start, end).includes("\n"))
    return indentLines(value, start, end);
  const line = parse(value.slice(from, lineEnd(value, start)));
  if (line.marker && !inFence(value, from))
    return indentLines(value, start, end);
  const col = start - from;
  const spaces = " ".repeat(INDENT.length - (col % INDENT.length));
  return {
    value: value.slice(0, start) + spaces + value.slice(end),
    start: start + spaces.length,
    end: start + spaces.length,
  };
};

export const enter: Command = (value, start, end) => {
  const from = lineStart(value, start);
  if (start === from) return null;
  const before = value.slice(from, start);
  const after = value.slice(end, lineEnd(value, end));
  const code = inFence(value, from);
  const line = parse(before);
  const insert = (text: string, cursor = text.length, cut = 0): Change => ({
    value: value.slice(0, start) + text + value.slice(end + cut),
    start: start + cursor,
    end: start + cursor,
  });

  if (!code) {
    const fence = before.match(/^([ \t]*)(`{3,}|~{3,})[^`]*$/);
    if (fence && after.trim() === "" && inFence(value, value.length)) {
      const [, indent, mark] = fence;
      return insert(`\n${indent}\n${indent}${mark}`, indent.length + 1);
    }
  }

  if (!code && (line.marker || line.quote)) {
    if (line.rest.trim() === "" && after.trim() === "") {
      if (line.marker && line.indent) return outdentLines(value, start, end);
      const keep = line.marker
        ? line.quote
        : line.quote.replace(/>[ \t]?$/, "");
      const to = lineEnd(value, end);
      return {
        value: value.slice(0, from) + keep + value.slice(to),
        start: from + keep.length,
        end: from + keep.length,
      };
    }
    const marker = line.marker
      ? (line.num === null
          ? `${line.bullet} `
          : `${line.num + 1}${line.bullet.slice(-1)} `) +
        (line.task ? "[ ] " : "")
      : "";
    const cut = after.length - after.trimStart().length;
    return insert(`\n${line.quote}${line.indent}${marker}`, undefined, cut);
  }

  const indent = before.match(/^[ \t]*/)![0];
  if (before.trim() === "" && after.trim() === "") {
    const to = lineEnd(value, end);
    return {
      value: value.slice(0, from) + "\n" + indent + value.slice(to),
      start: from + 1 + indent.length,
      end: from + 1 + indent.length,
    };
  }
  const trimmed = before.trimEnd();
  const tag = trimmed.match(/<([A-Za-z][\w.]*)(?:\s[^<>]*)?>$/);
  const closer =
    tag && !trimmed.endsWith("/>") && !VOID_TAGS.has(tag[1].toLowerCase())
      ? `</${tag[1]}`
      : CLOSERS[trimmed.slice(-1)];
  if (closer) {
    const rest = after.trimStart();
    if (rest.startsWith(closer))
      return insert(
        `\n${indent}${INDENT}\n${indent}`,
        indent.length + INDENT.length + 1,
        after.length - rest.length,
      );
    return insert(`\n${indent}${INDENT}`);
  }
  return indent ? insert(`\n${indent}`) : null;
};

export const lineBreak: Command = (value, start, end) => {
  const from = lineStart(value, start);
  if (inFence(value, from)) return enter(value, start, end);
  const line = parse(value.slice(from, start));
  const text = `  \n${line.quote}${line.indent}${" ".repeat(line.width)}`;
  return {
    value: value.slice(0, start) + text + value.slice(end),
    start: start + text.length,
    end: start + text.length,
  };
};

export const backspace: Command = (value, start, end) => {
  if (start !== end) return null;
  const from = lineStart(value, start);
  const before = value.slice(from, start);
  const line = parse(before);
  const at = from + line.quote.length + line.indent.length;
  if (line.marker && line.rest === "" && !inFence(value, from)) {
    const cut = line.task
      ? line.marker.length - line.width
      : line.marker.length;
    const keep = line.task ? line.width : 0;
    return {
      value: value.slice(0, at + keep) + value.slice(at + keep + cut),
      start: at + keep,
      end: at + keep,
    };
  }
  if (start === at && /^ +$/.test(line.indent)) {
    const n = line.indent.length % INDENT.length || INDENT.length;
    return {
      value: value.slice(0, start - n) + value.slice(start),
      start: start - n,
      end: start - n,
    };
  }
  return null;
};

export function surround(key: string): Command {
  return (value, start, end) => {
    if (start === end || !Object.hasOwn(PAIRS, key)) return null;
    return {
      value:
        value.slice(0, start) +
        key +
        value.slice(start, end) +
        PAIRS[key] +
        value.slice(end),
      start: start + 1,
      end: end + 1,
    };
  };
}

export function moveLines(direction: -1 | 1): Command {
  return (value, start, end) => {
    const from = lineStart(value, start);
    const to = lineEnd(
      value,
      end > start && value[end - 1] === "\n" ? end - 1 : end,
    );
    const block = value.slice(from, to);
    if (direction < 0) {
      if (from === 0) return null;
      const prevStart = lineStart(value, from - 1);
      const prev = value.slice(prevStart, from - 1);
      const shift = prev.length + 1;
      return {
        value:
          value.slice(0, prevStart) + block + "\n" + prev + value.slice(to),
        start: start - shift,
        end: end - shift,
      };
    }
    if (to === value.length) return null;
    const nextEnd = lineEnd(value, to + 1);
    const next = value.slice(to + 1, nextEnd);
    const shift = next.length + 1;
    return {
      value: value.slice(0, from) + next + "\n" + block + value.slice(nextEnd),
      start: start + shift,
      end: end + shift,
    };
  };
}
