const Parser = require('rss-parser');
const parser = new Parser({
  maxItems: 200 // Erhöhen, um sicherzustellen, dass alle Episoden aus großen Feeds geladen werden
});
const FEED_URL = 'https://anchor.fm/s/107c46c58/podcast/rss';

exports.handler = async function(event, context) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*', // Erlaubt Anfragen von jeder Herkunft
  };

  try {
    const feed = await parser.parseURL(FEED_URL);

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
        description: item.contentSnippet,
        content: item.content,
        enclosure: item.enclosure,
        categories: item.categories
      }))
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error('Error fetching or parsing RSS feed in Netlify Function:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to fetch RSS feed' }),
    };
  }
};