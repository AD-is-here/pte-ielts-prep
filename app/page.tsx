'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then((res: any) => {
      const user = res.data?.user;
      if (user) {
        setIsAuthenticated(true);
        window.location.href = '/dashboard';
      } else {
        setLoading(false);
      }
    });
  }, []);

  if (loading && isAuthenticated) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontFamily: 'var(--font-geist-sans)'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          border: '3px solid var(--border-color)',
          borderTopColor: 'var(--primary)',
          animation: 'spin 1s linear infinite'
        }} />
        <style jsx global>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main style={{
        padding: '80px 20px',
        maxWidth: '1200px',
        margin: '0 auto',
        fontFamily: 'var(--font-geist-sans)'
      }} className="anim-fade">
        
        {/* Hero Section */}
        <section style={{
          textAlign: 'center',
          marginBottom: '100px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--primary-glow)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: '24px',
            padding: '6px 16px',
            fontSize: '0.85rem',
            color: 'var(--primary)',
            fontWeight: 600,
            marginBottom: '24px'
          }}>
            ✨ AI-Powered English Exam Grading
          </div>
          
          <h1 className="glow-text" style={{
            fontSize: '4rem',
            lineHeight: '1.1',
            fontWeight: 800,
            maxWidth: '800px',
            marginBottom: '24px',
            background: 'linear-gradient(180deg, #ffffff 0%, #cbd5e1 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Master the PTE & IELTS Exams with Immediate AI Feedback
          </h1>
          
          <p style={{
            fontSize: '1.25rem',
            color: 'var(--text-secondary)',
            maxWidth: '650px',
            marginBottom: '40px',
            lineHeight: '1.6'
          }}>
            Practice English speaking, writing, and reading. Record your voice, write essays, and get graded instantly with detailed pronunciation highlights, spelling checks, and vocabulary suggestions.
          </p>

          <div style={{ display: 'flex', gap: '16px' }}>
            <Link href="/login" className="glow-btn" style={{
              padding: '16px 32px',
              fontSize: '1.1rem',
              borderRadius: 'var(--radius-sm)'
            }}>
              Start Practicing Free
            </Link>
            <a href="#features" className="secondary-btn" style={{
              padding: '16px 32px',
              fontSize: '1.1rem',
              borderRadius: 'var(--radius-sm)'
            }}>
              Explore Modules
            </a>
          </div>
        </section>

        {/* Feature Grid */}
        <section id="features" style={{ marginBottom: '120px' }}>
          <h2 style={{
            fontSize: '2.5rem',
            textAlign: 'center',
            marginBottom: '16px',
            fontWeight: 800
          }}>
            Everything You Need to Get 8+ Bands / 79+ Score
          </h2>
          <p style={{
            textAlign: 'center',
            color: 'var(--text-secondary)',
            marginBottom: '60px',
            fontSize: '1.1rem'
          }}>
            Interactive training spaces engineered specifically for PTE and IELTS modular patterns.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px'
          }}>
            
            {/* Speaking Practice */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'var(--primary-glow)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
                fontSize: '1.5rem'
              }}>
                🎙️
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Speaking Practice</h3>
              <p style={{ fontSize: '0.95rem' }}>
                Record your voice answering PTE Read Alouds or IELTS cue cards. Our AI analyzes your raw audio to highlight exactly which words you mispronounced, grading your fluency and pacing instantly.
              </p>
            </div>

            {/* Writing Evaluation */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(168, 85, 247, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#a855f7',
                fontSize: '1.5rem'
              }}>
                ✍️
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Writing Checkers</h3>
              <p style={{ fontSize: '0.95rem' }}>
                Draft essays or summaries with integrated character counters and countdown timers. Get immediate, rubric-aligned scores for grammar accuracy, task relevance, coherence, and spelling errors.
              </p>
            </div>

            {/* Reading & Vocab */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(6, 182, 212, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#06b6d4',
                fontSize: '1.5rem'
              }}>
                📖
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Vocabulary Booster</h3>
              <p style={{ fontSize: '0.95rem' }}>
                Read authentic PTE/IELTS passages. Double-click any unfamiliar word to trigger an instant AI tooltip showing its definition, pronunciation, and contextual synonyms. Add it to your review deck.
              </p>
            </div>

          </div>
        </section>

        {/* Dynamic Analytics Preview */}
        <section className="glass-panel" style={{
          padding: '60px 40px',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          background: 'radial-gradient(circle at top right, rgba(99, 102, 241, 0.1), transparent), var(--bg-surface-glass)'
        }}>
          <h2 className="glow-text" style={{ fontSize: '2rem', marginBottom: '16px', fontWeight: 800 }}>
            Daily Score Tracking & Historical Insights
          </h2>
          <p style={{
            maxWidth: '650px',
            color: 'var(--text-secondary)',
            marginBottom: '40px',
            fontSize: '1rem'
          }}>
            Every practice session automatically saves to your profile database. Watch your speaking bands increase, review spelling mistakes you made last week, and practice vocabulary spaced repetition.
          </p>
          
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '40px',
            width: '100%',
            maxWidth: '800px',
            marginTop: '20px'
          }}>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--primary)' }}>100%</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Immediate Feedback</div>
            </div>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <div style={{ fontSize: '3rem', fontWeight: 800, color: '#a855f7' }}>0 Cost</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Fully Free Practice Portal</div>
            </div>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <div style={{ fontSize: '3rem', fontWeight: 800, color: '#06b6d4' }}>Gemini</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>AI-Assessed Accuracy</div>
            </div>
          </div>
        </section>

      </main>

      <footer style={{
        marginTop: '100px',
        padding: '40px 20px',
        borderTop: '1px solid var(--border-color)',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: '0.85rem'
      }}>
        © 2026 AuraPrep Portal. Powered by Google Gemini. All rights reserved.
      </footer>
    </>
  );
}
