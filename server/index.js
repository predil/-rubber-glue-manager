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
      
      // Update chemical inventory based on recipe usage
      const ratio = latex_quantity / 170; // Base recipe for 170kg
      const chemicalUsage = {
        'Coconut Oil': 0.19 * ratio,
        'KOH': 0.05 * ratio,
        'HEC': 0.135 * ratio,
        'Sodium Benzoate': 0.17 * ratio,
        'Ammonia': 0.1 * ratio
      };
      
      // Update remaining quantities
      Object.keys(chemicalUsage).forEach(chemName => {
        const usedAmount = chemicalUsage[chemName];
        db.run(
          'UPDATE chemical_inventory SET remaining_quantity = remaining_quantity - ? WHERE chemical_name = ? AND remaining_quantity >= ?',
          [usedAmount, chemName, usedAmount],
          (err) => {
            if (err) console.error(`Error updating ${chemName}:`, err);
          }
        );
      });
      
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

// Advanced Analytics Routes
app.get('/api/analytics/profit-trends', (req, res) => {
  const query = `
    SELECT 
      strftime('%Y-%m', b.production_date) as month,
      SUM(s.total_amount) as revenue,
      SUM(b.cost_to_prepare) as costs,
      (SUM(s.total_amount) - SUM(b.cost_to_prepare)) as profit,
      ((SUM(s.total_amount) - SUM(b.cost_to_prepare)) / SUM(s.total_amount) * 100) as profit_margin
    FROM batches b
    LEFT JOIN sales s ON b.id = s.batch_id
    WHERE s.id IS NOT NULL
    GROUP BY strftime('%Y-%m', b.production_date)
    ORDER BY month DESC
    LIMIT 12
  `;
  
  db.all(query, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/analytics/customer-profitability', (req, res) => {
  const query = `
    SELECT 
      c.name,
      c.contact_info,
      COUNT(s.id) as total_orders,
      SUM(s.quantity_sold) as total_quantity,
      SUM(s.total_amount) as total_revenue,
      AVG(s.price_per_kg) as avg_price_per_kg,
      MIN(s.sale_date) as first_order,
      MAX(s.sale_date) as last_order,
      (julianday('now') - julianday(MAX(s.sale_date))) as days_since_last_order
    FROM customers c
    JOIN sales s ON c.id = s.customer_id
    GROUP BY c.id, c.name
    ORDER BY total_revenue DESC
  `;
  
  db.all(query, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/analytics/seasonal-patterns', (req, res) => {
  const query = `
    SELECT 
      CASE strftime('%m', sale_date)
        WHEN '01' THEN 'January'
        WHEN '02' THEN 'February'
        WHEN '03' THEN 'March'
        WHEN '04' THEN 'April'
        WHEN '05' THEN 'May'
        WHEN '06' THEN 'June'
        WHEN '07' THEN 'July'
        WHEN '08' THEN 'August'
        WHEN '09' THEN 'September'
        WHEN '10' THEN 'October'
        WHEN '11' THEN 'November'
        WHEN '12' THEN 'December'
      END as month_name,
      strftime('%m', sale_date) as month_num,
      COUNT(*) as total_sales,
      SUM(quantity_sold) as total_quantity,
      SUM(total_amount) as total_revenue,
      AVG(quantity_sold) as avg_order_size
    FROM sales
    GROUP BY strftime('%m', sale_date)
    ORDER BY month_num
  `;
  
  db.all(query, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/analytics/cost-efficiency', (req, res) => {
  const query = `
    SELECT 
      b.batch_number,
      b.production_date,
      b.latex_quantity,
      b.glue_separated,
      b.cost_to_prepare as actual_cost,
      (b.glue_separated / b.latex_quantity * 100) as conversion_rate,
      (b.cost_to_prepare / b.glue_separated) as cost_per_kg_glue,
      COALESCE(SUM(s.total_amount), 0) as revenue_generated,
      COALESCE(SUM(s.total_amount) - b.cost_to_prepare, -b.cost_to_prepare) as profit
    FROM batches b
    LEFT JOIN sales s ON b.id = s.batch_id
    GROUP BY b.id
    ORDER BY b.production_date DESC
  `;
  
  db.all(query, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/analytics/waste-analysis', (req, res) => {
  const query = `
    SELECT 
      strftime('%Y-%m', production_date) as month,
      COUNT(*) as total_batches,
      SUM(latex_quantity) as total_latex,
      SUM(glue_separated) as total_glue,
      AVG(glue_separated / latex_quantity * 100) as avg_conversion_rate,
      MIN(glue_separated / latex_quantity * 100) as min_conversion_rate,
      MAX(glue_separated / latex_quantity * 100) as max_conversion_rate,
      (SUM(latex_quantity) - SUM(glue_separated)) as total_waste
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

app.get('/api/chemicals/low-stock', (req, res) => {
  // Check for chemicals with less than 20% remaining
  db.all(`SELECT *, 
          (remaining_quantity / quantity_purchased * 100) as stock_percentage
          FROM chemical_inventory 
          WHERE (remaining_quantity / quantity_purchased * 100) < 20
          ORDER BY stock_percentage ASC`, (err, rows) => {
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
  const { month_year, labour_cost, other_costs } = req.body;
  
  db.run(`INSERT OR REPLACE INTO monthly_costs 
          (month_year, labour_cost, other_costs)
          VALUES (?, ?, ?)`,
    [month_year, labour_cost, other_costs || 0],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Monthly costs updated successfully' });
    }
  );
});

app.get('/api/latex-transport', (req, res) => {
  db.all('SELECT * FROM latex_transport ORDER BY transport_date DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/latex-transport', (req, res) => {
  const { transport_date, total_cans, transport_cost, notes } = req.body;
  const total_latex_kg = total_cans * 20; // 20kg per can
  const cost_per_kg = transport_cost / total_latex_kg;
  
  db.run(`INSERT INTO latex_transport 
          (transport_date, total_cans, total_latex_kg, transport_cost, cost_per_kg, notes)
          VALUES (?, ?, ?, ?, ?, ?)`,
    [transport_date, total_cans, total_latex_kg, transport_cost, cost_per_kg, notes || ''],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, message: 'Transport record added successfully' });
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
    
    // Get latest transport cost per kg
    db.get('SELECT * FROM latex_transport ORDER BY transport_date DESC LIMIT 1', (err, transport) => {
      if (err) return res.status(500).json({ error: err.message });
      
      const transportCostPerKg = transport ? transport.cost_per_kg : 0;
      
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
        
        // Calculate costs
        const dailyLabour = monthlyCosts.labour_cost / 30;
        const transportationCost = latex_quantity * transportCostPerKg;
        
        const batchCosts = {
          labour_cost: dailyLabour,
          transportation_cost: transportationCost,
          chemical_cost: totalChemicalCost,
          total_cost: dailyLabour + transportationCost + totalChemicalCost,
          chemical_breakdown: chemicalBreakdown,
          transport_per_kg: transportCostPerKg
        };
        
        res.json(batchCosts);
      });
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