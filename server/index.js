const express = require('express');
const cors = require('cors');
const db = require('./postgres-db');
const { initializeSampleData } = require('./init-data');
const XLSX = require('xlsx');
const multer = require('multer');

// Initialize sample data on startup
setTimeout(initializeSampleData, 1000);

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

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
    'INSERT INTO batches (latex_quantity, glue_separated, production_date, cost_to_prepare, selling_price_per_kg, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
    [latex_quantity, glue_separated, production_date, cost_to_prepare, selling_price_per_kg, notes || ''],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      
      const batchId = this.lastID;
      db.get('SELECT * FROM batches WHERE id = $1', [batchId], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row);
      });
    }
  );
});

app.put('/api/batches/:id', (req, res) => {
  const { latex_quantity, glue_separated, production_date, cost_to_prepare, selling_price_per_kg, notes } = req.body;
  
  db.run(
    'UPDATE batches SET latex_quantity=$1, glue_separated=$2, production_date=$3, cost_to_prepare=$4, selling_price_per_kg=$5, notes=$6 WHERE id=$7',
    [latex_quantity, glue_separated, production_date, cost_to_prepare, selling_price_per_kg, notes || '', req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Batch updated successfully' });
    }
  );
});

app.delete('/api/batches/:id', (req, res) => {
  db.run('DELETE FROM batches WHERE id = $1', [req.params.id], function(err) {
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
  
  db.run('INSERT INTO customers (name, contact_info) VALUES ($1, $2) RETURNING id', [name, contact_info || ''], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    
    const customerId = this.lastID;
    db.get('SELECT * FROM customers WHERE id = $1', [customerId], (err, row) => {
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
    'INSERT INTO sales (batch_id, customer_id, quantity_sold, price_per_kg, sale_date, total_amount) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
    [batch_id, customer_id, quantity_sold, price_per_kg, sale_date, total_amount],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, message: 'Sale recorded successfully' });
    }
  );
});

// RETURNS ROUTES
app.get('/api/returns', (req, res) => {
  const query = `
    SELECT r.*, s.sale_date, s.quantity_sold, s.price_per_kg, s.total_amount,
           b.batch_number, c.name as customer_name
    FROM returns r
    JOIN sales s ON r.sale_id = s.id
    JOIN batches b ON s.batch_id = b.id
    JOIN customers c ON s.customer_id = c.id
    ORDER BY r.return_date DESC
  `;
  
  db.all(query, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/returns', (req, res) => {
  const { sale_id, return_date, quantity_returned, reason } = req.body;
  
  // First get the sale details to calculate refund
  db.get('SELECT * FROM sales WHERE id = ?', [sale_id], (err, sale) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!sale) return res.status(404).json({ error: 'Sale not found' });
    
    const refund_amount = quantity_returned * sale.price_per_kg;
    
    db.run(
      'INSERT INTO returns (sale_id, return_date, quantity_returned, reason, refund_amount) VALUES (?, ?, ?, ?, ?)',
      [sale_id, return_date, quantity_returned, reason || '', refund_amount],
      function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ 
          id: this.lastID, 
          message: 'Return recorded successfully',
          refund_amount: refund_amount
        });
      }
    );
  });
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

// COST MANAGEMENT ROUTES
app.get('/api/chemicals', (req, res) => {
  db.all('SELECT * FROM chemical_inventory ORDER BY chemical_name', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/chemicals', (req, res) => {
  const { chemical_name, purchase_date, quantity_purchased, unit, total_cost } = req.body;
  const cost_per_unit = total_cost / quantity_purchased;
  
  db.run(`INSERT INTO chemical_inventory 
          (chemical_name, purchase_date, quantity_purchased, unit, total_cost, cost_per_unit, remaining_quantity)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [chemical_name, purchase_date, quantity_purchased, unit, total_cost, cost_per_unit, quantity_purchased],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, message: 'Chemical added successfully' });
    }
  );
});

app.get('/api/monthly-costs', (req, res) => {
  db.all('SELECT * FROM monthly_costs ORDER BY month_year DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/monthly-costs', (req, res) => {
  const { month_year, labour_cost, transportation_cost, other_costs } = req.body;
  
  db.run(`INSERT OR REPLACE INTO monthly_costs 
          (month_year, labour_cost, transportation_cost, other_costs)
          VALUES (?, ?, ?, ?)`,
    [month_year, labour_cost, transportation_cost, other_costs || 0],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Monthly costs updated successfully' });
    }
  );
});

app.post('/api/calculate-batch-cost', (req, res) => {
  const { latex_quantity, production_date } = req.body;
  
  // Get monthly costs for the production month
  const monthYear = production_date.substring(0, 7); // YYYY-MM
  
  db.get('SELECT * FROM monthly_costs WHERE month_year = ?', [monthYear], (err, monthlyCosts) => {
    if (err) return res.status(500).json({ error: err.message });
    
    if (!monthlyCosts) {
      return res.status(400).json({ error: 'Monthly costs not set for ' + monthYear });
    }
    
    // Calculate chemical costs based on recipe
    const ratio = latex_quantity / 170; // Base recipe for 170kg
    const chemicalUsage = {
      'Coconut Oil': 0.19 * ratio,
      'KOH': 0.05 * ratio,
      'HEC': 0.135 * ratio,
      'Sodium Benzoate': 0.17 * ratio,
      'Ammonia': 0.1 * ratio // Estimated ammonia usage
    };
    
    // Get chemical costs
    db.all('SELECT * FROM chemical_inventory', (err, chemicals) => {
      if (err) return res.status(500).json({ error: err.message });
      
      let totalChemicalCost = 0;
      const chemicalBreakdown = {};
      
      Object.keys(chemicalUsage).forEach(chemName => {
        const chemical = chemicals.find(c => c.chemical_name === chemName);
        if (chemical) {
          const cost = chemicalUsage[chemName] * chemical.cost_per_unit;
          totalChemicalCost += cost;
          chemicalBreakdown[chemName] = {
            quantity: chemicalUsage[chemName],
            unit: chemical.unit,
            cost: cost
          };
        }
      });
      
      // Assume 30 working days per month, distribute monthly costs
      const dailyLabour = monthlyCosts.labour_cost / 30;
      const dailyTransport = monthlyCosts.transportation_cost / 30;
      
      const batchCosts = {
        labour_cost: dailyLabour,
        transportation_cost: dailyTransport,
        chemical_cost: totalChemicalCost,
        total_cost: dailyLabour + dailyTransport + totalChemicalCost,
        chemical_breakdown: chemicalBreakdown
      };
      
      res.json(batchCosts);
    });
  });
});

// COMPANY SETTINGS ROUTES
app.get('/api/settings', (req, res) => {
  db.get('SELECT * FROM company_settings ORDER BY id DESC LIMIT 1', (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row || { company_name: 'Rubber Glue Sales', address: '', phone: '', email: '' });
  });
});

app.post('/api/settings', (req, res) => {
  const { company_name, address, phone, email } = req.body;
  
  db.run(`INSERT OR REPLACE INTO company_settings (id, company_name, address, phone, email, updated_at) 
          VALUES (1, ?, ?, ?, ?, datetime('now'))`,
    [company_name, address, phone, email],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Settings updated successfully' });
    }
  );
});

// BACKUP & RESTORE ROUTES
app.get('/api/backup', (req, res) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `rubber-glue-backup-${timestamp}.xlsx`;
  
  // Get all data
  Promise.all([
    new Promise((resolve, reject) => {
      db.all('SELECT * FROM batches ORDER BY batch_number', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    }),
    new Promise((resolve, reject) => {
      db.all('SELECT * FROM customers ORDER BY name', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    }),
    new Promise((resolve, reject) => {
      db.all(`SELECT s.*, b.batch_number, c.name as customer_name 
              FROM sales s 
              JOIN batches b ON s.batch_id = b.id 
              JOIN customers c ON s.customer_id = c.id 
              ORDER BY s.sale_date DESC`, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    })
  ])
  .then(([batches, customers, sales]) => {
    // Create Excel workbook
    const wb = XLSX.utils.book_new();
    
    // Add batches sheet
    const batchesWS = XLSX.utils.json_to_sheet(batches);
    XLSX.utils.book_append_sheet(wb, batchesWS, 'Batches');
    
    // Add customers sheet
    const customersWS = XLSX.utils.json_to_sheet(customers);
    XLSX.utils.book_append_sheet(wb, customersWS, 'Customers');
    
    // Add sales sheet
    const salesWS = XLSX.utils.json_to_sheet(sales);
    XLSX.utils.book_append_sheet(wb, salesWS, 'Sales');
    
    // Generate buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    // Send file
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  })
  .catch(error => {
    console.error('Backup error:', error);
    res.status(500).json({ error: 'Failed to create backup' });
  });
});

app.post('/api/restore', upload.single('backup'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No backup file provided' });
  }
  
  try {
    // Read Excel file
    const workbook = XLSX.readFile(req.file.path);
    
    // Get data from sheets
    const batches = XLSX.utils.sheet_to_json(workbook.Sheets['Batches'] || {});
    const customers = XLSX.utils.sheet_to_json(workbook.Sheets['Customers'] || {});
    const sales = XLSX.utils.sheet_to_json(workbook.Sheets['Sales'] || {});
    
    // Clear existing data
    db.run('DELETE FROM sales', (err) => {
      if (err) throw err;
      
      db.run('DELETE FROM batches', (err) => {
        if (err) throw err;
        
        db.run('DELETE FROM customers', (err) => {
          if (err) throw err;
          
          // Insert customers first
          let customersInserted = 0;
          customers.forEach(customer => {
            db.run('INSERT INTO customers (id, name, contact_info) VALUES ($1, $2, $3)',
              [customer.id, customer.name, customer.contact_info || ''], (err) => {
                if (err) console.error('Customer insert error:', err);
                customersInserted++;
                
                if (customersInserted === customers.length) {
                  // Insert batches
                  let batchesInserted = 0;
                  batches.forEach(batch => {
                    db.run(`INSERT INTO batches (id, batch_number, latex_quantity, glue_separated, 
                            production_date, cost_to_prepare, selling_price_per_kg, notes) 
                            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                      [batch.id, batch.batch_number, batch.latex_quantity, batch.glue_separated,
                       batch.production_date, batch.cost_to_prepare, batch.selling_price_per_kg, batch.notes || ''], (err) => {
                        if (err) console.error('Batch insert error:', err);
                        batchesInserted++;
                        
                        if (batchesInserted === batches.length) {
                          // Insert sales
                          let salesInserted = 0;
                          sales.forEach(sale => {
                            db.run(`INSERT INTO sales (id, batch_id, customer_id, quantity_sold, 
                                    price_per_kg, sale_date, total_amount) 
                                    VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                              [sale.id, sale.batch_id, sale.customer_id, sale.quantity_sold,
                               sale.price_per_kg, sale.sale_date, sale.total_amount], (err) => {
                                if (err) console.error('Sale insert error:', err);
                                salesInserted++;
                                
                                if (salesInserted === sales.length) {
                                  res.json({ 
                                    message: 'Data restored successfully',
                                    batches: batches.length,
                                    customers: customers.length,
                                    sales: sales.length
                                  });
                                }
                              });
                          });
                          
                          if (sales.length === 0) {
                            res.json({ 
                              message: 'Data restored successfully',
                              batches: batches.length,
                              customers: customers.length,
                              sales: 0
                            });
                          }
                        }
                      });
                  });
                  
                  if (batches.length === 0) {
                    res.json({ 
                      message: 'Data restored successfully',
                      batches: 0,
                      customers: customers.length,
                      sales: 0
                    });
                  }
                }
              });
          });
          
          if (customers.length === 0) {
            res.json({ 
              message: 'Data restored successfully',
              batches: 0,
              customers: 0,
              sales: 0
            });
          }
        });
      });
    });
    
  } catch (error) {
    console.error('Restore error:', error);
    res.status(500).json({ error: 'Failed to restore backup: ' + error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log(`Access from phone: http://[YOUR_PC_IP]:${PORT}`);
});