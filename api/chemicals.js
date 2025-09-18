import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const result = await pool.query('SELECT * FROM chemical_inventory ORDER BY chemical_name');
      return res.json(result.rows);
    } 
    
    if (req.method === 'POST') {
      const { chemical_name, purchase_date, quantity_purchased, unit, total_cost } = req.body;
      const cost_per_unit = total_cost / quantity_purchased;
      
      const result = await pool.query(
        'INSERT INTO chemical_inventory (chemical_name, purchase_date, quantity_purchased, unit, total_cost, cost_per_unit, remaining_quantity) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
        [chemical_name, purchase_date, quantity_purchased, unit, total_cost, cost_per_unit, quantity_purchased]
      );
      return res.json({ id: result.rows[0].id, message: 'Chemical added successfully' });
    }
    
    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: error.message });
  }
}