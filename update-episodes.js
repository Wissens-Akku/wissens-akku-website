const fs = require('fs');
const path = require('path');
const https = require('https');
const Parser = require('rss-parser');

const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
  },
  maxItems: 200 // Erhöhen, um sicherzustellen, dass alle Episoden aus großen Feeds geladen werden
});

// Konfiguration
const FEED_URL = 'https://anchor.fm/s/107c46c58/podcast/rss';
const OUTPUT_PATH = path.join(__dirname, 'assets', 'js', 'episodes.json');

// --- Plattform-Verlinkung pro Folge ---
// Apple Podcasts: über die offizielle iTunes-Lookup-API werden pro Folge die
//   Detail-Links (…?i=<episodeId>) geholt und per GUID den Folgen zugeordnet.
//   Die API liefert max. ~200 (neueste) Folgen; ältere fallen auf die Show-Seite zurück.
// YouTube: best-effort. Der YouTube-RSS-Feed liefert nur die ~15 neuesten Videos.
//   Diese werden per (normalisiertem) Titel den Folgen zugeordnet. Kein Treffer => Kanal-Link.
const APPLE_PODCAST_ID = '1833243965';
const APPLE_STOREFRONT = 'DE';
const APPLE_LOOKUP_URL = `https://itunes.apple.com/lookup?id=${APPLE_PODCAST_ID}&country=${APPLE_STOREFRONT}&media=podcast&entity=podcastEpisode&limit=200`;
const YT_CHANNEL_ID = 'UCFab765y1OD5hP4HXQj4ttg';
const YT_FEED_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${YT_CHANNEL_ID}`;

function createSafeTitle(title) {
    return title
        .toLowerCase()
        .replace(/ä/g, 'ae')
        .replace(/ö/g, 'oe')
        .replace(/ü/g, 'ue')
        .replace(/ß/g, 'ss')
        .replace(/[^a-z0-9_\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/--+/g, '-') // Replace multiple hyphens with a single one
        .replace(/^-+|-+$/g, ''); // Führende/abschließende Bindestriche entfernen (saubere URLs)
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

// Titel auf einen reinen [a-z0-9]-Kern reduzieren (für robusten Vergleich Podcast<->YouTube)
function normTitle(s) {
    return String(s || '')
        .toLowerCase()
        .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
        .replace(/[^a-z0-9]+/g, '');
}

// Einfacher HTTPS-GET (folgt Redirects), gibt den Body als String zurück.
function httpGet(url, redirects = 0) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WissensAkkuBuild/1.0)' } }, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && redirects < 5) {
                res.resume();
                const next = new URL(res.headers.location, url).toString();
                return resolve(httpGet(next, redirects + 1));
            }
            if (res.statusCode !== 200) {
                res.resume();
                return reject(new Error('HTTP ' + res.statusCode + ' für ' + url));
            }
            let data = '';
            res.setEncoding('utf8');
            res.on('data', (c) => { data += c; });
            res.on('end', () => resolve(data));
        });
        req.on('error', reject);
        req.setTimeout(20000, () => req.destroy(new Error('Timeout: ' + url)));
    });
}

// Apple: guid -> Folgen-URL (…?i=<id>). Fehler werden geschluckt (Build läuft trotzdem).
async function fetchAppleMap() {
    const map = new Map();
    try {
        const body = await httpGet(APPLE_LOOKUP_URL);
        const json = JSON.parse(body);
        for (const r of (json.results || [])) {
            const isEpisode = r.wrapperType === 'podcastEpisode' || r.kind === 'podcast-episode';
            if (isEpisode && r.episodeGuid && r.trackViewUrl) {
                const url = r.trackViewUrl.replace('&uo=4', '').replace('?uo=4', '');
                map.set(r.episodeGuid, url);
            }
        }
        console.log(`[INFO] Apple: ${map.size} Folgen-Links über iTunes-API geladen.`);
    } catch (e) {
        console.warn('[WARN] Apple-Folgen-Links konnten nicht geladen werden (Fallback: Show-Seite). Grund:', e.message);
    }
    return map;
}

// YouTube: Liste { n: normalisierterTitel, url } aus dem Kanal-RSS (nur ~15 neueste). Fehler -> leere Liste.
async function fetchYoutubeList() {
    const list = [];
    try {
        const ytFeed = await parser.parseURL(YT_FEED_URL);
        for (const v of (ytFeed.items || [])) {
            if (v.title && v.link) list.push({ n: normTitle(v.title), url: v.link });
        }
        console.log(`[INFO] YouTube: ${list.length} Videos aus dem Kanal-Feed geladen (Titel-Matching).`);
    } catch (e) {
        console.warn('[WARN] YouTube-Feed konnte nicht geladen werden (Fallback: Kanal-Link). Grund:', e.message);
    }
    return list;
}

// Bestes YouTube-Video zu einem Folgentitel finden (exakt oder per Kern-Containment).
function matchYoutube(title, ytList) {
    if (!ytList.length) return null;
    const en = normTitle(title);
    if (en.length < 8) return null;
    // 1) exakte Normalisierung
    let hit = ytList.find(v => v.n === en);
    if (hit) return hit.url;
    // 2) Containment: der kürzere Kern muss im längeren stecken (mind. 14 Zeichen Überlappung)
    const core = en.slice(0, 30);
    hit = ytList.find(v => v.n.length >= 14 && (v.n.includes(core) || en.includes(v.n.slice(0, 30))));
    return hit ? hit.url : null;
}

(async () => {
    console.log(`[INFO] Starte den Abruf des RSS-Feeds von: ${FEED_URL}`);

    try {
        // 1. RSS-Feed abrufen und parsen
        const feed = await parser.parseURL(FEED_URL);
        console.log(`[SUCCESS] Feed "${feed.title}" erfolgreich abgerufen. ${feed.items.length} Episoden gefunden.`);

        // 1b. Plattform-Links pro Folge beschaffen (fehlertolerant, blockiert den Build nie)
        const [appleMap, ytList] = await Promise.all([fetchAppleMap(), fetchYoutubeList()]);

        // 2. Daten in das gewünschte JSON-Format bringen
        let appleHits = 0, ytHits = 0;
        const processedItems = feed.items.map(item => {
            const spotifyUrl = item.link;
            const spotifyEmbedUrl = spotifyUrl.replace('podcasters.spotify.com/pod/show/wissens-akku/episodes', 'open.spotify.com/embed/episode');

            const appleUrl = (item.guid && appleMap.get(item.guid)) || '#';
            if (appleUrl !== '#') appleHits++;
            const youtubeUrl = matchYoutube(item.title, ytList) || '#';
            if (youtubeUrl !== '#') ytHits++;

            return {
                ...item,
                category: extractCategory(item.title),
                safe_title: createSafeTitle(item.title),
                description: item.contentSnippet,
                spotifyUrl: spotifyUrl,
                appleUrl: appleUrl,
                youtubeUrl: youtubeUrl,
                spotifyEmbedUrl: spotifyEmbedUrl,
                seo_content: item.content // Full content for SEO
            };
        });

        console.log(`[INFO] Folgen-Links gesetzt – Apple: ${appleHits}/${processedItems.length}, YouTube: ${ytHits}/${processedItems.length} (Rest fällt auf die Plattform-Hauptseite zurück).`);

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
