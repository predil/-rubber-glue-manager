import React from 'react';

function SimpleAnalytics({ batches, sales }) {
  // Calculate summary from props instead of API
  const calculateSummary = () => {
    const totalLatex = batches.reduce((sum, batch) => sum + (batch.latex_quantity || 0), 0);
    const totalGlue = batches.reduce((sum, batch) => sum + (batch.glue_separated || 0), 0);
    const totalSales = sales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
    const totalCosts = batches.reduce((sum, batch) => sum + (batch.cost_to_prepare || 0), 0);
    const totalProfit = totalSales - totalCosts;
    
    return { totalLatex, totalGlue, totalSales, totalCosts, totalProfit };
  };
  
  const summary = calculateSummary();

  const calculateBatchProfits = () => {
    return batches.map(batch => {
      const batchSales = sales.filter(sale => sale.batch_id === batch.id);
      const totalRevenue = batchSales.reduce((sum, sale) => sum + sale.total_amount, 0);
      const totalQuantitySold = batchSales.reduce((sum, sale) => sum + sale.quantity_sold, 0);
      const allocatedCost = (batch.cost_to_prepare * totalQuantitySold) / batch.glue_separated;
      const profit = totalRevenue - allocatedCost;
      
      return {
        ...batch,
        totalRevenue,
        totalQuantitySold,
        profit,
        profitMargin: totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0
      };
    });
  };

  const getCustomerSales = () => {
    const customerMap = {};
    sales.forEach(sale => {
      if (!customerMap[sale.customer_name]) {
        customerMap[sale.customer_name] = {
          name: sale.customer_name,
          totalQuantity: 0,
          totalAmount: 0,
          salesCount: 0
        };
      }
      customerMap[sale.customer_name].totalQuantity += sale.quantity_sold;
      customerMap[sale.customer_name].totalAmount += sale.total_amount;
      customerMap[sale.customer_name].salesCount += 1;
    });
    
    return Object.values(customerMap).sort((a, b) => b.totalAmount - a.totalAmount);
  };



  const batchProfits = calculateBatchProfits();
  const customerSales = getCustomerSales();

  return (
    <div>
      <div className="section">
        <div className="section-title">📊 Business Summary</div>
        
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{summary.totalLatex.toFixed(1)}</div>
            <div className="stat-label">Total Latex Used (kg)</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-value">{summary.totalGlue.toFixed(1)}</div>
            <div className="stat-label">Total Glue Produced (kg)</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-value currency">
              {summary.totalSales.toLocaleString()}
            </div>
            <div className="stat-label">Total Sales (LKR)</div>
          </div>
          
          <div className="stat-card">
            <div className={`stat-value ${summary.totalProfit >= 0 ? 'profit-positive' : 'profit-negative'}`}>
              {summary.totalProfit.toLocaleString()}
            </div>
            <div className="stat-label">Total Profit (LKR)</div>
          </div>
        </div>
      </div>

      <div className="section">
        <div className="section-title">👥 Customer Sales Summary</div>
        <table className="table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Total Quantity (kg)</th>
              <th>Total Amount (LKR)</th>
              <th>Number of Orders</th>
            </tr>
          </thead>
          <tbody>
            {customerSales.length > 0 ? customerSales.map((customer, index) => (
              <tr key={index}>
                <td>{customer.name}</td>
                <td>{customer.totalQuantity.toFixed(1)}</td>
                <td className="currency">{customer.totalAmount.toLocaleString()}</td>
                <td>{customer.salesCount}</td>
              </tr>
            )) : (
              <tr><td colSpan="4">No sales data available</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="section">
        <div className="section-title">🏭 Batch Performance</div>
        <table className="table">
          <thead>
            <tr>
              <th>Batch #</th>
              <th>Production Date</th>
              <th>Quantity Sold (kg)</th>
              <th>Revenue (LKR)</th>
              <th>Profit (LKR)</th>
              <th>Profit Margin (%)</th>
            </tr>
          </thead>
          <tbody>
            {batchProfits.length > 0 ? batchProfits.map(batch => (
              <tr key={batch.id}>
                <td>#{batch.batch_number}</td>
                <td>{batch.production_date}</td>
                <td>{batch.totalQuantitySold.toFixed(1)}</td>
                <td className="currency">{batch.totalRevenue.toLocaleString()}</td>
                <td className={batch.profit >= 0 ? 'profit-positive' : 'profit-negative'}>
                  {batch.profit.toLocaleString()}
                </td>
                <td>{batch.profitMargin.toFixed(1)}%</td>
              </tr>
            )) : (
              <tr><td colSpan="6">No batch data available</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default SimpleAnalytics;