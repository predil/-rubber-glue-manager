const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const result = await pool.query('SELECT * FROM chemical_inventory ORDER BY chemical_name');
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'POST') {
    const { chemical_name, purchase_date, quantity_purchased, unit, total_cost } = req.body;
    const cost_per_unit = total_cost / quantity_purchased;
    
    try {
      const result = await pool.query(
        `INSERT INTO chemical_inventory 
         (chemical_name, purchase_date, quantity_purchased, unit, total_cost, cost_per_unit, remaining_quantity)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [chemical_name, purchase_date, quantity_purchased, unit, total_cost, cost_per_unit, quantity_purchased]
      );
      res.json({ id: result.rows[0].id, message: 'Chemical added successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}