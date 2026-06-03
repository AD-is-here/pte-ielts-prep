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

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });
      if (error) throw error;

      // In mock mode, the helper directly triggers state change, so we redirect manually
      if (isMockMode) {
        window.location.href = '/dashboard';
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Google login failed.');
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
              💡 <strong>Demo Mock Mode Active:</strong> You can enter any email/password to sign in/up instantly, or click the Google button. No real database required.
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

          {/* Google Button */}
          <button 
            type="button" 
            onClick={handleGoogleLogin} 
            disabled={loading}
            className="secondary-btn" 
            style={{
              width: '100%',
              marginBottom: '24px',
              padding: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '1rem',
              fontWeight: 600,
              background: 'rgba(255, 255, 255, 0.03)',
              cursor: 'pointer'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            margin: '20px 0',
            color: 'var(--text-muted)',
            fontSize: '0.8rem'
          }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
            <span style={{ padding: '0 10px' }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
          </div>

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
