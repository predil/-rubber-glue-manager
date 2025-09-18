const { Pool } = require('pg');

module.exports = async (req, res) => {
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    const result = await pool.query('SELECT COUNT(*) FROM chemical_inventory');
    
    res.json({
      success: true,
      count: result.rows[0].count
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message
    });
  }
};