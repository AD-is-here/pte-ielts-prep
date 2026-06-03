'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then((res: any) => {
      const session = res.data?.session;
      setUser(session?.user ?? null);
    });

    // Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: any) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }

    // Fetch profile
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .then((res: any) => {
        const { data, error } = res;
        if (data && data.length > 0) {
          setProfile(data[0]);
        } else {
          // Fallback if profile not found yet
          setProfile({
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
            avatar_url: user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.id}`,
            preferred_exam: 'PTE',
            target_score: 79
          });
        }
      });
  }, [user]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <nav className="glass-panel" style={{
      margin: '16px',
      padding: '12px 24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'sticky',
      top: '16px',
      zIndex: 100
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="glow-text" style={{
            fontSize: '1.5rem',
            fontWeight: 800,
            background: 'var(--primary-gradient)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            AuraPrep
          </span>
          <span style={{
            fontSize: '0.75rem',
            padding: '2px 8px',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-secondary)'
          }}>
            PTE & IELTS AI
          </span>
        </Link>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        {user ? (
          <>
            <Link href="/dashboard" style={{ color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.9rem' }} className="nav-link">
              Dashboard
            </Link>
            <Link href="/dashboard/history" style={{ color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.9rem' }} className="nav-link">
              History
            </Link>
            <Link href="/dashboard/vocabulary" style={{ color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.9rem' }} className="nav-link">
              Vocabulary
            </Link>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderLeft: '1px solid var(--border-color)', paddingLeft: '24px' }}>
              <img 
                src={profile?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.id}`} 
                alt="Avatar" 
                style={{ width: '36px', height: '36px', borderRadius: '50%', border: '2px solid var(--primary)' }}
              />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{profile?.full_name}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Target: {profile?.preferred_exam} {profile?.target_score}</span>
              </div>
              <button 
                onClick={handleSignOut} 
                className="secondary-btn" 
                style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)' }}
              >
                Logout
              </button>
            </div>
          </>
        ) : (
          <Link href="/login" className="glow-btn" style={{ padding: '8px 16px', fontSize: '0.9rem', borderRadius: 'var(--radius-sm)' }}>
            Get Started
          </Link>
        )}
      </div>

      <style jsx>{`
        .nav-link {
          transition: color 0.2s ease;
        }
        .nav-link:hover {
          color: var(--text-primary) !important;
        }
      `}</style>
    </nav>
  );
}
