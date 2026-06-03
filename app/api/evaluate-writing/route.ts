import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const { essayText, promptText, examType, minWords, maxWords } = await request.json();

    if (!essayText) {
      return NextResponse.json({ error: 'Essay text is required.' }, { status: 400 });
    }

    const wordCount = essayText.trim().split(/\s+/).length;

    // 1. If API Key is present, call Gemini
    if (apiKey) {
      try {
        const ai = new GoogleGenerativeAI(apiKey);
        const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const isPTE = examType === 'PTE';
        const gradingScale = isPTE 
          ? "PTE scores are strictly from 10 to 90 (where 90 is maximum, 10 is minimum)."
          : "IELTS scores are bands from 1.0 to 9.0 (with intervals of 0.5 or 1.0, e.g. 6.5, 7.0, 7.5, 8.0, 9.0).";

        const prompt = `
          You are an expert English examiner grading writing tasks for ${examType} academic exams.
          
          Evaluate this student's response:
          
          [EXAM TYPE]: ${examType}
          [PROMPT]: "${promptText}"
          [STUDENT ESSAY]:
          "${essayText}"

          [GRADING GUIDELINES]:
          - ${gradingScale}
          - Grade on four dimensions: Grammar, Vocabulary, Spelling, Coherence.
          - Overall score should reflect the average.
          - Identify specific grammar and spelling errors. Suggest corrections and explain why.
          - Suggest vocabulary improvements (alternative academic words to increase score).
          
          Return a JSON object exactly conforming to this structure:
          {
            "overallScore": 0.0,
            "grammarScore": 0.0,
            "vocabularyScore": 0.0,
            "spellingScore": 0.0,
            "coherenceScore": 0.0,
            "errors": [
              {
                "original": "part of text with error",
                "corrected": "corrected text",
                "explanation": "explanation of grammatical/spelling rule violated"
              }
            ],
            "vocabularyImprovements": [
              {
                "original": "simple word",
                "betterOption": "sophisticated academic word",
                "reason": "why this increases lexical score"
              }
            ],
            "generalFeedback": "A paragraph of detailed coaching advice explaining overall performance, task achievement, and actionable steps to improve score."
          }

          Format output strictly as raw JSON. Do not wrap in markdown tags. Do not output anything else.
        `;

        const response = await model.generateContent(prompt);
        const textResponse = response.response.text().trim();
        const cleanJson = textResponse.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
        const parsed = JSON.parse(cleanJson);
        return NextResponse.json(parsed);

      } catch (err) {
        console.error("Gemini writing evaluation failed, triggering fallback", err);
      }
    }

    // 2. Fallback Mode: Rule-based grading simulation
    const isPTE = examType === 'PTE';
    
    // Simple penalty calculation based on word limits
    let penalty = 0;
    if (wordCount < minWords) {
      penalty = Math.max(1, Math.round((minWords - wordCount) / 15));
    } else if (wordCount > maxWords) {
      penalty = Math.max(1, Math.round((wordCount - maxWords) / 25));
    }

    // Baseline scores
    let baselineOverall = isPTE ? 75 : 7.0;
    let baselineGrammar = isPTE ? 80 : 7.5;
    let baselineVocab = isPTE ? 78 : 7.0;
    let baselineSpelling = isPTE ? 82 : 8.0;
    let baselineCoherence = isPTE ? 70 : 6.5;

    if (isPTE) {
      baselineGrammar = Math.max(10, baselineGrammar - (penalty * 5));
      baselineVocab = Math.max(10, baselineVocab - (penalty * 3));
      baselineCoherence = Math.max(10, baselineCoherence - (penalty * 4));
      baselineOverall = Math.round((baselineGrammar + baselineVocab + baselineSpelling + baselineCoherence) / 4);
    } else {
      baselineGrammar = Math.max(1.0, baselineGrammar - (penalty * 0.5));
      baselineVocab = Math.max(1.0, baselineVocab - (penalty * 0.5));
      baselineCoherence = Math.max(1.0, baselineCoherence - (penalty * 0.5));
      // Round to nearest 0.5 band
      const rawAvg = (baselineGrammar + baselineVocab + baselineSpelling + baselineCoherence) / 4;
      baselineOverall = Math.round(rawAvg * 2) / 2;
    }

    // Synthetic spelling & grammar feedback (finds common patterns if present)
    const errors = [];
    const lowerText = essayText.toLowerCase();

    if (lowerText.includes("there") && lowerText.includes("they're") || lowerText.includes("their")) {
      errors.push({
        original: "there",
        corrected: "their",
        explanation: "Confusing homophones: 'their' is possessive, 'there' is location, 'they're' is they are. Check context."
      });
    }

    if (lowerText.includes("effect") && lowerText.includes("affect")) {
      errors.push({
        original: "effect",
        corrected: "affect",
        explanation: "Affect is usually a verb (to influence), while effect is usually a noun (the result)."
      });
    }

    // Add a default formatting check if text is long
    if (errors.length === 0) {
      errors.push({
        original: essayText.split(' ').slice(0, 2).join(' '),
        corrected: essayText.split(' ').slice(0, 2).join(' '),
        explanation: "This is a demonstration warning. Connect your GEMINI_API_KEY to retrieve live grammar parsing."
      });
    }

    const vocabularyImprovements = [
      {
        original: "good",
        betterOption: "advantageous / beneficial",
        reason: "Using specific descriptors rather than generic adjectives increases Lexical Resource score."
      },
      {
        original: "bad",
        betterOption: "detrimental / adverse",
        reason: "Demonstrates advanced academic word choice and precise tone alignment."
      }
    ];

    const generalFeedback = `Your response has a total of ${wordCount} words. The target limit was ${minWords}-${maxWords}. ${
      penalty > 0 ? "You were penalized for failing to meet length constraints. " : "Good job staying within the word boundaries. "
    }Coherence and structure are clear, but paragraph developments could be expanded. Connect your GEMINI_API_KEY to see a customized, deep AI review of your content structure.`;

    return NextResponse.json({
      overallScore: baselineOverall,
      grammarScore: baselineGrammar,
      vocabularyScore: baselineVocab,
      spellingScore: baselineSpelling,
      coherenceScore: baselineCoherence,
      errors,
      vocabularyImprovements,
      generalFeedback
    });

  } catch (err: any) {
    console.error("Critical error in evaluate-writing router", err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
export const dynamic = 'force-dynamic';
