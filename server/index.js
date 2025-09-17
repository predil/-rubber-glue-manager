const express = require('express');
const cors = require('cors');
const db = require('./database');

const app = express();
const PORT = 5000;

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// Add request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body);
  next();
});

// Simple demo users (in production, use proper password hashing)
const users = {
  admin: 'admin123',
  manager: 'manager123'
};

// LOGIN ROUTE
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  if (users[username] && users[username] === password) {
    res.json({ 
      token: 'demo-token-' + username,
      user: { username }
    });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

// BATCHES ROUTES
app.get('/api/batches', (req, res) => {
  db.all('SELECT * FROM batches ORDER BY batch_number DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/batches', (req, res) => {
  const { latex_quantity, glue_separated, production_date, cost_to_prepare, selling_price_per_kg, notes } = req.body;
  
  db.run(
    'INSERT INTO batches (latex_quantity, glue_separated, production_date, cost_to_prepare, selling_price_per_kg, notes) VALUES (?, ?, ?, ?, ?, ?)',
    [latex_quantity, glue_separated, production_date, cost_to_prepare, selling_price_per_kg, notes || ''],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      
      db.get('SELECT * FROM batches WHERE id = ?', [this.lastID], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row);
      });
    }
  );
});

app.put('/api/batches/:id', (req, res) => {
  const { latex_quantity, glue_separated, production_date, cost_to_prepare, selling_price_per_kg, notes } = req.body;
  
  db.run(
    'UPDATE batches SET latex_quantity=?, glue_separated=?, production_date=?, cost_to_prepare=?, selling_price_per_kg=?, notes=? WHERE id=?',
    [latex_quantity, glue_separated, production_date, cost_to_prepare, selling_price_per_kg, notes || '', req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Batch updated successfully' });
    }
  );
});

app.delete('/api/batches/:id', (req, res) => {
  db.run('DELETE FROM batches WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Batch deleted successfully' });
  });
});

// CUSTOMERS ROUTES
app.get('/api/customers', (req, res) => {
  db.all('SELECT * FROM customers ORDER BY name', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/customers', (req, res) => {
  const { name, contact_info } = req.body;
  
  db.run('INSERT INTO customers (name, contact_info) VALUES (?, ?)', [name, contact_info || ''], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    
    db.get('SELECT * FROM customers WHERE id = ?', [this.lastID], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(row);
    });
  });
});

// SALES ROUTES
app.get('/api/sales', (req, res) => {
  const query = `
    SELECT s.*, b.batch_number, c.name as customer_name 
    FROM sales s 
    JOIN batches b ON s.batch_id = b.id 
    JOIN customers c ON s.customer_id = c.id 
    ORDER BY s.sale_date DESC
  `;
  
  db.all(query, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/sales', (req, res) => {
  const { batch_id, customer_id, quantity_sold, price_per_kg, sale_date } = req.body;
  const total_amount = quantity_sold * price_per_kg;
  
  db.run(
    'INSERT INTO sales (batch_id, customer_id, quantity_sold, price_per_kg, sale_date, total_amount) VALUES (?, ?, ?, ?, ?, ?)',
    [batch_id, customer_id, quantity_sold, price_per_kg, sale_date, total_amount],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, message: 'Sale recorded successfully' });
    }
  );
});

// ANALYTICS ROUTES
app.get('/api/analytics/summary', (req, res) => {
  const queries = {
    totalLatex: 'SELECT SUM(latex_quantity) as total FROM batches',
    totalGlue: 'SELECT SUM(glue_separated) as total FROM batches',
    totalSales: 'SELECT SUM(total_amount) as total FROM sales',
    totalCosts: 'SELECT SUM(cost_to_prepare) as total FROM batches'
  };

  const results = {};
  let completed = 0;

  Object.keys(queries).forEach(key => {
    db.get(queries[key], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      results[key] = row.total || 0;
      completed++;
      
      if (completed === Object.keys(queries).length) {
        results.totalProfit = results.totalSales - results.totalCosts;
        res.json(results);
      }
    });
  });
});

app.get('/api/analytics/monthly', (req, res) => {
  const query = `
    SELECT 
      strftime('%Y-%m', production_date) as month,
      SUM(latex_quantity) as latex_used,
      SUM(glue_separated) as glue_produced,
      COUNT(*) as batches_count
    FROM batches 
    GROUP BY strftime('%Y-%m', production_date)
    ORDER BY month DESC
    LIMIT 12
  `;
  
  db.all(query, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log(`Access from phone: http://[YOUR_PC_IP]:${PORT}`);
});