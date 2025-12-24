import { Play, Pause, Heart, Music2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

import { API_URL } from '../config';
import { getImageUrl } from '../utils/url';

import { getSongUrl } from '../utils/slug';

const SongCard = ({ song, songs, index, onLikeChange }) => {
    const { playSong, currentSong, isPlaying } = usePlayer();
    const { user } = useAuth();

    const isCurrentSong = currentSong?.songId === song.songId;
    const isLiked = song.likedBy?.includes(user?.id);

    const handlePlay = (e) => {
        e.preventDefault();
        e.stopPropagation();
        playSong(song, songs, index);
    };

    const handleLike = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user) return;
        try {
            await api.likeSong(song.songId);
            if (onLikeChange) onLikeChange();
        } catch (error) {
            console.error('Error toggling like:', error);
        }
    };

    const getCoverImage = () => {
        return getImageUrl(song.coverImage || song.albumCover, null);
    };

    return (
        <Link to={getSongUrl(song)} className="card hover-lift group cursor-pointer block">
            <div className="relative aspect-square rounded-md overflow-hidden mb-4 bg-[var(--color-surface-hover)]">
                {getCoverImage() ? (
                    <img src={getCoverImage()} alt={song.title} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Music2 className="w-12 h-12 text-[var(--color-text-muted)]" />
                    </div>
                )}

                {/* Play Button Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                        onClick={handlePlay}
                        className="w-12 h-12 rounded-full bg-[var(--color-primary)] text-black flex items-center justify-center hover:scale-105 transition-transform"
                    >
                        {isCurrentSong && isPlaying ? (
                            <Pause className="w-5 h-5" fill="currentColor" />
                        ) : (
                            <Play className="w-5 h-5 ml-0.5" fill="currentColor" />
                        )}
                    </button>
                </div>

                {/* Playing Indicator */}
                {isCurrentSong && isPlaying && (
                    <div className="absolute bottom-2 left-2 playing-indicator">
                        {[...Array(4)].map((_, i) => (<span key={i} className="wave-bar" />))}
                    </div>
                )}
            </div>

            <div className="space-y-1">
                <h3 className={`font-bold truncate ${isCurrentSong ? 'text-[var(--color-primary)]' : ''}`}>{song.title}</h3>
                <p className="text-sm text-[var(--color-text-secondary)] truncate">Cover by {song.coverArtist}</p>
                <p className="text-xs text-[var(--color-text-muted)] truncate">Original: {song.originalArtist}</p>
            </div>

            {user && (
                <div className="mt-3 flex items-center gap-4">
                    <button onClick={handleLike}
                        className={`flex items-center gap-1 text-sm ${isLiked ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)] hover:text-white'} transition-colors`}>
                        <Heart className="w-4 h-4" fill={isLiked ? 'currentColor' : 'none'} />
                        <span>{song.likes || 0}</span>
                    </button>
                    <span className="flex items-center gap-1 text-sm text-[var(--color-text-secondary)]">
                        <Play className="w-4 h-4" />
                        <span>{song.plays || 0}</span>
                    </span>
                </div>
            )}
        </Link>
    );
};

export default SongCard;
