const { Pool } = require('pg');

export default async function handler(req, res) {
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    // Test connection
    const result = await pool.query('SELECT NOW()');
    
    // Try to create table
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

    // Test insert
    if (req.method === 'POST') {
      const testData = {
        chemical_name: 'Test Chemical',
        purchase_date: '2024-01-01',
        quantity_purchased: 10,
        unit: 'kg',
        total_cost: 1000
      };
      
      const cost_per_unit = testData.total_cost / testData.quantity_purchased;
      
      const insertResult = await pool.query(
        `INSERT INTO chemical_inventory 
         (chemical_name, purchase_date, quantity_purchased, unit, total_cost, cost_per_unit, remaining_quantity)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [testData.chemical_name, testData.purchase_date, testData.quantity_purchased, 
         testData.unit, testData.total_cost, cost_per_unit, testData.quantity_purchased]
      );
      
      res.json({ success: true, inserted: insertResult.rows[0] });
    } else {
      res.json({ success: true, time: result.rows[0].now, message: 'Database connected' });
    }
    
  } catch (error) {
    res.status(500).json({ error: error.message, stack: error.stack });
  }
}