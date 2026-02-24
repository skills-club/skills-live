import matter from 'gray-matter'

const GITHUB_API = 'https://api.github.com'

/**
 * POST /api/file/content
 * Body: { repo: string, path: string, branch?: string }
 * repo 可为仓库 id（数字）或 owner/name；branch 不传时：id 时用库 default_branch，否则 main
 * 通过 GitHub API 拉取 raw 文件内容，返回: { content: string, frontmatter?: Record<string, unknown> }
 * .md 文件在服务端用 gray-matter 解析 frontmatter，避免浏览器端 Buffer 未定义
 */
export default defineEventHandler(async (event) => {
  let body: { repo?: string; path?: string; branch?: string } | undefined
  try {
    body = await readBody(event)
  } catch {
    body = undefined
  }
  const repoParam = (body?.repo != null ? String(body.repo) : '').trim()
  const path = (body?.path != null ? String(body.path) : '').trim()
  const branchParam = (body?.branch != null ? String(body.branch) : '').trim()

  if (!repoParam) {
    throw createApiError('MISSING_REPO')
  }
  if (!path) {
    throw createApiError('MISSING_PATH')
  }

  let repoSlug: string
  let branch: string

  const repoId = Number(repoParam)
  if (Number.isInteger(repoId) && repoId > 0) {
    try {
      const sql = useDb()
      const rows = await sql`
        SELECT * FROM ${sql.unsafe(REPOS_FULL_TABLE)}
        WHERE id = ${repoId}
        LIMIT 1
      `
      const repo = rows[0] as Repo | undefined
      if (!repo) {
        throw createApiError('REPO_NOT_FOUND')
      }
      repoSlug = repo.repo
      branch = branchParam || repo.default_branch || 'main'
    } catch (e: unknown) {
      if (e && typeof (e as { statusCode?: number }).statusCode === 'number') throw e
      const msg = e instanceof Error ? e.message : 'Database error'
      throw createError({ statusCode: 500, message: msg })
    }
  } else {
    repoSlug = repoParam
    branch = branchParam || 'main'
  }

  const [owner, repoName] = repoSlug.split('/')
  if (!owner || !repoName) {
    throw createError({ statusCode: 400, message: 'Invalid repo format, use owner/name' })
  }

  const apiPath = path.split('/').map(encodeURIComponent).join('/')
  const url = `${GITHUB_API}/repos/${owner}/${repoName}/contents/${apiPath}?ref=${encodeURIComponent(branch)}`

  const token = process.env.GITHUB_TOKEN
  const headers: Record<string, string> = {
    'User-Agent': 'GitHub-Skills-Viewer',
    Accept: 'application/vnd.github.raw',
  }
  if (token) headers.Authorization = `Bearer ${token}`

  try {
    const raw = await $fetch<string>(url, {
      responseType: 'text',
      headers,
      timeout: 15000,
    })
    const isMarkdown = path.toLowerCase().endsWith('.md')
    if (isMarkdown) {
      const parsed = matter(raw)
      return { content: parsed.content, frontmatter: parsed.data, raw }
    }
    return { content: raw }
  } catch (e: unknown) {
    const err = e as { status?: number; statusCode?: number; message?: string }
    const statusCode = err?.status ?? err?.statusCode ?? 500
    if (statusCode === 404) throw createApiError('FILE_NOT_FOUND')
    const message = err?.message ?? 'Failed to fetch file content'
    throw createError({ statusCode, message })
  }
})
