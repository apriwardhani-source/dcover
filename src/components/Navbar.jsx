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
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (user) {
            loadNotifications();
            const interval = setInterval(loadNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const loadNotifications = async () => {
        try {
            const data = await api.getNotifications();
            setUnreadCount(data.unreadCount || 0);
        } catch (error) {
            console.error('Load notifications error:', error);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { path: '/', icon: Home, label: 'Home' },
        { path: '/upload', icon: Upload, label: 'Upload' },
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

    return (
        <>
            {/* Mobile Top Header */}
            <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-black/90 backdrop-blur-sm border-b border-[var(--color-border)] z-50 flex items-center justify-between px-4">
                <Link to="/" className="flex items-center gap-2">
                    <img src="/logo.jpg" alt="dcover" className="w-8 h-8 rounded-lg object-cover" />
                    <span className="font-bold text-lg">dcover</span>
                </Link>

                <div className="flex items-center gap-2">
                    {/* Notification Button - Navigate to page */}
                    <Link to="/notifications" className="relative p-2">
                        <Bell className="w-5 h-5" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </Link>

                    {/* Profile Button */}
                    <Link to="/profile" className="w-8 h-8 rounded-full overflow-hidden bg-[var(--color-surface-hover)]">
                        {getPhotoUrl() ? (
                            <img src={getPhotoUrl()} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-[var(--color-primary)] text-black font-bold text-sm">
                                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                        )}
                    </Link>
                </div>
            </header>

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

                    {/* Profile Link - Desktop */}
                    <Link to="/profile"
                        className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 ${isActive('/profile') ? 'bg-[var(--color-surface-hover)] text-white' : 'text-[var(--color-text-secondary)] hover:text-white hover:bg-[var(--color-surface-hover)]'}`}>
                        <User className="w-5 h-5" /><span className="font-medium">Profile</span>
                    </Link>

                    {/* Notification Link - Desktop */}
                    <Link to="/notifications"
                        className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 relative ${isActive('/notifications') ? 'bg-[var(--color-surface-hover)] text-white' : 'text-[var(--color-text-secondary)] hover:text-white hover:bg-[var(--color-surface-hover)]'}`}>
                        <Bell className="w-5 h-5" />
                        <span className="font-medium">Notifikasi</span>
                        {unreadCount > 0 && (
                            <span className="ml-auto w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </Link>
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

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-black border-t border-[var(--color-border)] z-50 safe-bottom">
                <div className="flex justify-around items-center h-14">
                    <Link to="/" className={`flex flex-col items-center justify-center px-4 py-2 ${isActive('/') ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)]'}`}>
                        <Home className="w-5 h-5" /><span className="text-[10px] mt-0.5">Home</span>
                    </Link>
                    <Link to="/upload" className={`flex flex-col items-center justify-center px-4 py-2 ${isActive('/upload') ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)]'}`}>
                        <Upload className="w-5 h-5" /><span className="text-[10px] mt-0.5">Upload</span>
                    </Link>
                    <Link to="/profile" className={`flex flex-col items-center justify-center px-4 py-2 ${isActive('/profile') ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)]'}`}>
                        <User className="w-5 h-5" /><span className="text-[10px] mt-0.5">Profile</span>
                    </Link>
                    <button onClick={() => setMobileMenuOpen(true)} className="flex flex-col items-center justify-center px-4 py-2 text-[var(--color-text-secondary)]">
                        <Menu className="w-5 h-5" /><span className="text-[10px] mt-0.5">Menu</span>
                    </button>
                </div>
            </nav>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div className="md:hidden fixed inset-0 bg-black/80 z-[100]" onClick={() => setMobileMenuOpen(false)}>
                    <div className="absolute right-0 top-0 h-full w-72 bg-[var(--color-surface)] p-6 animate-slide-in-right" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setMobileMenuOpen(false)} className="absolute top-4 right-4 p-2"><X className="w-6 h-6" /></button>
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
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold truncate">{user.name}</p>
                                        <p className="text-sm text-[var(--color-text-secondary)]">{isUserAdmin ? 'Admin' : 'Cover Artist'}</p>
                                    </div>
                                </div>

                                {isUserAdmin && (
                                    <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 w-full px-4 py-3 hover:bg-[var(--color-surface-hover)] rounded-lg mb-2">
                                        <Shield className="w-5 h-5" /><span>Admin Panel</span>
                                    </Link>
                                )}

                                <button onClick={toggleTheme} className="flex items-center gap-3 w-full px-4 py-3 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] rounded-lg">
                                    {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                                    <span>{isDark ? 'Mode Terang' : 'Mode Gelap'}</span>
                                </button>

                                <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 text-red-500 hover:bg-[var(--color-surface-hover)] rounded-lg mt-4">
                                    <LogOut className="w-5 h-5" /><span>Logout</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default Navbar;
