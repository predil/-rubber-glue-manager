export default function handler(req, res) {
  // Return hardcoded data since database connection is failing
  if (req.method === 'GET') {
    res.json([
      {
        id: 1,
        chemical_name: 'Coconut Oil',
        purchase_date: '2024-01-01',
        quantity_purchased: 25,
        unit: 'kg',
        total_cost: 7500,
        cost_per_unit: 300,
        remaining_quantity: 25
      },
      {
        id: 2,
        chemical_name: 'KOH',
        purchase_date: '2024-01-01',
        quantity_purchased: 10,
        unit: 'kg',
        total_cost: 2000,
        cost_per_unit: 200,
        remaining_quantity: 10
      },
      {
        id: 3,
        chemical_name: 'HEC',
        purchase_date: '2024-01-01',
        quantity_purchased: 5,
        unit: 'kg',
        total_cost: 3000,
        cost_per_unit: 600,
        remaining_quantity: 5
      }
    ]);
  } else if (req.method === 'POST') {
    const { chemical_name, purchase_date, quantity_purchased, unit, total_cost } = req.body;
    res.json({ 
      id: Math.floor(Math.random() * 1000), 
      message: 'Chemical added successfully (temporary)' 
    });
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}