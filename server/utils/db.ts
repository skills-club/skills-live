import { neon } from '@neondatabase/serverless'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.warn('[db] DATABASE_URL is not set')
}

/** Neon SQL client for serverless PostgreSQL */
export function useDb() {
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set')
  }
  return neon(connectionString)
}

/** Schema: skills-club，表: repos，库: skills */
export const DATABASE_SCHEMA = process.env.DATABASE_SCHEMA
export const REPOS_FULL_TABLE = `"${DATABASE_SCHEMA}".${process.env.REPOS_TABLE}`
export const SKILLS_FULL_TABLE = `"${DATABASE_SCHEMA}".${process.env.SKILLS_TABLE}`
