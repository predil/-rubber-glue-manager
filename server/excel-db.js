const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

class ExcelDB {
  constructor() {
    this.filePath = path.join(__dirname, 'rubber_glue_data.xlsx');
    this.initializeWorkbook();
  }

  initializeWorkbook() {
    if (!fs.existsSync(this.filePath)) {
      const wb = XLSX.utils.book_new();
      
      // Create sheets with headers
      const sheets = {
        batches: [['id', 'batch_number', 'latex_quantity', 'glue_separated', 'production_date', 'cost_to_prepare', 'selling_price_per_kg', 'notes']],
        customers: [['id', 'name', 'contact_info']],
        sales: [['id', 'batch_id', 'customer_id', 'quantity_sold', 'price_per_kg', 'sale_date', 'total_amount']],
        chemical_inventory: [['id', 'chemical_name', 'purchase_date', 'quantity_purchased', 'unit', 'total_cost', 'cost_per_unit', 'remaining_quantity']],
        monthly_costs: [['id', 'month_year', 'labour_cost', 'other_costs']],
        latex_transport: [['id', 'transport_date', 'total_cans', 'total_latex_kg', 'transport_cost', 'cost_per_kg', 'notes']]
      };

      Object.keys(sheets).forEach(sheetName => {
        const ws = XLSX.utils.aoa_to_sheet(sheets[sheetName]);
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      });

      XLSX.writeFile(wb, this.filePath);
      console.log('✅ Excel database initialized');
    }
  }

  getSheet(sheetName) {
    const wb = XLSX.readFile(this.filePath);
    const ws = wb.Sheets[sheetName];
    return ws ? XLSX.utils.sheet_to_json(ws) : [];
  }

  saveSheet(sheetName, data) {
    const wb = XLSX.readFile(this.filePath);
    const ws = XLSX.utils.json_to_sheet(data);
    wb.Sheets[sheetName] = ws;
    XLSX.writeFile(wb, this.filePath);
  }

  run(sql, params = [], callback = () => {}) {
    try {
      if (sql.includes('INSERT INTO')) {
        const tableName = sql.match(/INSERT INTO (\w+)/)[1];
        const data = this.getSheet(tableName);
        const newId = data.length > 0 ? Math.max(...data.map(r => r.id || 0)) + 1 : 1;
        
        let newRow = { id: newId };
        
        if (tableName === 'chemical_inventory') {
          newRow = {
            id: newId,
            chemical_name: params[0],
            purchase_date: params[1],
            quantity_purchased: params[2],
            unit: params[3],
            total_cost: params[4],
            cost_per_unit: params[5],
            remaining_quantity: params[6]
          };
        } else if (tableName === 'customers') {
          newRow = {
            id: newId,
            name: params[0],
            contact_info: params[1] || ''
          };
        } else if (tableName === 'batches') {
          newRow = {
            id: newId,
            latex_quantity: params[0],
            glue_separated: params[1],
            production_date: params[2],
            cost_to_prepare: params[3],
            selling_price_per_kg: params[4],
            notes: params[5] || ''
          };
        }
        
        data.push(newRow);
        this.saveSheet(tableName, data);
        callback(null, { lastID: newId });
      } else {
        callback(null);
      }
    } catch (err) {
      callback(err);
    }
  }

  all(sql, params, callback) {
    try {
      let tableName = '';
      if (sql.includes('FROM chemical_inventory')) tableName = 'chemical_inventory';
      else if (sql.includes('FROM customers')) tableName = 'customers';
      else if (sql.includes('FROM batches')) tableName = 'batches';
      else if (sql.includes('FROM sales')) tableName = 'sales';
      else if (sql.includes('FROM monthly_costs')) tableName = 'monthly_costs';
      else if (sql.includes('FROM latex_transport')) tableName = 'latex_transport';
      
      const data = this.getSheet(tableName);
      callback(null, data);
    } catch (err) {
      callback(err);
    }
  }

  get(sql, params, callback) {
    this.all(sql, params, (err, rows) => {
      callback(err, rows && rows.length > 0 ? rows[0] : null);
    });
  }

  serialize(fn) { fn(); }
}

module.exports = new ExcelDB();