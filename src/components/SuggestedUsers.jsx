import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, Music2 } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { getUserUrl } from '../utils/slug';

const SuggestedUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [followingIds, setFollowingIds] = useState(new Set());

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const data = await api.getSuggestedUsers();
            setUsers(data || []);
        } catch (error) {
            console.error('Failed to load users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFollow = async (e, userId) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            await api.followUser(userId);
            setFollowingIds(prev => new Set([...prev, userId]));
            toast.success('Berhasil mengikuti!');
        } catch (error) {
            toast.error('Gagal mengikuti');
        }
    };

    if (loading || users.length === 0) return null;

    return (
        <section className="mb-10 overflow-hidden">
            <h2 className="text-xl font-bold mb-4">Artist Lainnya</h2>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
                {users.map(user => (
                    <Link
                        key={user.id}
                        to={getUserUrl(user)}
                        className="flex-shrink-0 w-28 text-center group"
                    >
                        {user.photoURL ? (
                            <img
                                src={user.photoURL}
                                alt={user.name}
                                className="w-16 h-16 rounded-full object-cover mx-auto mb-2 ring-2 ring-transparent group-hover:ring-[var(--color-primary)] transition-all shadow-lg"
                            />
                        ) : (
                            <div className="w-16 h-16 rounded-full bg-[var(--color-surface-hover)] flex items-center justify-center mx-auto mb-2 ring-2 ring-transparent group-hover:ring-[var(--color-primary)] transition-all shadow-lg">
                                <span className="text-xl font-bold">{user.name?.charAt(0)}</span>
                            </div>
                        )}

                        <p className="text-sm font-medium truncate mb-1">{user.name}</p>
                        <p className="text-xs text-[var(--color-text-secondary)] flex items-center justify-center gap-1">
                            <Music2 className="w-3 h-3" /> {user.songCount} lagu
                        </p>

                        {!followingIds.has(user.id) && (
                            <button
                                onClick={(e) => handleFollow(e, user.id)}
                                className="mt-2 flex items-center gap-1 text-xs px-3 py-1 bg-[var(--color-primary)] text-black rounded-full hover:opacity-90 transition-opacity mx-auto font-medium"
                            >
                                <UserPlus className="w-3 h-3" />
                                Ikuti
                            </button>
                        )}
                        {followingIds.has(user.id) && (
                            <span className="mt-2 inline-block text-xs px-3 py-1 bg-[var(--color-surface-hover)] text-white/50 rounded-full">
                                Diikuti
                            </span>
                        )}
                    </Link>
                ))}
            </div>
        </section>
    );
};

export default SuggestedUsers;
