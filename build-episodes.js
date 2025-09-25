const Parser = require('rss-parser');
const fs = require('fs');
const path = require('path');

const parser = new Parser();
const FEED_URL = 'https://anchor.fm/s/107c46c58/podcast/rss';
const EPISODES_JSON_PATH = path.join('assets', 'js', 'episodes.json');
const EPISODEN_HTML_PATH = 'episoden.html';
const EPISODE_TEMPLATE_PATH = 'episode-template.html';
const EPISODES_DIR = 'episoden';
const SITEMAP_PATH = 'sitemap.xml';
const BASE_URL = 'https://wissens-akku.com';

const slugify = (text) => {
  return text
    .toString()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
};

(async () => {
  try {
    console.log('Fetching RSS feed...');
    const feed = await parser.parseURL(FEED_URL);

    // --- 1. Generate episodes.json ---
    const jsonData = {
      status: 'ok',
      feed: {
        url: feed.feedUrl,
        title: feed.title,
        link: feed.link,
        author: feed.author,
        description: feed.description,
        image: feed.image ? feed.image.url : ''
      },
      items: feed.items.map(item => ({
        title: item.title.trim(),
        pubDate: item.pubDate,
        link: item.link,
        guid: item.guid,
        author: item.author,
        thumbnail: item.itunes.image,
        description: item.contentSnippet,
        content: item.content,
        enclosure: item.enclosure,
        categories: item.categories
      }))
    };
    fs.writeFileSync(EPISODES_JSON_PATH, JSON.stringify(jsonData, null, 2));
    console.log(`Successfully wrote episodes to ${EPISODES_JSON_PATH}`);

    // --- 2. Update JSON-LD in episoden.html ---
    console.log(`Reading ${EPISODEN_HTML_PATH}...`);
    let episodenHtml = fs.readFileSync(EPISODEN_HTML_PATH, 'utf8');

    const episodesForJsonLd = jsonData.items.map(item => ({
      '@type': 'PodcastEpisode',
      name: item.title,
      url: item.link,
      description: item.description,
      datePublished: new Date(item.pubDate).toISOString(),
      partOfSeries: {
        '@type': 'PodcastSeries',
        name: 'Wissens-Akku',
        url: `${BASE_URL}/`
      }
    }));

    const podcastSeriesJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'PodcastSeries',
      name: 'Wissens-Akku',
      url: `${BASE_URL}/`,
      description: jsonData.feed.description,
      author: 'Wissens-Akku',
      episode: episodesForJsonLd
    };

    const jsonLdString = JSON.stringify(podcastSeriesJsonLd, null, 2);
    
    // Replace the existing script content
    const regex = /<script type="application\/ld\+json">[\s\S]*?<\/script>/;
    const newScript = `<script type="application/ld+json">
${jsonLdString}
    </script>`;
    
    if (regex.test(episodenHtml)) {
        episodenHtml = episodenHtml.replace(regex, newScript);
        fs.writeFileSync(EPISODEN_HTML_PATH, episodenHtml);
        console.log(`Successfully updated JSON-LD in ${EPISODEN_HTML_PATH}`);
    } else {
        console.error('Could not find JSON-LD script tag in episoden.html');
    }

    // --- 3. Generate individual episode pages ---
    console.log('Generating individual episode pages...');
    if (!fs.existsSync(EPISODES_DIR)){
        fs.mkdirSync(EPISODES_DIR);
        console.log(`Created directory: ${EPISODES_DIR}`);
    }
    const templateHtml = fs.readFileSync(EPISODE_TEMPLATE_PATH, 'utf8');

    jsonData.items.forEach(item => {
      const slug = slugify(item.title);
      const episodeUrl = `${BASE_URL}/${EPISODES_DIR}/${slug}.html`;
      
      const episodeJsonLd = {
        "@context": "https://schema.org",
        "@type": "PodcastEpisode",
        "name": item.title,
        "url": episodeUrl,
        "description": item.description,
        "datePublished": new Date(item.pubDate).toISOString(),
        "partOfSeries": {
          "@type": "PodcastSeries",
          "name": "Wissens-Akku",
          "url": `${BASE_URL}/`
        },
        "audio": {
          "@type": "AudioObject",
          "contentUrl": item.enclosure.url,
          "encodingFormat": item.enclosure.type
        },
        "image": item.thumbnail
      };

      let newPageHtml = templateHtml
        .replace(/%%EPISODE_TITEL%%/g, item.title)
        .replace(/%%EPISODE_DATUM%%/g, new Date(item.pubDate).toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' }))
        .replace(/%%EPISODE_BESCHREIBUNG%%/g, item.description)
        .replace(/%%EPISODE_URL%%/g, episodeUrl)
        .replace(/%%EPISODE_BILD_URL%%/g, item.thumbnail)
        .replace(/%%EPISODE_AUDIO_URL%%/g, item.enclosure.url)
        .replace(/%%EPISODE_INHALT%%/g, item.content)
        .replace('%%JSON_LD_SCHEMA%%', JSON.stringify(episodeJsonLd, null, 2));

      fs.writeFileSync(path.join(EPISODES_DIR, `${slug}.html`), newPageHtml);
    });
    console.log(`Successfully generated ${jsonData.items.length} episode pages in /${EPISODES_DIR}/`);


    // --- 4. Generate sitemap.xml ---
    console.log('Generating sitemap.xml...');
    const today = new Date().toISOString().split('T')[0];
    let sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${BASE_URL}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${BASE_URL}/episoden.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
`;
    // Add each episode to the sitemap
    jsonData.items.forEach(item => {
        // Create a simple slug from the title
        const slug = slugify(item.title);
        const episodeUrl = `${BASE_URL}/${EPISODES_DIR}/${slug}.html`;
        sitemapContent += `  <url>
    <loc>${episodeUrl}</loc>
    <lastmod>${new Date(item.pubDate).toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
`;
    });

    sitemapContent += `  <url>
    <loc>${BASE_URL}/impressum.html</loc>
    <lastmod>2025-09-20</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>${BASE_URL}/datenschutz.html</loc>
    <lastmod>2025-09-20</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
</urlset>`;

    fs.writeFileSync(SITEMAP_PATH, sitemapContent);
    console.log(`Successfully generated ${SITEMAP_PATH}`);

  } catch (error) {
    console.error('Error during build process:', error);
    process.exit(1);
  }
})();
