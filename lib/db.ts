import { Pool, QueryResultRow } from 'pg'
import { cookies } from 'next/headers'

// SSL config for DigitalOcean
const sslConfig = {
  rejectUnauthorized: false,
}

const poolConfig = {
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000, // 5 second timeout
}

// Create staging pool
const stagingPool = new Pool({
  host: process.env.STAGING_DATABASE_HOST,
  port: parseInt(process.env.STAGING_DATABASE_PORT || '25061'),
  database: process.env.STAGING_DATABASE_NAME,
  user: process.env.STAGING_DATABASE_USERNAME,
  password: process.env.STAGING_DATABASE_PASSWORD,
  ssl: sslConfig,
  ...poolConfig,
})

// Create production pool
const productionPool = new Pool({
  host: process.env.PROD_DATABASE_HOST,
  port: parseInt(process.env.PROD_DATABASE_PORT || '25061'),
  database: process.env.PROD_DATABASE_NAME,
  user: process.env.PROD_DATABASE_USERNAME,
  password: process.env.PROD_DATABASE_PASSWORD,
  ssl: sslConfig,
  ...poolConfig,
})

// Handle pool errors
stagingPool.on('error', (err) => {
  console.error('Staging pool error:', err)
})

productionPool.on('error', (err) => {
  console.error('Production pool error:', err)
})

/**
 * Get the current environment from cookie (defaults to staging)
 */
export async function getEnvironment(): Promise<'staging' | 'production'> {
  try {
    const cookieStore = await cookies()
    const envCookie = cookieStore.get('app_env')
    return envCookie?.value === 'production' ? 'production' : 'staging'
  } catch {
    // cookies() throws in non-request contexts, default to staging
    return 'staging'
  }
}

/**
 * Get the appropriate pool based on environment
 */
async function getPool(): Promise<Pool> {
  const env = await getEnvironment()
  return env === 'production' ? productionPool : stagingPool
}

/**
 * Execute a READ-ONLY query against the database.
 * All queries are wrapped in a read-only transaction for safety.
 */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: (string | number | boolean | null | undefined)[]
): Promise<T[]> {
  const pool = await getPool()
  const client = await pool.connect()
  try {
    // Set transaction to read-only for safety
    await client.query('BEGIN READ ONLY')
    const result = await client.query<T>(text, params)
    await client.query('COMMIT')
    return result.rows
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Database query error:', error)
    throw error
  } finally {
    client.release()
  }
}

/**
 * Execute a single read-only query and return the first row or null
 */
export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: (string | number | boolean | null | undefined)[]
): Promise<T | null> {
  const rows = await query<T>(text, params)
  return rows[0] || null
}

/**
 * Execute a count query and return the number
 */
export async function queryCount(
  text: string,
  params?: (string | number | boolean | null | undefined)[]
): Promise<number> {
  const rows = await query<{ count: string }>(text, params)
  return parseInt(rows[0]?.count || '0', 10)
}

/**
 * Test database connection for given environment
 */
export async function testConnection(env?: 'staging' | 'production'): Promise<boolean> {
  try {
    const pool = env === 'production' ? productionPool : stagingPool
    const client = await pool.connect()
    await client.query('SELECT 1')
    client.release()
    return true
  } catch (error) {
    console.error('Database connection test failed:', error)
    return false
  }
}
