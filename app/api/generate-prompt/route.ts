import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { FALLBACK_SPEAKING, FALLBACK_WRITING, FALLBACK_READING } from '@/lib/fallbackPrompts';

const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const exam = searchParams.get('exam') || 'PTE';
  const type = searchParams.get('type') || 'read-aloud';

  // 1. If API Key is present, call Gemini to generate a dynamic prompt
  if (apiKey) {
    try {
      const ai = new GoogleGenerativeAI(apiKey);
      const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });

      let systemPrompt = '';
      if (exam === 'PTE' && type === 'read-aloud') {
        systemPrompt = `
          Generate a random paragraph (about 50-70 words) for a PTE "Read Aloud" speaking task.
          The paragraph should be academic, using sophisticated vocabulary and structures (CEFR B2-C1 level) on topics like history, science, nature, technology, or human psychology.
          Format the output strictly as raw JSON with this key:
          {
            "text": "Paragraph content goes here..."
          }
          Do not include any markdown formatting, backticks, or extra text. Output only valid JSON.
        `;
      } else if (exam === 'PTE' && type === 'repeat-sentence') {
        systemPrompt = `
          Generate a single random English sentence (about 10-15 words) for a PTE "Repeat Sentence" task.
          The sentence should sound like a typical university announcement, academic instruction, or campus request.
          Format the output strictly as raw JSON with this key:
          {
            "text": "Sentence content goes here."
          }
          Do not include any markdown formatting, backticks, or extra text. Output only valid JSON.
        `;
      } else if (exam === 'IELTS' && type === 'cue-card') {
        systemPrompt = `
          Generate a random topic description for an IELTS Speaking Section 2 "Cue Card" (Long Turn) prompt.
          Provide a core topic description (e.g. "Describe a memorable journey you took") and 4 bullet points that guide the candidate on what to say.
          Format the output strictly as raw JSON with this schema:
          {
            "topic": "Describe a...",
            "bulletPoints": [
              "Bullet point 1",
              "Bullet point 2",
              "Bullet point 3",
              "Bullet point 4"
            ]
          }
          Do not include any markdown formatting, backticks, or extra text. Output only valid JSON.
        `;
      } else if (exam === 'PTE' && type === 'essay') {
        systemPrompt = `
          Generate a random argument essay prompt suitable for the PTE Write Essay task.
          The prompt must request discussing a controversial issue (e.g. technology, urban growth, education systems) and asking the candidate to state their opinion.
          Provide:
          - "title": A short 3-5 word title representing the topic
          - "prompt": The actual essay instruction paragraph
          - "minWords": 200
          - "maxWords": 300
          - "timeMinutes": 20
          
          Format the output strictly as raw JSON with this schema:
          {
            "title": "Topic Title",
            "prompt": "Full essay question text...",
            "minWords": 200,
            "maxWords": 300,
            "timeMinutes": 20
          }
          Do not include any markdown formatting, backticks, or extra text. Output only valid JSON.
        `;
      } else if (exam === 'IELTS' && type === 'essay') {
        systemPrompt = `
          Generate a random argumentative essay prompt suitable for the IELTS Academic Writing Task 2.
          The prompt must discuss a controversial topic and ask the candidate to discuss both sides, present an opinion, or agree/disagree.
          Provide:
          - "title": A short 3-5 word title representing the topic
          - "prompt": The actual essay instruction paragraph
          - "minWords": 250
          - "maxWords": 500
          - "timeMinutes": 40

          Format the output strictly as raw JSON with this schema:
          {
            "title": "Topic Title",
            "prompt": "Full essay question text...",
            "minWords": 250,
            "maxWords": 500,
            "timeMinutes": 40
          }
          Do not include any markdown formatting, backticks, or extra text. Output only valid JSON.
        `;
      } else if (exam === 'PTE' && type === 'fill-blanks') {
        systemPrompt = `
          Generate a reading passage (about 60-80 words) for a PTE "Fill in the Blanks" task.
          The paragraph must contain 3 blank slots designated as [1], [2], and [3].
          Provide:
          - "title": Title of the passage
          - "text": The paragraph text containing [1], [2], [3]
          - "blanks": A dictionary where keys are "1", "2", "3". Each blank must specify:
            - "correct": The correct English word (CEFR level B2/C1 academic vocabulary)
            - "options": An array of 4 strings containing the correct word and 3 other plausible, grammatically matching but contextually incorrect distractor words.
          
          Format the output strictly as raw JSON matching this structure:
          {
            "title": "Passage Title",
            "text": "Rain is liquid water... that have [1] from atmospheric water vapor...",
            "blanks": {
              "1": { "correct": "correctWord1", "options": ["correctWord1", "distractor1", "distractor2", "distractor3"] },
              "2": { "correct": "correctWord2", "options": ["distractor1", "correctWord2", "distractor2", "distractor3"] },
              "3": { "correct": "correctWord3", "options": ["distractor1", "distractor2", "correctWord3", "distractor3"] }
            }
          }
          Do not include any markdown formatting, backticks, or extra text. Output only valid JSON.
        `;
      } else if (exam === 'IELTS' && type === 'passage') {
        systemPrompt = `
          Generate a short reading passage (about 120-150 words) and two multiple-choice comprehension questions for the IELTS Academic Reading task.
          Provide:
          - "title": Title of the passage
          - "passage": The passage text
          - "questions": An array of two objects. Each question object must have:
            - "id": number (1 or 2)
            - "q": The question string
            - "options": An array of 4 option strings
            - "correctIdx": The index (0, 1, 2, or 3) of the correct option inside the options array.
          
          Format the output strictly as raw JSON matching this structure:
          {
            "title": "Passage Title",
            "passage": "Full passage text goes here...",
            "questions": [
              {
                "id": 1,
                "q": "Question text here?",
                "options": ["Option 0", "Option 1", "Option 2", "Option 3"],
                "correctIdx": 1
              },
              {
                "id": 2,
                "q": "Another question text here?",
                "options": ["Option 0", "Option 1", "Option 2", "Option 3"],
                "correctIdx": 2
              }
            ]
          }
          Do not include any markdown formatting, backticks, or extra text. Output only valid JSON.
        `;
      } else {
        return NextResponse.json({ error: 'Unsupported exam or type combination' }, { status: 400 });
      }

      const response = await model.generateContent(systemPrompt);
      const text = response.response.text().trim();
      
      // Clean JSON formatting if Gemini wrapped it in markdown backticks
      const cleanJson = text.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
      const parsedData = JSON.parse(cleanJson);
      
      // For PTE Fill Blanks, ensure the keys of the blanks object are numeric in type or parsed cleanly
      if (exam === 'PTE' && type === 'fill-blanks' && parsedData.blanks) {
        const numericBlanks: Record<number, any> = {};
        Object.keys(parsedData.blanks).forEach((key) => {
          numericBlanks[Number(key)] = parsedData.blanks[key];
        });
        parsedData.blanks = numericBlanks;
      }

      return NextResponse.json(parsedData);
    } catch (e) {
      console.error('Gemini prompt generation failed. Falling back to static database.', e);
    }
  }

  // 2. Fallback Mode (No API key or generation failed)
  // Pull a random item from our expanded fallbackPrompts library
  try {
    if (exam === 'PTE') {
      if (type === 'read-aloud') {
        const pool = FALLBACK_SPEAKING.PTE['read-aloud'];
        const chosen = pool[Math.floor(Math.random() * pool.length)];
        return NextResponse.json({ text: chosen });
      } else if (type === 'repeat-sentence') {
        const pool = FALLBACK_SPEAKING.PTE['repeat-sentence'];
        const chosen = pool[Math.floor(Math.random() * pool.length)];
        return NextResponse.json({ text: chosen });
      } else if (type === 'essay') {
        const pool = FALLBACK_WRITING.PTE;
        const chosen = pool[Math.floor(Math.random() * pool.length)];
        return NextResponse.json(chosen);
      } else if (type === 'fill-blanks') {
        const pool = FALLBACK_READING.PTE;
        const chosen = pool[Math.floor(Math.random() * pool.length)];
        return NextResponse.json(chosen);
      }
    } else if (exam === 'IELTS') {
      if (type === 'cue-card') {
        const pool = FALLBACK_SPEAKING.IELTS['cue-card'];
        const chosen = pool[Math.floor(Math.random() * pool.length)];
        return NextResponse.json(chosen);
      } else if (type === 'essay') {
        const pool = FALLBACK_WRITING.IELTS;
        const chosen = pool[Math.floor(Math.random() * pool.length)];
        return NextResponse.json(chosen);
      } else if (type === 'passage') {
        const pool = FALLBACK_READING.IELTS;
        const chosen = pool[Math.floor(Math.random() * pool.length)];
        return NextResponse.json(chosen);
      }
    }

    return NextResponse.json({ error: 'Prompt fallback could not locate chosen type.' }, { status: 500 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed retrieving static prompt fallback.', details: err.message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
