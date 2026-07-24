require('dotenv').config({ path: '.env.local' });
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const { generateVocabularyData } = require('./aiProviders');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;
const CACHE_FILE = path.join(__dirname, 'cache', 'words-cache.json');

// Load cache from file
async function loadCache() {
    try {
        const data = await fs.readFile(CACHE_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.log('?? Creating new cache file');
        return {};
    }
}

// Save cache to file
async function saveCache(cache) {
    try {
        await fs.writeFile(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf8');
        console.log('?? Cache saved successfully');
    } catch (error) {
        console.error('? Error saving cache:', error.message);
    }
}

// In-memory cache
let wordCache = {};

// Initialize cache on startup
(async () => {
    wordCache = await loadCache();
    console.log(`?? Loaded ${Object.keys(wordCache).length} cached words`);
})();

app.get('/api/words/:term', async (req, res) => {
    const term = req.params.term.toLowerCase().trim();

    try {
        // Check cache first
        if (wordCache[term]) {
            console.log(`? Cache hit for "${term}"`);
            return res.json({ ...wordCache[term], cached: true });
        }

        console.log(`?? Cache miss for "${term}", calling AI providers...`);

        // Generate new data with fallback providers
        const { data, provider } = await generateVocabularyData(term);
        
        // Add metadata
        const result = {
            ...data,
            cached: false,
            provider: provider,
            generated_at: new Date().toISOString(),
        };

        // Save to cache
        wordCache[term] = result;
        await saveCache(wordCache);

        console.log(`? Generated and cached "${term}" using ${provider}`);
        res.json(result);

    } catch (err) {
        console.error('? Error generating word data:', err.message);
        
        // Check if we have any cached data to return as fallback
        const cachedWords = Object.keys(wordCache);
        if (cachedWords.length > 0) {
            return res.status(503).json({ 
                error: 'All AI providers are currently rate limited. Try searching for cached words or wait a moment.',
                details: err.message,
                cached_words_available: cachedWords.length,
                suggestion: 'Try: ' + cachedWords.slice(0, 5).join(', ')
            });
        }

        res.status(500).json({ 
            error: 'Failed to generate word data. All AI providers failed.',
            details: err.message 
        });
    }
});

// New endpoint: Get cache statistics
app.get('/api/cache/stats', async (req, res) => {
    res.json({
        total_cached_words: Object.keys(wordCache).length,
        cached_words: Object.keys(wordCache).sort(),
    });
});

// New endpoint: Get all cached words (for pre-population)
app.get('/api/cache/words', async (req, res) => {
    res.json(wordCache);
});

// New endpoint: Clear cache (for development)
app.delete('/api/cache/clear', async (req, res) => {
    wordCache = {};
    await saveCache(wordCache);
    res.json({ message: 'Cache cleared successfully' });
});

app.listen(PORT, () => {
    console.log(`?? Server running on http://localhost:${PORT}`);
    console.log(`?? Cache: ${Object.keys(wordCache).length} words loaded`);
    console.log(`?? AI Providers configured:`);
    console.log(`   - Groq: ${process.env.GROQ_API_KEY ? '?' : '?'}`);
    console.log(`   - OpenRouter: ${process.env.OPENROUTER_API_KEY ? '?' : '?'}`);
    console.log(`   - Hugging Face: ${process.env.HUGGINGFACE_API_KEY ? '?' : '?'}`);
    console.log(`   - Together AI: ${process.env.TOGETHER_API_KEY ? '?' : '?'}`);
    console.log(`   - DeepInfra: ${process.env.DEEPINFRA_API_KEY ? '?' : '?'}`);
});
