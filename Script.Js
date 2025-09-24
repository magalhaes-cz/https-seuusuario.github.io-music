class MusicPlayer {
    constructor() {
        this.currentTrack = null;
        this.isPlaying = false;
        this.volume = 0.5;
        this.currentTime = 0;
        this.duration = 225; // 3:45 em segundos
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuthentication();
        this.loadPlaylists();
    }

    setupEventListeners() {
        // Autenticação
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchAuthTab(e));
        });

        document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('registerForm').addEventListener('submit', (e) => this.handleRegister(e));

        // Controles do Player
        document.getElementById('playPauseBtn').addEventListener('click', () => this.togglePlay());
        
        // Criação de Playlist
        document.getElementById('createPlaylistBtn').addEventListener('click', () => this.showCreatePlaylistModal());
        document.getElementById('playlistForm').addEventListener('submit', (e) => this.createPlaylist(e));
        
        // Fechar modal
        document.querySelector('.cancel-btn').addEventListener('click', () => this.hideModal());
        
        // Botões de música
        document.querySelectorAll('.play-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const card = e.target.closest('.music-card');
                this.playTrack(card);
            });
        });

        // Barra de progresso
        const progressTrack = document.querySelector('.progress-track');
        progressTrack.addEventListener('click', (e) => this.seekTrack(e));
        
        // Controle de volume
        const volumeTrack = document.querySelector('.volume-track');
        volumeTrack.addEventListener('click', (e) => this.adjustVolume(e));
    }

    // Sistema de Autenticação
    switchAuthTab(e) {
        const tab = e.target;
        const tabName = tab.dataset.tab;
        
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        document.querySelectorAll('.auth-form').forEach(form => form.classList.add('hidden'));
        document.getElementById(`${tabName}Form`).classList.remove('hidden');
    }

    handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
            localStorage.setItem('currentUser', JSON.stringify(user));
            this.showMainApp();
            this.updateUserInterface(user);
        } else {
            alert('E-mail ou senha incorretos!');
        }
    }

    handleRegister(e) {
        e.preventDefault();
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        
        if (users.some(u => u.email === email)) {
            alert('Este e-mail já está cadastrado!');
            return;
        }
        
        const newUser = {
            id: Date.now().toString(),
            name,
            email,
            password,
            createdAt: new Date().toISOString()
        };
        
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('currentUser', JSON.stringify(newUser));
        
        this.showMainApp();
        this.updateUserInterface(newUser);
        alert('Conta criada com sucesso!');
    }

    checkAuthentication() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
        if (currentUser) {
            this.showMainApp();
            this.updateUserInterface(currentUser);
        } else {
            document.getElementById('authOverlay').classList.remove('hidden');
        }
    }

    showMainApp() {
        document.getElementById('authOverlay').classList.add('hidden');
        document.getElementById('mainApp').classList.remove('hidden');
    }

    updateUserInterface(user) {
        document.getElementById('userName').textContent = user.name;
    }

    // Sistema de Playlists
    showCreatePlaylistModal() {
        document.getElementById('createPlaylistModal').classList.remove('hidden');
    }

    hideModal() {
        document.getElementById('createPlaylistModal').classList.add('hidden');
        document.getElementById('playlistForm').reset();
    }

    createPlaylist(e) {
        e.preventDefault();
        const name = document.getElementById('playlistName').value;
        const description = document.getElementById('playlistDescription').value;
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        
        if (!currentUser) return;
        
        const playlists = JSON.parse(localStorage.getItem('playlists') || '{}');
        if (!playlists[currentUser.id]) {
            playlists[currentUser.id] = [];
        }
        
        const newPlaylist = {
            id: Date.now().toString(),
            name,
            description,
            tracks: [],
            createdAt: new Date().toISOString()
        };
        
        playlists[currentUser.id].push(newPlaylist);
        localStorage.setItem('playlists', JSON.stringify(playlists));
        
        this.hideModal();
        this.loadPlaylists();
        alert(`Playlist "${name}" criada com sucesso!`);
    }

    loadPlaylists() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) return;
        
        const playlists = JSON.parse(localStorage.getItem('playlists') || '{}');
        const userPlaylists = playlists[currentUser.id] || [];
        
        const playlistsList = document.getElementById('playlistsList');
        playlistsList.innerHTML = '';
        
        userPlaylists.forEach(playlist => {
            const playlistItem = document.createElement('div');
            playlistItem.className = 'playlist-item';
            playlistItem.textContent = playlist.name;
            playlistItem.addEventListener('click', () => this.viewPlaylist(playlist));
            playlistsList.appendChild(playlistItem);
        });
    }

    viewPlaylist(playlist) {
        alert(`Abrindo playlist: ${playlist.name}`);
        // Aqui você implementaria a visualização detalhada da playlist
    }

    // Controles do Player
    togglePlay() {
        this.isPlaying = !this.isPlaying;
        const btn = document.getElementById('playPauseBtn');
        
        if (this.isPlaying) {
            btn.innerHTML = '<i class="fas fa-pause"></i>';
            this.startProgressBar();
        } else {
            btn.innerHTML = '<i class="fas fa-play"></i>';
            this.stopProgressBar();
        }
    }

    playTrack(card) {
        const trackName = card.querySelector('h4').textContent;
        const artist = card.querySelector('p').textContent;
        const imgSrc = card.querySelector('img').src;
        
        this.currentTrack = { name: trackName, artist, imgSrc };
        this.updatePlayerDisplay();
        
        if (!this.isPlaying) {
            this.togglePlay();
        }
    }

    updatePlayerDisplay() {
        if (!this.currentTrack) return;
        
        const trackInfo = document.querySelector('.track-info');
        const trackImg = document.querySelector('.current-track img');
        
        trackInfo.querySelector('h4').textContent = this.currentTrack.name;
        trackInfo.querySelector('p').textContent = this.currentTrack.artist;
        trackImg.src = this.currentTrack.imgSrc;
    }

    startProgressBar() {
        this.progressInterval = setInterval(() => {
            if (this.currentTime < this.duration) {
                this.currentTime++;
                this.updateProgressBar();
            } else {
                this.currentTime = 0;
                this.togglePlay();
            }
        }, 1000);
    }

    stopProgressBar() {
        clearInterval(this.progressInterval);
    }

    updateProgressBar() {
        const progressFill = document.querySelector('.progress-fill');
        const currentTimeSpan = document.querySelector('.time:first-child');
        
        const progressPercent = (this.currentTime / this.duration) * 100;
        progressFill.style.width = `${progressPercent}%`;
        
        const minutes = Math.floor(this.currentTime / 60);
        const seconds = this.currentTime % 60;
        currentTimeSpan.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    seekTrack(e) {
        const progressTrack = e.currentTarget;
        const rect = progressTrack.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const width = rect.width;
        const percent = clickX / width;
        
        this.currentTime = Math.floor(this.duration * percent);
        this.updateProgressBar();
    }

    adjustVolume(e) {
        const volumeTrack = e.currentTarget;
        const rect = volumeTrack.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const width = rect.width;
        this.volume = clickX / width;
        
        const volumeFill = document.querySelector('.volume-fill');
        volumeFill.style.width = `${this.volume * 100}%`;
        
        const volumeIcon = document.querySelector('.volume-control i');
        if (this.volume === 0) {
            volumeIcon.className = 'fas fa-volume-mute';
        } else if (this.volume < 0.5) {
            volumeIcon.className = 'fas fa-volume-down';
        } else {
            volumeIcon.className = 'fas fa-volume-up';
        }
    }
}

// Inicializar o player quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    new MusicPlayer();
});

// URL do site (para deploy)
// Você pode hospedar este site em serviços como:
// - GitHub Pages: https://pages.github.com/
// - Netlify: https://www.netlify.com/
// - Vercel: https://vercel.com/
// - Firebase Hosting: https://firebase.google.com/docs/hosting

// Para configurar a URL, faça:
// 1. Crie uma conta em um serviço de hospedagem
// 2. Faça upload dos arquivos HTML, CSS e JS
// 3. Configure um domínio personalizado se desejar
// 4. A URL será fornecida pelo serviço de hospedagem

// Exemplo de URL: https://seusite-musicflow.netlify.app