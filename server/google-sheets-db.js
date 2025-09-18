const { GoogleSpreadsheet } = require('google-spreadsheet');

class GoogleSheetsDB {
  constructor() {
    this.doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID);
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    
    await this.doc.useServiceAccountAuth({
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    });
    
    await this.doc.loadInfo();
    this.initialized = true;
  }

  async run(sql, params, callback) {
    try {
      await this.init();
      
      if (sql.includes('INSERT INTO chemical_inventory')) {
        const sheet = this.doc.sheetsByTitle['chemicals'] || await this.doc.addSheet({ title: 'chemicals' });
        
        const row = await sheet.addRow({
          chemical_name: params[0],
          purchase_date: params[1],
          quantity_purchased: params[2],
          unit: params[3],
          total_cost: params[4],
          cost_per_unit: params[5],
          remaining_quantity: params[6]
        });
        
        callback(null, { lastID: row.rowNumber });
      } else {
        callback(null);
      }
    } catch (err) {
      callback(err);
    }
  }

  async all(sql, params, callback) {
    try {
      await this.init();
      
      let sheetName = '';
      if (sql.includes('FROM chemical_inventory')) sheetName = 'chemicals';
      else if (sql.includes('FROM customers')) sheetName = 'customers';
      
      const sheet = this.doc.sheetsByTitle[sheetName];
      if (!sheet) return callback(null, []);
      
      const rows = await sheet.getRows();
      const data = rows.map(row => row.toObject());
      callback(null, data);
    } catch (err) {
      callback(err);
    }
  }

  async get(sql, params, callback) {
    this.all(sql, params, (err, rows) => {
      callback(err, rows && rows.length > 0 ? rows[0] : null);
    });
  }

  serialize(fn) { fn(); }
}

module.exports = new GoogleSheetsDB();