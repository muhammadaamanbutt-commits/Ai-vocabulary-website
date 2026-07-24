require('dotenv').config({ path: '.env.local' });
const { generateVocabularyData } = require('./aiProviders');

async function testDefinitionLength() {
    console.log('🧪 Testing definition word count with word "innovation"...\n');
    
    try {
        const result = await generateVocabularyData('innovation');
        console.log('\n✅ SUCCESS!');
        console.log('Provider used:', result.provider);
        
        // Count words in main definition
        const mainDef = result.data.definition;
        const mainWordCount = mainDef.split(/\s+/).length;
        
        console.log('\n📊 MAIN DEFINITION:');
        console.log(`"${mainDef}"`);
        console.log(`Word count: ${mainWordCount} words`);
        console.log(`Status: ${mainWordCount >= 20 && mainWordCount <= 35 ? '✅ CORRECT (20-35 words)' : `❌ WRONG (need 20-35, got ${mainWordCount})`}`);
        
        // Count words in field definitions
        console.log('\n📊 FIELD DEFINITIONS:');
        result.data.field_definitions.forEach((field, index) => {
            const fieldWordCount = field.definition.split(/\s+/).length;
            console.log(`\n${index + 1}. ${field.field}:`);
            console.log(`   "${field.definition}"`);
            console.log(`   Word count: ${fieldWordCount} words`);
            console.log(`   Status: ${fieldWordCount >= 20 && fieldWordCount <= 35 ? '✅ CORRECT (20-35 words)' : `❌ WRONG (need 20-35, got ${fieldWordCount})`}`);
        });
        
        // Summary
        const field1Count = result.data.field_definitions[0].definition.split(/\s+/).length;
        const field2Count = result.data.field_definitions[1].definition.split(/\s+/).length;
        
        const allCorrect = (mainWordCount >= 20 && mainWordCount <= 35) &&
                          (field1Count >= 20 && field1Count <= 35) &&
                          (field2Count >= 20 && field2Count <= 35);
        
        console.log('\n' + '='.repeat(60));
        if (allCorrect) {
            console.log('🎉 PERFECT! All definitions are between 20-35 words!');
        } else {
            console.log('⚠️  Some definitions are outside the 20-35 word range.');
            console.log('The AI needs to follow instructions better.');
        }
        console.log('='.repeat(60));
        
    } catch (error) {
        console.error('\n❌ FAILED');
        console.error('Error:', error.message);
    }
}

testDefinitionLength();
