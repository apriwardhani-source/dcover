```javascript
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { getUserUrl } from '../utils/slug';

const SuggestedUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

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


    if (users.length === 0) return null;

    return (
        <div className="mb-6">
            <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-3">Sugesti untuk diikuti</h3>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                {users.map(user => (
                    <Link
                        key={user.id}
                        import { getUserUrl} from '../utils/slug';

const SuggestedUsers = () => {
                    ...
                    to = { getUserUrl(user) }
                        className="flex-shrink-0 w-28 text-center group"
                    >
                {user.photoURL ? (
                    <img
                        src={user.photoURL}
                        alt={user.name}
                        className="w-16 h-16 rounded-full object-cover mx-auto mb-2 ring-2 ring-transparent group-hover:ring-[var(--color-primary)] transition-all"
                    />
                ) : (
                    <div className="w-16 h-16 rounded-full bg-[var(--color-surface-hover)] flex items-center justify-center mx-auto mb-2 ring-2 ring-transparent group-hover:ring-[var(--color-primary)] transition-all">
                        <span className="text-xl font-bold">{user.name?.charAt(0)}</span>
                    </div>
                )}

                <p className="text-sm font-medium truncate mb-1">{user.name}</p>
                <p className="text-xs text-[var(--color-text-secondary)] flex items-center justify-center gap-1">
                    <Music2 className="w-3 h-3" /> {user.songCount} lagu
                </p>

                {followingIds.has(user.id) ? (
                    <span className="inline-block mt-2 text-xs text-[var(--color-text-secondary)] px-3 py-1 bg-[var(--color-surface-hover)] rounded-full">
                        Mengikuti
                    </span>
                ) : (
                    <button
                        onClick={(e) => handleFollow(e, user.id)}
                        className="mt-2 flex items-center gap-1 text-xs px-3 py-1 bg-[var(--color-primary)] text-black rounded-full hover:opacity-90 transition-opacity mx-auto"
                    >
                        <UserPlus className="w-3 h-3" />
                        Ikuti
                    </button>
                )}
            </Link>
                ))}
        </div>
        </div >
    );
};

export default SuggestedUsers;
