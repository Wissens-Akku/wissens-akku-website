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

    const shareLinks = `
        <div class="mt-auto pt-4">
            <div class="border-t border-gray-700/50 flex items-center gap-4 mb-4 pt-4">
                <span class="text-sm font-bold text-brand-accent-400">Teilen:</span>
                <a href="https://www.tiktok.com/@wissensakku" target="_blank" rel="noopener noreferrer" class="text-gray-400 hover:text-white transition-colors" aria-label="Auf TikTok teilen">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-1.06-.63-1.9-1.44-2.56-2.45-1.17-1.77-1.69-3.91-1.67-5.94.04-1.49.6-2.96 1.52-4.15 1.08-1.39 2.64-2.32 4.3-2.56.33-.05.66-.06 1-.07.02 2.85-.01 5.7.02 8.55.02 1.22-.55 2.37-1.52 3.07-1.55 1.1-3.53.73-4.6-.82-.36-.51-.55-1.13-.6-1.73-.03-1.1.24-2.17.82-3.09.6-.9 1.44-1.57 2.4-2.03.18-.09.37-.17.58-.21 1.45-.3 2.53-.87 3.47-1.82.05-.06.09-.13.14-.19.48-.58.88-1.23 1.19-1.91.02-2.8.01-5.6-.01-8.4.01-1.33.01-2.65.04-3.98z"></path></svg>
                </a>
                <a href="https://api.whatsapp.com/send?text=${encodeURIComponent(item.title + ' ' + 'https://wissens-akku.com/' + localUrl)}" target="_blank" rel="noopener noreferrer" class="text-gray-400 hover:text-white transition-colors" aria-label="Per WhatsApp teilen">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zM12.04 20.12c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31c-.82-1.31-1.26-2.83-1.26-4.38 0-4.54 3.7-8.24 8.24-8.24 4.54 0 8.24 3.7 8.24 8.24s-3.7 8.24-8.24 8.24zm4.52-6.14c-.25-.12-1.47-.72-1.7-.82s-.39-.12-.56.12c-.17.25-.64.82-.79.99s-.29.17-.54.06c-.25-.12-1.06-.39-2.02-1.25s-1.45-1.93-1.62-2.25c-.17-.31-.02-.48.11-.61s.25-.29.37-.44c.13-.15.17-.25.25-.41s.12-.31.06-.44c-.06-.12-.56-1.34-.76-1.84s-.4-.42-.55-.42c-.15 0-.31-.02-.48-.02s-.41 0-1.06.5c-.65.5-1.02 1.4-1.02 2.8s1.04 3.25 1.19 3.47c.15.21 2.11 3.23 5.11 4.5s2.09.83 2.8.79c.71-.04 2.26-.92 2.58-1.8s.32-1.62.22-1.8c-.1-.18-.25-.29-.5-.41z"></path></svg>
                </a>
            </div>
            <button class="listen-button w-full bg-gray-600 text-white font-bold py-2 px-4 rounded-lg text-center hover:bg-gray-500 transition-colors block"
                data-spotify-url="${platforms.spotify}"
                data-apple-url="${platforms.apple}"
                data-youtube-url="${platforms.youtube}">
                Jetzt anhören
            </button>
        </div>
    `
    return `
        <div class="episode-card bg-gray-800/50 rounded-lg p-6 flex flex-col border border-gray-700/50 hover:border-brand-accent-400/50 transition-all duration-300 hover:shadow-xl hover:shadow-brand-accent-500/20 transform hover:-translate-y-1" data-category="${item.title.split(' ')[0].toLowerCase()}">
            <a href="${localUrl}" rel="nofollow" class="no-underline hover:text-brand-accent-500 flex-grow">
                <h3 class="text-xl font-bold font-heading mb-2 text-brand-accent-400">${item.title}</h3>
                <p class="text-brand-accent-400 mb-4">${cleanSummary.substring(0, 150)}...</p>
            </a>
            ${shareLinks}
        </div>
    `;
}

function createLoadingSpinnerHTML() {
    return `<div class="col-span-full flex justify-center items-center p-12"><div class="spinner"></div></div>`;
}

async function fetchWithTimeout(resource, options = {}) {
    const { timeout = 10000 } = options; // 10 seconds timeout
    
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(resource, {
            ...options,
            signal: controller.signal  
        });
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
            const colors = {
                info: 'text-yellow-400',
                error: 'text-red-400'
            };
            episodeUpdateInfoDiv.innerHTML = `<div class="col-span-full text-center ${colors[type]} p-4 bg-gray-800/50 rounded-lg mb-4"><p class="font-bold">${message}</p></div>`;
            episodeUpdateInfoDiv.classList.remove('hidden');
        }
    };

    const processAndSortItems = (items) => {
        if (!items) return [];
        const now = new Date();
        return items // .filter(item => new Date(item.pubDate) <= now) // Temporär deaktiviert, um zukünftige Episoden anzuzeigen
            .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate)); // Neueste zuerst
    };

    // Attempt to fetch live data if consent is given
    if (typeof Cookiebot !== 'undefined' && Cookiebot.consent && Cookiebot.consent.marketing) {
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
        showInfo('Die angezeigten Folgen sind eventuell nicht die neusten, was daran liegen kann, dass die Marketing-Cookies nicht akzeptiert wurden.');
    }

    // Fallback to local file
    try {
        console.log('Loading episodes from local file as fallback.');
        const response = await fetch(localJsonPath);
        if (!response.ok) throw new Error('Local fallback file not found.');
        const jsonData = await response.json();
        return processAndSortItems(jsonData.items);
    } catch (fallbackError) {
        console.error("Konnte auch lokale Fallback-Datei nicht laden:", fallbackError);
        showInfo('Episoden konnten nicht geladen werden. Bitte versuche es später erneut.', 'error');
        return []; // Return empty array on total failure
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