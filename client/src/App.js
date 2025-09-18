import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import Login from './components/Login';
import BatchManager from './components/BatchManager';
import CustomerManager from './components/CustomerManager';
import SalesManager from './components/SalesManager';
import BasicAnalytics from './components/BasicAnalytics';
import BackupRestore from './components/BackupRestore';
import RecipeCalculator from './components/RecipeCalculator';
import ReturnsManager from './components/ReturnsManager';
import Settings from './components/Settings';
import CostManager from './components/CostManager';
import LowStockAlert from './components/LowStockAlert';
import AdvancedReports from './components/AdvancedReports';
import PredictiveAnalytics from './components/PredictiveAnalytics';

function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('batches');
  const [batches, setBatches] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [sales, setSales] = useState([]);

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const fetchBatches = useCallback(async () => {
    try {
      const response = await fetch(`${apiUrl}/api/batches`);
      const data = await response.json();
      setBatches(data);
    } catch (error) {
      console.error('Error fetching batches:', error);
    }
  }, [apiUrl]);

  const fetchCustomers = useCallback(async () => {
    try {
      const response = await fetch(`${apiUrl}/api/customers`);
      const data = await response.json();
      setCustomers(data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  }, [apiUrl]);

  const fetchSales = useCallback(async () => {
    try {
      const response = await fetch(`${apiUrl}/api/sales`);
      const data = await response.json();
      setSales(data);
    } catch (error) {
      console.error('Error fetching sales:', error);
    }
  }, [apiUrl]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setUser({ username: 'admin' });
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchBatches();
      fetchCustomers();
      fetchSales();
    }
  }, [user, fetchBatches, fetchCustomers, fetchSales]);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const tabs = [
    { id: 'batches', label: 'Production', icon: '🏭' },
    { id: 'recipe', label: 'Recipe', icon: '🧪' },
    { id: 'costs', label: 'Costs', icon: '💰' },
    { id: 'customers', label: 'Customers', icon: '👥' },
    { id: 'sales', label: 'Sales', icon: '💵' },
    { id: 'returns', label: 'Returns', icon: '🔄' },
    { id: 'analytics', label: 'Reports', icon: '📊' },
    { id: 'advanced-reports', label: 'Analytics', icon: '📈' },
    { id: 'predictive', label: 'Predictive', icon: '🔮' },
    { id: 'backup', label: 'Backup', icon: '💾' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ];

  return (
    <div className="app">
      <header className="app-header">
        <h1>🌿 Rubber Glue Manager</h1>
        <button 
          onClick={handleLogout}
          style={{
            background: '#ff4757',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </header>

      <nav className="tab-nav">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </nav>

      <main className="app-main">
        {activeTab === 'batches' && (
          <BatchManager batches={batches} onUpdate={fetchBatches} />
        )}
        {activeTab === 'recipe' && (
          <RecipeCalculator />
        )}
        {activeTab === 'costs' && (
          <CostManager />
        )}
        {activeTab === 'customers' && (
          <CustomerManager customers={customers} onUpdate={fetchCustomers} />
        )}
        {activeTab === 'sales' && (
          <SalesManager 
            sales={sales} 
            batches={batches} 
            customers={customers} 
            onUpdate={fetchSales} 
          />
        )}
        {activeTab === 'returns' && (
          <ReturnsManager 
            sales={sales} 
            onUpdate={() => {
              fetchSales();
              fetchBatches();
            }} 
          />
        )}
        {activeTab === 'analytics' && (
          <BasicAnalytics batches={batches} sales={sales} />
        )}
        {activeTab === 'advanced-reports' && (
          <AdvancedReports />
        )}
        {activeTab === 'predictive' && (
          <PredictiveAnalytics />
        )}
        {activeTab === 'backup' && (
          <BackupRestore onUpdate={() => {
            fetchBatches();
            fetchCustomers();
            fetchSales();
          }} />
        )}
        {activeTab === 'settings' && (
          <Settings />
        )}
      </main>
      
      {/* Low Stock Alert - appears on all tabs */}
      <LowStockAlert />
    </div>
  );
}

export default App;