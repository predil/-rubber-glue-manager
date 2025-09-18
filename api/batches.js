const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const result = await pool.query('SELECT * FROM batches ORDER BY batch_number DESC');
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'POST') {
    const { latex_quantity, glue_separated, production_date, cost_to_prepare, selling_price_per_kg, notes } = req.body;
    
    try {
      const result = await pool.query(
        'INSERT INTO batches (latex_quantity, glue_separated, production_date, cost_to_prepare, selling_price_per_kg, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [latex_quantity, glue_separated, production_date, cost_to_prepare, selling_price_per_kg, notes || '']
      );
      res.json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}