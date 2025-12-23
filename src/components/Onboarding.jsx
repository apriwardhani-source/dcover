import { useState, useEffect } from 'react';
import { Upload, Music2, Heart, Users, Play, X, ChevronRight, ChevronLeft } from 'lucide-react';

const ONBOARDING_KEY = 'dcover_onboarding_completed';

const slides = [
    {
        icon: Music2,
        title: 'Selamat Datang di dcover! 🎵',
        description: 'Platform untuk cover artist berbagi karya musik mereka.',
        color: 'bg-gradient-to-br from-teal-500 to-emerald-600'
    },
    {
        icon: Upload,
        title: 'Upload Cover Kamu',
        description: 'Rekam atau upload cover lagu favoritmu dan bagikan ke dunia!',
        color: 'bg-gradient-to-br from-purple-500 to-pink-600'
    },
    {
        icon: Heart,
        title: 'Temukan & Sukai',
        description: 'Dengarkan cover dari artist lain dan beri like pada favoritmu.',
        color: 'bg-gradient-to-br from-orange-500 to-red-600'
    },
    {
        icon: Users,
        title: 'Bangun Komunitas',
        description: 'Follow artist lain, tinggalkan komentar, dan terhubung dengan sesama pecinta musik.',
        color: 'bg-gradient-to-br from-blue-500 to-indigo-600'
    },
    {
        icon: Play,
        title: 'Siap Mulai?',
        description: 'Ayo eksplorasi dan mulai perjalanan musikmu di dcover!',
        color: 'bg-gradient-to-br from-teal-500 to-cyan-600'
    }
];

const Onboarding = ({ onComplete }) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const completed = localStorage.getItem(ONBOARDING_KEY);
        if (!completed) {
            setIsVisible(true);
        }
    }, []);

    const handleNext = () => {
        if (currentSlide < slides.length - 1) {
            setCurrentSlide(currentSlide + 1);
        } else {
            handleComplete();
        }
    };

    const handlePrev = () => {
        if (currentSlide > 0) {
            setCurrentSlide(currentSlide - 1);
        }
    };

    const handleComplete = () => {
        localStorage.setItem(ONBOARDING_KEY, 'true');
        setIsVisible(false);
        onComplete?.();
    };

    const handleSkip = () => {
        handleComplete();
    };

    if (!isVisible) return null;

    const slide = slides[currentSlide];
    const Icon = slide.icon;

    return (
        <div className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-4">
            <div className="bg-[var(--color-surface)] rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-fade-in">
                {/* Header */}
                <div className={`${slide.color} p-8 text-center relative`}>
                    <button onClick={handleSkip} className="absolute top-4 right-4 p-2 text-white/70 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                    <div className="w-20 h-20 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-4">
                        <Icon className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">{slide.title}</h2>
                    <p className="text-white/80">{slide.description}</p>
                </div>

                {/* Progress dots */}
                <div className="flex justify-center gap-2 py-4">
                    {slides.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentSlide(index)}
                            className={`w-2 h-2 rounded-full transition-all ${index === currentSlide ? 'w-6 bg-[var(--color-primary)]' : 'bg-[var(--color-surface-hover)]'}`}
                        />
                    ))}
                </div>

                {/* Actions */}
                <div className="flex gap-3 p-4">
                    {currentSlide > 0 && (
                        <button onClick={handlePrev} className="btn btn-secondary flex-1">
                            <ChevronLeft className="w-5 h-5" /> Kembali
                        </button>
                    )}
                    <button onClick={handleNext} className="btn btn-primary flex-1">
                        {currentSlide === slides.length - 1 ? (
                            <>Mulai</>
                        ) : (
                            <>Lanjut <ChevronRight className="w-5 h-5" /></>
                        )}
                    </button>
                </div>

                {/* Skip link */}
                {currentSlide < slides.length - 1 && (
                    <div className="text-center pb-4">
                        <button onClick={handleSkip} className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]">
                            Lewati tutorial
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Onboarding;
