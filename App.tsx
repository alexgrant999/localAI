import React, { useState, useEffect } from 'react';
import { ViewState, User } from './types';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import AuthPage from './components/AuthPage';
import { supabase } from './supabaseClient';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initialAuthError, setInitialAuthError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const initializeApp = async () => {
      // 1. Check for errors in URL (e.g. from expired email links)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const errorDescription = hashParams.get('error_description');
      const errorCode = hashParams.get('error_code');
      
      if (errorDescription || errorCode) {
        if (mounted) {
          setInitialAuthError(decodeURIComponent(errorDescription || 'An unknown error occurred.'));
          setCurrentView('login');
          setIsInitialized(true);
          // Clean up the URL
          window.history.replaceState(null, '', window.location.pathname);
        }
        return;
      }

      // 2. Check active session from storage
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (mounted) {
          if (session?.user) {
            mapSessionToUser(session.user);
            setCurrentView('dashboard');
          }
          setIsInitialized(true);
        }
      } catch (e) {
        console.error("Session check failed", e);
        if (mounted) setIsInitialized(true);
      }
    };

    initializeApp();

    // 3. Listen for auth changes (sign in, sign out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          mapSessionToUser(session.user);
          // Only switch to dashboard if we aren't already there.
          // This prevents overwriting specific view states if we were to add sub-routes later.
          setCurrentView((prev) => prev === 'dashboard' ? 'dashboard' : 'dashboard');
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setCurrentView('landing');
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const mapSessionToUser = (authUser: any) => {
    // Map Supabase user metadata to our App's User type
    const metadata = authUser.user_metadata || {};
    
    setUser({
      id: authUser.id,
      email: authUser.email || '',
      name: metadata.name || 'User',
      companyName: metadata.companyName || 'My Business',
      plan: metadata.plan || 'starter'
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // State update handled by onAuthStateChange
  };

  const navigateTo = (view: ViewState) => {
    setCurrentView(view);
    setInitialAuthError(null); // Clear errors when navigating
    window.scrollTo(0, 0);
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-indigo-600 flex-col gap-3">
         <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
         <p className="text-sm font-medium">Loading...</p>
      </div>
    );
  }

  // Routing Logic
  if (user && currentView === 'dashboard') {
    return <Dashboard user={user} onLogout={handleLogout} />;
  }

  if (currentView === 'login' || currentView === 'register') {
    return (
      <AuthPage 
        view={currentView} 
        onNavigate={navigateTo} 
        initialError={initialAuthError}
      />
    );
  }

  return <LandingPage onNavigate={navigateTo} />;
}