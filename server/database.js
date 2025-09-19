const { Pool } = require('pg');

// Use Neon PostgreSQL for production, SQLite for local development
let db;

if (process.env.DATABASE_URL) {
  // Production: Use Neon PostgreSQL
  console.log('Using PostgreSQL (Neon)');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  db = {
    run: (sql, params = [], callback = () => {}) => {
      if (typeof params === 'function') {
        callback = params;
        params = [];
      }
      pool.query(sql, params)
        .then(result => callback(null, result))
        .catch(err => callback(err));
    },
    get: (sql, params = [], callback) => {
      if (typeof params === 'function') {
        callback = params;
        params = [];
      }
      pool.query(sql, params)
        .then(result => callback(null, result.rows[0] || null))
        .catch(err => callback(err));
    },
    all: (sql, params = [], callback) => {
      if (typeof params === 'function') {
        callback = params;
        params = [];
      }
      pool.query(sql, params)
        .then(result => callback(null, result.rows || []))
        .catch(err => callback(err));
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

  console.log('Database tables created');
});

module.exports = db;