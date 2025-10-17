const fs = require('fs');
const path = require('path');
const Parser = require('rss-parser');

const parser = new Parser({
  maxItems: 200 // Erhöhen, um sicherzustellen, dass alle Episoden aus großen Feeds geladen werden
});

// Konfiguration
const FEED_URL = 'https://anchor.fm/s/107c46c58/podcast/rss';
const OUTPUT_PATH = path.join(__dirname, 'assets', 'js', 'episodes.json');

function createSafeTitle(title) {
    return title
        .toLowerCase()
        .replace(/ä/g, 'ae')
        .replace(/ö/g, 'oe')
        .replace(/ü/g, 'ue')
        .replace(/ß/g, 'ss')
        .replace(/[^a-z0-9_\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/--+/g, '-'); // Replace multiple hyphens with a single one
}

function extractCategory(title) {
    const separatorIndex = title.indexOf('#');
    if (separatorIndex > 0) {
        let category = title.substring(0, separatorIndex).trim();
        // Handle known typos or variations
        if (category.toLowerCase() === 'käruter und tee') {
            return 'Kräuter und Tee';
        }
        return category;
    }
    // Fallback for titles that don't match the pattern
    if (title.toLowerCase().includes('persönliches')) return 'Persönliches';
    return 'Allgemein'; // Default category
}

(async () => {
    console.log(`[INFO] Starte den Abruf des RSS-Feeds von: ${FEED_URL}`);

    try {
        // 1. RSS-Feed abrufen und parsen
        const feed = await parser.parseURL(FEED_URL);
        console.log(`[SUCCESS] Feed "${feed.title}" erfolgreich abgerufen. ${feed.items.length} Episoden gefunden.`);

        // 2. Daten in das gewünschte JSON-Format bringen
        const processedItems = feed.items.map(item => {
            const spotifyUrl = item.link;
            const spotifyEmbedUrl = spotifyUrl.replace('podcasters.spotify.com/pod/show/wissens-akku/episodes', 'open.spotify.com/embed/episode');

            return {
                ...item,
                category: extractCategory(item.title),
                safe_title: createSafeTitle(item.title),
                description: item.contentSnippet,
                spotifyUrl: spotifyUrl,
                appleUrl: '#', // Placeholder
                youtubeUrl: '#', // Placeholder
                spotifyEmbedUrl: spotifyEmbedUrl,
                seo_content: item.content // Full content for SEO
            };
        });

        const outputData = {
            status: 'ok',
            feed: {
                url: feed.feedUrl,
                title: feed.title,
                link: feed.link,
                author: feed.author,
                description: feed.description,
                image: feed.image ? feed.image.url : ''
            },
            items: processedItems
        };

        // 3. JSON-Datei schreiben
        fs.writeFileSync(OUTPUT_PATH, JSON.stringify(outputData, null, 2), 'utf-8');
        console.log(`[SUCCESS] Die Datei ${OUTPUT_PATH} wurde erfolgreich mit den neuesten Episoden und Kategorien aktualisiert.`);

    } catch (error) {
        console.error('[ERROR] Ein Fehler ist aufgetreten:');
        console.error(error);
        process.exit(1); // Beendet das Skript mit einem Fehlercode
    }
})();