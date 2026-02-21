const RAW_GITHUB = 'https://raw.githubusercontent.com'

/**
 * POST /api/file/content
 * Body: { repo: string, path: string, branch?: string }
 * repo 可为仓库 id（数字）或 owner/name；branch 不传时：id 时用库 default_branch，否则 main
 * 返回: { content: string }
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<{ repo?: string; path?: string; branch?: string }>(event)
  const repoParam = (body?.repo as string)?.trim()
  const path = (body?.path as string)?.trim()
  const branchParam = (body?.branch as string)?.trim()

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
  } else {
    repoSlug = repoParam
    branch = branchParam || 'main'
  }

  const url = `${RAW_GITHUB}/${repoSlug}/${branch}/${path}`

  try {
    const content = await $fetch<string>(url, { responseType: 'text' })
    return { content }
  } catch (e: unknown) {
    const err = e as { statusCode?: number }
    const statusCode = err?.statusCode ?? 500
    if (statusCode === 404) throw createApiError('FILE_NOT_FOUND')
    throw createError({ statusCode, message: 'Failed to fetch file content' })
  }
})
