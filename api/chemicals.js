export default async function handler(req, res) {
  const { Pool } = require('pg');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    if (req.method === 'GET') {
      const result = await pool.query('SELECT * FROM chemical_inventory ORDER BY chemical_name');
      return res.json(result.rows);
    } 
    
    if (req.method === 'POST') {
      const { chemical_name, purchase_date, quantity_purchased, unit, total_cost } = req.body;
      
      if (!chemical_name || !purchase_date || !quantity_purchased || !unit || !total_cost) {
        return res.status(400).json({ error: 'All fields are required' });
      }
      
      const cost_per_unit = parseFloat(total_cost) / parseFloat(quantity_purchased);
      
      const result = await pool.query(
        `INSERT INTO chemical_inventory 
         (chemical_name, purchase_date, quantity_purchased, unit, total_cost, cost_per_unit, remaining_quantity)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [chemical_name, purchase_date, parseFloat(quantity_purchased), unit, parseFloat(total_cost), cost_per_unit, parseFloat(quantity_purchased)]
      );
      
      return res.json({ 
        success: true,
        message: 'Chemical added successfully', 
        data: result.rows[0] 
      });
    }
    
    return res.status(405).json({ message: 'Method not allowed' });
    
  } catch (error) {
    console.error('Chemical API Error:', error);
    return res.status(500).json({ 
      error: 'Database error', 
      message: error.message,
      hint: 'Try visiting /api/init-db first to initialize the database'
    });
  }
}