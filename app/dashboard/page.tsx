'use client';

import React, { useEffect, useState } from 'react';
import { supabase, isMockMode } from '@/lib/supabaseClient';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTests: 0,
    avgOverall: 0,
    avgSpeaking: 0,
    avgWriting: 0,
    avgReading: 0,
  });

  // Target Settings Edit State
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [editExam, setEditExam] = useState('PTE');
  const [editScore, setEditScore] = useState(79);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleExportMockData = () => {
    const keys = ['mock_user', 'mock_session', 'mock_profiles', 'mock_test_sessions', 'mock_test_responses', 'mock_vocabulary_items'];
    const backup: Record<string, any> = {};
    keys.forEach(k => {
      const val = localStorage.getItem(k);
      if (val) backup[k] = JSON.parse(val);
    });

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "auraprep_mock_data_backup.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  useEffect(() => {
    supabase.auth.getUser().then((res: any) => {
      const user = res.data?.user;
      if (!user) {
        window.location.href = '/login';
      } else {
        setUser(user);
        fetchProfileAndStats(user.id);
      }
    });
  }, []);

  const fetchProfileAndStats = async (userId: string) => {
    try {
      // 1. Fetch Profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId);

      let currentProfile = null;
      if (profileData && profileData.length > 0) {
        currentProfile = profileData[0];
        setProfile(currentProfile);
        setEditExam(currentProfile.preferred_exam);
        setEditScore(currentProfile.target_score);
      }

      // 2. Fetch Sessions for stats
      const { data: sessions } = await supabase
        .from('test_sessions')
        .select('*')
        .eq('user_id', userId);

      if (sessions && sessions.length > 0) {
        const total = sessions.length;
        
        let overallSum = 0;
        let speakSum = 0, speakCount = 0;
        let writeSum = 0, writeCount = 0;
        let readSum = 0, readCount = 0;

        sessions.forEach((s: any) => {
          if (s.overall_score) overallSum += Number(s.overall_score);
          if (s.section === 'speaking' && s.overall_score) {
            speakSum += Number(s.overall_score);
            speakCount++;
          }
          if (s.section === 'writing' && s.overall_score) {
            writeSum += Number(s.overall_score);
            writeCount++;
          }
          if (s.section === 'reading' && s.overall_score) {
            readSum += Number(s.overall_score);
            readCount++;
          }
        });

        setStats({
          totalTests: total,
          avgOverall: Math.round((overallSum / total) * 10) / 10,
          avgSpeaking: speakCount > 0 ? Math.round((speakSum / speakCount) * 10) / 10 : 0,
          avgWriting: writeCount > 0 ? Math.round((writeSum / writeCount) * 10) / 10 : 0,
          avgReading: readCount > 0 ? Math.round((readSum / readCount) * 10) / 10 : 0,
        });
      }
    } catch (e) {
      console.error('Error fetching dashboard metrics', e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTarget = async () => {
    if (!user) return;
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          preferred_exam: editExam,
          target_score: Number(editScore),
          full_name: profile?.full_name,
          avatar_url: profile?.avatar_url,
        });

      if (error) throw error;
      setProfile((prev: any) => ({
        ...prev,
        preferred_exam: editExam,
        target_score: Number(editScore),
      }));
      setIsEditingTarget(false);
      
      // Reload stats and page info
      fetchProfileAndStats(user.id);
    } catch (err) {
      alert('Failed to update targets. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid var(--border-color)', borderTopColor: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  // Calculate score circle percentage
  // PTE max = 90, IELTS max = 9
  const isPTE = profile?.preferred_exam === 'PTE';
  const maxScore = isPTE ? 90 : 9;
  const targetPercent = Math.min(100, Math.round(((profile?.target_score || 0) / maxScore) * 100));
  const currentPercent = Math.min(100, Math.round((stats.avgOverall / maxScore) * 100));

  return (
    <>
      <Navbar />
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '20px',
        fontFamily: 'var(--font-geist-sans)'
      }} className="anim-fade">
        
        {/* Header Block */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
          marginBottom: '32px'
        }}>
          <div>
            <h1 style={{ fontSize: '2.25rem', fontWeight: 800 }}>Welcome, {profile?.full_name}!</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Track your daily practice sessions and improve with instant AI insights.</p>
            {isMockMode && (
              <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '0.7rem', background: 'rgba(234, 179, 8, 0.15)', color: '#eab308', padding: '3px 10px', borderRadius: '12px', border: '1px solid rgba(234,179,8,0.2)', fontWeight: 600 }}>
                  ⚠️ Local Mock Mode
                </span>
                <button 
                  onClick={handleExportMockData}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary)',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    textDecoration: 'underline',
                    padding: 0
                  }}
                >
                  Download Local Backup (JSON)
                </button>
              </div>
            )}
          </div>

          {/* Target Preferences Widget */}
          <div className="glass-panel" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
            {isEditingTarget ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Exam</span>
                  <select 
                    value={editExam} 
                    onChange={(e) => {
                      setEditExam(e.target.value);
                      setEditScore(e.target.value === 'PTE' ? 79 : 7.5);
                    }}
                    style={{
                      background: '#161a31',
                      border: '1px solid var(--border-color)',
                      color: 'white',
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-sm)'
                    }}
                  >
                    <option value="PTE">PTE Academic</option>
                    <option value="IELTS">IELTS Academic</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Target Score</span>
                  <input 
                    type="number"
                    step={editExam === 'PTE' ? '1' : '0.5'}
                    min="1"
                    max={editExam === 'PTE' ? '90' : '9'}
                    value={editScore} 
                    onChange={(e) => setEditScore(Number(e.target.value))}
                    style={{
                      width: '80px',
                      background: '#161a31',
                      border: '1px solid var(--border-color)',
                      color: 'white',
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-sm)'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '6px', alignSelf: 'flex-end', marginTop: '10px' }}>
                  <button 
                    onClick={handleUpdateTarget} 
                    disabled={isUpdating}
                    className="glow-btn" 
                    style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)' }}
                  >
                    Save
                  </button>
                  <button 
                    onClick={() => setIsEditingTarget(false)} 
                    className="secondary-btn" 
                    style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Current Goal</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {profile?.preferred_exam} — Target: {profile?.target_score}
                  </div>
                </div>
                <button 
                  onClick={() => setIsEditingTarget(true)} 
                  className="secondary-btn" 
                  style={{ padding: '8px 14px', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)' }}
                >
                  Edit Target
                </button>
              </>
            )}
          </div>
        </div>

        {/* Progress Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px',
          marginBottom: '48px'
        }}>
          
          {/* Circular Score Metrics Card */}
          <div className="glass-card" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '24px'
          }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Your Average Score</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                {stats.totalTests === 0 
                  ? 'No practice sessions logged yet.' 
                  : `Calculated from ${stats.totalTests} modular attempts.`}
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Avg:</span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>
                    {stats.avgOverall} / {maxScore}
                  </div>
                </div>
                <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '12px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Target:</span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {profile?.target_score} / {maxScore}
                  </div>
                </div>
              </div>
            </div>

            {/* Custom CSS Radial Graph */}
            <div style={{ position: 'relative', width: '110px', height: '110px' }}>
              <svg width="110" height="110" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="3"
                />
                {/* Target Score Arc */}
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="rgba(99, 102, 241, 0.2)"
                  strokeWidth="3"
                  strokeDasharray={`${targetPercent}, 100`}
                />
                {/* Current Score Arc */}
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="url(#purpleGradient)"
                  strokeWidth="3"
                  strokeDasharray={`${currentPercent}, 100`}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                </defs>
              </svg>
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center'
              }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                  {stats.avgOverall || '-'}
                </span>
                <span style={{ fontSize: '0.65rem', display: 'block', color: 'var(--text-muted)' }}>
                  Goal: {profile?.target_score}
                </span>
              </div>
            </div>

          </div>

          {/* Section Breakdown Bars */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>Section Breakdown</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Speaking */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                  <span>Speaking Accuracy</span>
                  <span style={{ fontWeight: 600 }}>{stats.avgSpeaking} / {maxScore}</span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.min(100, Math.round((stats.avgSpeaking / maxScore) * 100))}%`,
                    height: '100%',
                    background: 'var(--primary-gradient)',
                    borderRadius: '3px'
                  }} />
                </div>
              </div>

              {/* Writing */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                  <span>Writing Competency</span>
                  <span style={{ fontWeight: 600 }}>{stats.avgWriting} / {maxScore}</span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.min(100, Math.round((stats.avgWriting / maxScore) * 100))}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #a855f7 0%, #06b6d4 100%)',
                    borderRadius: '3px'
                  }} />
                </div>
              </div>

              {/* Reading */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                  <span>Reading Comprehension</span>
                  <span style={{ fontWeight: 600 }}>{stats.avgReading} / {maxScore}</span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.min(100, Math.round((stats.avgReading / maxScore) * 100))}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #06b6d4 0%, #10b981 100%)',
                    borderRadius: '3px'
                  }} />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Practice Arena Grid */}
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '24px' }}>Modular Practice Arena</h2>
        
        {/* Toggle Grid: PTE vs IELTS task formats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* PTE Section */}
          <div className="glass-panel" style={{ padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <span style={{ fontSize: '1.75rem' }}>⚡</span>
              <div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 700 }}>PTE Academic Practice</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Automated grading designed for the Pearson Test of English standard.</p>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '16px'
            }}>
              {/* Speaking: Read Aloud */}
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '180px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontSize: '0.75rem', background: 'var(--primary-glow)', color: 'var(--primary)', padding: '2px 8px', borderRadius: '12px', border: '1px solid rgba(99,102,241,0.2)' }}>Speaking</span>
                    <span style={{ fontSize: '1.25rem' }}>🎙️</span>
                  </div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '6px' }}>Read Aloud</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Read a text prompt aloud. AI evaluates pronunciation accuracy, rhythm, and speed.</p>
                </div>
                <Link href="/practice/speaking?exam=PTE&type=read-aloud" className="glow-btn" style={{ width: '100%', padding: '10px', fontSize: '0.85rem', marginTop: '16px' }}>
                  Practice Module
                </Link>
              </div>

              {/* Speaking: Repeat Sentence */}
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '180px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontSize: '0.75rem', background: 'var(--primary-glow)', color: 'var(--primary)', padding: '2px 8px', borderRadius: '12px', border: '1px solid rgba(99,102,241,0.2)' }}>Speaking</span>
                    <span style={{ fontSize: '1.25rem' }}>🎧</span>
                  </div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '6px' }}>Repeat Sentence</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Listen to an audio sentence clip and repeat it. Checks matching phoneme metrics.</p>
                </div>
                <Link href="/practice/speaking?exam=PTE&type=repeat-sentence" className="glow-btn" style={{ width: '100%', padding: '10px', fontSize: '0.85rem', marginTop: '16px' }}>
                  Practice Module
                </Link>
              </div>

              {/* Writing: Summarize Text */}
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '180px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontSize: '0.75rem', background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7', padding: '2px 8px', borderRadius: '12px', border: '1px solid rgba(168,85,247,0.2)' }}>Writing</span>
                    <span style={{ fontSize: '1.25rem' }}>✍️</span>
                  </div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '6px' }}>Write Essay</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Write a 200-300 word argumentative essay. Graded on grammar, vocab, structure.</p>
                </div>
                <Link href="/practice/writing?exam=PTE&type=essay" className="glow-btn" style={{ width: '100%', padding: '10px', fontSize: '0.85rem', marginTop: '16px' }}>
                  Practice Module
                </Link>
              </div>

              {/* Reading: Fill Blanks */}
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '180px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontSize: '0.75rem', background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4', padding: '2px 8px', borderRadius: '12px', border: '1px solid rgba(6,182,212,0.2)' }}>Reading</span>
                    <span style={{ fontSize: '1.25rem' }}>📖</span>
                  </div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '6px' }}>Fill in the Blanks</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Drag and drop vocabulary into paragraph blanks. Dynamic word helper tooltips inside.</p>
                </div>
                <Link href="/practice/reading?exam=PTE&type=fill-blanks" className="glow-btn" style={{ width: '100%', padding: '10px', fontSize: '0.85rem', marginTop: '16px' }}>
                  Practice Module
                </Link>
              </div>
            </div>
          </div>

          {/* IELTS Section */}
          <div className="glass-panel" style={{ padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <span style={{ fontSize: '1.75rem' }}>🛡️</span>
              <div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 700 }}>IELTS Academic Practice</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Standardized practice for the International English Language Testing System.</p>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '16px'
            }}>
              {/* Speaking: Cue Card */}
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '180px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontSize: '0.75rem', background: 'var(--primary-glow)', color: 'var(--primary)', padding: '2px 8px', borderRadius: '12px', border: '1px solid rgba(99,102,241,0.2)' }}>Speaking</span>
                    <span style={{ fontSize: '1.25rem' }}>📋</span>
                  </div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '6px' }}>Cue Card Task 2</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Speak for 2 minutes on a given prompt topic. AI assesses coherence, vocabulary, and grammar.</p>
                </div>
                <Link href="/practice/speaking?exam=IELTS&type=cue-card" className="glow-btn" style={{ width: '100%', padding: '10px', fontSize: '0.85rem', marginTop: '16px' }}>
                  Practice Module
                </Link>
              </div>

              {/* Writing: Task 2 Essay */}
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '180px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontSize: '0.75rem', background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7', padding: '2px 8px', borderRadius: '12px', border: '1px solid rgba(168,85,247,0.2)' }}>Writing</span>
                    <span style={{ fontSize: '1.25rem' }}>🖊️</span>
                  </div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '6px' }}>Academic Essay</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Write a 250+ word academic essay. Evaluated on band 1-9 criteria using IELTS rubrics.</p>
                </div>
                <Link href="/practice/writing?exam=IELTS&type=essay" className="glow-btn" style={{ width: '100%', padding: '10px', fontSize: '0.85rem', marginTop: '16px' }}>
                  Practice Module
                </Link>
              </div>

              {/* Reading: Academic Reading */}
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '180px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontSize: '0.75rem', background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4', padding: '2px 8px', borderRadius: '12px', border: '1px solid rgba(6,182,212,0.2)' }}>Reading</span>
                    <span style={{ fontSize: '1.25rem' }}>📖</span>
                  </div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '6px' }}>Academic Reading</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Read passages and answer complex comprehension quizzes with immediate feedback.</p>
                </div>
                <Link href="/practice/reading?exam=IELTS&type=passage" className="glow-btn" style={{ width: '100%', padding: '10px', fontSize: '0.85rem', marginTop: '16px' }}>
                  Practice Module
                </Link>
              </div>
            </div>
          </div>

        </div>

      </div>
    </>
  );
}
