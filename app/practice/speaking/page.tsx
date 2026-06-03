'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Navbar from '@/components/Navbar';
import AudioRecorder from '@/components/AudioRecorder';
import Link from 'next/link';

// Sample prompts dictionary
const PROMPTS = {
  PTE: {
    'read-aloud': [
      "Photography is a beautiful medium of expression. It allows us to capture fleeting moments in time and turn them into permanent records of memory. However, the rise of digital editing software has created debate over the authenticity of modern photojournalism.",
      "The invention of the printing press was a pivotal moment in human history. It democratized access to information, allowing literature to spread rapidly across continents. This sparked scientific revolutions and laid the foundation for the modern intellectual age.",
      "Climate change remains the defining ecological challenge of our generation. Rising atmospheric temperatures are causing glaciers to melt and ocean currents to shift. Governments must coordinate globally to implement sustainable energy infrastructures."
    ],
    'repeat-sentence': [
      "The library will remain closed on Sunday due to scheduled building maintenance.",
      "Please submit your final chemistry laboratory reports before Friday afternoon.",
      "Successful entrepreneurs need to adapt quickly to changing consumer demands."
    ]
  },
  IELTS: {
    'cue-card': [
      {
        topic: "Describe a public park or garden you enjoy visiting.",
        bulletPoints: [
          "Where this park or garden is located",
          "What you can see and do there",
          "How often you visit it",
          "And explain why you enjoy visiting this park or garden."
        ]
      },
      {
        topic: "Describe a piece of technology that you find extremely useful in your daily life.",
        bulletPoints: [
          "What the technology is",
          "How long you have been using it",
          "What main tasks you perform with it",
          "And explain why you find it so essential to your routine."
        ]
      }
    ]
  }
};

function SpeakingPracticeContent() {
  const searchParams = useSearchParams();
  const exam = searchParams.get('exam') || 'PTE';
  const type = searchParams.get('type') || 'read-aloud';

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [state, setState] = useState<'idle' | 'recording' | 'evaluating' | 'graded'>('idle');
  const [audioFile, setAudioFile] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  // Feedback results
  const [feedback, setFeedback] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then((res: any) => {
      const user = res.data?.user;
      if (!user) {
        window.location.href = '/login';
      } else {
        setUser(user);
        setLoading(false);
      }
    });
  }, []);

  const getPromptText = () => {
    if (exam === 'PTE') {
      const prompts = PROMPTS.PTE[type as 'read-aloud' | 'repeat-sentence'] || [];
      return prompts[currentPromptIndex] || '';
    } else {
      const cueCards = PROMPTS.IELTS['cue-card'] || [];
      const card = cueCards[currentPromptIndex];
      if (!card) return '';
      return `${card.topic}\n\n` + card.bulletPoints.map(bp => `• ${bp}`).join('\n');
    }
  };

  const speakPrompt = () => {
    if (typeof window === 'undefined') return;
    const text = exam === 'PTE' && type === 'repeat-sentence' 
      ? getPromptText() 
      : 'This is the speaking prompt.';
    
    // Stop any current voice
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9; // Slightly slower for clear repetition
    window.speechSynthesis.speak(utterance);
  };

  const handleNextPrompt = () => {
    setState('idle');
    setFeedback(null);
    setAudioFile(null);
    setAudioUrl(null);
    const maxPrompts = exam === 'PTE' 
      ? (PROMPTS.PTE[type as 'read-aloud' | 'repeat-sentence'] || []).length 
      : (PROMPTS.IELTS['cue-card'] || []).length;
    setCurrentPromptIndex((prev) => (prev + 1) % maxPrompts);
  };

  const handleRecordingStop = async (blob: Blob, url: string, transcript?: string) => {
    if (blob.size < 1000) {
      alert("No audio was recorded. Please check your microphone, click record, and speak clearly.");
      setState('idle');
      return;
    }
    setAudioFile(blob);
    setAudioUrl(url);
    setState('evaluating');

    try {
      // 1. Convert audio blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64Audio = reader.result?.toString().split(',')[1];
        
        // 2. Call the speaking evaluation API route
        const response = await fetch('/api/evaluate-speaking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioBase64: base64Audio,
            promptText: getPromptText(),
            examType: exam,
            taskType: type,
            clientTranscript: transcript || ''
          })
        });

        const result = await response.json();
        
        if (result.error) {
          throw new Error(result.error);
        }

        setFeedback(result);
        setState('graded');

        // 3. Save attempt to database (Real or Mock)
        await saveAttemptToDatabase(result);
      };
    } catch (err: any) {
      console.error('Error evaluating speech', err);
      alert('Speech evaluation failed. Please try again. Detailed error: ' + err.message);
      setState('idle');
    }
  };

  const saveAttemptToDatabase = async (evalData: any) => {
    if (!user) return;
    try {
      // Create test session
      const { data: sessionData, error: sessionErr } = await supabase
        .from('test_sessions')
        .insert({
          user_id: user.id,
          exam_type: exam,
          section: 'speaking',
          status: 'completed',
          overall_score: evalData.overallScore,
        });

      if (sessionErr) throw sessionErr;

      // Extract new session ID
      const { data: recentSessions } = await supabase
        .from('test_sessions')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (recentSessions && recentSessions.length > 0) {
        const sessionId = recentSessions[0].id;
        
        // Insert response
        await supabase
          .from('test_responses')
          .insert({
            session_id: sessionId,
            question_type: type === 'read-aloud' ? 'Read Aloud' : type === 'repeat-sentence' ? 'Repeat Sentence' : 'Cue Card',
            question_prompt: getPromptText(),
            user_text_response: evalData.transcription,
            ai_evaluation: evalData,
            score: evalData.overallScore,
          });
      }
    } catch (e) {
      console.error('Failed to log test results to DB', e);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid var(--border-color)', borderTopColor: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  const promptText = getPromptText();
  const isPTE = exam === 'PTE';
  const scoreUnit = isPTE ? 'Points' : 'Bands';

  return (
    <>
      <Navbar />
      <div style={{
        maxWidth: '850px',
        margin: '0 auto',
        padding: '20px',
        fontFamily: 'var(--font-geist-sans)'
      }} className="anim-fade">
        
        {/* Back navigation */}
        <div style={{ marginBottom: '24px' }}>
          <Link href="/dashboard" style={{ color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}>
            ← Back to Dashboard
          </Link>
        </div>

        {/* Task Title */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
              {isPTE ? `PTE ${type === 'read-aloud' ? 'Read Aloud' : 'Repeat Sentence'}` : 'IELTS Cue Card'}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Focus on pronunciation, stress, and natural pace.</p>
          </div>
          <button onClick={handleNextPrompt} className="secondary-btn" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
            🔄 Next Prompt
          </button>
        </div>

        {/* Prompt Card */}
        <div className="glass-panel" style={{ padding: '32px', marginBottom: '32px', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Speaking Prompt
            </span>
            {isPTE && type === 'repeat-sentence' && (
              <button 
                onClick={speakPrompt}
                style={{
                  background: 'var(--primary-glow)',
                  border: '1px solid var(--primary)',
                  color: 'white',
                  borderRadius: '16px',
                  padding: '4px 12px',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                🔊 Listen to Sentence
              </button>
            )}
          </div>

          {exam === 'PTE' ? (
            <p style={{
              fontSize: '1.25rem',
              lineHeight: '1.8',
              color: 'var(--text-primary)',
              fontWeight: 500,
              whiteSpace: 'pre-line'
            }}>
              {promptText}
            </p>
          ) : (
            // IELTS Cue card specific layout
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '24px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '16px', fontWeight: 700 }}>
                {promptText.split('\n\n')[0]}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {promptText.split('\n\n')[1]?.split('\n').map((line, idx) => (
                  <p key={idx} style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>{line}</p>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Recorder interface */}
        <div style={{ display: (state === 'idle' || state === 'recording') ? 'block' : 'none', width: '100%' }}>
          <AudioRecorder 
            onStart={() => setState('recording')}
            onStop={handleRecordingStop} 
            parentState={state}
          />
        </div>

        {state === 'evaluating' && (
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', padding: '40px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid var(--border-color)', borderTopColor: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>AI Speech Engine Grading...</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Transcribing audio, assessing phonetics, and calculating bands.</p>
            </div>
          </div>
        )}

        {/* Graded Display screen */}
        {state === 'graded' && feedback && (
          <div className="anim-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Scores summary header */}
            <div className="glass-card" style={{ display: 'flex', flexWrap: 'wrap', gap: '32px', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                <div style={{
                  width: '90px',
                  height: '90px',
                  borderRadius: '50%',
                  background: 'var(--primary-gradient)',
                  boxShadow: '0 0 20px rgba(99,102,241,0.3)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <span style={{ fontSize: '2rem', fontWeight: 800, color: 'white', lineHeight: '1' }}>{feedback.overallScore}</span>
                  <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{scoreUnit}</span>
                </div>

                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Evaluation Complete!</h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Your attempt has been scored using {exam} parameters.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '24px', borderLeft: '1px solid var(--border-color)', paddingLeft: '32px' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Pronunciation</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--success)' }}>{feedback.pronunciationScore}</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Fluency</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#06b6d4' }}>{feedback.fluencyScore}</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Pacing/Pause</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#a855f7' }}>{feedback.pacingScore}</span>
                </div>
              </div>
            </div>

            {/* Audio Playback Player */}
            {audioUrl && (
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>🔊 Listen to your spoken response:</span>
                <audio src={audioUrl} controls style={{ width: '100%', height: '36px', borderRadius: '8px' }} />
              </div>
            )}
 
             {/* Word-by-word visual highlight audit */}
             <div className="glass-panel" style={{ padding: '32px' }}>
               <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>
                 {feedback.isFreeSpeaking ? 'Spoken Self-Assessment' : 'Pronunciation Analysis'}
               </h3>
               <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
                 {feedback.isFreeSpeaking 
                   ? 'Below is a color-coded self-assessment trace of your spoken response. Click on red words to see corrections and usage tips.' 
                   : 'Below is a color-coded trace of your reading. Click on underlined words to see pronunciation corrections.'}
               </p>

              <div className="word-feedback-container">
                {feedback.wordTrace && feedback.wordTrace.length > 0 ? (
                  feedback.wordTrace.map((w: any, idx: number) => {
                    const isCorrect = w.status === 'correct';
                    const isIncorrect = w.status === 'incorrect';
                    
                    return (
                      <span 
                        key={idx} 
                        className={`feedback-word ${isCorrect ? 'correct' : isIncorrect ? 'incorrect' : 'unspoken'}`}
                        title={isIncorrect ? `Tips: ${w.tip || 'Practice saying this word clearly.'}` : undefined}
                        onClick={() => {
                          if (isIncorrect && w.tip) {
                            alert(`Word: "${w.word}"\nTip: ${w.tip}`);
                          }
                        }}
                      >
                        {w.word}
                      </span>
                    );
                  })
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>No trace analysis available.</p>
                )}
              </div>
            </div>

            {/* AI Coaching Tips */}
            <div className="glass-card">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '12px' }}>✨ AI Tutor Coaching</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>
                {feedback.coachingFeedback}
              </p>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
              <button 
                onClick={() => {
                  setState('idle');
                  setFeedback(null);
                  setAudioFile(null);
                  setAudioUrl(null);
                }} 
                className="glow-btn" 
                style={{ padding: '12px 24px' }}
              >
                Try Again
              </button>
              <button onClick={handleNextPrompt} className="secondary-btn" style={{ padding: '12px 24px' }}>
                Next Question
              </button>
            </div>

          </div>
        )}

      </div>
    </>
  );
}

export default function SpeakingPracticePage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid var(--border-color)', borderTopColor: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
      </div>
    }>
      <SpeakingPracticeContent />
    </Suspense>
  );
}
