export interface Repo {
  id: number
  name: string
  repo: string
  description: string
  created_at: string
  updated_at: string
  pushed_at: string
  stars: number
  watchers: number
  forks: number
  default_branch: string
}

/** GET /api/repos 查询参数 */
export interface ReposGetQuery {
  q?: string
  limit?: number
  offset?: number
}

/** GET /api/repos 响应 */
export interface ReposGetResponse {
  data: Repo[]
  limit: number | null
  offset: number
}