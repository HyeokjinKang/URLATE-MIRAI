import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import Editor from "./Editor";
import {
  draftFromLoaded,
  readFiles,
  saveDraft,
  savedFiles,
  type Extension,
  type SaveScope,
} from "./files";
import Preview, { checkMdx } from "./Preview";
import { BRANCH, GitHub, OWNER, REPO } from "./github";
import { prepareImage } from "./image";
import {
  COLLECTIONS,
  LOCALES,
  LOCALE_LABELS,
  draftFromFiles,
  fileNameFromDate,
  newDraft,
  postPath,
  toLocalInput,
  postUrl,
  serialize,
  slugify,
  splitFrontMatter,
  type Collection,
  type Draft,
  type Locale,
  type LocaleDraft,
  type PendingImage,
} from "./post";
import styles from "./styles.module.css";

const TOKEN_KEY = "mirai-writer-token";
const DRAFT_KEY = "mirai-writer-draft";
const SITE = "https://mirai.urlate.coupy.dev";

type User = { login: string; avatar_url: string };
type PostItem = {
  collection: Collection;
  file: string;
  title: string;
  ko: boolean;
};
type View = "split" | "edit" | "preview";
type Notice = {
  kind: "info" | "error" | "success";
  text: string;
  links?: { label: string; href: string }[];
};

function storage(key: string, value?: string | null) {
  try {
    if (value === undefined) return localStorage.getItem(key);
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {}
  return null;
}

function loadDraft(): Draft | null {
  try {
    const saved = storage(DRAFT_KEY);
    if (saved) return JSON.parse(saved) as Draft;
  } catch {}
  return null;
}

function TokenSetup({
  onToken,
}: {
  onToken: (token: string) => Promise<void>;
}) {
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      await onToken(token.trim());
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  };

  return (
    <div className={styles.setup}>
      <h1>MIRAI 글쓰기</h1>
      <p>
        글은 GitHub의{" "}
        <code>
          {OWNER}/{REPO}
        </code>{" "}
        저장소에 바로 커밋되고, 몇 분 뒤 사이트에 배포됩니다. 처음 한 번만
        GitHub 토큰을 넣어 주세요. 토큰은 이 브라우저에만 저장됩니다.
      </p>
      <ol>
        <li>
          <a
            href="https://github.com/settings/personal-access-tokens/new"
            target="_blank"
            rel="noreferrer"
          >
            Fine-grained 토큰 만들기
          </a>
          를 엽니다.
        </li>
        <li>
          Repository access에서 <b>Only select repositories</b> →{" "}
          <code>{REPO}</code>를 고릅니다.
        </li>
        <li>
          Permissions에서 <b>Contents</b>와 <b>Pull requests</b>를{" "}
          <b>Read and write</b>로 바꿉니다.
        </li>
        <li>만든 토큰을 아래에 붙여 넣습니다.</li>
      </ol>
      <div className={styles.row}>
        <input
          className={styles.input}
          type="password"
          placeholder="github_pat_..."
          value={token}
          autoComplete="off"
          onChange={(e) => setToken(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && token && void submit()}
        />
        <button
          className="button button--primary"
          disabled={!token || busy}
          onClick={() => void submit()}
        >
          {busy ? "확인 중…" : "시작하기"}
        </button>
      </div>
      {error && <p className={styles.errorText}>{error}</p>}
    </div>
  );
}

function PostList({
  github,
  onOpen,
  onClose,
}: {
  github: GitHub;
  onOpen: (item: PostItem) => void;
  onClose: () => void;
}) {
  const [items, setItems] = useState<PostItem[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const result: PostItem[] = [];
      for (const collection of Object.keys(COLLECTIONS) as Collection[]) {
        const { dir, koDir } = COLLECTIONS[collection];
        const [files, koFiles] = await Promise.all([
          github.listDir(dir),
          github.listDir(koDir),
        ]);
        const koNames = new Set(koFiles.map((f) => f.name));
        const posts = files.filter(
          (f) => f.type === "file" && /\.mdx?$/.test(f.name),
        );
        const titles = await Promise.all(
          posts.map(async (f) => {
            const source = await github.readFile(f.path);
            return String(splitFrontMatter(source ?? "").data.title ?? f.name);
          }),
        );
        posts.forEach((f, i) =>
          result.push({
            collection,
            file: f.name.replace(/\.mdx?$/, ""),
            title: titles[i],
            ko: koNames.has(f.name),
          }),
        );
      }
      result.sort((a, b) => b.file.localeCompare(a.file));
      setItems(result);
    })().catch((e) => setError((e as Error).message));
  }, [github]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <div className={styles.dialogHead}>
          <h2>기존 글 불러오기</h2>
          <button className="clean-btn" onClick={onClose}>
            ✕
          </button>
        </div>
        {error && <p className={styles.errorText}>{error}</p>}
        {!items && !error && <p>불러오는 중…</p>}
        {items && (
          <ul className={styles.postList}>
            {items.map((item) => (
              <li key={`${item.collection}/${item.file}`}>
                <button onClick={() => onOpen(item)}>
                  <span className={styles.badge}>
                    {COLLECTIONS[item.collection].label}
                  </span>
                  <span className={styles.postTitle}>{item.title}</span>
                  <span className={styles.muted}>
                    {item.file}
                    {item.ko ? " · 한/영" : " · 영어만"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function PublishDialog({
  draft,
  busy,
  onPublish,
  onClose,
}: {
  draft: Draft;
  busy: boolean;
  onPublish: (mode: "direct" | "pr") => void;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<"direct" | "pr">("direct");
  const files = [
    ...LOCALES.filter((l) => draft.locales[l].enabled).map((l) =>
      postPath(draft.collection, l, draft.fileName),
    ),
    ...draft.images.map((image) => image.path),
  ];

  return (
    <div className={styles.overlay} onClick={busy ? undefined : onClose}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <div className={styles.dialogHead}>
          <h2>{draft.isNew ? "글 게시하기" : "수정 내용 게시하기"}</h2>
          <button className="clean-btn" onClick={onClose} disabled={busy}>
            ✕
          </button>
        </div>
        <label className={styles.choice}>
          <input
            type="radio"
            checked={mode === "direct"}
            onChange={() => setMode("direct")}
          />
          <span>
            <b>바로 게시</b>
            <br />
            <span className={styles.muted}>
              {BRANCH} 브랜치에 커밋하고, 2~3분 뒤 사이트에 반영됩니다.
            </span>
          </span>
        </label>
        <label className={styles.choice}>
          <input
            type="radio"
            checked={mode === "pr"}
            onChange={() => setMode("pr")}
          />
          <span>
            <b>PR로 올리기</b>
            <br />
            <span className={styles.muted}>
              새 브랜치에 커밋하고 Pull Request를 엽니다. 머지하면 게시됩니다.
            </span>
          </span>
        </label>
        <p className={styles.muted}>커밋할 파일</p>
        <ul className={styles.fileList}>
          {files.map((file) => (
            <li key={file}>
              <code>{file}</code>
            </li>
          ))}
        </ul>
        <div className={styles.dialogActions}>
          <button
            className="button button--secondary"
            onClick={onClose}
            disabled={busy}
          >
            취소
          </button>
          <button
            className="button button--primary"
            onClick={() => onPublish(mode)}
            disabled={busy}
          >
            {busy ? "게시 중…" : "게시"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SaveDialog({
  draft,
  locale,
  onClose,
  onSaved,
}: {
  draft: Draft;
  locale: Locale;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [scope, setScope] = useState<SaveScope>("all");
  const [ext, setExt] = useState<Extension>("md");
  const files = savedFiles(draft, locale, scope, ext);
  const zip = files.length > 1;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <div className={styles.dialogHead}>
          <h2>파일로 저장</h2>
          <button className="clean-btn" onClick={onClose}>
            ✕
          </button>
        </div>
        <label className={styles.choice}>
          <input
            type="radio"
            checked={scope === "all"}
            onChange={() => setScope("all")}
          />
          <span>
            <b>글 전체</b>
            <br />
            <span className={styles.muted}>
              영어·한국어 글과 아직 올리지 않은 이미지를 함께 저장합니다. 파일이
              여러 개면 저장소 경로 그대로 .zip 하나에 담습니다.
            </span>
          </span>
        </label>
        <label className={styles.choice}>
          <input
            type="radio"
            checked={scope === "locale"}
            disabled={!draft.locales[locale].enabled}
            onChange={() => setScope("locale")}
          />
          <span>
            <b>{LOCALE_LABELS[locale]} 글만</b>
            <br />
            <span className={styles.muted}>
              지금 보고 있는 언어의 글 파일 하나만 저장합니다.
              {draft.images.length > 0 && " 이미지는 빠집니다."}
            </span>
          </span>
        </label>
        <div className={styles.row}>
          <span className={styles.muted}>확장자</span>
          {(["md", "mdx"] as Extension[]).map((e) => (
            <label key={e} className={styles.check}>
              <input
                type="radio"
                checked={ext === e}
                onChange={() => setExt(e)}
              />
              .{e}
            </label>
          ))}
        </div>
        <p className={styles.muted}>
          {zip ? `${draft.fileName}.zip에 담길 파일` : "저장할 파일"}
        </p>
        <ul className={styles.fileList}>
          {files.map((file) => (
            <li key={file}>
              <code>{file}</code>
            </li>
          ))}
        </ul>
        <div className={styles.dialogActions}>
          <button className="button button--secondary" onClick={onClose}>
            취소
          </button>
          <button
            className="button button--primary"
            onClick={() => {
              saveDraft(draft, locale, scope, ext);
              onSaved();
            }}
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Writer() {
  const [token, setToken] = useState<string | null>(() => storage(TOKEN_KEY));
  const [user, setUser] = useState<User | null>(null);
  const [initial] = useState(() => {
    const saved = loadDraft();
    return { draft: saved ?? newDraft("blog"), restored: saved !== null };
  });
  const [draft, setDraft] = useState<Draft>(initial.draft);
  const [baseline, setBaseline] = useState(() =>
    initial.restored ? "" : JSON.stringify(initial.draft),
  );
  const [locale, setLocale] = useState<Locale>("en");
  const [view, setView] = useState<View>("split");
  const [listOpen, setListOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const github = useMemo(() => (token ? new GitHub(token) : null), [token]);
  const dirty = JSON.stringify(draft) !== baseline;
  const current = draft.locales[locale];

  useEffect(() => {
    if (!github) return;
    github
      .verify()
      .then(setUser)
      .catch((e) => {
        setNotice({
          kind: "error",
          text: `토큰을 확인하지 못했습니다: ${(e as Error).message}`,
        });
        storage(TOKEN_KEY, null);
        setToken(null);
      });
  }, [github]);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      } catch {
        try {
          localStorage.setItem(
            DRAFT_KEY,
            JSON.stringify({ ...draft, images: [] }),
          );
        } catch {}
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [draft]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (draft.images.length > 0 && dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [draft.images.length, dirty]);

  const update = (patch: Partial<Draft>) =>
    setDraft((d) => ({ ...d, ...patch }));
  const updateLocale = (patch: Partial<LocaleDraft>, target: Locale = locale) =>
    setDraft((d) => ({
      ...d,
      locales: { ...d.locales, [target]: { ...d.locales[target], ...patch } },
    }));

  const confirmDiscard = () =>
    !dirty || window.confirm("저장하지 않은 내용이 사라집니다. 계속할까요?");

  const startNew = (collection: Collection) => {
    if (!confirmDiscard()) return;
    const next = newDraft(collection);
    setDraft(next);
    setBaseline(JSON.stringify(next));
    setLocale("en");
    setNotice(null);
  };

  const openPost = async (item: PostItem) => {
    if (!github || !confirmDiscard()) return;
    setListOpen(false);
    setNotice({ kind: "info", text: "글을 불러오는 중…" });
    try {
      const [en, ko] = await Promise.all(
        LOCALES.map((l) =>
          github.readFile(postPath(item.collection, l, item.file)),
        ),
      );
      const next = draftFromFiles(item.collection, item.file, { en, ko });
      setDraft(next);
      setBaseline(JSON.stringify(next));
      setLocale("en");
      setNotice(null);
    } catch (e) {
      setNotice({
        kind: "error",
        text: `불러오기 실패: ${(e as Error).message}`,
      });
    }
  };

  const openLocalFiles = async (files: File[]) => {
    if (files.length === 0 || !confirmDiscard()) return;
    setNotice({ kind: "info", text: "파일을 여는 중…" });
    try {
      const loaded = await readFiles(files);
      let collection = loaded.collection;
      let isNew = true;
      if (github && /^[A-Za-z0-9_-]+$/.test(loaded.fileName)) {
        const candidates = collection
          ? [collection]
          : (Object.keys(COLLECTIONS) as Collection[]);
        for (const c of candidates) {
          if (await github.readFile(postPath(c, "en", loaded.fileName))) {
            collection = c;
            isNew = false;
            break;
          }
        }
      }
      const next = draftFromLoaded(loaded, collection ?? "blog", isNew);
      if (!next.date && isNew) next.date = toLocalInput(new Date());
      setDraft(next);
      setBaseline(JSON.stringify(next));
      setLocale(next.locales.en.enabled ? "en" : "ko");
      setNotice({
        kind: "success",
        text: isNew
          ? `${loaded.fileName} 글을 열었습니다. 사이트에 없는 글이라 새 글로 게시됩니다.`
          : `${loaded.fileName} 글을 열었습니다. 게시하면 사이트의 ${COLLECTIONS[next.collection].label} 글을 이 내용으로 고칩니다.`,
      });
    } catch (e) {
      setNotice({
        kind: "error",
        text: `파일 열기 실패: ${(e as Error).message}`,
      });
    }
  };

  const addImages = async (files: File[]) => {
    const folder = draft.fileName || "images";
    const taken = draft.images.map((image) => image.url);
    const added: PendingImage[] = [];
    for (const file of files) {
      const image = await prepareImage(file, folder, taken);
      taken.push(image.url);
      added.push(image);
    }
    setDraft((d) => ({ ...d, images: [...d.images, ...added] }));
    return added.map((image) => image.url);
  };

  const removeImage = (url: string) =>
    setDraft((d) => ({
      ...d,
      images: d.images.filter((image) => image.url !== url),
    }));

  const validate = async (): Promise<string | null> => {
    if (!/^[A-Za-z0-9_-]+$/.test(draft.fileName))
      return "파일 이름은 영문, 숫자, -, _ 만 쓸 수 있습니다.";
    if (!draft.locales.en.enabled)
      return "영어 글은 꼭 있어야 합니다. 한국어 페이지도 영어 글을 기준으로 만들어집니다.";
    if (draft.slug && !/^[A-Za-z0-9/_-]+$/.test(draft.slug))
      return "slug는 영문, 숫자, -, _, / 만 쓸 수 있습니다.";
    for (const l of LOCALES) {
      const loc = draft.locales[l];
      if (!loc.enabled) continue;
      if (!loc.title.trim()) return `${LOCALE_LABELS[l]} 제목을 입력해 주세요.`;
      const error = await checkMdx(loc.body);
      if (error) {
        setLocale(l);
        return `${LOCALE_LABELS[l]} 본문 ${error.line ? `${error.line}번째 줄` : ""}에 MDX 오류가 있습니다: ${error.message}`;
      }
    }
    if (draft.isNew && github) {
      const exists = await github.readFile(
        postPath(draft.collection, "en", draft.fileName),
      );
      if (exists !== null)
        return `${draft.fileName} 글이 이미 있습니다. 파일 이름을 바꿔 주세요.`;
    }
    return null;
  };

  const requestPublish = async () => {
    setNotice({ kind: "info", text: "확인하는 중…" });
    const error = await validate();
    if (error) {
      setNotice({ kind: "error", text: error });
      return;
    }
    setNotice(null);
    setPublishOpen(true);
  };

  const publish = async (mode: "direct" | "pr") => {
    if (!github) return;
    setBusy(true);
    try {
      const final: Draft =
        draft.collection === "blog" && draft.isNew && !draft.slug
          ? { ...draft, slug: slugify(draft.locales.en.title) }
          : draft;
      const title = final.locales.en.title;
      const message = `docs(${final.collection}): ${final.isNew ? "add" : "update"} "${title}"`;
      const files = [
        ...LOCALES.filter((l) => final.locales[l].enabled).map((l) => ({
          path: postPath(final.collection, l, final.fileName),
          content: serialize(final, l),
        })),
        ...final.images.map((image) => ({
          path: image.path,
          base64: image.base64,
        })),
      ];
      const result = await github.commit({
        files,
        message,
        branch:
          mode === "pr"
            ? `write/${final.fileName}-${Date.now().toString(36)}`
            : undefined,
        pr: { title: message, body: "MIRAI 글쓰기 도구에서 만든 PR입니다." },
      });
      const saved = { ...final, isNew: false, images: [] };
      setDraft(saved);
      setBaseline(JSON.stringify(saved));
      setPublishOpen(false);
      setNotice(
        result.prUrl
          ? {
              kind: "success",
              text: "PR을 열었습니다. 머지하면 사이트에 게시됩니다.",
              links: [{ label: "PR 보기", href: result.prUrl }],
            }
          : {
              kind: "success",
              text: "게시했습니다. 배포가 끝나면(보통 2~3분) 사이트에서 볼 수 있습니다.",
              links: [
                {
                  label: "배포 상황",
                  href: `https://github.com/${OWNER}/${REPO}/actions`,
                },
                { label: "글 보기", href: `${SITE}${postUrl(saved)}` },
                { label: "한국어로 보기", href: `${SITE}/ko${postUrl(saved)}` },
              ],
            },
      );
    } catch (e) {
      setNotice({ kind: "error", text: `게시 실패: ${(e as Error).message}` });
    }
    setBusy(false);
  };

  const logout = () => {
    storage(TOKEN_KEY, null);
    setToken(null);
    setUser(null);
  };

  if (!token || !github) {
    return (
      <>
        {notice && (
          <div className={clsx(styles.notice, styles[notice.kind])}>
            {notice.text}
          </div>
        )}
        <TokenSetup
          onToken={async (value) => {
            const verified = await new GitHub(value).verify();
            storage(TOKEN_KEY, value);
            setUser(verified);
            setNotice(null);
            setToken(value);
          }}
        />
      </>
    );
  }

  return (
    <div className={styles.writer}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>글쓰기</h1>
          <span className={styles.muted}>
            {draft.isNew
              ? "새 글"
              : `${COLLECTIONS[draft.collection].label} / ${draft.fileName}`}
            {dirty ? " · 수정됨" : ""}
          </span>
        </div>
        <div className={styles.headerRight}>
          <button
            className="button button--sm button--secondary"
            onClick={() => startNew("blog")}
          >
            새 블로그 글
          </button>
          <button
            className="button button--sm button--secondary"
            onClick={() => startNew("announcements")}
          >
            새 공지
          </button>
          <button
            className="button button--sm button--secondary"
            onClick={() => setListOpen(true)}
          >
            불러오기
          </button>
          <button
            className="button button--sm button--secondary"
            onClick={() => fileInput.current?.click()}
          >
            파일 열기
          </button>
          <button
            className="button button--sm button--secondary"
            onClick={() => setSaveOpen(true)}
          >
            파일로 저장
          </button>
          <input
            ref={fileInput}
            type="file"
            accept=".md,.mdx,.zip"
            multiple
            hidden
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              e.target.value = "";
              void openLocalFiles(files);
            }}
          />
          <button
            className="button button--sm button--primary"
            onClick={() => void requestPublish()}
          >
            게시
          </button>
          {user && (
            <button
              className={clsx("clean-btn", styles.user)}
              title="토큰 지우기"
              onClick={logout}
            >
              <img src={user.avatar_url} alt="" />
              {user.login} · 로그아웃
            </button>
          )}
        </div>
      </header>

      {notice && (
        <div className={clsx(styles.notice, styles[notice.kind])}>
          <span>{notice.text}</span>
          {notice.links?.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noreferrer"
            >
              {link.label}
            </a>
          ))}
          <button className="clean-btn" onClick={() => setNotice(null)}>
            ✕
          </button>
        </div>
      )}

      <section className={styles.meta}>
        <label>
          종류
          <select
            className={styles.input}
            value={draft.collection}
            disabled={!draft.isNew}
            onChange={(e) =>
              update({ collection: e.target.value as Collection })
            }
          >
            {(Object.keys(COLLECTIONS) as Collection[]).map((c) => (
              <option key={c} value={c}>
                {COLLECTIONS[c].label}
              </option>
            ))}
          </select>
        </label>
        <label>
          게시 날짜
          <input
            className={styles.input}
            type="datetime-local"
            value={draft.date}
            onChange={(e) =>
              update({
                date: e.target.value,
                ...(draft.isNew &&
                draft.fileName === fileNameFromDate(draft.date)
                  ? { fileName: fileNameFromDate(e.target.value) }
                  : {}),
              })
            }
          />
        </label>
        <label>
          파일 이름
          <input
            className={styles.input}
            value={draft.fileName}
            disabled={!draft.isNew}
            onChange={(e) => update({ fileName: e.target.value.trim() })}
          />
        </label>
        <label>
          주소 (slug)
          <input
            className={styles.input}
            value={draft.slug}
            placeholder={
              draft.collection === "blog" && draft.isNew
                ? slugify(draft.locales.en.title) || "영어 제목으로 자동"
                : draft.fileName
            }
            onChange={(e) => update({ slug: e.target.value.trim() })}
          />
        </label>
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={draft.showAuthor}
            onChange={(e) => update({ showAuthor: e.target.checked })}
          />
          작성자 표시
        </label>
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={draft.hideToc}
            onChange={(e) => update({ hideToc: e.target.checked })}
          />
          목차 숨기기
        </label>
      </section>

      <div className={styles.tabs}>
        {LOCALES.map((l) => (
          <button
            key={l}
            className={clsx(
              styles.tab,
              l === locale && styles.tabActive,
              !draft.locales[l].enabled && styles.tabOff,
            )}
            onClick={() => setLocale(l)}
          >
            {LOCALE_LABELS[l]}
            {!draft.locales[l].enabled && " (없음)"}
          </button>
        ))}
        {locale === "ko" && (
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={current.enabled}
              onChange={(e) => updateLocale({ enabled: e.target.checked })}
            />
            한국어 글 포함
          </label>
        )}
        {locale === "ko" &&
          current.enabled &&
          !current.title &&
          !current.body.trim().replace("{/* truncate */}", "") && (
            <button
              className="button button--sm button--link"
              onClick={() => updateLocale({ body: draft.locales.en.body })}
            >
              영어 본문 복사해 오기
            </button>
          )}
        <div className={styles.viewSwitch}>
          {(["edit", "split", "preview"] as View[]).map((v) => (
            <button
              key={v}
              className={clsx(v === view && styles.viewActive)}
              onClick={() => setView(v)}
            >
              {{ edit: "쓰기", split: "나란히", preview: "미리보기" }[v]}
            </button>
          ))}
        </div>
      </div>

      {current.enabled ? (
        <>
          <section className={styles.titleFields}>
            <input
              className={clsx(styles.input, styles.titleInput)}
              placeholder={locale === "en" ? "Title" : "제목"}
              value={current.title}
              onChange={(e) => updateLocale({ title: e.target.value })}
            />
            <input
              className={styles.input}
              placeholder={
                locale === "en"
                  ? "Description (optional)"
                  : "설명 (선택, 검색·미리보기 카드에 쓰입니다)"
              }
              value={current.description}
              onChange={(e) => updateLocale({ description: e.target.value })}
            />
          </section>
          <div
            className={clsx(
              styles.workspace,
              styles[`view${view[0].toUpperCase()}${view.slice(1)}`],
            )}
          >
            {view !== "preview" && (
              <Editor
                key={locale}
                value={current.body}
                onChange={(body) => updateLocale({ body })}
                onImages={addImages}
              />
            )}
            {view !== "edit" && (
              <Preview
                title={current.title}
                description={current.description}
                body={current.body}
                images={draft.images}
              />
            )}
          </div>
        </>
      ) : (
        <p className={styles.empty}>
          한국어 글이 없으면 한국어 페이지에도 영어 글이 그대로 보입니다. 위의
          “한국어 글 포함”을 켜면 번역을 쓸 수 있습니다.
        </p>
      )}

      {draft.images.length > 0 && (
        <section className={styles.images}>
          <span className={styles.muted}>게시할 때 함께 올라갈 이미지</span>
          <div className={styles.imageGrid}>
            {draft.images.map((image) => (
              <figure key={image.url}>
                <img src={`data:${image.type};base64,${image.base64}`} alt="" />
                <figcaption>
                  <code>{image.url}</code>
                  <button
                    className="clean-btn"
                    title="빼기"
                    onClick={() => removeImage(image.url)}
                  >
                    ✕
                  </button>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {listOpen && (
        <PostList
          github={github}
          onOpen={(item) => void openPost(item)}
          onClose={() => setListOpen(false)}
        />
      )}
      {saveOpen && (
        <SaveDialog
          draft={draft}
          locale={locale}
          onClose={() => setSaveOpen(false)}
          onSaved={() => {
            setSaveOpen(false);
            setBaseline(JSON.stringify(draft));
          }}
        />
      )}
      {publishOpen && (
        <PublishDialog
          draft={draft}
          busy={busy}
          onPublish={(mode) => void publish(mode)}
          onClose={() => setPublishOpen(false)}
        />
      )}
    </div>
  );
}
