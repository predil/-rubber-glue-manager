const db = require('./database');

// Sample data
const sampleCustomers = [
  { name: 'ABC Rubber Co.', contact_info: '077-123-4567' },
  { name: 'Lanka Exports Ltd.', contact_info: '011-234-5678' },
  { name: 'Green Valley Industries', contact_info: '076-987-6543' }
];

const sampleBatches = [
  {
    latex_quantity: 100,
    glue_separated: 85,
    production_date: '2024-01-15',
    cost_to_prepare: 15000,
    selling_price_per_kg: 250,
    notes: 'Good quality batch'
  },
  {
    latex_quantity: 120,
    glue_separated: 95,
    production_date: '2024-01-20',
    cost_to_prepare: 18000,
    selling_price_per_kg: 260,
    notes: 'Premium grade'
  },
  {
    latex_quantity: 80,
    glue_separated: 70,
    production_date: '2024-01-25',
    cost_to_prepare: 12000,
    selling_price_per_kg: 240,
    notes: ''
  }
];

console.log('Seeding database...');

// Insert customers
sampleCustomers.forEach(customer => {
  db.run('INSERT INTO customers (name, contact_info) VALUES (?, ?)', 
    [customer.name, customer.contact_info], 
    function(err) {
      if (err) console.error('Error inserting customer:', err);
      else console.log(`Customer ${customer.name} added with ID: ${this.lastID}`);
    }
  );
});

// Insert batches
sampleBatches.forEach(batch => {
  db.run('INSERT INTO batches (latex_quantity, glue_separated, production_date, cost_to_prepare, selling_price_per_kg, notes) VALUES (?, ?, ?, ?, ?, ?)',
    [batch.latex_quantity, batch.glue_separated, batch.production_date, batch.cost_to_prepare, batch.selling_price_per_kg, batch.notes],
    function(err) {
      if (err) console.error('Error inserting batch:', err);
      else console.log(`Batch added with ID: ${this.lastID}`);
    }
  );
});

// Insert sample sales
setTimeout(() => {
  const sampleSales = [
    { batch_id: 1, customer_id: 1, quantity_sold: 30, price_per_kg: 250, sale_date: '2024-01-16' },
    { batch_id: 1, customer_id: 2, quantity_sold: 25, price_per_kg: 250, sale_date: '2024-01-18' },
    { batch_id: 2, customer_id: 3, quantity_sold: 40, price_per_kg: 260, sale_date: '2024-01-22' }
  ];

  sampleSales.forEach(sale => {
    const total_amount = sale.quantity_sold * sale.price_per_kg;
    db.run('INSERT INTO sales (batch_id, customer_id, quantity_sold, price_per_kg, sale_date, total_amount) VALUES (?, ?, ?, ?, ?, ?)',
      [sale.batch_id, sale.customer_id, sale.quantity_sold, sale.price_per_kg, sale.sale_date, total_amount],
      function(err) {
        if (err) console.error('Error inserting sale:', err);
        else console.log(`Sale added with ID: ${this.lastID}`);
      }
    );
  });

  console.log('Database seeding completed!');
  process.exit(0);
}, 1000);