const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  try {
    // Create all tables
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

    await pool.query(`
      CREATE TABLE IF NOT EXISTS batches (
        id SERIAL PRIMARY KEY,
        batch_number INTEGER UNIQUE,
        latex_quantity NUMERIC NOT NULL,
        glue_separated NUMERIC NOT NULL,
        production_date TEXT NOT NULL,
        cost_to_prepare NUMERIC NOT NULL,
        selling_price_per_kg NUMERIC NOT NULL,
        notes TEXT
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        contact_info TEXT
      )
    `);

    // Insert default chemicals if none exist
    const chemCount = await pool.query('SELECT COUNT(*) FROM chemical_inventory');
    if (chemCount.rows[0].count == 0) {
      const defaultChemicals = [
        ['Coconut Oil', '2024-01-01', 25, 'kg', 7500, 300, 25],
        ['KOH', '2024-01-01', 10, 'kg', 2000, 200, 10],
        ['HEC', '2024-01-01', 5, 'kg', 3000, 600, 5],
        ['Sodium Benzoate', '2024-01-01', 5, 'kg', 1500, 300, 5],
        ['Ammonia', '2024-01-01', 20, 'L', 1000, 50, 20]
      ];
      
      for (const [name, date, qty, unit, cost, perUnit, remaining] of defaultChemicals) {
        await pool.query(
          `INSERT INTO chemical_inventory 
           (chemical_name, purchase_date, quantity_purchased, unit, total_cost, cost_per_unit, remaining_quantity)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [name, date, qty, unit, cost, perUnit, remaining]
        );
      }
    }

    res.json({ success: true, message: 'Database initialized successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}