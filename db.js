const db = {
  positives: [],
  customTemplates: [],
  
  save: () => {
    localStorage.setItem('positives', JSON.stringify(db.positives));
    localStorage.setItem('customTemplates', JSON.stringify(db.customTemplates));
  },

  open: async () => {
    const storedPositives = localStorage.getItem('positives');
    const storedTemplates = localStorage.getItem('customTemplates');
    
    db.positives = storedPositives ? JSON.parse(storedPositives) : [];
    db.customTemplates = storedTemplates ? JSON.parse(storedTemplates) : [];
  },

  addPositive: async (positive) => {
    const id = Date.now();
    const newPositive = { id, ...positive };
    db.positives.push(newPositive);
    db.save();
    return { id };
  },

  getAllPositives: async () => {
    return db.positives;
  },

  getPositiveById: async (id) => {
    return db.positives.find(p => p.id === id);
  },

  getPositivesByDate: async (dateStr) => {
    return db.positives.filter(p => p.date === dateStr);
  },

  getPositivesByDateRange: async (startDate, endDate) => {
    return db.positives.filter(p => p.date >= startDate && p.date <= endDate);
  },

  updatePositive: async (positive) => {
    const index = db.positives.findIndex(p => p.id === positive.id);
    if (index !== -1) {
      db.positives[index] = positive;
      db.save();
    }
    return { message: 'Positive updated successfully' };
  },

  deletePositive: async (id) => {
    const index = db.positives.findIndex(p => p.id === id);
    if (index !== -1) {
      db.positives.splice(index, 1);
      db.save();
    }
    return { message: 'Positive deleted successfully' };
  },

  addCustomTemplate: async (template) => {
    const id = Date.now();
    const newTemplate = { id, ...template };
    db.customTemplates.push(newTemplate);
    db.save();
    return { id };
  },

  getAllCustomTemplates: async () => {
    return db.customTemplates;
  },

  getCustomTemplateByName: async (name) => {
    return db.customTemplates.find(t => t.name === name);
  },

  updateCustomTemplate: async (template) => {
    const index = db.customTemplates.findIndex(t => t.id === template.id);
    if (index !== -1) {
      db.customTemplates[index] = template;
      db.save();
    }
    return { message: 'Template updated successfully' };
  },

  deleteCustomTemplate: async (id) => {
    const index = db.customTemplates.findIndex(t => t.id === id);
    if (index !== -1) {
      db.customTemplates.splice(index, 1);
      db.save();
    }
    return { message: 'Template deleted successfully' };
  },
};
