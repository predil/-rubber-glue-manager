const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  console.log('❌ Please set DATABASE_URL environment variable');
  console.log('Example: set DATABASE_URL=postgresql://user:pass@host/db');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  try {
    console.log('🔄 Starting database migration...');

    // Add new tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS returns (
        id SERIAL PRIMARY KEY,
        sale_id INTEGER NOT NULL,
        return_date TEXT NOT NULL,
        quantity_returned DECIMAL NOT NULL,
        reason TEXT,
        refund_amount DECIMAL NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sale_id) REFERENCES sales (id)
      )
    `);
    console.log('✅ Returns table created');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS company_settings (
        id SERIAL PRIMARY KEY,
        company_name TEXT DEFAULT 'Rubber Glue Sales',
        address TEXT,
        phone TEXT,
        email TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Company settings table created');

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
    console.log('✅ Chemical inventory table created');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS monthly_costs (
        id SERIAL PRIMARY KEY,
        month_year TEXT NOT NULL,
        labour_cost DECIMAL NOT NULL,
        other_costs DECIMAL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Monthly costs table created');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS latex_transport (
        id SERIAL PRIMARY KEY,
        transport_date TEXT NOT NULL,
        total_cans INTEGER NOT NULL,
        total_latex_kg DECIMAL NOT NULL,
        transport_cost DECIMAL NOT NULL,
        cost_per_kg DECIMAL NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Latex transport table created');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS batch_costs (
        id SERIAL PRIMARY KEY,
        batch_id INTEGER NOT NULL,
        labour_cost DECIMAL NOT NULL,
        transportation_cost DECIMAL NOT NULL,
        chemical_cost DECIMAL NOT NULL,
        total_cost DECIMAL NOT NULL,
        FOREIGN KEY (batch_id) REFERENCES batches (id)
      )
    `);
    console.log('✅ Batch costs table created');

    // Insert default data
    const { rows: companyCount } = await pool.query('SELECT COUNT(*) as count FROM company_settings');
    if (companyCount[0].count == 0) {
      await pool.query(`
        INSERT INTO company_settings (company_name, address, phone, email) 
        VALUES ($1, $2, $3, $4)
      `, ['Rubber Glue Sales', 'Your Address Here', 'Your Phone', 'your@email.com']);
      console.log('✅ Default company settings inserted');
    }

    const { rows: chemicalCount } = await pool.query('SELECT COUNT(*) as count FROM chemical_inventory');
    if (chemicalCount[0].count == 0) {
      const defaultChemicals = [
        ['Coconut Oil', '2024-01-01', 25, 'kg', 7500, 300, 25],
        ['KOH', '2024-01-01', 10, 'kg', 2000, 200, 10],
        ['HEC', '2024-01-01', 5, 'kg', 3000, 600, 5],
        ['Sodium Benzoate', '2024-01-01', 5, 'kg', 1500, 300, 5],
        ['Ammonia', '2024-01-01', 20, 'L', 1000, 50, 20]
      ];
      
      for (const [name, date, qty, unit, cost, perUnit, remaining] of defaultChemicals) {
        await pool.query(`
          INSERT INTO chemical_inventory 
          (chemical_name, purchase_date, quantity_purchased, unit, total_cost, cost_per_unit, remaining_quantity)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [name, date, qty, unit, cost, perUnit, remaining]);
      }
      console.log('✅ Default chemicals inserted');
    }

    const { rows: costsCount } = await pool.query('SELECT COUNT(*) as count FROM monthly_costs');
    if (costsCount[0].count == 0) {
      const currentMonth = new Date().toISOString().substring(0, 7);
      await pool.query(`
        INSERT INTO monthly_costs (month_year, labour_cost, other_costs) 
        VALUES ($1, $2, $3)
      `, [currentMonth, 45000, 5000]);
      console.log('✅ Default monthly costs inserted');
    }

    const { rows: transportCount } = await pool.query('SELECT COUNT(*) as count FROM latex_transport');
    if (transportCount[0].count == 0) {
      const today = new Date().toISOString().split('T')[0];
      await pool.query(`
        INSERT INTO latex_transport (transport_date, total_cans, total_latex_kg, transport_cost, cost_per_kg, notes) 
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [today, 12, 240, 2400, 10, 'Default transport data']);
      console.log('✅ Default transport data inserted');
    }

    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await pool.end();
  }
}

migrate();