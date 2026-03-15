const GITHUB_API = "https://api.github.com";

interface GitHubHeaders {
  Authorization: string;
  Accept: string;
  "Content-Type": string;
  "X-GitHub-Api-Version": string;
}

interface CreatePRParams {
  owner: string;
  repo: string;
  baseBranch: string;
  accessToken: string;
  files: Record<string, string>;
  title: string;
  body: string;
}

interface CreatePRResult {
  prUrl: string;
  prNumber: number;
  branch: string;
}

interface GitHubRefResponse {
  object: {
    sha: string;
  };
}

interface GitHubBlobResponse {
  sha: string;
}

interface GitHubTreeResponse {
  sha: string;
}

interface GitHubCommitResponse {
  sha: string;
}

interface GitHubPRResponse {
  html_url: string;
  number: number;
}

interface GitHubUserResponse {
  login: string;
  id: number;
}

interface GitHubErrorResponse {
  message: string;
  documentation_url?: string;
}

function buildHeaders(accessToken: string): GitHubHeaders {
  return {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

async function githubFetch<T>(
  url: string,
  accessToken: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...buildHeaders(accessToken),
      ...(options.headers as Record<string, string> | undefined),
    },
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => ({
      message: response.statusText,
    }))) as GitHubErrorResponse;

    throw new Error(
      `GitHub API error (${response.status}) at ${options.method ?? "GET"} ${url}: ${errorBody.message}`
    );
  }

  return response.json() as Promise<T>;
}

/**
 * Verify a GitHub personal access token by calling GET /user.
 * Throws if the token is invalid or the request fails.
 */
export async function verifyGitHubToken(
  accessToken: string
): Promise<{ login: string; id: number }> {
  const user = await githubFetch<GitHubUserResponse>(
    `${GITHUB_API}/user`,
    accessToken
  );

  return { login: user.login, id: user.id };
}

/**
 * Create a pull request containing design system file updates.
 *
 * Uses the Git Data API to build a commit without needing a local clone:
 * 1. Get latest commit SHA on base branch
 * 2. Create blobs for each file
 * 3. Create a tree referencing all blobs
 * 4. Create a commit with that tree
 * 5. Create a branch ref pointing to the commit
 * 6. Open a PR from the new branch to base
 */
export async function createDesignUpdatePR(
  params: CreatePRParams
): Promise<CreatePRResult> {
  const { owner, repo, baseBranch, accessToken, files, title, body } = params;
  const repoBase = `${GITHUB_API}/repos/${owner}/${repo}`;
  const timestamp = Date.now();
  const branch = `layout/design-update-${timestamp}`;

  const fileEntries = Object.entries(files);
  if (fileEntries.length === 0) {
    throw new Error("At least one file is required to create a design update PR");
  }

  // 1. Get the latest commit SHA on the base branch
  const ref = await githubFetch<GitHubRefResponse>(
    `${repoBase}/git/ref/heads/${baseBranch}`,
    accessToken
  );
  const baseSha = ref.object.sha;

  // 2. Create blobs for each file
  const blobResults = await Promise.all(
    fileEntries.map(async ([path, content]) => {
      const blob = await githubFetch<GitHubBlobResponse>(
        `${repoBase}/git/blobs`,
        accessToken,
        {
          method: "POST",
          body: JSON.stringify({ content, encoding: "utf-8" }),
        }
      );
      return { path, sha: blob.sha };
    })
  );

  // 3. Create a tree with all file blobs
  const treeItems = blobResults.map(({ path, sha }) => ({
    path,
    mode: "100644" as const,
    type: "blob" as const,
    sha,
  }));

  const tree = await githubFetch<GitHubTreeResponse>(
    `${repoBase}/git/trees`,
    accessToken,
    {
      method: "POST",
      body: JSON.stringify({ base_tree: baseSha, tree: treeItems }),
    }
  );

  // 4. Create a commit pointing to the new tree
  const commit = await githubFetch<GitHubCommitResponse>(
    `${repoBase}/git/commits`,
    accessToken,
    {
      method: "POST",
      body: JSON.stringify({
        message: title,
        tree: tree.sha,
        parents: [baseSha],
      }),
    }
  );

  // 5. Create the branch ref
  await githubFetch<GitHubRefResponse>(
    `${repoBase}/git/refs`,
    accessToken,
    {
      method: "POST",
      body: JSON.stringify({
        ref: `refs/heads/${branch}`,
        sha: commit.sha,
      }),
    }
  );

  // 6. Create the pull request
  const pr = await githubFetch<GitHubPRResponse>(
    `${repoBase}/pulls`,
    accessToken,
    {
      method: "POST",
      body: JSON.stringify({
        title,
        body,
        head: branch,
        base: baseBranch,
      }),
    }
  );

  return {
    prUrl: pr.html_url,
    prNumber: pr.number,
    branch,
  };
}
