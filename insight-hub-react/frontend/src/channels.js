// The 9 scanning channels, their colours and sub-types (from the BRD / original page).
export const CHANNELS = {
  'Literature Sources': { cls: 'lit', icon: '📄', color: '#1c5fa8', bg: '#e6f0fa',
    subtypes: ['In-depth patents & research papers', 'Corporate technical reports & white papers', 'Annual reports from competitors'] },
  'Conferences & Workshops': { cls: 'conf', icon: '🎤', color: '#2e7d52', bg: '#e4f5ec',
    subtypes: ['National conference', 'International conference', 'Targeted micro-conference', 'Archiving conference brochures', 'Post-conference summary distribution'] },
  'Digital Portals': { cls: 'dig', icon: '🌐', color: '#3a5ba8', bg: '#eaefff',
    subtypes: ['ANRF', 'SRTMI', 'DST', 'NITI Aayog', 'Ministry of Steel', 'Ministry of Energy & Environment', 'MNRE', 'Other national portal'] },
  'Customer Insights': { cls: 'cust', icon: '💬', color: '#b84c1a', bg: '#fdeee6',
    subtypes: ['Tech discussion', 'Shop floor experience', 'Customer complaints', 'Supply chain', 'Others'] },
  'Field Exposure-Visits': { cls: 'fld', icon: '🏭', color: '#b5780a', bg: '#fff3e0',
    subtypes: ['Pilot plants & outer industrial sites', 'Global university & Centre of Excellence', 'Tata Steel plants', 'Workshop with plant'] },
  'Market Insights': { cls: 'mkt', icon: '📊', color: '#7c3fa8', bg: '#f0eaff',
    subtypes: ['Comprehensive market research analysis', 'BT²i — Business Technology Intelligence for Innovation', 'TWatch — Multi-partner Technology Intelligence'] },
  'Experiential Learning': { cls: 'exp', icon: '🎓', color: '#0f8b8d', bg: '#e0f5f5',
    subtypes: ['Consultation', 'Training', 'Actionable lessons from failed trials', 'Pan-industry expert panels', 'Startup & Venture Capital ecosystem'] },
  'Specialized Domain': { cls: 'spc', icon: '🔬', color: '#a25bc4', bg: '#f5eaff',
    subtypes: ['Material Next', 'Mind over Matter', 'Women of Mettle'] },
  Others: { cls: 'oth', icon: '🌍', color: '#c1495a', bg: '#fdeaec',
    subtypes: ['Regulatory / Geopolitical policy tracking', 'Joint Development & Supplier Technology Roadmap', 'Linkedin', 'Other'] },
};

export const CHANNEL_NAMES = Object.keys(CHANNELS);

export const NATURES = [
  { value: 'Observation', label: '🔵 Observation / Experience', cls: 'sel-obs' },
  { value: 'Idea', label: '💡 Research Idea', cls: 'sel-idea' },
  { value: 'Problem', label: '⚠️ Problem Statement', cls: 'sel-problem' },
];
