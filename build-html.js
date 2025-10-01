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
                    <a href="https://twitter.com/intent/tweet?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(episode.title)}" target="_blank" rel="noopener noreferrer" class="text-gray-400 hover:text-white transition-colors">...</a>
                    <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}" target="_blank" rel="noopener noreferrer" class="text-gray-400 hover:text-white transition-colors">...</a>
                </div>
                <a href="${episode.link}" target="_blank" rel="noopener noreferrer" class="w-full bg-brand-accent-500 text-white font-bold py-2 px-4 rounded-lg text-center hover:bg-brand-accent-600 transition-transform hover:scale-105 transform block">Jetzt anhören</a>
            </div>`;
        
        const categories = (episode.itunes && episode.itunes.keywords || '').split(',').map(k => k.trim()).join(' ');
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
