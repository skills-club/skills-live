export default defineEventHandler(async (event): Promise<SkillRow> => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createApiError('MISSING_SKILL_ID')
  }

  const sql = useDb()
  const table = sql.unsafe(SKILLS_FULL_TABLE)
  const reposTable = sql.unsafe(REPOS_FULL_TABLE)
  const rows = await sql`
    SELECT s.*, r.name AS repo_name, r.repo AS repo_slug
    FROM ${table} s
    LEFT JOIN ${reposTable} r ON r.id = s.repo_id
    WHERE s.id = ${Number(id)}
    LIMIT 1
  `
  const skill = rows[0]
  if (!skill) {
    throw createApiError('SKILL_NOT_FOUND')
  }
  return skill as SkillRow
})
