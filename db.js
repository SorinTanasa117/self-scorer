const db = {
  getToken: () => localStorage.getItem('token'),

  // --- Positives Functions ---
  addPositive: async (positive) => {
    const response = await fetch('/api/positives', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${db.getToken()}`,
      },
      body: JSON.stringify(positive),
    });
    return response.json();
  },

  getAllPositives: async () => {
    const response = await fetch('/api/positives', {
      headers: {
        'Authorization': `Bearer ${db.getToken()}`,
      },
    });
    return response.json();
  },

  // --- Custom Template Functions ---
  addCustomTemplate: async (template) => {
    const response = await fetch('/api/templates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${db.getToken()}`,
      },
      body: JSON.stringify(template),
    });
    return response.json();
  },

  getAllCustomTemplates: async () => {
    const response = await fetch('/api/templates', {
      headers: {
        'Authorization': `Bearer ${db.getToken()}`,
      },
    });
    return response.json();
  },
};
