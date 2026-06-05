'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

function WritingPracticeContent() {
  const searchParams = useSearchParams();
  const exam = searchParams.get('exam') || 'PTE';
  
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [promptLoading, setPromptLoading] = useState(true);
  const [currentPrompt, setCurrentPrompt] = useState<any>(null);
  
  // Editor state
  const [text, setText] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(1200); // 20 mins default
  const [timerActive, setTimerActive] = useState(false);
  const [state, setState] = useState<'idle' | 'grading' | 'graded'>('idle');
  
  // Evaluation feedback
  const [feedback, setFeedback] = useState<any>(null);

  const fetchPrompt = async (examType: string) => {
    setPromptLoading(true);
    try {
      const res = await fetch(`/api/generate-prompt?exam=${examType}&type=essay`);
      const data = await res.json();
      setCurrentPrompt(data);
    } catch (err) {
      console.error('Failed to fetch writing prompt', err);
    } finally {
      setPromptLoading(false);
    }
  };

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

  // Fetch a new prompt whenever the exam search param changes
  useEffect(() => {
    if (user) {
      fetchPrompt(exam);
    }
  }, [user, exam]);

  // Initialize timer when prompt changes
  useEffect(() => {
    if (currentPrompt) {
      setText('');
      setWordCount(0);
      setTimeLeft(currentPrompt.timeMinutes * 60);
      setTimerActive(false);
      setState('idle');
      setFeedback(null);
    }
  }, [currentPrompt]);

  // Timer Tick
  useEffect(() => {
    let interval: any = null;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerActive) {
      setTimerActive(false);
      handleSubmitEssay(); // Auto submit on timeout
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);

    // Calculate words
    const cleanText = val.trim();
    if (cleanText === '') {
      setWordCount(0);
    } else {
      setWordCount(cleanText.split(/\s+/).length);
    }

    // Start timer on first keystroke
    if (!timerActive && val.length > 0 && timeLeft > 0) {
      setTimerActive(true);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleNextPrompt = () => {
    fetchPrompt(exam);
  };

  const handleSubmitEssay = async () => {
    if (!currentPrompt) return;
    setTimerActive(false);
    setState('grading');

    try {
      const response = await fetch('/api/evaluate-writing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          essayText: text,
          promptText: currentPrompt.prompt,
          examType: exam,
          minWords: currentPrompt.minWords,
          maxWords: currentPrompt.maxWords
        })
      });

      const result = await response.json();
      if (result.error) {
        throw new Error(result.error);
      }

      setFeedback(result);
      setState('graded');

      // Log results to Supabase DB
      await saveAttemptToDatabase(result);
    } catch (err: any) {
      console.error('Error evaluating writing', err);
      alert('Essay grading failed. Please try again. Error: ' + err.message);
      setState('idle');
    }
  };

  const saveAttemptToDatabase = async (evalData: any) => {
    if (!user || !currentPrompt) return;
    try {
      // Create session
      const { data: sessionData, error: sessionErr } = await supabase
        .from('test_sessions')
        .insert({
          user_id: user.id,
          exam_type: exam,
          section: 'writing',
          status: 'completed',
          overall_score: evalData.overallScore,
        });

      if (sessionErr) throw sessionErr;

      // Fetch recent session ID
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
            question_type: exam === 'PTE' ? 'Write Essay' : 'Academic Essay Task 2',
            question_prompt: currentPrompt.prompt,
            user_text_response: text,
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

  const isPTE = exam === 'PTE';
  const scoreUnit = isPTE ? 'Points' : 'Bands';
  const maxScore = isPTE ? 90 : 9;

  return (
    <>
      <Navbar />
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '20px',
        fontFamily: 'var(--font-geist-sans)'
      }} className="anim-fade">
        
        {/* Back link */}
        <div style={{ marginBottom: '24px' }}>
          <Link href="/dashboard" style={{ color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}>
            ← Back to Dashboard
          </Link>
        </div>

        {/* Header Title */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
              {isPTE ? 'PTE Write Essay' : 'IELTS Writing Task 2'}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Grades grammar, lexical vocabulary, coherence, and structure.</p>
          </div>
          <button onClick={handleNextPrompt} disabled={promptLoading} className="secondary-btn" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
            🔄 Next Prompt
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: state === 'graded' ? '1fr' : 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '32px',
          alignItems: 'start'
        }}>
          
          {/* LEFT: Prompt Card + Text Area Workspace */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Prompt */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              {promptLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0' }}>
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid var(--border-color)', borderTopColor: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Drafting essay question...</span>
                </div>
              ) : currentPrompt ? (
                <>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                    Question Topic: {currentPrompt.title}
                  </span>
                  <p style={{ fontSize: '1.1rem', color: 'var(--text-primary)', lineHeight: '1.6', fontWeight: 500 }}>
                    {currentPrompt.prompt}
                  </p>
                  
                  <div style={{
                    display: 'flex',
                    gap: '16px',
                    marginTop: '16px',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                    borderTop: '1px solid var(--border-color)',
                    paddingTop: '16px'
                  }}>
                    <span>🕒 Limit: <strong>{currentPrompt.timeMinutes} Minutes</strong></span>
                    <span>📏 Target: <strong>{currentPrompt.minWords}-{currentPrompt.maxWords} Words</strong></span>
                  </div>
                </>
              ) : (
                <span style={{ color: 'var(--error)' }}>Failed to load essay prompt.</span>
              )}
            </div>

            {state !== 'graded' && currentPrompt && !promptLoading && (
              <>
                {/* Editor Workspace */}
                <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Status Bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <span style={{ fontSize: '0.85rem', color: wordCount < currentPrompt.minWords || wordCount > currentPrompt.maxWords ? 'var(--warning)' : 'var(--success)' }}>
                        Words: <strong>{wordCount}</strong> / {currentPrompt.minWords}
                      </span>
                    </div>

                    <div style={{
                      padding: '4px 12px',
                      background: 'rgba(255,255,255,0.05)',
                      borderRadius: '12px',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      color: timeLeft < 120 ? 'var(--error)' : 'var(--text-primary)',
                      border: '1px solid var(--border-color)'
                    }}>
                      ⏱️ {formatTime(timeLeft)}
                    </div>
                  </div>

                  {/* Input field */}
                  <textarea
                    value={text}
                    onChange={handleTextChange}
                    placeholder="Type your essay response here. The timer will automatically begin on your first key stroke. Spellcheck is disabled to simulate test environments."
                    spellCheck="false"
                    disabled={state === 'grading'}
                    style={{
                      width: '100%',
                      minHeight: '300px',
                      background: 'rgba(0,0,0,0.15)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '16px',
                      color: '#f8fafc',
                      fontSize: '1.05rem',
                      lineHeight: '1.6',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                  />

                  {/* Actions */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button 
                      onClick={() => {
                        setText('');
                        setWordCount(0);
                        setTimeLeft(currentPrompt.timeMinutes * 60);
                        setTimerActive(false);
                      }}
                      className="secondary-btn"
                      disabled={state === 'grading'}
                      style={{ padding: '10px 20px', fontSize: '0.9rem' }}
                    >
                      Clear
                    </button>
                    <button
                      onClick={handleSubmitEssay}
                      disabled={state === 'grading' || text.trim().length < 50}
                      className="glow-btn"
                      style={{ padding: '12px 28px', fontSize: '1rem', borderRadius: 'var(--radius-sm)' }}
                    >
                      {state === 'grading' ? 'AI Grading Essay...' : 'Submit Response'}
                    </button>
                  </div>
                </div>
              </>
            )}

          </div>

          {/* RIGHT: Graded Score Dashboard Display */}
          {state === 'graded' && feedback && currentPrompt && (
            <div className="anim-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              
              {/* Score summary panel */}
              <div className="glass-card" style={{ display: 'flex', flexWrap: 'wrap', gap: '32px', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                  <div style={{
                    width: '90px',
                    height: '90px',
                    borderRadius: '50%',
                    background: 'var(--primary-gradient)',
                    boxShadow: '0 0 20px rgba(168,85,247,0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <span style={{ fontSize: '2rem', fontWeight: 800, color: 'white', lineHeight: '1' }}>{feedback.overallScore}</span>
                    <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{scoreUnit}</span>
                  </div>

                  <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Essay Evaluated!</h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Total Written: <strong>{wordCount} words</strong> (Limit: {currentPrompt.minWords}-{currentPrompt.maxWords})
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '24px', borderLeft: '1px solid var(--border-color)', paddingLeft: '32px', flexWrap: 'wrap' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Grammar</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--success)' }}>{feedback.grammarScore} / {maxScore}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Vocabulary</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#06b6d4' }}>{feedback.vocabularyScore} / {maxScore}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Spelling</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#a855f7' }}>{feedback.spellingScore} / {maxScore}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Coherence</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--warning)' }}>{feedback.coherenceScore} / {maxScore}</span>
                  </div>
                </div>
              </div>

              {/* Feedback categories layout */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                
                {/* Grammar & spelling corrections */}
                <div className="glass-panel" style={{ padding: '24px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>
                    ❌ Grammatical & Spelling Corrections
                  </h3>

                  {feedback.errors && feedback.errors.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {feedback.errors.map((err: any, idx: number) => (
                        <div key={idx} style={{
                          background: 'rgba(244,63,94,0.05)',
                          borderLeft: '3px solid var(--error)',
                          padding: '12px 16px',
                          borderRadius: '0 var(--radius-sm) var(--radius-sm) 0'
                        }}>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                            You wrote: <span style={{ textDecoration: 'line-through', color: 'var(--error)' }}>"{err.original}"</span>
                          </div>
                          <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--success)' }}>
                            Correction: "{err.corrected}"
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                            💡 {err.explanation}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: 'var(--success)', background: 'rgba(16,185,129,0.05)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16,185,129,0.2)' }}>
                      🎉 Excellent grammar and spelling! No major mistakes were detected.
                    </div>
                  )}
                </div>

                {/* Vocabulary enhancers */}
                <div className="glass-panel" style={{ padding: '24px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>
                    📈 Vocabulary Enhancer Suggestions
                  </h3>

                  {feedback.vocabularyImprovements && feedback.vocabularyImprovements.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {feedback.vocabularyImprovements.map((vocab: any, idx: number) => (
                        <div key={idx} style={{
                          background: 'rgba(6,182,212,0.05)',
                          borderLeft: '3px solid var(--accent-cyan)',
                          padding: '12px 16px',
                          borderRadius: '0 var(--radius-sm) var(--radius-sm) 0'
                        }}>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                            Replace: "{vocab.original}"
                          </div>
                          <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--accent-cyan)' }}>
                            Alternative: "{vocab.betterOption}"
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                            💡 Reason: {vocab.reason}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      No specific vocabulary improvements suggested.
                    </div>
                  )}
                </div>

              </div>

              {/* General coaching feedback */}
              <div className="glass-card">
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '12px' }}>📊 Detailed Coaching Feedback</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
                  {feedback.generalFeedback}
                </p>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '16px' }}>
                <button 
                  onClick={() => {
                    setState('idle');
                    setFeedback(null);
                    setText('');
                    setWordCount(0);
                    setTimeLeft(currentPrompt.timeMinutes * 60);
                  }}
                  className="glow-btn"
                  style={{ padding: '12px 24px' }}
                >
                  Try Again
                </button>
                <button onClick={handleNextPrompt} className="secondary-btn" style={{ padding: '12px 24px' }}>
                  Next Prompt
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </>
  );
}

export default function WritingPracticePage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid var(--border-color)', borderTopColor: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
      </div>
    }>
      <WritingPracticeContent />
    </Suspense>
  );
}
