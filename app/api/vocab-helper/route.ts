import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { FALLBACK_VOCABULARY } from '@/lib/fallbackPrompts';

const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

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
    const randomWordObj = FALLBACK_VOCABULARY[Math.floor(Math.random() * FALLBACK_VOCABULARY.length)];
    return NextResponse.json(randomWordObj);
  }

  const lowercaseWord = word.toLowerCase();
  const matched = FALLBACK_VOCABULARY.find(x => x.word.toLowerCase() === lowercaseWord);
  if (matched) {
    return NextResponse.json(matched);
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
