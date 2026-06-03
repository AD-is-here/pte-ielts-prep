'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

// Sample reading tasks
const TASKS = {
  PTE: [
    {
      title: "The Physics of Rain",
      text: "Rain is liquid water in the form of droplets that have [1] from atmospheric water vapor and then become heavy enough to fall under gravity. Rain is a major component of the water cycle and is [2] for depositing most of the fresh water on the Earth. It provides [3] conditions for many types of ecosystems, as well as water for hydroelectric power plants and crop irrigation.",
      blanks: {
        1: { correct: "condensed", options: ["condensed", "evaporated", "frozen", "dissolved"] },
        2: { correct: "responsible", options: ["responsible", "accused", "damaging", "unnecessary"] },
        3: { correct: "suitable", options: ["suitable", "hostile", "barren", "extreme"] }
      }
    }
  ],
  IELTS: [
    {
      title: "Rise of Renewable Energy",
      passage: "Renewable energy technologies are clean sources of energy that have a much lower environmental impact than conventional energy technologies. Over the past decade, solar panels and wind turbines have experienced unprecedented cost declines. These cost reductions have been driven by government subsidies, manufacturing scaling, and incremental engineering refinements. While fossil fuels still dominate global power generation, the grid share of wind and solar is climbing exponentially. However, grid integration remains a technical hurdle due to the intermittent nature of solar and wind generation, requiring advanced storage batteries or grid modernization.",
      questions: [
        {
          id: 1,
          q: "What has been the primary driver of cost declines in solar panels and wind turbines over the past decade?",
          options: [
            "Increased reliance on coal and natural gas.",
            "Government subsidies, scaling, and engineering refinements.",
            "A global decline in electricity consumption.",
            "The rising cost of lithium-ion batteries."
          ],
          correctIdx: 1
        },
        {
          id: 2,
          q: "What is the main technical hurdle currently facing wind and solar grid integration?",
          options: [
            "High maintenance costs of turbines.",
            "The intermittent nature of generation.",
            "Lack of interest from private investors.",
            "Lack of clean energy standards."
          ],
          correctIdx: 1
        }
      ]
    }
  ]
};

function ReadingPracticeContent() {
  const searchParams = useSearchParams();
  const exam = searchParams.get('exam') || 'PTE';
  
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  
  // Quiz states
  const [pteSelections, setPteSelections] = useState<Record<number, string>>({});
  const [ieltsSelections, setIeltsSelections] = useState<Record<number, number>>({});
  const [state, setState] = useState<'idle' | 'graded'>('idle');
  const [score, setScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);

  // Vocab tooltip states
  const [selectedWord, setSelectedWord] = useState('');
  const [vocabData, setVocabData] = useState<any>(null);
  const [vocabLoading, setVocabLoading] = useState(false);
  const [vocabSaved, setVocabSaved] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);

  const activeTasks = exam === 'PTE' ? TASKS.PTE : TASKS.IELTS;
  const currentTask = activeTasks[currentTaskIndex] || activeTasks[0];

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

  useEffect(() => {
    // Reset states when task changes
    setPteSelections({});
    setIeltsSelections({});
    setState('idle');
    setScore(0);
    setTooltipPos(null);
    setSelectedWord('');
  }, [currentTaskIndex, exam]);

  // Click outside to dismiss tooltip
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (tooltipPos && ! (e.target as HTMLElement).closest('.vocab-tooltip-box')) {
        setTooltipPos(null);
        setSelectedWord('');
      }
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, [tooltipPos]);

  // Double Click handler for vocabulary lookup
  const handleTextDoubleClick = async (e: React.MouseEvent) => {
    const selection = window.getSelection();
    if (!selection) return;

    const word = selection.toString().trim().replace(/[^a-zA-Z]/g, '');
    if (!word || word.length < 2) return;

    setSelectedWord(word);
    setVocabLoading(true);
    setVocabSaved(false);

    // Position the tooltip near the selection or cursor
    setTooltipPos({
      x: Math.min(window.innerWidth - 300, e.clientX),
      y: e.clientY + window.scrollY + 10
    });

    try {
      const res = await fetch(`/api/vocab-helper?word=${word}`);
      const data = await res.json();
      setVocabData(data);
    } catch (err) {
      console.error('Error fetching vocabulary information', err);
      setVocabData({
        word,
        definition: 'Could not fetch definition.',
        synonyms: ['N/A'],
        example: 'N/A',
        level: 'N/A'
      });
    } finally {
      setVocabLoading(false);
    }
  };

  const handleSaveToVocabDeck = async () => {
    if (!user || !vocabData) return;
    try {
      const { error } = await supabase
        .from('vocabulary_items')
        .upsert({
          user_id: user.id,
          word: vocabData.word,
          definition: vocabData.definition,
          example_sentence: vocabData.example || vocabData.example_sentence,
          mastery_level: 1,
          next_review_at: new Date().toISOString()
        });

      if (error) throw error;
      setVocabSaved(true);
    } catch (err) {
      alert('Failed to save word to vocab deck.');
    }
  };

  const checkAnswers = () => {
    let correctCount = 0;
    let questionsCount = 0;

    if (exam === 'PTE') {
      const blanks = (currentTask as any).blanks;
      questionsCount = Object.keys(blanks).length;
      Object.keys(blanks).forEach((key) => {
        const id = Number(key);
        if (pteSelections[id] === blanks[id].correct) {
          correctCount++;
        }
      });
    } else {
      const questions = (currentTask as any).questions;
      questionsCount = questions.length;
      questions.forEach((q: any) => {
        if (ieltsSelections[q.id] === q.correctIdx) {
          correctCount++;
        }
      });
    }

    setScore(correctCount);
    setTotalQuestions(questionsCount);
    setState('graded');

    // Save attempt to DB (overallScore maps to percentage for standardized stats)
    const overallScore = questionsCount > 0 
      ? Math.round((correctCount / questionsCount) * (exam === 'PTE' ? 90 : 9) * 10) / 10 
      : 0;
    saveAttemptToDatabase(overallScore);
  };

  const saveAttemptToDatabase = async (overallScore: number) => {
    if (!user) return;
    try {
      const { data: sessionData, error: sessionErr } = await supabase
        .from('test_sessions')
        .insert({
          user_id: user.id,
          exam_type: exam,
          section: 'reading',
          status: 'completed',
          overall_score: overallScore,
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

        // Save response log
        await supabase
          .from('test_responses')
          .insert({
            session_id: sessionId,
            question_type: exam === 'PTE' ? 'Fill in the Blanks' : 'Academic Reading Passage',
            question_prompt: currentTask.title,
            ai_evaluation: { score, totalQuestions, exam, selections: exam === 'PTE' ? pteSelections : ieltsSelections },
            score: overallScore,
          });
      }
    } catch (e) {
      console.error('Failed to log test results to DB', e);
    }
  };

  const handleNextPrompt = () => {
    const nextIdx = (currentTaskIndex + 1) % activeTasks.length;
    setCurrentTaskIndex(nextIdx);
  };

  const renderPteText = () => {
    const text = (currentTask as any).text || '';
    const blanks = (currentTask as any).blanks || {};
    
    // Split text by blank tags e.g., [1]
    const parts = text.split(/(\[\d+\])/g);
    
    return parts.map((part: string, idx: number) => {
      const match = part.match(/\[(\d+)\]/);
      if (match) {
        const blankId = Number(match[1]);
        const blankInfo = blanks[blankId];
        const isGraded = state === 'graded';
        const isCorrect = pteSelections[blankId] === blankInfo.correct;
        
        return (
          <span key={idx} style={{ display: 'inline-block', margin: '0 4px', verticalAlign: 'middle' }}>
            <select
              value={pteSelections[blankId] || ''}
              disabled={isGraded}
              onChange={(e) => setPteSelections(prev => ({ ...prev, [blankId]: e.target.value }))}
              style={{
                background: isGraded 
                  ? (isCorrect ? 'var(--success-glow)' : 'var(--error-glow)') 
                  : 'rgba(255,255,255,0.05)',
                border: isGraded
                  ? `1px solid ${isCorrect ? 'var(--success)' : 'var(--error)'}`
                  : '1px solid var(--border-color)',
                color: isGraded
                  ? (isCorrect ? 'var(--success)' : 'var(--error)')
                  : 'white',
                padding: '4px 8px',
                borderRadius: '4px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="">-- select --</option>
              {blankInfo.options.map((opt: string) => (
                <option key={opt} value={opt} style={{ background: '#161a31', color: 'white' }}>{opt}</option>
              ))}
            </select>
            {isGraded && !isCorrect && (
              <span style={{ fontSize: '0.75rem', color: 'var(--success)', marginLeft: '4px' }}>
                ({blankInfo.correct})
              </span>
            )}
          </span>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid var(--border-color)', borderTopColor: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  const isPTE = exam === 'PTE';

  return (
    <>
      <Navbar />
      <div 
        ref={containerRef}
        style={{
          maxWidth: '1000px',
          margin: '0 auto',
          padding: '20px',
          fontFamily: 'var(--font-geist-sans)',
          position: 'relative'
        }} 
        className="anim-fade"
      >
        
        {/* Back link */}
        <div style={{ marginBottom: '24px' }}>
          <Link href="/dashboard" style={{ color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}>
            ← Back to Dashboard
          </Link>
        </div>

        {/* Title block */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
              {isPTE ? 'PTE Fill in the Blanks' : 'IELTS Academic Reading'}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Double-click any unfamiliar word in the text to trigger an immediate AI definition lookup.
            </p>
          </div>
          <button onClick={handleNextPrompt} className="secondary-btn" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
            🔄 Next Task
          </button>
        </div>

        {/* Content body split */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isPTE ? '1fr' : '1.2fr 1fr',
          gap: '32px',
          alignItems: 'start'
        }}>
          
          {/* LEFT: Text passage / blank selectors */}
          <div className="glass-panel" style={{ padding: '32px' }} onDoubleClick={handleTextDoubleClick}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '16px', color: 'var(--text-primary)', fontWeight: 700 }}>
              📖 {currentTask.title}
            </h3>

            {isPTE ? (
              <div style={{ fontSize: '1.15rem', lineHeight: '2', color: 'var(--text-secondary)' }}>
                {renderPteText()}
              </div>
            ) : (
              <p style={{ fontSize: '1.05rem', lineHeight: '1.7', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                {(currentTask as any).passage}
              </p>
            )}
          </div>

          {/* RIGHT: IELTS Questions (for IELTS only) */}
          {!isPTE && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {(currentTask as any).questions.map((q: any) => {
                const isGraded = state === 'graded';
                const isCorrect = ieltsSelections[q.id] === q.correctIdx;

                return (
                  <div key={q.id} className="glass-card" style={{
                    border: isGraded 
                      ? `1px solid ${isCorrect ? 'var(--success)' : 'var(--error)'}`
                      : '1px solid var(--border-card)'
                  }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '12px' }}>
                      Q{q.id}. {q.q}
                    </h4>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {q.options.map((opt: string, optIdx: number) => {
                        const isSelected = ieltsSelections[q.id] === optIdx;
                        
                        return (
                          <button
                            key={optIdx}
                            disabled={isGraded}
                            onClick={() => setIeltsSelections(prev => ({ ...prev, [q.id]: optIdx }))}
                            style={{
                              textAlign: 'left',
                              padding: '10px 14px',
                              background: isSelected 
                                ? 'var(--primary-glow)' 
                                : 'rgba(255,255,255,0.02)',
                              border: isSelected 
                                ? '1px solid var(--primary)' 
                                : '1px solid var(--border-color)',
                              borderRadius: 'var(--radius-sm)',
                              color: isSelected ? 'white' : 'var(--text-secondary)',
                              fontSize: '0.85rem',
                              cursor: isGraded ? 'default' : 'pointer',
                              transition: 'all 0.2s'
                            }}
                          >
                            {opt}
                            {isGraded && optIdx === q.correctIdx && (
                              <span style={{ color: 'var(--success)', fontWeight: 'bold', marginLeft: '8px' }}>✓ Correct</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* Grade actions */}
        <div style={{ marginTop: '32px', display: 'flex', gap: '16px', alignItems: 'center' }}>
          {state === 'idle' ? (
            <button 
              onClick={checkAnswers} 
              className="glow-btn"
              style={{ padding: '12px 28px' }}
            >
              Check Answers
            </button>
          ) : (
            <div className="glass-card" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '24px',
              padding: '16px 24px',
              width: '100%',
              background: 'var(--bg-surface)'
            }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Score Achieved</span>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>
                  {score} / {totalQuestions} Correct ({Math.round((score / totalQuestions) * 100)}%)
                </h3>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginLeft: 'auto' }}>
                <button 
                  onClick={() => {
                    setState('idle');
                    setPteSelections({});
                    setIeltsSelections({});
                  }}
                  className="secondary-btn"
                >
                  Try Again
                </button>
                <button onClick={handleNextPrompt} className="glow-btn">
                  Next Task
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Vocabulary floating popup tooltip */}
        {tooltipPos && (
          <div 
            className="glass-panel vocab-tooltip-box anim-fade"
            style={{
              position: 'absolute',
              top: tooltipPos.y,
              left: tooltipPos.x,
              width: '320px',
              padding: '20px',
              zIndex: 999,
              boxShadow: '0 10px 25px rgba(0,0,0,0.8), 0 0 0 1px rgba(99,102,241,0.2) inset',
              background: 'rgba(15, 18, 34, 0.95)',
              border: '1px solid var(--border-color-glow)'
            }}
          >
            {vocabLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid var(--border-color)', borderTopColor: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: '0.85rem' }}>AI translating word details...</span>
              </div>
            ) : vocabData ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'white' }}>{vocabData.word}</h4>
                  <span style={{ fontSize: '0.7rem', padding: '1px 6px', background: 'var(--primary-glow)', color: 'var(--primary)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '10px' }}>
                    {vocabData.level || 'CEFR'}
                  </span>
                </div>
                
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '4px 0' }}>
                  <strong>Definition:</strong> {vocabData.definition}
                </p>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <strong>Synonyms:</strong> {vocabData.synonyms?.join(', ')}
                </div>

                {vocabData.example && (
                  <p style={{ fontSize: '0.8rem', fontStyle: 'italic', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.02)', padding: '6px', borderRadius: '4px', borderLeft: '2px solid var(--primary)' }}>
                    "{vocabData.example}"
                  </p>
                )}

                <button
                  onClick={handleSaveToVocabDeck}
                  disabled={vocabSaved}
                  className="glow-btn"
                  style={{
                    width: '100%',
                    padding: '8px',
                    fontSize: '0.8rem',
                    marginTop: '8px',
                    borderRadius: '4px',
                    background: vocabSaved ? 'var(--success)' : 'var(--primary-gradient)',
                    boxShadow: vocabSaved ? 'none' : '0 4px 10px rgba(99,102,241,0.3)'
                  }}
                >
                  {vocabSaved ? '✓ Added to Deck' : 'Add to Vocab Deck'}
                </button>
              </div>
            ) : (
              <span style={{ fontSize: '0.85rem' }}>Error loading vocabulary.</span>
            )}
          </div>
        )}

      </div>
      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}

export default function ReadingPracticePage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid var(--border-color)', borderTopColor: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
      </div>
    }>
      <ReadingPracticeContent />
    </Suspense>
  );
}
