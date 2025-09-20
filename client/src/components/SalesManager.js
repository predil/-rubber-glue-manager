import React, { useState } from 'react';
import { getCurrentDate } from '../utils/dateUtils';

function SalesManager({ sales, batches, customers, onUpdate }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    batch_id: '',
    customer_id: '',
    quantity_sold: '',
    price_per_kg: '',
    sale_date: getCurrentDate()
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      setFormData({
        batch_id: '',
        customer_id: '',
        quantity_sold: '',
        price_per_kg: '',
        sale_date: getCurrentDate()
      });
      setShowForm(false);
      onUpdate();
    } catch (error) {
      console.error('Error saving sale:', error);
    }
  };

  const handleBatchChange = (batchId) => {
    const selectedBatch = batches.find(b => b.id === parseInt(batchId));
    setFormData({
      ...formData,
      batch_id: batchId,
      price_per_kg: selectedBatch ? selectedBatch.selling_price_per_kg : ''
    });
  };

  const getAvailableBatches = () => {
    return batches.filter(batch => {
      const totalSold = sales
        .filter(sale => sale.batch_id === batch.id)
        .reduce((sum, sale) => sum + sale.quantity_sold, 0);
      return totalSold < batch.glue_separated;
    });
  };

  const getRemainingQuantity = (batchId) => {
    const batch = batches.find(b => b.id === batchId);
    if (!batch) return 0;
    
    const totalSold = sales
      .filter(sale => sale.batch_id === batchId)
      .reduce((sum, sale) => sum + sale.quantity_sold, 0);
    
    return batch.glue_separated - totalSold;
  };

  const printBill = async (sale) => {
    const customer = customers.find(c => c.id === sale.customer_id);
    const batch = batches.find(b => b.id === sale.batch_id);
    
    // Fetch company settings
    let companySettings = { company_name: 'RUBBER GLUE SALES', address: '', phone: '', email: '' };
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/settings`);
      companySettings = await response.json();
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
    
    const billContent = `
================================
      ${companySettings.company_name.toUpperCase()}
         INVOICE
================================

${companySettings.address ? companySettings.address + '\n' : ''}${companySettings.phone ? 'Phone: ' + companySettings.phone + '\n' : ''}${companySettings.email ? 'Email: ' + companySettings.email + '\n' : ''}
--------------------------------
Date: ${sale.sale_date}
Invoice #: ${sale.id.toString().padStart(4, '0')}

--------------------------------
CUSTOMER DETAILS:
${customer ? customer.name : 'N/A'}
${customer ? customer.contact_info : ''}

--------------------------------
PRODUCT DETAILS:
Batch #: ${sale.batch_number}
Production: ${batch ? batch.production_date : 'N/A'}

Rubber Latex Glue
Quantity: ${sale.quantity_sold} kg
Price/kg: LKR ${sale.price_per_kg}

--------------------------------
TOTAL AMOUNT: LKR ${sale.total_amount.toLocaleString()}

--------------------------------
Thank you for your business!

================================
    `;
    
    // Mobile-friendly print approach
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      // For mobile: create a blob and download as text file
      const blob = new Blob([billContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice-${sale.id.toString().padStart(4, '0')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      // Desktop: use window.open for printing
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Invoice #${sale.id.toString().padStart(4, '0')}</title>
              <style>
                body {
                  font-family: 'Courier New', monospace;
                  font-size: 12px;
                  line-height: 1.2;
                  margin: 0;
                  padding: 10px;
                  width: 58mm;
                  background: white;
                }
                .bill {
                  white-space: pre-line;
                }
                @media print {
                  body { margin: 0; padding: 5px; }
                }
              </style>
            </head>
            <body>
              <div class="bill">${billContent}</div>
              <script>
                window.onload = function() {
                  window.print();
                  setTimeout(() => window.close(), 1000);
                }
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };

  return (
    <div className="section">
      <div className="section-title">
        💰 Sales Management
        <button 
          className="btn btn-primary btn-small"
          onClick={() => setShowForm(!showForm)}
          style={{ marginLeft: 'auto' }}
        >
          {showForm ? 'Cancel' : 'Record Sale'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="form-grid">
          <div className="form-group">
            <label>Select Batch</label>
            <select
              value={formData.batch_id}
              onChange={(e) => handleBatchChange(e.target.value)}
              required
            >
              <option value="">Choose batch...</option>
              {getAvailableBatches().map(batch => (
                <option key={batch.id} value={batch.id}>
                  Batch #{batch.batch_number} - {getRemainingQuantity(batch.id)}kg available
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>Customer</label>
            <select
              value={formData.customer_id}
              onChange={(e) => setFormData({...formData, customer_id: e.target.value})}
              required
            >
              <option value="">Choose customer...</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>Quantity Sold (kg)</label>
            <input
              type="number"
              step="0.1"
              value={formData.quantity_sold}
              onChange={(e) => setFormData({...formData, quantity_sold: e.target.value})}
              max={formData.batch_id ? getRemainingQuantity(parseInt(formData.batch_id)) : ''}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Price per kg (LKR)</label>
            <input
              type="number"
              step="0.01"
              value={formData.price_per_kg}
              onChange={(e) => setFormData({...formData, price_per_kg: e.target.value})}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Sale Date</label>
            <input
              type="date"
              value={formData.sale_date}
              onChange={(e) => setFormData({...formData, sale_date: e.target.value})}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Total Amount</label>
            <input
              type="text"
              value={formData.quantity_sold && formData.price_per_kg 
                ? `LKR ${(formData.quantity_sold * formData.price_per_kg).toLocaleString()}`
                : 'LKR 0'}
              disabled
            />
          </div>
          
          <div style={{ gridColumn: '1 / -1' }}>
            <button type="submit" className="btn btn-primary">
              Record Sale
            </button>
          </div>
        </form>
      )}

      <table className="table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Batch #</th>
            <th>Customer</th>
            <th>Quantity (kg)</th>
            <th>Price/kg (LKR)</th>
            <th>Total (LKR)</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {sales.map(sale => (
            <tr key={sale.id}>
              <td>{sale.sale_date}</td>
              <td>#{sale.batch_number}</td>
              <td>{sale.customer_name}</td>
              <td>{sale.quantity_sold}</td>
              <td className="currency">{sale.price_per_kg}</td>
              <td className="currency">{sale.total_amount.toLocaleString()}</td>
              <td>
                <button 
                  className="btn btn-secondary btn-small"
                  onClick={() => printBill(sale)}
                  style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                >
                  🖨️ Print
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default SalesManager;