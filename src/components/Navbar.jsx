import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, Upload, User, Shield, LogOut, Menu, X, Sun, Moon, Bell } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';

import { API_URL } from '../config';

const Navbar = () => {
    const { user, isUserAdmin, logout } = useAuth();
    const { theme, toggleTheme, isDark } = useTheme();
    const location = useLocation();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (user) {
            loadNotifications();
            // Poll every 30 seconds
            const interval = setInterval(loadNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const loadNotifications = async () => {
        try {
            const data = await api.getNotifications();
            setNotifications(data.notifications || []);
            setUnreadCount(data.unreadCount || 0);
        } catch (error) {
            console.error('Load notifications error:', error);
        }
    };

    const handleOpenNotifications = async () => {
        setShowNotifications(!showNotifications);
        if (!showNotifications && unreadCount > 0) {
            await api.markNotificationsRead();
            setUnreadCount(0);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { path: '/', icon: Home, label: 'Home' },
        { path: '/upload', icon: Upload, label: 'Upload' },
        { path: '/profile', icon: User, label: 'Profile' },
    ];

    if (isUserAdmin) {
        navItems.push({ path: '/admin', icon: Shield, label: 'Admin' });
    }

    const isActive = (path) => location.pathname === path;

    const getPhotoUrl = () => {
        if (!user?.photoURL) return null;
        if (user.photoURL.startsWith('http')) return user.photoURL;
        return `${API_URL}${user.photoURL}`;
    };

    const formatTimeAgo = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        if (seconds < 60) return 'baru saja';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m lalu`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}j lalu`;
        return `${Math.floor(seconds / 86400)}h lalu`;
    };

    return (
        <>
            {/* Desktop Sidebar */}
            <nav className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-black flex-col p-6 z-50">
                <Link to="/" className="flex items-center gap-3 mb-10">
                    <img src="/logo.jpg" alt="dcover" className="w-10 h-10 rounded-lg object-cover" />
                    <span className="text-xl font-bold">dcover</span>
                </Link>

                <div className="flex-1 space-y-2">
                    {navItems.map((item) => (
                        <Link key={item.path} to={item.path}
                            className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 ${isActive(item.path) ? 'bg-[var(--color-surface-hover)] text-white' : 'text-[var(--color-text-secondary)] hover:text-white hover:bg-[var(--color-surface-hover)]'}`}>
                            <item.icon className="w-5 h-5" /><span className="font-medium">{item.label}</span>
                        </Link>
                    ))}

                    {/* Notification Button - Desktop */}
                    <button onClick={handleOpenNotifications}
                        className="flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 text-[var(--color-text-secondary)] hover:text-white hover:bg-[var(--color-surface-hover)] w-full relative">
                        <Bell className="w-5 h-5" />
                        <span className="font-medium">Notifikasi</span>
                        {unreadCount > 0 && (
                            <span className="absolute left-7 top-2 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>
                </div>

                {user && (
                    <div className="border-t border-[var(--color-border)] pt-4 mt-4">
                        <div className="flex items-center gap-3 mb-4">
                            {getPhotoUrl() ? (
                                <img src={getPhotoUrl()} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-black font-bold">
                                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{user.name}</p>
                                <p className="text-xs text-[var(--color-text-secondary)] truncate">{isUserAdmin ? 'Admin' : 'Artist'}</p>
                            </div>
                        </div>
                        <button onClick={toggleTheme} className="flex items-center gap-3 w-full px-4 py-2 text-[var(--color-text-secondary)] hover:text-white transition-colors rounded-lg hover:bg-[var(--color-surface-hover)] mb-2">
                            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                            <span>{isDark ? 'Mode Terang' : 'Mode Gelap'}</span>
                        </button>
                        <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-2 text-[var(--color-text-secondary)] hover:text-white transition-colors rounded-lg hover:bg-[var(--color-surface-hover)]">
                            <LogOut className="w-5 h-5" /><span>Logout</span>
                        </button>
                    </div>
                )}
            </nav>

            {/* Notification Panel */}
            {showNotifications && (
                <div className="fixed inset-0 z-[100]" onClick={() => setShowNotifications(false)}>
                    <div className="absolute left-64 top-0 bottom-0 w-80 bg-[var(--color-surface)] border-r border-[var(--color-border)] overflow-hidden flex flex-col md:block hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
                            <h3 className="font-bold flex items-center gap-2"><Bell className="w-5 h-5" /> Notifikasi</h3>
                            <button onClick={() => setShowNotifications(false)} className="p-1"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <p className="text-center py-8 text-[var(--color-text-secondary)]">Belum ada notifikasi</p>
                            ) : (
                                notifications.map(n => (
                                    <Link key={n.id}
                                        to={n.type === 'follow' ? `/user/${n.fromUser?.id}` : n.type === 'like' ? `/song/${n.relatedId}` : '/'}
                                        onClick={() => setShowNotifications(false)}
                                        className={`flex items-start gap-3 p-4 hover:bg-[var(--color-surface-hover)] border-b border-[var(--color-border)] ${!n.isRead ? 'bg-[var(--color-surface-hover)]/50' : ''}`}>
                                        {n.fromUser?.photoURL ? (
                                            <img src={n.fromUser.photoURL} alt="" className="w-10 h-10 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-[var(--color-surface-active)] flex items-center justify-center text-sm font-bold">
                                                {n.fromUser?.name?.charAt(0) || '?'}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm">{n.message}</p>
                                            <p className="text-xs text-[var(--color-text-secondary)] mt-1">{formatTimeAgo(n.createdAt)}</p>
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Mobile Notification Panel */}
                    <div className="md:hidden absolute inset-0 bg-black/80 flex items-end" onClick={() => setShowNotifications(false)}>
                        <div className="w-full max-h-[70vh] bg-[var(--color-surface)] rounded-t-xl overflow-hidden" onClick={e => e.stopPropagation()}>
                            <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
                                <h3 className="font-bold flex items-center gap-2"><Bell className="w-5 h-5" /> Notifikasi</h3>
                                <button onClick={() => setShowNotifications(false)} className="p-1"><X className="w-5 h-5" /></button>
                            </div>
                            <div className="max-h-96 overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <p className="text-center py-8 text-[var(--color-text-secondary)]">Belum ada notifikasi</p>
                                ) : (
                                    notifications.map(n => (
                                        <Link key={n.id}
                                            to={n.type === 'follow' ? `/user/${n.fromUser?.id}` : n.type === 'like' ? `/song/${n.relatedId}` : '/'}
                                            onClick={() => setShowNotifications(false)}
                                            className="flex items-start gap-3 p-4 hover:bg-[var(--color-surface-hover)] border-b border-[var(--color-border)]">
                                            {n.fromUser?.photoURL ? (
                                                <img src={n.fromUser.photoURL} alt="" className="w-10 h-10 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-[var(--color-surface-active)] flex items-center justify-center">
                                                    {n.fromUser?.name?.charAt(0) || '?'}
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <p className="text-sm">{n.message}</p>
                                                <p className="text-xs text-[var(--color-text-secondary)] mt-1">{formatTimeAgo(n.createdAt)}</p>
                                            </div>
                                        </Link>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-black border-t border-[var(--color-border)] z-50 safe-bottom">
                <div className="flex justify-around items-center h-16">
                    {navItems.slice(0, 3).map((item) => (
                        <Link key={item.path} to={item.path}
                            className={`flex flex-col items-center justify-center px-4 py-2 transition-colors ${isActive(item.path) ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)]'}`}>
                            <item.icon className="w-5 h-5" /><span className="text-[10px] mt-1">{item.label}</span>
                        </Link>
                    ))}

                    {/* Notification Button - Mobile */}
                    <button onClick={handleOpenNotifications} className="flex flex-col items-center justify-center px-4 py-2 text-[var(--color-text-secondary)] relative">
                        <Bell className="w-5 h-5" />
                        <span className="text-[10px] mt-1">Notif</span>
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-2 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>

                    {user && (
                        <button onClick={() => setMobileMenuOpen(true)} className="flex flex-col items-center justify-center px-4 py-2 text-[var(--color-text-secondary)]">
                            <Menu className="w-5 h-5" /><span className="text-[10px] mt-1">Menu</span>
                        </button>
                    )}
                </div>
            </nav>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div className="md:hidden fixed inset-0 bg-black/80 z-[100]" onClick={() => setMobileMenuOpen(false)}>
                    <div className="absolute right-0 top-0 h-full w-72 bg-[var(--color-surface)] p-6 animate-slide-up" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setMobileMenuOpen(false)} className="absolute top-4 right-4 p-2 text-[var(--color-text-secondary)] hover:text-white"><X className="w-6 h-6" /></button>
                        {user && (
                            <>
                                <div className="flex items-center gap-3 mb-8 mt-4">
                                    {getPhotoUrl() ? (
                                        <img src={getPhotoUrl()} alt={user.name} className="w-12 h-12 rounded-full object-cover" />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-black font-bold text-xl">
                                            {user.name?.charAt(0)?.toUpperCase() || 'U'}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0"><p className="font-bold truncate">{user.name}</p><p className="text-sm text-[var(--color-text-secondary)]">{isUserAdmin ? 'Admin' : 'Cover Artist'}</p></div>
                                </div>
                                <div className="space-y-2 mb-4">
                                    <button onClick={toggleTheme} className="flex items-center gap-3 w-full px-4 py-3 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] rounded-lg transition-colors">
                                        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                                        <span>{isDark ? 'Mode Terang' : 'Mode Gelap'}</span>
                                    </button>
                                </div>
                                <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 text-red-500 hover:bg-[var(--color-surface-hover)] rounded-lg transition-colors"><LogOut className="w-5 h-5" /><span>Logout</span></button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default Navbar;
