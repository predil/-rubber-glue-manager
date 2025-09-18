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