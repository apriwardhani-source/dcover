import { API_BASE_URL } from '../config';

class ApiService {
    constructor() {
        this.token = localStorage.getItem('token');
    }

    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('token', token);
        } else {
            localStorage.removeItem('token');
        }
    }

    getToken() {
        return this.token || localStorage.getItem('token');
    }

    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const headers = {
            ...options.headers,
        };

        if (this.getToken()) {
            headers['Authorization'] = `Bearer ${this.getToken()}`;
        }

        // Don't set Content-Type for FormData
        if (!(options.body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
        }

        const response = await fetch(url, {
            ...options,
            headers,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Request failed' }));
            throw new Error(error.error || 'Request failed');
        }

        return response.json();
    }

    // Auth
    async loginWithGoogle(userData) {
        const data = await this.request('/auth/google', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
        this.setToken(data.token);
        return data;
    }

    async getCurrentUser() {
        return this.request('/auth/me');
    }

    logout() {
        this.setToken(null);
    }

    // Notifications
    async getNotifications() {
        return this.request('/users/notifications');
    }

    async markNotificationsRead() {
        return this.request('/users/notifications/read', { method: 'PATCH' });
    }

    // Songs
    async getSongs() {
        return this.request('/songs');
    }

    async getUserSongs(userId) {
        return this.request(`/songs/user/${userId}`);
    }

    async getAlbumSongs(albumId) {
        return this.request(`/songs/album/${albumId}`);
    }

    // Helper to upload file directly to Cloudinary
    async uploadToCloudinary(file, resourceType = 'auto') {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'ml_default');
        formData.append('cloud_name', 'dzz91k3ky');

        const response = await fetch(
            `https://api.cloudinary.com/v1_1/dzz91k3ky/${resourceType}/upload`,
            { method: 'POST', body: formData }
        );

        if (!response.ok) throw new Error('Upload to Cloudinary failed');
        return await response.json();
    }

    async uploadSong(data) {
        // Upload audio directly to Cloudinary
        const audioResult = await this.uploadToCloudinary(data.audioFile, 'video');

        // Upload cover if exists
        let coverUrl = null;
        if (data.coverFile) {
            const coverResult = await this.uploadToCloudinary(data.coverFile, 'image');
            coverUrl = coverResult.secure_url;
        }

        // Save to database via API
        return this.request('/songs', {
            method: 'POST',
            body: JSON.stringify({
                title: data.title,
                originalArtist: data.originalArtist,
                audioUrl: audioResult.secure_url,
                coverImage: coverUrl,
                albumId: data.albumId,
                lyrics: data.lyrics
            }),
        });
    }

    async updateSongCover(songId, coverImage) {
        return this.updateSong(songId, { coverImage });
    }

    async updateSong(songId, data) {
        return this.request(`/songs/${songId}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }

    async updateAlbum(albumId, data) {
        return this.request(`/albums/${albumId}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }

    async playSong(songId) {
        return this.request(`/songs/${songId}/play`, {
            method: 'POST',
        });
    }

    async toggleSongVisibility(songId) {
        return this.request(`/songs/${songId}/visibility`, {
            method: 'PATCH',
        });
    }

    async likeSong(songId) {
        return this.request(`/songs/${songId}/like`, {
            method: 'POST',
        });
    }

    async playSong(songId) {
        return this.request(`/songs/${songId}/play`, {
            method: 'POST',
        });
    }

    async getLikedSongs(userId) {
        return this.request(`/songs/liked/${userId}`);
    }

    async deleteSong(songId) {
        return this.request(`/songs/${songId}`, {
            method: 'DELETE',
        });
    }

    // Albums
    async getAlbums() {
        return this.request('/albums');
    }

    async getAlbum(albumId) {
        return this.request(`/albums/${albumId}`);
    }

    async getUserAlbums(userId) {
        return this.request(`/albums/user/${userId}`);
    }

    async createAlbum(data) {
        // Upload cover directly to Cloudinary if exists
        let coverUrl = null;
        if (data.coverFile) {
            const coverResult = await this.uploadToCloudinary(data.coverFile, 'image');
            coverUrl = coverResult.secure_url;
        }

        // Save to database via API
        return this.request('/albums', {
            method: 'POST',
            body: JSON.stringify({
                title: data.title,
                coverImage: coverUrl
            }),
        });
    }

    async updateAlbumCover(albumId, coverImage) {
        return this.updateAlbum(albumId, { coverImage });
    }

    async deleteAlbum(albumId) {
        return this.request(`/albums/${albumId}`, {
            method: 'DELETE',
        });
    }

    // Users (Admin)
    async getUsers() {
        return this.request('/users');
    }

    async suspendUser(userId, suspended) {
        return this.request(`/users/${userId}/suspend`, {
            method: 'PATCH',
            body: JSON.stringify({ suspended }),
        });
    }

    async getUserProfile(userId) {
        return this.request(`/users/${userId}`);
    }

    async getUserByUsername(username) {
        return this.request(`/users/by-username/${username}`);
    }

    async getSuggestedUsers() {
        return this.request('/users/suggestions');
    }

    async searchUsers(query) {
        return this.request(`/users/search?q=${encodeURIComponent(query)}`);
    }

    // Profile
    async updateProfile(data) {
        // For Vercel + Cloudinary, send to upload endpoint
        return this.request('/upload/profile', {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }

    // Admin - User Role
    async changeUserRole(userId, role) {
        return this.request(`/users/${userId}/role`, {
            method: 'PATCH',
            body: JSON.stringify({ role }),
        });
    }

    async getFollowers(userId) {
        return this.request(`/follows/followers/${userId}`);
    }

    async getFollowing(userId) {
        return this.request(`/follows/following/${userId}`);
    }

    async checkFollowing(userId) {
        return this.request(`/follows/check/${userId}`);
    }

    // Banners
    async getBanners() {
        return this.request('/banners');
    }

    async getAllBanners() {
        return this.request('/banners/all');
    }

    async createBanner(data) {
        return this.request('/banners', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateBanner(id, formData) {
        return this.request(`/banners/${id}`, {
            method: 'PATCH',
            body: formData,
        });
    }

    async deleteBanner(id) {
        return this.request(`/banners/${id}`, {
            method: 'DELETE',
        });
    }

    async toggleBanner(id) {
        return this.request(`/banners/${id}/toggle`, {
            method: 'PATCH',
        });
    }

    // Dashboard Stats
    async getStats() {
        const [users, songs, albums] = await Promise.all([
            this.request('/users'),
            this.request('/songs'),
            this.request('/albums')
        ]);

        const totalLikes = songs.reduce((acc, s) => acc + (s.likes || 0), 0);
        const today = new Date().toDateString();
        const newToday = songs.filter(s => new Date(s.createdAt).toDateString() === today).length;

        return {
            totalUsers: users.length,
            totalSongs: songs.length,
            totalAlbums: albums.length,
            totalLikes,
            newSongsToday: newToday,
            recentSongs: songs.slice(0, 5),
            topSongs: [...songs].sort((a, b) => (b.likes || 0) - (a.likes || 0)).slice(0, 5)
        };
    }

    // Comments
    async getComments(songId) {
        return this.request(`/comments/song/${songId}`);
    }

    async addComment(songId, content) {
        return this.request('/comments', {
            method: 'POST',
            body: JSON.stringify({ songId, content }),
        });
    }

    async deleteComment(commentId) {
        return this.request(`/comments/${commentId}`, {
            method: 'DELETE',
        });
    }

    // Follows
    async followUser(userId) {
        return this.request(`/follows/${userId}`, {
            method: 'POST',
        });
    }

    async unfollowUser(userId) {
        return this.request(`/follows/${userId}`, {
            method: 'DELETE',
        });
    }

    async checkFollowing(userId) {
        return this.request(`/follows/check/${userId}`);
    }

    async getFollowersCount(userId) {
        return this.request(`/follows/followers/${userId}`);
    }

    async getFollowingCount(userId) {
        return this.request(`/follows/following/${userId}`);
    }

    // Messaging
    async getConversations() {
        return this.request('/users/messages');
    }

    async getMessages(conversationId) {
        return this.request(`/users/messages/${conversationId}`);
    }

    async sendMessage(recipientId, content) {
        return this.request('/users/messages', {
            method: 'POST',
            body: JSON.stringify({ recipientId, content }),
        });
    }

    async getConversationWithUser(userId) {
        return this.request(`/users/messages/user/${userId}`);
    }
}

export const api = new ApiService();
export default api;


