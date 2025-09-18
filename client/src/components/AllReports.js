import React, { useState } from 'react';
import BasicAnalytics from './BasicAnalytics';
import AdvancedReports from './AdvancedReports';
import PredictiveAnalytics from './PredictiveAnalytics';
import SmartFeatures from './SmartFeatures';

const AllReports = ({ batches, sales }) => {
  const [activeTab, setActiveTab] = useState('basic');

  return (
    <div className="all-reports">
      <div className="tab-buttons">
        <button 
          className={activeTab === 'basic' ? 'active' : ''} 
          onClick={() => setActiveTab('basic')}
        >
          📊 Basic Reports
        </button>
        <button 
          className={activeTab === 'advanced' ? 'active' : ''} 
          onClick={() => setActiveTab('advanced')}
        >
          📈 Analytics
        </button>
        <button 
          className={activeTab === 'predictive' ? 'active' : ''} 
          onClick={() => setActiveTab('predictive')}
        >
          🔮 Predictive
        </button>
        <button 
          className={activeTab === 'smart' ? 'active' : ''} 
          onClick={() => setActiveTab('smart')}
        >
          🧠 Smart AI
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'basic' && <BasicAnalytics batches={batches} sales={sales} />}
        {activeTab === 'advanced' && <AdvancedReports />}
        {activeTab === 'predictive' && <PredictiveAnalytics />}
        {activeTab === 'smart' && <SmartFeatures />}
      </div>
    </div>
  );
};

export default AllReports;