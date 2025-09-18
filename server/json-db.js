const fs = require('fs');
const path = require('path');

class JsonDB {
  constructor() {
    this.dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  getTable(tableName) {
    const filePath = path.join(this.dataDir, `${tableName}.json`);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify([]));
      return [];
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }

  saveTable(tableName, data) {
    const filePath = path.join(this.dataDir, `${tableName}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }

  run(sql, params, callback) {
    // Simple INSERT simulation
    if (sql.includes('INSERT INTO')) {
      const tableName = sql.match(/INSERT INTO (\w+)/)[1];
      const data = this.getTable(tableName);
      const newId = data.length > 0 ? Math.max(...data.map(r => r.id || 0)) + 1 : 1;
      
      // Parse values (simplified)
      const newRow = { id: newId };
      if (tableName === 'chemicals') {
        newRow.chemical_name = params[0];
        newRow.purchase_date = params[1];
        newRow.quantity_purchased = params[2];
        newRow.unit = params[3];
        newRow.total_cost = params[4];
        newRow.cost_per_unit = params[5];
        newRow.remaining_quantity = params[6];
      }
      
      data.push(newRow);
      this.saveTable(tableName, data);
      callback(null, { lastID: newId });
    } else {
      callback(null);
    }
  }

  all(sql, params, callback) {
    if (sql.includes('FROM chemical_inventory')) {
      callback(null, this.getTable('chemicals'));
    } else {
      callback(null, []);
    }
  }

  get(sql, params, callback) {
    this.all(sql, params, (err, rows) => {
      callback(err, rows ? rows[0] : null);
    });
  }

  serialize(fn) { fn(); }
}

module.exports = new JsonDB();