'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import AudioRecorder from '@/components/AudioRecorder';

const convertBlobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result?.toString().split(',')[1];
      if (base64) resolve(base64);
      else reject('Failed to convert blob to base64');
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export default function VocabularyPage() {
  const [user, setUser] = useState<any>(null);
  const [vocabItems, setVocabItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Manual word adding
  const [newWord, setNewWord] = useState('');
  const [adding, setAdding] = useState(false);

  // Navigation tab view mode
  const [viewMode, setViewMode] = useState<'list' | 'flashcards' | 'trainer'>('list');

  // Flashcard states
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Trainer States
  const [trainerWord, setTrainerWord] = useState<string>('');
  const [trainerDetails, setTrainerDetails] = useState<any>(null);
  const [trainerPracticeMode, setTrainerPracticeMode] = useState<'writing' | 'speaking'>('writing');
  const [trainerWritingSentence, setTrainerWritingSentence] = useState('');
  const [trainerIsEvaluating, setTrainerIsEvaluating] = useState(false);
  const [trainerEvalResult, setTrainerEvalResult] = useState<any>(null);
  const [trainerSuggestingWord, setTrainerSuggestingWord] = useState(false);
  const [trainerSpeakingAudioUrl, setTrainerSpeakingAudioUrl] = useState<string | null>(null);
  const [trainerIsSaved, setTrainerIsSaved] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then((res: any) => {
      const user = res.data?.user;
      if (!user) {
        window.location.href = '/login';
      } else {
        setUser(user);
        fetchVocabulary(user.id);
      }
    });
  }, []);

  const fetchVocabulary = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('vocabulary_items')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVocabItems(data || []);
    } catch (e) {
      console.error('Failed to load vocabulary', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWord = async (e: React.FormEvent) => {
    e.preventDefault();
    const word = newWord.trim().toLowerCase();
    if (!word || !user) return;

    setAdding(true);
    try {
      // 1. Fetch word definition from helper API
      const res = await fetch(`/api/vocab-helper?word=${word}`);
      const data = await res.json();

      // 2. Insert into database
      const { error } = await supabase
        .from('vocabulary_items')
        .upsert({
          user_id: user.id,
          word: data.word,
          definition: data.definition,
          example_sentence: data.example || data.example_sentence,
          mastery_level: 1,
          next_review_at: new Date().toISOString()
        });

      if (error) throw error;
      
      setNewWord('');
      fetchVocabulary(user.id);
    } catch (e) {
      alert('Failed to add word. Make sure the word spelling is correct.');
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteWord = async (id: string) => {
    if (!confirm('Are you sure you want to remove this word from your deck?')) return;
    try {
      const { error } = await supabase
        .from('vocabulary_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setVocabItems(prev => prev.filter(item => item.id !== id));
      
      // Reset practice bounds
      if (practiceIndex >= vocabItems.length - 1) {
        setPracticeIndex(0);
      }
    } catch (e) {
      alert('Failed to delete word.');
    }
  };

  const handleUpdateMastery = async (id: string, increase: boolean) => {
    const item = vocabItems.find(x => x.id === id);
    if (!item) return;

    let newLevel = item.mastery_level;
    if (increase) {
      newLevel = Math.min(5, newLevel + 1);
    } else {
      newLevel = Math.max(1, newLevel - 1);
    }

    try {
      await supabase
        .from('vocabulary_items')
        .update({ mastery_level: newLevel })
        .eq('id', id);

      setVocabItems(prev => prev.map(x => x.id === id ? { ...x, mastery_level: newLevel } : x));
      
      // Move to next card in practice
      setIsFlipped(false);
      setTimeout(() => {
        setPracticeIndex((prev) => (prev + 1) % vocabItems.length);
      }, 200);

    } catch (e) {
      console.error(e);
    }
  };

  // Trainer Handlers
  const handleSuggestWord = async () => {
    setTrainerSuggestingWord(true);
    setTrainerEvalResult(null);
    setTrainerWritingSentence('');
    setTrainerSpeakingAudioUrl(null);
    try {
      const res = await fetch('/api/vocab-helper?suggest=true');
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setTrainerDetails(data);
      setTrainerWord(data.word);

      // Check if word is already in study deck
      const isSaved = vocabItems.some(item => item.word.toLowerCase() === data.word.toLowerCase());
      setTrainerIsSaved(isSaved);
    } catch (e) {
      alert('Failed to suggest a word from AI. Please try again.');
    } finally {
      setTrainerSuggestingWord(false);
    }
  };

  const handleSelectWordFromDeck = (wordStr: string) => {
    if (!wordStr) return;
    const item = vocabItems.find(x => x.word.toLowerCase() === wordStr.toLowerCase());
    if (!item) return;

    setTrainerEvalResult(null);
    setTrainerWritingSentence('');
    setTrainerSpeakingAudioUrl(null);

    setTrainerDetails({
      word: item.word,
      definition: item.definition,
      example: item.example_sentence,
      synonyms: item.synonyms || [],
      level: item.level || 'B2'
    });
    setTrainerWord(item.word);
    setTrainerIsSaved(true);
  };

  const handleSaveTrainerWord = async () => {
    if (!trainerDetails || !user) return;
    try {
      const { error } = await supabase
        .from('vocabulary_items')
        .upsert({
          user_id: user.id,
          word: trainerDetails.word,
          definition: trainerDetails.definition,
          example_sentence: trainerDetails.example,
          mastery_level: 1,
          next_review_at: new Date().toISOString()
        });

      if (error) throw error;
      setTrainerIsSaved(true);
      fetchVocabulary(user.id);
    } catch (e) {
      alert('Failed to save word to study deck.');
    }
  };

  const handleSubmitWritingTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trainerWritingSentence.trim() || !trainerWord) return;

    setTrainerIsEvaluating(true);
    setTrainerEvalResult(null);
    try {
      const res = await fetch('/api/evaluate-vocab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word: trainerWord,
          sentence: trainerWritingSentence,
          mode: 'writing'
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setTrainerEvalResult(data);
    } catch (e) {
      alert('Failed to evaluate sentence.');
    } finally {
      setTrainerIsEvaluating(false);
    }
  };

  const handleSpeakingTestStop = async (blob: Blob, url: string, transcript?: string) => {
    if (blob.size < 1000) {
      alert("No audio was recorded. Please check your mic and try again.");
      return;
    }
    setTrainerSpeakingAudioUrl(url);
    setTrainerIsEvaluating(true);
    setTrainerEvalResult(null);

    try {
      const base64 = await convertBlobToBase64(blob);
      const res = await fetch('/api/evaluate-vocab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word: trainerWord,
          mode: 'speaking',
          audioBase64: base64,
          clientTranscript: transcript || ''
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setTrainerEvalResult(data);
    } catch (e) {
      alert('Failed to evaluate speaking response.');
    } finally {
      setTrainerIsEvaluating(false);
    }
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
        
        {/* Back navigation */}
        <div style={{ marginBottom: '24px' }}>
          <Link href="/dashboard" style={{ color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}>
            ← Back to Dashboard
          </Link>
        </div>

        {/* Title */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Your Vocabulary Deck</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Review saved vocabulary words and practice with interactive flashcards.</p>
          </div>
        </div>

        {/* Navigation Switcher Tabs */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setViewMode('list')} 
            className={viewMode === 'list' ? 'glow-btn' : 'secondary-btn'} 
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          >
            📚 Word List
          </button>
          <button 
            onClick={() => {
              if (vocabItems.length > 0) {
                setViewMode('flashcards');
                setIsFlipped(false);
                setPracticeIndex(0);
              }
            }} 
            className={viewMode === 'flashcards' ? 'glow-btn' : 'secondary-btn'} 
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            disabled={vocabItems.length === 0}
          >
            ⚡ Flashcards ({vocabItems.length})
          </button>
          <button 
            onClick={() => setViewMode('trainer')} 
            className={viewMode === 'trainer' ? 'glow-btn' : 'secondary-btn'} 
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          >
            🎯 Active AI Trainer
          </button>
        </div>

        {/* Flashcards View */}
        {viewMode === 'flashcards' && vocabItems.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', maxWidth: '500px', margin: '0 auto' }}>
            
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Card {practiceIndex + 1} of {vocabItems.length}
            </div>

            {/* Flashcard container with flip animation */}
            <div 
              className={`flashcard ${isFlipped ? 'flipped' : ''}`}
              onClick={() => setIsFlipped(!isFlipped)}
              style={{
                width: '100%',
                height: '300px',
                position: 'relative',
                cursor: 'pointer',
                perspective: '1000px'
              }}
            >
              <div className="card-inner" style={{
                width: '100%',
                height: '100%',
                transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                transformStyle: 'preserve-3d',
                transform: isFlipped ? 'rotateY(180deg)' : 'none'
              }}>
                {/* Front side */}
                <div className="glass-panel card-front" style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  backfaceVisibility: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '24px'
                }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Word</span>
                  <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'white', textTransform: 'capitalize' }}>
                    {vocabItems[practiceIndex]?.word}
                  </h2>
                  <span style={{ fontSize: '0.75rem', marginTop: '16px', color: 'var(--primary)' }}>Click Card to Flip</span>
                </div>

                {/* Back side */}
                <div className="glass-panel card-back" style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  padding: '32px',
                  background: 'rgba(22, 26, 49, 0.95)'
                }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Definition</span>
                  <p style={{ fontSize: '1rem', color: 'white', marginBottom: '16px', lineHeight: '1.5' }}>
                    {vocabItems[practiceIndex]?.definition}
                  </p>
                  
                  {vocabItems[practiceIndex]?.example_sentence && (
                    <>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Example</span>
                      <p style={{ fontSize: '0.85rem', fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                        "{vocabItems[practiceIndex]?.example_sentence}"
                      </p>
                    </>
                  )}

                  <div style={{ marginTop: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Mastery Level: {vocabItems[practiceIndex]?.mastery_level} / 5
                  </div>
                </div>

              </div>
            </div>

            {/* Flip control grading */}
            {isFlipped && (
              <div className="anim-fade" style={{ display: 'flex', gap: '12px', width: '100%' }}>
                <button 
                  onClick={() => handleUpdateMastery(vocabItems[practiceIndex].id, false)}
                  className="secondary-btn" 
                  style={{ flex: 1, padding: '12px', borderColor: 'var(--error)', color: 'var(--error)' }}
                >
                  ❌ Hard (Review)
                </button>
                <button 
                  onClick={() => handleUpdateMastery(vocabItems[practiceIndex].id, true)}
                  className="secondary-btn" 
                  style={{ flex: 1, padding: '12px', borderColor: 'var(--success)', color: 'var(--success)' }}
                >
                  ✓ Easy (Mastered)
                </button>
              </div>
            )}

          </div>
        )}

        {/* Word List View */}
        {viewMode === 'list' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {/* Adding word manually */}
            <form onSubmit={handleAddWord} className="glass-card" style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: '16px',
              padding: '20px 24px',
              background: 'rgba(255, 255, 255, 0.01)'
            }}>
              <div className="form-group" style={{ flex: 1, margin: 0 }}>
                <label className="form-label">Add a Word to Deck</label>
                <input 
                  type="text" 
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value)}
                  placeholder="Enter word e.g. ephemeral"
                  className="form-input"
                  disabled={adding}
                  required
                />
              </div>
              <button 
                type="submit" 
                className="glow-btn" 
                disabled={adding}
                style={{ padding: '12px 24px', height: '45px', borderRadius: 'var(--radius-sm)' }}
              >
                {adding ? 'Adding...' : 'Add Word'}
              </button>
            </form>

            {/* List */}
            {vocabItems.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {vocabItems.map((item) => (
                  <div key={item.id} className="glass-card" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '24px'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '8px' }}>
                        <h3 style={{ textTransform: 'capitalize', fontSize: '1.25rem', fontWeight: 700 }}>
                          {item.word}
                        </h3>
                        <span style={{
                          fontSize: '0.7rem',
                          background: `rgba(99, 102, 241, ${0.1 * item.mastery_level})`,
                          color: 'var(--primary)',
                          border: '1px solid rgba(99,102,241,0.2)',
                          padding: '1px 8px',
                          borderRadius: '10px'
                        }}>
                          Mastery: Lvl {item.mastery_level}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                        <strong>Definition:</strong> {item.definition}
                      </p>
                      {item.example_sentence && (
                        <p style={{ fontSize: '0.85rem', fontStyle: 'italic', color: 'var(--text-muted)' }}>
                          "{item.example_sentence}"
                        </p>
                      )}
                    </div>
                    
                    <button 
                      onClick={() => handleDeleteWord(item.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        fontSize: '1.2rem',
                        padding: '4px'
                      }}
                      title="Remove word"
                      className="delete-icon"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                📖 No words saved yet. Double-click any word during reading practice to add it here, or type one above!
              </div>
            )}

          </div>
        )}

        {/* AI Active Trainer Mode */}
        {viewMode === 'trainer' && (
          <div className="anim-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {/* Word Generator & Selector Header */}
            <div className="glass-card" style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center', justifyContent: 'space-between', padding: '24px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '6px' }}>AI Vocabulary Practice Arena</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Learn new words, review definitions, and test yourself in speaking or writing sentence constructions.
                </p>
              </div>
              
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                  onClick={handleSuggestWord}
                  disabled={trainerSuggestingWord}
                  className="glow-btn"
                  style={{ padding: '10px 20px', fontSize: '0.85rem' }}
                >
                  {trainerSuggestingWord ? '✨ Suggesting...' : '✨ Suggest AI Word'}
                </button>

                {vocabItems.length > 0 && (
                  <select
                    onChange={(e) => handleSelectWordFromDeck(e.target.value)}
                    value={trainerWord}
                    style={{
                      background: '#161a31',
                      border: '1px solid var(--border-color)',
                      color: 'white',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">Or practice a saved word...</option>
                    {vocabItems.map(item => (
                      <option key={item.id} value={item.word}>
                        {item.word} (Lvl {item.mastery_level})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Word Details Card */}
            {trainerDetails ? (
              <div className="glass-panel" style={{ padding: '32px', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 800, textTransform: 'capitalize', color: 'white', margin: 0 }}>
                      {trainerDetails.word}
                    </h2>
                    {trainerDetails.level && (
                      <span style={{ fontSize: '0.75rem', background: 'var(--primary-glow)', color: 'var(--primary)', border: '1px solid rgba(99,102,241,0.2)', padding: '2px 10px', borderRadius: '12px', fontWeight: 600 }}>
                        {trainerDetails.level} Level
                      </span>
                    )}
                  </div>

                  {!trainerIsSaved ? (
                    <button
                      onClick={handleSaveTrainerWord}
                      className="secondary-btn"
                      style={{ padding: '6px 12px', fontSize: '0.8rem', borderColor: 'var(--primary)', color: 'var(--primary)' }}
                    >
                      💾 Save to Study Deck
                    </button>
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: 'var(--success)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      ✓ Saved in Study Deck
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Definition</span>
                    <p style={{ fontSize: '1.05rem', color: 'var(--text-primary)', margin: 0 }}>{trainerDetails.definition}</p>
                  </div>

                  {trainerDetails.synonyms && trainerDetails.synonyms.length > 0 && (
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Synonyms</span>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                        {trainerDetails.synonyms.map((s: string, idx: number) => (
                          <span key={idx} style={{ fontSize: '0.8', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', padding: '2px 8px', borderRadius: '4px' }}>
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {trainerDetails.example && (
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Usage Example</span>
                      <p style={{ fontSize: '0.9rem', fontStyle: 'italic', color: 'var(--text-secondary)', margin: 0 }}>
                        "{trainerDetails.example}"
                      </p>
                    </div>
                  )}
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '24px 0' }} />

                {/* Practice Sub-tab selectors */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                  <button
                    onClick={() => {
                      setTrainerPracticeMode('writing');
                      setTrainerEvalResult(null);
                      setTrainerWritingSentence('');
                      setTrainerSpeakingAudioUrl(null);
                    }}
                    className={trainerPracticeMode === 'writing' ? 'glow-btn' : 'secondary-btn'}
                    style={{ flex: 1, padding: '10px', fontSize: '0.85rem' }}
                  >
                    ✍️ Test Writing Sentence
                  </button>
                  <button
                    onClick={() => {
                      setTrainerPracticeMode('speaking');
                      setTrainerEvalResult(null);
                      setTrainerWritingSentence('');
                      setTrainerSpeakingAudioUrl(null);
                    }}
                    className={trainerPracticeMode === 'speaking' ? 'glow-btn' : 'secondary-btn'}
                    style={{ flex: 1, padding: '10px', fontSize: '0.85rem' }}
                  >
                    🎙️ Test Speaking Sentence
                  </button>
                </div>

                {/* Writing Workspace */}
                {trainerPracticeMode === 'writing' && (
                  <form onSubmit={handleSubmitWritingTest} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.85rem' }}>
                        Construct a sentence using the word "<strong>{trainerWord}</strong>":
                      </label>
                      <textarea
                        rows={3}
                        value={trainerWritingSentence}
                        onChange={(e) => setTrainerWritingSentence(e.target.value)}
                        placeholder={`Type your sentence here e.g. Famous stars learn quickly that popularity is ephemeral.`}
                        className="form-input"
                        disabled={trainerIsEvaluating}
                        required
                        style={{ fontFamily: 'inherit', fontSize: '0.95rem', resize: 'vertical' }}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={trainerIsEvaluating || !trainerWritingSentence.trim()}
                      className="glow-btn"
                      style={{ padding: '10px 20px', alignSelf: 'flex-end' }}
                    >
                      {trainerIsEvaluating ? 'Evaluating...' : 'Submit Sentence'}
                    </button>
                  </form>
                )}

                {/* Speaking Workspace */}
                {trainerPracticeMode === 'speaking' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      Speak a complete sentence using the word "<strong>{trainerWord}</strong>":
                    </div>
                    
                    <div style={{ display: trainerIsEvaluating ? 'none' : 'block' }}>
                      <AudioRecorder
                        onStop={handleSpeakingTestStop}
                        parentState={trainerIsEvaluating ? 'evaluating' : trainerEvalResult ? 'graded' : 'idle'}
                      />
                    </div>

                    {trainerIsEvaluating && (
                      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '24px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid var(--border-color)', borderTopColor: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>AI Speech Engine evaluating sentence...</span>
                      </div>
                    )}

                    {trainerSpeakingAudioUrl && !trainerIsEvaluating && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Recorded response audio:</span>
                        <audio src={trainerSpeakingAudioUrl} controls style={{ width: '100%', height: '36px' }} />
                      </div>
                    )}
                  </div>
                )}

                {/* Feedback Panel */}
                {trainerEvalResult && (
                  <div className="anim-slide-up" style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                      <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>📋 Evaluation Feedback</span>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <span style={{ fontSize: '0.85rem' }}>
                          Word Used: {trainerEvalResult.wordUsed ? (
                            <span style={{ color: 'var(--success)', fontWeight: 600 }}>Yes ✓</span>
                          ) : (
                            <span style={{ color: 'var(--error)', fontWeight: 600 }}>No ❌</span>
                          )}
                        </span>
                        {trainerEvalResult.usageCorrect !== undefined && (
                          <span style={{ fontSize: '0.85rem' }}>
                            Usage Correct: {trainerEvalResult.usageCorrect ? (
                              <span style={{ color: 'var(--success)', fontWeight: 600 }}>Yes ✓</span>
                            ) : (
                              <span style={{ color: 'var(--error)', fontWeight: 600 }}>No ❌</span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', background: 'rgba(0,0,0,0.1)', padding: '12px', borderRadius: '6px' }}>
                      {trainerEvalResult.score !== undefined && (
                        <div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Accuracy Score</span>
                          <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>{trainerEvalResult.score} / 100</span>
                        </div>
                      )}
                      {trainerEvalResult.overallScore !== undefined && (
                        <div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Overall Speaking</span>
                          <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>{trainerEvalResult.overallScore} / 100</span>
                        </div>
                      )}
                      {trainerEvalResult.pronunciationScore !== undefined && (
                        <div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Pronunciation</span>
                          <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--success)' }}>{trainerEvalResult.pronunciationScore} / 100</span>
                        </div>
                      )}
                      {trainerEvalResult.fluencyScore !== undefined && (
                        <div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Fluency</span>
                          <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#06b6d4' }}>{trainerEvalResult.fluencyScore} / 100</span>
                        </div>
                      )}
                    </div>

                    {trainerEvalResult.transcription && (
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Speech Transcription</span>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', margin: 0, padding: '8px', background: 'rgba(0,0,0,0.1)', borderRadius: '4px' }}>
                          "{trainerEvalResult.transcription}"
                        </p>
                      </div>
                    )}

                    {trainerEvalResult.corrections && (
                      <div style={{ borderLeft: '3px solid var(--primary)', paddingLeft: '12px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Suggested Corrections</span>
                        <p style={{ fontSize: '0.9rem', color: 'var(--success)', fontWeight: 500, margin: 0 }}>
                          {trainerEvalResult.corrections}
                        </p>
                      </div>
                    )}

                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>AI Coaching</span>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
                        {trainerEvalResult.feedback}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                🎯 Select a word from your saved list or click <strong>✨ Suggest AI Word</strong> above to start interactive speaking and writing assessments!
              </div>
            )}

          </div>
        )}

      </div>
      <style jsx>{`
        .delete-icon:hover {
          color: var(--error) !important;
        }
      `}</style>
    </>
  );
}
