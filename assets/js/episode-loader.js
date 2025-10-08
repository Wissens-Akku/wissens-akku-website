// --- MODAL SETUP ---

function ensurePlatformModalExists() {
    if (document.getElementById('platform-modal')) return;

    const modalHTML = `
        <div id="platform-modal" class="modal hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] p-4 items-center justify-center">
            <div class="bg-gray-800 rounded-xl shadow-2xl p-8 max-w-sm w-full relative border border-gray-700">
                <button id="close-platform-modal" class="absolute top-4 right-4 text-brand-accent-400 hover:text-brand-accent-500 transition-colors z-10">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <h3 class="text-2xl font-bold font-heading text-center mb-6 text-white">Hören auf...</h3>
                <div id="platform-links" class="space-y-4">
                    <!-- Links will be injected here -->
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function initializePlatformModalListener(container) {
    ensurePlatformModalExists();

    const platformModal = document.getElementById('platform-modal');
    const closeButton = document.getElementById('close-platform-modal');
    const platformLinksContainer = document.getElementById('platform-links');

    if (!platformModal || !closeButton || !platformLinksContainer) {
        console.error('Platform modal elements not found!');
        return;
    }

    const openModal = (spotifyUrl, appleUrl, youtubeUrl) => {
        platformLinksContainer.innerHTML = ''; // Clear previous links

        if (spotifyUrl && spotifyUrl !== 'undefined') {
            platformLinksContainer.innerHTML += `<a href="${spotifyUrl}" target="_blank" rel="noopener noreferrer" class="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg text-center hover:bg-green-700 transition-transform hover:scale-105 transform block no-underline" aria-label="Auf Spotify anhören">Spotify</a>`;
        }
        if (appleUrl && appleUrl !== 'undefined') {
            platformLinksContainer.innerHTML += `<a href="${appleUrl}" target="_blank" rel="noopener noreferrer" class="w-full bg-purple-600 text-white font-bold py-3 px-4 rounded-lg text-center hover:bg-purple-700 transition-transform hover:scale-105 transform block no-underline" aria-label="Auf Apple Podcasts anhören">Apple Podcasts</a>`;
        }
        if (youtubeUrl && youtubeUrl !== 'undefined') {
            platformLinksContainer.innerHTML += `<a href="${youtubeUrl}" target="_blank" rel="noopener noreferrer" class="w-full bg-red-600 text-white font-bold py-3 px-4 rounded-lg text-center hover:bg-red-700 transition-transform hover:scale-105 transform block no-underline" aria-label="Auf YouTube ansehen">YouTube</a>`;
        }

        platformModal.classList.remove('hidden');
        document.body.classList.add('modal-open');
    };

    const closeModal = () => {
        platformModal.classList.add('hidden');
        document.body.classList.remove('modal-open');
    };

    // Event delegation for listen buttons on the specific container
    container.addEventListener('click', function(e) {
        const listenButton = e.target.closest('.listen-button');
        if (listenButton) {
            e.preventDefault();
            const spotifyUrl = listenButton.dataset.spotifyUrl;
            if (spotifyUrl && spotifyUrl !== 'undefined') {
                window.open(spotifyUrl, '_blank');
            }
        }
    });

    closeButton.addEventListener('click', closeModal);
    platformModal.addEventListener('click', (e) => {
        if (e.target === platformModal) {
            closeModal();
        }
    });
}


// --- EPISODE RENDERING ---

function createEpisodeCard(item) {
    const summary = item.description || 'Keine Zusammenfassung verfügbar.';
    const cleanSummary = summary.replace(/<[^>]*>?/gm, '').trim();
    const slug = (item.title || '').toString()
        .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-');
    
    const localUrl = `episode.html?slug=${slug}`;

    const platforms = {
        spotify: item.link || 'https://open.spotify.com/show/4cvMLk6acssF3L31vMHy9H',
        apple: 'https://podcasts.apple.com/us/podcast/wissens-akku/id1833243965',
        youtube: 'https://www.youtube.com/@Wissens-Akku'
    };

    return `
        <div class="episode-card bg-gray-800/50 rounded-lg p-6 flex flex-col border border-gray-700/50 hover:border-brand-accent-400/50 transition-all duration-300 hover:shadow-xl hover:shadow-brand-accent-500/20 transform hover:-translate-y-1" data-category="${item.title.split(' ')[0].toLowerCase()}">
            <div class="flex-grow">
                <a href="${localUrl}" class="no-underline hover:text-brand-accent-500">
                    <h3 class="text-xl font-bold font-heading mb-2 text-brand-accent-400">${item.title}</h3>
                    <p class="text-brand-accent-400 mb-4">${cleanSummary.substring(0, 120)}...</p>
                </a>
            </div>
            <div class="mt-auto pt-4">
                <div class="border-t border-gray-700/50 flex items-center justify-end gap-4 mb-4 pt-4">
                    <span class="text-sm font-bold text-brand-accent-400 mr-auto">Teilen:</span>
                    <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://wissens-akku.com/' + localUrl)}" target="_blank" rel="noopener noreferrer" class="text-gray-400 hover:text-white transition-colors" aria-label="Auf Facebook teilen">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fill-rule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clip-rule="evenodd"></path></svg>
                    </a>
                    <a href="https://api.whatsapp.com/send?text=${encodeURIComponent(item.title + ' ' + 'https://wissens-akku.com/' + localUrl)}" target="_blank" rel="noopener noreferrer" class="text-gray-400 hover:text-white transition-colors" aria-label="Per WhatsApp teilen">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zM12.04 20.12c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31c-.82-1.31-1.26-2.83-1.26-4.38 0-4.54 3.7-8.24 8.24-8.24 4.54 0 8.24 3.7 8.24 8.24s-3.7 8.24-8.24 8.24zm4.52-6.14c-.25-.12-1.47-.72-1.7-.82s-.39-.12-.56.12c-.17.25-.64.82-.79.99s-.29.17-.54.06c-.25-.12-1.06-.39-2.02-1.25s-1.45-1.93-1.62-2.25c-.17-.31-.02-.48.11-.61s.25-.29.37-.44c.13-.15.17-.25.25-.41s.12-.31.06-.44c-.06-.12-.56-1.34-.76-1.84s-.4-.42-.55-.42c-.15 0-.31-.02-.48-.02s-.41 0-1.06.5c-.65.5-1.02 1.4-1.02 2.8s1.04 3.25 1.19 3.47c.15.21 2.11 3.23 5.11 4.5s2.09.83 2.8.79c.71-.04 2.26-.92 2.58-1.8s.32-1.62.22-1.8c-.1-.18-.25-.29-.5-.41z"></path></svg>
                    </a>
                </div>
                <button class="listen-button w-full bg-brand-accent-500 text-white font-bold py-2 px-4 rounded-lg text-center hover:bg-brand-accent-600 transition-transform hover:scale-105 transform"
                    data-spotify-url="${platforms.spotify}"
                    data-apple-url="${platforms.apple}"
                    data-youtube-url="${platforms.youtube}">
                    Jetzt anhören
                </button>
            </div>
        </div>
    `;
}

function createLoadingSpinnerHTML() {
    return `<div class="col-span-full flex justify-center items-center p-12"><div class="spinner"></div></div>`;
}

// --- DATA FETCHING ---

async function fetchWithTimeout(resource, options = {}) {
    const { timeout = 8000 } = options;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(resource, { ...options, signal: controller.signal });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        throw error;
    }
}

async function fetchAndCacheEpisodes() {
    const episodeUpdateInfoDiv = document.getElementById('episode-update-info');
    const localJsonPath = 'assets/js/episodes.json';

    const showInfo = (message, type = 'info') => {
        if (episodeUpdateInfoDiv) {
            const colors = { info: 'text-yellow-400', error: 'text-red-400' };
            episodeUpdateInfoDiv.innerHTML = `<div class="col-span-full text-center ${colors[type]} p-4 bg-gray-800/50 rounded-lg mb-4"><p class="font-bold">${message}</p></div>`;
            episodeUpdateInfoDiv.classList.remove('hidden');
        }
    };

    const processAndSortItems = (items) => {
        if (!items) return [];
        return items.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    };

    if (typeof Cookiebot !== 'undefined' && Cookiebot.consent && (Cookiebot.consent.statistics || Cookiebot.consent.marketing)) {
        try {
            console.log('Cookie consent given. Fetching latest episodes from Netlify Function.');
            const response = await fetchWithTimeout('/.netlify/functions/rss-proxy');
            if (!response.ok) throw new Error(`Network response was not ok: ${response.statusText}`);
            const jsonData = await response.json();
            if (jsonData.status !== 'ok') throw new Error('JSON data status is not ok.');
            console.log('Successfully fetched live data.');
            if (episodeUpdateInfoDiv) episodeUpdateInfoDiv.classList.add('hidden');
            return processAndSortItems(jsonData.items);
        } catch (error) {
            console.error("Fehler beim Laden des Live-Feeds, falle zurück auf lokale Datei:", error);
            showInfo('Die neuesten Folgen konnten nicht geladen werden. Anzeige aus dem Cache.', 'error');
        }
    } else {
        console.log('Cookie consent not given. Loading episodes from local build file.');
        showInfo('Die angezeigten Folgen sind eventuell nicht die neusten. Akzeptiere Marketing-Cookies, um die aktuellsten Episoden zu sehen.');
    }

    try {
        console.log('Loading episodes from local file as fallback.');
        const response = await fetch(localJsonPath);
        if (!response.ok) throw new Error('Local fallback file not found.');
        const jsonData = await response.json();
        return processAndSortItems(jsonData.items);
    } catch (fallbackError) {
        console.error("Konnte auch lokale Fallback-Datei nicht laden:", fallbackError);
        showInfo('Episoden konnten nicht geladen werden. Bitte versuche es später erneut.', 'error');
        return [];
    }
}

function renderEpisodes(gridElement, items) {
    if (!gridElement) return;
    if (!items || items.length === 0) {
        gridElement.innerHTML = '<div class="col-span-full text-center text-brand-accent-400 p-8"><p class="font-bold">Keine Episoden gefunden.</p></div>';
        return;
    }
    gridElement.innerHTML = items.map(createEpisodeCard).join('');
}