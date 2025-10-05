const fs = require('fs');
const path = require('path');
const Parser = require('rss-parser');

const parser = new Parser({
  maxItems: 200 // Erhöhen, um sicherzustellen, dass alle Episoden aus großen Feeds geladen werden
});

// Konfiguration
const FEED_URL = 'https://anchor.fm/s/107c46c58/podcast/rss';
const OUTPUT_PATH = path.join(__dirname, 'assets', 'js', 'episodes.json');

(async () => {
    console.log(`[INFO] Starte den Abruf des RSS-Feeds von: ${FEED_URL}`);

    try {
        // 1. RSS-Feed abrufen und parsen
        const feed = await parser.parseURL(FEED_URL);
        console.log(`[SUCCESS] Feed "${feed.title}" erfolgreich abgerufen. ${feed.items.length} Episoden gefunden.`);

        // 2. Daten in das gewünschte JSON-Format bringen
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
            items: feed.items
        };

        // 3. JSON-Datei schreiben
        fs.writeFileSync(OUTPUT_PATH, JSON.stringify(outputData, null, 2), 'utf-8');
        console.log(`[SUCCESS] Die Datei ${OUTPUT_PATH} wurde erfolgreich mit den neuesten Episoden aktualisiert.`);

    } catch (error) {
        console.error('[ERROR] Ein Fehler ist aufgetreten:');
        console.error(error);
        process.exit(1); // Beendet das Skript mit einem Fehlercode
    }
})();