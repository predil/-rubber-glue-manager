const { Pool } = require('pg');

// Use Neon PostgreSQL for production, SQLite for local development
let db;

if (process.env.DATABASE_URL) {
  // Production: Use Neon PostgreSQL
  console.log('Using PostgreSQL (Neon)');
  
  let pool;
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
  } catch (error) {
    console.error('Failed to create pool:', error);
    pool = null;
  }
  
  db = {
    run: (sql, params = [], callback = () => {}) => {
      if (!pool) return callback(new Error('Database not connected'));
      pool.query(sql, params).then(() => callback()).catch(callback);
    },
    get: (sql, params = [], callback) => {
      if (!pool) return callback(new Error('Database not connected'));
      pool.query(sql, params).then(result => callback(null, result.rows[0])).catch(callback);
    },
    all: (sql, params = [], callback) => {
      if (!pool) return callback(new Error('Database not connected'));
      pool.query(sql, params).then(result => callback(null, result.rows)).catch(callback);
    },
    serialize: (fn) => fn()
  };
} else {
  // Local development: Use SQLite
  console.log('Using SQLite (Local)');
  const sqlite3 = require('sqlite3').verbose();
  const path = require('path');
  const dbPath = path.join(__dirname, 'rubber_glue.db');
  db = new sqlite3.Database(dbPath);
}

// Initialize database tables
db.serialize(() => {
  const isPostgres = !!process.env.DATABASE_URL;
  const autoIncrement = isPostgres ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';
  const timestamp = isPostgres ? 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' : 'DATETIME DEFAULT CURRENT_TIMESTAMP';
  
  // Batches table
  db.run(`CREATE TABLE IF NOT EXISTS batches (
    id ${autoIncrement},
    batch_number INTEGER UNIQUE,
    latex_quantity DECIMAL NOT NULL,
    glue_separated DECIMAL NOT NULL,
    production_date TEXT NOT NULL,
    cost_to_prepare DECIMAL NOT NULL,
    selling_price_per_kg DECIMAL NOT NULL,
    notes TEXT
  )`);

  // Customers table
  db.run(`CREATE TABLE IF NOT EXISTS customers (
    id ${autoIncrement},
    name TEXT NOT NULL,
    contact_info TEXT
  )`);

  // Sales table
  db.run(`CREATE TABLE IF NOT EXISTS sales (
    id ${autoIncrement},
    batch_id INTEGER NOT NULL,
    customer_id INTEGER NOT NULL,
    quantity_sold DECIMAL NOT NULL,
    price_per_kg DECIMAL NOT NULL,
    sale_date TEXT NOT NULL,
    total_amount DECIMAL NOT NULL,
    FOREIGN KEY (batch_id) REFERENCES batches (id),
    FOREIGN KEY (customer_id) REFERENCES customers (id)
  )`);

  // Returns table
  db.run(`CREATE TABLE IF NOT EXISTS returns (
    id ${autoIncrement},
    sale_id INTEGER NOT NULL,
    return_date TEXT NOT NULL,
    quantity_returned DECIMAL NOT NULL,
    reason TEXT,
    refund_amount DECIMAL NOT NULL,
    created_at ${timestamp},
    FOREIGN KEY (sale_id) REFERENCES sales (id)
  )`);

  // Company settings table
  db.run(`CREATE TABLE IF NOT EXISTS company_settings (
    id ${autoIncrement},
    company_name TEXT DEFAULT 'Rubber Glue Sales',
    address TEXT,
    phone TEXT,
    email TEXT,
    updated_at ${timestamp}
  )`);

  // Chemical inventory table
  db.run(`CREATE TABLE IF NOT EXISTS chemical_inventory (
    id ${autoIncrement},
    chemical_name TEXT NOT NULL,
    purchase_date TEXT NOT NULL,
    quantity_purchased DECIMAL NOT NULL,
    unit TEXT NOT NULL,
    total_cost DECIMAL NOT NULL,
    cost_per_unit DECIMAL NOT NULL,
    remaining_quantity DECIMAL NOT NULL,
    created_at ${timestamp}
  )`);

  // Monthly costs table
  db.run(`CREATE TABLE IF NOT EXISTS monthly_costs (
    id ${autoIncrement},
    month_year TEXT NOT NULL,
    labour_cost DECIMAL NOT NULL,
    other_costs DECIMAL DEFAULT 0,
    created_at ${timestamp}
  )`);

  // Latex transport table
  db.run(`CREATE TABLE IF NOT EXISTS latex_transport (
    id ${autoIncrement},
    transport_date TEXT NOT NULL,
    total_cans INTEGER NOT NULL,
    total_latex_kg DECIMAL NOT NULL,
    transport_cost DECIMAL NOT NULL,
    cost_per_kg DECIMAL NOT NULL,
    notes TEXT,
    created_at ${timestamp}
  )`);

  // Batch cost breakdown table
  db.run(`CREATE TABLE IF NOT EXISTS batch_costs (
    id ${autoIncrement},
    batch_id INTEGER NOT NULL,
    labour_cost DECIMAL NOT NULL,
    transportation_cost DECIMAL NOT NULL,
    chemical_cost DECIMAL NOT NULL,
    total_cost DECIMAL NOT NULL,
    FOREIGN KEY (batch_id) REFERENCES batches (id)
  )`);

  // Insert default data
  setTimeout(() => {
    db.get('SELECT COUNT(*) as count FROM company_settings', (err, row) => {
      if (!err && (!row || row.count === 0)) {
        db.run(`INSERT INTO company_settings (company_name, address, phone, email) 
                VALUES ($1, $2, $3, $4)`, 
          ['Rubber Glue Sales', 'Your Address Here', 'Your Phone', 'your@email.com']);
      }
    });

    db.get('SELECT COUNT(*) as count FROM chemical_inventory', (err, row) => {
      if (!err && (!row || row.count === 0)) {
        const defaultChemicals = [
          ['Coconut Oil', '2024-01-01', 25, 'kg', 7500, 300, 25],
          ['KOH', '2024-01-01', 10, 'kg', 2000, 200, 10],
          ['HEC', '2024-01-01', 5, 'kg', 3000, 600, 5],
          ['Sodium Benzoate', '2024-01-01', 5, 'kg', 1500, 300, 5],
          ['Ammonia', '2024-01-01', 20, 'L', 1000, 50, 20]
        ];
        
        defaultChemicals.forEach(([name, date, qty, unit, cost, perUnit, remaining]) => {
          db.run(`INSERT INTO chemical_inventory 
                  (chemical_name, purchase_date, quantity_purchased, unit, total_cost, cost_per_unit, remaining_quantity)
                  VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [name, date, qty, unit, cost, perUnit, remaining]);
        });
      }
    });

    db.get('SELECT COUNT(*) as count FROM monthly_costs', (err, row) => {
      if (!err && (!row || row.count === 0)) {
        const currentMonth = new Date().toISOString().substring(0, 7);
        db.run(`INSERT INTO monthly_costs (month_year, labour_cost, other_costs) 
                VALUES ($1, $2, $3)`, [currentMonth, 45000, 5000]);
      }
    });

    db.get('SELECT COUNT(*) as count FROM latex_transport', (err, row) => {
      if (!err && (!row || row.count === 0)) {
        const today = new Date().toISOString().split('T')[0];
        db.run(`INSERT INTO latex_transport (transport_date, total_cans, total_latex_kg, transport_cost, cost_per_kg, notes) 
                VALUES ($1, $2, $3, $4, $5, $6)`, [today, 12, 240, 2400, 10, 'Default transport data']);
      }
    });
  }, 1000);
});

module.exports = db;