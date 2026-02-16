/** GET /api/repos — 查询 ${DATABASE_SCHEMA}.${REPOS_TABLE} 仓库列表，支持 limit/offset */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const limit = Math.min(Number(query.limit) || 20, 100)
  const offset = Number(query.offset) || 0

  const sql = useDb()
  const rows = await sql`
    SELECT * FROM ${REPOS_FULL_TABLE}
    ORDER BY id
    LIMIT ${limit}
    OFFSET ${offset}
  `
  return { data: rows, limit, offset }
})
