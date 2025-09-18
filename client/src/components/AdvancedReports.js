import React, { useState, useEffect } from 'react';

function AdvancedReports() {
  const [activeReport, setActiveReport] = useState('profit-trends');
  const [reportData, setReportData] = useState({});
  const [loading, setLoading] = useState(false);

  const reports = [
    { id: 'profit-trends', label: 'Profit Trends', icon: '📈' },
    { id: 'customer-profitability', label: 'Customer Analysis', icon: '👥' },
    { id: 'seasonal-patterns', label: 'Seasonal Patterns', icon: '📅' },
    { id: 'cost-efficiency', label: 'Cost Efficiency', icon: '⚡' },
    { id: 'waste-analysis', label: 'Waste Analysis', icon: '♻️' }
  ];

  useEffect(() => {
    fetchReportData(activeReport);
  }, [activeReport]);

  const fetchReportData = async (reportType) => {
    setLoading(true);
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/analytics/${reportType}`);
      const data = await response.json();
      setReportData(prev => ({ ...prev, [reportType]: data }));
    } catch (error) {
      console.error(`Error fetching ${reportType}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const renderProfitTrends = () => {
    const data = reportData['profit-trends'] || [];
    
    return (
      <div>
        <h3>📈 Profit Margin Trends (Last 12 Months)</h3>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Revenue (LKR)</th>
                <th>Costs (LKR)</th>
                <th>Profit (LKR)</th>
                <th>Margin (%)</th>
              </tr>
            </thead>
            <tbody>
              {data.map(row => (
                <tr key={row.month}>
                  <td>{row.month}</td>
                  <td className="currency">{(row.revenue || 0).toLocaleString()}</td>
                  <td className="currency">{(row.costs || 0).toLocaleString()}</td>
                  <td className={row.profit >= 0 ? 'currency' : 'profit-negative'}>
                    {(row.profit || 0).toLocaleString()}
                  </td>
                  <td style={{ 
                    color: row.profit_margin >= 20 ? '#28a745' : row.profit_margin >= 10 ? '#ffc107' : '#dc3545',
                    fontWeight: 'bold'
                  }}>
                    {(row.profit_margin || 0).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="insights-box">
          <h4>💡 Insights</h4>
          <ul>
            <li>Target profit margin: 20%+ (Green), 10-20% (Yellow), &lt;10% (Red)</li>
            <li>Monitor monthly trends to identify seasonal patterns</li>
            <li>Investigate months with low margins for cost optimization</li>
          </ul>
        </div>
      </div>
    );
  };

  const renderCustomerProfitability = () => {
    const data = reportData['customer-profitability'] || [];
    
    return (
      <div>
        <h3>👥 Customer Profitability Analysis</h3>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Orders</th>
                <th>Total Qty (kg)</th>
                <th>Revenue (LKR)</th>
                <th>Avg Price/kg</th>
                <th>Last Order</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map((customer, index) => (
                <tr key={customer.name}>
                  <td>
                    <strong>{customer.name}</strong>
                    <br />
                    <small style={{ color: '#666' }}>{customer.contact_info}</small>
                  </td>
                  <td>{customer.total_orders}</td>
                  <td>{customer.total_quantity}</td>
                  <td className="currency">{customer.total_revenue.toLocaleString()}</td>
                  <td className="currency">{customer.avg_price_per_kg.toFixed(2)}</td>
                  <td>{customer.last_order}</td>
                  <td>
                    {customer.days_since_last_order <= 30 ? (
                      <span style={{ color: '#28a745' }}>🟢 Active</span>
                    ) : customer.days_since_last_order <= 90 ? (
                      <span style={{ color: '#ffc107' }}>🟡 Inactive</span>
                    ) : (
                      <span style={{ color: '#dc3545' }}>🔴 Lost</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="insights-box">
          <h4>💡 Customer Insights</h4>
          <ul>
            <li><strong>Top 20%</strong> of customers generate {data.length > 0 ? 
              ((data.slice(0, Math.ceil(data.length * 0.2)).reduce((sum, c) => sum + c.total_revenue, 0) / 
                data.reduce((sum, c) => sum + c.total_revenue, 0)) * 100).toFixed(1) : 0}% of revenue</li>
            <li>Focus retention efforts on high-value customers</li>
            <li>Re-engage inactive customers (yellow/red status)</li>
          </ul>
        </div>
      </div>
    );
  };

  const renderSeasonalPatterns = () => {
    const data = reportData['seasonal-patterns'] || [];
    
    return (
      <div>
        <h3>📅 Seasonal Demand Patterns</h3>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Sales Count</th>
                <th>Quantity (kg)</th>
                <th>Revenue (LKR)</th>
                <th>Avg Order Size</th>
                <th>Demand Level</th>
              </tr>
            </thead>
            <tbody>
              {data.map(month => {
                const avgQuantity = data.reduce((sum, m) => sum + m.total_quantity, 0) / data.length;
                const demandLevel = month.total_quantity > avgQuantity * 1.2 ? 'High' : 
                                 month.total_quantity > avgQuantity * 0.8 ? 'Normal' : 'Low';
                
                return (
                  <tr key={month.month_name}>
                    <td>{month.month_name}</td>
                    <td>{month.total_sales}</td>
                    <td>{month.total_quantity}</td>
                    <td className="currency">{month.total_revenue.toLocaleString()}</td>
                    <td>{month.avg_order_size.toFixed(1)} kg</td>
                    <td>
                      <span style={{ 
                        color: demandLevel === 'High' ? '#28a745' : 
                               demandLevel === 'Normal' ? '#17a2b8' : '#dc3545',
                        fontWeight: 'bold'
                      }}>
                        {demandLevel === 'High' ? '🔥' : demandLevel === 'Normal' ? '📊' : '❄️'} {demandLevel}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        <div className="insights-box">
          <h4>💡 Seasonal Insights</h4>
          <ul>
            <li>Plan production capacity based on high-demand months</li>
            <li>Adjust inventory levels for seasonal variations</li>
            <li>Consider promotional campaigns during low-demand periods</li>
          </ul>
        </div>
      </div>
    );
  };

  const renderCostEfficiency = () => {
    const data = reportData['cost-efficiency'] || [];
    
    return (
      <div>
        <h3>⚡ Cost Efficiency Analysis</h3>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Batch #</th>
                <th>Date</th>
                <th>Conversion Rate</th>
                <th>Cost/kg Glue</th>
                <th>Revenue</th>
                <th>Profit</th>
                <th>Efficiency</th>
              </tr>
            </thead>
            <tbody>
              {data.slice(0, 20).map(batch => {
                const avgConversion = data.reduce((sum, b) => sum + b.conversion_rate, 0) / data.length;
                const isEfficient = batch.conversion_rate >= avgConversion * 0.95;
                
                return (
                  <tr key={batch.batch_number}>
                    <td>#{batch.batch_number}</td>
                    <td>{batch.production_date}</td>
                    <td style={{ 
                      color: batch.conversion_rate >= avgConversion ? '#28a745' : '#dc3545',
                      fontWeight: 'bold'
                    }}>
                      {batch.conversion_rate.toFixed(1)}%
                    </td>
                    <td className="currency">{batch.cost_per_kg_glue.toFixed(2)}</td>
                    <td className="currency">{batch.revenue_generated.toLocaleString()}</td>
                    <td className={batch.profit >= 0 ? 'currency' : 'profit-negative'}>
                      {batch.profit.toLocaleString()}
                    </td>
                    <td>
                      <span style={{ 
                        color: isEfficient ? '#28a745' : '#dc3545',
                        fontWeight: 'bold'
                      }}>
                        {isEfficient ? '✅ Good' : '⚠️ Poor'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        <div className="insights-box">
          <h4>💡 Efficiency Insights</h4>
          <ul>
            <li>Average conversion rate: {data.length > 0 ? 
              (data.reduce((sum, b) => sum + b.conversion_rate, 0) / data.length).toFixed(1) : 0}%</li>
            <li>Target: Maintain conversion rate above 95% of average</li>
            <li>Investigate batches with poor efficiency for process improvements</li>
          </ul>
        </div>
      </div>
    );
  };

  const renderWasteAnalysis = () => {
    const data = reportData['waste-analysis'] || [];
    
    return (
      <div>
        <h3>♻️ Waste Analysis & Conversion Tracking</h3>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Batches</th>
                <th>Latex Used (kg)</th>
                <th>Glue Produced (kg)</th>
                <th>Waste (kg)</th>
                <th>Avg Conversion</th>
                <th>Best/Worst</th>
              </tr>
            </thead>
            <tbody>
              {data.map(month => (
                <tr key={month.month}>
                  <td>{month.month}</td>
                  <td>{month.total_batches}</td>
                  <td>{month.total_latex.toFixed(1)}</td>
                  <td>{month.total_glue.toFixed(1)}</td>
                  <td style={{ 
                    color: month.total_waste > month.total_latex * 0.8 ? '#dc3545' : '#28a745',
                    fontWeight: 'bold'
                  }}>
                    {month.total_waste.toFixed(1)}
                  </td>
                  <td style={{ 
                    color: month.avg_conversion_rate >= 25 ? '#28a745' : 
                           month.avg_conversion_rate >= 20 ? '#ffc107' : '#dc3545',
                    fontWeight: 'bold'
                  }}>
                    {month.avg_conversion_rate.toFixed(1)}%
                  </td>
                  <td>
                    <small>
                      Best: {month.max_conversion_rate.toFixed(1)}%<br />
                      Worst: {month.min_conversion_rate.toFixed(1)}%
                    </small>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="insights-box">
          <h4>💡 Waste Reduction Insights</h4>
          <ul>
            <li>Target conversion rate: 25%+ (Excellent), 20-25% (Good), &lt;20% (Needs improvement)</li>
            <li>Monitor consistency - large gaps between best/worst indicate process variability</li>
            <li>High waste months may indicate quality issues or process problems</li>
          </ul>
        </div>
      </div>
    );
  };

  const renderReport = () => {
    if (loading) {
      return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading report data...</div>;
    }

    switch (activeReport) {
      case 'profit-trends': return renderProfitTrends();
      case 'customer-profitability': return renderCustomerProfitability();
      case 'seasonal-patterns': return renderSeasonalPatterns();
      case 'cost-efficiency': return renderCostEfficiency();
      case 'waste-analysis': return renderWasteAnalysis();
      default: return <div>Select a report to view</div>;
    }
  };

  return (
    <div className="section">
      <div className="section-title">📊 Advanced Business Reports</div>
      
      <div className="tab-nav" style={{ marginBottom: '2rem' }}>
        {reports.map(report => (
          <button
            key={report.id}
            className={`tab-button ${activeReport === report.id ? 'active' : ''}`}
            onClick={() => setActiveReport(report.id)}
          >
            {report.icon} {report.label}
          </button>
        ))}
      </div>

      <div className="report-content">
        {renderReport()}
      </div>
      
      <style jsx>{`
        .table-container {
          max-height: 400px;
          overflow-y: auto;
          margin-bottom: 2rem;
        }
        
        .insights-box {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 1.5rem;
          margin-top: 2rem;
        }
        
        .insights-box h4 {
          margin-top: 0;
          color: #495057;
        }
        
        .insights-box ul {
          margin-bottom: 0;
        }
        
        .insights-box li {
          margin-bottom: 0.5rem;
        }
      `}</style>
    </div>
  );
}

export default AdvancedReports;