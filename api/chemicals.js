const { Pool } = require('pg');

export default async function handler(req, res) {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Create table with NUMERIC instead of DECIMAL
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chemical_inventory (
        id SERIAL PRIMARY KEY,
        chemical_name TEXT NOT NULL,
        purchase_date TEXT NOT NULL,
        quantity_purchased NUMERIC NOT NULL,
        unit TEXT NOT NULL,
        total_cost NUMERIC NOT NULL,
        cost_per_unit NUMERIC NOT NULL,
        remaining_quantity NUMERIC NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    if (req.method === 'GET') {
      const result = await pool.query('SELECT * FROM chemical_inventory ORDER BY chemical_name');
      res.json(result.rows);
    } else if (req.method === 'POST') {
      const { chemical_name, purchase_date, quantity_purchased, unit, total_cost } = req.body;
      
      if (!chemical_name || !purchase_date || !quantity_purchased || !unit || !total_cost) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      const cost_per_unit = parseFloat(total_cost) / parseFloat(quantity_purchased);
      
      const result = await pool.query(
        `INSERT INTO chemical_inventory 
         (chemical_name, purchase_date, quantity_purchased, unit, total_cost, cost_per_unit, remaining_quantity)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [chemical_name, purchase_date, parseFloat(quantity_purchased), unit, 
         parseFloat(total_cost), cost_per_unit, parseFloat(quantity_purchased)]
      );
      res.json({ id: result.rows[0].id, message: 'Chemical added successfully', data: result.rows[0] });
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Chemicals API Error:', error);
    res.status(500).json({ error: error.message, details: error.stack });
  } finally {
    await pool.end();
  }
}