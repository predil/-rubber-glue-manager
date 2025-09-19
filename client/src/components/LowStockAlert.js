import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';

function LowStockAlert() {
  const [lowStockChemicals, setLowStockChemicals] = useState([]);
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    fetchLowStock();
    // Check every 30 seconds
    const interval = setInterval(fetchLowStock, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchLowStock = async () => {
    try {
      const response = await fetch(`${API_URL}/api/chemicals/low-stock`);
      const data = await response.json();
      setLowStockChemicals(data);
      setShowAlert(data.length > 0);
    } catch (error) {
      console.error('Error fetching low stock:', error);
    }
  };

  if (!showAlert) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '80px',
      right: '20px',
      backgroundColor: '#fff3cd',
      border: '1px solid #ffeaa7',
      borderRadius: '8px',
      padding: '1rem',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      zIndex: 1000,
      maxWidth: '350px',
      animation: 'slideIn 0.3s ease-out'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '0.5rem'
      }}>
        <h4 style={{ 
          margin: 0, 
          color: '#856404',
          fontSize: '1rem'
        }}>
          ⚠️ Low Stock Alert
        </h4>
        <button
          onClick={() => setShowAlert(false)}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '1.2rem',
            cursor: 'pointer',
            color: '#856404'
          }}
        >
          ×
        </button>
      </div>
      
      <div style={{ fontSize: '0.9rem', color: '#856404' }}>
        {lowStockChemicals.map(chemical => (
          <div key={chemical.id} style={{ 
            marginBottom: '0.5rem',
            padding: '0.5rem',
            backgroundColor: '#fff',
            borderRadius: '4px',
            border: '1px solid #ffeaa7'
          }}>
            <strong>{chemical.chemical_name}</strong>
            <br />
            <span style={{ fontSize: '0.8rem' }}>
              Remaining: {chemical.remaining_quantity.toFixed(1)} {chemical.unit} 
              ({chemical.stock_percentage.toFixed(1)}%)
            </span>
          </div>
        ))}
        
        <div style={{ 
          marginTop: '0.5rem', 
          fontSize: '0.8rem',
          fontStyle: 'italic'
        }}>
          Please restock these chemicals soon.
        </div>
      </div>
      
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

export default LowStockAlert;