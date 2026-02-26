type SkillsGetEvent = Parameters<Parameters<typeof defineEventHandler>[0]>[0]

/** GET /api/skills — 查询技能列表，q 对 name、description 模糊匹配；支持 repo_id、limit、offset；联表返回 repo_name */
export default defineEventHandler(async (event: SkillsGetEvent): Promise<SkillsGetResponse> => {
  const query = getQuery(event) as SkillsGetQuery
  const repoId = query.repo_id != null ? Number(query.repo_id) : null
  const q = (query.q as string)?.trim()
  const limit = query.limit != null && query.limit != undefined ? Number(query.limit) : null
  const offset = limit != null ? Number(query.offset) || 0 : 0

  const sql = useDb()
  const table = sql.unsafe(SKILLS_FULL_TABLE)
  const reposTable = sql.unsafe(REPOS_FULL_TABLE)
  const pattern = q ? `%${q}%` : null

  const run = async (hasLimit: boolean) => {
    if (repoId != null && pattern) {
      return hasLimit
        ? sql`
            SELECT s.*, r.name AS repo_name
            FROM ${table} s
            JOIN ${reposTable} r ON r.id = s.repo_id
            WHERE s.repo_id = ${repoId}
              AND (s.name ILIKE ${pattern} OR COALESCE(s.description, '') ILIKE ${pattern})
            ORDER BY s.id
            LIMIT ${limit!} OFFSET ${offset}
          `
        : sql`
            SELECT s.*, r.name AS repo_name
            FROM ${table} s
            JOIN ${reposTable} r ON r.id = s.repo_id
            WHERE s.repo_id = ${repoId}
              AND (s.name ILIKE ${pattern} OR COALESCE(s.description, '') ILIKE ${pattern})
            ORDER BY s.id
          `
    }
    if (repoId != null) {
      return hasLimit
        ? sql`
            SELECT s.*, r.name AS repo_name
            FROM ${table} s
            JOIN ${reposTable} r ON r.id = s.repo_id
            WHERE s.repo_id = ${repoId}
            ORDER BY s.id
            LIMIT ${limit!} OFFSET ${offset}
          `
        : sql`
            SELECT s.*, r.name AS repo_name
            FROM ${table} s
            JOIN ${reposTable} r ON r.id = s.repo_id
            WHERE s.repo_id = ${repoId}
            ORDER BY s.id
          `
    }
    if (pattern) {
      return hasLimit
        ? sql`
            SELECT s.*, r.name AS repo_name
            FROM ${table} s
            LEFT JOIN ${reposTable} r ON r.id = s.repo_id
            WHERE s.name ILIKE ${pattern}
               OR COALESCE(s.description, '') ILIKE ${pattern}
            ORDER BY s.id
            LIMIT ${limit!} OFFSET ${offset}
          `
        : sql`
            SELECT s.*, r.name AS repo_name
            FROM ${table} s
            LEFT JOIN ${reposTable} r ON r.id = s.repo_id
            WHERE s.name ILIKE ${pattern}
               OR COALESCE(s.description, '') ILIKE ${pattern}
            ORDER BY s.id
          `
    }
    return hasLimit
      ? sql`
          SELECT s.*, r.name AS repo_name
          FROM ${table} s
          LEFT JOIN ${reposTable} r ON r.id = s.repo_id
          ORDER BY s.id
          LIMIT ${limit!} OFFSET ${offset}
        `
      : sql`
          SELECT s.*, r.name AS repo_name
          FROM ${table} s
          LEFT JOIN ${reposTable} r ON r.id = s.repo_id
          ORDER BY s.id
        `
  }

  const rows = await run(limit != null)
  return { data: rows as SkillRow[], limit, offset }
})
