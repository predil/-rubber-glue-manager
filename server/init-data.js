const db = require('./database');

// Initialize with sample data if database is empty
function initializeSampleData() {
  db.get('SELECT COUNT(*) as count FROM batches', (err, row) => {
    if (err) {
      console.error('Error checking batches:', err);
      return;
    }
    
    if (row.count === 0) {
      console.log('Initializing with sample data...');
      
      // Add sample customers
      const customers = [
        { name: 'ABC Rubber Co.', contact_info: '077-123-4567' },
        { name: 'XYZ Industries', contact_info: 'xyz@email.com' },
        { name: 'Local Supplier', contact_info: '011-234-5678' }
      ];
      
      customers.forEach(customer => {
        db.run('INSERT INTO customers (name, contact_info) VALUES (?, ?)', 
          [customer.name, customer.contact_info]);
      });
      
      // Add sample batches
      const batches = [
        {
          latex_quantity: 100,
          glue_separated: 25,
          production_date: '2024-01-15',
          cost_to_prepare: 15000,
          selling_price_per_kg: 800,
          notes: 'First batch of the year'
        },
        {
          latex_quantity: 150,
          glue_separated: 35,
          production_date: '2024-01-20',
          cost_to_prepare: 22000,
          selling_price_per_kg: 850,
          notes: 'High quality latex'
        }
      ];
      
      batches.forEach(batch => {
        db.run(`INSERT INTO batches (latex_quantity, glue_separated, production_date, 
          cost_to_prepare, selling_price_per_kg, notes) VALUES (?, ?, ?, ?, ?, ?)`,
          [batch.latex_quantity, batch.glue_separated, batch.production_date,
           batch.cost_to_prepare, batch.selling_price_per_kg, batch.notes]);
      });
      
      console.log('Sample data initialized');
    }
  });
}

module.exports = { initializeSampleData };