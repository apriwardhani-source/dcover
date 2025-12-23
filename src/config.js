// Centralized configuration for API URL
// For Vercel deployment, API is on same origin
export const API_URL = import.meta.env.VITE_API_URL || '';
export const API_BASE_URL = `${API_URL}/api`;
