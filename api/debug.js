const { Pool } = require('pg');

export default async function handler(req, res) {
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    const result = await pool.query('SELECT * FROM chemical_inventory LIMIT 5');
    
    res.json({
      success: true,
      database_url_exists: !!process.env.DATABASE_URL,
      row_count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      database_url_exists: !!process.env.DATABASE_URL
    });
  }
}