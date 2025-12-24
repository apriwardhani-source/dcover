import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import AudioRecorder from '../components/AudioRecorder';
import toast from 'react-hot-toast';
import { Upload as UploadIcon, Mic, Music2, FileAudio, Image, Check, ChevronRight, ChevronLeft, X, Disc, Loader2, FileText } from 'lucide-react';
import { API_URL } from '../config';

const STEPS = [
    { id: 1, title: 'Audio', desc: 'Upload atau rekam' },
    { id: 2, title: 'Info', desc: 'Detail lagu' },
    { id: 3, title: 'Album', desc: 'Pilih atau buat' },
    { id: 4, title: 'Cover', desc: 'Art cover' },
    { id: 5, title: 'Publish', desc: 'Selesai' }
];

const Upload = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const audioInputRef = useRef(null);
    const coverInputRef = useRef(null);
    const albumCoverInputRef = useRef(null);

    const [currentStep, setCurrentStep] = useState(1);
    const [uploading, setUploading] = useState(false);

    const [audioFile, setAudioFile] = useState(null);
    const [audioPreviewUrl, setAudioPreviewUrl] = useState(null);
    const [uploadMode, setUploadMode] = useState('upload');

    const [songTitle, setSongTitle] = useState('');
    const [originalArtist, setOriginalArtist] = useState('');
    const [lyrics, setLyrics] = useState('');

    const [albumOption, setAlbumOption] = useState('single');
    const [userAlbums, setUserAlbums] = useState([]);
    const [selectedAlbum, setSelectedAlbum] = useState(null);
    const [newAlbumTitle, setNewAlbumTitle] = useState('');
    const [newAlbumCover, setNewAlbumCover] = useState(null);
    const [newAlbumCoverPreview, setNewAlbumCoverPreview] = useState(null);

    const [coverImage, setCoverImage] = useState(null);
    const [coverPreview, setCoverPreview] = useState(null);

    useEffect(() => {
        if (user) {
            api.getUserAlbums(user.id).then(setUserAlbums).catch(console.error);
        }
    }, [user]);

    const handleAudioSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const fileName = file.name.toLowerCase();
        const isVideo = file.type.startsWith('video/') || ['.mp4', '.mov', '.webm', '.avi', '.mkv'].some(ext => fileName.endsWith(ext));
        const isAudio = file.type.startsWith('audio/') || ['.mp3', '.wav', '.m4a', '.aac', '.ogg'].some(ext => fileName.endsWith(ext));

        if (!isAudio && !isVideo) {
            toast.error('Format tidak didukung. Gunakan audio atau video.');
            return;
        }

        // Allow larger files for video (will be converted)
        const maxSize = isVideo ? 500 * 1024 * 1024 : 50 * 1024 * 1024;
        if (file.size > maxSize) {
            toast.error(`Ukuran file maksimal ${isVideo ? '500' : '50'}MB`);
            return;
        }

        if (isVideo) {
            // Extract audio from video
            toast.loading('Mengekstrak audio dari video...', { id: 'extract' });
            try {
                const audioBlob = await extractAudioFromVideo(file);
                const audioFile = new File([audioBlob], file.name.replace(/\.[^.]+$/, '.webm'), { type: 'audio/webm' });
                setAudioFile(audioFile);
                setAudioPreviewUrl(URL.createObjectURL(audioBlob));
                toast.success('Audio berhasil diekstrak!', { id: 'extract' });
            } catch (error) {
                console.error('Extract error:', error);
                toast.error('Gagal mengekstrak audio', { id: 'extract' });
            }
        } else {
            setAudioFile(file);
            setAudioPreviewUrl(URL.createObjectURL(file));
        }
    };

    // Extract audio from video using Web Audio API
    const extractAudioFromVideo = (videoFile) => {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            video.src = URL.createObjectURL(videoFile);
            video.muted = true;
            video.playbackRate = 16; // 16x speed for fast extraction

            video.onloadedmetadata = async () => {
                try {
                    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    const source = audioContext.createMediaElementSource(video);
                    const destination = audioContext.createMediaStreamDestination();
                    source.connect(destination);

                    const mediaRecorder = new MediaRecorder(destination.stream, { mimeType: 'audio/webm' });
                    const chunks = [];

                    mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
                    mediaRecorder.onstop = () => {
                        const blob = new Blob(chunks, { type: 'audio/webm' });
                        URL.revokeObjectURL(video.src);
                        audioContext.close();
                        resolve(blob);
                    };
                    mediaRecorder.onerror = reject;

                    mediaRecorder.start();
                    video.play();

                    // Stop when video ends
                    video.onended = () => mediaRecorder.stop();

                    // Timeout based on video duration / playback speed
                    const timeout = Math.max((video.duration / 16) * 1000 + 5000, 30000);
                    setTimeout(() => {
                        if (mediaRecorder.state === 'recording') {
                            video.pause();
                            mediaRecorder.stop();
                        }
                    }, timeout);
                } catch (err) {
                    reject(err);
                }
            };

            video.onerror = reject;
        });
    };

    const handleRecordingComplete = (file, url) => {
        setAudioFile(file);
        setAudioPreviewUrl(url);
        setUploadMode('upload');
    };

    const handleCoverSelect = (e, isAlbumCover = false) => {
        const file = e.target.files[0];
        if (!file || !file.type.startsWith('image/')) { toast.error('File harus gambar'); return; }
        if (file.size > 5 * 1024 * 1024) { toast.error('Max 5MB'); return; }
        const url = URL.createObjectURL(file);
        if (isAlbumCover) { setNewAlbumCover(file); setNewAlbumCoverPreview(url); }
        else { setCoverImage(file); setCoverPreview(url); }
    };

    const canProceed = () => {
        switch (currentStep) {
            case 1: return audioFile !== null;
            case 2: return songTitle.trim() !== '' && originalArtist.trim() !== '';
            case 3: return albumOption === 'new' ? newAlbumTitle.trim() !== '' : albumOption === 'existing' ? selectedAlbum !== null : true;
            default: return true;
        }
    };

    const nextStep = () => { if (canProceed() && currentStep < 5) setCurrentStep(currentStep + 1); };
    const prevStep = () => { if (currentStep > 1) setCurrentStep(currentStep - 1); };

    // Helper function to convert file to base64
    const fileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    };

    const handlePublish = async () => {
        if (!canProceed()) return;
        setUploading(true);
        try {
            let albumId = null;

            if (albumOption === 'new') {
                const albumResult = await api.createAlbum({
                    title: newAlbumTitle,
                    coverFile: newAlbumCover
                });
                albumId = albumResult.albumId;
            } else if (albumOption === 'existing' && selectedAlbum) {
                albumId = selectedAlbum.albumId;
            }

            // Send file objects directly - api.js will handle Cloudinary upload
            await api.uploadSong({
                title: songTitle,
                originalArtist: originalArtist,
                audioFile: audioFile,
                coverFile: coverImage,
                albumId: albumId,
                lyrics: lyrics.trim() || null
            });

            toast.success('Lagu berhasil dipublish! 🎉');
            navigate('/');
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Gagal mengupload: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto pb-player">
            <h1 className="text-2xl md:text-3xl font-bold mb-8">Upload Cover Baru</h1>

            <div className="flex items-center justify-between mb-8 overflow-x-auto no-scrollbar">
                {STEPS.map((step, idx) => (
                    <div key={step.id} className="flex items-center">
                        <div className="flex flex-col items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${currentStep > step.id ? 'bg-[var(--color-primary)] text-black' : currentStep === step.id ? 'bg-white text-black' : 'bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]'}`}>
                                {currentStep > step.id ? <Check className="w-5 h-5" /> : step.id}
                            </div>
                            <span className="text-xs mt-1 text-[var(--color-text-secondary)] hidden sm:block">{step.title}</span>
                        </div>
                        {idx < STEPS.length - 1 && <div className={`w-8 sm:w-12 h-0.5 mx-2 ${currentStep > step.id ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-surface-hover)]'}`} />}
                    </div>
                ))}
            </div>

            <div className="bg-[var(--color-surface)] rounded-xl p-6 mb-6 animate-fade-in">
                {currentStep === 1 && (
                    <div>
                        <h2 className="text-xl font-bold mb-2">Upload Audio Cover</h2>
                        <p className="text-[var(--color-text-secondary)] mb-6">Upload file atau rekam langsung</p>
                        <div className="flex gap-2 mb-6">
                            <button onClick={() => setUploadMode('upload')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg ${uploadMode === 'upload' ? 'bg-[var(--color-primary)] text-black' : 'bg-[var(--color-surface-hover)]'}`}><UploadIcon className="w-5 h-5" />Upload</button>
                            <button onClick={() => setUploadMode('record')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg ${uploadMode === 'record' ? 'bg-[var(--color-primary)] text-black' : 'bg-[var(--color-surface-hover)]'}`}><Mic className="w-5 h-5" />Record</button>
                        </div>
                        {uploadMode === 'upload' ? (
                            <>
                                <div onClick={() => audioInputRef.current?.click()} className="border-2 border-dashed border-[var(--color-border)] rounded-xl p-8 text-center cursor-pointer hover:border-[var(--color-primary)]">
                                    <FileAudio className="w-12 h-12 mx-auto mb-4 text-[var(--color-text-muted)]" />
                                    <p className="font-medium">Klik untuk upload</p>
                                    <p className="text-sm text-[var(--color-text-secondary)]">Audio/Video - MP3, M4A, MP4, MOV (max 500MB)</p>
                                </div>
                                <input ref={audioInputRef} type="file" accept="audio/*,video/*" onChange={handleAudioSelect} className="hidden" />
                                {audioFile && (
                                    <div className="mt-4 p-4 bg-[var(--color-surface-hover)] rounded-lg">
                                        <div className="flex items-center gap-3 mb-3">
                                            <Music2 className="w-8 h-8 text-[var(--color-primary)]" />
                                            <div className="flex-1 min-w-0"><p className="font-medium truncate">{audioFile.name}</p><p className="text-sm text-[var(--color-text-secondary)]">{(audioFile.size / 1024 / 1024).toFixed(2)} MB</p></div>
                                            <button onClick={() => { setAudioFile(null); setAudioPreviewUrl(null); }} className="p-2 text-[var(--color-text-secondary)] hover:text-red-500"><X className="w-5 h-5" /></button>
                                        </div>
                                        <audio src={audioPreviewUrl} controls className="w-full h-10" />
                                    </div>
                                )}
                            </>
                        ) : <AudioRecorder onRecordingComplete={handleRecordingComplete} />}
                    </div>
                )}

                {currentStep === 2 && (
                    <div>
                        <h2 className="text-xl font-bold mb-2">Informasi Lagu</h2>
                        <div className="space-y-4">
                            <div><label className="block text-sm font-medium mb-2">Judul Lagu</label><input type="text" value={songTitle} onChange={(e) => setSongTitle(e.target.value)} placeholder="Contoh: Photograph (Cover)" className="input" /></div>
                            <div><label className="block text-sm font-medium mb-2">Penyanyi Asli</label><input type="text" value={originalArtist} onChange={(e) => setOriginalArtist(e.target.value)} placeholder="Contoh: Ed Sheeran" className="input" /></div>
                            <div>
                                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                                    <FileText className="w-4 h-4" /> Lyrics (Opsional)
                                </label>
                                <textarea
                                    value={lyrics}
                                    onChange={(e) => setLyrics(e.target.value)}
                                    placeholder="Masukkan lirik lagu di sini...&#10;&#10;Baris pertama&#10;Baris kedua&#10;..."
                                    className="input resize-none"
                                    rows={6}
                                />
                                <p className="text-xs text-[var(--color-text-muted)] mt-1">Lirik akan ditampilkan saat lagu diputar</p>
                            </div>
                            <div className="p-4 bg-[var(--color-surface-hover)] rounded-lg">
                                <p className="text-sm text-[var(--color-text-secondary)]">Cover Artist: <span className="text-white font-medium">{user?.name}</span></p>
                            </div>
                        </div>
                    </div>
                )}

                {currentStep === 3 && (
                    <div>
                        <h2 className="text-xl font-bold mb-2">Pilih Album</h2>
                        <div className="space-y-3 mb-6">
                            {['single', 'new', 'existing'].map(opt => (
                                (opt !== 'existing' || userAlbums.length > 0) && (
                                    <label key={opt} className={`flex items-center gap-4 p-4 rounded-lg cursor-pointer ${albumOption === opt ? 'bg-[var(--color-primary)]/10 border border-[var(--color-primary)]' : 'bg-[var(--color-surface-hover)]'}`}>
                                        <input type="radio" name="albumOption" value={opt} checked={albumOption === opt} onChange={(e) => setAlbumOption(e.target.value)} className="hidden" />
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${albumOption === opt ? 'border-[var(--color-primary)]' : 'border-[var(--color-text-muted)]'}`}>
                                            {albumOption === opt && <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-primary)]" />}
                                        </div>
                                        <div><p className="font-medium">{opt === 'single' ? 'Single' : opt === 'new' ? 'Buat Album Baru' : 'Album Yang Ada'}</p></div>
                                    </label>
                                )
                            ))}
                        </div>
                        {albumOption === 'new' && (
                            <div className="space-y-4 p-4 bg-[var(--color-surface-hover)] rounded-lg">
                                <div><label className="block text-sm font-medium mb-2">Nama Album</label><input type="text" value={newAlbumTitle} onChange={(e) => setNewAlbumTitle(e.target.value)} placeholder="My Cover Collection" className="input" /></div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Cover Album</label>
                                    <div onClick={() => albumCoverInputRef.current?.click()} className="border-2 border-dashed border-[var(--color-border)] rounded-lg p-4 text-center cursor-pointer">
                                        {newAlbumCoverPreview ? <img src={newAlbumCoverPreview} className="w-32 h-32 mx-auto object-cover rounded-lg" /> : <><Image className="w-8 h-8 mx-auto mb-2 text-[var(--color-text-muted)]" /><p className="text-sm">Upload</p></>}
                                    </div>
                                    <input ref={albumCoverInputRef} type="file" accept="image/*" onChange={(e) => handleCoverSelect(e, true)} className="hidden" />
                                </div>
                            </div>
                        )}
                        {albumOption === 'existing' && userAlbums.length > 0 && (
                            <div className="grid grid-cols-2 gap-3">
                                {userAlbums.map(album => (
                                    <button key={album.albumId} onClick={() => setSelectedAlbum(album)} className={`p-3 rounded-lg text-left ${selectedAlbum?.albumId === album.albumId ? 'bg-[var(--color-primary)]/10 border border-[var(--color-primary)]' : 'bg-[var(--color-surface-hover)]'}`}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded overflow-hidden bg-[var(--color-surface-active)]">
                                                {album.coverImage ? <img src={`${API_URL}${album.coverImage}`} className="w-full h-full object-cover" /> : <Disc className="w-6 h-6 text-[var(--color-text-muted)] m-auto mt-3" />}
                                            </div>
                                            <p className="font-medium truncate">{album.title}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {currentStep === 4 && (
                    <div>
                        <h2 className="text-xl font-bold mb-2">Cover Art (Opsional)</h2>
                        <div onClick={() => coverInputRef.current?.click()} className="border-2 border-dashed border-[var(--color-border)] rounded-xl p-8 text-center cursor-pointer hover:border-[var(--color-primary)]">
                            {coverPreview ? <img src={coverPreview} className="w-48 h-48 mx-auto object-cover rounded-lg shadow-xl" /> : <><Image className="w-12 h-12 mx-auto mb-4 text-[var(--color-text-muted)]" /><p className="font-medium">Klik untuk upload</p></>}
                        </div>
                        <input ref={coverInputRef} type="file" accept="image/*" onChange={(e) => handleCoverSelect(e, false)} className="hidden" />
                    </div>
                )}

                {currentStep === 5 && (
                    <div>
                        <h2 className="text-xl font-bold mb-2">Review & Publish</h2>
                        <div className="bg-[var(--color-surface-hover)] rounded-lg p-4 mb-6">
                            <div className="flex gap-4">
                                <div className="w-24 h-24 rounded-lg overflow-hidden bg-[var(--color-surface-active)] flex items-center justify-center">
                                    {coverPreview || newAlbumCoverPreview || selectedAlbum?.coverImage ? <img src={coverPreview || newAlbumCoverPreview || `${API_URL}${selectedAlbum?.coverImage}`} className="w-full h-full object-cover" /> : <Music2 className="w-10 h-10 text-[var(--color-text-muted)]" />}
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-lg font-bold truncate">{songTitle}</h3>
                                    <p className="text-[var(--color-text-secondary)]">Cover by {user?.name}</p>
                                    <p className="text-sm text-[var(--color-text-muted)]">Original: {originalArtist}</p>
                                    {albumOption !== 'single' && <p className="text-sm text-[var(--color-primary)] mt-1">📀 {albumOption === 'new' ? newAlbumTitle : selectedAlbum?.title}</p>}
                                    {lyrics.trim() && <p className="text-sm text-[var(--color-primary)] mt-1">📝 Lyrics included</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex gap-3">
                {currentStep > 1 && <button onClick={prevStep} disabled={uploading} className="btn btn-secondary flex-1"><ChevronLeft className="w-5 h-5" />Kembali</button>}
                {currentStep < 5 ? (
                    <button onClick={nextStep} disabled={!canProceed()} className={`btn btn-primary flex-1 ${!canProceed() ? 'opacity-50' : ''}`}>Lanjut<ChevronRight className="w-5 h-5" /></button>
                ) : (
                    <button onClick={handlePublish} disabled={uploading} className="btn btn-primary flex-1">
                        {uploading ? <><Loader2 className="w-5 h-5 animate-spin" />Uploading...</> : <><Check className="w-5 h-5" />Publish</>}
                    </button>
                )}
            </div>
        </div>
    );
};

export default Upload;
