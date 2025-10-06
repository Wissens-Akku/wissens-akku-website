const fs = require('fs');
const path = require('path');

// Define paths
const episodesFilePath = path.join(__dirname, 'assets', 'js', 'episodes.json');
const listTemplatePath = path.join(__dirname, 'episoden-template.html');
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
    const trimmedTitle = (title || '').trim(); // Trim the title first
    const match = trimmedTitle.match(/(.*?)\s*#/);
    if (!match || !match[1]) {
        return [];
    }
    const categoryString = match[1].trim();
    if (categoryString.toLowerCase() === 'wissens-akku') {
        return [];
    }
    // Split by space and capitalize each word
    return categoryString.split(/\s+/).map(word => word.charAt(0).toUpperCase() + word.slice(1));
}

try {
    // --- Platform Links (provided by user) ---
    const spotifyShowUrl = "https://open.spotify.com/show/4cvMLk6acssF3L31vMHy9H";
    const appleUrl = "https://podcasts.apple.com/de/podcast/wissens-akku/id1833243965";
    const youtubeUrl = "https://www.youtube.com/@Wissens-Akku";
    const baseUrl = "https://www.wissens-akku.com"; // Base URL for episode links

    // --- 1. Read all necessary files ---
    const episodesData = JSON.parse(fs.readFileSync(episodesFilePath, 'utf-8'));
    let listTemplateContent = fs.readFileSync(listTemplatePath, 'utf-8');
    const episodeTemplateContent = fs.readFileSync(episodeTemplatePath, 'utf-8'); // Read the individual episode template

    // --- 2. Ensure output directory exists ---
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const allEpisodeCards = [];
    let generatedEpisodeCount = 0;

    // --- Sort and filter episodes ---
    const sortedItems = episodesData.items
        .filter(item => item.itunes && item.itunes.episodeType === 'full')
        .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate)); // Neueste zuerst

    console.log(`Processing ${sortedItems.length} published episodes...`);

    // --- 3. Process each episode ---
    for (const episode of sortedItems) {
        const cleanDescription = ((episode.itunes && episode.itunes.summary) || episode.content || '').replace(/<[^>]*>?/gm, '').trim();
        const episodeSlug = createSlug(episode.title);
        const episodeUrl = `${baseUrl}/episoden/${episodeSlug}.html`;
        const episodeImageUrl = (episode.itunes && episode.itunes.image) ? episode.itunes.image : `${baseUrl}/Bilder/wissenakku-logo.png`;

        // --- Generate Individual Episode Page ---
        let singleEpisodeHtml = episodeTemplateContent;
        
        // Define the share links HTML block (Telegram only)
        const shareLinks = `
            <section id="share" class="max-w-3xl mx-auto text-center pt-8 pb-12 border-t border-gray-700/50">
                <h2 class="text-2xl font-bold font-heading mb-6">Episode teilen:</h2>
                <div class="flex justify-center items-center gap-4 md:gap-6 flex-wrap">
                    <a href="https://t.me/share/url?url=${encodeURIComponent(episodeUrl)}&text=${encodeURIComponent(episode.title)}" target="_blank" rel="noopener noreferrer" class="group flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 transition-colors transform hover:scale-105">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.17.91-.494 1.203-.82 1.23-.698.056-1.225-.432-1.895-.91-1.056-.765-1.653-1.23-2.674-1.972-.94-.678-.417-1.033.248-1.654.186-.182 3.27-2.977 3.33-3.23.007-.033.014-.15-.056-.21-.07-.06-.176-.037-.25-.012-.112.037-1.824 1.16-3.45 2.615-.58.52-1.116.765-1.653.75-.56-.015-1.654-.34-2.475-.626-1.01-.356-1.81-.543-1.717-1.14.05-.324.417-.637.94-.877 3.33-1.52 5.55-2.55 6.555-2.977a2.5 2.5 0 0 1 1.504-.53z"></path></svg>
                        <span class="font-semibold">Telegram</span>
                    </a>
                </div>
            </section>`;

        // Replace all placeholders
        singleEpisodeHtml = singleEpisodeHtml
            .replace(/%%EPISODE_TITEL%%/g, episode.title)
            .replace(/%%EPISODE_DATUM%%/g, formatDate(episode.pubDate))
            .replace(/%%EPISODE_URL%%/g, episodeUrl)
            .replace(/%%EPISODE_BILD_URL%%/g, episodeImageUrl)
            .replace(/%%EPISODE_BESCHREIBUNG%%/g, cleanDescription.substring(0, 160))
            .replace('<!-- SHARE-BUTTONS-PLACEHOLDER -->', shareLinks) // Use the placeholder
            .replace(/%%EPISODE_INHALT%%/g, (episode.contentEncoded || '').replace(/<br><br>/g, '</p><p>'))
            .replace(/%%JSON_LD_SCHEMA%%/g, JSON.stringify({
                "@context": "https://schema.org",
                "@type": "PodcastEpisode",
                "name": episode.title,
                "datePublished": new Date(episode.pubDate).toISOString(),
                "description": cleanDescription,
                "url": episodeUrl,
                "partOfSeries": {
                    "@type": "PodcastSeries",
                    "name": "Wissens-Akku",
                    "url": baseUrl
                }
            }, null, 2));

        const episodeOutputPath = path.join(outputDir, `${episodeSlug}.html`);
        fs.writeFileSync(episodeOutputPath, singleEpisodeHtml, 'utf-8');
        generatedEpisodeCount++;

        // --- Generate Episode Card for List Page ---
        const categories = extractCategoriesFromTitle(episode.title).join(' ');
        const cardHtml = `
            <div class="episode-card bg-gray-800/50 rounded-lg p-6 flex flex-col border border-gray-700/50" data-category="${categories}">
                <h3 class="text-xl font-bold font-heading mb-2 text-brand-accent-400"><a href="${episodeUrl}" class="hover:underline">${episode.title}</a></h3>
                <p class="text-gray-400 flex-grow mb-4">${cleanDescription.substring(0, 150)}...</p>
                <div class="mt-auto pt-4">
                    <a href="${episodeUrl}" class="listen-button w-full bg-brand-accent-500 text-white font-bold py-2 px-4 rounded-lg text-center hover:bg-brand-accent-600 transition-transform hover:scale-105 transform">
                        Details ansehen & anhören
                    </a>
                </div>
            </div>`;
        allEpisodeCards.push(cardHtml);
    }

    // --- 4. Inject all cards into the list page template ---
    const placeholder = '<!-- EPISODE-GRID-PLACEHOLDER -->';
    if (!listTemplateContent.includes(placeholder)) {
        throw new Error("Placeholder <!-- EPISODE-GRID-PLACEHOLDER --> not found in episoden-template.html.");
    }
    const finalListHtml = listTemplateContent.replace(placeholder, allEpisodeCards.join('\n'));

    // --- 5. Write the final list page ---
    const listOutputPath = path.join(__dirname, 'episoden.html');
    fs.writeFileSync(listOutputPath, finalListHtml, 'utf-8');

    console.log('Build process complete!');
    console.log(`- Generated ${generatedEpisodeCount} individual episode pages.`);
    console.log(`- Updated episoden.html with ${allEpisodeCards.length} cards.`);

} catch (error) {
    console.error('An error occurred during the build process:', error);
    process.exit(1);
}