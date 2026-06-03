'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

export default function HistoryPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [responses, setResponses] = useState<Record<string, any>>({});

  useEffect(() => {
    supabase.auth.getUser().then((res: any) => {
      const user = res.data?.user;
      if (!user) {
        window.location.href = '/login';
      } else {
        setUser(user);
        fetchHistory(user.id);
      }
    });
  }, []);

  const fetchHistory = async (userId: string) => {
    try {
      // Fetch all sessions
      const { data: sessionData, error } = await supabase
        .from('test_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSessions(sessionData || []);
    } catch (e) {
      console.error('Failed to load history', e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSession = async (sessionId: string) => {
    if (selectedSession === sessionId) {
      setSelectedSession(null);
      return;
    }

    setSelectedSession(sessionId);

    // Fetch details if not cached yet
    if (!responses[sessionId]) {
      try {
        const { data, error } = await supabase
          .from('test_responses')
          .select('*')
          .eq('session_id', sessionId);

        if (error) throw error;
        if (data && data.length > 0) {
          setResponses(prev => ({ ...prev, [sessionId]: data[0] }));
        }
      } catch (err) {
        console.error('Failed to load session details', err);
      }
    }
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid var(--border-color)', borderTopColor: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

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

        {/* Title */}
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '8px' }}>Practice History Logs</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '32px' }}>
          Browse your past modular speaking, writing, and reading test attempts. Review AI-graded corrections.
        </p>

        {/* Logs Accordion */}
        {sessions.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {sessions.map((session) => {
              const isOpen = selectedSession === session.id;
              const details = responses[session.id];
              const isPTE = session.exam_type === 'PTE';
              const unit = isPTE ? 'Pts' : 'Bands';

              // Style badges by section type
              let sectionBg = 'rgba(99, 102, 241, 0.1)';
              let sectionColor = 'var(--primary)';
              if (session.section === 'writing') {
                sectionBg = 'rgba(168, 85, 247, 0.1)';
                sectionColor = '#a855f7';
              } else if (session.section === 'reading') {
                sectionBg = 'rgba(6, 182, 212, 0.1)';
                sectionColor = '#06b6d4';
              }

              return (
                <div key={session.id} className="glass-panel" style={{ overflow: 'hidden' }}>
                  
                  {/* Header Trigger */}
                  <div 
                    onClick={() => handleToggleSession(session.id)}
                    style={{
                      padding: '20px 24px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      background: isOpen ? 'rgba(255,255,255,0.02)' : 'transparent',
                      transition: 'background 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: '0.75rem',
                        background: sectionBg,
                        color: sectionColor,
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontWeight: 600,
                        textTransform: 'uppercase'
                      }}>
                        {session.section}
                      </span>
                      
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '1rem', fontWeight: 700 }}>
                          {session.exam_type} Practice Attempt
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {formatDate(session.created_at)}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', textAlign: 'right' }}>Score</span>
                        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>
                          {session.overall_score} {unit}
                        </span>
                      </div>
                      <span style={{ fontSize: '1.2rem', transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>
                        ▶
                      </span>
                    </div>
                  </div>

                  {/* Expandable Accordion Body */}
                  {isOpen && (
                    <div className="anim-fade" style={{
                      padding: '24px',
                      borderTop: '1px solid var(--border-color)',
                      background: 'rgba(0,0,0,0.1)'
                    }}>
                      {!details ? (
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid var(--border-color)', borderTopColor: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
                          <span style={{ fontSize: '0.85rem' }}>Loading response logs...</span>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                          
                          {/* Question Type & Prompt */}
                          <div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                              Task Format: {details.question_type}
                            </span>
                            <div style={{
                              background: 'rgba(255,255,255,0.01)',
                              border: '1px solid var(--border-color)',
                              padding: '16px',
                              borderRadius: 'var(--radius-sm)',
                              marginTop: '6px',
                              fontSize: '0.95rem',
                              lineHeight: '1.5',
                              color: 'var(--text-primary)',
                              whiteSpace: 'pre-line'
                            }}>
                              {details.question_prompt}
                            </div>
                          </div>

                          {/* User Written/Spoken Answer */}
                          <div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                              Your Answer / Transcript
                            </span>
                            <div style={{
                              background: 'rgba(0,0,0,0.15)',
                              border: '1px solid var(--border-color)',
                              padding: '16px',
                              borderRadius: 'var(--radius-sm)',
                              marginTop: '6px',
                              fontSize: '0.95rem',
                              lineHeight: '1.6',
                              color: 'var(--text-secondary)'
                            }}>
                              {details.user_text_response || 'No text content.'}
                            </div>
                          </div>

                          {/* Section-Specific AI Grade Breakdown */}
                          {session.section === 'speaking' && details.ai_evaluation && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 16px', borderRadius: '6px' }}>
                                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Pronunciation</span>
                                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--success)' }}>{details.ai_evaluation.pronunciationScore}</div>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 16px', borderRadius: '6px' }}>
                                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Fluency</span>
                                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#06b6d4' }}>{details.ai_evaluation.fluencyScore}</div>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 16px', borderRadius: '6px' }}>
                                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Pacing</span>
                                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#a855f7' }}>{details.ai_evaluation.pacingScore}</div>
                                </div>
                              </div>
                              
                              <div>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                                  {details.ai_evaluation.isFreeSpeaking ? 'Spoken Self-Assessment' : 'Pronunciation Trace'}
                                </span>
                                <div className="word-feedback-container" style={{ marginTop: '6px', fontSize: '1.1rem' }}>
                                  {details.ai_evaluation.wordTrace?.map((w: any, idx: number) => (
                                    <span key={idx} className={`feedback-word ${w.status}`}>
                                      {w.word}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                <strong>Coaching Feedback:</strong> {details.ai_evaluation.coachingFeedback}
                              </div>
                            </div>
                          )}

                          {session.section === 'writing' && details.ai_evaluation && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                              
                              {/* Error Lists */}
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                                <div>
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Spelling/Grammar Errors</span>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                                    {details.ai_evaluation.errors?.map((err: any, idx: number) => (
                                      <div key={idx} style={{ background: 'rgba(244,63,94,0.05)', padding: '8px 12px', borderLeft: '2px solid var(--error)', borderRadius: '4px' }}>
                                        <span style={{ textDecoration: 'line-through', color: 'var(--error)' }}>"{err.original}"</span> → <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>"{err.corrected}"</span>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>{err.explanation}</div>
                                      </div>
                                    ))}
                                    {(!details.ai_evaluation.errors || details.ai_evaluation.errors.length === 0) && (
                                      <div style={{ fontSize: '0.85rem', color: 'var(--success)' }}>No spelling or grammar errors.</div>
                                    )}
                                  </div>
                                </div>

                                <div>
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Vocabulary Enhancements</span>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                                    {details.ai_evaluation.vocabularyImprovements?.map((vocab: any, idx: number) => (
                                      <div key={idx} style={{ background: 'rgba(6,182,212,0.05)', padding: '8px 12px', borderLeft: '2px solid var(--accent-cyan)', borderRadius: '4px' }}>
                                        <span>"{vocab.original}"</span> → <span style={{ color: 'var(--accent-cyan)', fontWeight: 'bold' }}>"{vocab.betterOption}"</span>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>{vocab.reason}</div>
                                      </div>
                                    ))}
                                    {(!details.ai_evaluation.vocabularyImprovements || details.ai_evaluation.vocabularyImprovements.length === 0) && (
                                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No vocab recommendations.</div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                <strong>Coaching Feedback:</strong> {details.ai_evaluation.generalFeedback}
                              </div>

                            </div>
                          )}

                          {session.section === 'reading' && (
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                              Attempt completed with direct interactive answer checking.
                            </div>
                          )}

                        </div>
                      )}
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            📭 No test sessions recorded yet. Start practicing on the dashboard to log your scores.
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
