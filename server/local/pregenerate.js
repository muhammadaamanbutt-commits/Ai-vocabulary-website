require('dotenv').config({ path: '.env.local' });
const fs = require('fs').promises;
const path = require('path');
const { generateVocabularyData } = require('./aiProviders');

const CACHE_FILE = path.join(__dirname, 'cache', 'words-cache.json');
const COMMON_WORDS_FILE = path.join(__dirname, 'common-words.json');

async function loadCache() {
    try {
        const data = await fs.readFile(CACHE_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return {};
    }
}

async function saveCache(cache) {
    await fs.writeFile(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf8');
}

async function pregenerateCommonWords() {
    console.log('?? Starting pre-generation of common words...\n');

    // Load existing cache
    let cache = await loadCache();
    console.log(`?? Current cache size: ${Object.keys(cache).length} words\n`);

    // Load common words list
    const commonWordsData = await fs.readFile(COMMON_WORDS_FILE, 'utf8');
    const commonWords = JSON.parse(commonWordsData);
    console.log(`?? Found ${commonWords.length} common words to process\n`);

    let generated = 0;
    let skipped = 0;
    let failed = 0;

    for (let i = 0; i < commonWords.length; i++) {
        const word = commonWords[i].toLowerCase().trim();
        
        // Skip if already cached
        if (cache[word]) {
            console.log(`??  [${i + 1}/${commonWords.length}] Skipping "${word}" (already cached)`);
            skipped++;
            continue;
        }

        try {
            console.log(`?? [${i + 1}/${commonWords.length}] Generating "${word}"...`);
            
            const { data, provider } = await generateVocabularyData(word);
            
            cache[word] = {
                ...data,
                cached: true,
                provider: provider,
                generated_at: new Date().toISOString(),
            };

            generated++;
            console.log(`? [${i + 1}/${commonWords.length}] Success with ${provider}\n`);

            // Save cache every 5 words to prevent data loss
            if (generated % 5 === 0) {
                await saveCache(cache);
                console.log(`?? Checkpoint: Saved ${generated} new words\n`);
            }

            // Add delay to avoid hitting rate limits
            await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay

        } catch (error) {
            console.error(`? [${i + 1}/${commonWords.length}] Failed "${word}":`, error.message);
            failed++;
            
            // If rate limited, wait longer before continuing
            if (error.message?.includes('rate_limit') || error.message?.includes('429')) {
                console.log('? Rate limit detected. Waiting 60 seconds before continuing...\n');
                await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 1 minute
            } else {
                // For other errors, short delay
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }
    }

    // Final save
    await saveCache(cache);

    console.log('\n? Pre-generation complete!');
    console.log(`?? Summary:`);
    console.log(`   - Generated: ${generated} words`);
    console.log(`   - Skipped (already cached): ${skipped} words`);
    console.log(`   - Failed: ${failed} words`);
    console.log(`   - Total cache size: ${Object.keys(cache).length} words`);
}

// Run pre-generation
pregenerateCommonWords().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
