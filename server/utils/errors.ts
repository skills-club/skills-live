/**
 * Centralized HTTP error codes and messages for API routes.
 * Use createApiError() to throw consistent errors.
 */
export const ERROR_CODES = {
  /** 400 - Missing required parameter: repo id */
  MISSING_REPO_ID: { statusCode: 400, message: 'Missing repo id' },
  /** 400 - Missing required parameter: path (file path in repo) */
  MISSING_PATH: { statusCode: 400, message: 'Missing path' },
  /** 404 - Repo not found by id */
  REPO_NOT_FOUND: { statusCode: 404, message: 'Repo not found' },
  /** 400 - Missing required parameter: skill id */
  MISSING_SKILL_ID: { statusCode: 400, message: 'Missing skill id' },
  /** 404 - Skill not found by id */
  SKILL_NOT_FOUND: { statusCode: 404, message: 'Skill not found' },
  /** 400 - Missing required parameter: repo (owner/name or repo id) */
  MISSING_REPO: { statusCode: 400, message: 'Missing repo' },
  /** 404 - File not found in repo */
  FILE_NOT_FOUND: { statusCode: 404, message: 'File not found' },
} as const

export type ErrorCode = keyof typeof ERROR_CODES

export function createApiError(code: ErrorCode) {
  const { statusCode, message } = ERROR_CODES[code]
  return createError({ statusCode, message })
}
