import { useState, useRef } from 'react';
import { Mic, Square, Play, Pause, Trash2, Upload, Loader2 } from 'lucide-react';

const AudioRecorder = ({ onRecordingComplete }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [recordedBlob, setRecordedBlob] = useState(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioUrl, setAudioUrl] = useState(null);

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const timerRef = useRef(null);
    const audioRef = useRef(null);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const url = URL.createObjectURL(audioBlob);
                setRecordedBlob(audioBlob);
                setAudioUrl(url);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start(1000);
            setIsRecording(true);
            setIsPaused(false);
            setRecordingTime(0);

            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } catch (error) {
            console.error('Error starting recording:', error);
            alert('Tidak dapat mengakses mikrofon. Pastikan Anda memberikan izin.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setIsPaused(false);
            clearInterval(timerRef.current);
        }
    };

    const pauseRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            if (isPaused) {
                mediaRecorderRef.current.resume();
                timerRef.current = setInterval(() => {
                    setRecordingTime(prev => prev + 1);
                }, 1000);
            } else {
                mediaRecorderRef.current.pause();
                clearInterval(timerRef.current);
            }
            setIsPaused(!isPaused);
        }
    };

    const discardRecording = () => {
        if (audioUrl) {
            URL.revokeObjectURL(audioUrl);
        }
        setRecordedBlob(null);
        setAudioUrl(null);
        setRecordingTime(0);
    };

    const useRecording = () => {
        if (recordedBlob) {
            // Convert blob to file
            const file = new File([recordedBlob], `recording-${Date.now()}.webm`, {
                type: 'audio/webm'
            });
            onRecordingComplete(file, audioUrl);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="bg-[var(--color-surface)] rounded-xl p-6 border border-[var(--color-border)]">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Mic className="w-5 h-5 text-[var(--color-primary)]" />
                Record Audio
            </h3>

            {/* Recording Visualizer */}
            {isRecording && (
                <div className="flex items-center justify-center gap-1 h-16 mb-4">
                    {[...Array(20)].map((_, i) => (
                        <div
                            key={i}
                            className="w-1 bg-[var(--color-primary)] rounded-full animate-pulse"
                            style={{
                                height: `${Math.random() * 40 + 10}px`,
                                animationDelay: `${i * 0.05}s`
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Timer */}
            {(isRecording || recordedBlob) && (
                <div className="text-center text-2xl font-mono mb-4 text-[var(--color-primary)]">
                    {formatTime(recordingTime)}
                </div>
            )}

            {/* Audio Preview */}
            {audioUrl && !isRecording && (
                <div className="mb-4">
                    <audio
                        ref={audioRef}
                        src={audioUrl}
                        controls
                        className="w-full h-12 rounded-lg"
                    />
                </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
                {!isRecording && !recordedBlob && (
                    <button
                        onClick={startRecording}
                        className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                    >
                        <Mic className="w-5 h-5" />
                        Mulai Rekam
                    </button>
                )}

                {isRecording && (
                    <>
                        <button
                            onClick={pauseRecording}
                            className="p-3 bg-[var(--color-surface-hover)] hover:bg-[var(--color-surface-active)] rounded-full transition-colors"
                        >
                            {isPaused ? (
                                <Play className="w-5 h-5" />
                            ) : (
                                <Pause className="w-5 h-5" />
                            )}
                        </button>
                        <button
                            onClick={stopRecording}
                            className="p-4 bg-red-500 hover:bg-red-600 rounded-full transition-colors"
                        >
                            <Square className="w-5 h-5" fill="currentColor" />
                        </button>
                    </>
                )}

                {recordedBlob && !isRecording && (
                    <>
                        <button
                            onClick={discardRecording}
                            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-surface-hover)] hover:bg-[var(--color-surface-active)] rounded-full transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                            Buang
                        </button>
                        <button
                            onClick={startRecording}
                            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-surface-hover)] hover:bg-[var(--color-surface-active)] rounded-full transition-colors"
                        >
                            <Mic className="w-4 h-4" />
                            Rekam Ulang
                        </button>
                        <button
                            onClick={useRecording}
                            className="flex items-center gap-2 px-6 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-black rounded-full transition-colors font-semibold"
                        >
                            <Upload className="w-4 h-4" />
                            Gunakan
                        </button>
                    </>
                )}
            </div>

            <p className="text-center text-sm text-[var(--color-text-secondary)] mt-4">
                {isRecording
                    ? 'Recording... Tekan tombol Stop untuk berhenti'
                    : recordedBlob
                        ? 'Preview rekaman Anda, atau rekam ulang'
                        : 'Tekan tombol untuk mulai merekam cover Anda'}
            </p>
        </div>
    );
};

export default AudioRecorder;
