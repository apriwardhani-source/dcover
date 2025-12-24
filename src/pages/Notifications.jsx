import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { ArrowLeft, Bell, Heart, UserPlus, Music2 } from 'lucide-react';
import { API_URL } from '../config';

const Notifications = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        try {
            const data = await api.getNotifications();
            setNotifications(data.notifications || []);
            // Mark all as read
            if (data.unreadCount > 0) {
                await api.markNotificationsRead();
            }
        } catch (error) {
            console.error('Load notifications error:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatTimeAgo = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        if (seconds < 60) return 'baru saja';
        if (seconds < 3600) return `${Math.floor(seconds / 60)} menit lalu`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} jam lalu`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)} hari lalu`;
        return new Date(date).toLocaleDateString('id-ID');
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'follow':
                return <UserPlus className="w-5 h-5 text-blue-400" />;
            case 'like':
                return <Heart className="w-5 h-5 text-red-400" fill="currentColor" />;
            default:
                return <Bell className="w-5 h-5 text-[var(--color-primary)]" />;
        }
    };

    const getNotificationLink = (n) => {
        if (n.type === 'follow' && n.fromUser?.id) return `/user/${n.fromUser.id}`;
        if (n.type === 'like' && n.relatedId) return `/song/${n.relatedId}`;
        return '/';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <div className="pb-player animate-slide-in-right">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-[var(--color-surface-hover)] rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-2xl font-bold">Notifikasi</h1>
            </div>

            {/* Notifications List */}
            {notifications.length === 0 ? (
                <div className="text-center py-20">
                    <Bell className="w-16 h-16 mx-auto text-[var(--color-text-muted)] mb-4" />
                    <h2 className="text-xl font-bold mb-2">Belum ada notifikasi</h2>
                    <p className="text-[var(--color-text-secondary)]">Notifikasi akan muncul di sini</p>
                </div>
            ) : (
                <div className="space-y-1">
                    {notifications.map(n => (
                        <Link
                            key={n.id}
                            to={getNotificationLink(n)}
                            className={`flex items-start gap-4 p-4 rounded-xl hover:bg-[var(--color-surface-hover)] transition-colors ${!n.isRead ? 'bg-[var(--color-primary)]/5' : ''}`}
                        >
                            {/* User Photo */}
                            <div className="relative">
                                {n.fromUser?.photoURL ? (
                                    <img
                                        src={n.fromUser.photoURL.startsWith('http') ? n.fromUser.photoURL : `${API_URL}${n.fromUser.photoURL}`}
                                        alt=""
                                        className="w-12 h-12 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-[var(--color-surface-hover)] flex items-center justify-center">
                                        <span className="text-lg font-bold">{n.fromUser?.name?.charAt(0) || '?'}</span>
                                    </div>
                                )}
                                {/* Notification Type Icon */}
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[var(--color-surface)] flex items-center justify-center border border-[var(--color-border)]">
                                    {getNotificationIcon(n.type)}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <p className="text-[15px]">{n.message}</p>
                                <p className="text-sm text-[var(--color-text-secondary)] mt-1">{formatTimeAgo(n.createdAt)}</p>
                            </div>

                            {/* Unread indicator */}
                            {!n.isRead && (
                                <div className="w-2 h-2 rounded-full bg-[var(--color-primary)] flex-shrink-0 mt-2" />
                            )}
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Notifications;
