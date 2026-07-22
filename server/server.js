const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;

app.get('/api/words/:term', async (req, res) => {
    const term = req.params.term;

    try {
        // Fetch data from multiple Datamuse API endpoints
        const [
            definitionResponse,
            synonymsResponse,
            triggersResponse,
            rhymesResponse,
            adjsResponse,
            antonymsResponse
        ] = await Promise.all([
            fetch(`https://api.datamuse.com/words?sp=${encodeURIComponent(term)}&md=d&max=1`),
            fetch(`https://api.datamuse.com/words?rel_syn=${encodeURIComponent(term)}&max=10`),
            fetch(`https://api.datamuse.com/words?rel_trg=${encodeURIComponent(term)}&max=10`),
            fetch(`https://api.datamuse.com/words?rel_rhy=${encodeURIComponent(term)}&max=5`),
            fetch(`https://api.datamuse.com/words?rel_jjb=${encodeURIComponent(term)}&max=5`),
            fetch(`https://api.datamuse.com/words?rel_ant=${encodeURIComponent(term)}&max=5`)
        ]);

        const [defData, synData, trgData, rhyData, adjData, antData] = await Promise.all([
            definitionResponse.json(),
            synonymsResponse.json(),
            triggersResponse.json(),
            rhymesResponse.json(),
            adjsResponse.json(),
            antonymsResponse.json()
        ]);

        // Extract definition
        const definition = defData[0]?.defs?.[0]?.replace(/^[a-z]+\t/, '') || `A word related to ${term}`;
        
        // Build relations from various Datamuse endpoints
        const relations = [];
        
        // Add synonyms
        synData.slice(0, 3).forEach(item => {
            relations.push({
                word: item.word,
                relation_type: 'synonym',
                closeness: Math.min((item.score || 1000) / 100000, 1)
            });
        });
        
        // Add antonyms as contrasts
        antData.slice(0, 2).forEach(item => {
            relations.push({
                word: item.word,
                relation_type: 'contrast',
                closeness: 0.3
            });
        });
        
        // Add triggers as metaphorical
        trgData.slice(0, 2).forEach(item => {
            relations.push({
                word: item.word,
                relation_type: 'metaphorical',
                closeness: 0.6
            });
        });
        
        // Add adjectives as emotional
        adjData.slice(0, 2).forEach(item => {
            relations.push({
                word: item.word,
                relation_type: 'emotional',
                closeness: 0.7
            });
        });

        // Generate example sentences
        const examples = [
            { domain: 'everyday speech', sentence: `The ${term} was used in everyday conversation.` },
            { domain: 'science', sentence: `Scientists study the concept of ${term} in their research.` },
            { domain: 'art', sentence: `Artists often explore ${term} through their creative work.` },
            { domain: 'technology', sentence: `Technology has changed how we understand ${term}.` },
            { domain: 'relationships', sentence: `Understanding ${term} is important in relationships.` }
        ];

        // Generate exploration prompts from related words
        const explorationWords = [...synData.slice(0, 2), ...trgData.slice(0, 2)];
        const next_exploration_prompts = explorationWords.length > 0
            ? explorationWords.slice(0, 3).map(w => `Explore: ${w.word}`)
            : [`What is related to ${term}?`, `Similar concepts to ${term}`, `Opposite of ${term}`];

        const result = {
            definition,
            extended_explanation: `The word "${term}" connects to various related concepts and has multiple contextual meanings across different domains.`,
            is_ai_generated: false,
            examples,
            relations,
            next_exploration_prompts
        };

        res.json(result);
    } catch (err) {
        console.error('Error calling Datamuse API:', err);
        res.status(500).json({ error: 'Failed to generate word data' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});