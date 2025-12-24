import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import api from '../services/api';
import { ProfileSkeleton } from '../components/Skeletons';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { Music2, Disc, Heart, Play, Pause, MoreVertical, Trash2, Image, Edit2, X, Check, Camera, Users, Eye, EyeOff, Share2 } from 'lucide-react';

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

    // Followers/Following state
    const [followersCount, setFollowersCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const [showModal, setShowModal] = useState(null); // 'followers' | 'following' | null
    const [modalUsers, setModalUsers] = useState([]);

    useEffect(() => {
        if (user) {
            loadData();
            setEditName(user.name || '');
            setEditBio(user.bio || '');
        }
    }, [user]);

    const loadData = async () => {
        try {
            const [songsData, albumsData, followersData, followingData] = await Promise.all([
                api.getUserSongs(user.id),
                api.getUserAlbums(user.id),
                api.getFollowers(user.id),
                api.getFollowing(user.id)
            ]);
            setSongs(songsData);
            setAlbums(albumsData);
            setFollowersCount(followersData.count || 0);
            setFollowingCount(followingData.count || 0);
        } catch (error) {
            console.error('Load error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleShowModal = async (type) => {
        setShowModal(type);
        try {
            const data = type === 'followers'
                ? await api.getFollowers(user.id)
                : await api.getFollowing(user.id);
            setModalUsers(data.users || []);
        } catch (error) {
            console.error('Failed to load users:', error);
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
        if (!file || !file.type.startsWith('image/')) {
            toast.error('Pilih file gambar yang valid');
            return;
        }

        const toastId = toast.loading('Mengupload foto...');

        try {
            // Upload directly to Cloudinary
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', 'ml_default');
            formData.append('cloud_name', 'dzz91k3ky');

            const cloudinaryRes = await fetch(
                'https://api.cloudinary.com/v1_1/dzz91k3ky/image/upload',
                { method: 'POST', body: formData }
            );

            if (!cloudinaryRes.ok) throw new Error('Upload to Cloudinary failed');
            const cloudinaryData = await cloudinaryRes.json();

            // Update profile with Cloudinary URL
            await api.updateProfile({ photoURL: cloudinaryData.secure_url });

            toast.success('Foto profil diupdate!', { id: toastId });
            window.location.reload();
        } catch (error) {
            console.error('Photo upload error:', error);
            toast.error('Gagal upload foto: ' + error.message, { id: toastId });
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

    const handleToggleVisibility = async (song) => {
        try {
            const result = await api.toggleSongVisibility(song.songId);
            toast.success(result.isPublic ? 'Lagu sekarang publik' : 'Lagu sekarang privat');
            loadData();
        } catch (error) {
            toast.error('Gagal mengubah visibilitas');
        }
        setMenuOpen(null);
    };

    const handleShareProfile = async () => {
        const profileUrl = `${window.location.origin}/@${user.username}`;
        const shareData = {
            title: `${user.name} di dcover`,
            text: `Cek profil ${user.name} di dcover! 🎵`,
            url: profileUrl
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
                toast.success('Link profil disalin!');
            }
        } catch (err) {
            console.error('Share error:', err);
        }
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
            if (type === 'songs') {
                // Convert to base64 for song cover
                const reader = new FileReader();
                reader.onloadend = async () => {
                    try {
                        await api.updateSongCover(id, reader.result);
                        toast.success('Cover diupdate');
                        loadData();
                    } catch (error) {
                        toast.error('Gagal update');
                    }
                };
                reader.readAsDataURL(file);
            } else {
                const formData = new FormData();
                formData.append('cover', file);
                await api.updateAlbumCover(id, formData);
                toast.success('Cover diupdate');
                loadData();
            }
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

    if (loading) return <div className="pb-player"><ProfileSkeleton /></div>;

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
                                <button onClick={handleShareProfile} className="p-2 text-[var(--color-text-secondary)] hover:text-white transition-colors">
                                    <Share2 className="w-5 h-5" />
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
                    <div className="flex items-center justify-center md:justify-start gap-4 mt-2">
                        <button
                            onClick={() => handleShowModal('followers')}
                            className="text-[var(--color-text-secondary)] hover:text-white transition-colors"
                        >
                            <strong className="text-white">{followersCount}</strong> Pengikut
                        </button>
                        <button
                            onClick={() => handleShowModal('following')}
                            className="text-[var(--color-text-secondary)] hover:text-white transition-colors"
                        >
                            <strong className="text-white">{followingCount}</strong> Mengikuti
                        </button>
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
                            const isPrivate = song.isPublic === false;
                            return (
                                <div key={song.songId} className={`group flex items-center gap-4 p-3 rounded-lg ${isCurrent ? 'bg-[var(--color-surface-active)]' : 'hover:bg-[var(--color-surface-hover)]'}`}>
                                    <div onClick={() => playSong(song, songs, index)} className="relative w-12 h-12 rounded overflow-hidden bg-[var(--color-surface-hover)] cursor-pointer flex-shrink-0">
                                        {cover ? <img src={`${API_URL}${cover}`} className="w-full h-full object-cover" /> : <Music2 className="w-5 h-5 text-[var(--color-text-muted)] m-auto" />}
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                            {isCurrent && isPlaying ? <Pause className="w-5 h-5" fill="currentColor" /> : <Play className="w-5 h-5" fill="currentColor" />}
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className={`font-medium truncate ${isCurrent ? 'text-[var(--color-primary)]' : ''}`}>{song.title}</p>
                                            {isPrivate && (
                                                <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded">
                                                    <EyeOff className="w-3 h-3" /> Privat
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-[var(--color-text-secondary)] truncate">Cover of {song.originalArtist}</p>
                                    </div>
                                    <span className="hidden sm:block text-[var(--color-text-secondary)]">{song.likes || 0} ❤️</span>
                                    <div className="relative">
                                        <button onClick={() => setMenuOpen(menuOpen === song.songId ? null : song.songId)} className="p-2"><MoreVertical className="w-5 h-5" /></button>
                                        {menuOpen === song.songId && (
                                            <div className="absolute right-0 top-full w-48 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-xl z-10">
                                                <button onClick={() => handleToggleVisibility(song)} className="flex items-center gap-3 w-full px-4 py-3 hover:bg-[var(--color-surface-hover)]">
                                                    {isPrivate ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                                    {isPrivate ? 'Jadikan Publik' : 'Jadikan Privat'}
                                                </button>
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

            {/* Followers/Following Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={() => setShowModal(null)}>
                    <div className="bg-[var(--color-surface)] rounded-xl w-full max-w-md max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <Users className="w-5 h-5 text-[var(--color-primary)]" />
                                {showModal === 'followers' ? 'Pengikut' : 'Mengikuti'}
                            </h3>
                            <button onClick={() => setShowModal(null)} className="p-2 hover:bg-[var(--color-surface-hover)] rounded-full">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="overflow-y-auto max-h-96 p-2">
                            {modalUsers.length === 0 ? (
                                <p className="text-center py-8 text-[var(--color-text-secondary)]">
                                    {showModal === 'followers' ? 'Belum ada pengikut' : 'Belum mengikuti siapapun'}
                                </p>
                            ) : (
                                modalUsers.map(u => (
                                    <Link
                                        key={u.id}
                                        to={`/user/${u.id}`}
                                        onClick={() => setShowModal(null)}
                                        className="flex items-center gap-3 p-3 hover:bg-[var(--color-surface-hover)] rounded-lg transition-colors"
                                    >
                                        {u.photoURL ? (
                                            <img src={u.photoURL} alt={u.name} className="w-12 h-12 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-[var(--color-surface-hover)] flex items-center justify-center">
                                                <span className="text-lg font-bold">{u.name?.charAt(0)}</span>
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{u.name}</p>
                                            <p className="text-sm text-[var(--color-text-secondary)]">{u.songCount} lagu</p>
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
