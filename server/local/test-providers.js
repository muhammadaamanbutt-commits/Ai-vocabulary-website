require('dotenv').config({ path: '.env.local' });
const { generateVocabularyData } = require('./aiProviders');

async function testProviders() {
    console.log('🧪 Testing AI Providers with word "test"...\n');
    
    try {
        const result = await generateVocabularyData('test');
        console.log('\n✅ SUCCESS!');
        console.log('Provider used:', result.provider);
        console.log('Data received:', JSON.stringify(result.data, null, 2));
    } catch (error) {
        console.error('\n❌ ALL PROVIDERS FAILED');
        console.error('Error:', error.message);
        console.error('\nFull error:', error);
    }
}

testProviders();