const Parser = require('rss-parser');
const fs = require('fs');

const parser = new Parser();
const FEED_URL = 'https://anchor.fm/s/107c46c58/podcast/rss';
const OUTPUT_PATH = 'assets/js/episodes.json';

(async () => {
  try {
    console.log('Fetching RSS feed...');
    const feed = await parser.parseURL(FEED_URL);
    
    // Mimic the structure of the old rss2json.com API response
    const data = {
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
        title: item.title,
        pubDate: item.pubDate,
        link: item.link,
        guid: item.guid,
        author: item.author,
        thumbnail: item.itunes.image,
        description: item.contentSnippet, // This is what was used as summary
        content: item.content,
        enclosure: item.enclosure,
        categories: item.categories
      }))
    };

    console.log(`Fetched ${data.items.length} episodes.`);

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(data, null, 2));
    console.log(`Successfully wrote episodes to ${OUTPUT_PATH}`);
  } catch (error) {
    console.error('Error fetching or parsing RSS feed:', error);
    process.exit(1);
  }
})();