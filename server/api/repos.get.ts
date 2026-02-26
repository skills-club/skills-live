type ReposGetEvent = Parameters<Parameters<typeof defineEventHandler>[0]>[0]

/** GET /api/repos — 查询仓库列表，q 仅对 name 模糊匹配；支持 limit、offset */
export default defineEventHandler(async (event: ReposGetEvent): Promise<ReposGetResponse> => {
  const query = getQuery(event) as ReposGetQuery
  const q = (query.q as string)?.trim()
  const limit = query.limit != null && query.limit != undefined ? Number(query.limit) : null
  const offset = limit != null ? Number(query.offset) || 0 : 0

  const sql = useDb()
  const table = sql.unsafe(REPOS_FULL_TABLE)
  const pattern = q ? `%${q}%` : null

  const rows =
    limit != null
      ? pattern
        ? await sql`
            SELECT * FROM ${table}
            WHERE name ILIKE ${pattern}
            ORDER BY id
            LIMIT ${limit}
            OFFSET ${offset}
          `
        : await sql`
            SELECT * FROM ${table}
            ORDER BY id
            LIMIT ${limit}
            OFFSET ${offset}
          `
      : pattern
        ? await sql`
            SELECT * FROM ${table}
            WHERE name ILIKE ${pattern}
            ORDER BY id
          `
        : await sql`
            SELECT * FROM ${table}
            ORDER BY id
          `

  return { data: rows as Repo[], limit, offset }
})
