'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);

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
    <>
      <nav className="glass-panel navbar-container">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="glow-text logo-text">AuraPrep</span>
            <span className="badge-text">PTE & IELTS AI</span>
          </Link>
        </div>

        {/* Desktop Menu */}
        <div className="desktop-menu">
          {user ? (
            <>
              <Link href="/dashboard" className="nav-link">
                Dashboard
              </Link>
              <Link href="/dashboard/history" className="nav-link">
                History
              </Link>
              <Link href="/dashboard/vocabulary" className="nav-link">
                Vocabulary
              </Link>
              
              <div className="profile-divider">
                <img 
                  src={profile?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.id}`} 
                  alt="Avatar" 
                  className="avatar-img"
                />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span className="profile-name">{profile?.full_name}</span>
                  <span className="profile-target">Target: {profile?.preferred_exam} {profile?.target_score}</span>
                </div>
                <button 
                  onClick={handleSignOut} 
                  className="secondary-btn logout-btn"
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <Link href="/login" className="glow-btn login-btn">
              Get Started
            </Link>
          )}
        </div>

        {/* Hamburger Icon Button for mobile menu toggling */}
        {user && (
          <button className="hamburger-btn" onClick={() => setMenuOpen(!menuOpen)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              {menuOpen ? (
                <path d="M18 6L6 18M6 6l12 12" />
              ) : (
                <path d="M3 12h18M3 6h18M3 18h18" />
              )}
            </svg>
          </button>
        )}

        {!user && (
          <Link href="/login" className="glow-btn mobile-login-btn">
            Get Started
          </Link>
        )}
      </nav>

      {/* Mobile Menu Dropdown Panel */}
      {user && menuOpen && (
        <div className="mobile-menu glass-panel anim-fade">
          <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="mobile-nav-link">
            Dashboard
          </Link>
          <Link href="/dashboard/history" onClick={() => setMenuOpen(false)} className="mobile-nav-link">
            History
          </Link>
          <Link href="/dashboard/vocabulary" onClick={() => setMenuOpen(false)} className="mobile-nav-link">
            Vocabulary
          </Link>
          
          <div className="mobile-profile-section">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img 
                src={profile?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.id}`} 
                alt="Avatar" 
                className="avatar-img"
              />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span className="profile-name">{profile?.full_name}</span>
                <span className="profile-target">Target: {profile?.preferred_exam} {profile?.target_score}</span>
              </div>
            </div>
            <button 
              onClick={() => {
                setMenuOpen(false);
                handleSignOut();
              }} 
              className="secondary-btn mobile-logout-btn"
            >
              Logout
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .navbar-container {
          margin: 16px;
          padding: 12px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: sticky;
          top: 16px;
          z-index: 100;
        }

        .logo-text {
          font-size: 1.5rem;
          font-weight: 800;
          background: var(--primary-gradient);
          WebkitBackgroundClip: text;
          WebkitTextFillColor: transparent;
        }

        .badge-text {
          font-size: 0.75rem;
          padding: 2px 8px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
        }

        .desktop-menu {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .nav-link {
          color: var(--text-secondary);
          font-weight: 500;
          font-size: 0.9rem;
          transition: color 0.2s ease;
          text-decoration: none;
        }

        .nav-link:hover {
          color: var(--text-primary) !important;
        }

        .profile-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          border-left: 1px solid var(--border-color);
          padding-left: 24px;
        }

        .avatar-img {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 2px solid var(--primary);
        }

        .profile-name {
          font-size: 0.85rem;
          font-weight: 600;
        }

        .profile-target {
          font-size: 0.7rem;
          color: var(--text-muted);
        }

        .logout-btn {
          padding: 6px 12px;
          font-size: 0.8rem;
          border-radius: var(--radius-sm);
        }

        .login-btn {
          padding: 8px 16px;
          font-size: 0.9rem;
          border-radius: var(--radius-sm);
          text-decoration: none;
        }

        .hamburger-btn {
          display: none;
          background: none;
          border: none;
          color: var(--text-primary);
          cursor: pointer;
          padding: 4px;
        }

        .mobile-login-btn {
          display: none;
        }

        /* Mobile Menu Styles */
        .mobile-menu {
          margin: -8px 16px 16px 16px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          z-index: 99;
          position: relative;
        }

        .mobile-nav-link {
          color: var(--text-secondary);
          font-weight: 600;
          font-size: 1rem;
          text-decoration: none;
          padding: 8px 4px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
          transition: color 0.2s ease;
        }

        .mobile-nav-link:hover {
          color: var(--text-primary) !important;
        }

        .mobile-profile-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-top: 8px;
          padding-top: 16px;
          border-top: 1px solid var(--border-color);
        }

        .mobile-logout-btn {
          width: 100%;
          padding: 10px;
          font-size: 0.9rem;
          border-radius: var(--radius-sm);
        }

        @media (max-width: 768px) {
          .desktop-menu {
            display: none;
          }

          .hamburger-btn {
            display: block;
          }

          .mobile-login-btn {
            display: inline-flex;
            padding: 8px 16px;
            font-size: 0.85rem;
            border-radius: var(--radius-sm);
            text-decoration: none;
          }
        }
      `}</style>
    </>
  );
}
