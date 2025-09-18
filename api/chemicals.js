export default function handler(req, res) {
  try {
    if (req.method === 'GET') {
      // Return mock data for now
      res.json([
        { id: 1, chemical_name: 'Coconut Oil', remaining_quantity: 25, unit: 'kg' },
        { id: 2, chemical_name: 'KOH', remaining_quantity: 10, unit: 'kg' }
      ]);
    } else if (req.method === 'POST') {
      const { chemical_name, purchase_date, quantity_purchased, unit, total_cost } = req.body;
      
      // Mock successful response
      res.json({ 
        id: Math.floor(Math.random() * 1000), 
        message: 'Chemical added successfully (mock)',
        data: { chemical_name, purchase_date, quantity_purchased, unit, total_cost }
      });
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}