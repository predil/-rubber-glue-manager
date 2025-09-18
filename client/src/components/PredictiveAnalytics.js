import React, { useState, useEffect } from 'react';
import { Line, Bar } from 'react-chartjs-2';

const PredictiveAnalytics = () => {
  const [activeTab, setActiveTab] = useState('demand');
  const [demandData, setDemandData] = useState(null);
  const [batchData, setBatchData] = useState(null);
  const [reorderData, setReorderData] = useState(null);
  const [priceData, setPriceData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchDemandForecast = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/analytics/demand-forecast');
      const data = await response.json();
      setDemandData(data);
    } catch (error) {
      console.error('Error fetching demand forecast:', error);
    }
    setLoading(false);
  };

  const fetchBatchOptimization = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/analytics/optimal-batch-size');
      const data = await response.json();
      setBatchData(data);
    } catch (error) {
      console.error('Error fetching batch optimization:', error);
    }
    setLoading(false);
  };

  const fetchReorderAlerts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/analytics/chemical-reorder-alerts');
      const data = await response.json();
      setReorderData(data);
    } catch (error) {
      console.error('Error fetching reorder alerts:', error);
    }
    setLoading(false);
  };

  const fetchPriceOptimization = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/analytics/price-optimization');
      const data = await response.json();
      setPriceData(data);
    } catch (error) {
      console.error('Error fetching price optimization:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'demand') fetchDemandForecast();
    else if (activeTab === 'batch') fetchBatchOptimization();
    else if (activeTab === 'reorder') fetchReorderAlerts();
    else if (activeTab === 'price') fetchPriceOptimization();
  }, [activeTab]);

  const renderDemandForecast = () => {
    if (!demandData || demandData.forecast.length === 0) {
      return <div className="no-data">Insufficient data for demand forecasting</div>;
    }

    const chartData = {
      labels: demandData.forecast.map(f => new Date(f.date).toLocaleDateString()),
      datasets: [{
        label: 'Predicted Sales (kg)',
        data: demandData.forecast.map(f => f.predicted_sales),
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        tension: 0.4
      }]
    };

    return (
      <div>
        <div className="insight-card">
          <h3>📈 30-Day Demand Forecast</h3>
          <div className="metrics-grid">
            <div className="metric">
              <span className="label">Trend:</span>
              <span className={`value trend-${demandData.trend}`}>
                {demandData.trend.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <div className="metric">
              <span className="label">Confidence:</span>
              <span className="value">{demandData.confidence}%</span>
            </div>
          </div>
        </div>
        <div className="chart-container">
          <Line data={chartData} options={{
            responsive: true,
            plugins: { legend: { position: 'top' } },
            scales: { y: { beginAtZero: true } }
          }} />
        </div>
      </div>
    );
  };

  const renderBatchOptimization = () => {
    if (!batchData || batchData.recommendation === 'insufficient_data') {
      return <div className="no-data">Insufficient data for batch optimization</div>;
    }

    const chartData = {
      labels: batchData.analysis.map(a => a.range + 'kg'),
      datasets: [{
        label: 'Profit Margin (%)',
        data: batchData.analysis.map(a => a.avg_profit_margin),
        backgroundColor: batchData.analysis.map(a => 
          a.range === batchData.optimal_range ? '#4CAF50' : '#2196F3'
        )
      }]
    };

    return (
      <div>
        <div className="insight-card">
          <h3>⚖️ Optimal Batch Size Analysis</h3>
          <div className="recommendation">
            <strong>{batchData.recommendation}</strong>
            <p>Expected margin: {batchData.expected_margin}%</p>
          </div>
        </div>
        <div className="chart-container">
          <Bar data={chartData} options={{
            responsive: true,
            plugins: { legend: { position: 'top' } },
            scales: { y: { beginAtZero: true } }
          }} />
        </div>
        <div className="analysis-table">
          <table>
            <thead>
              <tr>
                <th>Batch Size</th>
                <th>Batches</th>
                <th>Avg Profit Margin</th>
                <th>Conversion Rate</th>
              </tr>
            </thead>
            <tbody>
              {batchData.analysis.map(a => (
                <tr key={a.range} className={a.range === batchData.optimal_range ? 'optimal' : ''}>
                  <td>{a.range}kg</td>
                  <td>{a.count}</td>
                  <td>{a.avg_profit_margin.toFixed(1)}%</td>
                  <td>{(a.avg_conversion_rate * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderReorderAlerts = () => {
    if (!reorderData) return <div className="loading">Loading...</div>;

    const urgentAlerts = reorderData.alerts.filter(a => a.reorder_needed);

    return (
      <div>
        <div className="insight-card">
          <h3>🔔 Chemical Reorder Alerts</h3>
          <div className="metrics-grid">
            <div className="metric">
              <span className="label">Items Need Reorder:</span>
              <span className="value">{urgentAlerts.length}</span>
            </div>
            <div className="metric">
              <span className="label">Total Cost:</span>
              <span className="value">LKR {reorderData.total_reorder_cost.toLocaleString()}</span>
            </div>
          </div>
        </div>
        <div className="alerts-grid">
          {reorderData.alerts.map(alert => (
            <div key={alert.chemical} className={`alert-card ${alert.urgency}`}>
              <h4>{alert.chemical}</h4>
              <div className="alert-details">
                <p><strong>Current Stock:</strong> {alert.current_stock} {alert.unit}</p>
                <p><strong>Days Remaining:</strong> {alert.days_remaining}</p>
                <p><strong>Daily Usage:</strong> {alert.daily_usage} {alert.unit}</p>
                {alert.reorder_needed && (
                  <div className="reorder-info">
                    <p><strong>Suggested Order:</strong> {alert.suggested_order_qty} {alert.unit}</p>
                    <p><strong>Estimated Cost:</strong> LKR {alert.estimated_cost.toLocaleString()}</p>
                  </div>
                )}
              </div>
              <div className={`urgency-badge ${alert.urgency}`}>
                {alert.urgency.toUpperCase()}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderPriceOptimization = () => {
    if (!priceData || priceData.recommendation === 'insufficient_data') {
      return <div className="no-data">Insufficient data for price optimization</div>;
    }

    const chartData = {
      labels: priceData.price_analysis.map(p => `LKR ${p.price}`),
      datasets: [{
        label: 'Total Profit',
        data: priceData.price_analysis.map(p => p.total_profit),
        backgroundColor: '#FF9800',
        yAxisID: 'y'
      }, {
        label: 'Daily Sales (kg)',
        data: priceData.price_analysis.map(p => p.sales_velocity),
        backgroundColor: '#2196F3',
        yAxisID: 'y1'
      }]
    };

    return (
      <div>
        <div className="insight-card">
          <h3>💰 Price Optimization</h3>
          <div className="recommendation">
            <strong>{priceData.recommendation}</strong>
            <p>Expected daily sales: {priceData.expected_daily_sales}kg</p>
          </div>
          <div className="metrics-grid">
            <div className="metric">
              <span className="label">Current Avg Cost:</span>
              <span className="value">LKR {priceData.current_avg_cost}/kg</span>
            </div>
            <div className="metric">
              <span className="label">Recommended Range:</span>
              <span className="value">LKR {priceData.recommended_range.min}-{priceData.recommended_range.max}/kg</span>
            </div>
          </div>
        </div>
        <div className="chart-container">
          <Bar data={chartData} options={{
            responsive: true,
            plugins: { legend: { position: 'top' } },
            scales: {
              y: { type: 'linear', display: true, position: 'left' },
              y1: { type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false } }
            }
          }} />
        </div>
      </div>
    );
  };

  return (
    <div className="predictive-analytics">
      <h2>🔮 Predictive Analytics</h2>
      
      <div className="tab-buttons">
        <button 
          className={activeTab === 'demand' ? 'active' : ''} 
          onClick={() => setActiveTab('demand')}
        >
          📈 Demand Forecast
        </button>
        <button 
          className={activeTab === 'batch' ? 'active' : ''} 
          onClick={() => setActiveTab('batch')}
        >
          ⚖️ Batch Optimization
        </button>
        <button 
          className={activeTab === 'reorder' ? 'active' : ''} 
          onClick={() => setActiveTab('reorder')}
        >
          🔔 Reorder Alerts
        </button>
        <button 
          className={activeTab === 'price' ? 'active' : ''} 
          onClick={() => setActiveTab('price')}
        >
          💰 Price Optimization
        </button>
      </div>

      <div className="tab-content">
        {loading && <div className="loading">Loading analytics...</div>}
        {!loading && activeTab === 'demand' && renderDemandForecast()}
        {!loading && activeTab === 'batch' && renderBatchOptimization()}
        {!loading && activeTab === 'reorder' && renderReorderAlerts()}
        {!loading && activeTab === 'price' && renderPriceOptimization()}
      </div>
    </div>
  );
};

export default PredictiveAnalytics;