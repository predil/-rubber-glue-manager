const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Ensure table exists
const initTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS chemical_inventory (
      id SERIAL PRIMARY KEY,
      chemical_name TEXT NOT NULL,
      purchase_date TEXT NOT NULL,
      quantity_purchased DECIMAL NOT NULL,
      unit TEXT NOT NULL,
      total_cost DECIMAL NOT NULL,
      cost_per_unit DECIMAL NOT NULL,
      remaining_quantity DECIMAL NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

export default async function handler(req, res) {
  try {
    await initTable();
    
    if (req.method === 'GET') {
      const result = await pool.query('SELECT * FROM chemical_inventory ORDER BY chemical_name');
      res.json(result.rows);
    } else if (req.method === 'POST') {
      const { chemical_name, purchase_date, quantity_purchased, unit, total_cost } = req.body;
      const cost_per_unit = total_cost / quantity_purchased;
      
      const result = await pool.query(
        `INSERT INTO chemical_inventory 
         (chemical_name, purchase_date, quantity_purchased, unit, total_cost, cost_per_unit, remaining_quantity)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [chemical_name, purchase_date, quantity_purchased, unit, total_cost, cost_per_unit, quantity_purchased]
      );
      res.json({ id: result.rows[0].id, message: 'Chemical added successfully' });
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}