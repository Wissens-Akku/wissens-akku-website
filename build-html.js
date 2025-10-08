const fs = require('fs');
const path = require('path');

const episodesFilePath = path.join(__dirname, 'assets', 'js', 'episodes.json');
const episodenTemplatePath = path.join(__dirname, 'episoden-template.html');
const episodenOutputPath = path.join(__dirname, 'episoden.html');
const episodeTemplatePath = path.join(__dirname, 'episode-template.html');
const episodeOutputDir = path.join(__dirname, 'episoden');

// Function to create HTML for a single episode card
function createEpisodeCard(episode) {
    const episodeUrl = `episoden/${episode.safe_title}.html`;
    const category = (episode.title.match(/(.*?)\s*#/) || [])[1] || '';
    const summary = episode.description || 'Keine Zusammenfassung verfügbar.';
    const cleanSummary = summary.replace(/<[^>]*>?/gm, '').trim();

    const platforms = {
        spotify: episode.spotifyUrl || 'https://open.spotify.com/show/4cvMLk6acssF3L31vMHy9H',
        apple: episode.appleUrl || 'https://podcasts.apple.com/us/podcast/wissens-akku/id1833243965',
        youtube: episode.youtubeUrl || 'https://www.youtube.com/@Wissens-Akku'
    };

    return `
        <div class="episode-card bg-gray-800/50 rounded-lg p-6 flex flex-col border border-gray-700/50 hover:border-brand-accent-400/50 transition-all duration-300 hover:shadow-xl hover:shadow-brand-accent-500/20 transform hover:-translate-y-1" data-category="${category.trim()}">
            <div class="flex-grow">
                <a href="${episodeUrl}" class="no-underline hover:text-brand-accent-500">
                    <h3 class="text-xl font-bold font-heading mb-2 text-brand-accent-400">${episode.title}</h3>
                    <p class="text-brand-accent-400 mb-4">${cleanSummary.substring(0, 120)}...</p>
                </a>
            </div>
            <div class="mt-auto pt-4">
                <div class="border-t border-gray-700/50 flex items-center justify-end gap-4 mb-4 pt-4">
                    <span class="text-sm font-bold text-brand-accent-400 mr-auto">Teilen:</span>
                    <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://wissens-akku.com/' + episodeUrl)}" target="_blank" rel="noopener noreferrer" class="text-gray-400 hover:text-white transition-colors" aria-label="Auf Facebook teilen">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fill-rule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clip-rule="evenodd"></path></svg>
                    </a>
                    <a href="https://api.whatsapp.com/send?text=${encodeURIComponent(episode.title + ' ' + 'https://wissens-akku.com/' + episodeUrl)}" target="_blank" rel="noopener noreferrer" class="text-gray-400 hover:text-white transition-colors" aria-label="Per WhatsApp teilen">
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

// Main function to build HTML files
function buildHtml() {
    try {
        // Read episodes data
        const episodesData = fs.readFileSync(episodesFilePath, 'utf8');
        const episodes = JSON.parse(episodesData).items;

        // Build episoden.html (List page)
        const episodenTemplate = fs.readFileSync(episodenTemplatePath, 'utf8');
        const episodeCardsHtml = episodes.map(createEpisodeCard).join('\n');
        const episodenOutput = episodenTemplate.replace('<!-- EPISODE-GRID-PLACEHOLDER -->', episodeCardsHtml);
        fs.writeFileSync(episodenOutputPath, episodenOutput, 'utf8');
        console.log('Successfully built episoden.html');

        // Build individual episode pages
        if (!fs.existsSync(episodeOutputDir)) {
            fs.mkdirSync(episodeOutputDir);
        }
        const episodeTemplate = fs.readFileSync(episodeTemplatePath, 'utf8');

        episodes.forEach(episode => {
            const audioPlayerHtml = `
                <div class="mb-8">
                    <iframe style="border-radius:12px" src="${episode.spotifyEmbedUrl}" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
                </div>
            `;

            let finalHtml = episodeTemplate
                .replace(/%%EPISODE_TITEL%%/g, episode.title)
                .replace(/%%EPISODE_BESCHREIBUNG%%/g, episode.description)
                .replace(/%%EPISODE_DATUM%%/g, episode.pubDate)
                .replace('<!-- AUDIO-PLAYER-PLACEHOLDER -->', audioPlayerHtml)
                .replace(/%%EPISODE_URL%%/g, `https://wissens-akku.com/episoden/${episode.safe_title}.html`)
                .replace(/%%EPISODE_BILD_URL%%/g, (episode.itunes && episode.itunes.image) || 'https://wissens-akku.com/Bilder/wissenakku-logo.png')
                .replace('%%JSON_LD_SCHEMA%%', ' {}');

            // Add SEO-only content
            const seoContent = `
                <div class="hidden" aria-hidden="true">
                    <h2>Transkript der Episode: ${episode.title}</h2>
                    <p>${episode.seo_content || 'Transkript nicht verfügbar.'}</p>
                </div>
            `;
            finalHtml = finalHtml.replace('<!-- SEO-CONTENT-PLACEHOLDER -->', seoContent);

            const outputFilePath = path.join(episodeOutputDir, `${episode.safe_title}.html`);
            fs.writeFileSync(outputFilePath, finalHtml, 'utf8');
        });
        console.log(`Successfully built ${episodes.length} individual episode pages.`);

    } catch (error) {
        console.error('Error building HTML files:', error);
    }
}

buildHtml();
