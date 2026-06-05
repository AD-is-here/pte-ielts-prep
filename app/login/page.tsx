'use client';

import React, { useState, useEffect } from 'react';
import { supabase, isMockMode } from '@/lib/supabaseClient';
import Navbar from '@/components/Navbar';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getUser().then((res: any) => {
      const user = res.data?.user;
      if (user) {
        window.location.href = '/dashboard';
      }
    });
  }, []);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data?.user) {
          window.location.href = '/dashboard';
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data?.user) {
          window.location.href = '/dashboard';
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
        minHeight: 'calc(100vh - 120px)',
        padding: '20px'
      }} className="anim-fade">
        
        <div className="glass-card" style={{
          width: '100%',
          maxWidth: '450px',
          padding: '40px',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          textAlign: 'center'
        }}>
          
          <h2 className="glow-text" style={{ fontSize: '2rem', marginBottom: '8px', fontWeight: 800 }}>
            {isSignUp ? 'Create an Account' : 'Welcome Back'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '32px' }}>
            {isSignUp 
              ? 'Join AuraPrep and start tracking your PTE & IELTS scores.' 
              : 'Sign in to access your dashboard, tests, and vocabulary.'}
          </p>

          {isMockMode && (
            <div style={{
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              color: 'var(--warning)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 14px',
              fontSize: '0.8rem',
              marginBottom: '24px',
              textAlign: 'left',
              lineHeight: '1.4'
            }}>
              💡 <strong>Demo Mock Mode Active:</strong> You can enter any email/password to sign in/up instantly. No real database required.
            </div>
          )}

          {errorMsg && (
            <div style={{
              background: 'var(--error-glow)',
              border: '1px solid var(--error)',
              color: 'var(--error)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px',
              fontSize: '0.85rem',
              marginBottom: '24px',
              textAlign: 'left'
            }}>
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Email/Password Form */}
          <form onSubmit={handleAuthSubmit}>
            <div className="form-group" style={{ textAlign: 'left' }}>
              <label className="form-label" htmlFor="email">Email Address</label>
              <input 
                className="form-input" 
                type="email" 
                id="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required 
              />
            </div>

            <div className="form-group" style={{ textAlign: 'left' }}>
              <label className="form-label" htmlFor="password">Password</label>
              <input 
                className="form-input" 
                type="password" 
                id="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required 
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="glow-btn" 
              style={{
                width: '100%',
                padding: '14px',
                marginTop: '10px',
                fontSize: '1rem',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
            </button>
          </form>

          <p style={{
            marginTop: '24px',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)'
          }}>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button 
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMsg('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary)',
                cursor: 'pointer',
                fontWeight: 600,
                textDecoration: 'underline'
              }}
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>

        </div>
      </div>
    </>
  );
}
