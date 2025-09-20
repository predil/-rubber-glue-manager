// Date utility functions for consistent date formatting

export const formatDateForInput = (date) => {
  if (!date) return new Date().toISOString().split('T')[0];
  
  // Handle different date formats
  if (typeof date === 'string') {
    // If it's already in YYYY-MM-DD format, return as is
    if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return date;
    }
    // If it's an ISO string, extract the date part
    if (date.includes('T')) {
      return date.split('T')[0];
    }
  }
  
  // If it's a Date object or timestamp
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return new Date().toISOString().split('T')[0];
  }
  
  return dateObj.toISOString().split('T')[0];
};

export const formatDateForDisplay = (date) => {
  if (!date) return '';
  
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return date;
  
  // Format as DD/MM/YYYY for display
  return dateObj.toLocaleDateString('en-GB');
};

export const getCurrentDate = () => {
  return new Date().toISOString().split('T')[0];
};

export const parseDate = (dateString) => {
  if (!dateString) return null;
  
  // Handle ISO strings by extracting date part
  if (dateString.includes('T')) {
    dateString = dateString.split('T')[0];
  }
  
  return dateString;
};