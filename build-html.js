const fs = require('fs');
const path = require('path');

// Define paths
const episodesFilePath = path.join(__dirname, 'assets', 'js', 'episodes.json');
const listTemplatePath = path.join(__dirname, 'episoden.html');
const episodeTemplatePath = path.join(__dirname, 'episode-template.html');
const outputDir = path.join(__dirname, 'episoden');

// Helper function to create a URL-friendly slug
function createSlug(title) {
    const a = 'àáâäæãåāăąçćčđďèéêëēėęěğǵḧîïíīįìłḿñńǹňôöòóœøōõőṕŕřßśšşșťțûüùúūǘůűųẃẍÿýžźż·/_,:;'
    const b = 'aaaaaaaaaacccddeeeeeeeegghiiiiiilmnnnnoooooooooprrsssssttuuuuuuuuuwxyyzzz------'
    const p = new RegExp(a.split('').join('|'), 'g')

    return (title || '').toString().toLowerCase()
        .replace(/\s+/g, '-') // Replace spaces with -
        .replace(p, c => b.charAt(a.indexOf(c))) // Replace special characters
        .replace(/&/g, '-and-') // Replace & with 'and'
        .replace(/[^\w\-]+/g, '') // Remove all non-word chars
        .replace(/\-\-+/g, '-') // Replace multiple - with single -
        .replace(/^-+/, '') // Trim - from start of text
        .replace(/-+$/, '') // Trim - from end of text
}

// Helper to format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' });
}

// Helper to extract categories from title (e.g., "Supplements #12")
function extractCategoriesFromTitle(title) {
    const regex = /([a-zA-ZäöüÄÖÜß]+)\s*#/g;
    const matches = [...(title || '').matchAll(regex)];
    return matches.map(match => match[1].charAt(0).toUpperCase() + match[1].slice(1));
}

try {
    // --- 1. Read all necessary files ---
    const episodesData = JSON.parse(fs.readFileSync(episodesFilePath, 'utf-8'));
    let listTemplateContent = fs.readFileSync(listTemplatePath, 'utf-8');
    const episodeTemplateContent = fs.readFileSync(episodeTemplatePath, 'utf-8');

    // --- 2. Ensure output directory exists ---
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const allEpisodeCards = [];

    // --- 3. Process each episode ---
    for (const episode of episodesData.items) {
        const slug = createSlug(episode.title);
        const cleanDescription = (episode.description || '').replace(/<[^>]*>?/gm, '').trim();
        const pageUrl = `https://wissens-akku.com/episoden/${slug}.html`;

        // --- 3a. Generate the individual episode page ---
        let singlePageHtml = episodeTemplateContent;
        singlePageHtml = singlePageHtml
            .replace(/%%EPISODE_TITEL%%/g, episode.title)
            .replace(/%%EPISODE_BESCHREIBUNG%%/g, cleanDescription.substring(0, 160))
            .replace(/%%EPISODE_URL%%/g, pageUrl)
            .replace(/%%EPISODE_BILD_URL%%/g, (episode.itunes && episode.itunes.image) ? episode.itunes.image : 'https://wissens-akku.com/Bilder/wissenakku-logo.png')
            .replace(/%%JSON_LD_SCHEMA%%/g, JSON.stringify(episode, null, 2))
            .replace(/%%EPISODE_DATUM%%/g, formatDate(episode.isoDate))
            .replace(/%%EPISODE_INHALT%%/g, episode.content || cleanDescription);

        const outputFilePath = path.join(outputDir, `${slug}.html`);
        fs.writeFileSync(outputFilePath, singlePageHtml, 'utf-8');

        // --- 3b. Generate the card for the list page ---
        const localUrl = `episoden/${slug}.html`;
        const shareLinks = `
            <div class="mt-auto pt-4">
                <div class="border-t border-gray-700/50 flex items-center gap-4 mb-4 pt-4">
                    <span class="text-sm font-bold text-brand-accent-400">Teilen:</span>
                    <a href="https://twitter.com/intent/tweet?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(episode.title)}" target="_blank" rel="noopener noreferrer" class="text-gray-400 hover:text-white transition-colors"><svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg></a>
                    <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}" target="_blank" rel="noopener noreferrer" class="text-gray-400 hover:text-white transition-colors"><svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fill-rule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clip-rule="evenodd"></path></svg></a>
                    <a href="https://api.whatsapp.com/send?text=${encodeURIComponent(episode.title + ' ' + pageUrl)}" target="_blank" rel="noopener noreferrer" class="text-gray-400 hover:text-white transition-colors"><svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zM12.04 20.12c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31c-.82-1.31-1.26-2.83-1.26-4.38 0-4.54 3.7-8.24 8.24-8.24 4.54 0 8.24 3.7 8.24 8.24s-3.7 8.24-8.24 8.24zm4.52-6.14c-.25-.12-1.47-.72-1.7-.82s-.39-.12-.56.12c-.17.25-.64.82-.79.99s-.29.17-.54.06c-.25-.12-1.06-.39-2.02-1.25s-1.45-1.93-1.62-2.25c-.17-.31-.02-.48.11-.61s.25-.29.37-.44c.13-.15.17-.25.25-.41s.12-.31.06-.44c-.06-.12-.56-1.34-.76-1.84s-.4-.42-.55-.42c-.15 0-.31-.02-.48-.02s-.41 0-1.06.5c-.65.5-1.02 1.4-1.02 2.8s1.04 3.25 1.19 3.47c.15.21 2.11 3.23 5.11 4.5s2.09.83 2.8.79c.71-.04 2.26-.92 2.58-1.8s.32-1.62.22-1.8c-.1-.18-.25-.29-.5-.41z"></path></svg></a>
                    <a href="https://t.me/share/url?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(episode.title)}" target="_blank" rel="noopener noreferrer" class="text-gray-400 hover:text-white transition-colors"><svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.102.036.27.04.364.18 1.167.964 6.11 1.2 7.354.05.24.01.47-.13.57-.14.1-.31.04-.48-.05-.17-.09-1.08-1.05-1.55-1.44-.6-.4-1.01-.7-1.18-.82-.3-.15-.5-.2-.3-.4.1-.1.7-.7.8-1 .1-.1.1-.2-.04-.3-.1-.1-1.2 1-1.5.3-.2-.4.3-1.2.4-1.3.5-.7 1-2.4 1.2-2.6.2-.2.3-.3.2-.4-.1-.1-.2-.1-.4-.1-.2 0-1.7.8-2.2 1.2-.4.3-.8.4-1.1.4h-.1c-.2 0-1.3-.3-1.9-1.3-.6-1-.8-1.9-.1-2.1.7-.2 1.6-.7 2.4-1 .8-.3 1.5-.6 2.2-1 .3-.2.5-.2.7-.2z"></svg></a>
                </div>
                <a href="${episode.link}" target="_blank" rel="noopener noreferrer" class="w-full bg-brand-accent-500 text-white font-bold py-2 px-4 rounded-lg text-center hover:bg-brand-accent-600 transition-transform hover:scale-105 transform block">Jetzt anhören</a>
            </div>`;
        
        const categories = extractCategoriesFromTitle(episode.title).join(' ');
        const cardHtml = `
            <div class="episode-card bg-gray-800/50 rounded-lg p-6 flex flex-col border border-gray-700/50" data-category="${categories}">
                <a href="${localUrl}" data-cookieconsent="ignore" class="no-underline hover:text-brand-accent-500"><h3 class="text-xl font-bold font-heading mb-2 text-brand-accent-400">${episode.title}</h3></a>
                <p class="text-brand-accent-400 flex-grow mb-4">${cleanDescription.substring(0, 150)}...</p>
                ${shareLinks}
            </div>`;
        allEpisodeCards.push(cardHtml);
    }

    // --- 4. Inject all cards into the list page template ---
    const placeholder = '<!-- EPISODE-GRID-PLACEHOLDER -->';
    if (!listTemplateContent.includes(placeholder)) {
        throw new Error(`Placeholder ${placeholder} not found in ${listTemplatePath}.`);
    }
    const finalListHtml = listTemplateContent.replace(placeholder, allEpisodeCards.join('\n'));

    // --- 5. Write the final list page ---
    fs.writeFileSync(listTemplatePath, finalListHtml, 'utf-8');

    console.log('Build process complete!');
    console.log(`- Generated ${episodesData.items.length} individual episode pages in /episoden/`);
    console.log(`- Updated episoden.html with ${allEpisodeCards.length} static cards.`);

} catch (error) {
    console.error('An error occurred during the build process:', error);
    process.exit(1);
}