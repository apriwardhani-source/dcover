import { useState, useEffect, useMemo } from 'react';
import { getImageUrl } from '../utils/url';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { NotificationsSkeleton } from '../components/Skeletons';
import toast from 'react-hot-toast';
import { Bell, Heart, UserPlus, MessageCircle, Users, Activity, ChevronRight, Mail, Send } from 'lucide-react';
import { getUserUrl } from '../utils/slug';

const Notifications = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('activity');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            // Notifications
            try {
                const notifData = await api.getNotifications();
                setNotifications(notifData.notifications || []);
                if (notifData.unreadCount > 0) await api.markNotificationsRead();
            } catch (e) {
                console.error('Notif load error:', e);
            }

            // Conversations
            try {
                const convData = await api.getConversations();
                setConversations(convData || []);
            } catch (e) {
                console.error('Conv load error:', e);
                toast.error(e.message || 'Gagal memuat pesan');
            }
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

    const groupedNotifications = useMemo(() => {
        const followers = notifications.filter(n => n.type === 'follow');
        const likes = notifications.filter(n => n.type === 'like');
        const comments = notifications.filter(n => n.type === 'comment');
        return { followers, likes, comments };
    }, [notifications]);

    const totalUnreadMessages = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

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
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Mail className="w-6 h-6 text-[var(--color-primary)]" />
                    Inbox
                </h1>
            </div>

            {/* Tab Switcher */}
            <div className="flex bg-[var(--color-surface)] rounded-xl p-1 mb-6">
                <button
                    onClick={() => setActiveTab('activity')}
                    className={`flex-1 py-2.5 rounded-lg font-medium transition-all ${activeTab === 'activity'
                        ? 'bg-[var(--color-primary)] text-black'
                        : 'text-[var(--color-text-secondary)]'
                        }`}
                >
                    <Activity className="w-4 h-4 inline mr-2" />
                    Aktivitas
                </button>
                <button
                    onClick={() => setActiveTab('messages')}
                    className={`flex-1 py-2.5 rounded-lg font-medium transition-all relative ${activeTab === 'messages'
                        ? 'bg-[var(--color-primary)] text-black'
                        : 'text-[var(--color-text-secondary)]'
                        }`}
                >
                    <MessageCircle className="w-4 h-4 inline mr-2" />
                    Pesan
                    {totalUnreadMessages > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center text-white font-bold">
                            {totalUnreadMessages > 9 ? '9+' : totalUnreadMessages}
                        </span>
                    )}
                </button>
            </div>

            {/* Activity Tab */}
            {activeTab === 'activity' && (
                <>
                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-3 mb-6">
                        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-2xl p-3 text-center">
                            <div className="w-8 h-8 mx-auto rounded-full bg-blue-500 flex items-center justify-center mb-1">
                                <UserPlus className="w-4 h-4 text-white" />
                            </div>
                            <p className="text-lg font-bold">{groupedNotifications.followers.length}</p>
                            <p className="text-[10px] text-[var(--color-text-secondary)]">Followers</p>
                        </div>
                        <div className="bg-gradient-to-br from-pink-500/20 to-pink-600/10 border border-pink-500/30 rounded-2xl p-3 text-center">
                            <div className="w-8 h-8 mx-auto rounded-full bg-pink-500 flex items-center justify-center mb-1">
                                <Heart className="w-4 h-4 text-white" fill="currentColor" />
                            </div>
                            <p className="text-lg font-bold">{groupedNotifications.likes.length}</p>
                            <p className="text-[10px] text-[var(--color-text-secondary)]">Suka</p>
                        </div>
                        <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 rounded-2xl p-3 text-center">
                            <div className="w-8 h-8 mx-auto rounded-full bg-green-500 flex items-center justify-center mb-1">
                                <MessageCircle className="w-4 h-4 text-white" />
                            </div>
                            <p className="text-lg font-bold">{groupedNotifications.comments.length}</p>
                            <p className="text-[10px] text-[var(--color-text-secondary)]">Komentar</p>
                        </div>
                    </div>

                    {/* Activity List */}
                    {notifications.length === 0 ? (
                        <div className="text-center py-16">
                            <Activity className="w-16 h-16 mx-auto text-[var(--color-text-muted)] mb-4" />
                            <h2 className="text-lg font-semibold mb-2">Belum ada aktivitas</h2>
                            <p className="text-sm text-[var(--color-text-secondary)]">Notifikasi akan muncul di sini</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {notifications.slice(0, 20).map(n => (
                                <Link
                                    key={n.id}
                                    to={getNotificationLink(n)}
                                    className={`flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--color-surface-hover)] transition-colors ${!n.isRead ? 'bg-[var(--color-primary)]/5' : ''}`}
                                >
                                    <div className="relative flex-shrink-0">
                                        {n.fromUser?.photoURL ? (
                                            <img src={getImageUrl(n.fromUser.photoURL)} alt="" className="w-11 h-11 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] flex items-center justify-center">
                                                <span className="font-bold text-black">{n.fromUser?.name?.charAt(0) || '?'}</span>
                                            </div>
                                        )}
                                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-[var(--color-bg)] ${n.type === 'follow' ? 'bg-blue-500' : n.type === 'like' ? 'bg-pink-500' : n.type === 'comment' ? 'bg-green-500' : 'bg-[var(--color-primary)]'
                                            }`}>
                                            {n.type === 'follow' && <UserPlus className="w-2.5 h-2.5 text-white" />}
                                            {n.type === 'like' && <Heart className="w-2.5 h-2.5 text-white" fill="currentColor" />}
                                            {n.type === 'comment' && <MessageCircle className="w-2.5 h-2.5 text-white" />}
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm">
                                            <span className="font-semibold">{n.fromUser?.name || 'Seseorang'}</span>
                                            {' '}
                                            <span className="text-[var(--color-text-secondary)]">
                                                {n.type === 'follow' && 'mengikuti kamu'}
                                                {n.type === 'like' && 'menyukai lagumu'}
                                                {n.type === 'comment' && 'mengomentari lagumu'}
                                            </span>
                                        </p>
                                        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{formatTimeAgo(n.createdAt)}</p>
                                    </div>
                                    {!n.isRead && <div className="w-2 h-2 rounded-full bg-[var(--color-primary)]" />}
                                </Link>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Messages Tab */}
            {activeTab === 'messages' && (
                <>
                    {conversations.length === 0 ? (
                        <div className="text-center py-16">
                            <Send className="w-16 h-16 mx-auto text-[var(--color-text-muted)] mb-4" />
                            <h2 className="text-lg font-semibold mb-2">Belum ada pesan</h2>
                            <p className="text-sm text-[var(--color-text-secondary)]">Mulai chat dengan mengunjungi profil seseorang</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {conversations.map(conv => (
                                <Link
                                    key={conv.conversationId}
                                    to={`/chat/${conv.conversationId}`}
                                    className={`flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--color-surface-hover)] transition-colors ${conv.unreadCount > 0 ? 'bg-[var(--color-primary)]/5' : ''}`}
                                >
                                    {/* User Photo */}
                                    <div className="relative flex-shrink-0">
                                        {conv.otherUser?.photoURL ? (
                                            <img src={getImageUrl(conv.otherUser.photoURL)} alt="" className="w-12 h-12 rounded-full object-cover ring-2 ring-[var(--color-surface)]" />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-[var(--color-primary)] flex items-center justify-center">
                                                <span className="text-lg font-bold text-black">{conv.otherUser?.name?.charAt(0)}</span>
                                            </div>
                                        )}
                                        {/* Online indicator */}
                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[var(--color-bg)]" />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <p className="font-semibold truncate">{conv.otherUser?.name}</p>
                                            <span className="text-xs text-[var(--color-text-muted)]">{formatTimeAgo(conv.lastMessageTime)}</span>
                                        </div>
                                        <p className={`text-sm truncate mt-0.5 ${conv.unreadCount > 0 ? 'text-white font-medium' : 'text-[var(--color-text-secondary)]'}`}>
                                            {conv.lastSenderId === user?.id && <span className="text-[var(--color-text-muted)]">Kamu: </span>}
                                            {conv.lastMessage || 'Mulai percakapan'}
                                        </p>
                                    </div>

                                    {/* Unread badge */}
                                    {conv.unreadCount > 0 && (
                                        <div className="w-5 h-5 bg-[var(--color-primary)] rounded-full flex items-center justify-center">
                                            <span className="text-xs font-bold text-black">{conv.unreadCount}</span>
                                        </div>
                                    )}
                                </Link>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Notifications;
