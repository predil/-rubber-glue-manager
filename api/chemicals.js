const { Pool } = require('pg');

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    // Return hardcoded data for now
    return res.json([
      { id: 1, chemical_name: 'Coconut Oil', remaining_quantity: 25, unit: 'kg', cost_per_unit: 300 },
      { id: 2, chemical_name: 'KOH', remaining_quantity: 10, unit: 'kg', cost_per_unit: 200 },
      { id: 3, chemical_name: 'HEC', remaining_quantity: 5, unit: 'kg', cost_per_unit: 600 },
      { id: 4, chemical_name: 'Sodium Benzoate', remaining_quantity: 5, unit: 'kg', cost_per_unit: 300 },
      { id: 5, chemical_name: 'Ammonia', remaining_quantity: 20, unit: 'L', cost_per_unit: 50 }
    ]);
  }
  
  if (req.method === 'POST') {
    const { chemical_name } = req.body;
    return res.json({ 
      id: Math.floor(Math.random() * 1000), 
      message: `${chemical_name} added successfully` 
    });
  }
  
  return res.status(405).json({ message: 'Method not allowed' });
};