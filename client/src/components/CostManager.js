import React, { useState, useEffect } from 'react';

function CostManager() {
  const [activeSection, setActiveSection] = useState('chemicals');
  const [chemicals, setChemicals] = useState([]);
  const [monthlyCosts, setMonthlyCosts] = useState([]);
  const [transports, setTransports] = useState([]);
  const [showChemicalForm, setShowChemicalForm] = useState(false);
  const [showMonthlyForm, setShowMonthlyForm] = useState(false);
  const [showTransportForm, setShowTransportForm] = useState(false);
  
  const [chemicalForm, setChemicalForm] = useState({
    chemical_name: '',
    purchase_date: new Date().toISOString().split('T')[0],
    quantity_purchased: '',
    unit: 'kg',
    total_cost: ''
  });
  
  const [monthlyForm, setMonthlyForm] = useState({
    month_year: new Date().toISOString().substring(0, 7),
    labour_cost: '',
    other_costs: ''
  });
  
  const [transportForm, setTransportForm] = useState({
    transport_date: new Date().toISOString().split('T')[0],
    total_cans: '',
    transport_cost: '',
    notes: ''
  });

  useEffect(() => {
    fetchChemicals();
    fetchMonthlyCosts();
    fetchTransports();
  }, []);

  const fetchChemicals = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/chemicals`);
      const data = await response.json();
      setChemicals(data);
    } catch (error) {
      console.error('Error fetching chemicals:', error);
    }
  };

  const fetchMonthlyCosts = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/monthly-costs`);
      const data = await response.json();
      setMonthlyCosts(data);
    } catch (error) {
      console.error('Error fetching monthly costs:', error);
    }
  };

  const fetchTransports = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/latex-transport`);
      const data = await response.json();
      setTransports(data);
    } catch (error) {
      console.error('Error fetching transports:', error);
    }
  };

  const handleChemicalSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      await fetch(`${apiUrl}/api/chemicals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chemicalForm)
      });
      
      setChemicalForm({
        chemical_name: '',
        purchase_date: new Date().toISOString().split('T')[0],
        quantity_purchased: '',
        unit: 'kg',
        total_cost: ''
      });
      setShowChemicalForm(false);
      fetchChemicals();
      alert('Chemical added successfully!');
    } catch (error) {
      console.error('Error adding chemical:', error);
      alert('Failed to add chemical');
    }
  };

  const handleMonthlySubmit = async (e) => {
    e.preventDefault();
    
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      await fetch(`${apiUrl}/api/monthly-costs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(monthlyForm)
      });
      
      setMonthlyForm({
        month_year: new Date().toISOString().substring(0, 7),
        labour_cost: '',
        other_costs: ''
      });
      setShowMonthlyForm(false);
      fetchMonthlyCosts();
      alert('Monthly costs updated successfully!');
    } catch (error) {
      console.error('Error updating monthly costs:', error);
      alert('Failed to update monthly costs');
    }
  };

  const handleTransportSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      await fetch(`${apiUrl}/api/latex-transport`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transportForm)
      });
      
      setTransportForm({
        transport_date: new Date().toISOString().split('T')[0],
        total_cans: '',
        transport_cost: '',
        notes: ''
      });
      setShowTransportForm(false);
      fetchTransports();
      alert('Transport record added successfully!');
    } catch (error) {
      console.error('Error adding transport:', error);
      alert('Failed to add transport record');
    }
  };

  return (
    <div>
      <div className="section">
        <div className="section-title">💰 Cost Management</div>
        
        <div className="tab-nav" style={{ marginBottom: '2rem' }}>
          <button 
            className={`tab-button ${activeSection === 'chemicals' ? 'active' : ''}`}
            onClick={() => setActiveSection('chemicals')}
          >
            🧪 Chemical Inventory
          </button>
          <button 
            className={`tab-button ${activeSection === 'transport' ? 'active' : ''}`}
            onClick={() => setActiveSection('transport')}
          >
            🚛 Latex Transport
          </button>
          <button 
            className={`tab-button ${activeSection === 'monthly' ? 'active' : ''}`}
            onClick={() => setActiveSection('monthly')}
          >
            📅 Monthly Labour
          </button>
        </div>

        {activeSection === 'chemicals' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3>Chemical Inventory & Bulk Purchases</h3>
              <button 
                className="btn btn-primary btn-small"
                onClick={() => setShowChemicalForm(!showChemicalForm)}
              >
                {showChemicalForm ? 'Cancel' : 'Add Chemical Purchase'}
              </button>
            </div>

            {showChemicalForm && (
              <form onSubmit={handleChemicalSubmit} className="form-grid" style={{ marginBottom: '2rem' }}>
                <div className="form-group">
                  <label>Chemical Name</label>
                  <select
                    value={chemicalForm.chemical_name}
                    onChange={(e) => setChemicalForm({...chemicalForm, chemical_name: e.target.value})}
                    required
                  >
                    <option value="">Select chemical...</option>
                    <option value="Coconut Oil">Coconut Oil</option>
                    <option value="KOH">KOH</option>
                    <option value="HEC">HEC</option>
                    <option value="Sodium Benzoate">Sodium Benzoate</option>
                    <option value="Ammonia">Ammonia</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Purchase Date</label>
                  <input
                    type="date"
                    value={chemicalForm.purchase_date}
                    onChange={(e) => setChemicalForm({...chemicalForm, purchase_date: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Quantity Purchased</label>
                  <input
                    type="number"
                    step="0.1"
                    value={chemicalForm.quantity_purchased}
                    onChange={(e) => setChemicalForm({...chemicalForm, quantity_purchased: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Unit</label>
                  <select
                    value={chemicalForm.unit}
                    onChange={(e) => setChemicalForm({...chemicalForm, unit: e.target.value})}
                  >
                    <option value="kg">kg</option>
                    <option value="L">Liters</option>
                    <option value="g">grams</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Total Cost (LKR)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={chemicalForm.total_cost}
                    onChange={(e) => setChemicalForm({...chemicalForm, total_cost: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Cost per Unit</label>
                  <input
                    type="text"
                    value={chemicalForm.quantity_purchased && chemicalForm.total_cost ? 
                      `LKR ${(chemicalForm.total_cost / chemicalForm.quantity_purchased).toFixed(2)}` : 'LKR 0'}
                    disabled
                  />
                </div>
                
                <div style={{ gridColumn: '1 / -1' }}>
                  <button type="submit" className="btn btn-primary">
                    Add Chemical Purchase
                  </button>
                </div>
              </form>
            )}

            <table className="table">
              <thead>
                <tr>
                  <th>Chemical</th>
                  <th>Purchase Date</th>
                  <th>Purchased</th>
                  <th>Remaining</th>
                  <th>Cost/Unit (LKR)</th>
                  <th>Total Cost (LKR)</th>
                </tr>
              </thead>
              <tbody>
                {chemicals.map(chemical => (
                  <tr key={chemical.id}>
                    <td>{chemical.chemical_name}</td>
                    <td>{chemical.purchase_date}</td>
                    <td>{chemical.quantity_purchased} {chemical.unit}</td>
                    <td>{chemical.remaining_quantity} {chemical.unit}</td>
                    <td className="currency">{chemical.cost_per_unit.toFixed(2)}</td>
                    <td className="currency">{chemical.total_cost.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {activeSection === 'transport' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3>Latex Transport Records (Batch-wise)</h3>
              <button 
                className="btn btn-primary btn-small"
                onClick={() => setShowTransportForm(!showTransportForm)}
              >
                {showTransportForm ? 'Cancel' : 'Add Transport'}
              </button>
            </div>

            {showTransportForm && (
              <form onSubmit={handleTransportSubmit} className="form-grid" style={{ marginBottom: '2rem' }}>
                <div className="form-group">
                  <label>Transport Date</label>
                  <input
                    type="date"
                    value={transportForm.transport_date}
                    onChange={(e) => setTransportForm({...transportForm, transport_date: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Number of Cans</label>
                  <input
                    type="number"
                    min="10"
                    value={transportForm.total_cans}
                    onChange={(e) => setTransportForm({...transportForm, total_cans: e.target.value})}
                    placeholder="Minimum 10 cans"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Total Latex (kg)</label>
                  <input
                    type="text"
                    value={transportForm.total_cans ? `${transportForm.total_cans * 20} kg` : '0 kg'}
                    disabled
                  />
                </div>
                
                <div className="form-group">
                  <label>Transport Cost (LKR)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={transportForm.transport_cost}
                    onChange={(e) => setTransportForm({...transportForm, transport_cost: e.target.value})}
                    placeholder="Total transport cost"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Cost per kg (LKR)</label>
                  <input
                    type="text"
                    value={transportForm.total_cans && transportForm.transport_cost ? 
                      `LKR ${(transportForm.transport_cost / (transportForm.total_cans * 20)).toFixed(2)}` : 'LKR 0'}
                    disabled
                  />
                </div>
                
                <div className="form-group">
                  <label>Notes</label>
                  <input
                    type="text"
                    value={transportForm.notes}
                    onChange={(e) => setTransportForm({...transportForm, notes: e.target.value})}
                    placeholder="Optional notes"
                  />
                </div>
                
                <div style={{ gridColumn: '1 / -1' }}>
                  <button type="submit" className="btn btn-primary">
                    Add Transport Record
                  </button>
                </div>
              </form>
            )}

            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Cans</th>
                  <th>Latex (kg)</th>
                  <th>Transport Cost (LKR)</th>
                  <th>Cost/kg (LKR)</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {transports.map(transport => (
                  <tr key={transport.id}>
                    <td>{transport.transport_date}</td>
                    <td>{transport.total_cans}</td>
                    <td>{transport.total_latex_kg}</td>
                    <td className="currency">{transport.transport_cost.toLocaleString()}</td>
                    <td className="currency">{transport.cost_per_kg.toFixed(2)}</td>
                    <td>{transport.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {activeSection === 'monthly' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3>Monthly Labour Costs</h3>
              <button 
                className="btn btn-primary btn-small"
                onClick={() => setShowMonthlyForm(!showMonthlyForm)}
              >
                {showMonthlyForm ? 'Cancel' : 'Set Labour Costs'}
              </button>
            </div>

            {showMonthlyForm && (
              <form onSubmit={handleMonthlySubmit} className="form-grid" style={{ marginBottom: '2rem' }}>
                <div className="form-group">
                  <label>Month</label>
                  <input
                    type="month"
                    value={monthlyForm.month_year}
                    onChange={(e) => setMonthlyForm({...monthlyForm, month_year: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Labour Cost (LKR/month)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={monthlyForm.labour_cost}
                    onChange={(e) => setMonthlyForm({...monthlyForm, labour_cost: e.target.value})}
                    placeholder="Monthly salary payments"
                    required
                  />
                </div>
                

                
                <div className="form-group">
                  <label>Other Costs (LKR/month)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={monthlyForm.other_costs}
                    onChange={(e) => setMonthlyForm({...monthlyForm, other_costs: e.target.value})}
                    placeholder="Utilities, rent, etc."
                  />
                </div>
                
                <div className="form-group">
                  <label>Daily Labour Cost</label>
                  <input
                    type="text"
                    value={monthlyForm.labour_cost ? 
                      `LKR ${(monthlyForm.labour_cost / 30).toFixed(2)}` : 'LKR 0'}
                    disabled
                  />
                </div>
                

                
                <div style={{ gridColumn: '1 / -1' }}>
                  <button type="submit" className="btn btn-primary">
                    Save Monthly Costs
                  </button>
                </div>
              </form>
            )}

            <table className="table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Labour Cost (LKR)</th>
                  <th>Other Costs (LKR)</th>
                  <th>Total Monthly (LKR)</th>
                  <th>Daily Labour (LKR)</th>
                </tr>
              </thead>
              <tbody>
                {monthlyCosts.map(cost => (
                  <tr key={cost.id}>
                    <td>{cost.month_year}</td>
                    <td className="currency">{cost.labour_cost.toLocaleString()}</td>
                    <td className="currency">{cost.other_costs.toLocaleString()}</td>
                    <td className="currency">
                      {(cost.labour_cost + cost.other_costs).toLocaleString()}
                    </td>
                    <td className="currency">
                      {(cost.labour_cost / 30).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}

export default CostManager;