require('dotenv').config({ path: '.env.local' });
const axios = require('axios');

async function testOpenRouterModels() {
    const models = [
        'meta-llama/llama-3.2-3b-instruct:free',
        'nousresearch/hermes-3-llama-3.1-405b:free',
        'liquid/lfm-40b:free',
        'microsoft/phi-3-mini-128k-instruct:free',
        'mistralai/mistral-7b-instruct:free',
        'qwen/qwen-2-7b-instruct:free',
        'google/gemma-2-9b-it:free',
    ];

    console.log('?? Testing OpenRouter free models...\n');

    for (const model of models) {
        try {
            console.log(`Testing: ${model}...`);
            const response = await axios.post(
                'https://openrouter.ai/api/v1/chat/completions',
                {
                    model: model,
                    messages: [{ role: 'user', content: 'Say only "OK"' }],
                    max_tokens: 10,
                },
                {
                    headers: {
                        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': 'http://localhost:3001',
                        'X-Title': 'Vocabulary Explorer',
                    },
                    timeout: 15000,
                }
            );
            console.log(`? ${model} - WORKS!`);
            console.log(`   Response: ${response.data.choices[0]?.message?.content}\n`);
        } catch (error) {
            const msg = error.response?.data?.error?.message || error.message;
            console.log(`? ${model} - FAILED: ${msg}\n`);
        }
    }
}

testOpenRouterModels();
