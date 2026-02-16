import { createApiError } from "~~/server/utils/errors"

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createApiError('MISSING_REPO_ID')
  }

  const sql = useDb()
  const rows = await sql`
    SELECT * FROM ${REPOS_FULL_TABLE}
    WHERE id = ${id}
    LIMIT 1
  `
  const repo = rows[0]
  if (!repo) {
    throw createApiError('REPO_NOT_FOUND')
  }
  return repo
})
