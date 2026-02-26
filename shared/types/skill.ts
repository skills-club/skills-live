export interface Skill {
  id: number
  repo_id: number
  path: string
  mode: string
  sha: string
  size: number
  is_skill_md: boolean
  name: string
  description: string
  created_at: string
}

/** GET /api/skills 查询参数 */
export interface SkillsGetQuery {
  repo_id?: number
  q?: string
  limit?: number
  offset?: number
}

/** Skill 行（联表时可能带 repo_name、repo_slug） */
export type SkillRow = Skill & { repo_name?: string; repo_slug?: string }

/** GET /api/skills 响应 */
export interface SkillsGetResponse {
  data: SkillRow[]
  limit: number | null
  offset: number
}