import { API_URL } from '../config';

/**
 * Safely get the full URL for an image.
 * Handles both relative paths (local/API) and absolute URLs (Cloudinary).
 * @param {string} path - The image path or URL
 * @param {string} fallback - The fallback image URL if path is missing
 * @returns {string}
 */
export const getImageUrl = (path, fallback = '/logo.jpg') => {
    if (!path) return fallback;
    if (path.startsWith('http')) return path;
    // For local paths, ensure it starts with / if API_URL exists
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${API_URL}${normalizedPath}`;
};

/**
 * Safely get the full URL for an audio file.
 * Handles both relative paths (local/API) and absolute URLs (Cloudinary).
 * @param {string} path - The audio path or URL
 * @returns {string}
 */
export const getAudioUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${API_URL}${normalizedPath}`;
};
