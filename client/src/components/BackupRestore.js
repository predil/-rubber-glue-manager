import React, { useState } from 'react';

function BackupRestore({ onUpdate }) {
  const [restoring, setRestoring] = useState(false);
  const [message, setMessage] = useState('');

  const handleBackup = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/backup`);
      
      if (!response.ok) {
        throw new Error('Backup failed');
      }
      
      // Create download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Generate filename with current date/time
      const now = new Date();
      const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
      a.download = `rubber-glue-backup-${timestamp}.xlsx`;
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      setMessage('✅ Backup downloaded successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Backup error:', error);
      setMessage('❌ Backup failed: ' + error.message);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const handleRestore = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.name.endsWith('.xlsx')) {
      setMessage('❌ Please select an Excel (.xlsx) file');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    
    if (!window.confirm('⚠️ This will replace ALL current data with the backup data. Are you sure?')) {
      return;
    }
    
    setRestoring(true);
    setMessage('🔄 Restoring data...');
    
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const formData = new FormData();
      formData.append('backup', file);
      
      const response = await fetch(`${apiUrl}/api/restore`, {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Restore failed');
      }
      
      setMessage(`✅ Data restored successfully! ${result.batches} batches, ${result.customers} customers, ${result.sales} sales`);
      
      // Refresh all data
      if (onUpdate) {
        onUpdate();
      }
      
      setTimeout(() => setMessage(''), 5000);
    } catch (error) {
      console.error('Restore error:', error);
      setMessage('❌ Restore failed: ' + error.message);
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setRestoring(false);
      // Clear file input
      event.target.value = '';
    }
  };

  return (
    <div className="section">
      <div className="section-title">💾 Backup & Restore</div>
      
      {message && (
        <div className="backup-message" style={{
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
      
      <div className="backup-controls" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '2rem'
      }}>
        <div className="backup-section">
          <h3>📤 Export Backup</h3>
          <p>Download all your data as an Excel file for safekeeping.</p>
          <button 
            className="btn btn-primary"
            onClick={handleBackup}
            style={{ width: '100%' }}
          >
            📥 Download Backup (Excel)
          </button>
          <small style={{ color: '#666', marginTop: '0.5rem', display: 'block' }}>
            File includes: Batches, Customers, Sales with timestamp
          </small>
        </div>
        
        <div className="backup-section">
          <h3>📥 Import Backup</h3>
          <p>Restore data from a previously downloaded backup file.</p>
          <input
            type="file"
            accept=".xlsx"
            onChange={handleRestore}
            disabled={restoring}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '2px dashed #ddd',
              borderRadius: '4px',
              cursor: restoring ? 'not-allowed' : 'pointer'
            }}
          />
          <small style={{ color: '#666', marginTop: '0.5rem', display: 'block' }}>
            ⚠️ This will replace ALL current data
          </small>
        </div>
      </div>
      
      <div className="backup-info" style={{
        marginTop: '2rem',
        padding: '1rem',
        backgroundColor: '#f8f9fa',
        borderRadius: '4px'
      }}>
        <h4>💡 Backup Tips:</h4>
        <ul style={{ marginLeft: '1rem' }}>
          <li>Create regular backups to protect your data</li>
          <li>Store backup files in a safe location (cloud storage, external drive)</li>
          <li>Backup files include all batches, customers, and sales data</li>
          <li>You can open backup files in Excel to view/edit data</li>
          <li>Always backup before major changes or updates</li>
        </ul>
      </div>
    </div>
  );
}

export default BackupRestore;