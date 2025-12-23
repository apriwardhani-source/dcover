// Centralized configuration for API URL
// Uses environment variable in production, falls back to localhost in development
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
export const API_BASE_URL = `${API_URL}/api`;
