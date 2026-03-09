const fs = require('fs');
const path = require('path');

const EPISODES_FILE = path.join(__dirname, 'assets', 'js', 'episodes.json');
const THEMEN_DIR = path.join(__dirname, 'Themen');

function generateThemen() {
    if (!fs.existsSync(THEMEN_DIR)) {
        fs.mkdirSync(THEMEN_DIR);
    }

    if (!fs.existsSync(EPISODES_FILE)) {
        console.error('episodes.json not found!');
        return;
    }

    const data = JSON.parse(fs.readFileSync(EPISODES_FILE, 'utf-8'));
    const topics = {};

    data.items.forEach(episode => {
        const cat = episode.category || 'Allgemein';
        if (!topics[cat]) {
            topics[cat] = [];
        }
        topics[cat].push(episode.title);
    });

    for (const [topic, titles] of Object.entries(topics)) {
        const filePath = path.join(THEMEN_DIR, `${topic}.txt`);
        fs.writeFileSync(filePath, titles.join('\n') + '\n', 'utf-8');
    }

    console.log('Themen erfolgreich extrahiert.');
}

generateThemen();
