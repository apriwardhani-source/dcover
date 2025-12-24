import { useState } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, ChevronUp, ChevronDown, Music2, Shuffle, Repeat, Repeat1, ListMusic, X, Share2, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

import { API_URL } from '../config';
import { getImageUrl } from '../utils/url';

const MusicPlayer = () => {
    const {
        currentSong, isPlaying, currentTime, duration, volume,
        queue, queueIndex, shuffle, repeat, showQueue,
        togglePlay, playNext, playPrevious, seekTo, setVolumeLevel,
        toggleShuffle, toggleRepeat, setShowQueue, playFromQueue, removeFromQueue
    } = usePlayer();
    const [expanded, setExpanded] = useState(false);
    const [showLyrics, setShowLyrics] = useState(false);

    if (!currentSong) return null;

    const formatTime = (s) => {
        if (!s || isNaN(s) || !isFinite(s) || s < 0) return '0:00';
        return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
    };
    const progress = (duration > 0 && isFinite(duration)) ? (currentTime / duration) * 100 : 0;

    const getCoverImage = () => {
        return getImageUrl(currentSong.coverImage || currentSong.albumCover, null);
    };

    const handleShare = async () => {
        const songUrl = `${window.location.origin}${getSongUrl(currentSong)}`;
        const shareData = {
            title: currentSong.title,
            text: `Dengarkan "${currentSong.title}" cover by ${currentSong.coverArtist} di dcover! 🎵`,
            url: songUrl
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
                toast.success('Link lagu disalin!');
            }
        } catch (err) {
            console.error('Share error:', err);
        }
    };

    return (
        <>
            {/* Queue Panel */}
            {showQueue && (
                <div className="fixed right-0 top-0 bottom-20 md:bottom-24 w-80 bg-[var(--color-surface)] border-l border-[var(--color-border)] z-50 flex flex-col animate-slide-up">
                    <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
                        <h3 className="font-bold flex items-center gap-2"><ListMusic className="w-5 h-5" /> Queue</h3>
                        <button onClick={() => setShowQueue(false)} className="p-2 text-[var(--color-text-secondary)]"><X className="w-5 h-5" /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {queue.map((song, index) => (
                            <div key={`${song.songId}-${index}`} onClick={() => playFromQueue(index)}
                                className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-[var(--color-surface-hover)] ${index === queueIndex ? 'bg-[var(--color-surface-hover)]' : ''}`}>
                                <span className="text-sm text-[var(--color-text-muted)] w-6">{index + 1}</span>
                                <div className="w-10 h-10 rounded overflow-hidden bg-[var(--color-surface-hover)]">
                                    {(song.coverImage || song.albumCover) ? (
                                        <img src={getImageUrl(song.coverImage || song.albumCover)} className="w-full h-full object-cover" />
                                    ) : <div className="w-full h-full flex items-center justify-center"><Music2 className="w-4 h-4 text-[var(--color-text-muted)]" /></div>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium truncate ${index === queueIndex ? 'text-[var(--color-primary)]' : ''}`}>{song.title}</p>
                                    <p className="text-xs text-[var(--color-text-secondary)] truncate">{song.coverArtist}</p>
                                </div>
                                {index !== queueIndex && (
                                    <button onClick={(e) => { e.stopPropagation(); removeFromQueue(index); }} className="p-1 text-[var(--color-text-muted)]">
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                        {queue.length === 0 && <p className="text-center text-[var(--color-text-secondary)] py-8">Queue kosong</p>}
                    </div>
                </div>
            )}

            {/* Lyrics Panel (Desktop) */}
            {showLyrics && !expanded && (
                <div className="fixed right-0 top-0 bottom-20 md:bottom-24 w-96 bg-[var(--color-surface)] border-l border-[var(--color-border)] z-50 flex flex-col animate-slide-up">
                    <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
                        <h3 className="font-bold flex items-center gap-2"><FileText className="w-5 h-5" /> Lyrics</h3>
                        <button onClick={() => setShowLyrics(false)} className="p-2 text-[var(--color-text-secondary)]"><X className="w-5 h-5" /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6">
                        <div className="mb-4">
                            <h4 className="font-bold text-lg">{currentSong.title}</h4>
                            <p className="text-sm text-[var(--color-text-secondary)]">Cover by {currentSong.coverArtist}</p>
                        </div>
                        {currentSong.lyrics ? (
                            <pre className="whitespace-pre-wrap text-[var(--color-text-secondary)] font-sans leading-relaxed">{currentSong.lyrics}</pre>
                        ) : (
                            <div className="text-center py-12">
                                <FileText className="w-12 h-12 mx-auto text-[var(--color-text-muted)] mb-4" />
                                <p className="text-[var(--color-text-secondary)]">Lirik tidak tersedia</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Mobile Expanded Player */}
            {expanded && (
                <div className="md:hidden fixed inset-0 bg-[var(--color-surface)] z-[90] flex flex-col animate-slide-up overflow-hidden safe-top safe-bottom">
                    <div className="flex items-center justify-between p-4">
                        <button onClick={() => setExpanded(false)} className="p-2 text-[var(--color-text-secondary)]"><ChevronDown className="w-6 h-6" /></button>
                        <span className="text-sm font-medium text-[var(--color-text-secondary)]">Now Playing</span>
                        <button onClick={handleShare} className="p-2 text-[var(--color-text-secondary)]"><Share2 className="w-5 h-5" /></button>
                    </div>

                    {showLyrics ? (
                        /* Lyrics View */
                        <div className="flex-1 overflow-y-auto px-6 pb-4">
                            <div className="sticky top-0 bg-[var(--color-surface)] py-4 mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-lg overflow-hidden shadow-lg flex-shrink-0">
                                        {getCoverImage() ? <img src={getCoverImage()} alt={currentSong.title} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-[var(--color-surface-hover)] flex items-center justify-center"><Music2 className="w-8 h-8 text-[var(--color-text-muted)]" /></div>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h2 className="font-bold truncate">{currentSong.title}</h2>
                                        <p className="text-sm text-[var(--color-text-secondary)] truncate">{currentSong.coverArtist}</p>
                                    </div>
                                </div>
                            </div>
                            {currentSong.lyrics ? (
                                <pre className="whitespace-pre-wrap text-[var(--color-text-secondary)] font-sans leading-loose text-center">{currentSong.lyrics}</pre>
                            ) : (
                                <div className="text-center py-12">
                                    <FileText className="w-16 h-16 mx-auto text-[var(--color-text-muted)] mb-4" />
                                    <p className="text-[var(--color-text-secondary)]">Lirik tidak tersedia</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Album Art View */
                        <div className="flex-1 flex items-center justify-center px-8">
                            <div className="w-full max-w-[300px] aspect-square rounded-lg overflow-hidden shadow-2xl">
                                {getCoverImage() ? <img src={getCoverImage()} alt={currentSong.title} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-[var(--color-surface-hover)] flex items-center justify-center"><Music2 className="w-24 h-24 text-[var(--color-text-muted)]" /></div>}
                            </div>
                        </div>
                    )}

                    <div className="px-8 py-4 text-center">
                        <h2 className="text-xl font-bold truncate">{currentSong.title}</h2>
                        <p className="text-[var(--color-text-secondary)] truncate">{currentSong.coverArtist} • Cover of {currentSong.originalArtist}</p>
                    </div>
                    <div className="px-8 pb-4">
                        <input type="range" min="0" max={duration || 100} value={currentTime} onChange={(e) => seekTo(Number(e.target.value))} className="w-full h-1" style={{ background: `linear-gradient(to right, var(--color-primary) ${progress}%, var(--color-surface-active) ${progress}%)` }} />
                        <div className="flex justify-between mt-2 text-xs text-[var(--color-text-secondary)]"><span>{formatTime(currentTime)}</span><span>{formatTime(duration)}</span></div>
                    </div>
                    <div className="flex items-center justify-center gap-6 pb-4">
                        <button onClick={toggleShuffle} className={`p-2 ${shuffle ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)]'}`}><Shuffle className="w-5 h-5" /></button>
                        <button onClick={playPrevious} className="p-3 text-white"><SkipBack className="w-8 h-8" fill="currentColor" /></button>
                        <button onClick={togglePlay} className="p-4 bg-[var(--color-primary)] rounded-full text-black">
                            {isPlaying ? <Pause className="w-8 h-8" fill="currentColor" /> : <Play className="w-8 h-8 ml-1" fill="currentColor" />}
                        </button>
                        <button onClick={playNext} className="p-3 text-white"><SkipForward className="w-8 h-8" fill="currentColor" /></button>
                        <button onClick={toggleRepeat} className={`p-2 ${repeat !== 'off' ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)]'}`}>
                            {repeat === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
                        </button>
                    </div>
                    <div className="flex items-center justify-center gap-6 pb-8">
                        <button onClick={() => setShowLyrics(!showLyrics)} className={`p-3 ${showLyrics ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)]'}`}><FileText className="w-5 h-5" /></button>
                        <button onClick={() => setShowQueue(true)} className="p-3 text-[var(--color-text-secondary)]"><ListMusic className="w-5 h-5" /></button>
                    </div>
                </div>
            )}

            {/* Fixed Bottom Player */}
            <div className="fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom))] md:bottom-0 left-0 right-0 md:left-64 h-20 md:h-24 bg-[var(--color-surface)] border-t border-[var(--color-border)] z-40 px-4 flex items-center">
                <div className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer md:cursor-default" onClick={() => setExpanded(true)}>
                    <div className="w-14 h-14 rounded-md overflow-hidden flex-shrink-0 shadow-lg">
                        {getCoverImage() ? <img src={getCoverImage()} alt={currentSong.title} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-[var(--color-surface-hover)] flex items-center justify-center"><Music2 className="w-6 h-6 text-[var(--color-text-muted)]" /></div>}
                    </div>
                    <div className="min-w-0 hidden sm:block"><p className="font-medium truncate">{currentSong.title}</p><p className="text-sm text-[var(--color-text-secondary)] truncate">{currentSong.coverArtist}</p></div>
                    <button className="md:hidden p-2 text-[var(--color-text-secondary)]"><ChevronUp className="w-5 h-5" /></button>
                </div>

                <div className="hidden md:flex flex-col items-center gap-2 flex-1">
                    <div className="flex items-center gap-4">
                        <button onClick={toggleShuffle} className={`p-2 ${shuffle ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)] hover:text-white'}`} title="Shuffle (S)"><Shuffle className="w-4 h-4" /></button>
                        <button onClick={playPrevious} className="p-2 text-[var(--color-text-secondary)] hover:text-white" title="Previous (Shift+←)"><SkipBack className="w-5 h-5" /></button>
                        <button onClick={togglePlay} className="p-2 bg-[var(--color-primary)] rounded-full text-black" title="Play/Pause (Space)">
                            {isPlaying ? <Pause className="w-5 h-5" fill="currentColor" /> : <Play className="w-5 h-5" fill="currentColor" />}
                        </button>
                        <button onClick={playNext} className="p-2 text-[var(--color-text-secondary)] hover:text-white" title="Next (Shift+→)"><SkipForward className="w-5 h-5" /></button>
                        <button onClick={toggleRepeat} className={`p-2 ${repeat !== 'off' ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)] hover:text-white'}`} title="Repeat (R)">
                            {repeat === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
                        </button>
                    </div>
                    <div className="flex items-center gap-2 w-full max-w-md">
                        <span className="text-xs text-[var(--color-text-secondary)] w-10 text-right">{formatTime(currentTime)}</span>
                        <input type="range" min="0" max={duration || 100} value={currentTime} onChange={(e) => seekTo(Number(e.target.value))} className="flex-1 h-1" style={{ background: `linear-gradient(to right, var(--color-primary) ${progress}%, var(--color-surface-active) ${progress}%)` }} />
                        <span className="text-xs text-[var(--color-text-secondary)] w-10">{formatTime(duration)}</span>
                    </div>
                </div>

                <div className="md:hidden">
                    <button onClick={(e) => { e.stopPropagation(); togglePlay(); }} className="p-3 bg-[var(--color-primary)] rounded-full text-black">
                        {isPlaying ? <Pause className="w-5 h-5" fill="currentColor" /> : <Play className="w-5 h-5" fill="currentColor" />}
                    </button>
                </div>

                <div className="hidden md:flex items-center gap-2 flex-1 justify-end">
                    <button onClick={() => { setShowLyrics(!showLyrics); setShowQueue(false); }} className={`p-2 ${showLyrics ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)] hover:text-white'}`} title="Lyrics (L)"><FileText className="w-5 h-5" /></button>
                    <button onClick={() => { setShowQueue(!showQueue); setShowLyrics(false); }} className={`p-2 ${showQueue ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)] hover:text-white'}`} title="Queue (Q)"><ListMusic className="w-5 h-5" /></button>
                    <button onClick={handleShare} className="p-2 text-[var(--color-text-secondary)] hover:text-white" title="Share"><Share2 className="w-5 h-5" /></button>
                    <button onClick={() => setVolumeLevel(volume === 0 ? 1 : 0)} className="p-2 text-[var(--color-text-secondary)] hover:text-white" title="Mute (M)">{volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}</button>
                    <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => setVolumeLevel(Number(e.target.value))} className="w-24 h-1" style={{ background: `linear-gradient(to right, var(--color-text-secondary) ${volume * 100}%, var(--color-surface-active) ${volume * 100}%)` }} title="Volume (↑/↓)" />
                </div>
            </div>
        </>
    );
};

export default MusicPlayer;
