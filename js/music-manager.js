// Global Music Manager
// This ensures only one music track plays at a time across all pages

class MusicManager {
    constructor() {
        console.log('MusicManager constructor called');
        this.currentMusic = null;
        this.isMuted = false;
        this.currentPage = '';
        this.init();
    }

    init() {
        // Check saved state
        this.isMuted = localStorage.getItem('musicMuted') === 'true';
        this.currentPage = localStorage.getItem('currentPage') || '';
        this.currentMusic = localStorage.getItem('currentMusic') || 'none';

        // Stop any existing music when page loads
        this.stopAllMusic();

        // Listen for page unload to stop music
        window.addEventListener('beforeunload', () => {
            this.stopAllMusic();
        });
    }

    stopAllMusic() {
        const allAudioElements = document.querySelectorAll('audio');
        allAudioElements.forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
        });
        this.currentMusic = 'none';
        localStorage.setItem('currentMusic', 'none');
    }

    playMusic(pageType) {
        if (this.isMuted) return;

        this.stopAllMusic();

        const bgMusic = document.getElementById('bg-music');
        const battleMusic = document.getElementById('battle-music');

        if (!bgMusic || !battleMusic) return;

        let targetMusic;
        let musicType;

        if (pageType === 'battle') {
            targetMusic = battleMusic;
            musicType = 'battle';
        } else {
            // index, collection, display all use background music
            targetMusic = bgMusic;
            musicType = 'background';
        }

        this.currentMusic = musicType;
        localStorage.setItem('currentMusic', this.currentMusic);
        localStorage.setItem('currentPage', pageType);

        const playPromise = targetMusic.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                console.log(`${pageType} music (${musicType}) started successfully`);
            }).catch(error => {
                console.log(`Audio autoplay blocked for ${pageType}, waiting for user interaction`);
                // Add click listener to start music on user interaction
                document.addEventListener('click', () => {
                    if (localStorage.getItem('currentPage') === pageType && !this.isMuted) {
                        targetMusic.play().catch(e => console.log('Failed to start music:', e));
                    }
                }, { once: true });
            });
        }
    }

    toggleMute() {
        console.log('toggleMute called, current isMuted:', this.isMuted);
        this.isMuted = !this.isMuted;
        console.log('new isMuted:', this.isMuted);
        localStorage.setItem('musicMuted', this.isMuted);

        // Update all audio elements
        const allAudioElements = document.querySelectorAll('audio');
        allAudioElements.forEach(audio => {
            audio.muted = this.isMuted;
            console.log('Set audio muted to:', this.isMuted);
        });

        // Update toggle button
        const toggleBtn = document.getElementById('music-toggle');
        if (toggleBtn) {
            toggleBtn.textContent = this.isMuted ? '🔇' : '🔊';
            console.log('Updated toggle button to:', toggleBtn.textContent);
        } else {
            console.error('Toggle button not found!');
        }

        if (this.isMuted) {
            this.stopAllMusic();
        } else {
            // Resume appropriate music based on current page
            const currentPage = localStorage.getItem('currentPage');
            if (currentPage) {
                this.playMusic(currentPage);
            }
        }

        return this.isMuted;
    }

    setPage(pageType) {
        this.currentPage = pageType;
        localStorage.setItem('currentPage', pageType);
    }
}

// Global instance
const musicManager = new MusicManager();

// Make it globally available
window.musicManager = musicManager;