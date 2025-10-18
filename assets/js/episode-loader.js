document.addEventListener('DOMContentLoaded', () => {
    // --- Animation Logic ---
    const fadeInSections = document.querySelectorAll('.fade-in-section');
    if (fadeInSections.length > 0) {
        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        fadeInSections.forEach(section => {
            observer.observe(section);
        });
    }
});

// --- Episode Loading Logic ---

function createLoadingSpinnerHTML() {
    return '<div class="spinner mx-auto"></div>';
}

async function fetchAndCacheEpisodes() {
    try {
        // Check if data is in session storage and is recent
        const cachedData = sessionStorage.getItem('episodesCache');
        const cacheTime = sessionStorage.getItem('episodesCacheTime');
        const now = new Date().getTime();

        // Cache is valid for 1 hour
        if (cachedData && cacheTime && (now - parseInt(cacheTime, 10) < 3600000)) {
            console.log("Loading episodes from cache.");
            return JSON.parse(cachedData);
        }

        console.log("Fetching fresh episodes.");
        const response = await fetch('assets/js/episodes.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        // Store in session storage
        sessionStorage.setItem('episodesCache', JSON.stringify(data.items));
        sessionStorage.setItem('episodesCacheTime', now.toString());

        return data.items; 
    } catch (error) {
        console.error("Could not fetch episodes:", error);
        const grid = document.getElementById('latest-episodes-grid');
        if(grid) grid.innerHTML = '<p class="text-center col-span-full">Fehler beim Laden der Episoden. Bitte versuchen Sie es später erneut.</p>';
        return [];
    }
}

function renderEpisodes(gridElement, episodes) {
    if (!gridElement) return;
    
    gridElement.innerHTML = ''; // Clear spinner or old content
    
    if (!episodes || episodes.length === 0) {
        gridElement.innerHTML = '<p class="text-center col-span-full">Keine Episoden gefunden.</p>';
        return;
    }

    episodes.forEach(episode => {
        // Make sure description is not null or undefined
        const description = episode.description || 'Keine Beschreibung verfügbar.';
        const episodeCard = `
            <div class="bg-gray-800/50 border border-gray-700/50 rounded-lg overflow-hidden shadow-lg hover:shadow-brand-accent-500/30 transition-shadow duration-300 flex flex-col h-full">
                <div class="p-6 flex-grow flex flex-col">
                    <h3 class="text-xl font-bold font-heading mb-2 text-white">${episode.title}</h3>
                    <p class="text-brand-accent-400/80 text-sm mb-4">${new Date(episode.pubDate).toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <p class="text-gray-400 line-clamp-3 flex-grow">${description}</p>
                </div>
                <div class="p-6 pt-0 mt-auto">
                     <a href="${episode.link}" target="_blank" rel="noopener noreferrer" class="inline-block bg-brand-accent-500 text-white font-bold py-2 px-4 rounded-lg text-sm hover:bg-brand-accent-600 transition-colors">
                        Zur Folge
                    </a>
                </div>
            </div>
        `;
        gridElement.insertAdjacentHTML('beforeend', episodeCard);
    });
}

function initializePlatformModalListener(gridElement) {
    // This function is not used on the index page, but might be on the episoden page.
    // Leaving it here to avoid breaking other pages if they use it.
}
