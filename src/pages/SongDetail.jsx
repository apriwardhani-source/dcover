import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import api from '../services/api';
import Comments from '../components/Comments';
import FollowButton from '../components/FollowButton';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { Play, Pause, Heart, Share2, Music2, ArrowLeft, Calendar, User } from 'lucide-react';

import { API_URL } from '../config';

const SongDetail = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const { currentSong, isPlaying, playSong, togglePlay } = usePlayer();
    const [song, setSong] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isLiked, setIsLiked] = useState(false);
    const [artistFollowers, setArtistFollowers] = useState(0);

    useEffect(() => {
        loadSong();
    }, [id, user]);

    const loadSong = async () => {
        try {
            const songs = await api.getSongs();
            const foundSong = songs.find(s => s.songId === parseInt(id));

            if (foundSong) {
                setSong(foundSong);

                if (user) {
                    const likedSongs = await api.getLikedSongs(user.id);
                    setIsLiked(likedSongs.includes(foundSong.songId));
                }

                if (foundSong.userId) {
                    const followers = await api.getFollowersCount(foundSong.userId);
                    setArtistFollowers(followers.count);
                }
            }
        } catch (error) {
            console.error('Load song error:', error);
            toast.error('Gagal memuat lagu');
        } finally {
            setLoading(false);
        }
    };

    const handlePlay = () => {
        if (currentSong?.songId === song.songId) {
            togglePlay();
        } else {
            playSong(song, [song], 0);
        }
    };

    const handleLike = async () => {
        if (!user) {
            toast.error('Login untuk menyukai lagu');
            return;
        }
        try {
            await api.likeSong(song.songId);
            setIsLiked(!isLiked);
            setSong(prev => ({
                ...prev,
                likes: isLiked ? (prev.likes || 1) - 1 : (prev.likes || 0) + 1
            }));
        } catch (error) {
            toast.error('Gagal update like');
        }
    };

    const handleShare = async () => {
        const shareData = {
            title: song.title,
            text: `Dengarkan "${song.title}" cover by ${song.coverArtist} di dcover! 🎵`,
            url: window.location.href
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
                toast.success('Link copied!');
            }
        } catch (error) {
            console.error('Share error:', error);
        }
    };

    const isCurrentlyPlaying = currentSong?.songId === song?.songId && isPlaying;

    const getCoverImage = () => {
        if (song?.coverImage) return `${API_URL}${song.coverImage}`;
        if (song?.albumCover) return `${API_URL}${song.albumCover}`;
        return null;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (!song) {
        return (
            <div className="text-center py-20">
                <Music2 className="w-16 h-16 mx-auto text-[var(--color-text-muted)] mb-4" />
                <h2 className="text-xl font-bold mb-2">Lagu tidak ditemukan</h2>
                <Link to="/" className="text-[var(--color-primary)]">Kembali ke Home</Link>
            </div>
        );
    }

    return (
        <div className="pb-player max-w-4xl mx-auto">
            <Link to="/" className="inline-flex items-center gap-2 text-[var(--color-text-secondary)] hover:text-white mb-6">
                <ArrowLeft className="w-5 h-5" /> Kembali
            </Link>

            {/* Song Header */}
            <div className="flex flex-col md:flex-row gap-6 mb-8">
                <div className="w-full md:w-64 aspect-square rounded-xl overflow-hidden shadow-2xl flex-shrink-0">
                    {getCoverImage() ? (
                        <img src={getCoverImage()} alt={song.title} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-[var(--color-surface)] flex items-center justify-center">
                            <Music2 className="w-20 h-20 text-[var(--color-text-muted)]" />
                        </div>
                    )}
                </div>

                <div className="flex-1">
                    <h1 className="text-3xl md:text-4xl font-bold mb-2">{song.title}</h1>
                    <p className="text-xl text-[var(--color-text-secondary)] mb-4">
                        Cover by <span className="text-white">{song.coverArtist}</span>
                    </p>
                    <p className="text-[var(--color-text-muted)] mb-4">
                        Original: {song.originalArtist}
                    </p>

                    {/* Artist Info */}
                    <div className="flex items-center gap-4 mb-6 p-4 bg-[var(--color-surface)] rounded-lg">
                        <User className="w-10 h-10 text-[var(--color-text-muted)]" />
                        <div className="flex-1">
                            <p className="font-medium">{song.coverArtist}</p>
                            <p className="text-sm text-[var(--color-text-secondary)]">{artistFollowers} followers</p>
                        </div>
                        {song.userId && <FollowButton userId={song.userId} userName={song.coverArtist} onFollowChange={loadSong} />}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3">
                        <button onClick={handlePlay} className="btn btn-primary">
                            {isCurrentlyPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                            {isCurrentlyPlaying ? 'Pause' : 'Play'}
                        </button>
                        <button onClick={handleLike} className={`btn ${isLiked ? 'btn-primary' : 'btn-secondary'}`}>
                            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                            {song.likes || 0}
                        </button>
                        <button onClick={handleShare} className="btn btn-secondary">
                            <Share2 className="w-5 h-5" /> Share
                        </button>
                    </div>

                    {/* Meta Info */}
                    <div className="flex items-center gap-4 mt-4 text-sm text-[var(--color-text-muted)]">
                        <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(song.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                        {song.albumTitle && (
                            <Link to={`/album/${song.albumId}`} className="text-[var(--color-primary)]">
                                📀 {song.albumTitle}
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Comments Section */}
            <Comments songId={song.songId} />
        </div>
    );
};

export default SongDetail;
