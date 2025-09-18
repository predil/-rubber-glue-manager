import React, { useState, useEffect } from 'react';

function ReturnsManager({ sales, onUpdate }) {
  const [returns, setReturns] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    sale_id: '',
    return_date: new Date().toISOString().split('T')[0],
    quantity_returned: '',
    reason: ''
  });

  useEffect(() => {
    fetchReturns();
  }, []);

  const fetchReturns = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/returns`);
      const data = await response.json();
      setReturns(data);
    } catch (error) {
      console.error('Error fetching returns:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/returns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to record return');
      }
      
      alert(`Return recorded successfully! Refund amount: LKR ${result.refund_amount.toLocaleString()}`);
      
      setFormData({
        sale_id: '',
        return_date: new Date().toISOString().split('T')[0],
        quantity_returned: '',
        reason: ''
      });
      setShowForm(false);
      fetchReturns();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error recording return:', error);
      alert('Failed to record return: ' + error.message);
    }
  };

  const getAvailableSales = () => {
    // Get sales that haven't been fully returned
    return sales.filter(sale => {
      const saleReturns = returns.filter(ret => ret.sale_id === sale.id);
      const totalReturned = saleReturns.reduce((sum, ret) => sum + parseFloat(ret.quantity_returned), 0);
      return totalReturned < sale.quantity_sold;
    });
  };

  const getMaxReturnQuantity = (saleId) => {
    const sale = sales.find(s => s.id === parseInt(saleId));
    if (!sale) return 0;
    
    const saleReturns = returns.filter(ret => ret.sale_id === parseInt(saleId));
    const totalReturned = saleReturns.reduce((sum, ret) => sum + parseFloat(ret.quantity_returned), 0);
    return sale.quantity_sold - totalReturned;
  };

  const calculateTotalLoss = () => {
    return returns.reduce((sum, ret) => sum + parseFloat(ret.refund_amount), 0);
  };

  return (
    <div>
      <div className="section">
        <div className="section-title">
          🔄 Returns Management
          <button 
            className="btn btn-primary btn-small"
            onClick={() => setShowForm(!showForm)}
            style={{ marginLeft: 'auto' }}
          >
            {showForm ? 'Cancel' : 'Record Return'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="form-group">
              <label>Select Sale</label>
              <select
                value={formData.sale_id}
                onChange={(e) => setFormData({...formData, sale_id: e.target.value})}
                required
              >
                <option value="">Choose sale...</option>
                {getAvailableSales().map(sale => (
                  <option key={sale.id} value={sale.id}>
                    {sale.sale_date} - {sale.customer_name} - Batch #{sale.batch_number} 
                    ({sale.quantity_sold}kg @ LKR {sale.price_per_kg}/kg)
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>Return Date</label>
              <input
                type="date"
                value={formData.return_date}
                onChange={(e) => setFormData({...formData, return_date: e.target.value})}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Quantity Returned (kg)</label>
              <input
                type="number"
                step="0.1"
                value={formData.quantity_returned}
                onChange={(e) => setFormData({...formData, quantity_returned: e.target.value})}
                max={formData.sale_id ? getMaxReturnQuantity(formData.sale_id) : ''}
                placeholder={formData.sale_id ? `Max: ${getMaxReturnQuantity(formData.sale_id)}kg` : ''}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Reason for Return</label>
              <select
                value={formData.reason}
                onChange={(e) => setFormData({...formData, reason: e.target.value})}
              >
                <option value="">Select reason...</option>
                <option value="Spoiled/Damaged">Spoiled/Damaged</option>
                <option value="Quality Issue">Quality Issue</option>
                <option value="Customer Complaint">Customer Complaint</option>
                <option value="Expired">Expired</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Estimated Refund</label>
              <input
                type="text"
                value={formData.quantity_returned && formData.sale_id ? 
                  `LKR ${(formData.quantity_returned * 
                    (sales.find(s => s.id === parseInt(formData.sale_id))?.price_per_kg || 0)
                  ).toLocaleString()}` : 'LKR 0'}
                disabled
              />
            </div>
            
            <div style={{ gridColumn: '1 / -1' }}>
              <button type="submit" className="btn btn-primary">
                Record Return
              </button>
            </div>
          </form>
        )}

        {/* Summary Cards */}
        <div className="stats-grid" style={{ marginTop: '2rem' }}>
          <div className="stat-card">
            <div className="stat-value">{returns.length}</div>
            <div className="stat-label">Total Returns</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-value">
              {returns.reduce((sum, ret) => sum + parseFloat(ret.quantity_returned), 0).toFixed(1)}
            </div>
            <div className="stat-label">Total Quantity Returned (kg)</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-value profit-negative">
              {calculateTotalLoss().toLocaleString()}
            </div>
            <div className="stat-label">Total Loss (LKR)</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-value">
              {returns.length > 0 ? 
                (returns.reduce((sum, ret) => sum + parseFloat(ret.quantity_returned), 0) / 
                 sales.reduce((sum, sale) => sum + sale.quantity_sold, 0) * 100).toFixed(1) : 0}%
            </div>
            <div className="stat-label">Return Rate</div>
          </div>
        </div>
      </div>

      <div className="section">
        <div className="section-title">📋 Returns History</div>
        <table className="table">
          <thead>
            <tr>
              <th>Return Date</th>
              <th>Original Sale</th>
              <th>Customer</th>
              <th>Batch #</th>
              <th>Returned (kg)</th>
              <th>Refund (LKR)</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            {returns.length > 0 ? returns.map(returnItem => (
              <tr key={returnItem.id}>
                <td>{returnItem.return_date}</td>
                <td>{returnItem.sale_date}</td>
                <td>{returnItem.customer_name}</td>
                <td>#{returnItem.batch_number}</td>
                <td>{returnItem.quantity_returned}</td>
                <td className="profit-negative">{parseFloat(returnItem.refund_amount).toLocaleString()}</td>
                <td>{returnItem.reason || 'Not specified'}</td>
              </tr>
            )) : (
              <tr><td colSpan="7">No returns recorded</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ReturnsManager;