/**
 * generate-episode-pages.js
 *
 * Erzeugt aus assets/js/episodes.json:
 *   - pro Episode eine indexierbare Detailseite  episode/<safe_title>.html
 *   - pro Kategorie eine Übersichtsseite          kategorie/<slug>.html
 *   - eine aktualisierte sitemap.xml
 *
 * Läuft als fester Teil von `npm run build` direkt nach update-episodes.js.
 * Jede neue Folge bekommt so automatisch ihre Seite – ohne manuelle Pflege.
 *
 * Cookiefrei: Audio läuft über einen nativen <audio>-Player mit preload="none"
 * (lädt erst nach Klick). Spotify/Apple/YouTube werden nur VERLINKT (kein iframe).
 */

const fs = require('fs');
const path = require('path');

// --- Konfiguration ---
const ROOT = __dirname;
const EPISODES_JSON = path.join(ROOT, 'assets', 'js', 'episodes.json');
const EPISODE_DIR = path.join(ROOT, 'episode');
const CATEGORY_DIR = path.join(ROOT, 'kategorie');
const SITEMAP_PATH = path.join(ROOT, 'sitemap.xml');
const SITE_URL = 'https://wissens-akku.com';

// Offizielle Marken-Icons als einheitliche Inline-SVGs (24x24) – ersetzen die uneinheitlichen PNG-Logos
const ICON_SPOTIFY = '<svg class="w-16 h-16" viewBox="0 0 24 24" aria-hidden="true"><path fill="#1ED760" d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.561.3z"/></svg>';
const ICON_APPLE = '<svg class="w-16 h-16" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="apgrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E862E9"/><stop offset="1" stop-color="#7C2DBE"/></linearGradient></defs><rect width="24" height="24" rx="5.4" fill="url(#apgrad)"/><path fill="#ffffff" d="M11.446 4.06c2.176 0 4.144.844 5.62 2.394 1.13 1.176 1.766 2.42 2.09 4.06.112.546.112 2.03.006 2.642a7.852 7.852 0 0 1-2.99 4.888c-.452.338-1.54.982-1.694 1.002-.05.006-.056-.052-.034-.382l.024-.388.49-.392c2.242-1.796 3.342-4.628 2.882-7.424-.646-3.928-4.466-6.666-8.452-6.146-3.262.426-5.842 2.936-6.36 6.19-.46 2.788.64 5.6 2.882 7.38l.49.392.024.388c.02.328.014.388-.034.382-.154-.02-1.242-.664-1.694-1.002a7.85 7.85 0 0 1-2.99-4.888c-.106-.612-.106-2.096.006-2.642.616-2.864 2.732-5.082 5.56-5.832.654-.174 1.034-.21 1.83-.214.07 0 .128-.002.834.002zm.04 2.612c.486 0 .954.096 1.388.29 1.388.616 2.278 1.992 2.278 3.516 0 .84-.282 1.608-.832 2.266-.314.376-.36.412-.36.282 0-.068.038-.148.13-.28.514-.728.642-1.652.348-2.502-.464-1.338-1.87-2.172-3.246-1.926-1.15.206-2.062 1.09-2.316 2.244-.194.876-.02 1.782.486 2.5.054.076.058.108.024.144-.058.062-.108.034-.25-.134a3.31 3.31 0 0 1-.776-2.124c0-1.394.822-2.632 2.106-3.174.348-.146.748-.246 1.16-.25l.16-.002zm-.012 1.78c.236 0 .402.026.61.124.456.208.762.61.858 1.122.11.596-.11 1.218-.582 1.606l-.11.09.194 2.792c.11 1.604.11 1.688.056 1.882-.098.36-.374.638-.734.748-.194.056-.748.056-.942 0-.36-.11-.636-.388-.734-.748-.054-.194-.054-.278.056-1.882l.194-2.792-.11-.09c-.472-.388-.692-1.01-.582-1.606.118-.638.66-1.15 1.302-1.232l.13-.008z"/></svg>';
const ICON_YOUTUBE = '<svg class="w-16 h-16" viewBox="0 0 24 24" aria-hidden="true"><path fill="#FF0000" d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>';

// --- Hilfsfunktionen ---
function stripHtml(html) {
  if (!html) return '';
  return String(html)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function truncate(text, len) {
  if (!text) return '';
  text = String(text);
  return text.length <= len ? text : text.slice(0, len - 1).trimEnd() + '…';
}

function durationToISO(d) {
  if (!d) return '';
  const parts = String(d).split(':').map(n => parseInt(n, 10));
  let h = 0, m = 0, s = 0;
  if (parts.length === 3) { h = parts[0]; m = parts[1]; s = parts[2]; }
  else if (parts.length === 2) { m = parts[0]; s = parts[1]; }
  else if (parts.length === 1) { s = parts[0]; }
  if ([h, m, s].some(n => isNaN(n))) return '';
  let out = 'PT';
  if (h) out += h + 'H';
  if (m) out += m + 'M';
  if (s) out += s + 'S';
  return out === 'PT' ? '' : out;
}

function formatDateDE(pubDate) {
  const d = new Date(pubDate);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });
}

function categorySlug(cat) {
  return String(cat || 'Allgemein').toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// Gemeinsamer Kopf (head). pathPrefix = '../' (Seiten liegen in Unterordnern).
function renderHead(o) {
  return `<!DOCTYPE html>
<html lang="de" class="scroll-smooth">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${o.title} | Wissens-Akku</title>
    <link rel="icon" href="../Bilder/wissenakku-logo.png">
    <link rel="apple-touch-icon" href="../Bilder/wissenakku-logo.png">
    <link rel="alternate" type="application/rss+xml" title="Wissens-Akku Podcast" href="https://anchor.fm/s/107c46c58/podcast/rss">
    <meta name="theme-color" content="#0F172A">
    <meta name="description" content="${o.metaDesc}">
    <link rel="canonical" href="${o.canonical}">

    <meta property="og:type" content="${o.ogType || 'website'}">
    <meta property="og:url" content="${o.canonical}">
    <meta property="og:title" content="${o.title}">
    <meta property="og:description" content="${o.metaDesc}">
    <meta property="og:image" content="${o.image}">

    <meta property="twitter:card" content="summary">
    <meta property="twitter:title" content="${o.title}">
    <meta property="twitter:description" content="${o.metaDesc}">
    <meta property="twitter:image" content="${o.image}">

    <link href="../assets/css/local-fonts.css" rel="stylesheet">
    <link href="../assets/css/tailwind.css" rel="stylesheet">
    <style>
        .episode-content p { margin-bottom: 1rem; }
        .episode-content a { color: #22D3EE; text-decoration: underline; }
        .episode-content a:hover { color: #06B6D4; }
    </style>
${o.jsonLd}</head>`;
}

function renderHeaderFooter() {
  return {
    header: `
<body class="bg-gray-900 text-white font-sans flex flex-col min-h-screen">

    <div class="fixed inset-0 z-[-10] bg-cover" style="background-image: url('../Bilder/hintergrund.jpg'); background-position: right bottom;">
        <div class="absolute inset-0 bg-brand-dark/80"></div>
    </div>

    <header
        class="fixed top-0 left-0 right-0 bg-brand-dark/80 backdrop-blur-md z-50 border-b border-gray-700/50 text-brand-accent-400">
        <div class="container mx-auto px-6 py-4 flex justify-between items-center">
            <a href="../index.html#home" class="flex items-center space-x-2">
                <img src="../Bilder/wissenakku-logo.png" alt="Wissens-Akku Logo" class="h-8 w-8 rounded-full">
                <span class="text-xl font-heading font-bold">Wissens-Akku</span>
            </a>
            <nav class="hidden md:flex items-center space-x-6">
                <a href="../episoden.html" class="text-lg hover:text-brand-accent-400 transition-colors pb-1">Episoden</a>
                <a href="../wissens-explorer.html" class="text-lg hover:text-brand-accent-400 transition-colors pb-1">Wissens-Explorer</a>
                <a href="../das-projekt.html" class="text-lg hover:text-brand-accent-400 transition-colors pb-1">Das Projekt</a>
                <a href="../index.html#follow" class="bg-brand-accent-500 text-white font-bold py-2 px-6 rounded-lg text-lg hover:bg-brand-accent-600 transition-transform hover:scale-105 transform no-underline">Folgen</a>
            </nav>
            <button id="mobile-menu-button" class="md:hidden p-2" aria-label="Menü öffnen">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
            </button>
        </div>
        <div id="mobile-menu" class="hidden bg-brand-dark border-t border-gray-700/50 absolute left-0 right-0 top-full shadow-lg pb-4">
            <a href="../episoden.html" class="block py-2 px-6 text-sm hover:bg-gray-800">Episoden</a>
            <a href="../wissens-explorer.html" class="block py-2 px-6 text-sm hover:bg-gray-800">Wissens-Explorer</a>
            <a href="../das-projekt.html" class="block py-2 px-6 text-sm hover:bg-gray-800">Das Projekt</a>
            <a href="../index.html#follow" class="block py-2 px-6 text-sm hover:bg-gray-800">Folgen</a>
        </div>
    </header>`,
    footer: `
    <footer class="bg-brand-dark/80 border-t border-gray-700/50 mt-24">
        <div class="container mx-auto px-6 py-8 text-center text-gray-400">
            <div class="flex justify-center space-x-6 mb-4">
                <a href="../impressum.html" class="hover:text-brand-accent-400 transition-colors">Impressum</a>
                <a href="../datenschutz.html" class="hover:text-brand-accent-400 transition-colors">Datenschutzerklärung</a>
            </div>
            <p>&copy; 2026 Wissens-Akku. Alle Rechte vorbehalten.</p>
        </div>
    </footer>

    <script>
        document.addEventListener('DOMContentLoaded', function () {
            var b = document.getElementById('mobile-menu-button');
            var m = document.getElementById('mobile-menu');
            if (b && m) b.addEventListener('click', function () { m.classList.toggle('hidden'); });

            // Teilen-Button: Web-Share-API (Handy) mit Clipboard-Fallback (Desktop) – ohne Drittanbieter/Tracking
            document.querySelectorAll('.js-share').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    var url = btn.getAttribute('data-share-url');
                    var title = btn.getAttribute('data-share-title');
                    var label = btn.querySelector('.js-share-label');
                    if (navigator.share) {
                        navigator.share({ title: title, text: title, url: url }).catch(function () {});
                    } else if (navigator.clipboard) {
                        navigator.clipboard.writeText(url).then(function () {
                            if (label) {
                                var t = label.textContent;
                                label.textContent = 'Link kopiert!';
                                setTimeout(function () { label.textContent = t; }, 2000);
                            }
                        });
                    } else {
                        window.prompt('Link kopieren:', url);
                    }
                });
            });
        });
    </script>
</body>

</html>`
  };
}

function buildEpisodeJsonLd(ep, canonical, descriptionPlain) {
  const obj = {
    '@context': 'https://schema.org', '@type': 'PodcastEpisode',
    'url': canonical, 'name': ep.title, 'description': truncate(descriptionPlain, 500),
    'inLanguage': 'de',
    'partOfSeries': { '@type': 'PodcastSeries', 'name': 'Wissens-Akku', 'url': SITE_URL + '/' }
  };
  if (ep.isoDate) obj.datePublished = ep.isoDate;
  return obj;
}

function buildBreadcrumbLd(items) {
  return {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    'itemListElement': items.map((it, i) => ({
      '@type': 'ListItem', 'position': i + 1, 'name': it.name, 'item': it.url
    }))
  };
}

function jsonLdScript(...objs) {
  return objs.map(o => `    <script type="application/ld+json">\n${JSON.stringify(o, null, 2)}\n    </script>\n`).join('');
}

// --- Themen-Verwandtschaft (alles zur Build-Zeit) ---
const STOPWORDS = new Set(['aber', 'alle', 'allem', 'allen', 'aller', 'alles', 'also', 'andere', 'anderem', 'anderen', 'anderer', 'anderes', 'auch', 'beim', 'dabei', 'dadurch', 'damit', 'dann', 'dass', 'dazu', 'dein', 'deine', 'denn', 'dessen', 'dies', 'diese', 'diesem', 'diesen', 'dieser', 'dieses', 'doch', 'dort', 'durch', 'eben', 'eigentlich', 'eine', 'einem', 'einen', 'einer', 'eines', 'einige', 'einigen', 'einiger', 'einiges', 'etwas', 'euch', 'euer', 'eure', 'euren', 'fast', 'ganz', 'gegen', 'gibt', 'habe', 'haben', 'hatte', 'hatten', 'heute', 'hier', 'ihre', 'ihrem', 'ihren', 'ihrer', 'ihres', 'immer', 'jede', 'jeden', 'jeder', 'jedes', 'jetzt', 'kann', 'kein', 'keine', 'keinen', 'können', 'könnt', 'machen', 'macht', 'mehr', 'mein', 'meine', 'müssen', 'nach', 'nicht', 'nichts', 'noch', 'nits', 'oder', 'ohne', 'schon', 'sehr', 'sein', 'seine', 'seinem', 'seinen', 'seiner', 'sich', 'sind', 'soll', 'sollen', 'sollte', 'sondern', 'über', 'unser', 'unsere', 'unten', 'unter', 'viel', 'viele', 'wann', 'waren', 'warum', 'weil', 'weiter', 'welche', 'welchem', 'welchen', 'welcher', 'welches', 'wenn', 'werden', 'wieder', 'wird', 'wirklich', 'wurde', 'wurden', 'würde', 'zwischen', 'zum', 'zur', 'wie', 'wirklich', 'man', 'sie', 'ist', 'für', 'von', 'mit', 'auf', 'aus', 'der', 'die', 'das', 'den', 'dem', 'und', 'vor', 'nur']);

function topicTokens(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/<[^>]+>/g, ' ')
    .replace(/[^a-zäöüß0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 4 && !STOPWORDS.has(w));
}

// Gewichtete Begriffs-Map einer Folge: Titel-Begriffe stark (3), Beschreibungs-Begriffe schwach (1)
function topicWeights(ep) {
  const w = new Map();
  for (const t of topicTokens(ep.title)) w.set(t, 3);
  for (const t of topicTokens(ep.description || ep.contentSnippet || ep.seo_content)) {
    if (!w.has(t)) w.set(t, 1);
  }
  return w;
}

// Verwandtschafts-Score = Summe (Gewicht A + Gewicht B) über gemeinsame Begriffe
function topicScore(a, b, idf) {
  let score = 0;
  const small = a.size <= b.size ? a : b;
  const large = a.size <= b.size ? b : a;
  for (const [t, va] of small) {
    const vb = large.get(t);
    if (vb) score += (va + vb) * (idf.get(t) || 0);
  }
  return score;
}

// --- Episoden-Detailseite ---
function renderEpisodePage(ep, related, older, newer, topicRelated) {
  const canonical = `${SITE_URL}/episode/${ep.safe_title}.html`;
  const descriptionPlain = stripHtml(ep.description || ep.contentSnippet || ep.seo_content || '');
  const metaDesc = escapeHtml(truncate(descriptionPlain, 155));
  const title = escapeHtml(ep.title);
  const category = escapeHtml(ep.category || 'Allgemein');
  const catSlug = categorySlug(ep.category);
  const date = formatDateDE(ep.pubDate);
  const duration = (ep.itunes && ep.itunes.duration) ? ep.itunes.duration.replace(/^00:/, '') : '';
  const image = escapeHtml((ep.itunes && ep.itunes.image) || (SITE_URL + '/Bilder/wissenakku-logo.png'));
  const bodyHtml = ep.seo_content || ep.content || ('<p>' + escapeHtml(ep.description || '') + '</p>');

  const spotify = ep.spotifyUrl || ep.link || 'https://open.spotify.com/show/4cvMLk6acssF3L31vMHy9H';
  const apple = (ep.appleUrl && ep.appleUrl !== '#') ? ep.appleUrl : 'https://podcasts.apple.com/de/podcast/wissens-akku/id1833243965';
  const youtube = (ep.youtubeUrl && ep.youtubeUrl !== '#') ? ep.youtubeUrl : 'https://www.youtube.com/@Wissens-Akku';
  const amazon = 'https://music.amazon.de/podcasts/99c204fa-c0bd-48fa-ba22-813accb6cc8f/wissensakku';

  const jsonLd = jsonLdScript(
    buildEpisodeJsonLd(ep, canonical, descriptionPlain),
    buildBreadcrumbLd([
      { name: 'Start', url: SITE_URL + '/' },
      { name: 'Episoden', url: SITE_URL + '/episoden.html' },
      { name: ep.category || 'Allgemein', url: `${SITE_URL}/kategorie/${catSlug}.html` },
      { name: ep.title, url: canonical }
    ])
  );

  const { header, footer } = renderHeaderFooter();

  const relatedHtml = related.map(r =>
    `                        <li><a href="${r.safe_title}.html" class="text-brand-accent-400 hover:text-brand-accent-500 hover:underline">${escapeHtml(r.title)}</a></li>`
  ).join('\n');

  const topicRelatedHtml = (topicRelated || []).map(r =>
    `                        <li><a href="${r.safe_title}.html" class="text-brand-accent-400 hover:text-brand-accent-500 hover:underline">${escapeHtml(r.title)}</a> <span class="text-gray-500 text-sm">&middot; ${escapeHtml(r.category || 'Allgemein')}</span></li>`
  ).join('\n');

  const navHtml = (older || newer) ? `
                <nav class="mt-12 pt-8 border-t border-gray-700/50 flex justify-between gap-4 text-sm" aria-label="Weitere Folgen">
                    <div class="flex-1">${older ? `<a href="${older.safe_title}.html" class="text-brand-accent-400 hover:text-brand-accent-500 hover:underline">&larr; Ältere Folge<br><span class="text-gray-400">${escapeHtml(truncate(older.title, 60))}</span></a>` : ''}</div>
                    <div class="flex-1 text-right">${newer ? `<a href="${newer.safe_title}.html" class="text-brand-accent-400 hover:text-brand-accent-500 hover:underline">Neuere Folge &rarr;<br><span class="text-gray-400">${escapeHtml(truncate(newer.title, 60))}</span></a>` : ''}</div>
                </nav>` : '';

  return renderHead({ title, metaDesc, canonical, image, ogType: 'article', jsonLd }) + header + `

    <main class="relative z-10 pt-24 flex-grow">
        <article class="container mx-auto px-6 py-12">
            <div class="max-w-3xl mx-auto">
                <nav class="text-sm text-gray-400 mb-6" aria-label="Brotkrumen">
                    <a href="../index.html" class="hover:text-brand-accent-400">Start</a>
                    <span class="mx-2">/</span>
                    <a href="../episoden.html" class="hover:text-brand-accent-400">Episoden</a>
                    <span class="mx-2">/</span>
                    <a href="../kategorie/${catSlug}.html" class="hover:text-brand-accent-400">${category}</a>
                    <span class="mx-2">/</span>
                    <span class="text-gray-300">${title}</span>
                </nav>

                <p class="text-sm text-brand-accent-400 uppercase tracking-wider mb-2">${category}</p>
                <h1 class="text-3xl md:text-4xl font-bold font-heading text-white mb-4">${title}</h1>
                <p class="text-gray-400 mb-6">${date}${duration ? ' &middot; ' + duration + ' Min.' : ''}</p>

                <div class="mb-8">
                    <button type="button" data-share-url="${escapeHtml(canonical)}" data-share-title="${title}" class="js-share inline-flex items-center gap-2 text-sm text-brand-accent-400 hover:text-white border border-gray-700 hover:border-brand-accent-500 rounded-lg px-4 py-2 transition-colors">
                        <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
                        </svg>
                        <span class="js-share-label">Folge teilen</span>
                    </button>
                </div>

                <div class="mb-10">
                    <h2 class="text-sm font-bold font-heading mb-5 text-center text-brand-accent-400 uppercase tracking-wider">Jetzt anhören</h2>
                    <div class="flex flex-wrap items-center justify-center gap-x-8 gap-y-6 sm:gap-x-12">
                        <a href="${escapeHtml(spotify)}" target="_blank" rel="noopener noreferrer" aria-label="Auf Spotify anhören" class="flex flex-col items-center gap-2 text-gray-400 hover:text-white transition-transform hover:scale-110 no-underline">
                            ${ICON_SPOTIFY}
                            <span class="text-sm font-semibold">Spotify</span>
                        </a>
                        <a href="${escapeHtml(apple)}" target="_blank" rel="noopener noreferrer" aria-label="Auf Apple Podcasts anhören" class="flex flex-col items-center gap-2 text-gray-400 hover:text-white transition-transform hover:scale-110 no-underline">
                            ${ICON_APPLE}
                            <span class="text-sm font-semibold">Apple Podcasts</span>
                        </a>
                        <a href="${escapeHtml(youtube)}" target="_blank" rel="noopener noreferrer" aria-label="Auf YouTube ansehen" class="flex flex-col items-center gap-2 text-gray-400 hover:text-white transition-transform hover:scale-110 no-underline">
                            ${ICON_YOUTUBE}
                            <span class="text-sm font-semibold">YouTube</span>
                        </a>
                        <a href="${escapeHtml(amazon)}" target="_blank" rel="noopener noreferrer" aria-label="Auf Amazon Music anhören" class="flex flex-col items-center gap-2 text-gray-400 hover:text-white transition-transform hover:scale-110 no-underline">
                            <img src="../Bilder/amazon-music-logo.svg" alt="Amazon Music" class="w-16 h-16">
                            <span class="text-sm font-semibold">Amazon Music</span>
                        </a>
                    </div>
                </div>

                <div class="episode-content text-gray-300 leading-relaxed">
                    ${bodyHtml}
                </div>
${relatedHtml ? `
                <div class="mt-12 pt-8 border-t border-gray-700/50">
                    <h2 class="text-xl font-bold font-heading text-white mb-4">Weitere Folgen aus &bdquo;${category}&ldquo;</h2>
                    <ul class="space-y-2 list-disc list-inside">
${relatedHtml}
                    </ul>
                    <p class="mt-4"><a href="../kategorie/${catSlug}.html" class="text-brand-accent-400 hover:text-brand-accent-500 hover:underline">Alle Folgen aus &bdquo;${category}&ldquo; ansehen &rarr;</a></p>
                </div>` : ''}
${topicRelatedHtml ? `
                <div class="mt-12 pt-8 border-t border-gray-700/50">
                    <h2 class="text-xl font-bold font-heading text-white mb-4">Passend zum Thema</h2>
                    <ul class="space-y-2 list-disc list-inside">
${topicRelatedHtml}
                    </ul>
                </div>` : ''}
${navHtml}
                <div class="mt-12">
                    <a href="../episoden.html" class="text-brand-accent-400 hover:text-brand-accent-500 hover:underline">&larr; Alle Episoden ansehen</a>
                </div>
            </div>
        </article>
    </main>` + footer;
}

// --- Kategorie-Übersichtsseite ---
function renderCategoryPage(catName, slug, episodes) {
  const canonical = `${SITE_URL}/kategorie/${slug}.html`;
  const title = escapeHtml(catName);
  const metaDesc = escapeHtml(truncate(`Alle ${episodes.length} Folgen aus dem Bereich ${catName} des Wissens-Akku Podcasts – faktenbasiert und verständlich erklärt.`, 155));
  const image = escapeHtml(SITE_URL + '/Bilder/wissenakku-logo.png');

  const jsonLd = jsonLdScript(
    buildBreadcrumbLd([
      { name: 'Start', url: SITE_URL + '/' },
      { name: 'Episoden', url: SITE_URL + '/episoden.html' },
      { name: catName, url: canonical }
    ])
  );

  const { header, footer } = renderHeaderFooter();

  const list = episodes.map(ep => {
    const d = formatDateDE(ep.pubDate);
    return `                    <li class="bg-gray-800/50 border border-gray-700/50 rounded-lg p-5 hover:border-brand-accent-500 transition-colors">
                        <a href="../episode/${ep.safe_title}.html" class="block no-underline">
                            <span class="text-white font-bold font-heading hover:text-brand-accent-400">${escapeHtml(ep.title)}</span>
                            ${d ? `<span class="block text-sm text-gray-400 mt-1">${d}</span>` : ''}
                        </a>
                    </li>`;
  }).join('\n');

  return renderHead({ title: title + ' – Alle Folgen', metaDesc, canonical, image, ogType: 'website', jsonLd }) + header + `

    <main class="relative z-10 pt-24 flex-grow">
        <div class="container mx-auto px-6 py-12">
            <div class="max-w-3xl mx-auto">
                <nav class="text-sm text-gray-400 mb-6" aria-label="Brotkrumen">
                    <a href="../index.html" class="hover:text-brand-accent-400">Start</a>
                    <span class="mx-2">/</span>
                    <a href="../episoden.html" class="hover:text-brand-accent-400">Episoden</a>
                    <span class="mx-2">/</span>
                    <span class="text-gray-300">${title}</span>
                </nav>

                <h1 class="text-3xl md:text-4xl font-bold font-heading text-white mb-3">${title}</h1>
                <p class="text-gray-400 mb-8">Alle ${episodes.length} Folgen aus dem Bereich &bdquo;${title}&ldquo;.</p>

                <ul class="space-y-4">
${list}
                </ul>

                <div class="mt-12">
                    <a href="../episoden.html" class="text-brand-accent-400 hover:text-brand-accent-500 hover:underline">&larr; Alle Episoden ansehen</a>
                </div>
            </div>
        </div>
    </main>` + footer;
}

function cleanDir(dir) {
  if (!fs.existsSync(dir)) { fs.mkdirSync(dir, { recursive: true }); return; }
  for (const f of fs.readdirSync(dir)) {
    if (f.endsWith('.html')) fs.unlinkSync(path.join(dir, f));
  }
}

// --- Hauptlogik ---
(function main() {
  const data = JSON.parse(fs.readFileSync(EPISODES_JSON, 'utf-8'));
  const items = (data.items || []).filter(ep => ep && ep.safe_title);

  // Nach Datum absteigend sortieren (neueste zuerst) – für Vor/Zurück-Navigation
  items.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

  cleanDir(EPISODE_DIR);
  cleanDir(CATEGORY_DIR);

  const sitemapUrls = [];

  // Themen-Verwandtschaft: gewichtete Begriffs-Maps einmalig vorberechnen
  const topicW = new Map();
  for (const ep of items) topicW.set(ep.safe_title, topicWeights(ep));

  // IDF: Begriffe, die in vielen Folgen vorkommen (z.B. "folge", "zeige"), zählen kaum;
  // seltene, spezifische Begriffe (z.B. "rosmarin", "werkzeug") zählen stark.
  const docFreq = new Map();
  for (const w of topicW.values()) {
    for (const t of w.keys()) docFreq.set(t, (docFreq.get(t) || 0) + 1);
  }
  const idf = new Map();
  for (const [t, dfreq] of docFreq) idf.set(t, Math.log(items.length / dfreq));

  // Episodenseiten
  items.forEach((ep, i) => {
    const related = items.filter(o => o.category === ep.category && o.safe_title !== ep.safe_title).slice(0, 5);

    // Thematisch verwandte Folgen (kategorieübergreifend) – ohne sich selbst und ohne die Folgen aus dem Kategorie-Block
    const exclude = new Set([ep.safe_title, ...related.map(r => r.safe_title)]);
    const wEp = topicW.get(ep.safe_title);
    const topicRelated = items
      .filter(o => !exclude.has(o.safe_title))
      .map(o => ({ ep: o, score: topicScore(wEp, topicW.get(o.safe_title), idf) }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(x => x.ep);

    const newer = items[i - 1] || null; // weiter oben = neuer
    const older = items[i + 1] || null; // weiter unten = älter
    const html = renderEpisodePage(ep, related, older, newer, topicRelated);
    fs.writeFileSync(path.join(EPISODE_DIR, `${ep.safe_title}.html`), html, 'utf-8');
    sitemapUrls.push({ loc: `${SITE_URL}/episode/${ep.safe_title}.html`, lastmod: (ep.isoDate || '').slice(0, 10), priority: '0.6' });
  });

  // Kategorie-Seiten
  const byCategory = {};
  for (const ep of items) {
    const cat = ep.category || 'Allgemein';
    (byCategory[cat] = byCategory[cat] || []).push(ep);
  }
  let catCount = 0;
  for (const cat of Object.keys(byCategory)) {
    const slug = categorySlug(cat);
    const html = renderCategoryPage(cat, slug, byCategory[cat]);
    fs.writeFileSync(path.join(CATEGORY_DIR, `${slug}.html`), html, 'utf-8');
    sitemapUrls.push({ loc: `${SITE_URL}/kategorie/${slug}.html`, lastmod: '', priority: '0.7' });
    catCount++;
  }

  // --- Sitemap ---
  const staticPages = [
    { loc: SITE_URL + '/', priority: '1.0', changefreq: 'daily' },
    { loc: SITE_URL + '/episoden.html', priority: '0.9', changefreq: 'weekly' },
    { loc: SITE_URL + '/wissens-explorer.html', priority: '0.8', changefreq: 'weekly' },
    { loc: SITE_URL + '/das-projekt.html', priority: '0.7', changefreq: 'monthly' }
  ];

  let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  for (const p of staticPages) {
    sitemap += `  <url>\n    <loc>${p.loc}</loc>\n    <changefreq>${p.changefreq}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>\n`;
  }
  for (const u of sitemapUrls) {
    sitemap += '  <url>\n    <loc>' + u.loc + '</loc>\n';
    if (u.lastmod) sitemap += '    <lastmod>' + u.lastmod + '</lastmod>\n';
    sitemap += '    <changefreq>monthly</changefreq>\n    <priority>' + u.priority + '</priority>\n  </url>\n';
  }
  sitemap += '</urlset>\n';
  fs.writeFileSync(SITEMAP_PATH, sitemap, 'utf-8');

  console.log(`[SUCCESS] ${items.length} Episodenseiten + ${catCount} Kategorie-Seiten generiert.`);
  console.log(`[SUCCESS] sitemap.xml mit ${staticPages.length + sitemapUrls.length} URLs geschrieben.`);
})();
