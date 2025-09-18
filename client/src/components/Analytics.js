import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

function Analytics({ batches, sales }) {
  const [summary, setSummary] = useState({});
  const [monthlyData, setMonthlyData] = useState([]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Fallback when charts don't load
  const [chartsLoaded, setChartsLoaded] = useState(true);
  
  useEffect(() => {
    // Check if Chart.js is available
    if (typeof window !== 'undefined' && !window.Chart) {
      setChartsLoaded(false);
    }
  }, []);

  const fetchAnalytics = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const [summaryRes, monthlyRes] = await Promise.all([
        fetch(`${apiUrl}/api/analytics/summary`),
        fetch(`${apiUrl}/api/analytics/monthly`)
      ]);
      
      const summaryData = await summaryRes.json();
      const monthlyData = await monthlyRes.json();
      
      setSummary(summaryData);
      setMonthlyData(monthlyData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
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

  return (
    <div>
      <div className="section">
        <div className="section-title">📊 Business Summary</div>
        
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{summary.totalLatex?.toFixed(1) || 0}</div>
            <div className="stat-label">Total Latex Used (kg)</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-value">{summary.totalGlue?.toFixed(1) || 0}</div>
            <div className="stat-label">Total Glue Produced (kg)</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-value currency">
              {summary.totalSales?.toLocaleString() || 0}
            </div>
            <div className="stat-label">Total Sales (LKR)</div>
          </div>
          
          <div className="stat-card">
            <div className={`stat-value ${summary.totalProfit >= 0 ? 'profit-positive' : 'profit-negative'}`}>
              {summary.totalProfit?.toLocaleString() || 0}
            </div>
            <div className="stat-label">Total Profit (LKR)</div>
          </div>
        </div>
      </div>

      <div className="section">
        <div className="section-title">📈 Production Trends</div>
        {chartsLoaded ? (
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
                {monthlyData.slice().reverse().map((data, index) => (
                  <tr key={index}>
                    <td>{data.month}</td>
                    <td>{data.latex_used}</td>
                    <td>{data.glue_produced}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="section">
        <div className="section-title">💰 Batch Profitability</div>
        {chartsLoaded ? (
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