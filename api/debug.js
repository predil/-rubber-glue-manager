import { Pool } from 'pg';

export default async function handler(req, res) {
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    const result = await pool.query('SELECT COUNT(*) FROM chemical_inventory');
    const chemicals = await pool.query('SELECT * FROM chemical_inventory LIMIT 3');
    
    res.json({
      success: true,
      count: result.rows[0].count,
      sample_data: chemicals.rows
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
      database_url_exists: !!process.env.DATABASE_URL
    });
  }
}