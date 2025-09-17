const { Pool } = require('pg');

// Use PostgreSQL if DATABASE_URL is provided, otherwise fallback to SQLite
const usePostgres = process.env.DATABASE_URL;

let db;

if (usePostgres) {
  console.log('Using PostgreSQL database');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  // Initialize PostgreSQL tables
  const initTables = async () => {
    try {
      // Batches table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS batches (
          id SERIAL PRIMARY KEY,
          batch_number INTEGER UNIQUE,
          latex_quantity DECIMAL NOT NULL,
          glue_separated DECIMAL NOT NULL,
          production_date DATE NOT NULL,
          cost_to_prepare DECIMAL NOT NULL,
          selling_price_per_kg DECIMAL NOT NULL,
          notes TEXT
        )
      `);

      // Customers table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS customers (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          contact_info TEXT
        )
      `);

      // Sales table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS sales (
          id SERIAL PRIMARY KEY,
          batch_id INTEGER NOT NULL REFERENCES batches(id),
          customer_id INTEGER NOT NULL REFERENCES customers(id),
          quantity_sold DECIMAL NOT NULL,
          price_per_kg DECIMAL NOT NULL,
          sale_date DATE NOT NULL,
          total_amount DECIMAL NOT NULL
        )
      `);

      // Create function for auto-incrementing batch numbers
      await pool.query(`
        CREATE OR REPLACE FUNCTION set_batch_number()
        RETURNS TRIGGER AS $$
        BEGIN
          IF NEW.batch_number IS NULL THEN
            NEW.batch_number := COALESCE((SELECT MAX(batch_number) FROM batches), 0) + 1;
          END IF;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `);

      // Create trigger
      await pool.query(`
        DROP TRIGGER IF EXISTS auto_batch_number ON batches;
        CREATE TRIGGER auto_batch_number
          BEFORE INSERT ON batches
          FOR EACH ROW
          EXECUTE FUNCTION set_batch_number();
      `);

      console.log('PostgreSQL tables initialized');
    } catch (error) {
      console.error('Error initializing PostgreSQL tables:', error);
    }
  };

  initTables();

  // Wrapper to make PostgreSQL work like SQLite
  db = {
    all: (query, params, callback) => {
      if (typeof params === 'function') {
        callback = params;
        params = [];
      }
      pool.query(query, params)
        .then(result => callback(null, result.rows))
        .catch(err => callback(err));
    },
    
    get: (query, params, callback) => {
      if (typeof params === 'function') {
        callback = params;
        params = [];
      }
      pool.query(query, params)
        .then(result => callback(null, result.rows[0]))
        .catch(err => callback(err));
    },
    
    run: (query, params, callback) => {
      if (typeof params === 'function') {
        callback = params;
        params = [];
      }
      pool.query(query, params)
        .then(result => {
          const mockThis = { lastID: result.rows[0]?.id, changes: result.rowCount };
          if (callback) callback.call(mockThis, null);
        })
        .catch(err => {
          if (callback) callback(err);
        });
    }
  };

} else {
  // Fallback to SQLite
  console.log('Using SQLite database');
  db = require('./database');
}

module.exports = db;