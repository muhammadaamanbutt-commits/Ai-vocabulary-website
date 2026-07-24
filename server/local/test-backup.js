require('dotenv').config({ path: '.env.local' });
const { generateVocabularyData } = require('./aiProviders');

async function testBackup() {
    console.log('🧪 Testing deduplication with word "backup"...\n');
    
    try {
        const result = await generateVocabularyData('backup');
        console.log('\n✅ SUCCESS!');
        console.log('Provider used:', result.provider);
        console.log('\nRelated words:', result.data.related_words);
        console.log('\n📊 Stats:');
        console.log('  - Total words:', result.data.related_words.length);
        
        // Check for duplicates
        const uniqueCheck = new Set();
        const duplicates = [];
        result.data.related_words.forEach(word => {
            const lower = word.toLowerCase();
            if (uniqueCheck.has(lower)) {
                duplicates.push(word);
            }
            uniqueCheck.add(lower);
        });
        
        // Check if "backup" is in the list
        const hasSearchTerm = result.data.related_words.some(w => w.toLowerCase() === 'backup');
        
        console.log('  - Unique words:', uniqueCheck.size);
        console.log('  - Duplicates found:', duplicates.length > 0 ? duplicates.join(', ') : 'None');
        console.log('  - Contains search term "backup":', hasSearchTerm ? 'YES (ERROR)' : 'NO (CORRECT)');
        
        if (duplicates.length === 0 && !hasSearchTerm && result.data.related_words.length === 20) {
            console.log('\n🎉 PERFECT! All 20 words are unique and search term is excluded!');
        } else {
            console.log('\n⚠️  Issues found:');
            if (duplicates.length > 0) console.log('   - Has duplicates:', duplicates);
            if (hasSearchTerm) console.log('   - Contains search term "backup"');
            if (result.data.related_words.length !== 20) console.log('   - Not exactly 20 words');
        }
        
    } catch (error) {
        console.error('\n❌ FAILED');
        console.error('Error:', error.message);
    }
}

testBackup();
