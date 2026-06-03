import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

// Mock database of standard academic vocabulary for fallback
const STATIC_VOCAB_DB: Record<string, any> = {
  ephemeral: {
    word: "ephemeral",
    definition: "Lasting for a very short time; transient or fleeting.",
    synonyms: ["transient", "fleeting", "short-lived", "evanescent"],
    example: "The beauty of autumn leaves is ephemeral, lasting only a few weeks.",
    level: "C1"
  },
  condensed: {
    word: "condensed",
    definition: "Made denser or more concise; expressed in fewer words.",
    synonyms: ["abridged", "compressed", "concentrated", "summarized"],
    example: "The professor gave a condensed version of his three-hour lecture in thirty minutes.",
    level: "B2"
  },
  suitable: {
    word: "suitable",
    definition: "Right or appropriate for a particular person, purpose, or situation.",
    synonyms: ["appropriate", "fitting", "proper", "becoming"],
    example: "These boots are suitable for hiking in rough mountainous terrain.",
    level: "B1"
  },
  responsible: {
    word: "responsible",
    definition: "Having an obligation to do something, or having control over or care for someone.",
    synonyms: ["accountable", "liable", "trustworthy", "dutiful"],
    example: "The department head is responsible for managing the project budget.",
    level: "B2"
  },
  democratized: {
    word: "democratized",
    definition: "Made accessible to everyone.",
    synonyms: ["popularized", "shared", "opened up"],
    example: "The internet has democratized access to university-level education.",
    level: "C1"
  },
  pivotal: {
    word: "pivotal",
    definition: "Of crucial importance in relation to the development or success of something else.",
    synonyms: ["crucial", "critical", "essential", "key", "vital"],
    example: "The signing of the contract was a pivotal moment for the startup's growth.",
    level: "C1"
  }
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const word = searchParams.get('word')?.trim().toLowerCase() || '';
  const suggest = searchParams.get('suggest') === 'true';

  if (!word && !suggest) {
    return NextResponse.json({ error: 'Word parameter or suggest=true is required' }, { status: 400 });
  }

  // 1. If API Key is present, call Gemini
  if (apiKey) {
    try {
      const ai = new GoogleGenerativeAI(apiKey);
      const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });

      let prompt = '';
      if (suggest) {
        prompt = `
          Suggest a random advanced English vocabulary word suitable for IELTS band 7.0-9.0 or PTE score 65-90.
          The word should be an advanced academic term (CEFR level C1 or C2).
          Provide:
          - "word": The word itself (lowercase, e.g. "corroborate")
          - "definition": Clear, simple definition
          - "synonyms": Array of 3-4 synonyms
          - "example": A short example sentence using the word
          - "level": Approximate CEFR language proficiency level (C1 or C2)

          Format output strictly as raw JSON matching this structure:
          {
            "word": "word",
            "definition": "definition text",
            "synonyms": ["synonym1", "synonym2", ...],
            "example": "example sentence",
            "level": "C1"
          }
          Do not wrap in markdown tags. Do not output anything else.
        `;
      } else {
        prompt = `
          Return a JSON response containing vocabulary details for the English word: "${word}".
          Provide:
          - "word": The word itself (lowercase)
          - "definition": Clear, simple definition
          - "synonyms": Array of 3-4 synonyms
          - "example": A short example sentence using the word
          - "level": Approximate CEFR language proficiency level (e.g. B1, B2, C1, C2)

          Format output strictly as raw JSON matching this structure:
          {
            "word": "word",
            "definition": "definition text",
            "synonyms": ["synonym1", "synonym2", ...],
            "example": "example sentence",
            "level": "C1"
          }
          Do not wrap in markdown tags. Do not output anything else.
        `;
      }

      const response = await model.generateContent(prompt);
      const text = response.response.text().trim();
      
      // Clean JSON if model returned markdown backticks
      const cleanJson = text.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
      const parsedData = JSON.parse(cleanJson);
      
      return NextResponse.json(parsedData);
    } catch (e) {
      console.error('Gemini Vocab Helper API failed, falling back to static database', e);
    }
  }

  // 2. Fallback Mode: lookup static DB or select random
  if (suggest) {
    const fallbackList = [
      {
        word: "corroborate",
        definition: "Confirm or give support to a statement, theory, or finding.",
        synonyms: ["confirm", "verify", "validate", "substantiate"],
        example: "The witness was able to corroborate the suspect's alibi.",
        level: "C1"
      },
      {
        word: "ambivalent",
        definition: "Having mixed feelings or contradictory ideas about something.",
        synonyms: ["uncertain", "undecided", "conflicted", "equivocal"],
        example: "She was ambivalent about her new job offer, as it paid more but required long hours.",
        level: "B2"
      },
      {
        word: "plethora",
        definition: "A large or excessive amount of something.",
        synonyms: ["abundance", "excess", "surplus", "profusion"],
        example: "The library offers a plethora of resources for research students.",
        level: "C1"
      },
      {
        word: "pragmatic",
        definition: "Dealing with things sensibly and realistically in a practical way.",
        synonyms: ["practical", "realistic", "sensible", "down-to-earth"],
        example: "A pragmatic approach to the problem is needed rather than ideological debates.",
        level: "B2"
      },
      {
        word: "capricious",
        definition: "Given to sudden and unaccountable changes of mood or behavior.",
        synonyms: ["fickle", "inconstant", "unpredictable", "volatile"],
        example: "The administration of dictatorial rulers is often capricious and unjust.",
        level: "C2"
      },
      {
        word: "ubiquitous",
        definition: "Present, appearing, or found everywhere.",
        synonyms: ["omnipresent", "pervasive", "everywhere", "widespread"],
        example: "Mobile phones have become ubiquitous in modern society.",
        level: "C1"
      }
    ];

    const randomWordObj = fallbackList[Math.floor(Math.random() * fallbackList.length)];
    return NextResponse.json(randomWordObj);
  }

  const lowercaseWord = word.toLowerCase();
  if (STATIC_VOCAB_DB[lowercaseWord]) {
    return NextResponse.json(STATIC_VOCAB_DB[lowercaseWord]);
  }

  return NextResponse.json({
    word,
    definition: `Detailed academic definition of '${word}'. (Connect your GEMINI_API_KEY to retrieve live dictionaries)`,
    synonyms: [`synonym of ${word}`, `analogous to ${word}`],
    example: `This is an example sentence demonstrating how to use the word '${word}' in a scholarly context.`,
    level: "B2"
  });
}
export const dynamic = 'force-dynamic';
