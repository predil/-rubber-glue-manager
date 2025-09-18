import React, { useState, useEffect } from 'react';

// Conditional chart imports to prevent mobile crashes
let Bar = null;
let ChartJS = null;

try {
  const chartImports = require('chart.js');
  const reactChartImports = require('react-chartjs-2');
  
  ChartJS = chartImports.Chart;
  Bar = reactChartImports.Bar;
  
  if (ChartJS) {
    ChartJS.register(
      chartImports.CategoryScale,
      chartImports.LinearScale,
      chartImports.BarElement,
      chartImports.LineElement,
      chartImports.PointElement,
      chartImports.Title,
      chartImports.Tooltip,
      chartImports.Legend
    );
  }
} catch (error) {
  console.log('Charts not available on this device');
}



function Analytics({ batches, sales }) {
  const [summary, setSummary] = useState({});
  const [monthlyData, setMonthlyData] = useState([]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Check if charts are available
  const chartsAvailable = Bar !== null && ChartJS !== null;
  
  // Error handling
  const [error, setError] = useState(null);

  const fetchAnalytics = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const [summaryRes, monthlyRes] = await Promise.all([
        fetch(`${apiUrl}/api/analytics/summary`),
        fetch(`${apiUrl}/api/analytics/monthly`)
      ]);
      
      if (!summaryRes.ok || !monthlyRes.ok) {
        throw new Error('Failed to fetch analytics data');
      }
      
      const summaryData = await summaryRes.json();
      const monthlyData = await monthlyRes.json();
      
      setSummary(summaryData || {});
      setMonthlyData(monthlyData || []);
      setError(null);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError(error.message);
      // Set default values
      setSummary({});
      setMonthlyData([]);
    }
  };

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

  const productionChartData = {
    labels: monthlyData.map(d => d.month).reverse(),
    datasets: [
      {
        label: 'Latex Used (kg)',
        data: monthlyData.map(d => d.latex_used).reverse(),
        backgroundColor: 'rgba(45, 90, 39, 0.6)',
        borderColor: 'rgba(45, 90, 39, 1)',
        borderWidth: 1
      },
      {
        label: 'Glue Produced (kg)',
        data: monthlyData.map(d => d.glue_produced).reverse(),
        backgroundColor: 'rgba(74, 124, 89, 0.6)',
        borderColor: 'rgba(74, 124, 89, 1)',
        borderWidth: 1
      }
    ]
  };

  const profitChartData = {
    labels: batchProfits.map(b => `Batch #${b.batch_number}`),
    datasets: [
      {
        label: 'Profit (LKR)',
        data: batchProfits.map(b => b.profit),
        backgroundColor: batchProfits.map(b => 
          b.profit >= 0 ? 'rgba(40, 167, 69, 0.6)' : 'rgba(220, 53, 69, 0.6)'
        ),
        borderColor: batchProfits.map(b => 
          b.profit >= 0 ? 'rgba(40, 167, 69, 1)' : 'rgba(220, 53, 69, 1)'
        ),
        borderWidth: 1
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
    },
  };

  // Show error message if there's an error
  if (error) {
    return (
      <div className="section">
        <div className="section-title">📊 Analytics</div>
        <div className="mobile-chart-fallback">
          <p>⚠️ Unable to load analytics data</p>
          <p>Error: {error}</p>
          <button className="btn btn-primary" onClick={fetchAnalytics}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="section">
        <div className="section-title">📊 Business Summary</div>
        
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{summary.totalLatex ? summary.totalLatex.toFixed(1) : 0}</div>
            <div className="stat-label">Total Latex Used (kg)</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-value">{summary.totalGlue ? summary.totalGlue.toFixed(1) : 0}</div>
            <div className="stat-label">Total Glue Produced (kg)</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-value currency">
              {summary.totalSales ? summary.totalSales.toLocaleString() : 0}
            </div>
            <div className="stat-label">Total Sales (LKR)</div>
          </div>
          
          <div className="stat-card">
            <div className={`stat-value ${(summary.totalProfit || 0) >= 0 ? 'profit-positive' : 'profit-negative'}`}>
              {summary.totalProfit ? summary.totalProfit.toLocaleString() : 0}
            </div>
            <div className="stat-label">Total Profit (LKR)</div>
          </div>
        </div>
      </div>

      <div className="section">
        <div className="section-title">📈 Production Trends</div>
        {chartsAvailable ? (
          <div className="chart-container">
            <Bar data={productionChartData} options={chartOptions} />
          </div>
        ) : (
          <div className="mobile-chart-fallback">
            <p>📊 Chart view not available on this device</p>
            <table className="table">
              <thead>
                <tr><th>Month</th><th>Latex Used (kg)</th><th>Glue Produced (kg)</th></tr>
              </thead>
              <tbody>
                {monthlyData && monthlyData.length > 0 ? (
                  monthlyData.slice().reverse().map((data, index) => (
                    <tr key={index}>
                      <td>{data.month || 'N/A'}</td>
                      <td>{data.latex_used || 0}</td>
                      <td>{data.glue_produced || 0}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="3">No production data available</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="section">
        <div className="section-title">💰 Batch Profitability</div>
        {chartsAvailable ? (
          <div className="chart-container">
            <Bar data={profitChartData} options={chartOptions} />
          </div>
        ) : (
          <div className="mobile-chart-fallback">
            <p>📊 Chart view not available on this device</p>
            <p>See batch performance table below for detailed profit data.</p>
          </div>
        )}
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
              <th>Avg Order Size (kg)</th>
            </tr>
          </thead>
          <tbody>
            {customerSales.map((customer, index) => (
              <tr key={index}>
                <td>{customer.name}</td>
                <td>{customer.totalQuantity.toFixed(1)}</td>
                <td className="currency">{customer.totalAmount.toLocaleString()}</td>
                <td>{customer.salesCount}</td>
                <td>{(customer.totalQuantity / customer.salesCount).toFixed(1)}</td>
              </tr>
            ))}
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
            {batchProfits.map(batch => (
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Analytics;