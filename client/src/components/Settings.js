import React, { useState, useEffect } from 'react';

function Settings() {
  const [settings, setSettings] = useState({
    company_name: 'Rubber Glue Sales',
    address: '',
    phone: '',
    email: ''
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/settings`);
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update settings');
      }
      
      setMessage('✅ Settings updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error updating settings:', error);
      setMessage('❌ Failed to update settings');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div className="section">
      <div className="section-title">⚙️ Company Settings</div>
      
      {message && (
        <div style={{
          padding: '1rem',
          marginBottom: '1rem',
          borderRadius: '4px',
          backgroundColor: message.includes('❌') ? '#f8d7da' : '#d4edda',
          color: message.includes('❌') ? '#721c24' : '#155724',
          border: `1px solid ${message.includes('❌') ? '#f5c6cb' : '#c3e6cb'}`
        }}>
          {message}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="form-grid">
        <div className="form-group">
          <label>Company Name</label>
          <input
            type="text"
            value={settings.company_name}
            onChange={(e) => setSettings({...settings, company_name: e.target.value})}
            placeholder="Your Company Name"
            required
          />
        </div>
        
        <div className="form-group">
          <label>Address</label>
          <textarea
            value={settings.address}
            onChange={(e) => setSettings({...settings, address: e.target.value})}
            placeholder="Your Business Address"
            rows="3"
            style={{ resize: 'vertical' }}
          />
        </div>
        
        <div className="form-group">
          <label>Phone Number</label>
          <input
            type="text"
            value={settings.phone}
            onChange={(e) => setSettings({...settings, phone: e.target.value})}
            placeholder="Your Phone Number"
          />
        </div>
        
        <div className="form-group">
          <label>Email Address</label>
          <input
            type="email"
            value={settings.email}
            onChange={(e) => setSettings({...settings, email: e.target.value})}
            placeholder="your@email.com"
          />
        </div>
        
        <div style={{ gridColumn: '1 / -1' }}>
          <button type="submit" className="btn btn-primary">
            Save Settings
          </button>
        </div>
      </form>
      
      <div style={{
        marginTop: '2rem',
        padding: '1rem',
        backgroundColor: '#f8f9fa',
        borderRadius: '4px'
      }}>
        <h4>📄 Bill Preview:</h4>
        <div style={{
          fontFamily: 'monospace',
          fontSize: '0.9rem',
          backgroundColor: 'white',
          padding: '1rem',
          border: '1px solid #ddd',
          borderRadius: '4px',
          whiteSpace: 'pre-line'
        }}>
{`================================
      ${settings.company_name.toUpperCase()}
         INVOICE
================================

${settings.address ? settings.address + '\n' : ''}${settings.phone ? 'Phone: ' + settings.phone + '\n' : ''}${settings.email ? 'Email: ' + settings.email + '\n' : ''}
--------------------------------
Date: 2024-01-15
Invoice #: 0001

Customer: Sample Customer
Product: Rubber Latex Glue
Quantity: 25.0 kg
Price/kg: LKR 800

TOTAL: LKR 20,000
--------------------------------
Thank you for your business!
================================`}
        </div>
      </div>
    </div>
  );
}

export default Settings;