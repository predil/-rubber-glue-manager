const express = require('express');
const cors = require('cors');
const db = require('./database');
const { initializeSampleData } = require('./init-data');
const XLSX = require('xlsx');
const multer = require('multer');

// Skip sample data initialization to avoid database errors
// setTimeout(initializeSampleData, 1000);

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Rubber Glue API Server', status: 'running', database: process.env.DATABASE_URL ? 'PostgreSQL' : 'SQLite' });
});

// Database test route
app.get('/api/test-db', (req, res) => {
  if (!db || !db.all) {
    return res.status(500).json({ error: 'Database not initialized', db_exists: !!db });
  }
  
  db.all('SELECT 1 as test', [], (err, rows) => {
    if (err) {
      console.error('Database test error:', err);
      return res.status(500).json({ error: 'Database connection failed', message: err.message });
    }
    res.json({ status: 'Database connected', test_result: rows });
  });
});

// Add request logging and error handling
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body);
  next();
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Simple demo users (in production, use proper password hashing)
const users = {
  admin: 'password',
  manager: 'manager123'
};

// LOGIN ROUTE
app.post('/api/login', (req, res) => {
  console.log('Login attempt:', req.body);
  const { username, password } = req.body;
  
  console.log('Available users:', Object.keys(users));
  console.log('Checking:', username, password);
  
  if (users[username] && users[username] === password) {
    console.log('Login successful for:', username);
    res.json({ 
      token: 'demo-token-' + username,
      user: { username }
    });
  } else {
    console.log('Login failed for:', username);
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

// Smart AI Features Routes
app.get('/api/smart/anomaly-detection', (req, res) => {
  const query = `
    SELECT 
      b.id, b.batch_number, b.latex_quantity, b.glue_separated,
      b.production_date, b.cost_to_prepare as total_cost,
      b.glue_separated / b.latex_quantity as conversion_rate,
      b.cost_to_prepare / b.glue_separated as cost_per_kg,
      (SELECT AVG(glue_separated / latex_quantity) FROM batches WHERE production_date >= date('now', '-30 days')) as avg_conversion,
      (SELECT AVG(cost_to_prepare / glue_separated) FROM batches WHERE production_date >= date('now', '-30 days')) as avg_cost_per_kg
    FROM batches b
    WHERE b.production_date >= date('now', '-60 days')
    ORDER BY b.production_date DESC
  `;
  
  db.all(query, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    const anomalies = rows.filter(row => {
      if (!row.avg_conversion || !row.avg_cost_per_kg) return false;
      const conversionDeviation = Math.abs(row.conversion_rate - row.avg_conversion) / row.avg_conversion;
      const costDeviation = Math.abs(row.cost_per_kg - row.avg_cost_per_kg) / row.avg_cost_per_kg;
      return conversionDeviation > 0.2 || costDeviation > 0.3;
    }).map(row => ({
      batch_number: row.batch_number,
      date: row.production_date,
      type: Math.abs(row.conversion_rate - row.avg_conversion) / row.avg_conversion > 0.2 ? 'conversion' : 'cost',
      severity: Math.abs(row.conversion_rate - row.avg_conversion) / row.avg_conversion > 0.3 || Math.abs(row.cost_per_kg - row.avg_cost_per_kg) / row.avg_cost_per_kg > 0.5 ? 'high' : 'medium',
      value: row.conversion_rate,
      expected: row.avg_conversion,
      deviation: Math.round(Math.abs(row.conversion_rate - row.avg_conversion) / row.avg_conversion * 100)
    }));
    
    res.json({ anomalies, total_batches: rows.length, anomaly_rate: rows.length > 0 ? Math.round(anomalies.length / rows.length * 100) : 0 });
  });
});

app.get('/api/smart/pricing-suggestions', (req, res) => {
  const query = `
    SELECT 
      b.selling_price_per_kg,
      COUNT(s.id) as sales_count,
      SUM(s.quantity_sold) as total_sold,
      AVG(s.quantity_sold) as avg_quantity,
      b.cost_to_prepare / b.glue_separated as cost_per_kg,
      (b.selling_price_per_kg - b.cost_to_prepare / b.glue_separated) as profit_per_kg
    FROM batches b
    LEFT JOIN sales s ON b.id = s.batch_id
    WHERE b.production_date >= date('now', '-90 days')
    GROUP BY b.selling_price_per_kg, b.cost_to_prepare / b.glue_separated
    HAVING sales_count > 0
  `;
  
  db.all(query, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (rows.length < 2) {
      res.json({ suggestion: 'insufficient_data', optimal_price: null });
      return;
    }
    
    // Calculate demand elasticity and optimal price
    const avgCost = rows.reduce((sum, r) => sum + r.cost_per_kg, 0) / rows.length;
    const pricePoints = rows.map(r => ({ price: r.selling_price_per_kg, demand: r.total_sold, profit: r.profit_per_kg * r.total_sold }));
    
    // Find price with highest total profit
    const optimalPoint = pricePoints.reduce((best, current) => current.profit > best.profit ? current : best);
    
    // AI-suggested price range based on market dynamics
    const marketPrice = avgCost * 1.8; // 80% markup
    const premiumPrice = avgCost * 2.2; // 120% markup
    const competitivePrice = avgCost * 1.5; // 50% markup
    
    res.json({
      current_optimal: optimalPoint.price,
      ai_suggestions: {
        competitive: Math.round(competitivePrice),
        market: Math.round(marketPrice),
        premium: Math.round(premiumPrice)
      },
      recommendation: marketPrice < optimalPoint.price ? 'increase_price' : 'maintain_price',
      expected_impact: Math.round((marketPrice - optimalPoint.price) / optimalPoint.price * 100)
    });
  });
});

app.get('/api/smart/demand-prediction', (req, res) => {
  const query = `
    SELECT 
      DATE(sale_date) as date,
      SUM(quantity_sold) as daily_sales,
      AVG(price_per_kg) as avg_price,
      strftime('%w', sale_date) as day_of_week,
      strftime('%m', sale_date) as month
    FROM sales 
    WHERE sale_date >= date('now', '-180 days')
    GROUP BY DATE(sale_date)
    ORDER BY date
  `;
  
  db.all(query, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (rows.length < 14) {
      res.json({ prediction: 'insufficient_data', confidence: 0 });
      return;
    }
    
    // ML-based prediction using multiple factors
    const weeklyPattern = Array(7).fill(0);
    const monthlyPattern = Array(12).fill(0);
    const weeklyCount = Array(7).fill(0);
    const monthlyCount = Array(12).fill(0);
    
    rows.forEach(row => {
      const dow = parseInt(row.day_of_week);
      const month = parseInt(row.month) - 1;
      weeklyPattern[dow] += row.daily_sales;
      monthlyPattern[month] += row.daily_sales;
      weeklyCount[dow]++;
      monthlyCount[month]++;
    });
    
    // Calculate averages
    for (let i = 0; i < 7; i++) weeklyPattern[i] = weeklyCount[i] > 0 ? weeklyPattern[i] / weeklyCount[i] : 0;
    for (let i = 0; i < 12; i++) monthlyPattern[i] = monthlyCount[i] > 0 ? monthlyPattern[i] / monthlyCount[i] : 0;
    
    // Generate 14-day prediction
    const predictions = [];
    for (let i = 1; i <= 14; i++) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + i);
      const dow = futureDate.getDay();
      const month = futureDate.getMonth();
      
      const weeklyFactor = weeklyPattern[dow] || 0;
      const monthlyFactor = monthlyPattern[month] || 0;
      const trendFactor = rows.length > 30 ? (rows.slice(-7).reduce((sum, r) => sum + r.daily_sales, 0) / 7) : weeklyFactor;
      
      const predicted = (weeklyFactor * 0.4 + monthlyFactor * 0.3 + trendFactor * 0.3);
      
      predictions.push({
        date: futureDate.toISOString().split('T')[0],
        predicted_demand: Math.max(0, Math.round(predicted * 100) / 100),
        confidence: Math.min(90, 60 + (rows.length / 10))
      });
    }
    
    res.json({ predictions, model: 'ensemble', factors: ['weekly_pattern', 'monthly_trend', 'recent_trend'] });
  });
});

app.get('/api/smart/quality-prediction', (req, res) => {
  const { latex_quantity } = req.query;
  
  if (!latex_quantity) {
    res.status(400).json({ error: 'latex_quantity parameter required' });
    return;
  }
  
  const query = `
    SELECT 
      b.latex_quantity,
      b.glue_separated,
      b.glue_separated / b.latex_quantity as conversion_rate,
      b.cost_to_prepare as total_cost,
      (SELECT COUNT(*) FROM returns r JOIN sales s ON r.sale_id = s.id WHERE s.batch_id = b.id) as return_count
    FROM batches b
    WHERE b.production_date >= date('now', '-90 days')
    ORDER BY b.production_date DESC
  `;
  
  db.all(query, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (rows.length < 5) {
      res.json({ prediction: 'insufficient_data', quality_score: null });
      return;
    }
    
    const inputLatex = parseFloat(latex_quantity);
    
    // Find similar batch sizes for comparison
    const similarBatches = rows.filter(r => Math.abs(r.latex_quantity - inputLatex) <= inputLatex * 0.2);
    const allBatches = rows;
    
    // Calculate quality metrics
    const avgConversion = allBatches.reduce((sum, r) => sum + r.conversion_rate, 0) / allBatches.length;
    const avgReturnRate = allBatches.reduce((sum, r) => sum + r.return_count, 0) / allBatches.length;
    
    // Predict conversion rate based on batch size
    let predictedConversion = avgConversion;
    if (similarBatches.length > 0) {
      predictedConversion = similarBatches.reduce((sum, r) => sum + r.conversion_rate, 0) / similarBatches.length;
    }
    
    // Quality score calculation (0-100)
    const conversionScore = Math.min(100, (predictedConversion / 0.85) * 100); // 85% is excellent
    const sizeScore = inputLatex >= 150 && inputLatex <= 200 ? 100 : Math.max(60, 100 - Math.abs(inputLatex - 175) / 2);
    const consistencyScore = similarBatches.length >= 3 ? 90 : 70;
    
    const qualityScore = Math.round((conversionScore * 0.5 + sizeScore * 0.3 + consistencyScore * 0.2));
    
    // Risk assessment
    const riskFactors = [];
    if (inputLatex < 100) riskFactors.push('Small batch size may reduce efficiency');
    if (inputLatex > 250) riskFactors.push('Large batch size may affect quality control');
    if (predictedConversion < avgConversion * 0.9) riskFactors.push('Below average conversion rate expected');
    
    res.json({
      quality_score: qualityScore,
      predicted_conversion: Math.round(predictedConversion * 1000) / 1000,
      expected_glue_output: Math.round(inputLatex * predictedConversion * 100) / 100,
      risk_level: qualityScore >= 80 ? 'low' : qualityScore >= 60 ? 'medium' : 'high',
      risk_factors: riskFactors,
      recommendations: [
        qualityScore < 70 ? 'Consider adjusting batch size to 150-200kg range' : 'Batch size is optimal',
        'Monitor chemical ratios carefully',
        'Ensure proper mixing time and temperature'
      ]
    });
  });
});

// Predictive Analytics Routes
app.get('/api/analytics/demand-forecast', (req, res) => {
  const query = `
    SELECT 
      DATE(sale_date) as date,
      SUM(quantity_sold) as daily_sales,
      COUNT(*) as transaction_count,
      AVG(quantity_sold) as avg_transaction_size
    FROM sales 
    WHERE sale_date >= date('now', '-90 days')
    GROUP BY DATE(sale_date)
    ORDER BY date
  `;
  
  db.all(query, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    // Simple linear regression for trend
    const n = rows.length;
    if (n < 7) {
      res.json({ forecast: [], trend: 'insufficient_data', confidence: 0 });
      return;
    }
    
    const sumX = rows.reduce((sum, _, i) => sum + i, 0);
    const sumY = rows.reduce((sum, row) => sum + row.daily_sales, 0);
    const sumXY = rows.reduce((sum, row, i) => sum + (i * row.daily_sales), 0);
    const sumX2 = rows.reduce((sum, _, i) => sum + (i * i), 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Generate 30-day forecast
    const forecast = [];
    for (let i = 0; i < 30; i++) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + i + 1);
      const predicted = Math.max(0, intercept + slope * (n + i));
      forecast.push({
        date: futureDate.toISOString().split('T')[0],
        predicted_sales: Math.round(predicted * 100) / 100
      });
    }
    
    const trend = slope > 0.1 ? 'increasing' : slope < -0.1 ? 'decreasing' : 'stable';
    const avgSales = sumY / n;
    const confidence = Math.min(95, Math.max(30, 100 - (Math.abs(slope) / avgSales * 100)));
    
    res.json({ forecast, trend, confidence: Math.round(confidence), historical: rows });
  });
});

app.get('/api/analytics/optimal-batch-size', (req, res) => {
  const query = `
    SELECT 
      b.latex_quantity,
      b.glue_separated,
      bc.total_cost,
      (b.glue_separated * b.selling_price_per_kg - bc.total_cost) as profit,
      (b.glue_separated * b.selling_price_per_kg - bc.total_cost) / bc.total_cost * 100 as profit_margin,
      b.glue_separated / b.latex_quantity as conversion_rate
    FROM batches b
    JOIN batch_costs bc ON b.id = bc.batch_id
    WHERE b.latex_quantity > 0 AND bc.total_cost > 0
    ORDER BY b.production_date DESC
    LIMIT 50
  `;
  
  db.all(query, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (rows.length < 5) {
      res.json({ recommendation: 'insufficient_data', optimal_size: null });
      return;
    }
    
    // Group by latex quantity ranges
    const ranges = {
      '50-100': [], '100-150': [], '150-200': [], '200-250': [], '250+': []
    };
    
    rows.forEach(row => {
      const qty = row.latex_quantity;
      if (qty <= 100) ranges['50-100'].push(row);
      else if (qty <= 150) ranges['100-150'].push(row);
      else if (qty <= 200) ranges['150-200'].push(row);
      else if (qty <= 250) ranges['200-250'].push(row);
      else ranges['250+'].push(row);
    });
    
    // Calculate average metrics for each range
    const analysis = Object.entries(ranges)
      .filter(([_, data]) => data.length > 0)
      .map(([range, data]) => ({
        range,
        count: data.length,
        avg_profit_margin: data.reduce((sum, r) => sum + r.profit_margin, 0) / data.length,
        avg_conversion_rate: data.reduce((sum, r) => sum + r.conversion_rate, 0) / data.length,
        avg_profit: data.reduce((sum, r) => sum + r.profit, 0) / data.length
      }));
    
    // Find optimal range
    const optimal = analysis.reduce((best, current) => 
      current.avg_profit_margin > best.avg_profit_margin ? current : best
    );
    
    res.json({ 
      analysis, 
      optimal_range: optimal.range,
      recommendation: `Optimal batch size: ${optimal.range}kg latex`,
      expected_margin: Math.round(optimal.avg_profit_margin * 100) / 100
    });
  });
});

app.get('/api/analytics/chemical-reorder-alerts', (req, res) => {
  const query = `
    SELECT 
      chemical_name,
      remaining_quantity,
      unit,
      cost_per_unit,
      (SELECT AVG(usage) FROM (
        SELECT 
          CASE chemical_name
            WHEN 'Coconut Oil' THEN (b.latex_quantity * 0.19 / 17)
            WHEN 'KOH' THEN (b.latex_quantity * 0.05 / 17)
            WHEN 'HEC' THEN (b.latex_quantity * 0.135 / 17)
            WHEN 'Sodium Benzoate' THEN (b.latex_quantity * 0.17 / 17)
            WHEN 'Ammonia' THEN (b.latex_quantity * 0.1 / 17)
          END as usage
        FROM batches b
        WHERE b.production_date >= date('now', '-30 days')
      ) WHERE usage IS NOT NULL) as avg_daily_usage
    FROM chemical_inventory
    GROUP BY chemical_name
  `;
  
  db.all(query, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    const alerts = rows.map(row => {
      const dailyUsage = row.avg_daily_usage || 0;
      const daysRemaining = dailyUsage > 0 ? Math.floor(row.remaining_quantity / dailyUsage) : 999;
      const reorderPoint = dailyUsage * 14; // 2 weeks buffer
      const suggestedOrder = Math.max(reorderPoint * 2, row.remaining_quantity * 0.5);
      
      return {
        chemical: row.chemical_name,
        current_stock: row.remaining_quantity,
        unit: row.unit,
        days_remaining: daysRemaining,
        daily_usage: Math.round(dailyUsage * 1000) / 1000,
        reorder_needed: row.remaining_quantity <= reorderPoint,
        suggested_order_qty: Math.round(suggestedOrder * 100) / 100,
        estimated_cost: Math.round(suggestedOrder * row.cost_per_unit),
        urgency: daysRemaining <= 7 ? 'high' : daysRemaining <= 14 ? 'medium' : 'low'
      };
    });
    
    res.json({ alerts, total_reorder_cost: alerts.reduce((sum, a) => sum + (a.reorder_needed ? a.estimated_cost : 0), 0) });
  });
});

app.get('/api/analytics/price-optimization', (req, res) => {
  const query = `
    SELECT 
      b.selling_price_per_kg,
      AVG(s.quantity_sold) as avg_quantity_sold,
      COUNT(s.id) as sales_count,
      SUM(s.quantity_sold) as total_sold,
      bc.total_cost / b.glue_separated as cost_per_kg,
      (b.selling_price_per_kg - bc.total_cost / b.glue_separated) as profit_per_kg
    FROM batches b
    JOIN batch_costs bc ON b.id = bc.batch_id
    LEFT JOIN sales s ON b.id = s.batch_id
    WHERE b.production_date >= date('now', '-90 days')
    GROUP BY b.selling_price_per_kg, bc.total_cost / b.glue_separated
    HAVING sales_count > 0
    ORDER BY b.selling_price_per_kg
  `;
  
  db.all(query, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (rows.length < 3) {
      res.json({ recommendation: 'insufficient_data', optimal_price: null });
      return;
    }
    
    // Calculate price elasticity and optimal price
    const priceAnalysis = rows.map(row => ({
      price: row.selling_price_per_kg,
      demand: row.total_sold,
      profit_per_kg: row.profit_per_kg,
      total_profit: row.total_sold * row.profit_per_kg,
      sales_velocity: row.total_sold / 90 // daily average
    }));
    
    // Find price with highest total profit
    const optimalPrice = priceAnalysis.reduce((best, current) => 
      current.total_profit > best.total_profit ? current : best
    );
    
    // Calculate current average cost
    const avgCostPerKg = rows.reduce((sum, r) => sum + r.cost_per_kg, 0) / rows.length;
    const minPrice = avgCostPerKg * 1.2; // 20% minimum margin
    const maxPrice = avgCostPerKg * 2.5; // 150% maximum margin
    
    res.json({
      price_analysis: priceAnalysis,
      optimal_price: optimalPrice.price,
      current_avg_cost: Math.round(avgCostPerKg),
      recommended_range: {
        min: Math.round(minPrice),
        max: Math.round(maxPrice)
      },
      recommendation: `Optimal price: LKR ${optimalPrice.price}/kg for maximum profit`,
      expected_daily_sales: Math.round(optimalPrice.sales_velocity * 100) / 100
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
  if (!db || !db.all) {
    return res.status(500).json({ error: 'Database not initialized' });
  }
  
  db.all(`SELECT *, 
          (remaining_quantity / quantity_purchased * 100) as stock_percentage
          FROM chemical_inventory 
          WHERE (remaining_quantity / quantity_purchased * 100) < 20
          ORDER BY stock_percentage ASC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
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

if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log(`Access from phone: http://[YOUR_PC_IP]:${PORT}`);
  });
}

module.exports = app;