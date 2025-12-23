import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, Music2, Users } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const SuggestedUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [followingIds, setFollowingIds] = useState(new Set());

    useEffect(() => {
        loadSuggestions();
    }, []);

    const loadSuggestions = async () => {
        try {
            const data = await api.getSuggestedUsers();
            setUsers(data);
        } catch (error) {
            console.error('Failed to load suggestions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFollow = async (userId) => {
        try {
            await api.followUser(userId);
            setFollowingIds(prev => new Set([...prev, userId]));
            toast.success('Berhasil follow!');
        } catch (error) {
            toast.error('Gagal follow');
        }
    };

    if (loading) {
        return (
            <div className="p-4">
                <div className="animate-pulse space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-[var(--color-surface-hover)]" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-[var(--color-surface-hover)] rounded w-24" />
                                <div className="h-3 bg-[var(--color-surface-hover)] rounded w-16" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (users.length === 0) {
        return null;
    }

    return (
        <div className="bg-[var(--color-surface)] rounded-xl p-4">
            <h3 className="font-bold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-[var(--color-primary)]" />
                Sugesti untuk diikuti
            </h3>

            <div className="space-y-3">
                {users.map(user => (
                    <div key={user.id} className="flex items-center gap-3">
                        <Link to={`/user/${user.id}`} className="flex-shrink-0">
                            {user.photoURL ? (
                                <img
                                    src={user.photoURL}
                                    alt={user.name}
                                    className="w-12 h-12 rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-12 h-12 rounded-full bg-[var(--color-surface-hover)] flex items-center justify-center">
                                    <span className="text-lg font-bold">{user.name?.charAt(0)}</span>
                                </div>
                            )}
                        </Link>

                        <div className="flex-1 min-w-0">
                            <Link to={`/user/${user.id}`} className="font-medium hover:text-[var(--color-primary)] transition-colors truncate block">
                                {user.name}
                            </Link>
                            <div className="flex items-center gap-3 text-xs text-[var(--color-text-secondary)]">
                                <span className="flex items-center gap-1">
                                    <Music2 className="w-3 h-3" />
                                    {user.songCount} lagu
                                </span>
                                <span className="flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    {user.followerCount} pengikut
                                </span>
                            </div>
                        </div>

                        {followingIds.has(user.id) ? (
                            <span className="text-xs text-[var(--color-text-secondary)] px-3 py-1.5 bg-[var(--color-surface-hover)] rounded-full">
                                Mengikuti
                            </span>
                        ) : (
                            <button
                                onClick={() => handleFollow(user.id)}
                                className="flex items-center gap-1 text-sm px-3 py-1.5 bg-[var(--color-primary)] text-black rounded-full hover:opacity-90 transition-opacity"
                            >
                                <UserPlus className="w-4 h-4" />
                                Ikuti
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SuggestedUsers;
