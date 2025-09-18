import React from 'react';

function BasicAnalytics({ batches, sales }) {
  console.log('Analytics - Batches:', batches);
  console.log('Analytics - Sales:', sales);

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
            <div className="stat-value">
              {batches ? batches.reduce((sum, b) => sum + (parseFloat(b.latex_quantity) || 0), 0).toFixed(1) : 0}
            </div>
            <div className="stat-label">Total Latex (kg)</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-value currency">
              {sales ? sales.reduce((sum, s) => sum + (parseFloat(s.total_amount) || 0), 0).toLocaleString() : 0}
            </div>
            <div className="stat-label">Total Revenue (LKR)</div>
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
              <th>Cost (LKR)</th>
            </tr>
          </thead>
          <tbody>
            {batches && batches.length > 0 ? (
              batches.slice(0, 5).map(batch => (
                <tr key={batch.id}>
                  <td>#{batch.batch_number}</td>
                  <td>{batch.production_date}</td>
                  <td>{batch.latex_quantity}</td>
                  <td>{batch.glue_separated}</td>
                  <td className="currency">{parseFloat(batch.cost_to_prepare).toLocaleString()}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="5">No batches available</td></tr>
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
              <th>Quantity (kg)</th>
              <th>Amount (LKR)</th>
            </tr>
          </thead>
          <tbody>
            {sales && sales.length > 0 ? (
              sales.slice(0, 5).map(sale => (
                <tr key={sale.id}>
                  <td>{sale.sale_date}</td>
                  <td>{sale.customer_name}</td>
                  <td>{sale.quantity_sold}</td>
                  <td className="currency">{parseFloat(sale.total_amount).toLocaleString()}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="4">No sales available</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default BasicAnalytics;