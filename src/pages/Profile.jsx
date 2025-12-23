import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { Music2, Disc, Heart, Play, Pause, MoreVertical, Trash2, Image, Edit2, X, Check, Camera } from 'lucide-react';

import { API_URL } from '../config';

const Profile = () => {
    const { user, setUser } = useAuth();
    const { playSong, currentSong, isPlaying } = usePlayer();
    const [songs, setSongs] = useState([]);
    const [albums, setAlbums] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('songs');
    const [menuOpen, setMenuOpen] = useState(null);
    const [editingCover, setEditingCover] = useState(null);
    const coverInputRef = useRef(null);
    const photoInputRef = useRef(null);

    // Edit profile state
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editBio, setEditBio] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (user) {
            loadData();
            setEditName(user.name || '');
            setEditBio(user.bio || '');
        }
    }, [user]);

    const loadData = async () => {
        try {
            const [songsData, albumsData] = await Promise.all([
                api.getUserSongs(user.id),
                api.getUserAlbums(user.id)
            ]);
            setSongs(songsData);
            setAlbums(albumsData);
        } catch (error) {
            console.error('Load error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        if (!editName.trim()) {
            toast.error('Nama tidak boleh kosong');
            return;
        }
        setSaving(true);
        try {
            await api.updateProfile({ name: editName, bio: editBio });
            toast.success('Profil diupdate!');
            setIsEditing(false);
            // Refresh page to get updated user
            window.location.reload();
        } catch (error) {
            toast.error('Gagal update profil');
        } finally {
            setSaving(false);
        }
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !file.type.startsWith('image/')) return;

        try {
            // Convert to base64
            const reader = new FileReader();
            reader.onload = async () => {
                await api.updateProfile({ photoData: reader.result });
                toast.success('Foto profil diupdate!');
                window.location.reload();
            };
            reader.readAsDataURL(file);
        } catch (error) {
            toast.error('Gagal upload foto');
        }
    };

    const handleDeleteSong = async (song) => {
        if (!confirm(`Hapus lagu "${song.title}"?`)) return;
        try {
            await api.deleteSong(song.songId);
            toast.success('Lagu dihapus');
            loadData();
        } catch (error) {
            toast.error('Gagal menghapus');
        }
        setMenuOpen(null);
    };

    const handleDeleteAlbum = async (album) => {
        const albumSongs = songs.filter(s => s.albumId === album.albumId);
        if (albumSongs.length > 0) { toast.error('Hapus lagu dulu'); return; }
        if (!confirm(`Hapus album "${album.title}"?`)) return;
        try {
            await api.deleteAlbum(album.albumId);
            toast.success('Album dihapus');
            loadData();
        } catch (error) {
            toast.error('Gagal menghapus');
        }
        setMenuOpen(null);
    };

    const handleCoverUpload = async (e, type, id) => {
        const file = e.target.files[0];
        if (!file || !file.type.startsWith('image/')) return;
        try {
            const formData = new FormData();
            formData.append('cover', file);
            if (type === 'songs') await api.updateSongCover(id, formData);
            else await api.updateAlbumCover(id, formData);
            toast.success('Cover diupdate');
            loadData();
        } catch (error) {
            toast.error('Gagal update');
        }
        setEditingCover(null);
    };

    const totalLikes = songs.reduce((acc, s) => acc + (s.likes || 0), 0);

    const getPhotoUrl = () => {
        if (user?.photoURL?.startsWith('http')) return user.photoURL;
        if (user?.photoURL) return `${API_URL}${user.photoURL}`;
        return '/default-avatar.png';
    };

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><LoadingSpinner size="lg" /></div>;

    return (
        <div className="pb-player">
            {/* Profile Header */}
            <div className="flex flex-col md:flex-row items-center gap-6 mb-8">
                <div className="relative group">
                    <img src={getPhotoUrl()} alt={user?.name} className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover shadow-xl" />
                    <button
                        onClick={() => photoInputRef.current?.click()}
                        className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <Camera className="w-8 h-8 text-white" />
                    </button>
                    <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </div>
                <div className="text-center md:text-left flex-1">
                    <span className="text-sm font-medium text-[var(--color-text-secondary)] uppercase">Cover Artist</span>

                    {isEditing ? (
                        <div className="mt-2 space-y-3 max-w-md">
                            <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                placeholder="Nama Anda"
                                className="input text-xl font-bold"
                            />
                            <textarea
                                value={editBio}
                                onChange={(e) => setEditBio(e.target.value)}
                                placeholder="Bio singkat tentang Anda..."
                                rows={2}
                                className="input resize-none"
                            />
                            <div className="flex gap-2">
                                <button onClick={handleSaveProfile} disabled={saving} className="btn btn-primary flex items-center gap-2">
                                    <Check className="w-4 h-4" />{saving ? 'Menyimpan...' : 'Simpan'}
                                </button>
                                <button onClick={() => { setIsEditing(false); setEditName(user?.name || ''); setEditBio(user?.bio || ''); }} className="btn btn-secondary flex items-center gap-2">
                                    <X className="w-4 h-4" />Batal
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center justify-center md:justify-start gap-2 mt-1">
                                <h1 className="text-3xl md:text-4xl font-bold">{user?.name}</h1>
                                <button onClick={() => setIsEditing(true)} className="p-2 text-[var(--color-text-secondary)] hover:text-white transition-colors">
                                    <Edit2 className="w-5 h-5" />
                                </button>
                            </div>
                            {user?.bio && <p className="text-[var(--color-text-secondary)] mt-2 max-w-md">{user.bio}</p>}
                        </>
                    )}

                    <div className="flex items-center justify-center md:justify-start gap-4 mt-3 text-[var(--color-text-secondary)]">
                        <span className="flex items-center gap-1"><Music2 className="w-4 h-4" />{songs.length} Lagu</span>
                        <span className="flex items-center gap-1"><Disc className="w-4 h-4" />{albums.length} Album</span>
                        <span className="flex items-center gap-1"><Heart className="w-4 h-4" />{totalLikes} Likes</span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-[var(--color-border)]">
                {['songs', 'albums'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-3 font-medium relative ${activeTab === tab ? 'text-white' : 'text-[var(--color-text-secondary)]'}`}>
                        {tab === 'songs' ? 'Lagu' : 'Album'}
                        {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-primary)]" />}
                    </button>
                ))}
            </div>

            {/* Content */}
            {activeTab === 'songs' ? (
                songs.length > 0 ? (
                    <div className="space-y-2">
                        {songs.map((song, index) => {
                            const isCurrent = currentSong?.songId === song.songId;
                            const cover = song.coverImage || song.albumCover;
                            return (
                                <div key={song.songId} className={`group flex items-center gap-4 p-3 rounded-lg ${isCurrent ? 'bg-[var(--color-surface-active)]' : 'hover:bg-[var(--color-surface-hover)]'}`}>
                                    <div onClick={() => playSong(song, songs, index)} className="relative w-12 h-12 rounded overflow-hidden bg-[var(--color-surface-hover)] cursor-pointer flex-shrink-0">
                                        {cover ? <img src={`${API_URL}${cover}`} className="w-full h-full object-cover" /> : <Music2 className="w-5 h-5 text-[var(--color-text-muted)] m-auto" />}
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                            {isCurrent && isPlaying ? <Pause className="w-5 h-5" fill="currentColor" /> : <Play className="w-5 h-5" fill="currentColor" />}
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`font-medium truncate ${isCurrent ? 'text-[var(--color-primary)]' : ''}`}>{song.title}</p>
                                        <p className="text-sm text-[var(--color-text-secondary)] truncate">Cover of {song.originalArtist}</p>
                                    </div>
                                    <span className="hidden sm:block text-[var(--color-text-secondary)]">{song.likes || 0} ❤️</span>
                                    <div className="relative">
                                        <button onClick={() => setMenuOpen(menuOpen === song.songId ? null : song.songId)} className="p-2"><MoreVertical className="w-5 h-5" /></button>
                                        {menuOpen === song.songId && (
                                            <div className="absolute right-0 top-full w-48 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-xl z-10">
                                                <button onClick={() => { setEditingCover({ type: 'songs', id: song.songId }); coverInputRef.current?.click(); setMenuOpen(null); }} className="flex items-center gap-3 w-full px-4 py-3 hover:bg-[var(--color-surface-hover)]"><Image className="w-4 h-4" />Edit Cover</button>
                                                <button onClick={() => handleDeleteSong(song)} className="flex items-center gap-3 w-full px-4 py-3 text-red-500 hover:bg-[var(--color-surface-hover)]"><Trash2 className="w-4 h-4" />Hapus</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : <div className="text-center py-16"><Music2 className="w-16 h-16 mx-auto text-[var(--color-text-muted)] mb-4" /><Link to="/upload" className="btn btn-primary">Upload</Link></div>
            ) : albums.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {albums.map(album => (
                        <div key={album.albumId} className="group relative">
                            <Link to={`/album/${album.albumId}`} className="card hover-lift block">
                                <div className="aspect-square rounded-md overflow-hidden mb-4 bg-[var(--color-surface-hover)]">
                                    {album.coverImage ? <img src={`${API_URL}${album.coverImage}`} className="w-full h-full object-cover" /> : <Disc className="w-12 h-12 text-[var(--color-text-muted)] m-auto mt-8" />}
                                </div>
                                <h3 className="font-bold truncate">{album.title}</h3>
                                <p className="text-sm text-[var(--color-text-secondary)]">{album.songCount || 0} lagu</p>
                            </Link>
                            <button onClick={() => setMenuOpen(menuOpen === album.albumId ? null : album.albumId)} className="absolute top-2 right-2 p-2 bg-black/50 rounded-full opacity-0 group-hover:opacity-100"><MoreVertical className="w-4 h-4" /></button>
                            {menuOpen === album.albumId && (
                                <div className="absolute right-0 top-10 w-48 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-xl z-10">
                                    <button onClick={() => { setEditingCover({ type: 'albums', id: album.albumId }); coverInputRef.current?.click(); setMenuOpen(null); }} className="flex items-center gap-3 w-full px-4 py-3 hover:bg-[var(--color-surface-hover)]"><Image className="w-4 h-4" />Edit Cover</button>
                                    <button onClick={() => handleDeleteAlbum(album)} className="flex items-center gap-3 w-full px-4 py-3 text-red-500 hover:bg-[var(--color-surface-hover)]"><Trash2 className="w-4 h-4" />Hapus</button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : <div className="text-center py-16"><Disc className="w-16 h-16 mx-auto text-[var(--color-text-muted)] mb-4" /><Link to="/upload" className="btn btn-primary">Buat Album</Link></div>}

            <input ref={coverInputRef} type="file" accept="image/*" onChange={(e) => editingCover && handleCoverUpload(e, editingCover.type, editingCover.id)} className="hidden" />
            {menuOpen && <div className="fixed inset-0 z-0" onClick={() => setMenuOpen(null)} />}
        </div>
    );
};

export default Profile;
