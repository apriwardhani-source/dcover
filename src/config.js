// Centralized configuration for API URL
// Uses environment variable in production, falls back to production URL
export const API_URL = import.meta.env.VITE_API_URL || 'https://apriwardhani.site';
export const API_BASE_URL = `${API_URL}/api`;
