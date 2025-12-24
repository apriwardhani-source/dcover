import { useState, useEffect } from 'react';
import { getImageUrl } from '../utils/url';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { Music2, Heart, Play, User, Calendar, MessageSquare, TrendingUp } from 'lucide-react';
import { getSongUrl } from '../utils/slug';

import { API_URL } from '../config';

const Activity = () => {
    const { user } = useAuth();
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadActivities();
    }, [user]);

    const loadActivities = async () => {
        try {
            const songs = await api.getSongs();

            // Generate activities from recent songs
            const songActivities = songs.slice(0, 20).map(song => ({
                id: `song-${song.songId}`,
                type: 'new_song',
                user: { name: song.coverArtist, id: song.userId },
                song: song,
                createdAt: song.createdAt
            }));

            // Sort by date
            const sorted = songActivities.sort((a, b) =>
                new Date(b.createdAt) - new Date(a.createdAt)
            );

            setActivities(sorted);
        } catch (error) {
            console.error('Load activities error:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (date) => {
        const d = new Date(date);
        const now = new Date();
        const diff = (now - d) / 1000;

        if (diff < 60) return 'Baru saja';
        if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
        if (diff < 604800) return `${Math.floor(diff / 86400)} hari lalu`;
        return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    };

    const getActivityIcon = (type) => {
        switch (type) {
            case 'new_song': return <Music2 className="w-4 h-4" />;
            case 'like': return <Heart className="w-4 h-4" />;
            case 'comment': return <MessageCircle className="w-4 h-4" />;
            case 'follow': return <UserPlus className="w-4 h-4" />;
            default: return <Clock className="w-4 h-4" />;
        }
    };

    const getActivityMessage = (activity) => {
        switch (activity.type) {
            case 'new_song':
                return (
                    <span>
                        <strong>{activity.user.name}</strong> mengupload lagu baru{' '}
                        <Link to={`/song/${activity.song.songId}`} className="text-[var(--color-primary)] hover:underline">
                            "{activity.song.title}"
                        </Link>
                    </span>
                );
            case 'like':
                return (
                    <span>
                        <strong>{activity.user.name}</strong> menyukai lagu{' '}
                        <Link to={`/song/${activity.song.songId}`} className="text-[var(--color-primary)] hover:underline">
                            "{activity.song.title}"
                        </Link>
                    </span>
                );
            default:
                return <span>Aktivitas baru</span>;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <div className="pb-player max-w-2xl mx-auto">
            <h1 className="text-2xl md:text-3xl font-bold mb-6 flex items-center gap-3">
                <Clock className="w-8 h-8 text-[var(--color-primary)]" />
                Activity Feed
            </h1>

            {activities.length === 0 ? (
                <div className="text-center py-16">
                    <Clock className="w-16 h-16 mx-auto text-[var(--color-text-muted)] mb-4" />
                    <p className="text-[var(--color-text-secondary)]">Belum ada aktivitas</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {activities.map((activity) => (
                        <div key={activity.id} className="bg-[var(--color-surface)] rounded-lg p-4 flex gap-4">
                            {/* Song Cover */}
                            {activity.song && (
                                <Link to={getSongUrl(activity.song)} className="flex-shrink-0">
                                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-[var(--color-surface-hover)]">
                                        {activity.song.coverImage || activity.song.albumCover ? (
                                            <img
                                                src={getImageUrl(activity.song.coverImage || activity.song.albumCover)}
                                                alt={activity.song.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Music2 className="w-6 h-6 text-[var(--color-text-muted)]" />
                                            </div>
                                        )}
                                    </div>
                                </Link>
                            )}

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start gap-2">
                                    <span className={`p-1.5 rounded-full ${activity.type === 'new_song' ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)]' : 'bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]'}`}>
                                        {getActivityIcon(activity.type)}
                                    </span>
                                    <div className="flex-1">
                                        <p className="text-sm">{getActivityMessage(activity)}</p>
                                        <p className="text-xs text-[var(--color-text-muted)] mt-1">{formatTime(activity.createdAt)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Activity;
