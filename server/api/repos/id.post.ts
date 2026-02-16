export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'Missing repo id' })
  }

  const sql = useDb()
  const rows = await sql`
    SELECT * FROM "skills-club".repos
    WHERE id = ${id}
    LIMIT 1
  `
  const repo = rows[0]
  if (!repo) {
    throw createError({ statusCode: 404, message: 'Repo not found' })
  }
  return repo
})
