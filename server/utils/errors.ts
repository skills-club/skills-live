/**
 * Centralized HTTP error codes and messages for API routes.
 * Use createApiError() to throw consistent errors.
 */
export const ERROR_CODES = {
  /** 400 - Missing required parameter: repo id */
  MISSING_REPO_ID: { statusCode: 400, message: 'Missing repo id' },
  /** 404 - Repo not found by id */
  REPO_NOT_FOUND: { statusCode: 404, message: 'Repo not found' },
} as const

export type ErrorCode = keyof typeof ERROR_CODES

export function createApiError(code: ErrorCode) {
  const { statusCode, message } = ERROR_CODES[code]
  return createError({ statusCode, message })
}
