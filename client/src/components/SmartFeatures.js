import React, { useState, useEffect } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

const SmartFeatures = () => {
  const [activeTab, setActiveTab] = useState('anomaly');
  const [anomalyData, setAnomalyData] = useState(null);
  const [pricingData, setPricingData] = useState(null);
  const [demandData, setDemandData] = useState(null);
  const [qualityData, setQualityData] = useState(null);
  const [latexInput, setLatexInput] = useState('170');
  const [loading, setLoading] = useState(false);

  const fetchAnomalyDetection = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/smart/anomaly-detection');
      const data = await response.json();
      setAnomalyData(data);
    } catch (error) {
      console.error('Error fetching anomaly detection:', error);
    }
    setLoading(false);
  };

  const fetchSmartPricing = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/smart/pricing-suggestions');
      const data = await response.json();
      setPricingData(data);
    } catch (error) {
      console.error('Error fetching smart pricing:', error);
    }
    setLoading(false);
  };

  const fetchDemandPrediction = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/smart/demand-prediction');
      const data = await response.json();
      setDemandData(data);
    } catch (error) {
      console.error('Error fetching demand prediction:', error);
    }
    setLoading(false);
  };

  const fetchQualityPrediction = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/smart/quality-prediction?latex_quantity=${latexInput}`);
      const data = await response.json();
      setQualityData(data);
    } catch (error) {
      console.error('Error fetching quality prediction:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'anomaly') fetchAnomalyDetection();
    else if (activeTab === 'pricing') fetchSmartPricing();
    else if (activeTab === 'demand') fetchDemandPrediction();
    else if (activeTab === 'quality') fetchQualityPrediction();
  }, [activeTab]);

  const renderAnomalyDetection = () => {
    if (!anomalyData) return <div className="loading">Loading...</div>;

    return (
      <div>
        <div className="insight-card">
          <h3>🔍 Anomaly Detection</h3>
          <div className="metrics-grid">
            <div className="metric">
              <span className="label">Anomalies Found:</span>
              <span className="value">{anomalyData.anomalies.length}</span>
            </div>
            <div className="metric">
              <span className="label">Anomaly Rate:</span>
              <span className="value">{anomalyData.anomaly_rate}%</span>
            </div>
            <div className="metric">
              <span className="label">Total Batches:</span>
              <span className="value">{anomalyData.total_batches}</span>
            </div>
          </div>
        </div>
        
        {anomalyData.anomalies.length > 0 ? (
          <div className="anomaly-grid">
            {anomalyData.anomalies.map((anomaly, index) => (
              <div key={index} className={`anomaly-card ${anomaly.severity}`}>
                <h4>Batch #{anomaly.batch_number}</h4>
                <div className="anomaly-details">
                  <p><strong>Date:</strong> {new Date(anomaly.date).toLocaleDateString()}</p>
                  <p><strong>Type:</strong> {anomaly.type === 'conversion' ? 'Conversion Rate' : 'Cost'} Anomaly</p>
                  <p><strong>Deviation:</strong> {anomaly.deviation}% from normal</p>
                  <p><strong>Actual:</strong> {(anomaly.value * 100).toFixed(1)}%</p>
                  <p><strong>Expected:</strong> {(anomaly.expected * 100).toFixed(1)}%</p>
                </div>
                <div className={`severity-badge ${anomaly.severity}`}>
                  {anomaly.severity.toUpperCase()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-anomalies">
            <h3>✅ No Anomalies Detected</h3>
            <p>All recent batches are performing within normal parameters.</p>
          </div>
        )}
      </div>
    );
  };

  const renderSmartPricing = () => {
    if (!pricingData || pricingData.suggestion === 'insufficient_data') {
      return <div className="no-data">Insufficient data for smart pricing</div>;
    }

    const chartData = {
      labels: ['Competitive', 'Market', 'Premium', 'Current'],
      datasets: [{
        label: 'Price (LKR/kg)',
        data: [
          pricingData.ai_suggestions.competitive,
          pricingData.ai_suggestions.market,
          pricingData.ai_suggestions.premium,
          pricingData.current_optimal
        ],
        backgroundColor: ['#3498db', '#2ecc71', '#f39c12', '#e74c3c']
      }]
    };

    return (
      <div>
        <div className="insight-card">
          <h3>🤖 AI Price Suggestions</h3>
          <div className="recommendation">
            <strong>Recommendation: {pricingData.recommendation.replace('_', ' ').toUpperCase()}</strong>
            <p>Expected impact: {pricingData.expected_impact > 0 ? '+' : ''}{pricingData.expected_impact}%</p>
          </div>
        </div>
        
        <div className="chart-container">
          <Bar data={chartData} options={{
            responsive: true,
            plugins: { legend: { position: 'top' } },
            scales: { y: { beginAtZero: true } }
          }} />
        </div>
        
        <div className="pricing-suggestions">
          <div className="price-card competitive">
            <h4>💰 Competitive</h4>
            <div className="price">LKR {pricingData.ai_suggestions.competitive}/kg</div>
            <p>High volume, lower margin</p>
          </div>
          <div className="price-card market">
            <h4>📊 Market</h4>
            <div className="price">LKR {pricingData.ai_suggestions.market}/kg</div>
            <p>Balanced approach</p>
          </div>
          <div className="price-card premium">
            <h4>⭐ Premium</h4>
            <div className="price">LKR {pricingData.ai_suggestions.premium}/kg</div>
            <p>Higher margin, selective customers</p>
          </div>
        </div>
      </div>
    );
  };

  const renderDemandPrediction = () => {
    if (!demandData || demandData.prediction === 'insufficient_data') {
      return <div className="no-data">Insufficient data for demand prediction</div>;
    }

    const chartData = {
      labels: demandData.predictions.map(p => new Date(p.date).toLocaleDateString()),
      datasets: [{
        label: 'Predicted Demand (kg)',
        data: demandData.predictions.map(p => p.predicted_demand),
        borderColor: '#9b59b6',
        backgroundColor: 'rgba(155, 89, 182, 0.1)',
        tension: 0.4
      }]
    };

    return (
      <div>
        <div className="insight-card">
          <h3>🔮 ML Demand Prediction</h3>
          <div className="metrics-grid">
            <div className="metric">
              <span className="label">Model Type:</span>
              <span className="value">{demandData.model.toUpperCase()}</span>
            </div>
            <div className="metric">
              <span className="label">Avg Confidence:</span>
              <span className="value">{Math.round(demandData.predictions.reduce((sum, p) => sum + p.confidence, 0) / demandData.predictions.length)}%</span>
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
        
        <div className="prediction-summary">
          <h4>📈 14-Day Forecast Summary</h4>
          <div className="forecast-stats">
            <div className="stat">
              <span>Total Predicted:</span>
              <span>{Math.round(demandData.predictions.reduce((sum, p) => sum + p.predicted_demand, 0))}kg</span>
            </div>
            <div className="stat">
              <span>Daily Average:</span>
              <span>{Math.round(demandData.predictions.reduce((sum, p) => sum + p.predicted_demand, 0) / 14)}kg</span>
            </div>
            <div className="stat">
              <span>Peak Day:</span>
              <span>{Math.max(...demandData.predictions.map(p => p.predicted_demand))}kg</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderQualityPrediction = () => {
    if (!qualityData || qualityData.prediction === 'insufficient_data') {
      return <div className="no-data">Insufficient data for quality prediction</div>;
    }

    const scoreColor = qualityData.quality_score >= 80 ? '#27ae60' : 
                     qualityData.quality_score >= 60 ? '#f39c12' : '#e74c3c';

    const chartData = {
      labels: ['Quality Score', 'Remaining'],
      datasets: [{
        data: [qualityData.quality_score, 100 - qualityData.quality_score],
        backgroundColor: [scoreColor, '#ecf0f1'],
        borderWidth: 0
      }]
    };

    return (
      <div>
        <div className="quality-input">
          <label>Latex Quantity (kg):</label>
          <input 
            type="number" 
            value={latexInput} 
            onChange={(e) => setLatexInput(e.target.value)}
            onBlur={fetchQualityPrediction}
          />
          <button onClick={fetchQualityPrediction}>Predict Quality</button>
        </div>
        
        <div className="insight-card">
          <h3>🎯 Quality Prediction</h3>
          <div className="quality-score">
            <div className="score-circle">
              <Doughnut data={chartData} options={{
                cutout: '70%',
                plugins: { legend: { display: false } }
              }} />
              <div className="score-text">
                <span className="score">{qualityData.quality_score}</span>
                <span className="label">Quality Score</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="prediction-details">
          <div className="detail-card">
            <h4>📊 Predictions</h4>
            <p><strong>Conversion Rate:</strong> {(qualityData.predicted_conversion * 100).toFixed(1)}%</p>
            <p><strong>Expected Output:</strong> {qualityData.expected_glue_output}kg glue</p>
            <p><strong>Risk Level:</strong> <span className={`risk-${qualityData.risk_level}`}>{qualityData.risk_level.toUpperCase()}</span></p>
          </div>
          
          {qualityData.risk_factors.length > 0 && (
            <div className="detail-card risk-factors">
              <h4>⚠️ Risk Factors</h4>
              <ul>
                {qualityData.risk_factors.map((factor, index) => (
                  <li key={index}>{factor}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="detail-card recommendations">
            <h4>💡 Recommendations</h4>
            <ul>
              {qualityData.recommendations.map((rec, index) => (
                <li key={index}>{rec}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="smart-features">
      <h2>🧠 Smart AI Features</h2>
      
      <div className="tab-buttons">
        <button 
          className={activeTab === 'anomaly' ? 'active' : ''} 
          onClick={() => setActiveTab('anomaly')}
        >
          🔍 Anomaly Detection
        </button>
        <button 
          className={activeTab === 'pricing' ? 'active' : ''} 
          onClick={() => setActiveTab('pricing')}
        >
          🤖 Smart Pricing
        </button>
        <button 
          className={activeTab === 'demand' ? 'active' : ''} 
          onClick={() => setActiveTab('demand')}
        >
          🔮 Demand Prediction
        </button>
        <button 
          className={activeTab === 'quality' ? 'active' : ''} 
          onClick={() => setActiveTab('quality')}
        >
          🎯 Quality Prediction
        </button>
      </div>

      <div className="tab-content">
        {loading && <div className="loading">Loading AI analysis...</div>}
        {!loading && activeTab === 'anomaly' && renderAnomalyDetection()}
        {!loading && activeTab === 'pricing' && renderSmartPricing()}
        {!loading && activeTab === 'demand' && renderDemandPrediction()}
        {!loading && activeTab === 'quality' && renderQualityPrediction()}
      </div>
    </div>
  );
};

export default SmartFeatures;