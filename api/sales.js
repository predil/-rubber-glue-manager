const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const query = `
        SELECT s.*, b.batch_number, c.name as customer_name 
        FROM sales s 
        JOIN batches b ON s.batch_id = b.id 
        JOIN customers c ON s.customer_id = c.id 
        ORDER BY s.sale_date DESC
      `;
      const result = await pool.query(query);
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'POST') {
    const { batch_id, customer_id, quantity_sold, price_per_kg, sale_date } = req.body;
    const total_amount = quantity_sold * price_per_kg;
    
    try {
      const result = await pool.query(
        'INSERT INTO sales (batch_id, customer_id, quantity_sold, price_per_kg, sale_date, total_amount) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [batch_id, customer_id, quantity_sold, price_per_kg, sale_date, total_amount]
      );
      res.json({ id: result.rows[0].id, message: 'Sale recorded successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}