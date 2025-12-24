import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { ArrowLeft, Play, Pause, Music2, Clock, Heart, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';

import { API_URL } from '../config';

const AlbumDetail = () => {
    const { albumId } = useParams();
    const { playSong, currentSong, isPlaying } = usePlayer();
    const { user } = useAuth();
    const [album, setAlbum] = useState(null);
    const [songs, setSongs] = useState([]);
    const [likedSongIds, setLikedSongIds] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [albumId, user]);

    const loadData = async () => {
        try {
            const [albumData, songsData] = await Promise.all([
                api.getAlbum(albumId),
                api.getAlbumSongs(albumId)
            ]);
            setAlbum(albumData);
            setSongs(songsData);
            if (user) {
                const liked = await api.getLikedSongs(user.id);
                setLikedSongIds(liked);
            }
        } catch (error) {
            console.error('Load error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePlayAll = () => {
        if (songs.length > 0) playSong(songs[0], songs, 0);
    };

    const handlePlaySong = (song, index) => {
        playSong(song, songs, index);
    };

    const handleShare = async () => {
        const albumUrl = `${window.location.origin}/album/${albumId}`;
        const shareData = {
            title: album?.title,
            text: `Dengarkan album "${album?.title}" di dcover! 🎵`,
            url: albumUrl
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
                toast.success('Link album disalin!');
            }
        } catch (err) {
            console.error('Share error:', err);
        }
    };

    const handleLike = async (song, e) => {
        e.stopPropagation();
        if (!user) return;
        try {
            await api.likeSong(song.songId);
            loadData();
        } catch (error) {
            console.error('Like error:', error);
        }
    };

    const formatDuration = (s) => !s ? '--:--' : `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
    const totalDuration = songs.reduce((a, s) => a + (s.duration || 0), 0);

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><LoadingSpinner size="lg" /></div>;
    if (!album) return <div className="text-center py-20"><Music2 className="w-16 h-16 mx-auto text-[var(--color-text-muted)] mb-4" /><h2 className="text-xl font-bold mb-2">Album Tidak Ditemukan</h2><Link to="/" className="text-[var(--color-primary)]">Kembali</Link></div>;

    return (
        <div className="pb-player">
            <Link to="/" className="inline-flex items-center gap-2 text-[var(--color-text-secondary)] hover:text-white mb-6"><ArrowLeft className="w-5 h-5" />Kembali</Link>

            <div className="flex flex-col md:flex-row gap-6 md:gap-8 mb-8">
                <div className="w-48 h-48 md:w-56 md:h-56 flex-shrink-0 mx-auto md:mx-0 rounded-lg overflow-hidden shadow-2xl">
                    {album.coverImage ? <img src={`${API_URL}${album.coverImage}`} alt={album.title} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-[var(--color-surface-hover)] flex items-center justify-center"><Music2 className="w-20 h-20 text-[var(--color-text-muted)]" /></div>}
                </div>
                <div className="flex flex-col justify-end text-center md:text-left">
                    <span className="text-sm font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Album</span>
                    <h1 className="text-3xl md:text-5xl font-bold mt-2 mb-4">{album.title}</h1>
                    <div className="flex items-center justify-center md:justify-start gap-2 text-[var(--color-text-secondary)]">
                        <span className="font-medium text-white">{album.artistName}</span><span>•</span><span>{songs.length} lagu</span>
                        {totalDuration > 0 && <><span>•</span><span>{Math.floor(totalDuration / 60)} menit</span></>}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4 mb-8">
                <button onClick={handlePlayAll} disabled={songs.length === 0} className="w-14 h-14 rounded-full bg-[var(--color-primary)] text-black flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50"><Play className="w-6 h-6 ml-1" fill="currentColor" /></button>
                <button onClick={handleShare} className="w-10 h-10 rounded-full bg-[var(--color-surface-hover)] flex items-center justify-center hover:bg-[var(--color-surface-active)] transition-colors"><Share2 className="w-5 h-5" /></button>
            </div>

            {songs.length > 0 ? (
                <div className="space-y-1">
                    <div className="hidden md:grid grid-cols-[16px_4fr_1fr_1fr] gap-4 px-4 py-2 text-[var(--color-text-secondary)] text-sm border-b border-[var(--color-border)]">
                        <span>#</span><span>JUDUL</span><span className="flex justify-center"><Heart className="w-4 h-4" /></span><span className="flex justify-end"><Clock className="w-4 h-4" /></span>
                    </div>
                    {songs.map((song, index) => {
                        const isCurrent = currentSong?.songId === song.songId;
                        const isLiked = likedSongIds.includes(song.songId);
                        return (
                            <div key={song.songId} onClick={() => handlePlaySong(song, index)} className={`group grid grid-cols-[auto_1fr_auto] md:grid-cols-[16px_4fr_1fr_1fr] gap-4 px-4 py-3 rounded-md cursor-pointer ${isCurrent ? 'bg-[var(--color-surface-active)]' : 'hover:bg-[var(--color-surface-hover)]'}`}>
                                <div className="hidden md:flex items-center justify-center w-4">
                                    {isCurrent && isPlaying ? <div className="playing-indicator">{[...Array(3)].map((_, i) => <span key={i} className="wave-bar" />)}</div> : <span className={isCurrent ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)]'}>{index + 1}</span>}
                                </div>
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="md:hidden w-10 h-10 rounded-md overflow-hidden flex-shrink-0 bg-[var(--color-surface-hover)]">
                                        {song.coverImage || album.coverImage ? <img src={`${API_URL}${song.coverImage || album.coverImage}`} className="w-full h-full object-cover" /> : <Music2 className="w-5 h-5 text-[var(--color-text-muted)] m-auto" />}
                                    </div>
                                    <div className="min-w-0"><p className={`font-medium truncate ${isCurrent ? 'text-[var(--color-primary)]' : ''}`}>{song.title}</p><p className="text-sm text-[var(--color-text-secondary)] truncate">Cover of {song.originalArtist}</p></div>
                                </div>
                                <div className="hidden md:flex items-center justify-center">
                                    <button onClick={(e) => handleLike(song, e)} className={`p-2 ${isLiked ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100'}`}><Heart className="w-4 h-4" fill={isLiked ? 'currentColor' : 'none'} /></button>
                                </div>
                                <div className="flex items-center justify-end gap-2">
                                    <button onClick={(e) => handleLike(song, e)} className={`md:hidden p-2 ${isLiked ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'}`}><Heart className="w-4 h-4" fill={isLiked ? 'currentColor' : 'none'} /></button>
                                    <span className="text-sm text-[var(--color-text-secondary)]">{formatDuration(song.duration)}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : <div className="text-center py-12"><Music2 className="w-12 h-12 mx-auto text-[var(--color-text-muted)] mb-4" /><p className="text-[var(--color-text-secondary)]">Belum ada lagu</p></div>}
        </div>
    );
};

export default AlbumDetail;
