require('dotenv').config();

function translateSql(sql) {
  let text = sql
    .replace(/DATEDIFF\(\s*([^,]+?)\s*,\s*CURDATE\(\)\s*\)/gi, '($1 - CURRENT_DATE)')
    .replace(/DATE_ADD\(\s*CURDATE\(\)\s*,\s*INTERVAL\s+(\d+)\s+DAY\s*\)/gi, "CURRENT_DATE + INTERVAL '$1 days'")
    .replace(/DATE\(\s*([a-zA-Z0-9_.]+)\s*\)/gi, '($1)::date')
    .replace(/CURDATE\(\)/gi, 'CURRENT_DATE');

  let index = 0;
  text = text.replace(/\?/g, () => `$${++index}`);
  return text;
}

function wrapResult(sql, result) {
  const isInsert = /^\s*insert\s+/i.test(sql);
  if (isInsert) {
    return [{
      insertId: result.rows[0] ? result.rows[0].id : undefined,
      affectedRows: result.rowCount
    }];
  }
  return [result.rows];
}

if (process.env.DATABASE_URL) {
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  async function query(sql, params) {
    let text = translateSql(sql);
    if (/^\s*insert\s+/i.test(sql) && !/returning\s+/i.test(text)) {
      text += ' RETURNING id';
    }
    const result = await pool.query(text, params);
    return wrapResult(sql, result);
  }

  async function getConnection() {
    const client = await pool.connect();
    return {
      async query(sql, params) {
        let text = translateSql(sql);
        if (/^\s*insert\s+/i.test(sql) && !/returning\s+/i.test(text)) {
          text += ' RETURNING id';
        }
        const result = await client.query(text, params);
        return wrapResult(sql, result);
      },
      async beginTransaction() {
        await client.query('BEGIN');
      },
      async commit() {
        await client.query('COMMIT');
      },
      async rollback() {
        await client.query('ROLLBACK');
      },
      release() {
        client.release();
      }
    };
  }

  module.exports = { query, getConnection };
} else {
  const mysql = require('mysql2/promise');
  module.exports = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'pharmacy_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 20000
  });
}
