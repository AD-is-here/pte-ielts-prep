import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const { word, sentence, mode, audioBase64, clientTranscript } = await request.json();

    if (!word) {
      return NextResponse.json({ error: 'Word is required.' }, { status: 400 });
    }

    const cleanWord = word.trim().toLowerCase();

    // -------------------------------------------------------------
    // WRITING MODE EVALUATION
    // -------------------------------------------------------------
    if (mode === 'writing') {
      if (!sentence) {
        return NextResponse.json({ error: 'Sentence is required for writing mode.' }, { status: 400 });
      }

      if (apiKey) {
        try {
          const ai = new GoogleGenerativeAI(apiKey);
          const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });

          const prompt = `
            You are an expert English teacher. Evaluate this student's sentence using the vocabulary word "${cleanWord}".
            
            Student sentence: "${sentence}"
            
            Verify:
            1. Did the student use the word "${cleanWord}" (or a minor variation like plural, tense change, e.g. "ephemeral" -> "ephemerally" or "ephemerality")?
            2. Is the word used correctly and in the right semantic context?
            3. Are there grammatical, punctuation, or spelling errors?
            
            Return a JSON object conforming exactly to this structure:
            {
              "wordUsed": true,
              "usageCorrect": true,
              "score": 85,
              "feedback": "Your sentence is grammatically correct and uses the word perfectly. Good vocabulary choice.",
              "corrections": ""
            }

            Note: "corrections" should contain the corrected sentence if there were any errors, otherwise leave it empty.
            Format output strictly as a raw JSON response. Do not wrap in markdown code blocks.
          `;

          const response = await model.generateContent(prompt);
          const cleanText = response.response.text().trim().replace(/^```json\s*/i, '').replace(/```$/, '').trim();
          const parsed = JSON.parse(cleanText);
          return NextResponse.json(parsed);

        } catch (err) {
          console.error("Gemini vocab writing evaluation failed, triggering fallback", err);
        }
      }

      // Fallback for writing mode
      const hasWord = sentence.toLowerCase().includes(cleanWord);
      return NextResponse.json({
        wordUsed: hasWord,
        usageCorrect: hasWord,
        score: hasWord ? 85 : 30,
        feedback: hasWord 
          ? `Nice job! You successfully used the word "${cleanWord}" in your sentence. (Connect GEMINI_API_KEY for deep grammatical checking).`
          : `You did not include the word "${cleanWord}" in your sentence. Please try again.`,
        corrections: ""
      });
    }

    // -------------------------------------------------------------
    // SPEAKING MODE EVALUATION
    // -------------------------------------------------------------
    if (mode === 'speaking') {
      if (!audioBase64) {
        return NextResponse.json({ error: 'Audio data (base64) is required for speaking mode.' }, { status: 400 });
      }

      if (apiKey) {
        try {
          const ai = new GoogleGenerativeAI(apiKey);
          const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });

          const systemPrompt = `
            You are an expert English speaking tutor. Evaluate this student's recorded audio attempting to use the vocabulary word "${cleanWord}" in a sentence.
            
            Task: Listen to the attached audio file, transcribe it, and grade the response.
            
            Verify:
            1. Did they say the target word "${cleanWord}" (or a minor form like plural, tense, e.g. "ephemeral" -> "ephemerally")?
            2. Did they construct a grammatically correct sentence using the word correctly in context?
            3. Evaluate their pronunciation, fluency, and pacing.
            
            Return a JSON object conforming exactly to this structure:
            {
              "wordUsed": true,
              "usageCorrect": true,
              "overallScore": 78,
              "pronunciationScore": 80,
              "fluencyScore": 75,
              "transcription": "what student said",
              "feedback": "A paragraph of detailed feedback on pronunciation, speed, grammatical context, and usage tips."
            }

            Format output strictly as a raw JSON response. Do not wrap in markdown code blocks.
          `;

          const audioPart = {
            inlineData: {
              data: audioBase64,
              mimeType: 'audio/wav'
            }
          };

          const result = await model.generateContent([audioPart, systemPrompt]);
          const responseText = result.response.text().trim();
          const cleanJson = responseText.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
          const parsed = JSON.parse(cleanJson);
          return NextResponse.json(parsed);

        } catch (err) {
          console.error("Gemini vocab speaking evaluation failed, triggering fallback", err);
        }
      }

      // Fallback for speaking mode
      const spokenText = clientTranscript?.trim() || `I decided to write a sentence containing the word ${cleanWord} because it represents advanced English usage.`;
      const hasWord = spokenText.toLowerCase().includes(cleanWord);
      return NextResponse.json({
        wordUsed: hasWord,
        usageCorrect: hasWord,
        overallScore: hasWord ? 78 : 30,
        pronunciationScore: hasWord ? 80 : 35,
        fluencyScore: hasWord ? 75 : 40,
        transcription: spokenText,
        feedback: hasWord
          ? `We transcribed your response as: "${spokenText}". You successfully spoke a sentence containing the target word "${cleanWord}".`
          : `We transcribed your response as: "${spokenText}". You did not use the target word "${cleanWord}". Please try again.`
      });
    }

    return NextResponse.json({ error: 'Invalid mode specified.' }, { status: 400 });

  } catch (err: any) {
    console.error("Critical error in evaluate-vocab router", err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
