import React, { useState } from 'react';

function BatchManager({ batches, onUpdate }) {
  const [showForm, setShowForm] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [formData, setFormData] = useState({
    latex_quantity: '',
    glue_separated: '',
    production_date: new Date().toISOString().split('T')[0],
    cost_to_prepare: '',
    selling_price_per_kg: '',
    notes: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    const url = editingBatch 
      ? `${apiUrl}/api/batches/${editingBatch.id}`
      : `${apiUrl}/api/batches`;
    
    const method = editingBatch ? 'PUT' : 'POST';
    
    try {
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      resetForm();
      onUpdate();
    } catch (error) {
      console.error('Error saving batch:', error);
    }
  };

  const handleEdit = (batch) => {
    setEditingBatch(batch);
    setFormData({
      latex_quantity: batch.latex_quantity,
      glue_separated: batch.glue_separated,
      production_date: batch.production_date,
      cost_to_prepare: batch.cost_to_prepare,
      selling_price_per_kg: batch.selling_price_per_kg,
      notes: batch.notes || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this batch?')) {
      try {
        await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/batches/${id}`, {
          method: 'DELETE'
        });
        onUpdate();
      } catch (error) {
        console.error('Error deleting batch:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      latex_quantity: '',
      glue_separated: '',
      production_date: new Date().toISOString().split('T')[0],
      cost_to_prepare: '',
      selling_price_per_kg: '',
      notes: ''
    });
    setEditingBatch(null);
    setShowForm(false);
  };

  const calculateProfit = (batch) => {
    const totalSold = batch.total_sold || 0;
    const revenue = totalSold * batch.selling_price_per_kg;
    const cost = (batch.cost_to_prepare * totalSold) / batch.glue_separated;
    return revenue - cost;
  };

  return (
    <div className="section">
      <div className="section-title">
        🏭 Production Batches
        <button 
          className="btn btn-primary btn-small"
          onClick={() => setShowForm(!showForm)}
          style={{ marginLeft: 'auto' }}
        >
          {showForm ? 'Cancel' : 'Add Batch'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="form-grid">
          <div className="form-group">
            <label>Latex Quantity (kg)</label>
            <input
              type="number"
              step="0.1"
              value={formData.latex_quantity}
              onChange={(e) => setFormData({...formData, latex_quantity: e.target.value})}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Glue Separated (kg)</label>
            <input
              type="number"
              step="0.1"
              value={formData.glue_separated}
              onChange={(e) => setFormData({...formData, glue_separated: e.target.value})}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Production Date</label>
            <input
              type="date"
              value={formData.production_date}
              onChange={(e) => setFormData({...formData, production_date: e.target.value})}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Cost to Prepare (LKR)</label>
            <input
              type="number"
              step="0.01"
              value={formData.cost_to_prepare}
              onChange={(e) => setFormData({...formData, cost_to_prepare: e.target.value})}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Selling Price per kg (LKR)</label>
            <input
              type="number"
              step="0.01"
              value={formData.selling_price_per_kg}
              onChange={(e) => setFormData({...formData, selling_price_per_kg: e.target.value})}
              required
            />
          </div>
          
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label>Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows="3"
            />
          </div>
          
          <div style={{ gridColumn: '1 / -1' }}>
            <button type="submit" className="btn btn-primary">
              {editingBatch ? 'Update Batch' : 'Create Batch'}
            </button>
            {showForm && (
              <button type="button" className="btn btn-secondary" onClick={resetForm} style={{ marginLeft: '1rem' }}>
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      <table className="table">
        <thead>
          <tr>
            <th>Batch #</th>
            <th>Date</th>
            <th>Latex (kg)</th>
            <th>Glue (kg)</th>
            <th>Cost (LKR)</th>
            <th>Price/kg (LKR)</th>
            <th>Notes</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {batches.map(batch => (
            <tr key={batch.id}>
              <td>#{batch.batch_number}</td>
              <td>{batch.production_date}</td>
              <td>{batch.latex_quantity}</td>
              <td>{batch.glue_separated}</td>
              <td className="currency">{batch.cost_to_prepare.toLocaleString()}</td>
              <td className="currency">{batch.selling_price_per_kg}</td>
              <td>{batch.notes}</td>
              <td>
                <button 
                  className="btn btn-secondary btn-small"
                  onClick={() => handleEdit(batch)}
                  style={{ marginRight: '0.5rem' }}
                >
                  Edit
                </button>
                <button 
                  className="btn btn-danger btn-small"
                  onClick={() => handleDelete(batch.id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default BatchManager;