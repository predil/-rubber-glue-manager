const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const result = await pool.query('SELECT * FROM monthly_costs ORDER BY month_year DESC');
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'POST') {
    const { month_year, labour_cost, other_costs } = req.body;
    
    try {
      await pool.query(
        `INSERT INTO monthly_costs (month_year, labour_cost, other_costs) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (month_year) DO UPDATE SET 
         labour_cost = EXCLUDED.labour_cost, 
         other_costs = EXCLUDED.other_costs`,
        [month_year, labour_cost, other_costs || 0]
      );
      res.json({ message: 'Monthly costs updated successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}