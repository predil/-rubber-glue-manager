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
  
  const [costBreakdown, setCostBreakdown] = useState({
    chemical_cost: 0,
    transport_cost: 0,
    labour_cost: 0,
    total_cost: 0
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
    setCostBreakdown({
      chemical_cost: 0,
      transport_cost: 0,
      labour_cost: 0,
      total_cost: 0
    });
    setEditingBatch(null);
    setShowForm(false);
  };

  // Calculate production rate and average
  const calculateProductionRate = (latex, glue) => {
    return (glue / latex * 100).toFixed(1);
  };

  const getAverageProductionRate = () => {
    if (batches.length === 0) return 0;
    const totalRate = batches.reduce((sum, batch) => {
      return sum + (batch.glue_separated / batch.latex_quantity * 100);
    }, 0);
    return (totalRate / batches.length).toFixed(1);
  };

  const isLowProductionRate = (rate, average) => {
    return parseFloat(rate) < parseFloat(average) * 0.9; // 10% below average
  };

  const averageRate = getAverageProductionRate();

  // Calculate costs when latex quantity or production date changes
  const calculateCosts = async () => {
    if (!formData.latex_quantity || !formData.production_date) {
      setCostBreakdown({ chemical_cost: 0, transport_cost: 0, labour_cost: 0, total_cost: 0 });
      return;
    }

    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/calculate-batch-cost`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latex_quantity: parseFloat(formData.latex_quantity),
          production_date: formData.production_date
        })
      });
      
      if (response.ok) {
        const costs = await response.json();
        setCostBreakdown({
          chemical_cost: costs.chemical_cost,
          transport_cost: costs.transportation_cost,
          labour_cost: costs.labour_cost,
          total_cost: costs.total_cost
        });
        
        // Auto-update the cost_to_prepare field
        setFormData(prev => ({
          ...prev,
          cost_to_prepare: costs.total_cost.toFixed(2)
        }));
      }
    } catch (error) {
      console.error('Error calculating costs:', error);
    }
  };

  // Recalculate costs when latex quantity or date changes
  React.useEffect(() => {
    const timeoutId = setTimeout(calculateCosts, 500); // Debounce
    return () => clearTimeout(timeoutId);
  }, [formData.latex_quantity, formData.production_date]);



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
            <label>Production Rate</label>
            <input
              type="text"
              value={formData.latex_quantity && formData.glue_separated ? 
                `${calculateProductionRate(formData.latex_quantity, formData.glue_separated)}% ${parseFloat(calculateProductionRate(formData.latex_quantity, formData.glue_separated)) < parseFloat(averageRate) * 0.9 ? '(Low)' : '(Good)'}` : '0%'}
              disabled
              style={{
                color: formData.latex_quantity && formData.glue_separated && 
                       parseFloat(calculateProductionRate(formData.latex_quantity, formData.glue_separated)) < parseFloat(averageRate) * 0.9 ? 
                       '#dc3545' : '#28a745',
                fontWeight: 'bold'
              }}
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
          
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label>Cost Breakdown</label>
            <div style={{
              border: '1px solid #ddd',
              borderRadius: '4px',
              padding: '1rem',
              backgroundColor: '#f8f9fa'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.9rem', color: '#666' }}>Chemical Cost</label>
                  <div style={{ fontWeight: 'bold', color: '#28a745' }}>
                    LKR {costBreakdown.chemical_cost.toFixed(2)}
                  </div>
                </div>
                
                <div>
                  <label style={{ fontSize: '0.9rem', color: '#666' }}>Transport Cost</label>
                  <div style={{ fontWeight: 'bold', color: '#17a2b8' }}>
                    LKR {costBreakdown.transport_cost.toFixed(2)}
                  </div>
                </div>
                
                <div>
                  <label style={{ fontSize: '0.9rem', color: '#666' }}>Labour Cost</label>
                  <div style={{ fontWeight: 'bold', color: '#ffc107' }}>
                    LKR {costBreakdown.labour_cost.toFixed(2)}
                  </div>
                </div>
                
                <div>
                  <label style={{ fontSize: '0.9rem', color: '#666' }}>Total Cost</label>
                  <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#dc3545' }}>
                    LKR {costBreakdown.total_cost.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="form-group">
            <label>Cost to Prepare (LKR)</label>
            <input
              type="number"
              step="0.01"
              value={formData.cost_to_prepare}
              onChange={(e) => setFormData({...formData, cost_to_prepare: e.target.value})}
              style={{ backgroundColor: '#e9ecef' }}
              required
            />
            <small style={{ color: '#666', fontSize: '0.8rem' }}>Auto-calculated from breakdown above</small>
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

      {batches.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          margin: '2rem 0'
        }}>
          <div className="stat-card">
            <div className="stat-value">{averageRate}%</div>
            <div className="stat-label">Average Production Rate</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-value">
              {batches.filter(batch => {
                const rate = calculateProductionRate(batch.latex_quantity, batch.glue_separated);
                return isLowProductionRate(rate, averageRate);
              }).length}
            </div>
            <div className="stat-label">Low Performance Batches</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-value">
              {batches.length > 0 ? Math.max(...batches.map(batch => 
                parseFloat(calculateProductionRate(batch.latex_quantity, batch.glue_separated))
              )).toFixed(1) : 0}%
            </div>
            <div className="stat-label">Best Production Rate</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-value">
              {batches.length > 0 ? Math.min(...batches.map(batch => 
                parseFloat(calculateProductionRate(batch.latex_quantity, batch.glue_separated))
              )).toFixed(1) : 0}%
            </div>
            <div className="stat-label">Lowest Production Rate</div>
          </div>
        </div>
      )}

      <table className="table">
        <thead>
          <tr>
            <th>Batch #</th>
            <th>Date</th>
            <th>Latex (kg)</th>
            <th>Glue (kg)</th>
            <th>Rate (%)</th>
            <th>Cost (LKR)</th>
            <th>Price/kg (LKR)</th>
            <th>Notes</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {batches.map(batch => {
            const productionRate = calculateProductionRate(batch.latex_quantity, batch.glue_separated);
            const isLow = isLowProductionRate(productionRate, averageRate);
            
            return (
              <tr key={batch.id}>
                <td>#{batch.batch_number}</td>
                <td>{batch.production_date}</td>
                <td>{batch.latex_quantity}</td>
                <td>{batch.glue_separated}</td>
                <td style={{ 
                  color: isLow ? '#dc3545' : '#28a745',
                  fontWeight: 'bold'
                }}>
                  {productionRate}%
                </td>
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
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default BatchManager;