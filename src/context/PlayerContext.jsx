import { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { extractDominantColor, applyDynamicGradient, resetGradient } from '../utils/colorExtractor';

const PlayerContext = createContext({});

export const usePlayer = () => useContext(PlayerContext);

export const PlayerProvider = ({ children }) => {
    const audioRef = useRef(new Audio());
    const [currentSong, setCurrentSong] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [queue, setQueue] = useState([]);
    const [queueIndex, setQueueIndex] = useState(0);
    const [shuffle, setShuffle] = useState(false);
    const [repeat, setRepeat] = useState('off'); // 'off', 'all', 'one'
    const [showQueue, setShowQueue] = useState(false);

    useEffect(() => {
        const audio = audioRef.current;

        const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
        const handleDurationChange = () => setDuration(audio.duration || 0);
        const handleEnded = () => {
            if (repeat === 'one') {
                audio.currentTime = 0;
                audio.play();
            } else {
                playNext();
            }
        };
        const handleError = (e) => {
            console.error('Audio error:', e);
            setIsPlaying(false);
        };

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('durationchange', handleDurationChange);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('error', handleError);

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('durationchange', handleDurationChange);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('error', handleError);
        };
    }, [repeat]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Ignore if typing in input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            switch (e.code) {
                case 'Space':
                    e.preventDefault();
                    togglePlay();
                    break;
                case 'ArrowRight':
                    if (e.shiftKey) playNext();
                    else seekTo(Math.min(currentTime + 10, duration));
                    break;
                case 'ArrowLeft':
                    if (e.shiftKey) playPrevious();
                    else seekTo(Math.max(currentTime - 10, 0));
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setVolumeLevel(Math.min(volume + 0.1, 1));
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    setVolumeLevel(Math.max(volume - 0.1, 0));
                    break;
                case 'KeyM':
                    setVolumeLevel(volume === 0 ? 1 : 0);
                    break;
                case 'KeyS':
                    toggleShuffle();
                    break;
                case 'KeyR':
                    toggleRepeat();
                    break;
                case 'KeyQ':
                    setShowQueue(prev => !prev);
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentTime, duration, volume, isPlaying]);

    useEffect(() => {
        audioRef.current.volume = volume;
    }, [volume]);

    const playSong = async (song, songList = null, index = 0) => {
        const audio = audioRef.current;
        const { API_URL } = await import('../config');

        if (songList) {
            setQueue(songList);
            setQueueIndex(index);
        }

        if (currentSong?.songId === song.songId && audio.src) {
            if (isPlaying) {
                audio.pause();
                setIsPlaying(false);
            } else {
                await audio.play();
                setIsPlaying(true);
            }
        } else {
            let audioUrl = song.audioUrl;
            if (audioUrl && !audioUrl.startsWith('http') && !audioUrl.startsWith('blob:')) {
                audioUrl = `${API_URL}${audioUrl}`;
            }

            setCurrentSong(song);

            // Extract dominant color from cover art
            const coverUrl = song.coverImage || song.albumCover;
            if (coverUrl) {
                const fullCoverUrl = coverUrl.startsWith('http') ? coverUrl : `${API_URL}${coverUrl}`;
                extractDominantColor(fullCoverUrl).then(color => {
                    applyDynamicGradient(color);
                });
            } else {
                resetGradient();
            }

            audio.src = audioUrl;
            audio.load();
            try {
                await audio.play();
                setIsPlaying(true);

                // Track play count
                try {
                    const api = (await import('../services/api')).default;
                    api.playSong(song.songId);
                } catch (e) {
                    // Ignore tracking errors
                }
            } catch (error) {
                console.error('Play error:', error);
                setIsPlaying(false);
            }
        }
    };

    const togglePlay = async () => {
        const audio = audioRef.current;
        if (isPlaying) {
            audio.pause();
            setIsPlaying(false);
        } else if (currentSong) {
            try {
                await audio.play();
                setIsPlaying(true);
            } catch (error) {
                console.error('Play error:', error);
            }
        }
    };

    const seekTo = (time) => {
        audioRef.current.currentTime = time;
        setCurrentTime(time);
    };

    const playNext = () => {
        if (queue.length === 0) return;

        let nextIndex;
        if (shuffle) {
            nextIndex = Math.floor(Math.random() * queue.length);
        } else {
            nextIndex = (queueIndex + 1) % queue.length;
        }

        // If repeat is off and we've reached the end, stop
        if (repeat === 'off' && nextIndex === 0 && queueIndex === queue.length - 1) {
            setIsPlaying(false);
            return;
        }

        setQueueIndex(nextIndex);
        playSong(queue[nextIndex], null, nextIndex);
    };

    const playPrevious = () => {
        if (queue.length === 0) return;

        if (currentTime > 3) {
            seekTo(0);
            return;
        }

        const prevIndex = queueIndex === 0 ? queue.length - 1 : queueIndex - 1;
        setQueueIndex(prevIndex);
        playSong(queue[prevIndex], null, prevIndex);
    };

    const setVolumeLevel = (level) => {
        const clampedLevel = Math.max(0, Math.min(1, level));
        setVolume(clampedLevel);
        audioRef.current.volume = clampedLevel;
    };

    const toggleShuffle = () => setShuffle(prev => !prev);

    const toggleRepeat = () => {
        setRepeat(prev => {
            if (prev === 'off') return 'all';
            if (prev === 'all') return 'one';
            return 'off';
        });
    };

    const playFromQueue = (index) => {
        if (index >= 0 && index < queue.length) {
            setQueueIndex(index);
            playSong(queue[index], null, index);
        }
    };

    const removeFromQueue = (index) => {
        if (index < 0 || index >= queue.length) return;

        const newQueue = queue.filter((_, i) => i !== index);
        setQueue(newQueue);

        if (index < queueIndex) {
            setQueueIndex(prev => prev - 1);
        } else if (index === queueIndex && newQueue.length > 0) {
            const newIndex = Math.min(queueIndex, newQueue.length - 1);
            setQueueIndex(newIndex);
            playSong(newQueue[newIndex], null, newIndex);
        }
    };

    const value = {
        currentSong,
        isPlaying,
        currentTime,
        duration,
        volume,
        queue,
        queueIndex,
        shuffle,
        repeat,
        showQueue,
        playSong,
        togglePlay,
        seekTo,
        playNext,
        playPrevious,
        setVolumeLevel,
        toggleShuffle,
        toggleRepeat,
        setShowQueue,
        playFromQueue,
        removeFromQueue
    };

    return (
        <PlayerContext.Provider value={value}>
            {children}
        </PlayerContext.Provider>
    );
};
