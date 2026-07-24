require('dotenv').config({ path: '.env.local' });
const { generateVocabularyData } = require('./aiProviders');

async function testWordCount() {
    console.log('🧪 TESTING WORD COUNT ENFORCEMENT\n');
    console.log('Testing 3 words to verify 20-35 word count...\n');
    console.log('='.repeat(70));
    
    const testWords = ['technology', 'artificial intelligence', 'innovation'];
    
    for (const word of testWords) {
        console.log(`\n📝 Testing word: "${word}"`);
        console.log('-'.repeat(70));
        
        try {
            const result = await generateVocabularyData(word);
            
            // Count words in main definition
            const mainDef = result.data.definition;
            const mainWords = mainDef.trim().split(/\s+/);
            const mainCount = mainWords.length;
            
            // Count words in field definitions
            const field1Def = result.data.field_definitions[0].definition;
            const field1Words = field1Def.trim().split(/\s+/);
            const field1Count = field1Words.length;
            
            const field2Def = result.data.field_definitions[1].definition;
            const field2Words = field2Def.trim().split(/\s+/);
            const field2Count = field2Words.length;
            
            // Check related words
            const relatedCount = result.data.related_words.length;
            
            console.log('\n📊 RESULTS:');
            console.log(`\nMain Definition (${mainCount} words):`);
            console.log(`"${mainDef}"`);
            console.log(mainCount >= 20 && mainCount <= 35 ? '✅ CORRECT (20-35 words)' : `❌ WRONG (${mainCount} words)`);
            
            console.log(`\nField 1 - ${result.data.field_definitions[0].field} (${field1Count} words):`);
            console.log(`"${field1Def}"`);
            console.log(field1Count >= 20 && field1Count <= 35 ? '✅ CORRECT (20-35 words)' : `❌ WRONG (${field1Count} words)`);
            
            console.log(`\nField 2 - ${result.data.field_definitions[1].field} (${field2Count} words):`);
            console.log(`"${field2Def}"`);
            console.log(field2Count >= 20 && field2Count <= 35 ? '✅ CORRECT (20-35 words)' : `❌ WRONG (${field2Count} words)`);
            
            console.log(`\nRelated Words: ${relatedCount}`);
            console.log(relatedCount === 20 ? '✅ CORRECT (exactly 20)' : `❌ WRONG (${relatedCount} words)`);
            
            // Check for duplicates
            const uniqueCheck = new Set(result.data.related_words.map(w => w.toLowerCase()));
            const hasDuplicates = uniqueCheck.size !== result.data.related_words.length;
            console.log(`Unique words: ${hasDuplicates ? '❌ HAS DUPLICATES' : '✅ ALL UNIQUE'}`);
            
            // Final verdict
            const allCorrect = (mainCount >= 20 && mainCount <= 35) &&
                              (field1Count >= 20 && field1Count <= 35) &&
                              (field2Count >= 20 && field2Count <= 35) &&
                              (relatedCount === 20) &&
                              (!hasDuplicates);
            
            console.log('\n' + '='.repeat(70));
            if (allCorrect) {
                console.log('🎉 PERFECT! All validations passed for "' + word + '"');
            } else {
                console.log('❌ FAILED! Some validations failed for "' + word + '"');
            }
            console.log('='.repeat(70));
            
        } catch (error) {
            console.error(`\n❌ ERROR for "${word}": ${error.message}`);
            console.log('='.repeat(70));
        }
        
        // Wait 2 seconds between tests to avoid rate limits
        if (word !== testWords[testWords.length - 1]) {
            console.log('\n⏳ Waiting 2 seconds before next test...\n');
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    console.log('\n\n🏁 TEST COMPLETE!');
}

testWordCount();
