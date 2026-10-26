export const OWNER = "HyeokjinKang";
export const REPO = "URLATE-MIRAI";
export const BRANCH = "main";

const API = "https://api.github.com";

export class GitHubError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export type CommitFile =
  { path: string; content: string } | { path: string; base64: string };

export type DirEntry = { name: string; path: string; type: string };

export type CommitResult = { sha: string; branch: string; prUrl?: string };

export class GitHub {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private async request<T>(
    path: string,
    init: RequestInit & { raw?: boolean } = {},
  ): Promise<T> {
    const { raw, ...rest } = init;
    const res = await fetch(`${API}${path}`, {
      ...rest,
      cache: "no-store",
      headers: {
        Accept: raw
          ? "application/vnd.github.raw+json"
          : "application/vnd.github+json",
        Authorization: `Bearer ${this.token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        ...(rest.body ? { "Content-Type": "application/json" } : {}),
      },
    });
    if (!res.ok) {
      let message = res.statusText;
      try {
        message = (await res.json()).message ?? message;
      } catch {}
      throw new GitHubError(res.status, message);
    }
    if (raw) return (await res.text()) as T;
    return (await res.json()) as T;
  }

  private repoPath(path: string) {
    return `/repos/${OWNER}/${REPO}${path}`;
  }

  async verify() {
    const user = await this.request<{ login: string; avatar_url: string }>(
      "/user",
    );
    const repo = await this.request<{ permissions?: { push?: boolean } }>(
      this.repoPath(""),
    );
    if (!repo.permissions?.push) {
      throw new GitHubError(403, `${REPO} 저장소에 쓰기 권한이 없습니다.`);
    }
    return user;
  }

  async listDir(path: string): Promise<DirEntry[]> {
    try {
      return await this.request<DirEntry[]>(
        this.repoPath(`/contents/${path}?ref=${BRANCH}`),
      );
    } catch (e) {
      if (e instanceof GitHubError && e.status === 404) return [];
      throw e;
    }
  }

  async readFile(path: string): Promise<string | null> {
    try {
      return await this.request<string>(
        this.repoPath(`/contents/${path}?ref=${BRANCH}`),
        { raw: true },
      );
    } catch (e) {
      if (e instanceof GitHubError && e.status === 404) return null;
      throw e;
    }
  }

  async commit({
    files,
    message,
    branch,
    pr,
  }: {
    files: CommitFile[];
    message: string;
    branch?: string;
    pr?: { title: string; body: string };
  }): Promise<CommitResult> {
    const ref = await this.request<{ object: { sha: string } }>(
      this.repoPath(`/git/ref/heads/${BRANCH}`),
    );
    const parent = ref.object.sha;
    const base = await this.request<{ tree: { sha: string } }>(
      this.repoPath(`/git/commits/${parent}`),
    );

    const tree = await Promise.all(
      files.map(async (file) => {
        const blob = await this.request<{ sha: string }>(
          this.repoPath("/git/blobs"),
          {
            method: "POST",
            body: JSON.stringify(
              "base64" in file
                ? { content: file.base64, encoding: "base64" }
                : { content: file.content, encoding: "utf-8" },
            ),
          },
        );
        return {
          path: file.path,
          mode: "100644",
          type: "blob",
          sha: blob.sha,
        };
      }),
    );

    const newTree = await this.request<{ sha: string }>(
      this.repoPath("/git/trees"),
      {
        method: "POST",
        body: JSON.stringify({ base_tree: base.tree.sha, tree }),
      },
    );
    const commit = await this.request<{ sha: string }>(
      this.repoPath("/git/commits"),
      {
        method: "POST",
        body: JSON.stringify({
          message,
          tree: newTree.sha,
          parents: [parent],
        }),
      },
    );

    if (!branch) {
      await this.request(this.repoPath(`/git/refs/heads/${BRANCH}`), {
        method: "PATCH",
        body: JSON.stringify({ sha: commit.sha }),
      });
      return { sha: commit.sha, branch: BRANCH };
    }

    await this.request(this.repoPath("/git/refs"), {
      method: "POST",
      body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: commit.sha }),
    });
    const pull = await this.request<{ html_url: string }>(
      this.repoPath("/pulls"),
      {
        method: "POST",
        body: JSON.stringify({
          title: pr?.title ?? message,
          body: pr?.body ?? "",
          head: branch,
          base: BRANCH,
        }),
      },
    );
    return { sha: commit.sha, branch, prUrl: pull.html_url };
  }
}
