const Airtable = require('airtable');

class AirtableDB {
  constructor() {
    this.base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
  }

  run(sql, params, callback) {
    if (sql.includes('INSERT INTO chemical_inventory')) {
      this.base('Chemicals').create([
        {
          fields: {
            'Chemical Name': params[0],
            'Purchase Date': params[1],
            'Quantity Purchased': params[2],
            'Unit': params[3],
            'Total Cost': params[4],
            'Cost Per Unit': params[5],
            'Remaining Quantity': params[6]
          }
        }
      ], (err, records) => {
        if (err) return callback(err);
        callback(null, { lastID: records[0].id });
      });
    } else {
      callback(null);
    }
  }

  all(sql, params, callback) {
    let tableName = '';
    if (sql.includes('FROM chemical_inventory')) tableName = 'Chemicals';
    else if (sql.includes('FROM customers')) tableName = 'Customers';
    
    if (!tableName) return callback(null, []);
    
    this.base(tableName).select().all((err, records) => {
      if (err) return callback(err);
      
      const data = records.map(record => ({
        id: record.id,
        ...record.fields
      }));
      callback(null, data);
    });
  }

  get(sql, params, callback) {
    this.all(sql, params, (err, rows) => {
      callback(err, rows && rows.length > 0 ? rows[0] : null);
    });
  }

  serialize(fn) { fn(); }
}

module.exports = new AirtableDB();