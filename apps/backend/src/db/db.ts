// db.ts
import { Kysely } from 'kysely'
import { Pool, types } from 'pg'
import { PostgresDialect } from 'kysely'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
console.log(__dirname)
console.log('env path:', path.resolve(__dirname, '../../../../.env'))

dotenv.config({
  path: path.resolve(__dirname, '../../../../.env'),
})

import { Database } from './types'


console.log("DB CONFIG:", {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  db: process.env.DB_NAME,
})

types.setTypeParser(20, (value) => Number(value)); // PostgreSQL bigint (int8)
const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
})

export async function testDb() {
  const res = await pool.query("SELECT 1 as ok")
  console.log("DB CONNECTION OK:", res.rows)
}

export const db = new Kysely<Database>({
  dialect: new PostgresDialect({
    pool,
  }),
  log(event): void {
    if (event.level === 'error') {
      console.log(event.query.sql)
      console.log(event.query.parameters)
    }
  }
})