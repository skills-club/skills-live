import { ReposGetQuery, ReposGetResponse } from "~~/shared/types/repos"

type ReposGetEvent = Parameters<Parameters<typeof defineEventHandler>[0]>[0]

/** GET /api/repos — 查询仓库列表，q 仅对 name 模糊匹配；支持 limit、offset */
export default defineEventHandler(async (event: ReposGetEvent): Promise<ReposGetResponse> => {
  const query = getQuery(event) as ReposGetQuery
  const q = (query.q as string)?.trim()
  const limit = Math.min(Number(query.limit) || 20, 100)
  const offset = Number(query.offset) || 0

  const sql = useDb()
  const table = sql.unsafe(REPOS_FULL_TABLE)
  const pattern = q ? `%${q}%` : null

  const rows = pattern
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

  return { data: rows as Repo[], limit, offset }
})
