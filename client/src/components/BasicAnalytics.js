import React, { useState, useEffect } from 'react';

function BasicAnalytics({ batches, sales }) {
  const [returns, setReturns] = useState([]);
  
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
  
  console.log('Analytics - Batches:', batches);
  console.log('Analytics - Sales:', sales);
  console.log('Analytics - Returns:', returns);

  return (
    <div>
      <div className="section">
        <div className="section-title">📊 Analytics Dashboard</div>
        
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{batches ? batches.length : 0}</div>
            <div className="stat-label">Total Batches</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-value">{sales ? sales.length : 0}</div>
            <div className="stat-label">Total Sales</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-value">{returns ? returns.length : 0}</div>
            <div className="stat-label">Total Returns</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-value">
              {batches ? batches.reduce((sum, b) => sum + (parseFloat(b.latex_quantity) || 0), 0).toFixed(1) : 0}
            </div>
            <div className="stat-label">Total Latex (kg)</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-value">
              {batches ? batches.reduce((sum, b) => sum + (parseFloat(b.glue_separated) || 0), 0).toFixed(1) : 0}
            </div>
            <div className="stat-label">Total Glue Produced (kg)</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-value currency">
              {sales ? sales.reduce((sum, s) => sum + (parseFloat(s.total_amount) || 0), 0).toLocaleString() : 0}
            </div>
            <div className="stat-label">Gross Revenue (LKR)</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-value profit-negative">
              {returns ? returns.reduce((sum, r) => sum + (parseFloat(r.refund_amount) || 0), 0).toLocaleString() : 0}
            </div>
            <div className="stat-label">Returns Loss (LKR)</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-value currency">
              {sales && returns ? 
                (sales.reduce((sum, s) => sum + (parseFloat(s.total_amount) || 0), 0) - 
                 returns.reduce((sum, r) => sum + (parseFloat(r.refund_amount) || 0), 0)).toLocaleString() : 0}
            </div>
            <div className="stat-label">Net Revenue (LKR)</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-value">
              {returns && sales && sales.length > 0 ? 
                (returns.reduce((sum, r) => sum + (parseFloat(r.quantity_returned) || 0), 0) / 
                 sales.reduce((sum, s) => sum + (parseFloat(s.quantity_sold) || 0), 0) * 100).toFixed(1) : 0}%
            </div>
            <div className="stat-label">Return Rate</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-value">
              {batches && batches.length > 0 ? 
                (batches.reduce((sum, b) => sum + (parseFloat(b.glue_separated) / parseFloat(b.latex_quantity) * 100), 0) / batches.length).toFixed(1) : 0}%
            </div>
            <div className="stat-label">Avg Production Rate</div>
          </div>
        </div>
      </div>

      <div className="section">
        <div className="section-title">🏭 Recent Batches</div>
        <table className="table">
          <thead>
            <tr>
              <th>Batch #</th>
              <th>Date</th>
              <th>Latex (kg)</th>
              <th>Glue (kg)</th>
              <th>Rate (%)</th>
              <th>Cost (LKR)</th>
            </tr>
          </thead>
          <tbody>
            {batches && batches.length > 0 ? (
              batches.slice(0, 5).map(batch => {
                const productionRate = (batch.glue_separated / batch.latex_quantity * 100).toFixed(1);
                const avgRate = batches.reduce((sum, b) => sum + (b.glue_separated / b.latex_quantity * 100), 0) / batches.length;
                const isLow = parseFloat(productionRate) < avgRate * 0.9;
                
                return (
                  <tr key={batch.id}>
                    <td>#{batch.batch_number}</td>
                    <td>{batch.production_date}</td>
                    <td>{batch.latex_quantity}</td>
                    <td>{batch.glue_separated}</td>
                    <td style={{ 
                      color: isLow ? '#dc3545' : '#28a745',
                      fontWeight: 'bold'
                    }}>
                      {productionRate}%
                    </td>
                    <td className="currency">{parseFloat(batch.cost_to_prepare).toLocaleString()}</td>
                  </tr>
                );
              })
            ) : (
              <tr><td colSpan="6">No batches available</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="section">
        <div className="section-title">💰 Recent Sales</div>
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Customer</th>
              <th>Sold (kg)</th>
              <th>Returned (kg)</th>
              <th>Net (kg)</th>
              <th>Amount (LKR)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {sales && sales.length > 0 ? (
              sales.slice(0, 5).map(sale => {
                const saleReturns = returns.filter(r => r.sale_id === sale.id);
                const totalReturned = saleReturns.reduce((sum, r) => sum + parseFloat(r.quantity_returned), 0);
                const netQuantity = sale.quantity_sold - totalReturned;
                const hasReturns = totalReturned > 0;
                
                return (
                  <tr key={sale.id}>
                    <td>{sale.sale_date}</td>
                    <td>{sale.customer_name}</td>
                    <td>{sale.quantity_sold}</td>
                    <td className={hasReturns ? 'profit-negative' : ''}>
                      {totalReturned > 0 ? totalReturned.toFixed(1) : '-'}
                    </td>
                    <td className={hasReturns ? 'profit-negative' : 'currency'}>
                      {netQuantity.toFixed(1)}
                    </td>
                    <td className="currency">{parseFloat(sale.total_amount).toLocaleString()}</td>
                    <td>
                      {hasReturns ? (
                        <span style={{ color: '#dc3545', fontSize: '0.9em' }}>
                          🔄 Partial Return
                        </span>
                      ) : (
                        <span style={{ color: '#28a745', fontSize: '0.9em' }}>
                          ✓ Complete
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr><td colSpan="7">No sales available</td></tr>
            )}
          </tbody>
        </table>
      </div>
      
      {returns && returns.length > 0 && (
        <div className="section">
          <div className="section-title">🔄 Recent Returns</div>
          <table className="table">
            <thead>
              <tr>
                <th>Return Date</th>
                <th>Customer</th>
                <th>Returned (kg)</th>
                <th>Refund (LKR)</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {returns.slice(0, 5).map(returnItem => (
                <tr key={returnItem.id}>
                  <td>{returnItem.return_date}</td>
                  <td>{returnItem.customer_name}</td>
                  <td className="profit-negative">{returnItem.quantity_returned}</td>
                  <td className="profit-negative">{parseFloat(returnItem.refund_amount).toLocaleString()}</td>
                  <td>{returnItem.reason || 'Not specified'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default BasicAnalytics;