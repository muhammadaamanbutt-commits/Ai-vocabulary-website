require('dotenv').config({ path: '.env.local' });
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;

app.get('/api/words/:term', async (req, res) => {
    const term = req.params.term;

    const prompt = `You are generating structured lexical data for an associative dictionary app.
For the word or concept: "${term}"

Return ONLY valid JSON (no markdown, no commentary) matching this exact shape:

{
  "definition": "one concise sentence",
  "extended_explanation": "2-4 sentences of deeper context",
  "is_ai_generated": true,
  "examples": [
    { "domain": "everyday speech", "sentence": "..." },
    { "domain": "science", "sentence": "..." },
    { "domain": "art", "sentence": "..." },
    { "domain": "technology", "sentence": "..." },
    { "domain": "relationships", "sentence": "..." },
    { "domain": "philosophy", "sentence": "..." }
  ],
  "relations": [
    { "word": "...", "relation_type": "synonym", "closeness": 0.9 },
    { "word": "...", "relation_type": "contrast", "closeness": 0.3 },
    { "word": "...", "relation_type": "metaphorical", "closeness": 0.6 },
    { "word": "...", "relation_type": "technical", "closeness": 0.5 },
    { "word": "...", "relation_type": "emotional", "closeness": 0.7 },
    { "word": "...", "relation_type": "historical", "closeness": 0.4 }
  ],
  "next_exploration_prompts": [
    "a short curiosity-sparking phrase",
    "another one",
    "another one"
  ]
}

Rules:
- relation_type must be one of: synonym, contrast, metaphorical, technical, emotional, historical.
- closeness is your own estimate of semantic distance from 0 (very distant) to 1 (very close).
- Provide 5-7 example sentences total across different domains.
- Provide 3-5 next_exploration_prompts.
- Do not include any text outside the JSON object.`;

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                }),
            }
        );

        const data = await response.json();
        console.log('Gemini raw response:', JSON.stringify(data, null, 2));
        const rawText = data.candidates[0].content.parts[0].text;
        const parsed = JSON.parse(rawText);

        res.json(parsed);
    } catch (err) {
        console.error('Error calling Gemini:', err);
        res.status(500).json({ error: 'Failed to generate word data' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});