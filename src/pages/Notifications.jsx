import { useState, useEffect, useMemo } from 'react';
import { getImageUrl } from '../utils/url';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { NotificationsSkeleton } from '../components/Skeletons';
import { Bell, Heart, UserPlus, MessageCircle, Users, Activity, ChevronRight } from 'lucide-react';
import { getUserUrl } from '../utils/slug';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        try {
            const data = await api.getNotifications();
            setNotifications(data.notifications || []);
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
        if (!date) return '';
        const parsedDate = new Date(date);
        if (isNaN(parsedDate.getTime())) return '';

        const seconds = Math.floor((new Date() - parsedDate) / 1000);
        if (seconds < 0) return 'baru saja';
        if (seconds < 60) return 'baru saja';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
        return parsedDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    };

    const getNotificationLink = (n) => {
        if (n.type === 'follow' && n.fromUser?.id) return getUserUrl(n.fromUser);
        if ((n.type === 'like' || n.type === 'comment') && (n.songId || n.relatedId))
            return `/song/${n.songId || n.relatedId}`;
        if (n.fromUser?.id) return getUserUrl(n.fromUser);
        return '/';
    };

    // Group notifications by type
    const groupedNotifications = useMemo(() => {
        const followers = notifications.filter(n => n.type === 'follow');
        const likes = notifications.filter(n => n.type === 'like');
        const comments = notifications.filter(n => n.type === 'comment');
        const others = notifications.filter(n => !['follow', 'like', 'comment'].includes(n.type));
        return { followers, likes, comments, others };
    }, [notifications]);

    const filteredNotifications = useMemo(() => {
        if (activeTab === 'all') return notifications;
        if (activeTab === 'followers') return groupedNotifications.followers;
        if (activeTab === 'likes') return groupedNotifications.likes;
        if (activeTab === 'comments') return groupedNotifications.comments;
        return notifications;
    }, [notifications, activeTab, groupedNotifications]);

    const tabs = [
        { id: 'all', label: 'Semua', icon: Bell },
        { id: 'followers', label: 'Followers', icon: Users, count: groupedNotifications.followers.length },
        { id: 'likes', label: 'Suka', icon: Heart, count: groupedNotifications.likes.length },
        { id: 'comments', label: 'Komentar', icon: MessageCircle, count: groupedNotifications.comments.length },
    ];

    if (loading) {
        return (
            <div className="pb-player">
                <NotificationsSkeleton />
            </div>
        );
    }

    return (
        <div className="pb-player">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold">Inbox</h1>
            </div>

            {/* Quick Stats - Like TikTok */}
            <div className="grid grid-cols-3 gap-3 mb-6">
                <Link to="#" onClick={(e) => { e.preventDefault(); setActiveTab('followers'); }}
                    className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-2xl p-4 text-center hover:scale-105 transition-transform">
                    <div className="w-10 h-10 mx-auto rounded-full bg-blue-500 flex items-center justify-center mb-2">
                        <UserPlus className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-xl font-bold">{groupedNotifications.followers.length}</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">Followers</p>
                </Link>
                <Link to="#" onClick={(e) => { e.preventDefault(); setActiveTab('likes'); }}
                    className="bg-gradient-to-br from-pink-500/20 to-pink-600/10 border border-pink-500/30 rounded-2xl p-4 text-center hover:scale-105 transition-transform">
                    <div className="w-10 h-10 mx-auto rounded-full bg-pink-500 flex items-center justify-center mb-2">
                        <Heart className="w-5 h-5 text-white" fill="currentColor" />
                    </div>
                    <p className="text-xl font-bold">{groupedNotifications.likes.length}</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">Suka</p>
                </Link>
                <Link to="#" onClick={(e) => { e.preventDefault(); setActiveTab('comments'); }}
                    className="bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 rounded-2xl p-4 text-center hover:scale-105 transition-transform">
                    <div className="w-10 h-10 mx-auto rounded-full bg-green-500 flex items-center justify-center mb-2">
                        <MessageCircle className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-xl font-bold">{groupedNotifications.comments.length}</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">Komentar</p>
                </Link>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar pb-2">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${isActive
                                    ? 'bg-[var(--color-primary)] text-black font-semibold'
                                    : 'bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            <span className="text-sm">{tab.label}</span>
                            {tab.count > 0 && (
                                <span className={`text-xs px-1.5 rounded-full ${isActive ? 'bg-black/20' : 'bg-[var(--color-surface-active)]'}`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Notifications List */}
            {filteredNotifications.length === 0 ? (
                <div className="text-center py-16">
                    <Activity className="w-16 h-16 mx-auto text-[var(--color-text-muted)] mb-4" />
                    <h2 className="text-lg font-semibold mb-2">Tidak ada aktivitas</h2>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                        {activeTab === 'all' ? 'Notifikasi akan muncul di sini' : `Belum ada ${tabs.find(t => t.id === activeTab)?.label.toLowerCase()}`}
                    </p>
                </div>
            ) : (
                <div className="space-y-1">
                    {filteredNotifications.map(n => (
                        <Link
                            key={n.id}
                            to={getNotificationLink(n)}
                            className={`flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--color-surface-hover)] transition-colors ${!n.isRead ? 'bg-[var(--color-primary)]/5' : ''}`}
                        >
                            {/* User Photo with Icon Badge */}
                            <div className="relative flex-shrink-0">
                                {n.fromUser?.photoURL ? (
                                    <img
                                        src={getImageUrl(n.fromUser.photoURL)}
                                        alt=""
                                        className="w-12 h-12 rounded-full object-cover ring-2 ring-[var(--color-surface)]"
                                    />
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] flex items-center justify-center">
                                        <span className="text-lg font-bold text-black">{n.fromUser?.name?.charAt(0) || '?'}</span>
                                    </div>
                                )}
                                <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-[var(--color-bg)] ${n.type === 'follow' ? 'bg-blue-500' :
                                        n.type === 'like' ? 'bg-pink-500' :
                                            n.type === 'comment' ? 'bg-green-500' : 'bg-[var(--color-primary)]'
                                    }`}>
                                    {n.type === 'follow' && <UserPlus className="w-3 h-3 text-white" />}
                                    {n.type === 'like' && <Heart className="w-3 h-3 text-white" fill="currentColor" />}
                                    {n.type === 'comment' && <MessageCircle className="w-3 h-3 text-white" />}
                                    {!['follow', 'like', 'comment'].includes(n.type) && <Bell className="w-3 h-3 text-white" />}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm">
                                    <span className="font-semibold">{n.fromUser?.name || 'Seseorang'}</span>
                                    {' '}
                                    <span className="text-[var(--color-text-secondary)]">
                                        {n.type === 'follow' && 'mengikuti kamu'}
                                        {n.type === 'like' && 'menyukai lagumu'}
                                        {n.type === 'comment' && 'mengomentari lagumu'}
                                        {!['follow', 'like', 'comment'].includes(n.type) && n.message}
                                    </span>
                                </p>
                                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{formatTimeAgo(n.createdAt)}</p>
                            </div>

                            {/* Arrow / Unread */}
                            <div className="flex items-center gap-2">
                                {!n.isRead && (
                                    <div className="w-2 h-2 rounded-full bg-[var(--color-primary)]" />
                                )}
                                <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)]" />
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Notifications;
