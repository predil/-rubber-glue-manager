import React, { useState } from 'react';

function SalesManager({ sales, batches, customers, onUpdate }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    batch_id: '',
    customer_id: '',
    quantity_sold: '',
    price_per_kg: '',
    sale_date: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      setFormData({
        batch_id: '',
        customer_id: '',
        quantity_sold: '',
        price_per_kg: '',
        sale_date: new Date().toISOString().split('T')[0]
      });
      setShowForm(false);
      onUpdate();
    } catch (error) {
      console.error('Error saving sale:', error);
    }
  };

  const handleBatchChange = (batchId) => {
    const selectedBatch = batches.find(b => b.id === parseInt(batchId));
    setFormData({
      ...formData,
      batch_id: batchId,
      price_per_kg: selectedBatch ? selectedBatch.selling_price_per_kg : ''
    });
  };

  const getAvailableBatches = () => {
    return batches.filter(batch => {
      const totalSold = sales
        .filter(sale => sale.batch_id === batch.id)
        .reduce((sum, sale) => sum + sale.quantity_sold, 0);
      return totalSold < batch.glue_separated;
    });
  };

  const getRemainingQuantity = (batchId) => {
    const batch = batches.find(b => b.id === batchId);
    if (!batch) return 0;
    
    const totalSold = sales
      .filter(sale => sale.batch_id === batchId)
      .reduce((sum, sale) => sum + sale.quantity_sold, 0);
    
    return batch.glue_separated - totalSold;
  };

  return (
    <div className="section">
      <div className="section-title">
        💰 Sales Management
        <button 
          className="btn btn-primary btn-small"
          onClick={() => setShowForm(!showForm)}
          style={{ marginLeft: 'auto' }}
        >
          {showForm ? 'Cancel' : 'Record Sale'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="form-grid">
          <div className="form-group">
            <label>Select Batch</label>
            <select
              value={formData.batch_id}
              onChange={(e) => handleBatchChange(e.target.value)}
              required
            >
              <option value="">Choose batch...</option>
              {getAvailableBatches().map(batch => (
                <option key={batch.id} value={batch.id}>
                  Batch #{batch.batch_number} - {getRemainingQuantity(batch.id)}kg available
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>Customer</label>
            <select
              value={formData.customer_id}
              onChange={(e) => setFormData({...formData, customer_id: e.target.value})}
              required
            >
              <option value="">Choose customer...</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>Quantity Sold (kg)</label>
            <input
              type="number"
              step="0.1"
              value={formData.quantity_sold}
              onChange={(e) => setFormData({...formData, quantity_sold: e.target.value})}
              max={formData.batch_id ? getRemainingQuantity(parseInt(formData.batch_id)) : ''}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Price per kg (LKR)</label>
            <input
              type="number"
              step="0.01"
              value={formData.price_per_kg}
              onChange={(e) => setFormData({...formData, price_per_kg: e.target.value})}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Sale Date</label>
            <input
              type="date"
              value={formData.sale_date}
              onChange={(e) => setFormData({...formData, sale_date: e.target.value})}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Total Amount</label>
            <input
              type="text"
              value={formData.quantity_sold && formData.price_per_kg 
                ? `LKR ${(formData.quantity_sold * formData.price_per_kg).toLocaleString()}`
                : 'LKR 0'}
              disabled
            />
          </div>
          
          <div style={{ gridColumn: '1 / -1' }}>
            <button type="submit" className="btn btn-primary">
              Record Sale
            </button>
          </div>
        </form>
      )}

      <table className="table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Batch #</th>
            <th>Customer</th>
            <th>Quantity (kg)</th>
            <th>Price/kg (LKR)</th>
            <th>Total (LKR)</th>
          </tr>
        </thead>
        <tbody>
          {sales.map(sale => (
            <tr key={sale.id}>
              <td>{sale.sale_date}</td>
              <td>#{sale.batch_number}</td>
              <td>{sale.customer_name}</td>
              <td>{sale.quantity_sold}</td>
              <td className="currency">{sale.price_per_kg}</td>
              <td className="currency">{sale.total_amount.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default SalesManager;