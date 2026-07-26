// Mock data for local development
// Fetched from live API at https://ai-vocabulary-website.vercel.app
// Last updated: 2026-07-26

export const mockWordData = {
  resilient: {
    definition: "Resilient refers to the ability to withstand and recover from adversity, characterized by flexibility and strength, enabling individuals to cope with challenges",
    related_words: [
      "adaptable",
      "strong",
      "flexible",
      "tough",
      "hardy",
      "robust",
      "durable",
      "unbreakable",
      "buoyant",
      "elastic",
      "rebound",
      "revive",
      "renew",
      "regain",
      "restore",
      "rebuild",
      "fortify",
      "bolster",
      "stabilize",
      "sustain"
    ],
    field_definitions: [
      {
        field: "Psychology",
        definition: "Resilient in psychology involves cognitive and emotional processes, enabling individuals to navigate stressful situations, through which they develop coping strategies and maintain mental well-being"
      },
      {
        field: "Materials Science",
        definition: "Resilient materials are characterized by their ability to absorb and distribute energy, involving elastic deformation, which enables them to withstand impacts and return to their original shape"
      }
    ],
    is_ai_generated: true,
    provider_used: "Mock Data",
    cached: false,
    generated_at: "2026-07-26T21:09:52.856Z"
  },

  ubiquitous: {
    definition: "Ubiquitous refers to the state of being widespread, characterized by presence everywhere, involving omnipresence, through which it achieves universal coverage",
    related_words: [
      "omnipresent",
      "pervasive",
      "widespread",
      "universal",
      "common",
      "prevalent",
      "everywhere",
      "global",
      "all-encompassing",
      "inclusive",
      "extensive",
      "comprehensive",
      "far-reaching",
      "pervading",
      "recurring",
      "persistent",
      "ubiquity",
      "omnipotence",
      "all-pervading",
      "universality"
    ],
    field_definitions: [
      {
        field: "Technology",
        definition: "Ubiquitous technology involves devices or systems being omnipresent, characterized by connectivity, through which it enables seamless interaction and universal access"
      },
      {
        field: "Ecology",
        definition: "Ubiquitous species refers to organisms that are widespread, involving adaptability, through which they achieve extensive distribution and pervasive presence in various ecosystems"
      }
    ],
    is_ai_generated: true,
    provider_used: "Mock Data",
    cached: false,
    generated_at: "2026-07-26T21:09:53.225Z"
  },

  ephemeral: {
    definition: "Ephemeral refers to something transitory, characterized by fleeting existence, involving brief duration, in order to emphasize impermanence, which enables appreciation of temporary experiences",
    related_words: [
      "transient",
      "fleeting",
      "temporary",
      "impermanent",
      "short-lived",
      "momentary",
      "ephemeron",
      "fragile",
      "volatile",
      "unstable",
      "transitory",
      "passing",
      "fugacious",
      "evanescent",
      "ethereal",
      "intangible",
      "insubstantial",
      "unenduring",
      "fugitive",
      "concept"
    ],
    field_definitions: [
      {
        field: "Philosophy",
        definition: "In philosophy, ephemeral refers to the transient nature of human experiences, involving impermanence, through which existential meaning is derived, in order to understand life's fleeting moments"
      },
      {
        field: "Biology",
        definition: "In biology, ephemeral describes organisms with short life cycles, characterized by rapid growth, involving adaptation, in order to survive, which enables species to thrive in dynamic environments"
      }
    ],
    is_ai_generated: true,
    provider_used: "Mock Data",
    cached: false,
    generated_at: "2026-07-26T21:09:52.801Z"
  },

  serendipity: {
    definition: "Serendipity refers to the occurrence of finding something valuable or delightful when least expected, characterized by chance encounters and unexpected discoveries, which enables personal growth and new experiences",
    related_words: [
      "coincidence",
      "happenstance",
      "luck",
      "chance",
      "fate",
      "discovery",
      "exploration",
      "adventure",
      "surprise",
      "delight",
      "wonder",
      "enchantment",
      "magic",
      "fortune",
      "opportunity",
      "encounter",
      "experience",
      "unexpected",
      "pleasant",
      "surprising"
    ],
    field_definitions: [
      {
        field: "Psychology",
        definition: "Serendipity in psychology involves the process of unconscious pattern recognition, through which individuals make unexpected connections, leading to creative insights and innovative problem-solving strategies"
      },
      {
        field: "Philosophy",
        definition: "Serendipity in philosophy is characterized by the concept of existential luck, where individuals encounter unexpected events, which enables them to re-evaluate their beliefs, values, and purpose in life, leading to personal transformation"
      }
    ],
    is_ai_generated: true,
    provider_used: "Mock Data",
    cached: false,
    generated_at: "2026-07-26T21:09:52.909Z"
  }
};

/**
 * Get mock data for a given word
 * @param {string} word - The word to fetch data for
 * @returns {Promise<Object>} - Promise resolving to the word data
 */
export function getMockWordData(word) {
  // Normalize the word to lowercase for lookup
  const normalizedWord = word.toLowerCase().trim();
  
  // Simulate network delay (200-500ms)
  const delay = Math.random() * 300 + 200;
  
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (mockWordData[normalizedWord]) {
        resolve(mockWordData[normalizedWord]);
      } else {
        // Return a generic response for unknown words
        resolve({
          definition: `${word} is a term that requires further exploration and understanding, characterized by its context-dependent meaning, which enables diverse interpretations across various domains and applications`,
          related_words: [
            "concept",
            "theory",
            "practice",
            "approach",
            "method",
            "system",
            "process",
            "technique",
            "strategy",
            "principle",
            "framework",
            "model",
            "application",
            "implementation",
            "analysis",
            "evaluation",
            "development",
            "research",
            "study",
            "examination"
          ],
          field_definitions: [
            {
              field: "General",
              definition: `In a general context, ${word} represents a concept that involves various aspects and characteristics, through which understanding is developed and knowledge is gained across multiple perspectives`
            },
            {
              field: "Applied Context",
              definition: `In applied contexts, ${word} demonstrates practical applications and implementations, characterized by real-world usage, through which theoretical concepts are translated into tangible outcomes and results`
            }
          ],
          is_ai_generated: true,
          provider_used: "Mock Data (Fallback)",
          cached: false,
          generated_at: new Date().toISOString()
        });
      }
    }, delay);
  });
}
