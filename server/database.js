const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Use persistent storage path on Render, fallback to local for development
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'rubber_glue.db');
console.log('Database path:', dbPath);
const db = new sqlite3.Database(dbPath);

// Initialize database tables
db.serialize(() => {
  // Batches table
  db.run(`CREATE TABLE IF NOT EXISTS batches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_number INTEGER UNIQUE,
    latex_quantity REAL NOT NULL,
    glue_separated REAL NOT NULL,
    production_date TEXT NOT NULL,
    cost_to_prepare REAL NOT NULL,
    selling_price_per_kg REAL NOT NULL,
    notes TEXT
  )`);

  // Customers table
  db.run(`CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    contact_info TEXT
  )`);

  // Sales table
  db.run(`CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_id INTEGER NOT NULL,
    customer_id INTEGER NOT NULL,
    quantity_sold REAL NOT NULL,
    price_per_kg REAL NOT NULL,
    sale_date TEXT NOT NULL,
    total_amount REAL NOT NULL,
    FOREIGN KEY (batch_id) REFERENCES batches (id),
    FOREIGN KEY (customer_id) REFERENCES customers (id)
  )`);

  // Returns table
  db.run(`CREATE TABLE IF NOT EXISTS returns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER NOT NULL,
    return_date TEXT NOT NULL,
    quantity_returned REAL NOT NULL,
    reason TEXT,
    refund_amount REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sale_id) REFERENCES sales (id)
  )`);

  // Company settings table
  db.run(`CREATE TABLE IF NOT EXISTS company_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_name TEXT DEFAULT 'Rubber Glue Sales',
    address TEXT,
    phone TEXT,
    email TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Insert default company settings if not exists
  db.get('SELECT COUNT(*) as count FROM company_settings', (err, row) => {
    if (!err && row.count === 0) {
      db.run(`INSERT INTO company_settings (company_name, address, phone, email) 
              VALUES ('Rubber Glue Sales', 'Your Address Here', 'Your Phone', 'your@email.com')`);
    }
  });

  // Chemical inventory table
  db.run(`CREATE TABLE IF NOT EXISTS chemical_inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chemical_name TEXT NOT NULL,
    purchase_date TEXT NOT NULL,
    quantity_purchased REAL NOT NULL,
    unit TEXT NOT NULL,
    total_cost REAL NOT NULL,
    cost_per_unit REAL NOT NULL,
    remaining_quantity REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Monthly costs table (only labour now)
  db.run(`CREATE TABLE IF NOT EXISTS monthly_costs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    month_year TEXT NOT NULL,
    labour_cost REAL NOT NULL,
    other_costs REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Latex transport table (batch-wise)
  db.run(`CREATE TABLE IF NOT EXISTS latex_transport (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transport_date TEXT NOT NULL,
    total_cans INTEGER NOT NULL,
    total_latex_kg REAL NOT NULL,
    transport_cost REAL NOT NULL,
    cost_per_kg REAL NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Batch cost breakdown table
  db.run(`CREATE TABLE IF NOT EXISTS batch_costs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_id INTEGER NOT NULL,
    labour_cost REAL NOT NULL,
    transportation_cost REAL NOT NULL,
    chemical_cost REAL NOT NULL,
    total_cost REAL NOT NULL,
    FOREIGN KEY (batch_id) REFERENCES batches (id)
  )`);

  // Insert default chemicals if not exists
  db.get('SELECT COUNT(*) as count FROM chemical_inventory', (err, row) => {
    if (!err && row.count === 0) {
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
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [name, date, qty, unit, cost, perUnit, remaining]);
      });
    }
  });

  // Insert default monthly costs if not exists
  db.get('SELECT COUNT(*) as count FROM monthly_costs', (err, row) => {
    if (!err && row.count === 0) {
      const currentMonth = new Date().toISOString().substring(0, 7);
      db.run(`INSERT INTO monthly_costs (month_year, labour_cost, other_costs) 
              VALUES (?, ?, ?)`, [currentMonth, 45000, 5000]);
    }
  });

  // Insert default transport data if not exists
  db.get('SELECT COUNT(*) as count FROM latex_transport', (err, row) => {
    if (!err && row.count === 0) {
      const today = new Date().toISOString().split('T')[0];
      db.run(`INSERT INTO latex_transport (transport_date, total_cans, total_latex_kg, transport_cost, cost_per_kg, notes) 
              VALUES (?, ?, ?, ?, ?, ?)`, [today, 12, 240, 2400, 10, 'Default transport data']);
    }
  });

  // Create trigger to auto-increment batch_number
  db.run(`CREATE TRIGGER IF NOT EXISTS auto_batch_number 
    AFTER INSERT ON batches 
    WHEN NEW.batch_number IS NULL
    BEGIN
      UPDATE batches SET batch_number = (
        SELECT COALESCE(MAX(batch_number), 0) + 1 FROM batches WHERE id != NEW.id
      ) WHERE id = NEW.id;
    END`);
});

module.exports = db;