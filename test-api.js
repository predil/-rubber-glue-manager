// Quick test script for PostgreSQL connection
process.env.DATABASE_URL = 'postgresql://neondb_owner:npg_HXA5qJ8vUzMr@ep-plain-grass-adei6n9c-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const db = require('./server/database');

console.log('Testing PostgreSQL connection...');

// Test database connection
db.all('SELECT * FROM chemical_inventory LIMIT 1', [], (err, rows) => {
  if (err) {
    console.error('Database error:', err.message);
  } else {
    console.log('✅ Database connected successfully');
    console.log('Rows found:', rows.length);
  }
  
  // Test adding a chemical
  db.run(`INSERT INTO chemical_inventory 
          (chemical_name, purchase_date, quantity_purchased, unit, total_cost, cost_per_unit, remaining_quantity)
          VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    ['Test Chemical', '2024-01-15', 5, 'kg', 1000, 200, 5],
    (err) => {
      if (err) {
        console.error('Insert error:', err.message);
      } else {
        console.log('✅ Insert test successful');
      }
      process.exit(0);
    }
  );
});