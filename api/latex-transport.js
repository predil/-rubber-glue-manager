const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const result = await pool.query('SELECT * FROM latex_transport ORDER BY transport_date DESC');
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'POST') {
    const { transport_date, total_cans, transport_cost, notes } = req.body;
    const total_latex_kg = total_cans * 20;
    const cost_per_kg = transport_cost / total_latex_kg;
    
    try {
      const result = await pool.query(
        `INSERT INTO latex_transport (transport_date, total_cans, total_latex_kg, transport_cost, cost_per_kg, notes)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [transport_date, total_cans, total_latex_kg, transport_cost, cost_per_kg, notes || '']
      );
      res.json({ id: result.rows[0].id, message: 'Transport record added successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}