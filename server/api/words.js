require('dotenv').config({ path: '../.env' });
const Groq = require('groq-sdk');
const axios = require('axios');

// Import Vercel KV for caching
let kv = null;
let kvEnabled = false;

try {
    const { kv: vercelKV } = require('@vercel/kv');
    kv = vercelKV;
    kvEnabled = true;
} catch (error) {
    console.log('⚠️  Vercel KV not available (running locally or KV not configured)');
    kvEnabled = false;
}

// ============================================================================
// HELPER FUNCTIONS (Ported from server/local/aiProviders.js)
// ============================================================================

// Generate the prompt for vocabulary data
function generatePrompt(term) {
    return `You are generating structured lexical data for a vocabulary exploration app.
For the word or concept: "${term}"

Return ONLY valid JSON (no markdown, no commentary, no code blocks) matching this exact shape:

{
  "definition": "A comprehensive definition with detailed context and explanation",
  "related_words": ["word1", "word2", "word3", ... exactly 20 single words],
  "field_definitions": [
    {
      "field": "Field Name",
      "definition": "Field-specific definition with technical context and detailed explanation"
    },
    {
      "field": "Another Field Name",
      "definition": "Another field-specific definition with context and detailed explanation"
    }
  ],
  "is_ai_generated": true
}

🚨 CRITICAL WORD COUNT REQUIREMENT: 20-35 WORDS FOR EVERY DEFINITION 🚨

You MUST write DETAILED, COMPREHENSIVE definitions. SHORT definitions will be REJECTED.

❌ BAD EXAMPLE (only 8 words - REJECTED):
"Backup is a copy of data stored separately."

✅ GOOD EXAMPLE (28 words - ACCEPTED):
"Backup refers to the systematic process of creating duplicate copies of important data, files, or system configurations, which are stored in separate locations to ensure data recovery and business continuity in case of loss, corruption, or system failure."

HOW TO WRITE 20-35 WORD DEFINITIONS:
✓ Include PURPOSE and CONTEXT (why it exists, what problem it solves)
✓ Add CHARACTERISTICS and PROPERTIES (key features, attributes)
✓ Mention WHERE/HOW it's used or applied (practical applications, domains)
✓ Describe IMPACT, EFFECTS, or SIGNIFICANCE (what it achieves, why it matters)
✓ Use connecting phrases: "characterized by", "involving", "through which", "in order to", "which enables"

MANDATORY RULES:
1. "definition" (MAIN): Must be 20-35 words. Include context, characteristics, applications, purpose, and significance.

2. "related_words": EXACTLY 20 UNIQUE single words only. NO DUPLICATES ALLOWED. Each word must be completely different and semantically related to "${term}".

3. "field_definitions": EXACTLY 2 field-specific definitions. EACH field definition MUST ALSO BE 20-35 WORDS with technical context, domain-specific terminology, and detailed explanations.

4. COUNT YOUR WORDS CAREFULLY. If a definition has fewer than 20 words, ADD more descriptive details. If over 35 words, trim slightly.

5. Pure JSON only - no markdown, no code blocks, no comments.

⚠️ VERIFICATION CHECKLIST BEFORE RESPONDING:
□ Main definition: 20-35 words? _____ words
□ Field definition 1: 20-35 words? _____ words  
□ Field definition 2: 20-35 words? _____ words
□ All 20 related words are UNIQUE (no duplicates)?
□ Pure JSON format with no markdown?`;
}

// Enforce 20-35 word count for definitions
function enforceWordCount(text, minWords = 20, maxWords = 35) {
    const words = text.trim().split(/\s+/);
    const wordCount = words.length;
    
    if (wordCount < minWords) {
        // Too short - cannot fix, throw error to regenerate
        throw new Error(`Definition too short: ${wordCount} words (minimum ${minWords})`);
    }
    
    if (wordCount > maxWords) {
        // Too long - truncate to exactly 35 words
        const truncated = words.slice(0, maxWords).join(' ');
        console.log(`⚠️  Truncated definition from ${wordCount} to ${maxWords} words`);
        return truncated;
    }
    
    // Perfect length
    return text;
}

// Validate and fix all definitions in the data
function validateDefinitions(data, term) {
    try {
        // Validate main definition
        const mainWordCount = data.definition.trim().split(/\s+/).length;
        console.log(`📊 Main definition: ${mainWordCount} words`);
        data.definition = enforceWordCount(data.definition, 20, 35);
        
        // Validate field definitions
        if (data.field_definitions && Array.isArray(data.field_definitions)) {
            data.field_definitions = data.field_definitions.map((field, index) => {
                const fieldWordCount = field.definition.trim().split(/\s+/).length;
                console.log(`📊 Field ${index + 1} (${field.field}): ${fieldWordCount} words`);
                field.definition = enforceWordCount(field.definition, 20, 35);
                return field;
            });
        }
        
        console.log(`✅ All definitions validated: 20-35 words`);
        return data;
    } catch (error) {
        console.error(`❌ Definition validation failed: ${error.message}`);
        throw error;
    }
}

// Post-process to ensure unique words and exactly 20 words
function ensureUniqueWords(data, term) {
    if (!data.related_words || !Array.isArray(data.related_words)) {
        return data;
    }

    const originalLength = data.related_words.length;
    
    // Remove duplicates (case-insensitive)
    const uniqueWords = [];
    const seenWords = new Set();
    
    for (const word of data.related_words) {
        const lowerWord = word.toLowerCase().trim();
        // Skip if duplicate or same as the search term
        if (!seenWords.has(lowerWord) && lowerWord !== term.toLowerCase().trim()) {
            uniqueWords.push(word);
            seenWords.add(lowerWord);
        }
    }

    const duplicatesRemoved = originalLength - uniqueWords.length;
    
    // If we have less than 20 unique words, generate additional related words
    const fallbackWords = [
        'concept', 'theory', 'practice', 'approach', 'method', 'system', 'process',
        'technique', 'strategy', 'principle', 'framework', 'model', 'application',
        'implementation', 'analysis', 'evaluation', 'development', 'research',
        'study', 'examination', 'investigation', 'exploration', 'understanding',
        'aspect', 'element', 'component', 'factor', 'dimension', 'perspective',
        'characteristic', 'feature', 'attribute', 'quality', 'property', 'trait'
    ];

    // Add fallback words if needed
    for (const fallback of fallbackWords) {
        if (uniqueWords.length >= 20) break;
        if (!seenWords.has(fallback.toLowerCase()) && fallback.toLowerCase() !== term.toLowerCase().trim()) {
            uniqueWords.push(fallback);
            seenWords.add(fallback.toLowerCase());
        }
    }

    // Ensure exactly 20 words (slice to 20 if more, or use what we have if less)
    data.related_words = uniqueWords.slice(0, 20);
    
    if (duplicatesRemoved > 0) {
        console.log(`✅ Deduplication: ${originalLength} words → ${uniqueWords.length} unique words (removed ${duplicatesRemoved} duplicates including search term)`);
    } else {
        console.log(`✅ No duplicates found - all ${uniqueWords.length} words are unique`);
    }
    
    return data;
}

// Clean API response from markdown wrappers
function cleanResponse(text) {
    return text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
}

// ============================================================================
// PROVIDER FUNCTIONS
// ============================================================================

// Provider 1: Groq (Primary - Fastest, but has limits)
async function callGroq(term) {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    
    const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: generatePrompt(term) }],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
        max_tokens: 2000,
    });

    const rawText = completion.choices[0]?.message?.content || '{}';
    const data = JSON.parse(cleanResponse(rawText));
    const validated = validateDefinitions(data, term);
    return ensureUniqueWords(validated, term);
}

// Provider 2: Groq Alternative Model (Smaller, faster, more quota)
async function callGroqSmall(term) {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    
    const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: generatePrompt(term) }],
        model: 'llama-3.1-8b-instant', // Smaller model, much higher rate limits
        temperature: 0.7,
        max_tokens: 2000,
    });

    const rawText = completion.choices[0]?.message?.content || '{}';
    const data = JSON.parse(cleanResponse(rawText));
    const validated = validateDefinitions(data, term);
    return ensureUniqueWords(validated, term);
}

// Provider 3: Hugging Face Inference API (Generous free tier)
async function callHuggingFace(term) {
    try {
        const response = await axios.post(
            'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3',
            {
                inputs: generatePrompt(term),
                parameters: {
                    max_new_tokens: 2000,
                    temperature: 0.7,
                    return_full_text: false,
                },
                options: {
                    wait_for_model: true,
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                timeout: 90000, // 90 seconds for model loading
            }
        );

        let rawText = '';
        if (Array.isArray(response.data) && response.data[0]?.generated_text) {
            rawText = response.data[0].generated_text;
        } else if (response.data?.generated_text) {
            rawText = response.data.generated_text;
        } else {
            rawText = '{}';
        }
        
        const data = JSON.parse(cleanResponse(rawText));
        const validated = validateDefinitions(data, term);
        return ensureUniqueWords(validated, term);
    } catch (error) {
        // Retry with different model if first fails
        if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
            throw error; // Don't retry network errors
        }
        
        // Try alternative HF model
        const response = await axios.post(
            'https://api-inference.huggingface.co/models/meta-llama/Llama-3.2-3B-Instruct',
            {
                inputs: generatePrompt(term),
                parameters: {
                    max_new_tokens: 2000,
                    temperature: 0.7,
                    return_full_text: false,
                },
                options: {
                    wait_for_model: true,
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                timeout: 90000,
            }
        );

        let rawText = '';
        if (Array.isArray(response.data) && response.data[0]?.generated_text) {
            rawText = response.data[0].generated_text;
        } else if (response.data?.generated_text) {
            rawText = response.data.generated_text;
        } else {
            rawText = '{}';
        }
        
        const data = JSON.parse(cleanResponse(rawText));
        const validated = validateDefinitions(data, term);
        return ensureUniqueWords(validated, term);
    }
}

// ============================================================================
// MAIN FALLBACK LOGIC
// ============================================================================

// Cache TTL: 30 days in seconds
const CACHE_TTL = 30 * 24 * 60 * 60;

// Generate cache key for a term
function generateCacheKey(term) {
    return `vocab:${term.toLowerCase().trim()}`;
}

// Try to get data from cache
async function getCachedData(term) {
    if (!kvEnabled || !kv) {
        return null;
    }

    try {
        const cacheKey = generateCacheKey(term);
        const cached = await kv.get(cacheKey);
        
        if (cached) {
            console.log(`✅ Cache hit for term: "${term}"`);
            return {
                ...cached,
                cached: true,
                generated_at: cached.generated_at || new Date().toISOString()
            };
        }
        
        console.log(`❌ Cache miss for term: "${term}"`);
        return null;
    } catch (error) {
        console.error('⚠️  Cache read error:', error.message);
        return null; // Fail gracefully - proceed to generate
    }
}

// Store data in cache
async function setCachedData(term, data) {
    if (!kvEnabled || !kv) {
        return;
    }

    try {
        const cacheKey = generateCacheKey(term);
        const dataToCache = {
            ...data,
            generated_at: new Date().toISOString()
        };
        
        await kv.set(cacheKey, dataToCache, { ex: CACHE_TTL });
        console.log(`✅ Cached data for term: "${term}" (TTL: ${CACHE_TTL}s)`);
    } catch (error) {
        console.error('⚠️  Cache write error:', error.message);
        // Don't throw - caching failure shouldn't break the response
    }
}

async function generateVocabularyData(term) {
    const providers = [
        { name: 'Groq (70B)', fn: callGroq, enabled: !!process.env.GROQ_API_KEY },
        { name: 'Groq (8B Fast)', fn: callGroqSmall, enabled: !!process.env.GROQ_API_KEY },
        { name: 'Hugging Face', fn: callHuggingFace, enabled: !!process.env.HUGGINGFACE_API_KEY },
    ];

    let lastError = null;
    let errors = [];

    for (const provider of providers) {
        if (!provider.enabled) {
            console.log(`⏭️  Skipping ${provider.name} (no API key)`);
            continue;
        }

        try {
            console.log(`🔄 Trying ${provider.name}...`);
            const result = await provider.fn(term);
            console.log(`✅ Success with ${provider.name}`);
            return { data: result, provider: provider.name };
        } catch (error) {
            const errorMsg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
            console.error(`❌ ${provider.name} failed:`, errorMsg);
            
            errors.push({
                provider: provider.name,
                error: errorMsg,
            });
            
            lastError = error;
            
            // Check if it's a rate limit error
            if (error.message?.includes('rate_limit') || 
                error.message?.includes('429') || 
                error.response?.status === 429 ||
                error.response?.data?.error?.code === 'rate_limit_exceeded') {
                console.log(`⏳ Rate limit hit on ${provider.name}, trying next provider...`);
                continue;
            }
            
            // Network timeout or server errors - try next
            if (error.code === 'ECONNABORTED' || 
                error.code === 'ETIMEDOUT' ||
                error.code === 'ENOTFOUND' ||
                error.response?.status >= 500) {
                console.log(`🔌 Network/Server error on ${provider.name}, trying next provider...`);
                continue;
            }
            
            // For other errors, still try next provider
            continue;
        }
    }

    // All providers failed
    console.error('\n📊 Summary of all failures:');
    errors.forEach(e => {
        console.error(`   - ${e.provider}: ${e.error}`);
    });
    
    throw new Error(`All AI providers failed. Last error: ${lastError?.message || 'Unknown error'}`);
}

// ============================================================================
// VERCEL SERVERLESS HANDLER
// ============================================================================

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { term, fresh } = req.query;

    if (!term) {
        return res.status(400).json({ error: 'Term parameter is required' });
    }

    try {
        console.log(`\n🚀 Fetching vocabulary data for: "${term}"`);
        
        // Check if fresh data is requested (cache bypass)
        const bypassCache = fresh === 'true' || fresh === '1';
        
        if (bypassCache) {
            console.log('⚡ Cache bypass requested (fresh=true)');
        }
        
        // Try to get cached data first (unless bypassing)
        if (!bypassCache) {
            const cachedData = await getCachedData(term);
            if (cachedData) {
                console.log(`✅ Returning cached data for: "${term}"`);
                return res.status(200).json(cachedData);
            }
        }
        
        // Cache miss or bypass - generate fresh data
        console.log(`🔄 Generating fresh vocabulary data for: "${term}"`);
        const { data, provider } = await generateVocabularyData(term);
        
        console.log(`✅ Successfully generated data using ${provider}`);
        
        // Prepare response with metadata
        const responseData = {
            ...data,
            provider_used: provider,
            cached: false,
            generated_at: new Date().toISOString()
        };
        
        // Store in cache for future requests
        await setCachedData(term, responseData);
        
        // Return the data
        res.status(200).json(responseData);
    } catch (error) {
        console.error('❌ Error generating vocabulary data:', error);
        
        res.status(500).json({ 
            error: 'Failed to generate word data',
            details: error.message,
            message: 'All AI providers failed. Please try again later or contact support if the issue persists.'
        });
    }
};
